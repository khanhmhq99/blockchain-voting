export class BlockchainError extends Error {
  constructor(message: string, readonly cause?: unknown) { super(message); this.name = "BlockchainError"; }
}

export function readableBlockchainError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("user rejected") || error.message.includes("ACTION_REJECTED")) return "The wallet request was rejected.";
    if (error.message.includes("VoterNotApproved")) return "This wallet is not approved for the election.";
    if (error.message.includes("AlreadyVoted")) return "This wallet has already voted in this election.";
    if (error.message.includes("VotingNotActive")) return "Voting is not currently active.";
    return error.message;
  }
  return "The blockchain operation failed.";
}
