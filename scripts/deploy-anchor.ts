/**
 * Deploy — ETRNETAnchor.sol
 *
 * Uso:
 *   npx hardhat run scripts/deploy-anchor.ts --network sepolia
 *   npx hardhat run scripts/deploy-anchor.ts --network localhost
 *
 * Env:
 *   DAO_MULTISIG — endereço do multisig DAO (obrigatório em produção)
 */

import { ethers, network, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`\n[ETRNETAnchor] Deploy iniciado`);
  console.log(`  Network:  ${network.name}`);
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);

  // Endereço do multisig DAO
  const daoMultisig =
    process.env.DAO_MULTISIG ||
    (network.name === "localhost" ? deployer.address : null);

  if (!daoMultisig) {
    throw new Error(
      "DAO_MULTISIG não definido. " +
      "Em produção, defina o endereço do Safe (multisig) no .env"
    );
  }

  console.log(`  DAO:      ${daoMultisig}`);

  // Deploy
  const Anchor = await ethers.getContractFactory("ETRNETAnchor");
  const anchor = await Anchor.deploy(daoMultisig);
  await anchor.waitForDeployment();

  const address = await anchor.getAddress();
  console.log(`\n✅ ETRNETAnchor deployado em: ${address}`);

  // Verificação automática em redes públicas
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\n[Etherscan] Aguardando confirmações para verificar...");
    await new Promise(resolve => setTimeout(resolve, 30_000));

    try {
      await run("verify:verify", {
        address,
        constructorArguments: [daoMultisig],
        contract: "contracts/ETRNETAnchor.sol:ETRNETAnchor",
      });
      console.log("✅ Contrato verificado no Etherscan");
    } catch (err: any) {
      if (err.message?.includes("Already Verified")) {
        console.log("ℹ Contrato já verificado");
      } else {
        console.warn("⚠ Verificação falhou:", err.message);
      }
    }
  }

  // Registra endereço no vault (arquivo local)
  const deployInfo = {
    network:      network.name,
    address,
    daoMultisig,
    deployedAt:   new Date().toISOString(),
    deployer:     deployer.address,
    txHash:       anchor.deploymentTransaction()?.hash,
  };

  console.log("\n[Deploy Info]\n" + JSON.stringify(deployInfo, null, 2));
  console.log(
    "\nAdicione ao .env:\n" +
    `ETRNET_ANCHOR_ADDRESS=${address}\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
