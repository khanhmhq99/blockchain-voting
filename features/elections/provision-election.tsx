"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { addCandidate, createElection } from "@/lib/blockchain/write";
import { readableBlockchainError } from "@/lib/blockchain/errors";
import { syncTransaction } from "@/features/blockchain/sync";

interface CandidateInput { id: string; name: string; description: string; contractCandidateId: number | null }
export function ProvisionElection({ electionId, contractElectionId, startTime, endTime, candidates }: { electionId: string; contractElectionId: number | null; startTime: string; endTime: string; candidates: CandidateInput[] }) {
  const router = useRouter();
  const [status, setStatus] = useState("Ready to provision");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const contractAddress = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

  async function provision() {
    if (!contractAddress || !chainId) { setError("Configure the public contract address and chain ID first."); return; }
    setBusy(true); setError(undefined);
    try {
      let onChainId = contractElectionId;
      if (onChainId === null) {
        setStatus("Confirm election creation in your wallet…");
        const transaction = await createElection(contractAddress, chainId, Math.floor(new Date(startTime).valueOf() / 1000), Math.floor(new Date(endTime).valueOf() / 1000));
        setStatus(`Confirming ${transaction.hash.slice(0, 12)}…`); await transaction.wait();
        const synced = await syncTransaction({ electionId, transactionHash: transaction.hash, type: "CREATE_ELECTION" });
        onChainId = synced.contractElectionId ?? null;
      }
      if (onChainId === null) throw new Error("The contract election ID could not be determined");
      for (const [index, candidate] of candidates.entries()) {
        if (candidate.contractCandidateId !== null) continue;
        setStatus(`Adding candidate ${index + 1} of ${candidates.length}: ${candidate.name}`);
        const metadata = JSON.stringify({ id: candidate.id, name: candidate.name, description: candidate.description });
        const transaction = await addCandidate(contractAddress, chainId, BigInt(onChainId), metadata);
        await transaction.wait();
        await syncTransaction({ electionId, transactionHash: transaction.hash, type: "ADD_CANDIDATE", candidateId: candidate.id });
      }
      setStatus("On-chain provisioning complete"); router.refresh();
    } catch (cause) { setError(readableBlockchainError(cause)); setStatus("Provisioning interrupted"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3">{error && <Alert className="border-red-200 bg-red-50 text-red-800">{error}</Alert>}<div className="flex items-center gap-3"><Button onClick={provision} disabled={busy || candidates.length < 2}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : contractElectionId !== null && candidates.every((candidate) => candidate.contractCandidateId !== null) ? <CheckCircle2 className="size-4" /> : null}{contractElectionId === null ? "Provision on blockchain" : "Synchronize candidates"}</Button><span className="text-sm text-slate-600">{status}</span></div>{candidates.length < 2 && <p className="text-sm text-amber-700">Add at least two candidates before provisioning.</p>}</div>;
}
