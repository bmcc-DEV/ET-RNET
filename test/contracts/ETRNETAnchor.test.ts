import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { ETRNETAnchor } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ETRNETAnchor", () => {
  let anchor: ETRNETAnchor;
  let dao: SignerWithAddress;
  let challenger: SignerWithAddress;
  let other: SignerWithAddress;

  const ROOT_1 = ethers.id("merkle_root_v1");
  const ROOT_2 = ethers.id("merkle_root_v2");

  beforeEach(async () => {
    [dao, challenger, other] = await ethers.getSigners();
    const Anchor = await ethers.getContractFactory("ETRNETAnchor");
    anchor = (await Anchor.deploy(dao.address)) as ETRNETAnchor;
    await anchor.waitForDeployment();
  });

  describe("deploy", () => {
    it("armazena daoMultisig corretamente", async () => {
      expect(await anchor.daoMultisig()).to.equal(dao.address);
    });

    it("começa com updateCount=0 e currentRoot=bytes32(0)", async () => {
      expect(await anchor.updateCount()).to.equal(0n);
      expect(await anchor.currentRoot()).to.equal(ethers.ZeroHash);
    });

    it("rejeita endereço zero como DAO", async () => {
      const Anchor = await ethers.getContractFactory("ETRNETAnchor");
      await expect(Anchor.deploy(ethers.ZeroAddress)).to.be.revertedWith("invalid DAO address");
    });
  });

  describe("proposeRoot()", () => {
    it("DAO pode propor uma nova raiz", async () => {
      await expect(anchor.connect(dao).proposeRoot(ROOT_1))
        .to.emit(anchor, "RootProposed")
        .withArgs(ROOT_1, await time.latest(), 1n);
    });

    it("não-DAO não pode propor", async () => {
      await expect(anchor.connect(other).proposeRoot(ROOT_1))
        .to.be.revertedWith("ETRNETAnchor: only DAO multisig");
    });

    it("pendingRoot fica armazenada após proposta", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      expect(await anchor.pendingRoot()).to.equal(ROOT_1);
    });
  });

  describe("finalizeRoot()", () => {
    it("finaliza após período de desafio", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await time.increase(3601); // CHALLENGE_PERIOD = 1 hora

      await expect(anchor.connect(dao).finalizeRoot())
        .to.emit(anchor, "RootFinalized")
        .withArgs(ROOT_1, await time.latest());

      expect(await anchor.currentRoot()).to.equal(ROOT_1);
      expect(await anchor.updateCount()).to.equal(1n);
    });

    it("não finaliza antes do período de desafio", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await expect(anchor.connect(dao).finalizeRoot())
        .to.be.revertedWith("challenge period not elapsed");
    });

    it("sem raiz pendente não finaliza", async () => {
      await expect(anchor.connect(dao).finalizeRoot())
        .to.be.revertedWith("no pending root");
    });

    it("múltiplos ciclos proposta→finalização incrementam updateCount", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await time.increase(3601);
      await anchor.connect(dao).finalizeRoot();

      await anchor.connect(dao).proposeRoot(ROOT_2);
      await time.increase(3601);
      await anchor.connect(dao).finalizeRoot();

      expect(await anchor.currentRoot()).to.equal(ROOT_2);
      expect(await anchor.updateCount()).to.equal(2n);
    });
  });

  describe("challengeRoot()", () => {
    it("qualquer um pode desafiar uma raiz pendente com o stake certo", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);

      const stake = ethers.parseEther("0.01");
      await expect(anchor.connect(challenger).challengeRoot({ value: stake }))
        .to.emit(anchor, "RootChallenged")
        .withArgs(ROOT_1, challenger.address);
    });

    it("desafio sem stake correto falha", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await expect(
        anchor.connect(challenger).challengeRoot({ value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("insufficient stake");
    });

    it("sem raiz pendente não há o que desafiar", async () => {
      await expect(
        anchor.connect(challenger).challengeRoot({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("no pending root");
    });

    it("desafio bem sucedido cancela a raiz pendente", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await anchor.connect(challenger).challengeRoot({ value: ethers.parseEther("0.01") });

      // Tenta finalizar após o período — deve falhar (pendingRoot foi zerado)
      await time.increase(3601);
      await expect(anchor.connect(dao).finalizeRoot())
        .to.be.revertedWith("no pending root");
    });
  });

  describe("isCurrentRoot()", () => {
    it("verifica raiz correta como válida", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await time.increase(3601);
      await anchor.connect(dao).finalizeRoot();

      expect(await anchor.isCurrentRoot(ROOT_1)).to.be.true;
    });

    it("raiz errada retorna falso", async () => {
      await anchor.connect(dao).proposeRoot(ROOT_1);
      await time.increase(3601);
      await anchor.connect(dao).finalizeRoot();

      expect(await anchor.isCurrentRoot(ROOT_2)).to.be.false;
    });

    it("currentRoot é zero antes de qualquer finalização", async () => {
      expect(await anchor.isCurrentRoot(ethers.ZeroHash)).to.be.false;
    });
  });
});
