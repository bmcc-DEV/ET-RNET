# ETΞRNET v1.0 — Arquitetura de Produção

## Princípio
> Valor e informação são indistinguíveis. Ambos trafegam fragmentados, por caminhos independentes, sem identidade persistente e sem nenhum ponto central de controle.

## O que entra em v1.0

### Prioridade 1 — Identidade (já implementado, funciona)
| Componente | Arquivo | Status | Ação |
|---|---|---|---|
| GhostID Engine | `ghostid.ts` + WASM | **PRONTO** | Corrigido (buffer overflow) |
| QEL Protocol | `qel.ts` | **PRONTO** | Shamir K=2/N=3, MDNF |
| DistanceBridge | `distanceBridge.ts` | **PRONTO** | BLE/WiFi/LoRa/HCN |
| NOSTR Mesh | `nostrMesh.ts` | **PRONTO** | Kind 31214+, relay health |
| Channel Store | `channelStore.ts` | **PRONTO** | Dexie IndexedDB |
| Quantum Bridge | `quantumBridge.ts` | **PRONTO** | QRNG via vHGPU |

### Prioridade 2 — Financeiro (funcional, 5 bugs corrigidos)
| Componente | Arquivo | Status | Ação |
|---|---|---|---|
| Payment Gateway | `paymentGateway.ts` | **PRONTO** | BTCPay/Strike/OrbitX |
| NWC (NIP-47) | `nwcProtocol.ts` | **PRONTO** | 6 métodos, SHA-256 HKDF |
| nostrDEX | `nostrDEX.ts` | **PRONTO** | Maker price, order book |
| Chimera Exchange | `chimeraExchange.ts` | **PRONTO** | Blind matching, shards |
| Sovereign Pools | `sovereignPools.ts` | **PRONTO** | SIPs, votação ZK |
| Watchtower | `watchtower.ts` | **PRONTO** | mempool.space API real |
| UTXO Tokens | `utxoTokens.ts` | **PRONTO** | Pedersen, nullifiers |

### Prioridade 3 — Lightning (parcial, needs WASM rebuild)
| Componente | Arquivo | Status | Ação |
|---|---|---|---|
| LDK Bridge | `ldkBridge.ts` | **STUB** | KeysManager + NetworkGraph OK, ChannelManager TODO |
| LSP Client | `lspClient.ts` | **STUB** | Conecta a LSPs |
| NWC → Lightning | `nwcProtocol.ts` | **PRONTO** | Via NWC (não WASM) |

**Estratégia Lightning v1.0**: Usar NWC (NIP-47) para conectar a wallets externas (Alby, Blixt, Umbrel). O LDK WASM fica para v2.0 quando as crate APIs estabilizarem.

### Prioridade 4 — UI
| Componente | Arquivo | Status |
|---|---|---|
| Onboarding + GhostID | `Onboarding.tsx`, `ActiveTerminal.tsx` | **PRONTO** |
| DEX Panel | `NostrDEXPanel.tsx`, `DEXPanel.tsx` | **PRONTO** |
| Chimera Panel | `ChimeraExchangePanel.tsx` | **PRONTO** |
| Sovereign Pools | `SovereignPoolsPanel.tsx` | **PRONTO** |
| Lightning | `LightningPayment.tsx` | **PRONTO** |
| Karma Wallet | `KarmaWallet.tsx` | **PRONTO** |
| Phantom Shopper | `PhantomShopper.tsx` | **PRONTO** |

## O que NÃO entra em v1.0 (deferido para v2.0+)

| Conceito | Docs | Razão |
|---|---|---|
| VØID-MEGA (7 princípios físicos) | VOID.pdf Ch.2 | Teórico, não implementável em browser |
| SYMBIONT (viroide da Web) | VØID·ΩMEGA.txt | Requer eBPF, SGX, firmware |
| ANIMUS (7 estratos) | VOID.pdf Ch.3 | Requer LLM weights, supply chain |
| HGPU (geometric processing) | VOID.pdf Ch.4 | Requer WebGL compute shaders avançados |
| QRC (quântico-relativístico) | VOID.pdf Ch.5 | Teórico |
| Teoria LSC | VOID.pdf Ch.9 | Teórico |
| Anacroclastia/Paleocomputação | VOID.pdf Ch.10 | Teórico |
| Fusões Financeiras avançadas | VOID.pdf Ch.11-12 | Requer base v1.0 sólida |
| LDK WASM completo | ldkBridge.ts | Crates Rust incompatíveis |
| QKD/CRYSTALS-Kyber | VOID.pdf | Requer hardware quântico |

## Dependências de Build

```
void_core/ (Rust → WASM)
├── lib.rs (GhostID derive_ghost_id)
├── Cargo.toml (curve25519-dalek, sha3, bulletproofs, merlin)
└── pkg/ (wasm-pack build --target web)

src/ (TypeScript → Vite)
├── crypto/ (GhostID, QEL, Wallet, Identity, DEX, Chimera, etc.)
├── network/ (nostrMesh, DistanceBridge, drivers)
├── storage/ (channelStore, hcnStore)
├── core/ (VoidOrchestrator, NativeBridge)
└── components/ (React panels)
```

## Stack de Produção

| Camada | Tecnologia | Versão |
|---|---|---|
| Core | Rust → WASM (wasm-pack) | curve25519-dalek 1.x |
| Crypto | @noble/hashes + @noble/curves | 1.x |
| Transport | Web Bluetooth, WebRTC, WebSocket | Native |
| Mesh | NOSTR (nostr-tools) | SimplePool |
| UI | React 19 + Tailwind CSS | Vite 7.x |
| Storage | Dexie (IndexedDB) | OPFS fallback |
| Lightning | NWC (NIP-47) via NOSTR | Alby/Blixt/Umbrel |

## Fluxo de Dados (v1.0)

```
Usuário
  │
  ├── GhostID (entropia → keypair → handle)
  │
  ├── QEL (msg → 3 shards → 3 caminhos)
  │   ├── BLE/WiFi (local)
  │   ├── HCN (cidade)
  │   └── LoRa (regional)
  │
  ├── NOSTR (relay mesh)
  │   ├── Eventos kind 31214+ (mensagens)
  │   ├── Eventos kind 31340+ (Lightning)
  │   └── Eventos kind 31350+ (watchtower)
  │
  └── Financeiro
      ├── NWC → Lightning (pagamentos)
      ├── nostrDEX (ordens)
      ├── Chimera (blind matching)
      └── SIPs (investimento)
```
