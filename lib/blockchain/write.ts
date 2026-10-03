import { type ContractTransactionResponse } from "ethers";
import { getBrowserProvider, ensureNetwork } from "./client";
import { getVotingContract } from "./contracts";
import type { TransactionResult, TransactionStateCallback, VoteRequest, VoteSubmissionStrategy } from "./types";

async function browserContract(contractAddress: string, chainId: number) {
  const provider = getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  await ensureNetwork(provider, chainId);
  return getVotingContract(contractAddress, await provider.getSigner());
}
function result(transaction: ContractTransactionResponse, chainId: number): TransactionResult {
  return { hash: transaction.hash, chainId, wait: async () => { await transaction.wait(); } };
}

export class DirectWalletVoteStrategy implements VoteSubmissionStrategy {
  async submitVote(request: VoteRequest, onState: TransactionStateCallback): Promise<TransactionResult> {
    try {
      onState("WAITING_FOR_WALLET");
      const contract = await browserContract(request.contractAddress, request.expectedChainId);
      const transaction = await contract.castVote(request.electionId, request.candidateId) as ContractTransactionResponse;
      onState("SUBMITTED", transaction.hash); onState("CONFIRMING", transaction.hash);
      const output = result(transaction, request.expectedChainId);
      await output.wait(); onState("CONFIRMED", transaction.hash);
      return output;
    } catch (error) { onState("FAILED"); throw error; }
  }
}

export async function createElection(contractAddress: string, chainId: number, startTime: number, endTime: number) { return result(await (await browserContract(contractAddress, chainId)).createElection(startTime, endTime), chainId); }
export async function addCandidate(contractAddress: string, chainId: number, electionId: bigint, metadata: string) { return result(await (await browserContract(contractAddress, chainId)).addCandidate(electionId, metadata), chainId); }
export async function approveVoter(contractAddress: string, chainId: number, electionId: bigint, voter: string) { return result(await (await browserContract(contractAddress, chainId)).approveVoter(electionId, voter), chainId); }
export async function closeElection(contractAddress: string, chainId: number, electionId: bigint) { return result(await (await browserContract(contractAddress, chainId)).closeElection(electionId), chainId); }
