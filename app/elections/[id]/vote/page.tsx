import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getElectionPageData } from "@/features/elections/queries";
import { deriveElectionStatus } from "@/features/elections/rules";
import { VotePanel } from "@/features/voting/vote-panel";
import { requireProfile } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";
export default async function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile(); const { id } = await params; const { election, candidates, supabase } = await getElectionPageData(id);
  const { data: registration } = await supabase.from("voter_registrations").select("status").eq("election_id", id).eq("user_id", profile.id).maybeSingle();
  if (registration?.status !== "APPROVED") redirect(`/elections/${id}?error=An%20approved%20registration%20is%20required`);
  const status = deriveElectionStatus(election.start_time, election.end_time, election.status);
  if (status !== "ACTIVE") return <Alert>Voting is not active. The smart contract also enforces the configured time window.</Alert>;
  if (election.contract_election_id === null || !election.contract_address || !election.chain_id) return <Alert>Blockchain configuration is incomplete.</Alert>;
  const mapped = candidates.filter((candidate): candidate is typeof candidate & { contract_candidate_id: number } => candidate.contract_candidate_id !== null).map((candidate) => ({ id: candidate.id, contractCandidateId: candidate.contract_candidate_id, name: candidate.name, description: candidate.description }));
  return <div className="mx-auto max-w-2xl"><Card><CardHeader><CardTitle>Cast your vote</CardTitle><CardDescription>{election.title}. Your wallet will ask you to confirm a public blockchain transaction.</CardDescription></CardHeader><CardContent><VotePanel electionId={id} contractElectionId={election.contract_election_id} contractAddress={election.contract_address} chainId={election.chain_id} candidates={mapped} /></CardContent></Card></div>;
}
