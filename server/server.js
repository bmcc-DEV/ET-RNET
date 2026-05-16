import express from "express";
import cors from "cors";
import { join } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";

console.log(`[Mercado Pago] Token: ${MP_ACCESS_TOKEN ? "CONFIGURADO" : "NÃO CONFIGURADO"}`);

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mercadopago: !!MP_ACCESS_TOKEN,
    timestamp: Date.now(),
  });
});

// ─── Mercado Pago Checkout Pro ───────────────────────────────────────────────

app.post("/api/mercadopago/create", async (req, res) => {
  try {
    const { title, price, currency, success_url, cancel_url } = req.body;

    if (!MP_ACCESS_TOKEN) {
      return res.json({
        id: `mp_mock_${Date.now()}`,
        init_point: success_url || "https://www.mercadopago.com.br",
        status: "mock",
      });
    }

    // Criar Preference via API Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title: title || "ETΞRNET Purchase",
          quantity: 1,
          unit_price: price,
          currency_id: currency || "BRL",
        }],
        back_urls: {
          success: success_url || `${req.headers.origin}/payment/success`,
          failure: cancel_url || `${req.headers.origin}/payment/cancel`,
          pending: success_url || `${req.headers.origin}/payment/pending`,
        },
        auto_return: "approved",
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
        notification_url: `${req.headers.origin}/api/mercadopago/webhook`,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    const preference = await response.json();

    res.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (err) {
    console.error("[Mercado Pago] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Mercado Pago Webhook ────────────────────────────────────────────────────

app.post("/api/mercadopago/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data?.id;
      if (paymentId && MP_ACCESS_TOKEN) {
        const response = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          { headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` } }
        );
        const payment = await response.json();
        console.log(`[Mercado Pago] Pagamento ${payment.status}: ${paymentId}`);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("[Mercado Pago] Webhook error:", err.message);
    res.sendStatus(200);
  }
});

// ─── Serve static files ──────────────────────────────────────────────────────

const distPath = join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🌐 ET-RNET Server rodando em http://localhost:${PORT}`);
  console.log(`   Mercado Pago: ${MP_ACCESS_TOKEN ? "ATIVO" : "MOCK"}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
