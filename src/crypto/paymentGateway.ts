/**
 * VØID Payment Gateway — NWC Only
 *
 * Filosofia: sem intermediário, sem identidade, sem rastro.
 *
 * Fluxo:
 * 1. Usuário conecta wallet via NWC URI (nostr+walletconnect://...)
 * 2. Gera invoice real via NWC (NIP-47)
 * 3. Ou paga uma invoice recebida via NWC
 * 4. Sem KYC, sem conta, sem terceiro
 *
 * Método de pagamento: APENAS NWC (Nostr Wallet Connect)
 * LDK WASM removido — secp256k1-sys não compila para wasm32
 * Bitcoin on-chain removido — fake invoices
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentItem {
  label: string;
  amount: string; // e.g. "49.90"
  currency: string; // e.g. "BRL"
}

export interface PaymentResult {
  success: boolean;
  method: "nwc";
  invoice?: string;
  amountSat?: number;
  paymentHash?: string;
  preimage?: string;
  error?: string;
}

export interface NWCWalletInfo {
  connected: boolean;
  walletPubKey: string;
  relay: string;
  balanceSat: number | undefined;
}

// ─── Live Prices ─────────────────────────────────────────────────────────────

let cachedPrices: { brl: number; usd: number; eur: number; fetchedAt: number } | null = null;
const PRICE_CACHE_MS = 60_000; // 1 min

async function fetchBtcPrices(): Promise<{ brl: number; usd: number; eur: number }> {
  if (cachedPrices && Date.now() - cachedPrices.fetchedAt < PRICE_CACHE_MS) {
    return cachedPrices;
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd,eur"
    );
    if (!res.ok) throw new Error(`CoinGecko: ${res.status}`);
    const data = await res.json() as { bitcoin: { brl: number; usd: number; eur: number } };
    cachedPrices = { ...data.bitcoin, fetchedAt: Date.now() };
    return cachedPrices;
  } catch {
    // Fallback se API indisponível
    return { brl: 420_000, usd: 85_000, eur: 78_000 };
  }
}

// ─── NWC Payment ─────────────────────────────────────────────────────────────

class NWCPayment {
  private amountSat: number;

  constructor(amountSat: number) {
    this.amountSat = amountSat;
  }

  async createInvoice(): Promise<{ invoice: string; paymentHash: string }> {
    const { nwcClient } = await import("./nwcProtocol");

    if (!nwcClient.isConnected()) {
      throw new Error("NWC não conectado. Conecte uma wallet Lightning primeiro.");
    }

    const amountMsats = this.amountSat * 1000;
    const result = await nwcClient.makeInvoice(amountMsats, "ETΞRNET Payment");

    return {
      invoice: result.invoice,
      paymentHash: result.payment_hash,
    };
  }

  async payInvoice(invoice: string): Promise<{ preimage: string }> {
    const { nwcClient } = await import("./nwcProtocol");

    if (!nwcClient.isConnected()) {
      throw new Error("NWC não conectado. Conecte uma wallet Lightning primeiro.");
    }

    return nwcClient.payInvoice(invoice, this.amountSat * 1000);
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
   * Converte moeda fiat para satoshis usando preço ao vivo.
   */
  async fiatToSat(amount: string, currency: string): Promise<number> {
    const prices = await fetchBtcPrices();
    const price = currency === "BRL" ? prices.brl
      : currency === "EUR" ? prices.eur
      : prices.usd;
    const btcAmount = parseFloat(amount) / price;
    return Math.round(btcAmount * 100_000_000);
  }

  /**
   * Retorna preço atual do BTC nas 3 moedas.
   */
  async getBtcPrices(): Promise<{ brl: number; usd: number; eur: number }> {
    return fetchBtcPrices();
  }

  /**
   * Conecta a um wallet NWC via URI.
   */
  async connectNWC(uri: string): Promise<NWCWalletInfo> {
    const { nwcClient } = await import("./nwcProtocol");
    const conn = await nwcClient.connect(uri);

    let balanceSat: number | undefined;
    try {
      const bal = await nwcClient.getBalance();
      balanceSat = bal.balance;
    } catch { /* balance pode falhar */ }

    return {
      connected: conn.connected,
      walletPubKey: conn.walletPubKey,
      relay: conn.relay,
      balanceSat,
    };
  }

  /**
   * Desconecta do wallet NWC.
   */
  async disconnectNWC(): Promise<void> {
    const { nwcClient } = await import("./nwcProtocol");
    nwcClient.disconnect();
  }

  /**
   * Verifica se NWC está conectado.
   */
  async isNWCConnected(): Promise<boolean> {
    const { nwcClient } = await import("./nwcProtocol");
    return nwcClient.isConnected();
  }

  /**
   * Retorna info do wallet conectado.
   */
  async getWalletInfo(): Promise<NWCWalletInfo | null> {
    const { nwcClient } = await import("./nwcProtocol");
    if (!nwcClient.isConnected()) return null;

    const conn = nwcClient.getConnection();
    if (!conn) return null;

    let balanceSat: number | undefined;
    try {
      const bal = await nwcClient.getBalance();
      balanceSat = bal.balance;
    } catch { /* OK */ }

    return {
      connected: true,
      walletPubKey: conn.walletPubKey,
      relay: conn.relay,
      balanceSat,
    };
  }

  /**
   * Cria pagamento (invoice) via NWC.
   * Falha se NWC não conectado.
   */
  async createPayment(item: PaymentItem): Promise<PaymentResult> {
    try {
      const amountSat = await this.fiatToSat(item.amount, item.currency);
      const payment = new NWCPayment(amountSat);
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
   * Paga uma invoice BOLT11 via NWC.
   */
  async pay(invoice: string, amountSat?: number): Promise<PaymentResult> {
    try {
      const payment = new NWCPayment(amountSat ?? 0);
      const { preimage } = await payment.payInvoice(invoice);

      return {
        success: true,
        method: "nwc",
        preimage,
      };
    } catch (err: any) {
      return { success: false, method: "nwc", error: err.message };
    }
  }

  /**
   * Cria pagamento NWC (alias para compatibilidade com UI existente).
   */
  async createNWCPayment(_uri: string, item: PaymentItem): Promise<PaymentResult> {
    return this.createPayment(item);
  }
}

export const paymentGateway = PaymentGateway.getInstance();
