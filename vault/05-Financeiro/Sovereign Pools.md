# Sovereign Pools (SIPs)

## Definição
Fundos de investimento descentralizados com governança por votação ZK.

## Mecânica
1. Criar pool (estratégia, taxa mínima, max investidores)
2. Investir (contribuição em ETH/USDC)
3. Submeter propostas (novas estratégias, mudanças)
4. Votar (1 voto por身份, ponderado por stake)
5. Executar (após quórum)

## Implementação
- **TS**: `src/crypto/sovereignPools.ts`
- **UI**: `SovereignPoolsPanel.tsx`
- **Teste**: `sovereignPools.test.ts`

## Taxas
- Performance fee: até 10% dos lucros
- Management fee: até 2% a.a.
- Distribuídos aos votantes proporcionalmente

## Bug History
- Deadlock: status "pending" nunca transicionava para "voting" → `activateProposal()` adicionado

## Referências
- [[nostrDEX]] — trading de tokens dos SIPs
- [[Chimera Exchange]] — blind matching para SIPs
- [[UTXO Tokens]] — tokens dos pools
