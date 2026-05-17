# NOSTR Mesh

## Definição
Rede P2P baseada em NOSTR com eventos customizados para mensagens, Lightning, e watchtower.

## Event Kinds
| Kind | Uso |
|---|---|
| 31214 | Mensagens (QEL shards) |
| 31215 | DEX orders |
| 31216 | DEX trades |
| 31217 | Mesh data |
| 31218 | Mesh control |
| 31219 | Distance bridge |
| 31340-31349 | Lightning messages |
| 31350 | Watchtower registration |
| 31351 | Breach alert |

## Implementação
- **TS**: `src/network/nostrMesh.ts`
- **Transport Lightning**: `src/network/lightningNostrTransport.ts`
- **Teste**: `nostrMesh.test.ts`

## Relay Health
- Monitora conectividade de relays
- Failover automático
- Gossip para node discovery

## Referências
- [[QEL Protocol]] — shards transportados via NOSTR
- [[NWC (NIP-47)]] — pagamentos via NOSTR
- [[Watchtower]] — monitoramento via kind 31350/31351
