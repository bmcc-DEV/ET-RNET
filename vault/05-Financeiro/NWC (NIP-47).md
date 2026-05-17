# NWC (NIP-47) — Nostr Wallet Connect

## Definição
Cliente NIP-47 que permite enviar comandos Lightning para um nó remoto via relays NOSTR.

## Métodos
1. `pay_invoice` — paga uma BOLT11
2. `make_invoice` — gera uma BOLT11
3. `get_balance` — consulta saldo
4. `get_info` — info do nó
5. `list_transactions` — histórico
6. `lookup_invoice` — busca por hash

## Criptografia
- NIP-44 v2: X25519 ECDH + HKDF-SHA256 + ChaCha20-Poly1305
- Correção: SHA3→SHA256 no HKDF (interop com Alby/Mutiny)

## Implementação
- **TS**: `src/crypto/nwcProtocol.ts` (488 linhas)
- **Teste**: `nwcProtocol.test.ts`

## Bug History
- `isConnected()` invertido (`=== false` → `=== true`)
- HKDF usava SHA3 em vez de SHA-256

## Referências
- [[Payment Gateway]] — integra NWC como méthode de pagamento
- [[LDK Bridge]] — caminho alternativo (WASM local)
- [[Lightning Payment]] — UI para pagamentos
