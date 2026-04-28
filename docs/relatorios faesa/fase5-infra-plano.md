# Fase 5 — Análise de Infraestrutura: Plano de Migração e Estrutura

> **Data:** 2026-04-28
> **Fase:** 5 — Análise de Infraestrutura
> **Plano de referência:** [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md)
> **Status:** **Documento de planejamento.** Nenhuma execução ocorreu nesta sessão. Pré-requisito de execução: túnel SSH para Postgres validado manualmente.

---

## 1. Estado Atual vs Estado Alvo

| Dimensão | Atual (v0.4.0) | Alvo (v1.0.0) |
|----------|----------------|---------------|
| Estrutura raiz | App Express monolítica + pasta isolada `banco-dados-requisitos-projeto/` | Monorepo `apps/web` (SPA) + `apps/api` (Express+Prisma) + `packages/db` (schema Prisma) |
| Banco | SQLite local (`schema.prisma` provider sqlite) | **PostgreSQL 17.6** Supabase self-hosted (VPS) |
| Build SPA | N/A (não há) | Vite build → `apps/web/dist/` |
| Servir SPA | N/A | Express serve `apps/web/dist/` + fallback `*` |
| Dockerfile | Single-stage `node:20-alpine`, copia `server.js` + `public/` | Multi-stage: `builder` (npm install + build SPA + generate Prisma) → `runner` (slim) |
| `package.json` raiz | App único, deps mínimas | `workspaces: ["apps/*", "packages/*"]` + scripts agregados |
| Migrations | Não rodam em produção (sqlite local apenas) | `prisma migrate deploy` no startup ou CI |

---

## 2. Estrutura Final do Monorepo

```
Desenvolvimento-WEB-II/
├── package.json                       # workspaces + scripts agregados
├── package-lock.json
├── .env / .env.example                # DATABASE_URL, DIRECT_URL, EASYPANEL_DEPLOY_WEBHOOK, ...
├── Dockerfile                         # multi-stage
├── .dockerignore                      # ignora docs/, .venv, node_modules, banco-dados-requisitos-projeto/ legacy
├── README.md / CHANGELOG.md
├── site_acolhimento_faesa.tex         # SOMENTE OVERLEAF
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── server.js                  # ex-raiz, agora aqui
│   │   ├── lib/
│   │   │   ├── prisma.js              # singleton @prisma/client
│   │   │   └── currentUser.js         # middleware X-User-Id
│   │   └── routes/                    # 7 controllers Fase 4
│   └── web/
│       ├── package.json               # ex-Figma, MUI removido
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/                       # ex-docs/pagina-acolhimento-faesa/src
│       └── dist/                      # gerado pelo build
├── packages/
│   └── db/
│       ├── package.json
│       ├── prisma/
│       │   ├── schema.prisma          # provider="postgresql"
│       │   ├── migrations/            # nova history limpa, sem o legado sqlite
│       │   └── seed.ts
│       └── lib/prisma.ts              # se compartilhar tipos com apps/api
├── scripts/                           # mantido como está (deploy, dev-tunnel)
├── docs/                              # planos + relatórios fase 1-5+
└── .github/workflows/deploy.yml       # mantido, validar paths
```

> **Observação:** decisão P3 estabeleceu `apps/web` + `apps/api`. O `packages/db/` é uma **adição técnica desta Fase 5** para isolar o Prisma como artefato compartilhável (segue padrão Turborepo). **Confirmar com o aluno antes de adotar** — alternativa é manter Prisma dentro de `apps/api/prisma/`.

---

## 3. Migração SQLite → PostgreSQL (Item 1 do Backlog)

### 3.1 Pré-requisitos (manuais antes da execução)

1. ✅ `.env` com `DATABASE_URL` e `DIRECT_URL` apontando para Supabase VPS (já feito).
2. ⏳ **Túnel SSH ativo:** `pwsh ./scripts/dev-tunnel.ps1` — valida portas 5432 e 6543.
3. ⏳ Smoke de conexão: `psql "$DIRECT_URL" -c "SELECT version();"` retorna PG 17.6.

### 3.2 Procedimento técnico

```powershell
# 1. Trocar provider no schema
# packages/db/prisma/schema.prisma:
#   datasource db { provider = "postgresql"; url = env("DATABASE_URL"); directUrl = env("DIRECT_URL") }

# 2. Apagar history sqlite (não é compatível)
Remove-Item -Recurse packages/db/prisma/migrations/

# 3. Aplicar migration inicial limpa
cd packages/db
npx prisma migrate dev --name init_postgres
# → cria 30+ tabelas no Postgres conforme schema atual

# 4. Aplicar migration item 9 (add_streak_and_conquistas + eMentor)
npx prisma migrate dev --name add_streak_and_conquistas

# 5. Rodar seed mínimo
npx tsx prisma/seed.ts

# 6. Smoke
npx prisma studio  # ou: psql ... -c "SELECT count(*) FROM usuarios;"
```

### 3.3 Riscos

| Risco | Mitigação |
|-------|-----------|
| `String?` do sqlite vira `text` no PG, mas tipos `Decimal`/`DateTime` podem divergir | Revisar cada `@db.*` antes do `migrate dev` |
| Túnel SSH cair durante migration | Rodar local com banco em container ou retry |
| Lock por sessão Supavisor (pgbouncer) | Usar `DIRECT_URL` para migrations, `DATABASE_URL` para queries |

---

## 4. Dockerfile Multi-Stage (Item 10)

```dockerfile
# syntax=docker/dockerfile:1.7

# ===== STAGE 1: builder =====
FROM node:20-alpine AS builder
WORKDIR /app

# Instala todas as deps dos workspaces
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
RUN npm ci

# Copia código
COPY . .

# Gera client Prisma + build SPA
RUN npm run -w packages/db prisma:generate \
 && npm run -w apps/web build

# ===== STAGE 2: runner =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3010

# Copia apenas o necessário
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/server.js"]
```

### Pontos críticos

- **`prisma generate`** roda no builder, gera client em `packages/db/generated/`.
- **Migrations não rodam no startup** por enquanto. Estratégia: rodar `prisma migrate deploy` manualmente via SSH antes do redeploy. **Alternativa:** adicionar entrypoint script `migrate-then-start.sh`. **Decisão futura.**
- **node_modules copiado** do builder evita rebuild. Para imagem mais magra futuramente: `npm ci --omit=dev` em stage separado.

---

## 5. Express servindo SPA (Item 6)

```js
// apps/api/server.js — diff conceitual

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware base
app.use(express.json());
app.use(currentUserMiddleware);

// Endpoints técnicos (preservados)
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/version', (_req, res) => res.json({ name: pkg.name, version: pkg.version }));

// API
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/planos-estudo', planosRoutes);
// ... demais 7 controllers

// SPA estática
const distPath = path.resolve(__dirname, '../web/dist');
app.use(express.static(distPath));

// Fallback SPA (DEVE vir depois de /api e /healthz e /version)
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(process.env.PORT || 3010);
```

**Critério:** `curl http://localhost:3010/dashboard/plano-estudos` retorna o HTML da SPA, e o React Router resolve a rota client-side.

---

## 6. Workflow GitHub Actions (Item 10 — Validação)

[deploy.yml](../../.github/workflows/deploy.yml) atual já dispara webhook EasyPanel no push para `master`. Validar:

- [ ] Path triggers ainda fazem sentido após reorganização (`apps/**`, `packages/**`).
- [ ] EasyPanel buildpath continua sendo a raiz do repo (Dockerfile na raiz).
- [ ] Variáveis `DATABASE_URL` configuradas no EasyPanel para o serviço (não no repo).

---

## 7. Variáveis de Ambiente — Inventário Final

| Variável | Origem | Onde |
|----------|--------|------|
| `DATABASE_URL` | Supabase pooler (6543) | Runtime + dev tunnel |
| `DIRECT_URL` | Supabase db direto (5432) | Migrations |
| `SUPABASE_URL` | Kong gateway | Não usado no v1.0.0 (fica para v1.1+) |
| `EASYPANEL_DEPLOY_WEBHOOK` | EasyPanel | Local + GH Actions secrets |
| `PORT` | Default 3010 | Container |
| `NODE_ENV` | `production` no Docker | Container |

> Sem variáveis novas no v1.0.0.

---

## 8. Ordem de Execução Recomendada (Fase 7 / TDD)

A Fase 5 não executa nada. Define apenas o roteiro técnico que a Fase 7 (TDD) seguirá:

1. **Sprint 1 — Banco** (itens 1 + 9 simultâneos)
   - Migrar para Postgres + criar migration `add_streak_and_conquistas` + `Usuario.eMentor`
   - Seed mínimo (3 usuários: Lucas/Mariana/Ricardo, 2 cursos, 5 disciplinas, 3 conquistas)
2. **Sprint 2 — Monorepo** (itens 2 + 3)
   - Criar `apps/web`, `apps/api`, `packages/db`
   - Mover arquivos, ajustar `package.json` raiz com workspaces
   - Limpar MUI/Emotion/`pasted_text/`
3. **Sprint 3 — Plumbing** (itens 5 + 6)
   - Redirect `/` → `/dashboard`
   - Express servindo SPA + fallback
4. **Sprint 4 — UI básica** (item 4)
   - Reescrever LoginPage com regra 0.1
5. **Sprint 5 — API** (item 7)
   - Implementar 22 endpoints da Fase 4
6. **Sprint 6 — Integração** (itens 8 + 8a + 8b + 8c)
   - Substituir mocks por fetch
   - Aba Eventos, Modal LGPD, Toggle Mentora
7. **Sprint 7 — Deploy** (itens 10 + 11)
   - Multi-stage Dockerfile
   - Bump v1.0.0, push, redeploy, validação Playwright MCP

---

## 9. Bloqueadores Operacionais

| ID | Bloqueador | Ação manual exigida |
|----|------------|----------------------|
| **B-1** | Túnel SSH não testado | `pwsh ./scripts/dev-tunnel.ps1` + `psql ... -c "SELECT 1"` |
| **B-2** | MCP Playwright não confirmado | Verificar `.playwright-mcp/` ativa em nova sessão antes da Sprint 7 |
| **B-3** | EasyPanel: env vars do serviço | Confirmar painel EasyPanel tem `DATABASE_URL` apontando para `supabase-pooler:6543` na rede overlay |

---

## 10. Pendência Nova (P11)

| ID | Pergunta | Por quê |
|----|----------|---------|
| **P11** | Onde colocar o Prisma no monorepo? **(a) `packages/db/` separado** (Turborepo-style, mais limpo, mais arquivos) / **(b) Dentro de `apps/api/prisma/`** (mais simples, acoplado ao backend) | Define estrutura final de pastas. Afeta itens 1, 2 e 9 do backlog. |

---

## 11. Resumo Executivo

- **3 grandes mudanças de infra:** monorepo + Postgres + multi-stage Dockerfile.
- **Sem novas dependências de runtime** além de `zod` (validação) e `@prisma/client` (já existe).
- **Migrations:** uma única `init_postgres` + uma `add_streak_and_conquistas` (com `eMentor`).
- **Bloqueadores manuais:** túnel SSH (B-1), MCP Playwright (B-2), env vars EasyPanel (B-3).
- **P11** define se Prisma fica em `packages/db/` ou `apps/api/prisma/`.

---

## 12. Próximos Passos

1. ✋ **Resolver P11.**
2. ⏳ **Você executa B-1** (túnel SSH) e me reporta o resultado de `psql ... -c "SELECT version();"`.
3. ⏳ Confirmar B-3 no painel EasyPanel.
4. Após P11 + B-1 + B-3 → avançar para **Fase 6 (refinamento final do backlog)** e depois **Fase 7 (TDD execution)**.
