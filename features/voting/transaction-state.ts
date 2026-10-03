import type { TransactionStatus } from "@/types/domain";

export type VoteUiState = "READY" | "WAITING_FOR_WALLET" | "SUBMITTED" | "CONFIRMING" | "CONFIRMED" | "FAILED";
export function toStoredTransactionStatus(state: VoteUiState): TransactionStatus {
  if (state === "CONFIRMED") return "CONFIRMED";
  if (state === "FAILED") return "FAILED";
  return "PENDING";
}
export function transactionProgress(state: VoteUiState) {
  return ["READY", "WAITING_FOR_WALLET", "SUBMITTED", "CONFIRMING", "CONFIRMED"].indexOf(state);
}
