# Chimera Exchange

## Definição
Exchange com blind matching — ordens fragmentadas em shards, matching via VRF, sem expor preço/quantidade.

## Mecânica
1. Ordem → fragmentada em N shards (40%+30%+30%)
2. Shards criptografados (ChaCha20-Poly1305)
3. Matcher VRF-eleito descriptografa shards localmente
4. Matching cego → liquidação fragmentada
5. Liquidez: tokens $CHIM proporcionais ao depósito

## Implementação
- **TS**: `src/crypto/chimeraExchange.ts`
- **UI**: `ChimeraExchangePanel.tsx`
- **Teste**: `chimeraExchange.test.ts`

## Bug History
- price/amount expostos em plaintext no order book → corrigido
- `match.matchId.split("_")[0]` retornava "match" → corrigido para `match.pair`
- LP tokens: `amount*0.001` → corrigido para `(amount/totalLiquidity)*totalSupply`

## Referências
- [[nostrDEX]] — DEX convencional
- [[QEL Protocol]] — fragmentação subjacente
- [[Sovereign Pools]] — investimento passivo
