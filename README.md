# ETΞRNET

> Privacy-first financial infrastructure. No servers. No identity. No trace.

## What is this?

ETΞRNET is a decentralized privacy stack combining post-quantum cryptography, zero-knowledge proofs, offline-first mesh networking, and quantum computing into a single browser-based platform. Based on the VOID.pdf architectural specification (Chapters 1-12).

## Architecture (7 Layers)

| Layer | Module | Description |
|-------|--------|-------------|
| 0 - Identity | `ghostid.ts` | Ephemeral identities from biometric entropy + WASM + Argon2id |
| 1 - Fragmentation | `qel.ts` | Shamir Secret Sharing (K=2, N=3) + ChaCha20-Poly1305 |
| 2 - Transport | `distanceBridge.ts` | BLE, LoRa, Acoustic FSK, Nostr/WebRTC |
| 3 - Financial | `utxo.ts` | UTXO model with Pedersen Commitments + Bulletproofs |
| 4 - Consensus | `zkp.ts` | Zero-knowledge proofs via o1js |
| 5 - Cryptographic | `pqc.ts` | ML-KEM-1024 + ML-DSA-87 (post-quantum) |
| 6 - Quantum | `quantum/` | CQR Engine (quimb) + BB84 QKD + QRNG |

## E2EE — Double Ratchet (X25519)

All direct messages use the Signal Protocol's Double Ratchet Algorithm:

- **X25519 ECDH** for key agreement (not SHA3 of public keys)
- **Symmetric-key ratchet** — per-message keys, deleted after use (forward secrecy)
- **DH ratchet** — new keypair per step (post-compromise security)
- **Ed25519 signatures** on every message (authentication)
- **Pre-key bundles** published via NOSTR for offline key exchange

Implementation: `src/crypto/doubleRatchet.ts` (520 lines)

## Modules (40+ crypto, 5 network)

### Crypto
`qel` `utxo` `pqc` `ghostid` `doubleRatchet` `karmaSystem` `chimeraExchange` `doubleSpendDefense` `ghostvpn` `aegisVault` `phantomShopper` `janusFinance` `sovereignPools` `stablecoin` `rwaTokenization` `signingKeys` `mirageCompute` `zkp` `quantumBridge` `collapseFinance` `qrStocks` `homotopyMining` `utuTokens` `retf` `nostrOracle` `nostrDEX` `nostrSync` `socialRecovery` `acousticHandshake` `sphinx` `differentialCore` `paymentGateway` `paleoYield` `hgpuCompute` `ghostMailbox` `octreeSdf` `ghostLocker` `gpuMiner` `qrng`

### Scientific Engines
- **Collapse Algebra** (`collapse/collapseAlgebra.ts`) — Action functional S[phi], irreversibility I = D_KL, defect density
- **LSC Engine** (`lsc/lscEngine.ts`) — 3 Laws of Bruno, modal coherence, saturation curves
- **Anacroclastia** (`paleo/anacroclastia.ts`) — Fossilization, tensor products, paleocomputacao

### Financial Instruments (Chapter 11-12)
- **QR Stocks** — quantum superposition pricing, causal order book
- **Homotopy Mining** — Proof-of-Homotopia with Sobolev metrics
- **UTU Tokens** — universal tokenization (sites, software, physical objects)
- **rETF** — relativistic ETFs with causal rebalancing
- **CCB** — Collateralized Collapse Bonds (stress-indexed coupons)
- **HSV** — Hysteresis Savings Vault (time-dependent penalties)
- **Coherence Bonds** — yield = f(coherence measure)
- **Scar Tokens** — defect-field backed tokens
- **Coherence Swaps** — bilateral coherence exchange

### Network
`acousticDriver` (18-20kHz FSK) | `loraDriver` (AT commands) | `nostrMesh` (6 relays, health monitor, failover, reconnection) | `localDrivers` (BLE/NFC/Serial) | `NativeBridge` (Capacitor)

### Storage
`hcnStore` (OPFS + IndexedDB, 48h TTL) | `utxoStore` (Dexie ORM)

## UI Panels (55+)

Every module has a dedicated panel accessible from the navigation. Panels are organized into sections:

- **Crypto Labs** — UTXO, ZKP, PQC, Karma, Mining, Stablecoin, DEX, Phantom Shopper
- **Science** — Collapse Algebra, LSC, Anacroclastia, Homotopy Mining, Animus
- **Headless Modules (Cap. 13)** — QRNG, NostrOracle, SocialRecovery, AcousticHandshake, Sphinx, DifferentialCore, PaymentGateway, PaleoYield, NostrDEX, HGPUCompute, GhostMailbox, OctreeSDF, NostrSync, GhostLocker, GPUMining

## Tests

```bash
npm test   # 240 tests passing across 12 test files
```

Coverage includes: Double Ratchet E2EE, UTXO, GhostID, NOSTR transactions, collapse finance, QR stocks, homotopy mining, UTU tokens, LSC engine, collapse algebra, anacroclastia, secure random.

## Quick Start

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Tests
npm test

# Android APK
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug

# Quantum backend (optional)
cd quantum
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python server.py
# API docs: http://localhost:8472/docs
```

## Production Deploy

The project runs as 3 independent services:

| Service | Port | Command |
|---------|------|---------|
| Node.js Express (API + SPA) | 3001 | `node server/server.js` |
| Python Quantum Backend | 8472 | `cd quantum && python server.py` |
| Frontend (build output) | — | `npm run build` → `dist/` |

### Single-machine deployment

```bash
# Build frontend
npm install && npm run build

# Set up server
cd server && cp .env.example .env && npm install && cd ..

# (Optional) Set up quantum backend
cd quantum && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cd ..

# Start services
node server/server.js &                     # :3001 — API + static files
cd quantum && python server.py &            # :8472 — quantum backend
```

Access at `http://localhost:3001`. The quantum backend is optional (only for CQR, BB84, spin networks).

### Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `VITE_IBM_QRNG_API_KEY` | Frontend (build-time) | IBM Quantum QRNG |
| `VITE_NOSTR_RELAYS` | Frontend (build-time) | Custom NOSTR relays |
| `MP_ACCESS_TOKEN` | Server | Mercado Pago payments |
| `PORT` | Server | Listen port (default 3001) |

### PWA / Offline

The app is a full PWA with offline support. The service worker:
- Caches all static assets (cache-first strategy)
- Handles `/api/eternet/*` routes entirely in-browser via IndexedDB
- Supports cross-tab mesh peer discovery via BroadcastChannel
- Falls back to `/index.html` when offline

### NOSTR Relay Failover

6 public relays with automatic health monitoring:
- `wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.primal.net`
- `wss://relay.snort.social`, `wss://nostr.wine`, `wss://relay.nostr.band`

Health check every 30s. Unhealthy relays are excluded after 3 consecutive failures. Relay discovery via NOSTR kind 10002.

## Quantum Backend

Real quantum computing via Python + quimb tensor networks:

- **CQR Engine:** Bell states, CHSH test (S=2√2), Pachner moves
- **BB84 QKD:** Full protocol with sifting, QBER check, privacy amplification
- **QRNG:** Quantum random numbers from Bell state measurements + ANU API fallback

```python
from quantum.cqr_engine import CQREngine
engine = CQREngine()
pair = engine.create_entangled_pair("phi_plus")
print(f"CHSH S = {pair['chsh']['S_value']:.3f}")  # 2.828
```

### Lua Plugins
`collapse_strategy.lua` `ghost_strategy.lua` `homotopy_validator.lua` `lsc_monitor.lua` `vhgpu_farm.lua`

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome/Edge | Full (BLE, Serial, NFC) |
| Firefox | Core features (no BLE/Serial) |
| Safari | Core features (no BLE/Serial/NFC) |
| Android WebView | Full (Capacitor APK) |

## Tech Stack

- **Frontend:** React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4
- **Crypto:** @noble/curves (X25519, Ed25519) + @noble/hashes (SHA3, Argon2) + @noble/ciphers (ChaCha20-Poly1305) + @noble/post-quantum (ML-KEM, ML-DSA)
- **ZK Proofs:** o1js (SnarkyJS)
- **WASM:** Rust `void_core` (SHA3, Ed25519, Bulletproofs, ML-KEM, ML-DSA, Blake3)
- **Storage:** Dexie (IndexedDB) + OPFS (HCN)
- **Android:** Capacitor 8
- **Quantum:** Python + FastAPI + quimb + numpy/scipy
- **Network:** nostr-tools (NOSTR relays) + WebRTC (P2P mesh)

## License

Research purposes only.
