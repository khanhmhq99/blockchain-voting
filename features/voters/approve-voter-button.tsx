"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveVoter } from "@/lib/blockchain/write";
import { readableBlockchainError } from "@/lib/blockchain/errors";
import { syncTransaction } from "@/features/blockchain/sync";

export function ApproveVoterButton({ electionId, contractElectionId, contractAddress, chainId, registrationId, walletAddress }: { electionId: string; contractElectionId: number; contractAddress: string; chainId: number; registrationId: string; walletAddress: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string>(); const router = useRouter();
  async function approve() {
    setBusy(true); setError(undefined);
    try {
      const transaction = await approveVoter(contractAddress, chainId, BigInt(contractElectionId), walletAddress);
      await transaction.wait();
      await syncTransaction({ electionId, transactionHash: transaction.hash, type: "APPROVE_VOTER", registrationId });
      router.refresh();
    } catch (cause) { setError(readableBlockchainError(cause)); }
    finally { setBusy(false); }
  }
  return <div><Button size="sm" onClick={approve} disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}Approve on-chain</Button>{error && <p className="mt-1 max-w-64 text-xs text-red-700">{error}</p>}</div>;
}
