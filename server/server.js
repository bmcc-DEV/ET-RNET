/**
 * ET-RNET Server
 *
 * Modo real:   LND REST API (LND_REST_URL + LND_MACAROON_HEX no .env)
 * Modo fallback: simulação em memória (sem variáveis de ambiente)
 *
 * Para produção soberana:
 *   LND_REST_URL=https://127.0.0.1:8080
 *   LND_MACAROON_HEX=<cat ~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon | xxd -p -c 256>
 *   LND_TLS_SKIP=false  (para TLS auto-assinado em dev: true)
 */

import express from "express";
import cors from "cors";
import crypto from "crypto";
import { join } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// LND REST config
const LND_REST_URL  = (process.env.LND_REST_URL  || "").replace(/\/$/, "");
const LND_MACAROON  = (process.env.LND_MACAROON_HEX || "").trim();
const LND_TLS_SKIP  = process.env.LND_TLS_SKIP === "true";

const HAS_LND = LND_REST_URL.length > 0 && LND_MACAROON.length > 0;

// TLS auto-assinado do LND: desabilitar verificação via variável de ambiente Node
if (LND_TLS_SKIP) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// ─── Fallback em memória ──────────────────────────────────────────────────────

const invoices = new Map();

// Preços BTC aproximados (fallback)
const BTC_PRICES = { BRL: 620000, USD: 105000, EUR: 96000 };

function fiatToSats(amount, currency) {
  const price = BTC_PRICES[currency] || BTC_PRICES.USD;
  return Math.round((parseFloat(amount) / price) * 100_000_000);
}

// ─── LND REST helpers ────────────────────────────────────────────────────────

// Node 22+ tem fetch nativo — sem node-fetch necessário
async function lndGet(path) {
  const res = await fetch(`${LND_REST_URL}${path}`, {
    headers: { "Grpc-Metadata-Macaroon": LND_MACAROON },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LND GET ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function lndPost(path, body) {
  const res = await fetch(`${LND_REST_URL}${path}`, {
    method: "POST",
    headers: {
      "Grpc-Metadata-Macaroon": LND_MACAROON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LND POST ${path} → ${res.status}: ${txt}`);
  }
  return res.json();
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/health", async (req, res) => {
  const base = {
    status: "ok",
    mode: HAS_LND ? "lnd_rest" : "simulation",
    timestamp: Date.now(),
  };

  if (!HAS_LND) {
    return res.json({ ...base, invoices: invoices.size });
  }

  try {
    const info = await lndGet("/v1/getinfo");
    res.json({
      ...base,
      lnd: {
        pubkey:         info.identity_pubkey,
        alias:          info.alias,
        blockHeight:    info.block_height,
        synced:         info.synced_to_chain,
        activeChannels: info.num_active_channels,
        peers:          info.num_peers,
        network:        info.chains?.[0]?.network,
      },
    });
  } catch (err) {
    res.status(503).json({ ...base, status: "lnd_unreachable", error: err.message });
  }
});

// ─── Nó Lightning: informações ───────────────────────────────────────────────

app.get("/api/lightning/info", async (_req, res) => {
  if (!HAS_LND) {
    return res.json({ mode: "simulation", message: "Configure LND_REST_URL e LND_MACAROON_HEX" });
  }
  try {
    const info = await lndGet("/v1/getinfo");
    res.json({
      pubkey:         info.identity_pubkey,
      alias:          info.alias,
      blockHeight:    info.block_height,
      synced:         info.synced_to_chain,
      activeChannels: info.num_active_channels,
    });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// ─── Saldo de canais ─────────────────────────────────────────────────────────

app.get("/api/lightning/balance", async (_req, res) => {
  if (!HAS_LND) {
    return res.json({ mode: "simulation", localSat: 0, remoteSat: 0 });
  }
  try {
    const data = await lndGet("/v1/balance/channels");
    res.json({
      localSat:   parseInt(data.local_balance?.sat  ?? "0", 10),
      remoteSat:  parseInt(data.remote_balance?.sat ?? "0", 10),
    });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// ─── Criar Invoice Lightning ──────────────────────────────────────────────────

app.post("/api/lightning/create", async (req, res) => {
  try {
    const { amount, currency, label, amountSat: directSat } = req.body;

    // Aceita sats direto ou conversão fiat
    const amountSat = directSat ?? fiatToSats(amount, currency);
    const memo = label || "ETΞRNET Payment";

    if (HAS_LND) {
      const data = await lndPost("/v1/invoices", {
        value:  amountSat.toString(),
        memo,
        expiry: "3600",
      });

      const invoiceData = {
        id:          crypto.randomUUID(),
        invoice:     data.payment_request,
        paymentHash: data.r_hash,
        amountSat,
        amount:      amount || amountSat.toString(),
        currency:    currency || "SAT",
        label:       memo,
        status:      "pending",
        createdAt:   Date.now(),
        expiresAt:   Date.now() + 3_600_000,
      };
      invoices.set(invoiceData.id, invoiceData);

      return res.json({
        id:          invoiceData.id,
        invoice:     invoiceData.invoice,
        amountSat:   invoiceData.amountSat,
        paymentHash: invoiceData.paymentHash,
        expiresAt:   invoiceData.expiresAt,
        mode:        "lnd_real",
      });
    }

    // ── Fallback: invoice simulada ──
    const paymentHash = crypto.randomBytes(32).toString("hex");
    const invoiceData = {
      id:          crypto.randomUUID(),
      invoice:     `lnbc${amountSat}n1simulated${paymentHash.slice(0, 16)}`,
      paymentHash,
      amountSat,
      amount:      amount || amountSat.toString(),
      currency:    currency || "SAT",
      label:       memo,
      status:      "pending",
      createdAt:   Date.now(),
      expiresAt:   Date.now() + 3_600_000,
    };
    invoices.set(invoiceData.id, invoiceData);

    res.json({
      id:          invoiceData.id,
      invoice:     invoiceData.invoice,
      amountSat:   invoiceData.amountSat,
      paymentHash: invoiceData.paymentHash,
      expiresAt:   invoiceData.expiresAt,
      mode:        "simulation",
    });
  } catch (err) {
    console.error("[Lightning] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Status de Invoice ───────────────────────────────────────────────────────

app.get("/api/lightning/status/:id", async (req, res) => {
  const invoice = invoices.get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice não encontrada" });
  }

  if (Date.now() > invoice.expiresAt) {
    invoice.status = "expired";
  }

  if (HAS_LND && invoice.paymentHash) {
    try {
      // Consulta status real no LND via r_hash
      const b64 = Buffer.from(invoice.paymentHash, "hex").toString("base64");
      const data = await lndGet(`/v1/invoice/${encodeURIComponent(b64)}`);
      if (data.settled) {
        invoice.status = "confirmed";
        invoice.settledAt = parseInt(data.settle_date, 10) * 1000;
      }
    } catch { /* ignora — usa status em memória */ }
  }

  res.json({
    id:            invoice.id,
    status:        invoice.status,
    amountSat:     invoice.amountSat,
    confirmations: invoice.status === "confirmed" ? 1 : 0,
    settledAt:     invoice.settledAt,
  });
});

// ─── Webhook (LND / LNbits / BTCPay → confirma invoice) ─────────────────────

app.post("/api/lightning/webhook", (req, res) => {
  try {
    const { paymentHash, r_hash, status, settled } = req.body;
    const hash = paymentHash || r_hash;

    for (const [, inv] of invoices) {
      if (inv.paymentHash === hash) {
        inv.status = (status === "confirmed" || settled) ? "confirmed" : (status || "confirmed");
        inv.settledAt = Date.now();
        console.log(`[Lightning] Pagamento ${inv.status}: ${inv.id}`);
        break;
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("[Lightning] Webhook error:", err.message);
    res.sendStatus(200);
  }
});

// ─── Pagar Invoice (proxy para LND) ──────────────────────────────────────────

app.post("/api/lightning/pay", async (req, res) => {
  if (!HAS_LND) {
    return res.status(503).json({ error: "LND não configurado. Defina LND_REST_URL e LND_MACAROON_HEX." });
  }
  try {
    const { bolt11, maxFeeSat = 10 } = req.body;
    const data = await lndPost("/v1/channels/transactions", {
      payment_request: bolt11,
      fee_limit: { fixed: maxFeeSat.toString() },
    });
    if (data.payment_error) {
      return res.status(400).json({ success: false, error: data.payment_error });
    }
    res.json({ success: true, preimage: data.payment_preimage, feeSat: data.fee_sat });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Bitcoin: endereço real via LND on-chain ──────────────────────────────────

app.post("/api/bitcoin/create", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const amountSat = fiatToSats(amount || "0", currency);

    if (HAS_LND) {
      const data = await lndPost("/v1/newaddress", { type: "WITNESS_PUBKEY_HASH" });
      return res.json({
        id:        crypto.randomUUID(),
        address:   data.address,
        amountSat,
        amountBTC: (amountSat / 100_000_000).toFixed(8),
        mode:      "lnd_real",
      });
    }

    // ── Fallback: endereço bech32 simulado (marcado claramente) ──
    const seed = crypto.randomBytes(20).toString("hex");
    const address = `bc1qSIMULATED${seed.slice(0, 20)}`;
    res.json({
      id:        crypto.randomUUID(),
      address,
      amountSat,
      amountBTC: (amountSat / 100_000_000).toFixed(8),
      mode:      "simulation",
      warning:   "Endereço simulado — não usar em mainnet",
    });
  } catch (err) {
    console.error("[Bitcoin] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve static files ──────────────────────────────────────────────────────

const distPath = join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const mode = HAS_LND ? `LND REAL → ${LND_REST_URL}` : "SIMULAÇÃO (defina LND_REST_URL e LND_MACAROON_HEX)";
  console.log(`\n⚡ ET-RNET Server → http://localhost:${PORT}`);
  console.log(`   Modo: ${mode}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
