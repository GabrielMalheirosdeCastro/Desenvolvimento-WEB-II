# Plano de Ação — Seed em Produção + Auto-deploy (Fase 0)

**Data:** 2026-06-13
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** O protótipo v1.3.1 está no ar, mas os endpoints respondem `"source": "fallback"`
porque as tabelas de produção estão vazias. O auto-deploy está inativo (falta o GitHub Secret).
Esta é a primeira fase do roadmap de evolução para a versão final (ver
[docs/atividades/pendencias-versao-final-producao.md](atividades/pendencias-versao-final-producao.md)).

Cobre as pendências **C1, C2, C3, C5** (Bloco C) e **F1** (Bloco F).

## Objetivo

Tirar o sistema do estado de fallback estático, populando o banco de produção com a persona real
(Gabriel, matrícula `23110145`) e dados de dashboard, e reativar o auto-deploy do EasyPanel.
Ao final, `GET /api/me` e `GET /api/dashboard/streak` em produção devem responder `"source": "db"`.

## Etapas

- [x] 1. **Patch do seed para cobrir C2 (`gamificacao`)** — adicionar `upsert` da linha de
  gamificação da persona Gabriel em `seed-prod.ts` e `seed-prod.sql`. Sem isso, o endpoint
  `GET /api/dashboard/streak` (que consulta a tabela `gamificacao`) continuaria em fallback.
- [x] 2. **Bump de versão** `1.3.1 → 1.3.2` (PATCH) nos três `package.json` + atualização do
  `CHANGELOG.md`.
- [ ] 3. **F1 — Cadastrar o GitHub Secret `EASYPANEL_DEPLOY_WEBHOOK`** em
  *Settings → Secrets and variables → Actions* do repositório, com a URL do webhook do EasyPanel.
- [ ] 4. **Abrir o túnel SSH** para o banco de produção: `pwsh ./scripts/dev-tunnel.ps1`
  (mapeia `localhost:6543` → pooler e `localhost:5432` → direct). Manter aberto.
- [ ] 5. **Executar o seed** em outro terminal:
  - `$env:DATABASE_URL = "postgresql://postgres.gmc:SENHA@localhost:6543/postgres?pgbouncer=true&connection_limit=1"`
  - `npm --workspace packages/db run seed:prod`
- [ ] 6. **Validar (C3)** que os endpoints respondem `"source": "db"` em produção.
- [ ] 7. **Encerramento (Seção 12.1)** — commit atômico, push, redeploy via `node scripts/deploy.mjs`
  e conferência de `/version` == `1.3.2`.

## Impacto Esperado

- Arquivos modificados: `packages/db/prisma/seed-prod.ts`, `packages/db/prisma/seed-prod.sql`,
  `package.json`, `apps/api/package.json`, `apps/web/package.json`, `CHANGELOG.md`.
- Endpoints afetados (passam a `source: "db"`): `/api/me`, `/api/dashboard/streak`,
  `/api/dashboard/week`, `/api/dashboard/badges`, `/api/dashboard/upcoming`, `/api/eventos`.
- README precisa ser atualizado? Não. CHANGELOG? Sim (feito).

## Riscos e Cuidados

- O seed usa o **pooler (6543)** com `connection_limit=1` para não esgotar o Supavisor.
- O seed é **idempotente** (`upsert`); seguro reexecutar — não duplica nem apaga dados.
- **Não** commitar `SENHA` nem a URL do webhook em arquivos versionados — usar `.env` (gitignored)
  e o GitHub Secret.
- **C5 (typo "Matheos"):** o nome está correto em todo o código e no seed
  (`Gabriel Malheiros de Castro`). O `upsert` corrige qualquer divergência já gravada no banco.

## Critério de Conclusão

- `GET https://acolhimento.faesa.gmcsistemas.com.br/api/_status` → `{"db":"connected"}`.
- `GET .../api/me` e `.../api/dashboard/streak` → `"source": "db"` com o nome correto.
- `workflow_dispatch` no GitHub Actions conclui sem falha de validação de secret.
- `GET .../version` → `{"name":"site-acolhimento-faesa","version":"1.3.2"}`.
- Validação visual do nome via Playwright MCP na estação Windows (VPS é headless).
