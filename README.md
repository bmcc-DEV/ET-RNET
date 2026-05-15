# ETΞRNET

> Privacy-first financial infrastructure. No servers. No identity. No trace.

## What is this?

ETΞRNET is a decentralized privacy stack combining post-quantum cryptography, zero-knowledge proofs, and offline-first mesh networking into a single browser-based platform.

## Architecture (7 Layers)

| Layer | Module | Description |
|-------|--------|-------------|
| 0 - Identity | `ghostid.ts` | Ephemeral identities from biometric entropy + WASM |
| 1 - Fragmentation | `qel.ts` | Shamir Secret Sharing (K=2, N=3) + ChaCha20-Poly1305 |
| 2 - Transport | `distanceBridge.ts` | BLE, LoRa, Acoustic FSK, Nostr/WebRTC |
| 3 - Financial | `utxo.ts` | UTXO model with Pedersen Commitments |
| 4 - Consensus | `zkp.ts` | Zero-knowledge proofs via o1js |
| 5 - Cryptographic | `pqc.ts` | ML-KEM-1024 + ML-DSA-87 (post-quantum) |
| 6 - Quantum | `quantum/` | CQR Engine (quimb) + BB84 QKD |

## Modules (28 crypto + 5 network)

### Crypto
`qel` `utxo` `pqc` `ghostid` `karmaSystem` `chimeraExchange` `doubleSpendDefense` `ghostvpn` `aegisVault` `phantomShopper` `janusFinance` `sovereignPools` `stablecoin` `rwaTokenization` `signingKeys` `mirageCompute` `zkp` `quantumBridge`

### Network
`acousticDriver` (18-20kHz FSK) | `loraDriver` (AT commands) | `nostrMesh` (NIP-04 + WebRTC) | `localDrivers` (BLE/NFC/Serial) | `NativeBridge` (Capacitor)

### Storage
`hcnStore` (OPFS + IndexedDB, 48h TTL) | `utxoStore` (Dexie ORM)

## Quick Start

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Android APK
cd android && ./gradlew assembleDebug

# Quantum backend (optional)
cd quantum
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python server.py
# API docs: http://localhost:8472/docs
```

## Quantum Backend

Real quantum computing via Python + quimb tensor networks:

- **CQR Engine:** Bell states, CHSH test (S=2√2), Pachner moves
- **BB84 QKD:** Full protocol with sifting, QBER check, privacy amplification
- **QRNG:** Quantum random numbers from Bell state measurements

```python
from quantum.cqr_engine import CQREngine
engine = CQREngine()
pair = engine.create_entangled_pair("phi_plus")
print(f"CHSH S = {pair['chsh']['S_value']:.3f}")  # 2.828
```

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome/Edge | Full (BLE, Serial, NFC) |
| Firefox | Core features (no BLE/Serial) |
| Safari | Core features (no BLE/Serial/NFC) |
| Android WebView | Full (Capacitor APK) |

## Tech Stack

- React 19 + TypeScript + Vite + Tailwind CSS
- Rust/WASM crypto core (`void_core`)
- Noble libraries (curves, hashes, ciphers, post-quantum)
- o1js (ZK proofs)
- Dexie (IndexedDB)
- Capacitor (Android)
- Python/quimb (quantum backend)

## License

Research purposes only.
