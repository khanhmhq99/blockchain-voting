import { Contract, type ContractRunner } from "ethers";
import { votingSystemAbi } from "./abi";

export function getVotingContract(address: string, runner: ContractRunner) {
  return new Contract(address, votingSystemAbi, runner);
}
