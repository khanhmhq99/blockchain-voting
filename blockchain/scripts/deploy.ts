import { ethers, network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployment signer configured");
  const contract = await ethers.deployContract("VotingSystem", [deployer.address]);
  await contract.waitForDeployment();
  const providerNetwork = await ethers.provider.getNetwork();
  const metadata = { network: network.name, chainId: Number(providerNetwork.chainId), contractAddress: await contract.getAddress(), deployer: deployer.address, deployedAt: new Date().toISOString() };
  const directory = path.resolve("blockchain/deployments");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${network.name}.json`), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(metadata, null, 2));
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
