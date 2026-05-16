import express from "express";
import cors from "cors";
import crypto from "crypto";
import { join } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ─── Lightning Invoice Store (in-memory) ─────────────────────────────────────

const invoices = new Map();

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    network: "bitcoin-lightning",
    invoices: invoices.size,
    timestamp: Date.now(),
  });
});

// ─── Create Lightning Invoice ────────────────────────────────────────────────

app.post("/api/lightning/create", async (req, res) => {
  try {
    const { amount, currency, label } = req.body;

    // Converter fiat para satoshis
    const btcPrices = { BRL: 350000, USD: 65000, EUR: 60000 };
    const price = btcPrices[currency] || btcPrices.USD;
    const btcAmount = parseFloat(amount) / price;
    const amountSat = Math.round(btcAmount * 100000000);

    // Gerar invoice BOLT11 simulado
    const paymentHash = crypto.randomBytes(32).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const invoice = `lnbc${amountSat.toString(16)}${timestamp}${paymentHash.slice(0, 32)}`;

    // Armazenar
    const invoiceData = {
      id: crypto.randomUUID(),
      invoice,
      paymentHash,
      amountSat,
      amount,
      currency,
      label: label || "ETΞRNET Purchase",
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hora
    };

    invoices.set(invoiceData.id, invoiceData);

    res.json({
      id: invoiceData.id,
      invoice: invoiceData.invoice,
      amountSat: invoiceData.amountSat,
      paymentHash: invoiceData.paymentHash,
      expiresAt: invoiceData.expiresAt,
    });
  } catch (err) {
    console.error("[Lightning] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Check Invoice Status ────────────────────────────────────────────────────

app.get("/api/lightning/status/:id", (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice não encontrada" });
  }

  // Verificar expiração
  if (Date.now() > invoice.expiresAt) {
    invoice.status = "expired";
  }

  res.json({
    id: invoice.id,
    status: invoice.status,
    amountSat: invoice.amountSat,
    confirmations: invoice.status === "confirmed" ? 6 : 0,
  });
});

// ─── Webhook (para LNbits, LND, etc) ────────────────────────────────────────

app.post("/api/lightning/webhook", (req, res) => {
  try {
    const { paymentHash, status } = req.body;

    // Encontrar invoice pelo paymentHash
    for (const [id, invoice] of invoices) {
      if (invoice.paymentHash === paymentHash) {
        invoice.status = status || "confirmed";
        console.log(`[Lightning] Pagamento ${invoice.status}: ${id}`);
        break;
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("[Lightning] Webhook error:", err.message);
    res.sendStatus(200);
  }
});

// ─── Create Bitcoin Address ──────────────────────────────────────────────────

app.post("/api/bitcoin/create", (req, res) => {
  try {
    const { amount, currency } = req.body;

    const btcPrices = { BRL: 350000, USD: 65000, EUR: 60000 };
    const price = btcPrices[currency] || btcPrices.USD;
    const btcAmount = parseFloat(amount) / price;
    const amountSat = Math.round(btcAmount * 100000000);

    // Gerar endereço bech32 simulado
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let address = "bc1q";
    for (let i = 0; i < 38; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }

    const addressData = {
      id: crypto.randomUUID(),
      address,
      amountSat,
      amount,
      currency,
      status: "pending",
      createdAt: Date.now(),
    };

    invoices.set(addressData.id, addressData);

    res.json({
      id: addressData.id,
      address: addressData.address,
      amountSat: addressData.amountSat,
      amountBTC: (amountSat / 100000000).toFixed(8),
    });
  } catch (err) {
    console.error("[Bitcoin] Erro:", err.message);
    res.status(500).json({ error: err.message });
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
  console.log(`   Network: Bitcoin + Lightning`);
  console.log(`   Sem intermediário, sem KYC, sem rastro`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
