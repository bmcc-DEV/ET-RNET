# Stack Criptográfica

## Algoritmos

| Camada | Algoritmo | Uso |
|---|---|---|
| Identidade | Ed25519 | Chaves públicas/privadas |
| ECDH | X25519 | Acordo de chave |
| Fragmentação | Shamir Secret Sharing | QEL (K=2, N=3) |
| Cifração | ChaCha20-Poly1305 | Cifração de shards |
| Hash | SHA3-256, SHA3-512 | Derivação, commits |
| KDF | HKDF-SHA256 | NIP-44, NWC |
| Memory-hard | Argon2id (64MB) | GhostID |
| Commitments | Pedersen | UTXOs |
| Range proofs | Bulletproofs | Valores positivos |
| Assinatura híbrida | Ed25519 + ML-DSA-87 | PQC |
| Acordo de chave híbrido | X25519 + ML-KEM-1024 | PQC |
| QRNG | vHGPU (WebGL) | Entropia quântica |

## Módulos
- **Wallet**: `wallet.ts` (Ed25519)
- **Identity**: `identity.ts` (X3DH)
- **Stealth Address**: `stealthAddress.ts`
- **FROST**: `frost.ts` (threshold signatures)
- **Quantum Bridge**: `quantumBridge.ts`

## Nota de Segurança
- NIP-44 usa HKDF-SHA256 (não SHA3) para interop
- ML-DSA-87 e ML-KEM-1024 são NIST PQC standards
- Argon2id previne brute-force offline
- Zero-fill RAM ao destruir GhostID
