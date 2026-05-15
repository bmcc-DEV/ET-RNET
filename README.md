# ETΞRNET

> "Where money becomes invisible, control becomes impossible."

A privacy-first decentralized ecosystem built as a PWA with a Rust/WASM cryptographic core. The browser becomes a sovereign node capable of phantom communication, physical asset tokenization, and anonymous financial settlement.

---

## Architecture — 7 Layers

| Layer | Name | Description |
|-------|------|-------------|
| 0 | **Social Fabric** | P2P messaging fragmented via QEL (Shamir SSS + ChaCha20-Poly1305) |
| 1 | **RWA Tokenization** | Physical asset tokenization with mesh witness protocol + Ed25519 attestations |
| 2 | **DEX (Chimera Exchange)** | Blind matching engine with VRF-elected matcher rounds |
| 3 | **ANIMUS** | Persistent background execution via Service Workers + steganographic persistence |
| 4 | **Stablecoin Local** | Credit Vaults for $ETBRL, $ETARS, $ETUSD with 150% collateralization |
| 5 | **P2P Fiat Ramp** | Blind Karma Tokens with Pedersen commitments + epoch rotation |
| 6 | **HGPU** | Homotopic Geometrical Stream rendering via WebGL SDF raymarching |

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + Vite
- **Crypto Core:** Rust/WASM (`void_core`) — Pedersen Commitments, Bulletproofs, Ed25519, Blake3
- **Crypto Libraries:** @noble/hashes, @noble/ciphers, @noble/curves, @noble/post-quantum
- **ZK Circuits:** o1js (Mina Protocol)
- **Network:** Nostr + WebRTC P2P, Web Bluetooth, Web NFC, LoRa (Web Serial), Acoustic FSK
- **Storage:** OPFS (shards), Dexie/IndexedDB (UTXOs), Service Worker cache
- **Mobile:** Capacitor (Android)

## Crypto Modules

| Module | Status | Description |
|--------|--------|-------------|
| `gf256.ts` | Production | GF(256) Galois Field arithmetic (shared) |
| `qel.ts` | Production | QEL Protocol — Shamir K=2/N=3 + ChaCha20-Poly1305 |
| `cryptoTestament.ts` | Production | Shamir K=3/N=5 + Argon2id + dead man's switch |
| `pqc.ts` | Production | Post-quantum: ML-KEM-1024 (Kyber) + ML-DSA-87 (Dilithium) |
| `antiSybil.ts` | Production | PoW hashcash + VDF + token bucket rate limiting |
| `matchmaker.ts` | Production | Blind order fragmentation + commit-reveal matching |
| `sphinx.ts` | Production | Onion-routed Sphinx packets + ChaCha20-Poly1305 |
| `temporalOracle.ts` | Production | Time-locked intents + Ed25519 + delta-neutral hedges |
| `ghostvpn.ts` | Production | 7-layer VPN with QEL fragmentation + MAC rotation |
| `econet.ts` | Production | Decaying DHT with fossilization + forgetting proofs |
| `aegisVault.ts` | Production | Entropy convergence vault + ChaCha20-Poly1305 |
| `utxo.ts` | Production | Pedersen commitments (Ed25519) + balance proofs + Bulletproofs |
| `karmaSystem.ts` | Production | Blind Karma Tokens with Pedersen + epoch rotation |
| `chimeraExchange.ts` | Production | VRF-elected matcher rounds + liquidity pools |
| `sovereignPools.ts` | Production | Governance pools + ZK voting with nullifiers |
| `janusFinance.ts` | Production | UTXO-based neobank + virtual cards + PIX |
| `phantomShopper.ts` | Production | Anonymous purchase flow + live exchange rates |
| `stablecoin.ts` | Production | Credit Vaults + P2P fiat ramp |
| `supplyChain.ts` | Production | Provenance registry + community kill switch |
| `sovTokenomics.ts` | Production | Adaptive difficulty + staking + network telemetry |
| `ghostid.ts` | Production | Ed25519 key derivation via WASM |
| `doubleSpendDefense.ts` | Production | Inline WASM + GF(256) algebra + slashing |
| `rwaTokenization.ts` | Production | Asset tokenization + fractionalization + Ed25519 witnesses |
| `mirageCompute.ts` | Production | Code fragmentation + WebAssembly enclave execution |
| `signingKeys.ts` | Production | Node signing key derivation (HKDF-SHA3-512) |
| `zkp.ts` | Production | o1js ZK circuit (HydraBalanceProof) |

## Network Drivers

| Driver | Protocol | Status |
|--------|----------|--------|
| NostrMesh | NIP-04 + WebRTC | Production |
| BluetoothDriver | Web Bluetooth GATT | Production |
| NFCDriver | Web NFC (NDEFReader) | Production |
| SerialUWBDriver | Web Serial API | Production |
| LoRaDriver | AT commands (Reyax/Ebyte) | Production |
| AcousticDriver | Ultrasonic FSK (18.5/19.5 kHz) | Production |

## Quick Start

```bash
npm install
npm run dev        # Launch local sovereign node
npm run build      # Production build (355 KB main bundle)
```

## Build Output

```
dist/
  index.html                    1.6 KB
  assets/void_core_bg.wasm    266 KB (gzip: 103 KB)
  assets/index.css             60 KB (gzip: 11 KB)
  assets/vendor-react.js      11 KB (gzip: 4 KB)
  assets/index.js            355 KB (gzip: 116 KB)
  + 32 lazy-loaded chunks (crypto modules)
```

## Project Structure

```
src/
  crypto/          26 modules — cryptographic primitives + protocols
  components/      43 components (28 lazy-loaded)
  network/         5 drivers — BLE, NFC, UWB, LoRa, acoustic
  core/            VoidOrchestrator + PowerGovernor
  storage/         OPFS + IndexedDB persistence
  omega/           Steganography + deep research
  social/          P2P messaging (E2EE)
  paleo/           Binary archaeology engine

void_core/         Rust/WASM — Pedersen, Bulletproofs, Ed25519, Blake3
public/            Service Worker + PWA manifest
```

## Security

- **Zero-Disk Policy:** RAM-only with 48h TTL auto-sweep
- **Post-Quantum Ready:** ML-KEM-1024 + ML-DSA-87 hybrid encryption
- **E2EE by Default:** All DMs encrypted with ChaCha20-Poly1305
- **Blind Signatures:** Karma tokens use Pedersen commitments
- **No Hardcoded Keys:** All signing keys derived per-node via HKDF

## License

See [LICENSE](LICENSE) for details.
