import { NextResponse } from "next/server";
import { Interface, JsonRpcProvider, getAddress } from "ethers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { votingSystemAbi } from "@/lib/blockchain/abi";
import { canManageElection } from "@/features/elections/rules";

const schema = z.object({
  electionId: z.uuid(),
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  type: z.enum(["CREATE_ELECTION", "ADD_CANDIDATE", "APPROVE_VOTER", "CAST_VOTE", "CLOSE_ELECTION"]),
  candidateId: z.uuid().optional(),
  registrationId: z.uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid transaction synchronization request" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (parsed.data.type === "ADD_CANDIDATE" && !parsed.data.candidateId) return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  if (parsed.data.type === "APPROVE_VOTER" && !parsed.data.registrationId) return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
  const [{ data: profile }, { data: election }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("elections").select("*").eq("id", parsed.data.electionId).single(),
  ]);
  if (!profile || !election) return NextResponse.json({ error: "Election or profile not found" }, { status: 404 });

  const expectedChainId = election.chain_id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const contractAddress = election.contract_address ?? process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!expectedChainId || !contractAddress || !rpcUrl) return NextResponse.json({ error: "Blockchain is not configured" }, { status: 503 });
  const managerOperation = parsed.data.type !== "CAST_VOTE";
  if (managerOperation && !canManageElection(profile.role, profile.id, election.created_by)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const provider = new JsonRpcProvider(rpcUrl, expectedChainId);
  const [receipt, transaction, network] = await Promise.all([provider.getTransactionReceipt(parsed.data.transactionHash), provider.getTransaction(parsed.data.transactionHash), provider.getNetwork()]);
  if (!receipt || !transaction || receipt.status !== 1 || Number(network.chainId) !== expectedChainId) return NextResponse.json({ error: "A successful receipt was not found on the configured chain" }, { status: 422 });
  if (!receipt.to || getAddress(receipt.to) !== getAddress(contractAddress)) return NextResponse.json({ error: "Transaction targets an unexpected contract" }, { status: 422 });
  const iface = new Interface(votingSystemAbi);
  const decoded = iface.parseTransaction({ data: transaction.data, value: transaction.value });
  const expectedFunction: Record<typeof parsed.data.type, string> = { CREATE_ELECTION: "createElection", ADD_CANDIDATE: "addCandidate", APPROVE_VOTER: "approveVoter", CAST_VOTE: "castVote", CLOSE_ELECTION: "closeElection" };
  if (!decoded || decoded.name !== expectedFunction[parsed.data.type]) return NextResponse.json({ error: "Transaction operation does not match" }, { status: 422 });
  if (profile.wallet_address && getAddress(transaction.from) !== getAddress(profile.wallet_address)) return NextResponse.json({ error: "Transaction signer does not match the profile wallet" }, { status: 422 });

  const admin = createAdminClient();
  if (!profile.wallet_address) {
    const { error: walletError } = await admin.from("profiles").update({ wallet_address: getAddress(transaction.from) }).eq("id", profile.id);
    if (walletError) return NextResponse.json({ error: "Could not bind the transaction signer to this profile" }, { status: 409 });
  }
  let contractElectionId = election.contract_election_id;
  if (parsed.data.type === "CREATE_ELECTION") {
    if (election.contract_election_id !== null) return NextResponse.json({ error: "Election is already provisioned" }, { status: 409 });
    const expectedStart = BigInt(Math.floor(new Date(election.start_time).valueOf() / 1000));
    const expectedEnd = BigInt(Math.floor(new Date(election.end_time).valueOf() / 1000));
    if (decoded.args[0] !== expectedStart || decoded.args[1] !== expectedEnd) return NextResponse.json({ error: "On-chain schedule does not match election metadata" }, { status: 422 });
    const created = receipt.logs.map((log) => { try { return iface.parseLog(log); } catch { return null; } }).find((log) => log?.name === "ElectionCreated");
    if (!created) return NextResponse.json({ error: "ElectionCreated event not found" }, { status: 422 });
    contractElectionId = Number(created.args.electionId);
    await admin.from("elections").update({ contract_election_id: contractElectionId, contract_address: getAddress(contractAddress), chain_id: expectedChainId, status: "REGISTRATION" }).eq("id", election.id);
  } else {
    if (contractElectionId === null || BigInt(contractElectionId) !== decoded.args[0]) return NextResponse.json({ error: "On-chain election does not match" }, { status: 422 });
  }
  if (parsed.data.type === "ADD_CANDIDATE" && parsed.data.candidateId) {
    const { data: candidate } = await admin.from("candidates").select("id,name,description,contract_candidate_id").eq("id", parsed.data.candidateId).eq("election_id", election.id).single();
    if (!candidate || candidate.contract_candidate_id !== null) return NextResponse.json({ error: "Candidate is missing or already synchronized" }, { status: 409 });
    let candidateMetadata: { id?: string; name?: string; description?: string };
    try { candidateMetadata = JSON.parse(String(decoded.args[1])) as { id?: string; name?: string; description?: string }; }
    catch { return NextResponse.json({ error: "Candidate metadata is not valid JSON" }, { status: 422 }); }
    if (candidateMetadata.id !== candidate.id || candidateMetadata.name !== candidate.name || candidateMetadata.description !== candidate.description) return NextResponse.json({ error: "On-chain candidate metadata does not match" }, { status: 422 });
    const added = receipt.logs.map((log) => { try { return iface.parseLog(log); } catch { return null; } }).find((log) => log?.name === "CandidateAdded");
    if (!added) return NextResponse.json({ error: "CandidateAdded event not found" }, { status: 422 });
    await admin.from("candidates").update({ contract_candidate_id: Number(added.args.candidateId) }).eq("id", parsed.data.candidateId).eq("election_id", election.id);
  }
  if (parsed.data.type === "APPROVE_VOTER" && parsed.data.registrationId) {
    const { data: registration } = await admin.from("voter_registrations").select("user_id,status").eq("id", parsed.data.registrationId).eq("election_id", election.id).single();
    if (!registration || registration.status !== "PENDING") return NextResponse.json({ error: "Registration is not pending" }, { status: 422 });
    const { data: voterProfile } = await admin.from("profiles").select("wallet_address").eq("id", registration.user_id).single();
    if (!voterProfile?.wallet_address || getAddress(voterProfile.wallet_address) !== getAddress(String(decoded.args[1]))) return NextResponse.json({ error: "Approved wallet does not match the registration" }, { status: 422 });
    await admin.from("voter_registrations").update({ status: "APPROVED", reviewed_by: profile.id, reviewed_at: new Date().toISOString() }).eq("id", parsed.data.registrationId);
  }
  if (parsed.data.type === "CAST_VOTE") {
    const { data: registration } = await admin.from("voter_registrations").select("status").eq("election_id", election.id).eq("user_id", profile.id).single();
    if (registration?.status !== "APPROVED") return NextResponse.json({ error: "The application registration is not approved" }, { status: 403 });
  }
  if (parsed.data.type === "CLOSE_ELECTION") await admin.from("elections").update({ status: "CLOSED" }).eq("id", election.id);
  await admin.from("blockchain_transactions").upsert({ user_id: profile.id, election_id: election.id, type: parsed.data.type, transaction_hash: parsed.data.transactionHash, chain_id: expectedChainId, status: "CONFIRMED", confirmed_at: new Date().toISOString() }, { onConflict: "chain_id,transaction_hash" });
  return NextResponse.json({ ok: true, contractElectionId });
}
