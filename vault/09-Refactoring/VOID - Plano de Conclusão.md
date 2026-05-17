---
tags: [void, etrnet, plano, conclusao, v1]
created: 2026-05-17
status: fechamento
source: [DOC/, src/, vault/]
---

# VOID - Plano de Conclusão

Objetivo: transformar a massa conceitual da pasta `DOC/` em uma versão fechável, testável e honesta do ETΞRNET.

## Corte recomendado para v1.0

Manter v1.0 pequena e real:

- GhostID + Fuzzy Extractor como identidade efêmera.
- QEL como fragmentação Shamir/ChaCha real.
- C3 como pipeline de envio PQC + QEL + fossilização.
- HCN local com OPFS/IndexedDB.
- NOSTR/WebRTC como alcance global best-effort.
- LoRa/Web Serial e NFC/UWB como drivers dependentes de hardware.
- UTXO + Pedersen + storage.
- Pagamentos via NWC, não via servidor simulado.
- Watchtower como módulo experimental validável.

Tudo fora disso deve ficar marcado como **v2.0+**, **laboratório** ou **teoria**.

## Blueprint de produção soberana (alinhado à filosofia)

Objetivo: operação real sem dependência obrigatória de SaaS wallet/hub.

### Arquitetura alvo (v1 produção)

- ET-RNET como cliente NIP-47 (sem acoplamento a vendor).
- Nó Lightning próprio (`LND` ou `Core Lightning`) sob custódia da operação.
- Bridge NWC self-hosted (controlada pela operação), sem OAuth obrigatório de terceiro.
- Relay Nostr primário próprio + relay de contingência.
- Segredos e chaves fora do código (ENV + vault), com rotação e revogação de sessão.

### Princípios de implementação

- Interface estável: `ET-RNET -> NIP-47 -> provider`.
- Provider é substituível sem refatorar domínio (`PaymentGateway`, `nwcProtocol`, UI).
- Dependências de dev (`Alby Hub`, `LNbits FakeWallet`) não entram como requisito de produção.
- Toda integração externa deve ter fallback, timeout, retry e observabilidade.

### Critério de pronto para produção NWC

- Compatível com pelo menos 2 implementações NIP-47 independentes.
- `connect`, `get_info`, `get_balance`, `list_transactions`, `make_invoice` validados em ambiente real.
- Evidência de execução registrada (JSON de interop + data + relay + versão).
- Política operacional documentada:
  - rotação de credencial NWC
  - revogação imediata
  - orçamento/limites
  - failover de relay

Referência operacional: `[[VOID - Arquitetura NWC Produção Soberana]]`.

## Plano de execução

### Fase 1 - Verdade documental

- Atualizar `[[Mapa Mental]]`, `[[Arquitetura Produção v1.0]]` e `[[Estado do Código]]` com a classificação nova.
- Remover ou corrigir referências a arquivos inexistentes (`distanceBridge.ts`, `utxoTokens.ts` se não forem recriados).
- Adicionar legenda padrão em cada nota: `Real`, `Parcial`, `Simulado`, `Teórico`, `Ausente`.

### Fase 2 - Testes mínimos

- Criar testes para `fuzzyExtractor.ts`: geração, re-extração e tolerância de ruído.
- Criar testes para `c3Engine.ts`: envio, recebimento e falha de assinatura.
- Criar testes para `zkCompressor.ts`: raiz Merkle, fossilização e recuperação.
- Criar testes para `quantumSwitch.ts` e `tensorNetwork.ts`: determinismo, fallback CPU e consistência dimensional.
- Criar teste de integração leve: GhostID -> C3 -> QEL -> HCNStore.

### Fase 3 - Integração real

- Conectar `VoidOrchestrator` com uma API única de transporte, mesmo que internamente use drivers separados.
- Validar NWC contra uma wallet real e registrar compatibilidade.
- Validar LoRa com hardware físico ou mover o módulo para `experimental`.
- Testar NOSTR/WebRTC em dois browsers/dispositivos reais.
- Decidir se o servidor `server/server.js` fica apenas como demo ou se será removido do caminho de produção.

### Fase 4 - Segurança

- Revisar coleta biométrica/microfone: consentimento, fallback e minimização.
- Confirmar zero-fill de chaves sensíveis em GhostID, PQC e C3.
- Auditar persistência OPFS/IndexedDB para evitar guardar segredos em claro.
- Revisar NIP-44/NIP-47 contra implementação de referência.
- Separar logs de debug de produção para não vazar commitments, handles ou payloads.

### Fase 5 - V2 e pesquisa

- LDK real: só reativar quando ChannelManager, roteamento e WASM estiverem funcionais.
- zk-STARK recursivo: substituir Merkle proxy quando houver biblioteca viável.
- HGPU/QRC: manter como laboratório de simulação clássica até existir critério de validação.
- SYMBIONT/ANIMUS/VØID·ΩMEGA: manter como notas teóricas, não como promessa de produto.

## Critério de pronto

Um módulo só vira `PRONTO` se passar por:

- Código integrado e chamável.
- Teste unitário ou integração mínima.
- Falha controlada quando hardware/serviço externo não existe.
- Nota Obsidian com status e limitações.
- Build e typecheck limpos após alteração.

## Próxima revisão sugerida

- Rodar `npm run test`.
- Rodar `npx tsc --noEmit`.
- Atualizar `[[Estado do Código]]` com resultado real, não histórico.
- Marcar as notas antigas que precisam de correção com tag `#revisar`.

## Progresso em 2026-05-17

- Corrigido `src/crypto/fuzzyExtractor.ts`: a re-extração agora recupera uma chave aleatória codificada pelo helper data, em vez de tentar reconstruir uma máscara irrecuperável.
- Criados testes para `fuzzyExtractor.ts`: helper data, re-extração, ruído pequeno e comparação constant-time.
- Criados testes para `zkCompressor.ts`: estado vazio, agregação Merkle, validação estrutural e fossilização/recuperação via EcoNet.
- Criados testes para `src/qrc/`: normalização de amplitudes, shapes de MPS, SVD truncada, contração, valor esperado e Quantum Switch em fallback CPU.
- Validação executada: `npm run test -- src/crypto/fuzzyExtractor.test.ts src/crypto/zkCompressor.test.ts src/qrc/tensorNetwork.test.ts` com 14 testes passando.
- Validação executada: `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - C3/QEL/PQC

- Corrigido `src/crypto/pqc.ts`: `@noble/post-quantum` usa `ml_dsa87.sign(message, secretKey)`, `ml_dsa87.verify(signature, message, publicKey)` e `ml_kem1024.decapsulate(ciphertext, secretKey)`.
- Corrigido `src/crypto/c3Engine.ts`: a assinatura ML-DSA agora é verificada com `senderMLDSAPubKey`, separada de `senderMLKEMPubKey`.
- Atualizado `src/core/VoidOrchestrator.ts` para retornar também `senderMLDSAPubKey` nos envios PQC.
- Corrigido `src/crypto/gf256.ts`: removida tabela baseada em gerador inadequado e substituída por multiplicação GF(256) direta + inverso por `a^254`.
- Criados testes para `qel.ts`: inverso GF(256), reconstrução Shamir com quaisquer 2 de 3 shares, fragmentação/reconstituição AEAD, detecção de commitment adulterado e rotas disjuntas.
- Criados testes para `c3Engine.ts`: health check, roundtrip PQC+QEL+ML-DSA, assinatura adulterada, compressão/fossilização ZK e base64 chunked.
- Validação executada: `npm run test -- src/crypto/fuzzyExtractor.test.ts src/crypto/zkCompressor.test.ts src/qrc/tensorNetwork.test.ts src/crypto/qel.test.ts src/crypto/c3Engine.test.ts` com 24 testes passando.
- Validação executada: `npx tsc --noEmit` sem erros após os ajustes.

## Progresso em 2026-05-17 - DistanceBridge unificado

- Criado `src/network/distanceBridge.ts` para centralizar seleção de canal e fallback entre `BLE`, `LoRa`, `HCN_MESH` e `WEBRTC`.
- Integração aplicada no `src/core/VoidOrchestrator.ts`: envio de shard agora usa `DistanceBridge.routeShard(...)` em vez de lógica espalhada.
- Mantido `sender` no broadcast de malha local (`meshSender`) para preservar rastreamento de origem no receiver.
- Criados testes em `src/network/distanceBridge.test.ts` cobrindo canal preferido, fallback por falha e fallback por indisponibilidade.
- Validação executada: `npm run test -- src/network/distanceBridge.test.ts src/crypto/c3Engine.test.ts src/crypto/qel.test.ts` com 14 testes passando.
- Validação executada: `npx tsc --noEmit` sem erros após integração.

## Progresso em 2026-05-17 - Telemetria de transporte

- Evoluído `src/network/distanceBridge.ts` com telemetria agregada por canal (`attempts`, `successes`, `failures`) e métricas globais (`totalRouted`, `totalFallbacks`).
- `routeShard(...)` agora retorna também `preferred` e `fallbackUsed`, além do canal escolhido e lista de tentativas.
- Expostas APIs `getMetrics()` e `resetMetrics()` no `DistanceBridge`.
- Expostas APIs no `VoidOrchestrator`: `getTransportMetrics()` e `resetTransportMetrics()`.
- Adicionados avisos de fallback no envio do `VoidOrchestrator` para facilitar diagnóstico de degradação de canal.
- Testes atualizados em `src/network/distanceBridge.test.ts` para validar métricas e reset.
- Validação executada: `npm run test -- src/network/distanceBridge.test.ts` com 5 testes passando.
- Validação executada: `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Painel UI de telemetria

- Integrado o painel `src/components/DistanceBridge.tsx` com telemetria real do `DistanceBridge` via `orchestrator.getTransportMetrics()`.
- Exibição em tempo real (refresh periódico + atualização em eventos de shard).
- Métricas exibidas:
  - `totalRouted`
  - `totalFallbacks`
  - `fallbackRate`
  - `attempts/successes/failures` por canal (`BLE`, `LoRa`, `HCN_MESH`, `WEBRTC`).
- Adicionado botão `RESET METRICS` no próprio painel (`orchestrator.resetTransportMetrics()`).
- Validação executada com testes focados de transporte e typecheck sem erros.

## Progresso em 2026-05-17 - Gráfico temporal de roteamento

- Evoluída telemetria no `DistanceBridge` com histórico temporal (`recentRoutes`) contendo:
  - timestamp
  - canal preferido
  - canal selecionado
  - se houve fallback
  - quantidade de tentativas
  - duração do roteamento (ms)
- Janela deslizante limitada aos 40 eventos mais recentes para evitar crescimento indefinido.
- Painel `DistanceBridge.tsx` atualizado com visual temporal dos últimos 24 eventos, destacando fallback e canal vencedor.
- Testes ampliados em `distanceBridge.test.ts` para validar janela temporal e reset de histórico.
- Validação executada:
  - `npm run test -- src/network/distanceBridge.test.ts` com 6 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Filtros e tendência móvel

- Painel temporal em `src/components/DistanceBridge.tsx` evoluído com filtros de:
  - canal (`ALL`, `BLE`, `LoRa`, `HCN_MESH`, `WEBRTC`)
  - janela (`12`, `24`, `40` eventos)
- Adicionada curva de tendência (`rolling fallback rate`) com janela móvel de 5 eventos para visualizar degradação recente.
- Mantido comportamento reativo com base em `recentRoutes` e atualização periódica existente.
- Validação executada:
  - `npm run test -- src/network/distanceBridge.test.ts` com 6 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Teste integração GhostID -> C3 -> QEL -> HCN

- Criado `src/core/ghostC3QelHcn.integration.test.ts` cobrindo fluxo leve ponta-a-ponta:
  - `spawnGhostId()` (com mocks já existentes de WASM/quantum no setup de testes)
  - `C3Engine.send(...)` para cifragem + fragmentação QEL
  - persistência de shards no `HCNStore` (mock OPFS em memória no teste)
  - recuperação de shards válidos e `C3Engine.receive(...)` no receptor
- O teste valida a reconstituição exata do payload e cobre persistência/recuperação do HCN no caminho nominal.
- Validação executada:
  - `npm run test -- src/core/ghostC3QelHcn.integration.test.ts` com 1 teste passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Harness NWC/NIP-47

- Evoluído `src/crypto/nwcProtocol.ts` com suporte a harness de compatibilidade por injeção:
  - `poolFactory`
  - `requestIdFactory`
  - `serializeRequestContent`
  - `parseResponseEvent`
- Adicionado erro estruturado `NWCClientError` com `code` e `method`, cobrindo timeout, desconexão e erros NIP-47 da wallet.
- Fluxos `payInvoice`, `makeInvoice`, `getBalance`, `getInfo`, `listTransactions` e `lookupInvoice` agora normalizam erro via `NWCClientError`.
- Testes em `src/crypto/nwcProtocol.test.ts` ampliados para validar:
  - timeout de request (`TIMEOUT`)
  - erro NIP-47 mapeado (`PAYMENT_REJECTED`)
  - caminho de sucesso com resposta mockada
  - rejeição de pendências no `disconnect` (`DISCONNECTED`)
- Validação executada:
  - `npm run test -- src/crypto/nwcProtocol.test.ts` com 9 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - UX de erros NWC no Gateway

- Evoluído `src/crypto/paymentGateway.ts` para mapear erros NWC estruturados em retorno de alto nível:
  - novos campos em `PaymentResult`: `errorCode` e `errorHint`
  - mapeamento amigável por código (`INSUFFICIENT_BALANCE`, `PAYMENT_REJECTED`, `TIMEOUT`, etc.)
- Adicionado `mapNwcError(...)` para normalizar erros conhecidos e desconhecidos.
- Atualizado `src/components/PaymentGatewayPanel.tsx` para exibir:
  - código técnico do erro (quando existir)
  - dica operacional (`errorHint`) para resolução rápida
- Criado `src/crypto/paymentGateway.test.ts` validando:
  - mapeamento de código conhecido
  - fallback para erro desconhecido
  - fallback para erro não tipado
- Validação executada:
  - `npm run test -- src/crypto/paymentGateway.test.ts src/crypto/nwcProtocol.test.ts` com 12 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Retry/Backoff NWC

- Implementado retry automático no `PaymentGateway` para falhas transitórias:
  - `TIMEOUT`
  - `RATE_LIMITED`
  - `PAYMENT_TIMEOUT`
- Adicionado utilitário `executeWithNwcRetry(...)` com política configurável:
  - `maxRetries` (padrão: 2)
  - `baseDelayMs` (padrão: 250ms)
  - `backoffMultiplier` (padrão: 2)
- `PaymentResult` agora retorna `attempts` para observabilidade de retentativas.
- `PaymentGatewayPanel.tsx` atualizado para exibir tentativas totais/retentativas em logs e no card de resultado.
- Testes ampliados em `src/crypto/paymentGateway.test.ts` para cobrir:
  - recuperação após timeout com sucesso posterior
  - ausência de retentativa para erro não transitório
  - exaustão do limite de retentativas
- Validação executada:
  - `npm run test -- src/crypto/paymentGateway.test.ts src/crypto/nwcProtocol.test.ts` com 15 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Estado operacional no painel NWC

- `PaymentGatewayPanel.tsx` agora exibe estado de operação em tempo real:
  - `idle`
  - `processing`
  - `retrying`
  - `success`
  - `error`
- Integrado callback de retentativa via `PaymentGateway.createPayment(..., { onRetry })`.
- Durante backoff, o painel mostra tentativa atual e próximo delay em ms.
- Logs de terminal agora registram cada retentativa com código (`TIMEOUT`, `RATE_LIMITED`, etc.).
- `paymentGateway.ts` evoluído com `NwcRetryEvent` e `PaymentExecutionOptions`.
- Testes ampliados (`paymentGateway.test.ts`) para validar emissão de callback de retry.
- Validação executada:
  - `npm run test -- src/crypto/paymentGateway.test.ts src/crypto/nwcProtocol.test.ts` com 16 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Spinner e countdown de backoff

- `src/components/PaymentGatewayPanel.tsx` evoluído no estado `retrying` com:
  - spinner visual de operação
  - countdown em tempo real até a próxima tentativa (`x.y s`)
- Adicionado controle reativo de tempo restante (`retryRemainingMs`) com atualização em intervalos curtos.
- Mantida exibição de tentativas totais e código de erro no resultado.
- Validação executada:
  - `npm run test -- src/crypto/paymentGateway.test.ts src/crypto/nwcProtocol.test.ts` com 16 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Testes do SingularityHarvester

- Criado `src/crypto/singularityHarvester.test.ts` cobrindo:
  - Fase 1 (fossil monopoly): identificação de fósseis por significância/decaimento e cálculo de monopoly score.
  - Fase 2 (QRC): caminho lucrativo (`profit_found`) e fallback de erro (`status: error`) com mock de `simulateQuantumSwitch`.
  - Fase 3 (coherence short): geração de swaps/yield quando CDR cruza limiar.
  - Orquestrador `SingularityHarvester`: acumulação de portfólio entre harvests e reset.
- Isso fecha o gap de testes mínimos pendente para `singularityHarvester.ts` da Fase 2.
- Validação executada:
  - `npm run test -- src/crypto/singularityHarvester.test.ts` com 5 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Harness de interop NWC real

- Criado `src/crypto/nwcInteropHarness.ts` para validação estruturada de compatibilidade NIP-47 em wallet real.
- O harness executa checks com relatório (`pass/fail/skipped`) para:
  - `connect`
  - `get_info`
  - `get_balance`
  - `list_transactions`
  - `make_invoice` (opcional)
- Adicionado suporte a timeout por check e resumo consolidado de aprovação/falha.
- Criados testes em `src/crypto/nwcInteropHarness.test.ts` cobrindo:
  - fluxo de sucesso total
  - falha de conexão com `skipped` subsequentes
  - falha parcial com continuidade dos demais checks
- Criada nota operacional `vault/09-Refactoring/VOID - NWC Checklist de Interop Real.md` com critérios mínimos de compatibilidade v1 e template de registro por wallet/relay.

## Progresso em 2026-05-17 - Harness NWC integrado na UI

- `src/components/PaymentGatewayPanel.tsx` evoluído com botão de execução do interop harness:
  - `RUN NWC INTEROP`
  - uso da URI atual preenchida no painel
  - execução isolada com `createNwcInteropHarnessClient()` para não depender da sessão ativa de pagamento
- Adicionada renderização de relatório no próprio painel:
  - resumo `pass/fail/skipped`
  - lista de checks com status por linha (`connect`, `get_info`, `get_balance`, `list_transactions`, `make_invoice`)
- Logs do terminal da UI agora registram início/fim da rodada de validação de interop.
- Validação executada:
  - `npm run test -- src/crypto/nwcInteropHarness.test.ts src/crypto/nwcProtocol.test.ts src/crypto/paymentGateway.test.ts` com 19 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Export de evidência de interop

- `PaymentGatewayPanel.tsx` atualizado com botão `COPY JSON` para copiar o relatório completo de interop NWC.
- Objetivo: facilitar evidência auditável por wallet/relay durante validação real de produção.
- Logs do painel indicam sucesso/falha da cópia para clipboard.

## Progresso em 2026-05-17 - Estabilização do ambiente de dev

- Corrigido registro de Service Worker em `App.tsx`:
  - em ambiente local (`localhost/127.0.0.1`), SW agora é desregistrado automaticamente para evitar cache de chunks antigos e quebra de HMR/hooks.
  - registro mantido para ambiente não local.
- Ajustado `nostrMesh.ts` para modo seguro em dev:
  - malha NOSTR/WebRTC fica desativada por padrão local, reduzindo flood de relay (`rate-limited` / exigência de PoW) durante validação de UI/NWC.
  - pode ser reativada em dev com `localStorage.setItem("VOID_ENABLE_NOSTR_MESH", "true")`.
- Validação executada:
  - `npm run test -- src/crypto/nwcInteropHarness.test.ts src/crypto/nwcProtocol.test.ts src/crypto/paymentGateway.test.ts src/crypto/singularityHarvester.test.ts` com 24 testes passando.
  - `npx tsc --noEmit` sem erros.

## Progresso em 2026-05-17 - Fase de Fechamento Real (testes + AntiHiggs Fase 2)

### Resultados globais
- **397 testes passando / 29 arquivos de teste** (`npx vitest run`)
- `npx tsc --noEmit` sem erros
- Nenhum teste falhando

### AntiHiggs Fase 2 (`src/crypto/antiHiggs.ts`)
- `exportSigned()`: exporta bundle assinado com **HMAC-SHA256** sobre todos os snapshots — transferência auditável entre nós
- `importSigned(bundle, key)`: verifica HMAC, merge sem duplicatas (ID-safe)
- `activateKillSwitch(shards)`: quorum **2-de-3** via **Shamir GF(256)** — reconstrói chave por interpolação de Lagrange e zera o vault se válido
- `getKillSwitchShards()`: retorna os 3 fragmentos para distribuição a custódios independentes

### Novos testes
| Arquivo | Testes | Cobertura |
|---|---|---|
| `src/crypto/antiHiggs.test.ts` | 26 | Fase 1 (CRUD AES-GCM-256 + SHA-256) + Fase 2 (HMAC export/import + quorum kill-switch) |
| `src/core/ghostDock.test.ts` | 28 | Perfis, sessões, audit trail, runtime limits, edge cases |
| `src/qrc/quantumSwitch.test.ts` | 18 | Estrutura de paths causais, colapso, payload, cenários extremos, determinismo |

### Correções
- Timeout do teste de integração `ghostC3QelHcn` aumentado para 20s (timeout padrão de 5s insuficiente para spawn WASM)

## Progresso em 2026-05-17 - VoidProtocol (Daemon OMNI-CAUSAL)

- Criado `src/core/VoidProtocol.ts` — o orquestrador unificado:
  - **Fase 1 (GhostID)**: invoca `spawnGhostId()` com WASM + entropia biométrica real
  - **Fase 2 (Ponte Física)**: conecta NWC real via `nwcClient.connect(uri)` + inicia `CryptoMiner` XMR/RandomX via Stratum local
  - **Fase 3 (Heartbeat Causal)**: loop a cada 2.5s com LSC (`modalCoherence`, `law2Saturation`, `updateGraph`) + fossilização C3 + EcoNet quando coerência > 0.86 (2ª Lei de Bruno) ou arbitragem tensorial aleatória
  - `executeAndFossilize()`: fragmenta via `C3Engine.send()` → `compressState()` → `fossilizeState()` → novo `stateRoot`
  - `halt()` para graciosamente, desconecta NWC e para o miner
  - `getState()` retorna snapshot observável completo
- Criado `src/core/VoidProtocol.test.ts` com **19 testes** (19/19 passando):
  - construção e estado inicial, ignição, heartbeat, fossilização, halt idempotente, modo offline
- TypeScript: `npx tsc --noEmit` sem erros
- Classificação: **Real** (usa APIs reais dos módulos existentes), exceto arbitragem tensorial que é simulada (necessita WebGPU + liquidez real)

## Progresso em 2026-05-17 - AntiHiggs e GhostDock (base soberana)

- Criado `src/crypto/antiHiggs.ts` com vault local de snapshots:
  - cifragem AES-GCM-256
  - digest SHA-256 para integridade
  - leitura/remoção/listagem em memória com política offline-first
- Criado `src/core/ghostDock.ts` com orquestrador local:
  - perfis de execução (`deny_all` por padrão para rede)
  - sessões com limite de runtime
  - parada explícita e trilha de auditoria
- Escopo atual classificado como `Parcial` para produção até integração com runtime/serviços de host e hardening operacional.
- Blueprint registrado em `[[VOID - HiggsGit e GhostDocker]]`.
