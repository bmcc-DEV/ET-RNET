---
tags: [void, etrnet, nwc, nip47, producao, arquitetura, runbook]
created: 2026-05-17
status: ativo
source: [src/crypto/nwcProtocol.ts, src/crypto/paymentGateway.ts, vault/09-Refactoring/]
---

# VOID - Arquitetura NWC Produção Soberana

Objetivo: operar pagamentos NWC em produção sem dependência obrigatória de SaaS, mantendo custódia e controle operacional da stack.

## Escopo de produção (linha de corte)

- Produção: `ET-RNET + NIP-47 + Lightning próprio + bridge NWC self-hosted + relay Nostr controlado`.
- Fora de produção (dev/homologação): `Alby Hub OAuth`, `LNbits FakeWallet`, relays públicos sem SLA.

Se houver dependência de provedor terceiro para operar o fluxo crítico, classificar como `Parcial`, não `Produção`.

## Arquitetura alvo (v1)

```text
[Cliente ET-RNET]
  -> (NIP-47 requests kind 23194)
[Relay Nostr Primário]
  -> [Bridge NWC Self-Hosted]
  -> [Nó Lightning Próprio (LND/CLN)]

Contingência:
[Cliente ET-RNET] -> [Relay Nostr Secundário] -> [Bridge NWC]
```

## Componentes e responsabilidades

- Cliente ET-RNET
  - Monta requests NIP-47 (`get_info`, `get_balance`, `list_transactions`, `make_invoice`, `pay_invoice`).
  - Controla timeout/retry/backoff e classificação de erro para UI.
  - Não acopla regra de negócio a vendor específico.

- Relay Nostr
  - Transporte de requests/responses NIP-47.
  - Deve ter redundância (primário + contingência).

- Bridge NWC self-hosted
  - Aplica política de autorização e escopo da credencial NWC.
  - Encaminha chamadas para nó Lightning interno.

- Nó Lightning próprio
  - Fonte de verdade de saldo, invoices e pagamentos.
  - Custódia e política operacional sob controle da equipe.

## Política de credenciais NWC

- Escopo mínimo necessário por app.
- Orçamento e limites explícitos.
- Validade controlada (evitar sessão sem governança).
- Revogação imediata testada periodicamente.
- Rotação regular com janela de troca segura.

## SLO operacional mínimo

- Disponibilidade do caminho NWC: >= 99.5% (janela mensal).
- P95 `get_info`/`get_balance`: <= 3s.
- P95 `make_invoice`: <= 5s.
- Taxa de timeout por método: <= 1% em operação normal.

## Runbook de incidentes

### Incidente A: timeout em série (`connect=pass`, métodos=timeout)

1. Verificar saúde do relay primário.
2. Executar harness no relay de contingência.
3. Validar bridge NWC (latência e erro upstream no Lightning).
4. Confirmar credencial NWC ativa e não revogada.
5. Se persistir, cortar tráfego para contingência e abrir incidente.

Critério de causa:
- `responses=0`: problema de relay/bridge/permissão.
- `responses>0` com parse failure: incompatibilidade de payload/protocolo.

### Incidente B: falha de autorização (`UNAUTHORIZED`/`RESTRICTED`)

1. Revogar credencial comprometida.
2. Emitir nova credencial com escopo mínimo.
3. Revalidar `get_info` + `get_balance`.
4. Registrar rotação no log operacional.

### Incidente C: erro de provedor de desenvolvimento (Hub/OAuth)

1. Classificar como incidente de `Dev Infra`, não de produção.
2. Não bloquear release por ambiente de homologação terceiro.
3. Validar no caminho soberano (bridge própria).

## Plano de rollout (sem ruptura)

### Fase 1 - Homologação controlada

- Rodar harness NWC em ambiente dedicado.
- Coletar JSON de evidência por relay e por credencial.

### Fase 2 - Produção assistida

- Ativar primário + contingência.
- Monitorar SLO por 7 dias.

### Fase 3 - Produção plena

- Marcar integração NWC como `Produção` no vault.
- Congelar interface NIP-47 do cliente para evitar regressão por vendor.

## Critério de promoção para `Produção`

- Harness aprovado em duas implementações NIP-47 independentes.
- Revogação e rotação de credencial testadas com sucesso.
- Falha de relay primário com failover validado.
- Evidência operacional registrada (JSON + data + versão + operador).

