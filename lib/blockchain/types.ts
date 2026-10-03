export interface OnChainElection { organizer: string; startTime: number; endTime: number; closed: boolean; candidateCount: number; exists: boolean }
export interface OnChainCandidate { id: number; metadata: string; voteCount: bigint }
export interface TransactionResult { hash: string; chainId: number; wait: () => Promise<void> }
export interface VoteRequest { electionId: bigint; candidateId: bigint; expectedChainId: number; contractAddress: string }
export type TransactionStateCallback = (state: "WAITING_FOR_WALLET" | "SUBMITTED" | "CONFIRMING" | "CONFIRMED" | "FAILED", hash?: string) => void;
export interface VoteSubmissionStrategy { submitVote(request: VoteRequest, onState: TransactionStateCallback): Promise<TransactionResult> }
