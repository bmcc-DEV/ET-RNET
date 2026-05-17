# QEL Protocol

## Definição
Protocolo de fragmentação de mensagens que divide cada mensagem em N shards independentes, roteados por caminhos maximalmente disjuntos.

## Especificação
- **Fragmentação**: Shamir Secret Sharing (K=2, N=3)
- **Cifração por shard**: ChaCha20-Poly1305 (chave única por shard)
- **Roteamento**: MDNF (Maximally Disjoint Non-repeating Flow)
- **Overhead**: ~3x tamanho original
- **Latência**: +20-80ms por salto

## Implementação
- **TS**: `src/crypto/qel.ts`
- **Teste**: `qel.test.ts`

## Propriedades
- Nenhum nó intermediário vê a mensagem completa
- Caminhos recalculados a cada mensagem
- K shards de qualquer K caminhos reconstituem M
- Funciona offline via BLE/WiFi/LoRa/HCN

## Referências
- [[GhostID Engine]] — cada shard é cifrado para o GhostID do destinatário
- [[DistanceBridge]] — canais físicos por onde viajam os shards
- [[NOSTR Mesh]] — transporte alternativo via relays
