import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS;
  const organizerAddress = process.env.ORGANIZER_ADDRESS;
  if (!contractAddress || !organizerAddress) throw new Error("Set NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS and ORGANIZER_ADDRESS");
  const voting = await ethers.getContractAt("VotingSystem", contractAddress);
  const role = await voting.ORGANIZER_ROLE();
  const transaction = await voting.grantRole(role, organizerAddress);
  await transaction.wait();
  console.log(`Granted ORGANIZER_ROLE to ${organizerAddress} in ${transaction.hash}`);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
