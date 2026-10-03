"use client";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { getResults } from "@/lib/blockchain/read";

export function ResultsPanel({ contractAddress, contractElectionId, candidates }: { contractAddress: string; contractElectionId: number; candidates: { id: string; contractCandidateId: number; name: string }[] }) {
  const [results, setResults] = useState<bigint[]>(); const [error, setError] = useState<string>();
  useEffect(() => { let active = true; getResults(contractAddress, BigInt(contractElectionId)).then((values) => { if (active) setResults(values); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load results"); }); return () => { active = false; }; }, [contractAddress, contractElectionId]);
  if (error) return <Alert className="border-red-200 bg-red-50 text-red-800">{error}</Alert>;
  if (!results) return <div className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 animate-spin" />Reading authoritative results from the blockchain…</div>;
  const total = results.reduce((sum, count) => sum + count, 0n);
  return <div className="space-y-4"><p className="text-sm text-slate-600">Total votes: <strong className="text-slate-950">{total.toString()}</strong></p>{candidates.map((candidate) => { const count = results[candidate.contractCandidateId - 1] ?? 0n; const percentage = total ? Number((count * 10000n) / total) / 100 : 0; return <div key={candidate.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{candidate.name}</span><span>{count.toString()} ({percentage.toFixed(1)}%)</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-700" style={{ width: `${percentage}%` }} /></div></div>; })}</div>;
}
