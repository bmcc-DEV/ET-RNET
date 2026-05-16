# ETΞRNET — Project Context

## What is this
Decentralized financial platform with privacy-first UTXO system, post-quantum cryptography, DAO governance, and NOSTR-based networking. PWA + Android (Capacitor).

## Quick start
```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build
npm run test       # Vitest tests
npx tsc --noEmit   # Type check
```

## Architecture
- `src/crypto/` — Cryptographic modules (UTXO, PQC, ZKP, GhostID, etc.)
- `src/core/` — VoidOrchestrator, PowerGovernor
- `src/network/` — NOSTR mesh, LoRa, BLE, acoustic drivers
- `src/storage/` — IndexedDB (Dexie), OPFS
- `src/components/` — React panels (lazy-loaded)
- `src/social/` — SocialFabric (ChaCha20 E2EE)
- `quantum/` — Python FastAPI quantum backend
- `void_core/` — Rust→WASM (Bulletproofs, Ed25519, Pedersen)
- `contracts/` — Solidity (ETRNETAnchor on testnet)

## Key patterns
- Singletons with `getInstance()`
- `crypto.getRandomValues()` everywhere (never Math.random)
- `@noble/*` for crypto (SHA3, Ed25519, ChaCha20, ML-KEM, ML-DSA)
- WASM via void_core for performance-critical operations
- NOSTR as message bus (kind 31214-31219 for ETRNET protocol)
- Brazilian Portuguese for JSDoc and comments

## What's real vs simulated
- REAL: Pedersen commitments, Bulletproofs, PQC, GhostID, UTXO, NOSTR mesh, AntiSybil (PoW+VDF), QEL (Shamir+GF256)
- SIMULATED: Lightning payments (server/server.js), some mining (PoW faucet is real)
- PLACEHOLDER: IBM QRNG (needs API key), NativeBridge (needs Capacitor plugin)

## Strict mode
`tsconfig.json` has `strict: true`, `noUnusedLocals`, `noUnusedParameters`. Prefix unused params with `_`.

## Build
Vite + React + Tailwind + Capacitor (Android). WASM loaded from void_core/pkg/.
