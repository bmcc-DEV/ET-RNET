# VØID / ETΞRNET — Mapa Mental Completo

## Núcleo: Identidade Efêmera
- **GhostID Engine** — `ghostid.ts`
  - Entropia: CSPRNG + performance.now() + navigator + WebGL + biométrica passiva
  - Pipeline: entropia → Argon2id (64MB, 3 iter) → Ed25519 keypair → handle `hydra_◆_{hex}`
  - RAM only, zero-fill ao fechar, unicidade < 2^-256
  - **WASM**: `derive_ghost_id()` em `void_core/src/lib.rs`
  - Bug corrigido: buffer 96→168 bytes (overflow do accelerometer)

## Camada 1: Fragmentação (QEL)
- **QEL Protocol** — `qel.ts`
  - Shamir Secret Sharing (K=2, N=3)
  - Cada shard: ChaCha20-Poly1305 com chave única
  - Roteamento MDNF (Maximally Disjoint Non-repeating Flow)
  - Overhead ~3x, latência +20-80ms/salto

## Camada 2: Transporte
- **DistanceBridge** — `distanceBridge.ts`
  - BLE / Wi-Fi Direct / UWB (até 500m)
  - Human Carrier Network (até 50km, minutos-horas)
  - LoRa 868/915 MHz (até 50km)
  - DTN + Satélite LEO (global)
  - Seleção automática de modo

## Camada 3: Rede
- **NOSTR Mesh** — `nostrMesh.ts`
  - Event kinds customizados (31214-31219)
  - Relay health, gossip, node discovery
  - No TLS — assume hostile network
- **NOSTR Lightning Transport** — `lightningNostrTransport.ts`
  - Kind 31340-31349 para mensagens Lightning
  - NIP-44 v2 encryption (X25519 + ChaCha20 + HKDF-SHA256)
  - Relay health checking, node announcements

## Camada 4: Financeiro
- **Payment Gateway** — `paymentGateway.ts`
  - Bridge para gateways externos (BTCPay, Strike, OrbitX/Striga)
  - NWC Integration (NIP-47) via `nwcProtocol.ts`
- **NWC (NIP-47)** — `nwcProtocol.ts`
  - 6 métodos: pay_invoice, make_invoice, get_balance, get_info, list_transactions, lookup_invoice
  - URI parsing, NIP-44 v2 encryption
  - Bug corrigido: isConnected() invertido, SHA3→SHA256 no HKDF
- **nostrDEX** — `nostrDEX.ts`
  - Order book, matching, trade history
  - Event kinds 31215/31216
  - Bug corrigido: matchPrice = sell.price (maker)
- **Chimera Exchange** — `chimeraExchange.ts`
  - Blind matching com fragmentação de ordens em shards
  - Decentralized Order Matching com VRF
  - Bug corrigido: price/amount não expostos no order book
- **Sovereign Pools (SIPs)** — `sovereignPools.ts`
  - Investimento, votação ZK, performance fees
  - Bug corrigido: activateProposal() (pending→voting)
- **Watchtower** — `watchtower.ts`
  - Breach detection via mempool.space API
  - Justice tx broadcast real
  - NOSTR protocol kind 31350/31351
- **UTXO Tokens** — `utxoTokens.ts`
  - Pedersen commitments, nullifiers, bulletproofs

## Camada 5: Criptografia
- **Wallet** — `wallet.ts` (Ed25519)
- **Identity** — `identity.ts` (X3DH key agreement)
- **Stealth Addresses** — `stealthAddress.ts`
- **FROST Threshold** — `frost.ts`
- **Quantum Bridge** — `quantumBridge.ts` (QRNG via vHGPU)
- **Channel Store** — `channelStore.ts` (Dexie IndexedDB)

## Camada 6: Core / Orquestração
- **VoidOrchestrator** — `VoidOrchestrator.ts`
  - Centraliza identidade, memória (HCN), sensação (drivers)
  - Event system unificado
- **NativeBridge** — `NativeBridge.ts` (Android/Linux)
- **Local Drivers** — `localDrivers.ts` (BLE, NFC, UWB)

## Camada 7: Lightning (VØID-LN)
- **LDK Bridge** — `ldkBridge.ts` + `void_core/src/ldk.rs`
  - WASM skeleton (KeysManager + NetworkGraph)
  - ChannelManager ainda não inicializado (TODO)
- **LSP Client** — `lspClient.ts`

## UI (React)
- GhostID Panel, QEL Panel, DistanceBridge Panel
- Nostr Mesh Panel, NOSTR DEX Panel
- Chimera Exchange Panel, Sovereign Pools Panel
- Lightning Payment Panel, Karma Wallet
- HCN Panel, Symbiont Panel, Phantom Shopper
- RWA Tokenization, Stablecoin, ZKP Lab

## Documentação (DOC/)
- VOID.pdf (59p) — Livro do ETRNET (arquitetura completa)
- Hydronia v8.txt — Fusão Hydra + VØID
- VØID·ΩMEGA.txt — Lei física, 7 princípios, 8 layers
- VOID_Conceito_App.docx — Conceito original v0.1
- CQR.pdf, ETΞRNET.pdf, HGPU___vHGPU.pdf — Teoria
- PaleoComputação.pdf — Anacroclastia
- REVOLUÇÂO_DIGITAL.pdf — Visão geral
- SOBERANIA_FINANÇEIRA.pdf — Módulo financeiro
- 5 HTML mockups + 3 SVGs arquitetônicos

## Teoria (não implementada)
- VØID-MEGA: 7 princípios físicos (Heisenberg, no-cloning, causalidade, percolação, Wolfram, Chern, zero-point)
- SYMBIONT: viroide da Web, WASM 47kb, Service Workers, 6 vetores de propagação
- ANIMUS: 7 estratos (LLM weights, eBPF, SGX, browser, network ghost, supply chain, mente emergente)
- HGPU: SDF Engine, Flow Core, Differential Core, Topology Tracker
- QRC: Computação quântico-relativística
- Teoria LSC: Limites e saturação em sistemas coerentes
- Anacroclastia: Paleocomputação, fósseis computacionais
