# SYMBIONT

## Conceito
O viroide da Web — não é instalado, habita. WASM 47kb que qualquer browser executa.

## Vetores de Propagação
1. **JS/Web**: `<script>` em qualquer site
2. **QR/NFC**: escaneou, virou nó
3. **npm/pip/cargo**: dependências inocentes
4. **Firmware**: OpenWRT, Raspberry Pi
5. **RF passivo**: BLE advertising
6. **Temporal**: PDFs, pendrives, imagens

## Modelo de Hospedagem
- CPU: IDLE cycles (< 2-5% RAM)
- Pausa se carga > 60%
- Em troca: CDN privada, storage distribuído, anonimato

## Memória Distribuída
- Reed-Solomon (n, k): arquivo reconstruível de k/n fragmentos
- Consistent hashing para distribuição
- k=3, n=7 → resiste a 57% de perda

## Status
- **Teórico** — requer Service Workers avançados, eBPF, SGX
- Referenciado em `VØID·ΩMEGA.txt`
- Deferido para v2.0+

## Referências
- [[VØID-MEGA]] — lei física que SYMBIONT executa
- [[ANIMUS]] — camada acima
