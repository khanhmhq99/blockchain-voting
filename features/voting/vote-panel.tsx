"use client";
import { useState } from "react";
import { CheckCircle2, ExternalLink, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DirectWalletVoteStrategy } from "@/lib/blockchain/write";
import { readableBlockchainError } from "@/lib/blockchain/errors";
import type { VoteUiState } from "./transaction-state";
import { syncTransaction } from "@/features/blockchain/sync";

interface VoteCandidate { id: string; contractCandidateId: number; name: string; description: string }
export function VotePanel({ electionId, contractElectionId, contractAddress, chainId, candidates }: { electionId: string; contractElectionId: number; contractAddress: string; chainId: number; candidates: VoteCandidate[] }) {
  const [selected, setSelected] = useState<number>(); const [state, setState] = useState<VoteUiState>("READY"); const [hash, setHash] = useState<string>(); const [error, setError] = useState<string>();
  const explorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;
  async function vote() {
    if (!selected) { setError("Select a candidate."); return; }
    setError(undefined);
    try {
      const transaction = await new DirectWalletVoteStrategy().submitVote({ electionId: BigInt(contractElectionId), candidateId: BigInt(selected), contractAddress, expectedChainId: chainId }, (next, transactionHash) => { setState(next); if (transactionHash) setHash(transactionHash); });
      await syncTransaction({ electionId, transactionHash: transaction.hash, type: "CAST_VOTE" });
    } catch (cause) { setError(readableBlockchainError(cause)); setState("FAILED"); }
  }
  if (state === "CONFIRMED") return <Alert className="border-emerald-200 bg-emerald-50"><CheckCircle2 className="mb-2 size-6 text-emerald-700" /><AlertTitle>Vote confirmed on-chain</AlertTitle><AlertDescription>Your selection was not stored in Supabase. The transaction hash is your receipt.</AlertDescription>{hash && <a className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-blue-700 hover:underline" href={explorer ? `${explorer}/tx/${hash}` : `#${hash}`} target="_blank" rel="noreferrer">{hash}<ExternalLink className="size-3" /></a>}</Alert>;
  const busy = !["READY", "FAILED"].includes(state);
  return <div className="space-y-4">{candidates.map((candidate) => <label key={candidate.id} className={`block cursor-pointer rounded-lg border bg-white p-4 ${selected === candidate.contractCandidateId ? "border-blue-600 ring-2 ring-blue-100" : ""}`}><span className="flex gap-3"><input type="radio" name="candidate" checked={selected === candidate.contractCandidateId} onChange={() => setSelected(candidate.contractCandidateId)} /><span><strong>{candidate.name}</strong><span className="mt-1 block text-sm text-slate-600">{candidate.description}</span></span></span></label>)}{error && <Alert className="border-red-200 bg-red-50 text-red-800">{error}</Alert>}<Button onClick={vote} disabled={busy || !selected}>{busy && <LoaderCircle className="size-4 animate-spin" />}{state === "READY" || state === "FAILED" ? "Cast vote" : state.replaceAll("_", " ")}</Button>{hash && <p className="break-all font-mono text-xs text-slate-600">Transaction: {hash}</p>}</div>;
}
