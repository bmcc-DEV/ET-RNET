import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Hardhat — Deploy ETRNETAnchor.sol
 *
 * Redes disponíveis:
 *   npx hardhat run scripts/deploy-anchor.ts --network sepolia
 *   npx hardhat run scripts/deploy-anchor.ts --network localhost   (anvil/hardhat node)
 *   npx hardhat test test/ETRNETAnchor.test.ts
 *
 * Variáveis de ambiente (.env):
 *   PRIVATE_KEY       — Chave privada do deployer (hex sem 0x)
 *   SEPOLIA_RPC_URL   — RPC Sepolia (Alchemy/Infura)
 *   MAINNET_RPC_URL   — RPC mainnet (produção)
 *   DAO_MULTISIG      — Endereço do multisig DAO (safe.global ou gnosis safe)
 *   ETHERSCAN_API_KEY — Para verificação automática
 */

const PRIVATE_KEY     = process.env.PRIVATE_KEY     || "0".repeat(64);
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL  || "https://rpc.sepolia.org";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL  || "https://eth.llamarpc.com";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
