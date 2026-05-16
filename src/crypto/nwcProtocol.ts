/**
 * VØID-LN — NWC Protocol (NIP-47: Nostr Wallet Connect)
 *
 * Implementação completa do NIP-47 para pagamentos Lightning
 * via NOSTR relays. Permite que o PWA se conecte a qualquer
 * wallet NWC (Alby, Mutiny, LNbits, etc.) para enviar/receber
 * pagamentos Lightning sem rodar um nó local.
 *
 * Fluxo:
 * 1. Usuário fornece URI: nostr+walletconnect://<wallet_pk>?relay=<url>&secret=<hex>
 * 2. Client conecta ao relay NWC
 * 3. Client envia requests (kind 23194) criptografados NIP-44
 * 4. Wallet processa e responde (kind 23195)
 * 5. Client decriptografa resposta e atualiza UI
 *
 * Referência: https://github.com/nostr-protocol/nips/blob/master/47.md
 */

import { x25519 } from "@noble/curves/ed25519.js";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { sha256 as _sha256 } from "@noble/hashes/sha2.js";
const sha256 = _sha256 as unknown as Parameters<typeof hmac>[0];
import { hmac } from "@noble/hashes/hmac.js";
import { SimplePool, finalizeEvent, getPublicKey } from "nostr-tools";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NWCConnection {
  walletPubKey: string;       // Wallet's Nostr public key (hex)
  relay: string;              // NWC relay URL
  secret: Uint8Array;         // Client's secret key for signing
  clientPubKey: string;       // Client's Nostr public key (hex)
  connected: boolean;
}

export interface NWCRequest {
  method: NWCMethod;
  params: Record<string, unknown>;
}

export interface NWCResponse {
  result_type: NWCMethod;
  error?: NWCError;
  result?: Record<string, unknown>;
}

export interface NWCError {
  code: NWCErrorCode;
  message: string;
}

export type NWCMethod =
  | "pay_invoice"
  | "make_invoice"
  | "get_balance"
  | "get_info"
  | "list_transactions"
  | "lookup_invoice";

export type NWCErrorCode =
  | "RATE_LIMITED"
  | "NOT_IMPLEMENTED"
  | "INSUFFICIENT_BALANCE"
  | "QUOTA_EXCEEDED"
  | "RESTRICTED"
  | "UNAUTHORIZED"
  | "INTERNAL"
  | "OTHER"
  | "PAYMENT_FAILED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_TIMEOUT";

export interface NWCPayInvoiceParams {
  invoice: string;
  amount?: number;  // msats (optional, for zero-amount invoices)
}

export interface NWCMakeInvoiceParams {
  amount: number;       // msats
  description: string;
  description_hash?: string;
  expiry?: number;      // seconds
}

export interface NWCTransaction {
  type: "incoming" | "outgoing";
  invoice?: string;
  description?: string;
  description_hash?: string;
  preimage?: string;
  payment_hash: string;
  amount: number;       // msats
  fees_paid?: number;   // msats
  created_at: number;   // unix timestamp
  expires_at?: number;
  settled_at?: number;
  metadata?: Record<string, unknown>;
}

export type NWCEventListener = (response: NWCResponse) => void;

// ─── NIP-44 Encryption ───────────────────────────────────────────────────────

/**
 * NIP-44 v2 encryption (X25519 + ChaCha20-Poly1305 + HKDF)
 *
 * Deriva shared secret via X25519, then HKDF para chave simétrica,
 * depois ChaCha20-Poly1305 para cifrar.
 */
function nip44Encrypt(
  plaintext: Uint8Array,
  senderSecretKey: Uint8Array,
  recipientPublicKey: Uint8Array,
): Uint8Array {
  // X25519 shared secret
  const sharedSecret = x25519.getSharedSecret(senderSecretKey, recipientPublicKey);

  // HKDF-Extract: PRK = HMAC-SHA256(salt, ikm)
  const salt = new TextEncoder().encode("nip44-v2");
  const prk = hmac(sha256, salt, sharedSecret);

  // HKDF-Expand: produce 32 bytes for ChaCha20 key + 12 bytes for nonce
  const info = new TextEncoder().encode("nip44-v2-enc");
  const okm1 = hmac(sha256, prk, new Uint8Array([...info, 0x01]));
  const okm2 = hmac(sha256, prk, new Uint8Array([...okm1, ...info, 0x02]));

  const encryptionKey = okm1.slice(0, 32);
  const nonce = okm2.slice(0, 12);

  // ChaCha20-Poly1305 encrypt
  const cipher = chacha20poly1305(encryptionKey, nonce);
  const ciphertext = cipher.encrypt(plaintext);

  // Format: version (2 bytes) + nonce (12 bytes) + ciphertext+tag
  const version = new Uint8Array([0x00, 0x02]);
  return new Uint8Array([...version, ...nonce, ...ciphertext]);
}

/**
 * NIP-44 v2 decryption
 */
function nip44Decrypt(
  payload: Uint8Array,
  recipientSecretKey: Uint8Array,
  senderPublicKey: Uint8Array,
): Uint8Array {
  // Parse: version (2) + nonce (12) + ciphertext+tag
  if (payload.length < 14) throw new Error("NIP-44: payload too short");

  const version = (payload[0] << 8) | payload[1];
  if (version !== 2) throw new Error(`NIP-44: unsupported version ${version}`);

  const nonce = payload.slice(2, 14);
  const ciphertext = payload.slice(14);

  // X25519 shared secret
  const sharedSecret = x25519.getSharedSecret(recipientSecretKey, senderPublicKey);

  // HKDF (same as encrypt)
  const salt = new TextEncoder().encode("nip44-v2");
  const prk = hmac(sha256, salt, sharedSecret);
  const info = new TextEncoder().encode("nip44-v2-enc");
  const okm1 = hmac(sha256, prk, new Uint8Array([...info, 0x01]));
  const okm2 = hmac(sha256, prk, new Uint8Array([...okm1, ...info, 0x02]));

  const encryptionKey = okm1.slice(0, 32);
  const expectedNonce = okm2.slice(0, 12);

  // Verify nonce matches
  if (!nonce.every((b, i) => b === expectedNonce[i])) {
    throw new Error("NIP-44: nonce mismatch");
  }

  // ChaCha20-Poly1305 decrypt
  const cipher = chacha20poly1305(encryptionKey, nonce);
  return cipher.decrypt(ciphertext);
}

// ─── NWC Protocol ─────────────────────────────────────────────────────────────

/**
 * Parse uma URI NWC: nostr+walletconnect://<wallet_pk>?relay=<url>&secret=<hex>
 */
export function parseNWCUri(uri: string): { walletPubKey: string; relay: string; secret: Uint8Array } {
  const match = uri.match(/^nostr\+walletconnect:\/\/([0-9a-f]+)\?(.+)$/i);
  if (!match) throw new Error("Invalid NWC URI format");

  const walletPubKey = match[1];
  const params = new URLSearchParams(match[2]);

  const relay = params.get("relay");
  if (!relay) throw new Error("NWC URI missing relay parameter");

  const secretHex = params.get("secret");
  if (!secretHex) throw new Error("NWC URI missing secret parameter");

  // Convert hex secret to Uint8Array
  const secret = new Uint8Array(secretHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  return { walletPubKey, relay, secret };
}

/**
 * NWC Client — conecta a um wallet NWC via NOSTR relay
 */
export class NWCClient {
  private connection: NWCConnection | null = null;
  private pool: SimplePool | null = null;
  private listeners: Set<NWCEventListener> = new Set();
  private pendingRequests: Map<string, {
    method: NWCMethod;
    resolve: (value: NWCResponse) => void;
    reject: (reason: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();

  /**
   * Conecta a um wallet NWC via URI
   */
  async connect(uri: string): Promise<NWCConnection> {
    const { walletPubKey, relay, secret } = parseNWCUri(uri);
    const clientPubKey = getPublicKey(secret);

    this.connection = {
      walletPubKey,
      relay,
      secret,
      clientPubKey,
      connected: false,
    };

    // Connect to relay
    this.pool = new SimplePool();

    // Subscribe to responses (kind 23195)
    this.pool.subscribeMany([relay], {
      kinds: [23195],
      "#p": [clientPubKey],
    }, {
      onevent: (event: any) => this.handleResponse(event),
      onclose: () => {
        if (this.connection) this.connection.connected = false;
      },
    });

    this.connection.connected = true;
    console.log(`[NWC] Connected to wallet ${walletPubKey.slice(0, 8)}... via ${relay}`);

    return this.connection;
  }

  /**
   * Desconecta do wallet NWC
   */
  disconnect(): void {
    if (this.pool) {
      this.pool.close([]);
      this.pool = null;
    }
    if (this.connection) {
      this.connection.connected = false;
      this.connection = null;
    }
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Disconnected"));
    }
    this.pendingRequests.clear();
  }

  /**
   * Envia um request NWC e aguarda resposta
   */
  async sendRequest(
    method: NWCMethod,
    params: Record<string, unknown> = {},
    timeoutMs: number = 30000,
  ): Promise<NWCResponse> {
    if (!this.connection || !this.pool) {
      throw new Error("NWC not connected");
    }

    const request: NWCRequest = { method, params };
    const requestId = crypto.randomUUID();

    // Encrypt request with NIP-44
    const plaintext = new TextEncoder().encode(JSON.stringify(request));
    const encrypted = nip44Encrypt(
      plaintext,
      this.connection.secret,
      x25519.getPublicKey(
        new Uint8Array(this.connection.walletPubKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
      ),
    );

    // Create NOSTR event (kind 23194)
    const event = finalizeEvent({
      kind: 23194,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["p", this.connection.walletPubKey],
        ["e", requestId],
      ],
      content: String.fromCharCode(...encrypted),
    }, this.connection.secret);

    // Publish
    this.pool.publish([this.connection.relay], event);

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`NWC request timeout: ${method}`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { method, resolve, reject, timeout });
    });
  }

  /**
   * Paga uma invoice Lightning
   */
  async payInvoice(invoice: string, amountMsats?: number): Promise<{ preimage: string }> {
    const params: Record<string, unknown> = { invoice };
    if (amountMsats) params.amount = amountMsats;

    const response = await this.sendRequest("pay_invoice", params);

    if (response.error) {
      throw new Error(`NWC pay_invoice failed: ${response.error.code} — ${response.error.message}`);
    }

    return { preimage: response.result!.preimage as string };
  }

  /**
   * Cria uma invoice Lightning
   */
  async makeInvoice(
    amountMsats: number,
    description: string,
    expiry?: number,
  ): Promise<{ invoice: string; payment_hash: string }> {
    const params: Record<string, unknown> = { amount: amountMsats, description };
    if (expiry) params.expiry = expiry;

    const response = await this.sendRequest("make_invoice", params);

    if (response.error) {
      throw new Error(`NWC make_invoice failed: ${response.error.code} — ${response.error.message}`);
    }

    return {
      invoice: response.result!.invoice as string,
      payment_hash: response.result!.payment_hash as string,
    };
  }

  /**
   * Consulta saldo do wallet
   */
  async getBalance(): Promise<{ balance: number }> {
    const response = await this.sendRequest("get_balance");

    if (response.error) {
      throw new Error(`NWC get_balance failed: ${response.error.code} — ${response.error.message}`);
    }

    return { balance: response.result!.balance as number };
  }

  /**
   * Consulta info do wallet
   */
  async getInfo(): Promise<{ alias: string; color: string; pubkey: string; network: string; methods: string[] }> {
    const response = await this.sendRequest("get_info");

    if (response.error) {
      throw new Error(`NWC get_info failed: ${response.error.code} — ${response.error.message}`);
    }

    return response.result as any;
  }

  /**
   * Lista transações
   */
  async listTransactions(
    from?: number,
    until?: number,
    limit?: number,
    offset?: number,
    unpaid?: boolean,
    type?: "incoming" | "outgoing",
  ): Promise<{ transactions: NWCTransaction[] }> {
    const params: Record<string, unknown> = {};
    if (from !== undefined) params.from = from;
    if (until !== undefined) params.until = until;
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (unpaid !== undefined) params.unpaid = unpaid;
    if (type !== undefined) params.type = type;

    const response = await this.sendRequest("list_transactions", params);

    if (response.error) {
      throw new Error(`NWC list_transactions failed: ${response.error.code} — ${response.error.message}`);
    }

    return { transactions: response.result!.transactions as NWCTransaction[] };
  }

  /**
   * Busca uma invoice específica
   */
  async lookupInvoice(
    paymentHash?: string,
    invoice?: string,
  ): Promise<NWCTransaction> {
    const params: Record<string, unknown> = {};
    if (paymentHash) params.payment_hash = paymentHash;
    if (invoice) params.invoice = invoice;

    const response = await this.sendRequest("lookup_invoice", params);

    if (response.error) {
      throw new Error(`NWC lookup_invoice failed: ${response.error.code} — ${response.error.message}`);
    }

    return response.result as unknown as NWCTransaction;
  }

  /**
   * Registra listener para respostas
   */
  onResponse(listener: NWCEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connection?.connected === true;
  }

  /**
   * Retorna info da conexão
   */
  getConnection(): NWCConnection | null {
    return this.connection;
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  private handleResponse(event: any): void {
    if (!this.connection) return;

    try {
      // Decrypt response with NIP-44
      const encrypted = new Uint8Array(event.content.split("").map((c: string) => c.charCodeAt(0)));
      const senderPk = new Uint8Array(event.pubkey.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)));
      const decryptedText = nip44Decrypt(encrypted, this.connection.secret, senderPk);
      const response: NWCResponse = JSON.parse(new TextDecoder().decode(decryptedText));

      // Notify listeners
      for (const listener of this.listeners) {
        try { listener(response); } catch { /* ignore */ }
      }

      // Resolve pending request
      const requestId = event.tags.find((t: string[]) => t[0] === "e")?.[1];
      if (requestId && this.pendingRequests.has(requestId)) {
        const pending = this.pendingRequests.get(requestId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(requestId);
        pending.resolve(response);
      }
    } catch (err) {
      console.warn("[NWC] Failed to handle response:", err);
    }
  }
}

// Singleton
export const nwcClient = new NWCClient();
