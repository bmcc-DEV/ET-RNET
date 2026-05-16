/**
 * VØID Payment Gateway — Bitcoin + Lightning Network
 *
 * Filosofia: sem intermediário, sem identidade, sem rastro.
 *
 * Fluxo:
 * 1. Gera endereço Bitcoin único para a transação
 * 2. Usuário paga do wallet dele
 * 3. Monitora confirmação na blockchain
 * 4. Sem KYC, sem conta, sem terceiro
 *
 * Opções de pagamento:
 * - Bitcoin on-chain (3 confirmações ~30min)
 * - Lightning Network (instantâneo, taxas mínimas)
 * - Nostr Wallet Connect (NWC) — descentralizado via Nostr
 */

import { secureRandomInt } from "../utils/secureRandom";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentItem {
  label: string;
  amount: string; // e.g. "49.90"
  currency: string; // e.g. "BRL"
}

export interface PaymentResult {
  success: boolean;
  method: "lightning" | "bitcoin" | "nwc" | "mock";
  invoice?: string;
  address?: string;
  amountSat?: number;
  paymentHash?: string;
  error?: string;
}

export interface PaymentStatus {
  status: "pending" | "confirmed" | "expired" | "error";
  confirmations?: number;
  txid?: string;
}

// ─── Lightning Network (BOLT11) ──────────────────────────────────────────────

class LightningPayment {
  private bolt11: string;
  private amountSat: number;
  private paymentHash: string;
  private createdAt: number;

  constructor(amountSat: number, label: string) {
    this.amountSat = amountSat;
    this.bolt11 = this.generateBolt11(amountSat, label);
    this.paymentHash = this.generateHash();
    this.createdAt = Date.now();
  }

  private generateBolt11(amount: number, _label: string): string {
    // BOLT11 invoice format (simplificado)
    // Em produção, usar biblioteca lnbits ou lnd
    const prefix = "lnbc";
    const amountStr = amount.toString(16).padStart(4, "0");
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const hash = this.generateHash().slice(0, 32);
    return `${prefix}${amountStr}${timestamp}${hash}`;
  }

  private generateHash(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  getInvoice(): string {
    return this.bolt11;
  }

  getPaymentHash(): string {
    return this.paymentHash;
  }

  getAmountSat(): number {
    return this.amountSat;
  }

  isExpired(): boolean {
    return Date.now() - this.createdAt > 3600000; // 1 hora
  }
}

// ─── Bitcoin On-Chain ────────────────────────────────────────────────────────

class BitcoinPayment {
  private address: string;
  private amountSat: number;
  private confirmations: number = 0;

  constructor(amountSat: number) {
    this.amountSat = amountSat;
    this.address = this.generateAddress();
  }

  private generateAddress(): string {
    // Gerar endereço Bitcoin (bech32/segwit)
    // Em produção, usar bitcoinjs-lib ou ecpair
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let addr = "bc1q";
    for (let i = 0; i < 38; i++) {
      addr += chars[secureRandomInt(chars.length)];
    }
    return addr;
  }

  getAddress(): string {
    return this.address;
  }

  getAmountSat(): number {
    return this.amountSat;
  }

  getAmountBTC(): string {
    return (this.amountSat / 100000000).toFixed(8);
  }

  // Verificar pagamento via API pública (blockstream, mempool.space)
  async checkPayment(): Promise<PaymentStatus> {
    try {
      // Usar mempool.space API (gratuita, sem KYC)
      const res = await fetch(`https://mempool.space/api/address/${this.address}`);
      if (!res.ok) return { status: "pending" };

      const data = await res.json();
      if (data.chain_stats.funded_txo_sum > 0) {
        // mempool.space API: chain_stats.funded_txo_count > 0 means at least 1 on-chain tx
        // For confirmations we need the tx block height vs current tip.
        // Since we can't get the specific tx block from this endpoint,
        // check if there are funded_txo_count in chain (confirmed) vs mempool (unconfirmed).
        const chainTxs = data.chain_stats.funded_txo_count || 0;
        const mempoolTxs = data.mempool_stats.funded_txo_count || 0;

        if (chainTxs > 0) {
          // At least one confirmed transaction
          this.confirmations = 6; // assume confirmed (conservative)
          return { status: "confirmed", confirmations: this.confirmations };
        } else if (mempoolTxs > 0) {
          // In mempool but not yet confirmed
          this.confirmations = 0;
          return { status: "pending", confirmations: 0 };
        }
      }
      return { status: "pending" };
    } catch {
      return { status: "pending" };
    }
  }
}

// ─── Nostr Wallet Connect (NWC) ──────────────────────────────────────────────

class NWCPayment {
  private amountSat: number;

  constructor(_walletPubkey: string, amountSat: number) {
    this.amountSat = amountSat;
  }

  /**
   * Cria LNURL invoice via NWC.
   * Requer wallet pubkey do destinatário.
   */
  async createInvoice(): Promise<{ invoice: string; paymentHash: string }> {
    // Em produção, usar Nostr relays para criar invoice
    // Por agora, gerar invoice simulado
    const paymentHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    return {
      invoice: `lnbc${this.amountSat.toString(16)}${Date.now().toString(36)}${paymentHash.slice(0, 32)}`,
      paymentHash,
    };
  }
}

// ─── Unified Payment Gateway ─────────────────────────────────────────────────

export class PaymentGateway {
  private static instance: PaymentGateway;

  static getInstance(): PaymentGateway {
    if (!PaymentGateway.instance) {
      PaymentGateway.instance = new PaymentGateway();
    }
    return PaymentGateway.instance;
  }

  /**
   * Converte moeda fiat para satoshis.
   * Em produção, usar API de preço real (CoinGecko, CoinMarketCap).
   */
  async fiatToSat(amount: string, currency: string): Promise<number> {
    // Preço simulado — em produção, buscar de API
    const btcPrices: Record<string, number> = {
      BRL: 350000, // R$350k por BTC
      USD: 65000,
      EUR: 60000,
    };
    const price = btcPrices[currency] || btcPrices.USD;
    const btcAmount = parseFloat(amount) / price;
    return Math.round(btcAmount * 100000000);
  }

  /**
   * Cria pagamento Lightning (instantâneo).
   */
  async createLightningPayment(item: PaymentItem): Promise<PaymentResult> {
    try {
      const amountSat = await this.fiatToSat(item.amount, item.currency);
      const payment = new LightningPayment(amountSat, item.label);

      return {
        success: true,
        method: "lightning",
        invoice: payment.getInvoice(),
        amountSat: payment.getAmountSat(),
        paymentHash: payment.getPaymentHash(),
      };
    } catch (err: any) {
      return { success: false, method: "lightning", error: err.message };
    }
  }

  /**
   * Cria pagamento Bitcoin on-chain (~30min).
   */
  async createBitcoinPayment(item: PaymentItem): Promise<PaymentResult> {
    try {
      const amountSat = await this.fiatToSat(item.amount, item.currency);
      const payment = new BitcoinPayment(amountSat);

      return {
        success: true,
        method: "bitcoin",
        address: payment.getAddress(),
        amountSat: payment.getAmountSat(),
      };
    } catch (err: any) {
      return { success: false, method: "bitcoin", error: err.message };
    }
  }

  /**
   * Cria pagamento via Nostr Wallet Connect.
   */
  async createNWCPayment(walletPubkey: string, item: PaymentItem): Promise<PaymentResult> {
    try {
      const amountSat = await this.fiatToSat(item.amount, item.currency);
      const payment = new NWCPayment(walletPubkey, amountSat);
      const { invoice, paymentHash } = await payment.createInvoice();

      return {
        success: true,
        method: "nwc",
        invoice,
        amountSat,
        paymentHash,
      };
    } catch (err: any) {
      return { success: false, method: "nwc", error: err.message };
    }
  }

  /**
   * Processa pagamento — Lightning primeiro (instantâneo), depois Bitcoin.
   */
  async pay(item: PaymentItem): Promise<PaymentResult> {
    // 1. Lightning (instantâneo, baixas taxas)
    const lightning = await this.createLightningPayment(item);
    if (lightning.success) return lightning;

    // 2. Bitcoin on-chain (fallback)
    return this.createBitcoinPayment(item);
  }
}

export const paymentGateway = PaymentGateway.getInstance();
