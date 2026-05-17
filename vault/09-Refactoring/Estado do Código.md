# Estado do Código — Codebase Map

## Estatísticas
- **Arquivos TS/TSX**: ~115 em `src/`
- **Módulos crypto**: 48 (34 módulos + 14 testes)
- **Componentes UI**: 68 React
- **Testes**: 256/256 passando
- **TSC**: 0 erros
- **WASM**: 265KB (void_core)

## Módulos Crypto (48 arquivos)

### Produção v1.0 (já implementado)
| Módulo | Status | Descrição |
|---|---|---|
| `ghostid.ts` | **PRONTO** | GhostID Engine (WASM + entropia biométrica) |
| `qel.ts` | **PRONTO** | QEL Protocol (Shamir K=2/N=3, MDNF) |
| `gf256.ts` | **PRONTO** | GF(256) Galois Field arithmetic |
| `utxo.ts` | **PRONTO** | UTXO + Pedersen + Bulletproofs + HTLC |
| `pqc.ts` | **PRONTO** | ML-KEM-1024 + ML-DSA-87 (NIST PQC) |
| `doubleRatchet.ts` | **PRONTO** | Signal Protocol (X25519 + ChaCha20) |
| `nostrDEX.ts` | **PRONTO** | DEX order book NOSTR |
| `chimeraExchange.ts` | **PRONTO** | Blind matching + shards |
| `sovereignPools.ts` | **PRONTO** | SIPs + votação ZK |
| `watchtower.ts` | **PRONTO** | Breach detection (mempool.space) |
| `nwcProtocol.ts` | **PRONTO** | NIP-47 (6 métodos) |
| `paymentGateway.ts` | **PRONTO** | BTCPay/Strike/OrbitX |
| `karmaSystem.ts` | **PRONTO** | Reputation token |
| `matchmaker.ts` | **PRONTO** | Order matching engine |

### Implementado (funcional, pode precisar de polish)
| Módulo | Descrição |
|---|---|
| `sphinx.ts` | Sphinx onion routing |
| `signingKeys.ts` | Ed25519 signing keys |
| `supplyChain.ts` | Supply chain security |
| `econet.ts` | DHT over CRDTs |
| `antiSybil.ts` | PoW + VDF + Rate Limiter |
| `gpuMiner.ts` | WebGPU compute shader mining |
| `hgpuCompute.ts` | SDF Engine, spectral compression |
| `topologyTracker.ts` | Reeb graphs, persistence diagrams |
| `differentialCore.ts` | Frechet derivative, Sobolev norm |
| `homotopyMining.ts` | Proof-of-Homotopia |
| `octreeSdf.ts` | Adaptive hierarchical SDF |
| `aegisVault.ts` | Entropy convergence vault |
| `mirageCompute.ts` | Code fragmentation enclaves |
| `cryptoTestament.ts` | Shamir K=3/N=5 testament |
| `stablecoin.ts` | Stablecoin + Credit Vaults |
| `temporalOracle.ts` | Time-locked intents |
| `collapseFinance.ts` | CCB, HSV, Coherence Bond |
| `utuTokens.ts` | Universal Tokenization |
| `powFaucet.ts` | Hashcash emission |
| `quantumDAO.ts` | Quadratic voting DAO |
| `communityTreasury.ts` | Multi-sig treasury |
| `sovTokenomics.ts` | SOV routing rewards |
| `rwaTokenization.ts` | Physical asset tokenization |
| `ghostLocker.ts` | NFC-sealed locker |
| `ghostvpn.ts` | 7-layer VPN |
| `ghostMailbox.ts` | Anonymous messaging |
| `socialRecovery.ts` | Shamir wallet split |
| `phantomShopper.ts` | Privacy shopping |
| `janusFinance.ts` | Dual-face finance |
| `acousticHandshake.ts` | Audio pairing |
| `nostrSync.ts` | NOSTR event sync |
| `nostrOracle.ts` | Decentralized oracle |
| `nostrTransaction.ts` | NOSTR transactions |
| `qrStocks.ts` | QR stock tokens |
| `merkleTree.ts` | Merkle tree |
| `retf.ts` | Real-time token framework |
| `ldkBridge.ts` | LDK WASM bridge |
| `paleoYield.ts` | Yield via collapse theory |
| `doubleSpendDefense.ts` | Hydra double-spend |
| `quantumBridge.ts` | QRNG via vHGPU |
| `qrng.ts` | QRNG interface |

### Teórico (implementado mas não testado em produção)
| Módulo | Descrição |
|---|---|
| `omega/steganography.ts` | Steganography in images |
| `omega/AnimusBootstrap.ts` | ANIMUS parasitic launch |
| `omega/wasmDeepResearch.ts` | Computational analysis |
| `omega/animusSubstrates.ts` | Computation substrates |
| `paleo/PaleoEngine.ts` | Collapse theory |
| `paleo/anacroclastia.ts` | Fragmentation dynamics |
| `collapse/collapseAlgebra.ts` | Collapse algebra |
| `lsc/lscEngine.ts` | Loop Saturation Control |

## Network (6 arquivos)
| Arquivo | Status |
|---|---|
| `nostrMesh.ts` | **PRONTO** — NOSTR+WebRTC mesh |
| `loraDriver.ts` | **PRONTO** — LoRa 868/915MHz via Web Serial |
| `acousticDriver.ts` | **PRONTO** — Acoustic FSK modem |
| `localDrivers.ts` | **PRONTO** — BLE/NFC/UWB |
| `lightningNostrTransport.ts` | **PRONTO** — LN-over-NOSTR |
| `NativeBridge.ts` | **PARCIAL** — Capacitor/Android |

## Storage (3 arquivos)
| Arquivo | Status |
|---|---|
| `utxoStore.ts` | **PRONTO** — Dexie IndexedDB |
| `hcnStore.ts` | **PRONTO** — OPFS + IndexedDB, 48h TTL |
| `channelStore.ts` | **PRONTO** — Channel persistence |

## Core (4 arquivos)
| Arquivo | Status |
|---|---|
| `VoidOrchestrator.ts` | **PRONTO** — Central brain |
| `PowerGovernor.ts` | **PRONTO** — Battery levels 0-4 |
| `useVoid.ts` | **PRONTO** — React hook |
| `useLua.ts` | **PRONTO** — Lua plugin hook |

## UI (68 componentes React)
- Core: Hero, Nav, Footer, Onboarding, ActiveTerminal
- Crypto: ZKPLab, DoubleSpendDefenseLab, AntiSybilLab, QRNGPanel
- DeFi: DEXPanel, NostrDEXPanel, ChimeraExchangePanel, SovereignPoolsPanel
- Network: DistanceBridge, NostrSyncPanel, EcoNetPanel
- Privacy: GhostVPNPanel, GhostLockerPanel, GhostMailboxPanel
- DAO: QuantumDaoPanel, SocialFabricPanel, AegisVaultPanel
- Feature: PhantomShopperPanel, MirageComputePanel, HGPUComputePanel

## Gap Analysis (docs vs código)

| Conceito nos docs | Implementado? | Observação |
|---|---|---|
| GhostID Engine | **SIM** | WASM + biometria |
| QEL Protocol | **SIM** | Shamir + MDNF |
| DistanceBridge | **SIM** | BLE/WiFi/LoRa/HCN |
| NOSTR Mesh | **SIM** | WebRTC + relays |
| NWC (NIP-47) | **SIM** | 6 métodos |
| nostrDEX | **SIM** | Maker price |
| Chimera Exchange | **SIM** | Blind matching |
| Sovereign Pools | **SIM** | SIPs + votação |
| Watchtower | **SIM** | mempool.space |
| UTXO Tokens | **SIM** | Pedersen + Bulletproofs |
| LDK WASM | **STUB** | KeysManager OK, ChannelManager TODO |
| VØID-MEGA | **NÃO** | Teórico |
| SYMBIONT | **NÃO** | Teórico |
| ANIMUS | **NÃO** | Teórico |
| HGPU | **PARCIAL** | SDF + spectral, não visual |
| QRC | **NÃO** | Teórico |
| Teoria LSC | **NÃO** | Teórico |
| Anacroclastia | **PARCIAL** | Módulo existe, não testado |
