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


// ─── Bech32 Encoding (BIP173) ────────────────────────────────────────────────

function expandHrp(hrp: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < hrp.length; i++) {
    result.push(hrp.charCodeAt(i) >>> 5);
  }
  result.push(0);
  for (let i = 0; i < hrp.length; i++) {
    result.push(hrp.charCodeAt(i) & 31);
  }
  return result;
}

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      chk ^= ((b >>> i) & 1) ? GEN[i] : 0;
    }
  }
  return chk;
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >>> bits) & maxv);
    }
  }
  if (pad && bits > 0) {
    result.push((acc << (toBits - bits)) & maxv);
  }
  return result;
}

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
    // BOLT11 invoice format — demonstração.
    // Para produção real: integrar com LND/CLN via gRPC/REST ou NWC.
    // Formato: lnbc + amount + timestamp_base36 + payment_hash_hex
    // Nota: sem nó Lightning real, o invoice é apenas para demonstração UI.
    const prefix = "lnbc";
    const amountStr = amount > 0 ? `${amount}` : "";
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const hash = this.generateHash().slice(0, 32);
    return `${prefix}${amountStr}1${timestamp}${hash}`;
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

  /**
   * Gera endereço Bitcoin Bech32 real (P2WPKH, witness v0).
   *
   * Formato: bc1q + 32 chars bech32 (20 bytes witness program + 6 bytes checksum)
   * Segue BIP173: https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki
   */
  private generateAddress(): string {
    // Bech32 character set (BIP173)
    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

    // Generate 20 random bytes as witness program (P2WPKH)
    const witnessProgram = crypto.getRandomValues(new Uint8Array(20));

    // Convert 8-bit groups to 5-bit groups (bech32 encoding)
    const data = convertBits(Array.from(witnessProgram), 8, 5, true);

    // Witness version 0 + data
    const values = [0, ...data];

    // Compute bech32 checksum
    const hrp = "bc";
    const polymod = bech32Polymod(
      expandHrp(hrp).concat(values).concat([0, 0, 0, 0, 0, 0])
    ) ^ 1; // GEN = 1 for bech32

    const checksum: number[] = [];
    for (let i = 0; i < 6; i++) {
      checksum.push((polymod >>> (5 * (5 - i))) & 31);
    }

    // Encode: hrp + "1" + data + checksum
    return hrp + "1" + [...values, ...checksum].map(v => CHARSET[v]).join("");
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

  // Verificar pagamento via API pública (mempool.space)
  async checkPayment(): Promise<PaymentStatus> {
    try {
      // Buscar dados do endereço + altura atual da blockchain em paralelo
      const [addrRes, tipRes] = await Promise.all([
        fetch(`https://mempool.space/api/address/${this.address}`),
        fetch(`https://mempool.space/api/blocks/tip/height`),
      ]);

      if (!addrRes.ok) return { status: "pending" };

      const data = await addrRes.json();
      const currentTip = tipRes.ok ? parseInt(await tipRes.text(), 10) : 0;

      const chainTxs = data.chain_stats.funded_txo_count || 0;
      const mempoolTxs = data.mempool_stats.funded_txo_count || 0;

      if (chainTxs > 0) {
        // Transação confirmada na chain
        // Para confirmações reais: buscar a tx específica via
        // /api/address/:address/txs e comparar tx.status.block_height com tip
        // Como simplificação: se está na chain, calcular pelo funded_txo_sum
        const txRes = await fetch(`https://mempool.space/api/address/${this.address}/txs`);
        if (txRes.ok) {
          const txs = await txRes.json();
          if (txs.length > 0) {
            const latestTx = txs[0];
            if (latestTx.status?.confirmed && latestTx.status?.block_height) {
              this.confirmations = currentTip - latestTx.status.block_height + 1;
              return {
                status: this.confirmations >= 3 ? "confirmed" : "pending",
                confirmations: this.confirmations,
              };
            }
          }
        }
        // Fallback: confirmed but unknown depth
        this.confirmations = 6;
        return { status: "confirmed", confirmations: this.confirmations };
      } else if (mempoolTxs > 0) {
        // Na mempool mas não confirmada
        this.confirmations = 0;
        return { status: "pending", confirmations: 0 };
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
