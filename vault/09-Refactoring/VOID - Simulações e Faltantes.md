---
tags: [void, etrnet, simulacao, faltantes, backlog]
created: 2026-05-17
status: fechamento
source: [DOC/, src/]
---

# VOID - Simulações e Faltantes

Lista direta do que ainda não deve ser tratado como produção.

## Simulações explícitas

| Área | Arquivos | O que é simulado |
|---|---|---|
| Lightning/Bitcoin server | `server/server.js` | Invoices BOLT11 e endereços Bitcoin são gerados localmente; não há LND/LNbits/BTCPay real nesse servidor. |
| QRC / Quantum Switch | `src/qrc/quantumSwitch.ts`, `src/qrc/tensorNetwork.ts`, `src/qrc/webgpuTensorEngine.ts` | É álgebra linear clássica e WebGPU; não é computação quântica real nem ordem causal indefinida física. |
| SingularityHarvester Fase 2 | `src/crypto/singularityHarvester.ts` | Front-running QRC é simulação MPS/WebGPU. O próprio arquivo declara isso. |
| Quantum backend | `quantum/cqr_engine.py`, `quantum/server.py` | Simula Bell states, CHSH, BB84 e spin networks com `quimb`/numpy. Não acessa hardware quântico. |
| UI de rede | `src/components/DistanceBridge.tsx`, `src/components/NetworkSimCore.tsx` | Visualização de mesh em tempo real é simulação. |
| Painéis científicos | `src/components/LSCPanel.tsx`, `src/components/AnacroclastiaPanel.tsx`, `src/components/HGPUVisualizer.tsx`, `src/components/TemporalOracleLab.tsx` | Dados e curvas são simulados para laboratório/visualização. |
| Lua fallback | `src/core/useLua.ts` | Usa runtime fake quando `wasmoon` não está disponível. |
| TEE / enclave | `src/crypto/doubleSpendDefense.ts` | Contador TEE é simulação em memória protegida, não SGX/SEV/TrustZone real. |
| Hub OAuth externo | `Alby Hub` (infra externa) | Fluxo OAuth/Hub pode falhar por disponibilidade de terceiro; usar apenas para dev/homologação quando necessário. |
| AntiHiggs / GhostDock (novo) | `src/crypto/antiHiggs.ts`, `src/core/ghostDock.ts` | Implementação inicial real de controle local/criptografado, porém ainda sem integração com runtime de produção e sem hardening de host/OS. |

## Faltantes para v1.0 real

| Item | Prioridade | Fechamento necessário |
|---|---|---|
| Testes dos módulos novos | Alta | Cobrir `c3Engine.ts`, `fuzzyExtractor.ts`, `zkCompressor.ts`, `singularityHarvester.ts` e `src/qrc/*.ts`. |
| Reconciliação das notas antigas | Alta | Atualizar notas que citam arquivos inexistentes ou chamam simulação de pronto. |
| DistanceBridge dedicado | Alta | Criar/renomear módulo de domínio que una BLE/NFC/UWB/LoRa/HCN/NOSTR em API única, ou ajustar as notas para o arranjo atual. |
| NOSTR kinds | Média | Alinhar docs e código: docs citam kinds 31214-31219; `nostrMesh.ts` usa signaling/presença com outros kinds. |
| NWC interop real | Alta | Validar contra Alby, LNbits, Blixt/Mutiny ou wallet NWC real; cobrir timeout, erros e NIP-44 compatível. |
| LDK | Alta para v2 | Implementar ChannelManager/roteamento ou manter oficialmente fora de v1.0. |
| Watchtower em canal real | Alta | Testar com canal Lightning real/regtest, justice tx real e cenário de breach. |
| Contrato ETRNETAnchor | Média | Adicionar scripts de deploy, testes Solidity e política real de DAO/challenge. |
| Build WASM reproduzível | Média | Documentar `wasm-pack`, verificar `void_core/pkg`, tsc e testes após alterações. |
| Segurança operacional | Alta | Auditoria de chaves, zero-fill, permissões de microfone, persistência OPFS/IndexedDB e leak de metadados. |

## Faltantes para produção de campo

| Item | Por que falta |
|---|---|
| BLE advertising real | Web Bluetooth no browser limita GATT server/advertising; precisa Capacitor plugin, app nativo ou hardware bridge. |
| NFC P2P consistente | Web NFC é restrito a poucos ambientes Android/Chrome. |
| UWB real | Web Serial exige transceptor físico e protocolo firmware definido. |
| LoRa real | Driver existe, mas precisa módulo Reyax/Ebyte/Meshtastic, testes de alcance e framing robusto. |
| HCN urbano real | Precisa app instalado, UX de consentimento, limites de storage, política de abuso e métricas de entrega. |
| NOSTR mesh em produção | Precisa testes com relays reais, reconexão, NAT, WebRTC ICE e spam resistance. |
| NWC soberano de produção | Bridge NIP-47 self-hosted + nó Lightning próprio (`LND/CLN`) com política de credenciais e failover de relay. |

## Teoria ou futuro forte

| Conceito | Status |
|---|---|
| VØID·ΩMEGA como lei física | Conceitual. Parte vira heurística de segurança, mas não é implementação verificável hoje. |
| SYMBIONT | Teórico/ético-sensível. Service Worker legítimo é possível; propagação tipo viroid/eBPF/firmware não deve ser tratada como feature de produção. |
| ANIMUS | Teórico. LLM weight steganography, eBPF, SGX global e supply chain não existem no produto atual. |
| QKD real | Ausente. BB84 atual é simulado/local; QKD real requer hardware/canal físico. |
| Energia zero-point / Casimir / TENG / RF harvesting | Ausente. É hardware experimental, não software browser. |
| Proteção topológica de Chern em roteamento | Conceito matemático ainda não implementado como protocolo verificável. |
| zk-STARK recursivo / O(1) ledger | Ausente. Atual é Merkle/O(log N) e fossilização EcoNet. |
| HGPU como hardware | Ausente. Existem módulos matemáticos e visualização, não unidade de processamento física. |

## O que resta depois

1. Fechar a verdade documental: toda nota deve dizer se é produção, parcial, simulação ou teoria.
2. Escolher a linha de corte v1.0: GhostID + QEL + PQC + HCN/NOSTR + UTXO + NWC.
3. Adicionar testes aos módulos novos antes de promover qualquer coisa para "pronto".
4. Rodar validação de build/test/tsc e registrar resultados na vault.
5. Deixar v2.0+ como trilha clara: LDK real, HGPU/QRC avançado, drivers nativos, STARK recursivo e hardware.

## Linha de corte: produção vs infraestrutura de desenvolvimento

- Produção (filosofia soberana): `ET-RNET + NIP-47 + nó Lightning próprio + bridge NWC self-hosted + relay Nostr controlado`.
- Desenvolvimento/homologação: `Alby Hub`, `LNbits FakeWallet`, relays públicos sem SLA.
- Regra de documentação: se depender de SaaS para operar, marcar como `Parcial` ou `Dev Infra`, nunca `Produção`.
