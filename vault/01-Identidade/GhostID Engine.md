# GhostID Engine

## Definição
Identidade efêmera derivada de entropia biométrica passiva. Cada sessão gera um keypair Ed25519 único que é destruído ao encerrar.

## Pipeline
1. Entropia passiva: keystroke dynamics + giroscópio + pressão + microfone + timestamp
2. Concatenação → buffer 168 bytes (corrigido de 96)
3. Argon2id (64MB, 3 iterações, parallelism 1)
4. WASM `derive_ghost_id()` → SHA3-512 → Scalar Ed25519 → keypair
5. Handle: `hydra_◆_{16 hex}`
6. Zero-fill RAM ao fechar

## Implementação
- **TS**: `src/crypto/ghostid.ts`
- **WASM**: `void_core/src/lib.rs` → `derive_ghost_id(entropy: &[u8])`
- **Teste**: `ghostid.test.ts`

## Bug History
- Buffer overflow: 96→168 bytes (accelerometer Float32Array×16 = 64b ultrapassava)

## Referências
- [[QEL Protocol]] — fragmenta mensagens por GhostID
- [[DistanceBridge]] — transporta shards entre GhostIDs
- [[UTXO Tokens]] — carteiras efêmeras para tokens
