export async function syncTransaction(payload: { electionId: string; transactionHash: string; type: "CREATE_ELECTION" | "ADD_CANDIDATE" | "APPROVE_VOTER" | "CAST_VOTE" | "CLOSE_ELECTION"; candidateId?: string; registrationId?: string }) {
  const response = await fetch("/api/transactions/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json() as { ok?: boolean; error?: string; contractElectionId?: number };
  if (!response.ok) throw new Error(body.error ?? "Transaction synchronization failed");
  return body;
}
