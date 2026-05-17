---
tags: [void, etrnet, nwc, nip47, validacao, producao]
created: 2026-05-17
status: ativo
source: [src/crypto/nwcInteropHarness.ts, src/crypto/nwcProtocol.ts]
---

# VOID - NWC Checklist de Interop Real

Objetivo: validar compatibilidade NIP-47 com wallet real sem depender só de mocks.

## Pré-requisitos

- URI NWC real no formato `nostr+walletconnect://...`
- Relay acessível (`wss://...`)
- Wallet com permissões para:
  - `get_info`
  - `get_balance`
  - `list_transactions`
  - `make_invoice` (opcional, mas recomendado)

## Harness disponível

- Módulo: `src/crypto/nwcInteropHarness.ts`
- Função principal: `runNwcInteropHarness(uri, options?)`
- Cobertura do harness:
  - `connect`
  - `get_info`
  - `get_balance`
  - `list_transactions`
  - `make_invoice` (opcional)

## Critério de compatibilidade mínima (v1)

- `connect`: **pass**
- `get_info`: **pass**
- `get_balance`: **pass**
- `list_transactions`: **pass**
- `make_invoice`: **pass** ou **skipped** com justificativa de escopo da wallet

## Perfil de produção (filosofia soberana)

Para classificar a integração NWC como produção:

- Wallet/bridge NWC sob controle da operação (self-hosted ou custódia própria).
- Nó Lightning próprio (`LND`/`CLN`) por trás da bridge.
- Relay Nostr com estratégia de redundância (`primário + contingência`).
- Credencial NWC com:
  - escopo mínimo necessário
  - orçamento/limites explícitos
  - validade controlada
  - revogação operacional testada

Se qualquer item acima faltar, classificar resultado como `Parcial` (não produção).

## Registro por wallet/relay (preencher após validação)

- Wallet: `<nome>`
- Relay: `<url>`
- Data: `<yyyy-mm-dd>`
- Resultado geral: `<aprovado | parcial | reprovado>`
- Classificação: `<produção | parcial | dev infra>`
- Falhas observadas:
  - `<código>`
  - `<mensagem>`
  - `<ação corretiva>`

## Interpretação rápida de falhas comuns

- `TIMEOUT`: relay instável ou latência alta.
- `UNAUTHORIZED`: secret/escopo inválido.
- `RATE_LIMITED`: limite operacional no provedor.
- `NOT_IMPLEMENTED`: método não suportado pela wallet.
- `PAYMENT_REJECTED` / `PAYMENT_FAILED`: política de pagamento ou invoice inválida.

## Checklist operacional antes de liberar para produção

- [ ] Rodar harness com timeout >= 12s e salvar JSON evidencial.
- [ ] Repetir em segundo relay (contingência) e comparar.
- [ ] Testar revogação da credencial NWC e validar bloqueio imediato.
- [ ] Gerar nova credencial e validar reconexão limpa.
- [ ] Registrar resultado no vault com data, versão e operador.
