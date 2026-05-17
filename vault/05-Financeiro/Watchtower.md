# Watchtower

## Definição
Nó que monitora a blockchain para detectar breaches em canais Lightning e broadcast de justice transactions.

## Mecânica
1. Registra canais (commitment txid, funding outpoint, justice tx)
2. Monitora mempool.space: `/api/tx/:txid/outspend/:vout`
3. Se funding outpoint gasto ≠ commitment txid → breach!
4. Broadcast justice tx via `POST /api/tx`
5. Alerta via NOSTR kind 31351

## Implementação
- **TS**: `src/crypto/watchtower.ts`
- **Teste**: `watchtower.test.ts`

## NOSTR Protocol
- Kind 31350: registro de watchtower
- Kind 31351: alerta de breach
- Encrypted state + justice tx em base64

## Referências
- [[LDK Bridge]] — gera commitment txs
- [[NOSTR Mesh]] — comunicação com watchtowers
- [[NWC (NIP-47)]] — pagamentos via canais monitorados
