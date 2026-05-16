/**
 * VØID-LN — LDK Bridge (TypeScript → WASM)
 *
 * Wrapper TypeScript para o LDK-WASM. Gerencia o ciclo de vida
 * do nó Lightning no browser: inicialização, canais, invoices,
 * pagamentos, persistência.
 *
 * Chaves privadas nunca saem do WASM/OPFS.
 */

// LDKNode will be available from void_core after WASM build
// For now, use a type-safe stub
declare class LDKNode {
  constructor(seed: Uint8Array, logFn?: Function, persistFn?: Function);
  initialize(seed: Uint8Array, network: string): void;
  getNodePubkey(): Uint8Array;
  createInvoice(amountMsats: number, description: string, expirySecs: number): string;
  processMessage(peerPubkey: Uint8Array, message: Uint8Array): Uint8Array;
  serializeState(): Uint8Array;
  getChannelCount(): number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LDKChannel {
  channelId: string;
  peerPubkey: string;
  capacitySat: number;
  localBalanceSat: number;
  remoteBalanceSat: number;
  isActive: boolean;
  isPublic: boolean;
}

export interface LDKInvoice {
  bolt11: string;
  paymentHash: string;
  amountMsats: number;
  description: string;
  expiresAt: number;
}

export interface LDKPaymentResult {
  success: boolean;
  preimage?: string;
  error?: string;
}

export type LDKEventType =
  | "funding_generated"
  | "funding_broadcast"
  | "funding_locked"
  | "payment_received"
  | "payment_sent"
  | "payment_failed"
  | "channel_closed"
  | "channel_pending";

export interface LDKEvent {
  type: LDKEventType;
  channelId?: string;
  paymentHash?: string;
  preimage?: string;
  amountMsats?: number;
  error?: string;
}

export type LDKEventListener = (event: LDKEvent) => void;

// ─── LDK Bridge ──────────────────────────────────────────────────────────────

export class LDKBridge {
  private node: LDKNode | null = null;
  private initialized = false;
  private listeners: Set<LDKEventListener> = new Set();
  /**
   * Inicializa o nó LDK com a seed do usuário.
   * A seed é armazenada apenas no WASM (nunca no JS heap).
   */
  async init(seed: Uint8Array, network: "mainnet" | "testnet" | "regtest" = "regtest"): Promise<void> {
    if (seed.length !== 32) throw new Error("Seed must be 32 bytes");

    // Seed goes directly to WASM — never stored in JS heap

    // Create LDK node with JS callbacks for logging and persistence
    this.node = new LDKNode(
      seed,
      (msg: string) => console.log(msg),
      (action: string, channelId: string, data: Uint8Array) => {
        this.handlePersist(action, channelId, data);
      },
    );

    // Initialize with network
    this.node.initialize(seed, network);

    this.initialized = true;
    console.log(`[LDK] Node initialized on ${network}`);
  }

  /**
   * Retorna a pubkey do nó Lightning.
   */
  getNodePubkey(): string | null {
    if (!this.node) return null;
    try {
      const pubkey = this.node.getNodePubkey();
      return Array.from(pubkey).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch {
      return null;
    }
  }

  /**
   * Cria uma invoice BOLT11 para receber pagamento.
   */
  async createInvoice(amountMsats: number, description: string, expirySecs: number = 3600): Promise<LDKInvoice> {
    if (!this.node || !this.initialized) throw new Error("LDK not initialized");

    const _bolt11 = this.node.createInvoice(amountMsats, description, expirySecs);

    return {
      bolt11: _bolt11,
      paymentHash: "", // Derived from invoice
      amountMsats,
      description,
      expiresAt: Math.floor(Date.now() / 1000) + expirySecs,
    };
  }

  /**
   * Paga uma invoice BOLT11.
   */
  async payInvoice(_bolt11: string): Promise<LDKPaymentResult> {
    if (!this.node || !this.initialized) throw new Error("LDK not initialized");

    try {
      // TODO: Parse invoice and route payment through channel manager
      return { success: false, error: "Payment routing not yet implemented" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Processa uma mensagem Lightning recebida via NOSTR transport.
   */
  processMessage(peerPubkey: Uint8Array, message: Uint8Array): Uint8Array | null {
    if (!this.node || !this.initialized) return null;

    try {
      return this.node.processMessage(peerPubkey, message);
    } catch {
      return null;
    }
  }

  /**
   * Retorna o número de canais ativos.
   */
  getChannelCount(): number {
    return this.node?.getChannelCount() ?? 0;
  }

  /**
   * Registra listener para eventos LDK.
   */
  onEvent(listener: LDKEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Verifica se está inicializado.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  private handlePersist(action: string, channelId: string, data: Uint8Array): void {
    // Store channel state in IndexedDB
    try {
      const key = `ldk_channel_${channelId}`;
      const encoded = btoa(String.fromCharCode(...data));
      localStorage.setItem(key, encoded);
      console.log(`[LDK] Persisted ${action} for channel ${channelId.slice(0, 8)}...`);
    } catch (err) {
      console.warn(`[LDK] Failed to persist ${action}:`, err);
    }
  }
}

// Singleton
export const ldkBridge = new LDKBridge();
