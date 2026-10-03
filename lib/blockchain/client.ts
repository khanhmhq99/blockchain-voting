import { BrowserProvider, JsonRpcProvider } from "ethers";
import { BlockchainError } from "./errors";

declare global { interface Window { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> } } }

export function getReadProvider() {
  const url = process.env.NEXT_PUBLIC_RPC_URL;
  if (!url) throw new BlockchainError("NEXT_PUBLIC_RPC_URL is not configured");
  return new JsonRpcProvider(url);
}

export function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) throw new BlockchainError("Install or enable an EVM browser wallet.");
  return new BrowserProvider(window.ethereum);
}

export async function ensureNetwork(provider: BrowserProvider, expectedChainId: number) {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== expectedChainId) throw new BlockchainError(`Switch your wallet to chain ${expectedChainId}.`);
}
