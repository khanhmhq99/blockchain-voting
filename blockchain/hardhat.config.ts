import "@nomicfoundation/hardhat-toolbox";
import { type HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];
const config: HardhatUserConfig = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
  paths: { sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts" },
  networks: {
    hardhat: {},
    localhost: { url: process.env.LOCALHOST_RPC_URL ?? "http://127.0.0.1:8545" },
    bscTestnet: { url: process.env.BSC_TESTNET_RPC_URL ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545", chainId: 97, accounts },
  },
};
export default config;
