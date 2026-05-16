/**
 * ETΞRNET — Protocolo de Transação via NOSTR
 *
 * Transações UTXO cegas (Pedersen + Bulletproofs) transmitidas
 * como eventos NOSTR em kind 31214.
 *
 * Cada nó mantém:
 * - Set de nullifiers vistos (double-spend detection)
 * - Set de UTXOs não-gastos (aceitos como válidos)
 * - Histórico de transações (IndexedDB)
 *
 * Não há blockchain — consenso emerge dos relays NOSTR + validação local.
 */

import { sha3_256 } from "@noble/hashes/sha3.js";

// ─── Constantes ──────────────────────────────────────────────────────────────

/** NOSTR event kind para transações ETRNET */
export const ETRNET_TX_KIND = 31214;

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Evento NOSTR contendo transação ETRNET */
export interface NostrTransaction {
  /** Event kind (sempre 31214) */
  kind: typeof ETRNET_TX_KIND;
  /** Tags do evento para indexação */
  tags: string[][];
  /** Dados serializados da transação */
  content: string;
  /** Timestamp de criação (segundos) */
  created_at: number;
}

/** Dados de transação ETRNET serializados */
export interface ETRTransactionData {
  /** Commitments de entrada (Pedersen) */
  inputs: string[];
  /** Commitments de saída (Pedersen) */
  outputs: string[];
  /** Bulletproof range proofs para outputs */
  rangeProofs: string[];
  /** Prova de balanço Pedersen */
  balanceProof: string;
  /** Nullifiers dos UTXOs gastos */
  nullifiers: string[];
  /** Assinatura ML-DSA */
  signature: string;
  /** Versão do protocolo */
  version: number;
}

/** Entrada de nullifier no store */
export interface NullifierEntry {
  /** Hash do nullifier */
  nullifier: string;
  /** Timestamp de quando foi visto */
  seenAt: number;
  /** Relay de origem */
  relaySource: string;
  /** ID da transação vinculada */
  txId: string;
}

// ─── Nullifier Store ─────────────────────────────────────────────────────────

/**
 * Detecção de double-spend via set de nullifiers.
 * Cada nó mantém seu próprio set, sincronizado via NOSTR.
 */
class NullifierStore {
  private nullifiers: Map<string, NullifierEntry> = new Map();

  /**
   * Registra um nullifier.
   *
   * @returns true se é novo (aceito), false se já existe (double-spend)
   */
  add(entry: NullifierEntry): boolean {
    if (this.nullifiers.has(entry.nullifier)) {
      return false; // já visto — double-spend potencial
    }
    this.nullifiers.set(entry.nullifier, entry);
    return true;
  }

  /** Verifica se um nullifier já foi registrado */
  has(nullifier: string): boolean {
    return this.nullifiers.has(nullifier);
  }

  /** Retorna todos os nullifiers registrados */
  getAll(): NullifierEntry[] {
    return Array.from(this.nullifiers.values());
  }

  /** Número de nullifiers registrados */
  size(): number {
    return this.nullifiers.size;
  }
}

// ─── Funções de Protocolo ────────────────────────────────────────────────────

/**
 * Cria um envelope NOSTR para transação ETRNET.
 * O chamador deve assinar com sua chave NOSTR usando nostr-tools.
 *
 * @param txData - Dados da transação
 * @returns Evento NOSTR pronto para assinatura e broadcast
 */
export function createTransactionEvent(
  txData: ETRTransactionData
): NostrTransaction {
  const txIdHash = sha3_256(
    new TextEncoder().encode(JSON.stringify(txData))
  );
  const txIdHex = Array.from(txIdHash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    kind: ETRNET_TX_KIND,
    tags: [
      ["t", "eternet_tx"],
      ["version", txData.version.toString()],
      ...txData.nullifiers.map((n) => ["nullifier", n]),
      ["txid", txIdHex],
    ],
    content: JSON.stringify(txData),
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Valida um evento de transação recebido.
 *
 * Verificações:
 * 1. Todos os nullifiers são novos (sem double-spend)
 * 2. Número correto de range proofs
 * 3. Inputs e outputs não vazios
 *
 * @param event - Evento NOSTR recebido
 * @param nullifierStore - Store local de nullifiers
 * @returns Resultado da validação
 */
export function validateTransaction(
  event: NostrTransaction,
  ns: NullifierStore
): { valid: boolean; error?: string } {
  try {
    const txData: ETRTransactionData = JSON.parse(event.content);

    // Verifica versão
    if (txData.version !== 1) {
      return { valid: false, error: `Versão desconhecida: ${txData.version}` };
    }

    // Verifica double-spend
    for (const nullifier of txData.nullifiers) {
      if (ns.has(nullifier)) {
        return {
          valid: false,
          error: `Nullifier já visto: ${nullifier.slice(0, 16)}...`,
        };
      }
    }

    // Verifica inputs
    if (txData.inputs.length === 0) {
      return { valid: false, error: "Sem inputs" };
    }

    // Verifica outputs
    if (txData.outputs.length === 0) {
      return { valid: false, error: "Sem outputs" };
    }

    // Verifica range proofs
    if (txData.rangeProofs.length !== txData.outputs.length) {
      return {
        valid: false,
        error: "Número de range proofs não corresponde a outputs",
      };
    }

    // TODO: Verificar Pedersen balance proof (requer void_core WASM)
    // TODO: Verificar Bulletproof range proofs (requer void_core WASM)
    // TODO: Verificar ML-DSA signature (requer @noble/post-quantum)

    return { valid: true };
  } catch {
    return { valid: false, error: "Dados de transação inválidos" };
  }
}

/**
 * Processa um evento de transação recebido via NOSTR.
 * Se válido, registra os nullifiers e retorna os dados.
 *
 * @param event - Evento NOSTR recebido
 * @param nullifierStore - Store local de nullifiers
 * @param relaySource - URL do relay de origem
 * @returns Dados da transação se válida, null caso contrário
 */
export function processIncomingTransaction(
  event: NostrTransaction,
  ns: NullifierStore,
  relaySource: string
): ETRTransactionData | null {
  const validation = validateTransaction(event, ns);
  if (!validation.valid) {
    console.warn(
      `[NostrTx] Transação rejeitada: ${validation.error}`
    );
    return null;
  }

  const txData: ETRTransactionData = JSON.parse(event.content);

  // Registra todos os nullifiers
  const txIdHash = sha3_256(
    new TextEncoder().encode(JSON.stringify(txData))
  );
  const txId = Array.from(txIdHash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  for (const nullifier of txData.nullifiers) {
    ns.add({
      nullifier,
      seenAt: Date.now(),
      relaySource,
      txId,
    });
  }

  console.log(
    `[NostrTx] Transação aceita: ${txId.slice(0, 16)}... ` +
      `(${txData.inputs.length} in, ${txData.outputs.length} out) via ${relaySource}`
  );

  return txData;
}

/** Instância singleton do nullifier store */
export const nullifierStore = new NullifierStore();
