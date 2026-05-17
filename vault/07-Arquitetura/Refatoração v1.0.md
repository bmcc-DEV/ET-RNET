# Refatoração para v1.0 de Produção

## Bugs Corrigidos nesta sessão

### Críticos (5)
1. **GhostID buffer overflow** — 96→168 bytes
2. **NWC isConnected() invertido** — `=== false` → `=== true`
3. **NIP-44 HKDF SHA3→SHA256** — interop com Alby/Mutiny
4. **Chimera "falso cego"** — price/amount removidos do order book
5. **Sovereign Pools deadlock** — `activateProposal()` adicionado

### Médios (3)
6. **nostrDEX matchPrice** — `(buy+sell)/2` → `sell.price`
7. **Chimera pool lookup** — `matchId.split("_")[0]` → `match.pair`
8. **LP tokens** — `amount*0.001` → `(amount/totalLiquidity)*totalSupply`

### Menores (3)
9. **TS errors** — 7→0 (unused vars, exactOptionalPropertyTypes)
10. **Watchtower breach detection** — stub → real mempool.space API
11. **WASM rebuild** — `mod ldk;` desabilitado temporariamente

## Estado do Código

### Testes: 256/256 passando
### TSC: 0 erros
### WASM: compilado (265KB)

## Pendente para v1.0

| Item | Prioridade | Esforço |
|---|---|---|
| LDK ChannelManager em WASM | Alta | 2-3 semanas |
| LDK ↔ NOSTR transport bridge | Alta | 2 semanas |
| `handlePersist` → IndexedDB (não localStorage) | Média | 1 dia |
| Testes para nostrMesh, lightningTransport | Média | 1 semana |
| Auditoria de segurança completa | Alta | Contínua |
| wasm-opt / redução de binário | Baixa | 2 dias |

## Notas de Refatoração

### Arquitetura
- Separar camadas claramente: Identidade → Fragmentação → Transporte → Rede → Financeiro
- Cada módulo deve ser testável independentemente
- WASM deve ser rebuildável com `wasm-pack build --target web`

### Segurança
- NIP-44 v2 com SHA-256 (não SHA-3) para interop
- GhostID: zero-fill RAM, nenhum disco
- Watchtower: justiça via mempool.space, não stubs
- Chimera: price/amount NUNCA em plaintext no order book

### Performance
- WASM: 265KB (pode ser menor com wasm-opt)
- Testes: 2.3s para 256 testes
- Bundle splitting: vendor-react + vendor-crypto
