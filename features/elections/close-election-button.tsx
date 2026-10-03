"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { closeElection } from "@/lib/blockchain/write";
import { syncTransaction } from "@/features/blockchain/sync";
import { readableBlockchainError } from "@/lib/blockchain/errors";

export function CloseElectionButton({ electionId, contractElectionId, contractAddress, chainId }: { electionId: string; contractElectionId: number; contractAddress: string; chainId: number }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string>(); const router = useRouter();
  async function close() { setBusy(true); setError(undefined); try { const transaction = await closeElection(contractAddress, chainId, BigInt(contractElectionId)); await transaction.wait(); await syncTransaction({ electionId, transactionHash: transaction.hash, type: "CLOSE_ELECTION" }); router.refresh(); } catch (cause) { setError(readableBlockchainError(cause)); } finally { setBusy(false); } }
  return <div><Button variant="destructive" onClick={close} disabled={busy}>{busy ? "Confirming…" : "Close election on-chain"}</Button>{error && <p className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
