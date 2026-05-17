# UTXO Tokens

## Definição
Sistema de tokens baseado em UTXOs com Pedersen commitments e nullifiers anti-gasto duplo.

## Mecânica
- Cada UTXO contém: commitment (Pedersen), nullifier, asset ID
- Transferência: criar novo UTXO + nullificar antigo
- Range proofs (Bulletproofs) provam valores positivos
- Stealth addresses: endereço único por transação

## Implementação
- **TS**: `src/crypto/utxoTokens.ts`
- **Teste**: `utxoTokens.test.ts`

## Referências
- [[GhostID Engine]] — identidade efêmera para UTXOs
- [[nostrDEX]] — trading de tokens
- [[Sovereign Pools]] — tokens dos pools
