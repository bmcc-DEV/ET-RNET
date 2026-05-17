# DistanceBridge

## Definição
Sistema de transporte que escala de centímetros a continents sem internet, usando hierarquia automática de modos.

## Modos
| Modo | Tecnologia | Alcance | Latência |
|---|---|---|---|
| Local | BLE / Wi-Fi Direct / UWB | até 500m | 5-80ms |
| Cidade | Human Carrier Network | até 50km | minutos-horas |
| Regional | LoRa 868/915 MHz | até 50km | horas |
| Global | DTN + Satélite LEO | global | horas-dias |

## Implementação
- **TS**: `src/network/distanceBridge.ts`
- **Drivers**: `src/network/localDrivers.ts` (BLE, NFC, UWB)
- **Teste**: `distanceBridge.test.ts`

## Human Carrier Network (HCN)
- Usuários carregam shards cifrados de terceiros
- TTL: 48h, limiter: 100MB/dispositivo
- Karma system: recompensas por carrier
- Nunca vê o conteúdo do shard

## Seleção Automática
- Peer visível → modo 1 (BLE)
- Peer na cidade → HCN
- Peer no estado → LoRa mesh
- Peer no mundo → DTN + satélite

## Referências
- [[QEL Protocol]] — shards viajam por estes canais
- [[NOSTR Mesh]] — transporte overlay
- [[GhostID]] — identidade efêmera por sessão
