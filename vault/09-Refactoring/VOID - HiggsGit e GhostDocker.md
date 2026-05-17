---
tags: [void, arquitetura, higgsgit, ghostdocker, opensource, soberania]
created: 2026-05-17
status: rascunho-ativo
source: [vault/, src/crypto/antiHiggs.ts, src/core/ghostDock.ts]
---

# GhostDocker e HiggsGit: Metamorfose VØID

Documento de arquitetura do toolkit VØID para versionamento e runtime soberanos, offline-first e criptografados.

## Princípios inegociáveis

- Open source por padrão.
- Offline-first e local-first.
- Criptografia em repouso e em trânsito local.
- Operação soberana (sem dependência mandatória de SaaS).
- Auditável, reversível e controlável pelo operador legítimo.

> Nota de segurança: "indesligável/incontrolável" não entra na linha de produção segura. O equivalente aceito é "resiliente com governança".

## PARTE I - HiggsGit (proposta)

HiggsGit é a camada de versionamento orientada a "fase" e "cicatriz" de merge.

### Conceitos

- Commit clássico + metadados de fase.
- Merge com token de cicatriz (evidência de colapso).
- Fóssil computacional para arqueologia de invariantes.

### CLI proposta

```bash
higgs init --field-strength=0.86 --critical-threshold=0.95
higgs commit -m "mensagem" --phase=accumulate
higgs branch feature-x --phase=superposition
higgs merge feature-x --collapse-threshold=0.9 --scar-token
higgs log --show-scars --show-phase
higgs fossilize HEAD~3 --output=fossils/
```

### Roadmap técnico

1. Wrapper compatível com git objects (fase 1).
2. Scar tokens e log causal (fase 2).
3. Fossil export (fase 3).
4. Motor nativo (Rust) independente (fase 4).

## PARTE II - GhostDocker (proposta)

GhostDocker é runtime local com identidade efêmera, storage volátil e política de rede deny-by-default.

### Conceitos

- GhostID por sessão.
- Execução com TTL e parada controlada.
- Storage em RAM quando possível.
- Policy de rede por perfil (`deny_all`, `allow_localhost`, `custom`).

### CLI proposta

```bash
ghostdocker build -t app:ghost --ephemeral-signature --ram-only
ghostdocker run --ghostid --ttl=1h --zero-disk app:ghost
ghostdocker shatter app:ghost --shards=5 --threshold=3
ghostdocker deploy --phantom-network --mac-rotation=5s
```

### Roadmap técnico

1. Orquestrador local de perfis/sessões (fase 1).
2. Snapshot criptografado de estado (fase 2).
3. Transporte fragmentado opcional (fase 3).
4. Runtime nativo + integração com systemd (fase 4).

## Estado atual no repositório

- `src/crypto/antiHiggs.ts`
  - Vault local com snapshot criptografado AES-GCM.
  - Integridade com SHA-256.
  - Leitura/remoção/listagem local.

- `src/core/ghostDock.ts`
  - Perfis de execução.
  - Sessões com TTL e parada explícita.
  - Trilha de auditoria básica.

Classificação atual: **Parcial** (base real implementada, ainda sem runtime de host hardenizado).

## Critério de promoção para produção

- Testes automatizados para AntiHiggs/GhostDock.
- Integração com serviços nativos (systemd) sem Docker obrigatório.
- Auditoria de segurança operacional (chaves, logs, revogação).
- Documentação de incidente e recuperação publicada no vault.

