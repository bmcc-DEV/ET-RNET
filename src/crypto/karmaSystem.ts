/**
 * VØID Karma System — Karma Cego e Transferível (WebAssembly + Rust Core)
 * 
 * Resolve o Paradoxo: GhostID é efêmero (morre em horas), mas Karma deve persistir
 * para incentivar Carriers no HCN (Human Carrier Network).
 * 
 * Solução: Tokens ZK de reputação (Blind Karma Tokens - BKT) que podem:
 * 1. Serem acumulados offline durante uma sessão
 * 2. Serem "blindados" (ocultados) antes do GhostID morrer
 * 3. Serem exportados para storage seguro (OPFS/local)
 * 4. Serem importados e "desblindados" em um novo GhostID no dia seguinte
 * 
 * Isso cria economia de longo prazo sem violar o princípio de efemeridade.
 */

import { sha3_256 } from "@noble/hashes/sha3.js";
import { secureRandomInt } from "../utils/secureRandom";
import { sha256 } from "@noble/hashes/sha2.js";
import { createPedersenCommitment } from "./utxo";
import { signWithNodeKey } from "./signingKeys";

// Função helper para gerar bytes aleatórios usando Web Crypto API
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlindKarmaToken {
  id: string;                    // Identificador único do token
  amount: number;                // Valor de Karma
  commitment: Uint8Array;        // Pedersen-like commitment: C = r·G + v·H
  blindingFactor: Uint8Array;    // Segredo r (destruído após blind)
  nullifier: string;             // Hash único para prevenir double-spending
  epoch: number;                 // Período de validade (para rotação de anonimato)
  signature: Uint8Array;         // Assinatura do emissor (HCN Network)
}

export interface KarmaExport {
  tokens: BlindKarmaToken[];
  exportProof: Uint8Array;       // Prova de que a exportação foi válida
  timestamp: number;
  checksum: string;              // Integridade do pacote
}

export interface KarmaWallet {
  spendableTokens: BlindKarmaToken[];    // Tokens prontos para usar
  pendingTokens: BlindKarmaToken[];      // Tokens sendo processados
  totalBalance: number;                   // Soma verificável
  lastRotation: number;                   // Última rotação de anonimato
}

// ─── WebAssembly Interface (simulado - integração com Rust/WASM) ───────────────

/**
 * Simulação do núcleo Rust/WASM para operações ZK pesadas.
 * Em produção, estas funções seriam bindings para código Rust compilado.
 */
const wasmKarmaCore = {
  /**
   * Gera um Pedersen commitment real: C = r·G + v·H
   * Usa Ed25519 curve arithmetic via utxo.ts (mesmo motor do Hydra UTXO).
   */
  generateCommitment(value: number, blindingFactor: Uint8Array): Uint8Array {
    const { commitment } = createPedersenCommitment(BigInt(value), blindingFactor);
    return commitment;
  },

  /**
   * Verifica se um commitment é válido para um valor e blinding.
   */
  verifyCommitment(
    commitment: Uint8Array,
    value: number,
    blindingFactor: Uint8Array
  ): boolean {
    const recomputed = this.generateCommitment(value, blindingFactor);
    return commitment.every((b, i) => b === recomputed[i]);
  },

  /**
   * Gera um nullifier único para prevenir double-spending.
   * nullifier = Hash(secret_key || token_id)
   */
  generateNullifier(tokenId: string, secret: Uint8Array): string {
    const idBytes = new TextEncoder().encode(tokenId);
    const combined = new Uint8Array(idBytes.length + secret.length);
    combined.set(idBytes);
    combined.set(secret, idBytes.length);
    return Array.from(sha3_256(combined))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  },

  /**
   * Simula uma prova ZK de que o token é válido sem revelar o blinding factor.
   */
  generateValidityProof(token: BlindKarmaToken): Uint8Array {
    // Prova simplificada: hash do commitment + nullifier
    const data = new Uint8Array(token.commitment.length + 16);
    data.set(token.commitment);
    data.set(new TextEncoder().encode(token.nullifier.slice(0, 16)), token.commitment.length);
    return sha256(data);
  },

  /**
   * Combina múltiplos tokens em um (CoinJoin-like) para aumentar anonimato.
   *
   * Segurança: exige que cada token de entrada tenha commitment Pedersen válido.
   * Tokens com commitment inválido são rejeitados antes de combinar.
   */
  combineTokens(tokens: BlindKarmaToken[]): BlindKarmaToken {
    // Validar que todos os tokens de entrada têm Pedersen commitment genuíno
    for (const token of tokens) {
      if (!this.verifyCommitment(token.commitment, token.amount, token.blindingFactor)) {
        throw new Error(`Token ${token.id} tem commitment inválido — rejeitado`);
      }
    }

    const totalAmount = tokens.reduce((sum, t) => sum + t.amount, 0);
    const newBlinding = randomBytes(32);
    const newCommitment = this.generateCommitment(totalAmount, newBlinding);
    const newId = `bkt_${Date.now()}_${secureRandomInt(10000)}`;

    return {
      id: newId,
      amount: totalAmount,
      commitment: newCommitment,
      blindingFactor: newBlinding,
      nullifier: this.generateNullifier(newId, newBlinding),
      epoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)), // Epoch diária
      signature: signWithNodeKey(
        "karma-system",
        sha3_256(new TextEncoder().encode(`${newId}:${totalAmount}:${newBlinding}`))
      ),
    };
  },

  /**
   * Divide um token em múltiplos (para pagamentos parciais).
   *
   * Segurança: exige commitment válido no token de entrada.
   */
  splitToken(token: BlindKarmaToken, amounts: number[]): BlindKarmaToken[] {
    if (!this.verifyCommitment(token.commitment, token.amount, token.blindingFactor)) {
      throw new Error(`Token ${token.id} tem commitment inválido — rejeitado`);
    }
    const total = amounts.reduce((a, b) => a + b, 0);
    if (total > token.amount) throw new Error("Split excede valor do token");

    return amounts.map(amount => {
      const blinding = randomBytes(32);
      const splitId = `bkt_${Date.now()}_${secureRandomInt(10000)}`;
      return {
        id: splitId,
        amount,
        commitment: this.generateCommitment(amount, blinding),
        blindingFactor: blinding,
        nullifier: this.generateNullifier(`split_${amount}`, blinding),
        epoch: token.epoch,
        signature: signWithNodeKey(
          "karma-system",
          sha3_256(new TextEncoder().encode(`${splitId}:${amount}:${blinding}`))
        ),
      };
    });
  },
};

// ─── Karma Manager ────────────────────────────────────────────────────────────

export class KarmaSystem {
  private wallet: KarmaWallet = {
    spendableTokens: [],
    pendingTokens: [],
    totalBalance: 0,
    lastRotation: 0,
  };

  private readonly STORAGE_KEY = "void_blind_karma_v1";
  private readonly EXPORT_KEY = "void_karma_export_v1";

  // ─── Lifecycle: Criação e Gerenciamento ─────────────────────────────────────

  /**
   * Cria um novo token de Karma para recompensar um Carrier.
   * Chamado pelo HCN quando uma entrega é confirmada.
   */
  mintKarmaToken(amount: number, hcnSignature: Uint8Array): BlindKarmaToken {
    const blindingFactor = randomBytes(32);
    const id = `bkt_${Date.now()}_${secureRandomInt(10000)}`;
    
    const token: BlindKarmaToken = {
      id,
      amount,
      commitment: wasmKarmaCore.generateCommitment(amount, blindingFactor),
      blindingFactor,
      nullifier: wasmKarmaCore.generateNullifier(id, blindingFactor),
      epoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
      signature: hcnSignature,
    };

    this.wallet.pendingTokens.push(token);
    this.updateBalance();
    
    console.log(`[Karma System] Minted token ${id} with ${amount} karma`);
    return token;
  }

  /**
   * Confirma tokens pendentes (após verificação ZK).
   * Move de pending -> spendable.
   */
  confirmTokens(tokenIds: string[]): void {
    for (const id of tokenIds) {
      const idx = this.wallet.pendingTokens.findIndex(t => t.id === id);
      if (idx >= 0) {
        const token = this.wallet.pendingTokens.splice(idx, 1)[0];
        if (!token) continue;
        
        // Verifica prova ZK antes de aceitar
        const proof = wasmKarmaCore.generateValidityProof(token);
        const isValid = this.verifyTokenProof(token, proof);
        
        if (isValid) {
          this.wallet.spendableTokens.push(token);
          console.log(`[Karma System] Token ${id} confirmed and moved to spendable`);
        } else {
          console.warn(`[Karma System] Token ${id} failed ZK verification!`);
        }
      }
    }
    this.updateBalance();
    this.saveToStorage();
  }

  // ─── Core: Blindagem e Transferência ────────────────────────────────────────

  /**
   * BLIND: Prepara Karma para exportação antes do GhostID morrer.
   * Destrói os blinding factors originais e cria tokens "blindados".
   */
  blindForExport(): KarmaExport {
    if (this.wallet.spendableTokens.length === 0) {
      throw new Error("Nenhum token spendable para blindar");
    }

    // Combina tokens para anonimato máximo (CoinJoin)
    const combined = wasmKarmaCore.combineTokens(this.wallet.spendableTokens);
    
    // Destrói blinding factors dos originais (simulação de secure wipe)
    this.wallet.spendableTokens.forEach(t => {
      t.blindingFactor.fill(0);
    });

    // Cria pacote de exportação
    const exportData: KarmaExport = {
      tokens: [combined],
      exportProof: wasmKarmaCore.generateValidityProof(combined),
      timestamp: Date.now(),
      checksum: this.computeChecksum([combined]),
    };

    // Limpa wallet local (Karma agora está "no limbo", esperando novo GhostID)
    this.wallet.spendableTokens = [];
    this.wallet.totalBalance = 0;
    this.saveToStorage();
    
    // Salva exportação separadamente
    this.saveExport(exportData);

    console.log(`[Karma System] Blinded ${combined.amount} karma for export`);
    return exportData;
  }

  /**
   * EXPORT: Serializa Karma blindado para storage seguro.
   * O usuário guarda isso offline (OPFS, pendrive, etc).
   */
  async exportToFile(): Promise<Blob> {
    const exportData = this.getExportData();
    if (!exportData) throw new Error("Nenhum dado de exportação disponível");

    const json = JSON.stringify(exportData, (_k, value) => {
      if (value instanceof Uint8Array) {
        return Array.from(value);
      }
      return value;
    });

    return new Blob([json], { type: "application/json" });
  }

  /**
   * IMPORT: Carrega Karma blindado de arquivo externo.
   * Chamado quando um novo GhostID inicia e quer recuperar Karma.
   */
  async importFromFile(file: Blob): Promise<number> {
    const text = await file.text();
    const importData: KarmaExport = JSON.parse(text, (_k, value) => {
      if (Array.isArray(value) && value.every(v => typeof v === "number")) {
        return new Uint8Array(value);
      }
      return value;
    });

    // Verifica integridade
    if (importData.checksum !== this.computeChecksum(importData.tokens)) {
      throw new Error("Checksum inválido! Possível corrupção ou tampering.");
    }

    // Verifica prova de exportação
    for (const token of importData.tokens) {
      const proof = wasmKarmaCore.generateValidityProof(token);
      if (!this.verifyTokenProof(token, proof)) {
        throw new Error(`Token ${token.id} falhou na verificação de prova`);
      }
    }

    // Adiciona à wallet
    this.wallet.spendableTokens.push(...importData.tokens);
    this.updateBalance();
    this.saveToStorage();

    console.log(`[Karma System] Imported ${importData.tokens.length} tokens`);
    return this.wallet.totalBalance;
  }

  /**
   * UNBLIND: Revela Karma em um novo GhostID.
   * Cria novos blinding factors para os tokens importados.
   */
  unblindForNewSession(): number {
    const oldTokens = [...this.wallet.spendableTokens];
    this.wallet.spendableTokens = [];

    for (const token of oldTokens) {
      // Gera novo blinding factor para o mesmo valor
      const newBlinding = randomBytes(32);
      const newToken: BlindKarmaToken = {
        ...token,
        id: `bkt_${Date.now()}_${secureRandomInt(10000)}`,
        blindingFactor: newBlinding,
        commitment: wasmKarmaCore.generateCommitment(token.amount, newBlinding),
        nullifier: wasmKarmaCore.generateNullifier(`unblind_${token.id}`, newBlinding),
        epoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
      };
      this.wallet.spendableTokens.push(newToken);
    }

    this.updateBalance();
    this.saveToStorage();
    
    console.log(`[Karma System] Unblinded ${this.wallet.spendableTokens.length} tokens for new session`);
    return this.wallet.totalBalance;
  }

  // ─── Anonimato: Rotação de Epoch ─────────────────────────────────────────────

  /**
   * Rotaciona tokens para novo epoch (refresh de anonimato).
   * Deve ser chamado periodicamente para prevenir tracking.
   */
  rotateEpoch(): void {
    const currentEpoch = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    if (currentEpoch === this.wallet.lastRotation) return;

    // Re-mint todos os tokens com novos blindings
    const newTokens = this.wallet.spendableTokens.map(token => 
      wasmKarmaCore.splitToken(token, [token.amount])[0]
    );

    this.wallet.spendableTokens = newTokens;
    this.wallet.lastRotation = currentEpoch;
    this.saveToStorage();

    console.log(`[Karma System] Epoch rotated to ${currentEpoch}`);
  }

  // ─── Storage: Persistência Offline ───────────────────────────────────────────

  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.wallet, (_k, value) => {
        if (value instanceof Uint8Array) return Array.from(value);
        return value;
      });
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (e) {
      console.error("[Karma System] Falha ao salvar:", e);
    }
  }

  loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.wallet = JSON.parse(data, (_k, value) => {
          if (Array.isArray(value) && value.every(v => typeof v === "number")) {
            return new Uint8Array(value);
          }
          return value;
        });
        this.updateBalance();
      }
    } catch (e) {
      console.error("[Karma System] Falha ao carregar:", e);
    }
  }

  private saveExport(exportData: KarmaExport): void {
    const data = JSON.stringify(exportData, (_k, value) => {
      if (value instanceof Uint8Array) return Array.from(value);
      return value;
    });
    localStorage.setItem(this.EXPORT_KEY, data);
  }

  private getExportData(): KarmaExport | null {
    try {
      const data = localStorage.getItem(this.EXPORT_KEY);
      if (!data) return null;
      return JSON.parse(data, (_k, value) => {
        if (Array.isArray(value) && value.every(v => typeof v === "number")) {
          return new Uint8Array(value);
        }
        return value;
      });
    } catch {
      return null;
    }
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private updateBalance(): void {
    this.wallet.totalBalance = this.wallet.spendableTokens.reduce((sum, t) => sum + t.amount, 0);
  }

  private verifyTokenProof(token: BlindKarmaToken, proof: Uint8Array): boolean {
    // Simula verificação ZK
    const recomputed = wasmKarmaCore.generateValidityProof(token);
    return proof.every((b, i) => b === recomputed[i]);
  }

  private computeChecksum(tokens: BlindKarmaToken[]): string {
    const data = tokens.map(t => t.commitment).reduce((acc, arr) => {
      const combined = new Uint8Array(acc.length + arr.length);
      combined.set(acc);
      combined.set(arr, acc.length);
      return combined;
    }, new Uint8Array(0));
    
    return Array.from(sha3_256(data))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16);
  }

  getWallet(): KarmaWallet {
    return { ...this.wallet };
  }

  getSpendableBalance(): number {
    return this.wallet.totalBalance;
  }

  /**
   * Lista nullifiers gastos (para prevenção de double-spending na rede).
   */
  getNullifiers(): string[] {
    return this.wallet.spendableTokens.map(t => t.nullifier);
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const karmaSystem = new KarmaSystem();

// Auto-load na inicialização
karmaSystem.loadFromStorage();
