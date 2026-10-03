import { getReadProvider } from "./client";
import { getVotingContract } from "./contracts";
import type { OnChainCandidate, OnChainElection } from "./types";

export async function getElection(contractAddress: string, electionId: bigint): Promise<OnChainElection> {
  const row = await getVotingContract(contractAddress, getReadProvider()).getElection(electionId);
  return { organizer: row.organizer, startTime: Number(row.startTime), endTime: Number(row.endTime), closed: row.closed, candidateCount: Number(row.candidateCount), exists: row.exists };
}
export async function getCandidates(contractAddress: string, electionId: bigint): Promise<OnChainCandidate[]> {
  const rows = await getVotingContract(contractAddress, getReadProvider()).getCandidates(electionId);
  return rows.map((row: { metadata: string; voteCount: bigint }, index: number) => ({ id: index + 1, metadata: row.metadata, voteCount: row.voteCount }));
}
export async function getResults(contractAddress: string, electionId: bigint) {
  return (await getVotingContract(contractAddress, getReadProvider()).getResults(electionId)) as bigint[];
}
export async function isApprovedVoter(contractAddress: string, electionId: bigint, voter: string) { return Boolean(await getVotingContract(contractAddress, getReadProvider()).isApprovedVoter(electionId, voter)); }
export async function hasVoted(contractAddress: string, electionId: bigint, voter: string) { return Boolean(await getVotingContract(contractAddress, getReadProvider()).hasVoted(electionId, voter)); }
