# nostrDEX

## Definição
DEX descentralizado com order book on-chain via eventos NOSTR.

## Mecânica
- Maker: ordem que já está no livro
- Taker: ordem que cruza (aceita preço do maker)
- MatchPrice = sell.price (preço do maker)
- Trades registrados via kind 31216

## Implementação
- **TS**: `src/crypto/nostrDEX.ts`
- **UI**: `NostrDEXPanel.tsx`, `DEXPanel.tsx`
- **Teste**: `nostrDEX.test.ts`

## Pares
- ETR/BRL, ETR/XMR, ETR/SOV
- vBTC/vUSD

## Bug History
- matchPrice usava `(buy+sell)/2` em vez de `sell.price`

## Referências
- [[Chimera Exchange]] — blind matching alternativo
- [[Sovereign Pools]] — investimento em SIPs
- [[Payment Gateway]] — liquidação via Lightning
