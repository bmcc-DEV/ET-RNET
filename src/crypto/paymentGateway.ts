/**
 * VØID Payment Gateway — Stripe + Payment Request API
 *
 * Estratégia:
 * 1. Payment Request API (nativo do browser) → cartões + PIX internacional
 * 2. Fallback: Stripe Checkout (server-side redirect)
 *
 * Payment Request API suporta:
 * - Cartões de crédito/débito (globais)
 * - Google Pay / Apple Pay (quando disponível)
 * - PIX (via Stripe ou PSP brasileiro)
 *
 * Se Payment Request API funcionar internacionalmente,
 * Stripe pode ser removido completamente.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentItem {
  label: string;
  amount: string; // e.g. "49.90"
  currency: string; // e.g. "BRL"
}

export interface PaymentResult {
  success: boolean;
  method: "payment-request" | "stripe" | "mock";
  transactionId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface StripeConfig {
  publishableKey: string;
  apiVersion?: string;
}

// ─── Payment Request API (Browser Native) ────────────────────────────────────

class PaymentRequestAPI {
  static isAvailable(): boolean {
    return typeof window !== "undefined" && "PaymentRequest" in window;
  }

  /**
   * Verifica se Payment Request API suporta um método de pagamento.
   */
  static async canMakePayment(method: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      // @ts-ignore — PaymentRequest é experimental
      const request = new PaymentRequest(
        [{ supportedMethods: method }],
        { total: { label: "Test", amount: { currency: "USD", value: "1.00" } } }
      );
      const result = await request.canMakePayment();
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Verifica suporte a cartões (internacional).
   */
  static async supportsCards(): Promise<boolean> {
    return this.canMakePayment("basic-card");
  }

  /**
   * Verifica suporte a Google Pay.
   */
  static async supportsGooglePay(): Promise<boolean> {
    return this.canMakePayment("https://google.com/payments");
  }

  /**
   * Cria e exibe Payment Request para cartão.
   */
  static async requestCardPayment(
    item: PaymentItem
  ): Promise<PaymentResult> {
    if (!this.isAvailable()) {
      return { success: false, method: "payment-request", error: "Payment Request API não disponível" };
    }

    try {
      // @ts-ignore
      const request = new PaymentRequest(
        [
          {
            supportedMethods: "basic-card",
            data: {
              supportedNetworks: ["visa", "mastercard", "amex", "discover"],
              supportedTypes: ["credit", "debit", "prepaid"],
            },
          },
        ],
        {
          total: {
            label: item.label,
            amount: { currency: item.currency, value: item.amount },
          },
        }
      );

      const response = await request.show();
      // Aqui processaríamos o pagamento via backend
      // Por agora, simulamos sucesso
      await response.complete("success");

      return {
        success: true,
        method: "payment-request",
        transactionId: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        details: { method: "basic-card", currency: item.currency },
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, method: "payment-request", error: "Pagamento cancelado pelo usuário" };
      }
      return { success: false, method: "payment-request", error: err.message };
    }
  }

  /**
   * Cria e exibe Payment Request para Google Pay.
   */
  static async requestGooglePayPayment(
    item: PaymentItem
  ): Promise<PaymentResult> {
    if (!this.isAvailable()) {
      return { success: false, method: "payment-request", error: "Payment Request API não disponível" };
    }

    try {
      // @ts-ignore
      const request = new PaymentRequest(
        [
          {
            supportedMethods: "https://google.com/payments",
            data: {
              environment: "TEST",
              merchantId: "VOOID_MERCHANT_ID",
              paymentMethodTokenizationParameters: {
                tokenizationType: "PAYMENT_GATEWAY",
                parameters: { gateway: "stripe", "stripe:version": "2024-01", "stripe:publishableKey": "pk_test_..." },
              },
            },
          },
        ],
        {
          total: {
            label: item.label,
            amount: { currency: item.currency, value: item.amount },
          },
        }
      );

      const response = await request.show();
      await response.complete("success");

      return {
        success: true,
        method: "payment-request",
        transactionId: `gpay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        details: { method: "google-pay", currency: item.currency },
      };
    } catch (err: any) {
      return { success: false, method: "payment-request", error: err.message };
    }
  }
}

// ─── Stripe Checkout (Fallback) ──────────────────────────────────────────────

class StripeCheckout {
  private config: StripeConfig | null = null;

  /**
   * Configura Stripe com a publishable key.
   */
  configure(publishableKey: string) {
    this.config = { publishableKey, apiVersion: "2024-01" };
  }

  /**
   * Cria sessão de checkout via Stripe API.
   * Requer backend proxy para proteger a secret key.
   */
  async createCheckoutSession(
    items: PaymentItem[],
    successUrl: string,
    cancelUrl: string
  ): Promise<PaymentResult> {
    if (!this.config) {
      return { success: false, method: "stripe", error: "Stripe não configurado" };
    }

    try {
      // Em produção, isso chamaria um backend proxy
      // POST /api/stripe/checkout
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            price_data: {
              currency: item.currency.toLowerCase(),
              product_data: { name: item.label },
              unit_amount: Math.round(parseFloat(item.amount) * 100),
            },
            quantity: 1,
          })),
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { sessionId } = await response.json();

      // Redirecionar para Stripe Checkout
      // @ts-ignore — Stripe.js load
      const stripe = await this.loadStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }

      return {
        success: true,
        method: "stripe",
        transactionId: sessionId,
      };
    } catch (err: any) {
      return { success: false, method: "stripe", error: err.message };
    }
  }

  private async loadStripe(): Promise<any> {
    if (typeof window === "undefined") return null;
    // @ts-ignore
    if (window.Stripe) return window.Stripe(this.config?.publishableKey);

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = () => {
        // @ts-ignore
        resolve(window.Stripe(this.config?.publishableKey));
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
}

// ─── Unified Payment Gateway ─────────────────────────────────────────────────

export class PaymentGateway {
  private static instance: PaymentGateway;
  private stripe = new StripeCheckout();
  private stripeConfigured = false;

  static getInstance(): PaymentGateway {
    if (!PaymentGateway.instance) {
      PaymentGateway.instance = new PaymentGateway();
    }
    return PaymentGateway.instance;
  }

  /**
   * Configura Stripe (opcional — só necessário se Payment Request API não suportar).
   */
  configureStripe(publishableKey: string) {
    this.stripe.configure(publishableKey);
    this.stripeConfigured = true;
  }

  /**
   * Verifica capacidades de pagamento do browser.
   */
  async getCapabilities(): Promise<{
    paymentRequest: boolean;
    cards: boolean;
    googlePay: boolean;
    stripe: boolean;
  }> {
    return {
      paymentRequest: PaymentRequestAPI.isAvailable() || false,
      cards: await PaymentRequestAPI.supportsCards(),
      googlePay: await PaymentRequestAPI.supportsGooglePay(),
      stripe: this.stripeConfigured,
    };
  }

  /**
   * Processa pagamento — tenta Payment Request API primeiro, depois Stripe.
   */
  async pay(item: PaymentItem): Promise<PaymentResult> {
    // 1. Tentar Payment Request API (nativo, sem dependências)
    const caps = await this.getCapabilities();
    if (caps.googlePay) {
      const result = await PaymentRequestAPI.requestGooglePayPayment(item);
      if (result.success) return result;
    }
    if (caps.cards) {
      const result = await PaymentRequestAPI.requestCardPayment(item);
      if (result.success) return result;
    }

    // 2. Fallback: Stripe Checkout
    if (caps.stripe) {
      return this.stripe.createCheckoutSession(
        [item],
        `${window.location.origin}/payment/success`,
        `${window.location.origin}/payment/cancel`
      );
    }

    // 3. Nenhum método disponível
    return {
      success: false,
      method: "mock",
      error: "Nenhum método de pagamento disponível neste browser",
    };
  }
}

// Singleton
export const paymentGateway = PaymentGateway.getInstance();
