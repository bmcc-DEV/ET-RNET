---
tags: [void, etrnet, implementacao, auditoria, status]
created: 2026-05-17
status: fechamento
source: [DOC/, src/, quantum/, void_core/, contracts/]
---

# VOID - Realidade do Código

Esta matriz separa "existe no código" de "pronto para produção". Um módulo pode estar implementado e ainda depender de hardware, relays, servidor local ou auditoria.

## Real e implementado

| Conceito | Evidência | Status real |
|---|---|---|
| GhostID Engine | `src/crypto/ghostid.ts`, `void_core/src/lib.rs`, `src/crypto/fuzzyExtractor.ts` | Implementado. Usa WASM, Argon2id, entropia biométrica, X25519 e fallback CSPRNG quando CQR está offline. |
| Fuzzy Extractor | `src/crypto/fuzzyExtractor.ts` | Implementado. Estabiliza biometria ruidosa via quantização, repetição R=7 e SHA3-512. Precisa de testes dedicados. |
| QEL | `src/crypto/qel.ts`, `src/crypto/gf256.ts` | Implementado. Shamir K=2/N=3 real sobre GF(256), ChaCha20-Poly1305 e commitments SHA3. |
| PQC | `src/crypto/pqc.ts` | Implementado. ML-KEM-1024 e ML-DSA-87 via `@noble/post-quantum`, com cifragem híbrida ChaCha20-Poly1305. |
| C3 Engine | `src/crypto/c3Engine.ts`, `src/core/VoidOrchestrator.ts` | Implementado como orquestração nova: PQC -> QEL -> rotas -> compressão/fossilização. Ainda sem testes visíveis. |
| UTXO + Pedersen | `src/crypto/utxo.ts`, `void_core/src/lib.rs`, `src/storage/utxoStore.ts` | Implementado. Usa Pedersen, seleção de UTXO, provas WASM/fallback e persistência Dexie. |
| HCN Store | `src/storage/hcnStore.ts` | Implementado. OPFS com fallback IndexedDB, TTL de 48h e karma ledger local. |
| Drivers locais | `src/network/localDrivers.ts` | Implementados contra APIs reais de browser: Web Bluetooth, Web NFC e Web Serial/UWB. Operação depende de browser e hardware. |
| LoRa | `src/network/loraDriver.ts` | Implementado via Web Serial + comandos AT. Precisa de rádio físico e validação em campo. |
| NOSTR Mesh / WebRTC | `src/network/nostrMesh.ts` | Implementado. Relays públicos, health check, discovery e signaling WebRTC. Alguns kinds diferem dos docs. |
| NWC / NIP-47 | `src/crypto/nwcProtocol.ts`, `src/crypto/paymentGateway.ts` | Implementado para wallet externa NWC. É o caminho Lightning real atual. |
| Watchtower | `src/crypto/watchtower.ts` | Implementado com mempool.space API e broadcast de justice tx. Precisa validação com canais reais. |
| Quantum backend local | `quantum/server.py`, `quantum/cqr_engine.py`, `quantum/bb84.py` | Implementado como simulação/engine local com quimb, BB84 e endpoints FastAPI. Não é hardware quântico. |
| Contrato de âncora | `contracts/ETRNETAnchor.sol` | Implementado como contrato Solidity simples para Merkle root, challenge period e DAO multisig. Falta deploy/testnet/script. |

## Parcial ou dependente de ambiente

| Conceito | Evidência | Status real |
|---|---|---|
| DistanceBridge | `src/core/VoidOrchestrator.ts`, `src/network/localDrivers.ts`, `src/network/loraDriver.ts`, `src/storage/hcnStore.ts` | A infraestrutura existe, mas não há um `distanceBridge.ts` dedicado no código atual. A UI usa simulação de rede; o envio real depende dos drivers. |
| BLE advertising | `src/network/localDrivers.ts` | Scan e conexão usam APIs reais, mas advertising/GATT server em browser comum fica limitado e logado como simulação operacional. |
| NFC/UWB | `src/network/localDrivers.ts` | APIs integradas, porém dependem de permissões, browser e hardware compatível. |
| Quantum Bridge | `src/crypto/quantumBridge.ts` | Client real para `localhost:8472`, mas default é `simulated`; offline retorna `null` e GhostID cai para CSPRNG. |
| LDK Bridge | `src/crypto/ldkBridge.ts`, `void_core/src/ldk.rs` | Stub de integração. `payInvoice` ainda retorna "Payment routing not yet implemented". |
| ZK Compressor | `src/crypto/zkCompressor.ts` | Merkle aggregation e fossilização reais; compressão O(1) com STARK recursivo ainda teórica. |
| HGPU/vHGPU | `src/crypto/hgpuCompute.ts`, `src/crypto/differentialCore.ts`, `src/crypto/topologyTracker.ts`, `src/crypto/octreeSdf.ts` | Implementações matemáticas parciais. Ainda não é a HGPU completa do documento. |
| QRC financeiro | `src/qrc/*.ts`, `src/crypto/singularityHarvester.ts` | Redes tensoriais/WebGPU clássicas existem; "vantagem quântica" é explicitamente simulação. |
| DEX/Chimera/SIPs | `src/crypto/nostrDEX.ts`, `src/crypto/chimeraExchange.ts`, `src/crypto/sovereignPools.ts` | Motores locais existem; produção requer liquidação real, rede ativa, testes adversariais e integração econômica. |

## Divergências encontradas entre notas antigas e código

- `vault/03-Transporte/DistanceBridge.md` aponta `src/network/distanceBridge.ts`, mas o arquivo não aparece no código atual. A funcionalidade está distribuída entre orquestrador, drivers e HCN store.
- `vault/05-Financeiro/UTXO Tokens.md` e notas antigas citam `utxoTokens.ts`; o arquivo real atual é `src/crypto/utxo.ts`.
- Algumas notas dizem "PRONTO" para módulos que são tecnicamente implementados, mas ainda dependem de hardware, relays ou servidor local.
- `server/server.js` ainda contém endpoints de Lightning/Bitcoin simulados; o caminho real de pagamento é NWC.

## Regra de leitura daqui para frente

- **Implementado** significa: há código funcional e chamável.
- **Produção** significa: há integração real, teste, ambiente, hardware/serviço necessário e comportamento validado.
- **Simulado** significa: útil para demo, laboratório ou UI, mas não deve ser vendido como infraestrutura real.
- **Teórico** significa: existe como conceito/documento ou modelo matemático, mas ainda não virou sistema operacional.
