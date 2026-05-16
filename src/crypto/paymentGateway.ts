/**
 * VØID Payment Gateway — Mercado Pago Checkout Pro + Payment Request API
 *
 * Estratégia:
 * 1. Payment Request API (nativo do browser) → cartões internacionais
 * 2. Mercado Pago Checkout Pro → PIX, cartão, boleto (Brasil)
 *
 * Fluxo Mercado Pago:
 * 1. Frontend chama backend /api/mercadopago/create
 * 2. Backend cria Preference via API Mercado Pago
 * 3. Retorna init_point (URL de pagamento)
 * 4. Usuário é redirecionado para página do Mercado Pago
 * 5. Paga (PIX, cartão, boleto)
 * 6. Volta pro app (success_url)
 * 7. Webhook confirma pagamento
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentItem {
  label: string;
  amount: string;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  method: "payment-request" | "mercadopago" | "mock";
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// ─── Payment Request API (Browser Native) ────────────────────────────────────

class PaymentRequestAPI {
  static isAvailable(): boolean {
    return typeof window !== "undefined" && "PaymentRequest" in window;
  }

  static async supportsCards(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      // @ts-ignore
      const request = new PaymentRequest(
        [{ supportedMethods: "basic-card" }],
        { total: { label: "Test", amount: { currency: "USD", value: "1.00" } } }
      );
      return await request.canMakePayment();
    } catch {
      return false;
    }
  }

  static async requestCardPayment(item: PaymentItem): Promise<PaymentResult> {
    if (!this.isAvailable()) {
      return { success: false, method: "payment-request", error: "Payment Request API não disponível" };
    }

    try {
      // @ts-ignore
      const request = new PaymentRequest(
        [{
          supportedMethods: "basic-card",
          data: {
            supportedNetworks: ["visa", "mastercard", "amex"],
            supportedTypes: ["credit", "debit", "prepaid"],
          },
        }],
        { total: { label: item.label, amount: { currency: item.currency, value: item.amount } } }
      );

      const response = await request.show();
      await response.complete("success");

      return {
        success: true,
        method: "payment-request",
        transactionId: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };
    } catch (err: any) {
      return { success: false, method: "payment-request", error: err.message };
    }
  }
}

// ─── Mercado Pago Checkout Pro ───────────────────────────────────────────────

class MercadoPagoCheckout {
  /**
   * Cria preferência de pagamento via backend e redireciona.
   */
  async createAndRedirect(
    item: PaymentItem,
    successUrl: string,
    cancelUrl: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch("/api/mercadopago/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.label,
          price: parseFloat(item.amount),
          currency: item.currency,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const { init_point, id } = await response.json();

      // Redirecionar para página de pagamento do Mercado Pago
      window.location.href = init_point;

      return {
        success: true,
        method: "mercadopago",
        transactionId: id,
        paymentUrl: init_point,
      };
    } catch (err: any) {
      return { success: false, method: "mercadopago", error: err.message };
    }
  }
}

// ─── Unified Payment Gateway ─────────────────────────────────────────────────

export class PaymentGateway {
  private static instance: PaymentGateway;
  private mp = new MercadoPagoCheckout();

  static getInstance(): PaymentGateway {
    if (!PaymentGateway.instance) {
      PaymentGateway.instance = new PaymentGateway();
    }
    return PaymentGateway.instance;
  }

  async getCapabilities(): Promise<{
    paymentRequest: boolean;
    mercadopago: boolean;
  }> {
    return {
      paymentRequest: await PaymentRequestAPI.supportsCards(),
      mercadopago: true, // sempre disponível via backend
    };
  }

  /**
   * Processa pagamento.
   * Tenta Payment Request API primeiro, depois Mercado Pago.
   */
  async pay(item: PaymentItem): Promise<PaymentResult> {
    // 1. Tentar Payment Request API (internacional)
    if (await PaymentRequestAPI.supportsCards()) {
      const result = await PaymentRequestAPI.requestCardPayment(item);
      if (result.success) return result;
    }

    // 2. Fallback: Mercado Pago Checkout Pro (Brasil)
    return this.mp.createAndRedirect(
      item,
      `${window.location.origin}/payment/success`,
      `${window.location.origin}/payment/cancel`
    );
  }
}

export const paymentGateway = PaymentGateway.getInstance();
