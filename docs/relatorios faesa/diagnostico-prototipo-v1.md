# Diagnóstico do Estado Atual — Primeiro Protótipo v1

> **Data:** 2026-04-28
> **Fase:** 1 — Análise da Situação Atual
> **Plano de referência:** [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md)

---

## 1. Inventário do Repositório

### Raiz
```
.dockerignore  .env  .env.example  .github/  .gitignore  .vscode/
CHANGELOG.md  Dockerfile  README.md  package.json  package-lock.json
public/  scripts/  server.js  site_acolhimento_faesa.tex
banco-dados-requisitos-projeto/  docs/  node_modules/  .playwright-mcp/  .venv/
```

**Observação:** `.playwright-mcp/` presente no workspace → indício de que o servidor MCP do Playwright **já tem state local** na estação. Confirmar atividade na próxima sessão antes da Fase 7.

### Camadas atuais (3)
1. **Documento acadêmico:** [site_acolhimento_faesa.tex](../../site_acolhimento_faesa.tex) — editado **só no Overleaf**.
2. **Modelagem isolada:** [banco-dados-requisitos-projeto/](../../banco-dados-requisitos-projeto/) — Prisma + SQLite local.
3. **App Express minimíssima:** [server.js](../../server.js), [public/](../../public/), [Dockerfile](../../Dockerfile) — página "Em Construção" para validar pipeline EasyPanel.
4. **(NOVO em 28/04/2026):** [docs/pagina-acolhimento-faesa/](../pagina-acolhimento-faesa/) — pacote Figma Make extraído (React+Vite).

---

## 2. Estado dos Arquivos-Chave

| Arquivo | Versão / estado | Observação |
|---------|-----------------|------------|
| [package.json](../../package.json) | `v0.4.0`, deps mínimas (`express ^4.21.2`) | OK |
| [server.js](../../server.js) | Express puro, ESM, healthz + version + estático `public/` | Não tem fallback SPA, não tem rotas `/api/*` |
| [Dockerfile](../../Dockerfile) | Single-stage `node:20-alpine`, healthcheck nativo | Precisará virar multi-stage para build da SPA |
| [public/index.html](../../public/index.html) | Página "Em Construção" — JÁ EXIBE Disciplina, Docente, Aluno, Repositório + badge `${name} · v${version}` via `fetch('/version')` | **Regra 0.1 já está satisfeita aqui.** A reescrita da `LoginPage` na SPA precisa preservar o mesmo conteúdo. |
| [CHANGELOG.md](../../CHANGELOG.md) | `[Unreleased]` ativo, última versão fechada `0.3.0` | Bump para `1.0.0` no item 11 do backlog |

### Versão sincronizada — verificada
- `package.json` → **0.4.0**
- `https://acolhimento.faesa.gmcsistemas.com.br/version` → `{"name":"site-acolhimento-faesa","version":"0.4.0"}` ✅
- `public/index.html` → consome `/version` dinamicamente (sem hard-code) ✅

---

## 3. Pacote Figma — Inventário

> Detalhes completos no Apêndice D do plano. Resumo aqui.

- **Origem:** Figma Make (`@figma/my-make-file`).
- **Stack:** React 18, Vite 6, react-router 7, Tailwind 4, Radix/shadcn (47 componentes ui/), MUI 7+Emotion (a remover por B5), recharts, react-hook-form, sonner, lucide-react, motion, react-dnd, embla, cmdk, vaul.
- **9 rotas** roteadas via `createBrowserRouter` (incl. `*` NotFound).
- **2 layouts:** RootLayout (passthrough) + DashboardLayout (sidebar + header).
- **100% mock client-side.** Nenhum `fetch` HTTP. Toda integração com API/Prisma será construída do zero.
- **Lixo identificado:** `src/imports/pasted_text/` (cópias `.md` de `docs/`) — remover.
- **Risco identificado:** plugin `figmaAssetResolver()` aponta para `src/assets/` que **não veio** no ZIP. Precisa varredura por imports `figma:asset/...` antes do primeiro build.

---

## 4. Resolução de Pendências P1, P2 (Apêndice B do plano)

### P1 — `Gamificacao` (RESOLVIDA via leitura do schema)

Estado atual em [banco-dados-requisitos-projeto/prisma/schema.prisma](../../banco-dados-requisitos-projeto/prisma/schema.prisma):

```prisma
model Gamificacao {
  id            Int  @id @default(autoincrement())
  usuarioId     Int  @unique @map("usuario_id")
  pontosTotais  Int? @map("pontos_totais")
  badges        String?
  rankingPosicao Int? @map("ranking_posicao")
  ...
}
```

**Conclusão técnica:**
- ❌ **Não há** `streakAtual` nem `streakRecorde` (dashboard exibe "12 dias consecutivos" — vai exigir migration nova).
- ⚠️ `badges` é `String?` solto (provavelmente CSV/JSON serializado). UI do dashboard renderiza 3 badges com `name` + `icon` + estado "desbloqueado recentemente" — **modelagem atual é insuficiente**.
- ❌ **Não existem** `Conquista` nem `UsuarioConquista`.

**Decisão técnica para o item 9 do backlog:** migration nova `add_streak_and_conquistas` adicionando:
- Em `Gamificacao`: `streakAtual Int @default(0)`, `streakRecorde Int @default(0)`, `dataUltimaAtividade DateTime?`.
- Modelo novo `Conquista`: `id`, `codigo` único, `nome`, `descricao`, `icone`, `pontosBonus`.
- Modelo novo `UsuarioConquista`: `id`, `usuarioId`, `conquistaId`, `desbloqueadoEm DateTime`, unique composto.
- Migrar campo `badges` (String) → relação 1:N com `UsuarioConquista`.

### P2 — `AtividadeEstudo.duracaoMinutos` (RESOLVIDA)

```prisma
model AtividadeEstudo {
  ...
  dataAgendada   DateTime? @map("data_agendada")
  dataRealizacao DateTime? @map("data_realizacao")
  duracaoMinutos Int?      @map("duracao_minutos")
  status         String?
}
```

✅ **Já existe.** Sem migration. O endpoint `/api/dashboard/horas-semanais` agrupa por `dataRealizacao` e soma `duracaoMinutos / 60`.

---

## 5. Infra — Acessos

| Item | Status | Detalhe |
|------|--------|---------|
| `.env` local | 🟢 Verde | `EASYPANEL_DEPLOY_WEBHOOK`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL` populados. |
| `.env.example` | 🟢 Verde | Documenta todas as variáveis. |
| Produção `/version` | 🟢 Verde | Responde `0.4.0` (bate com local). |
| Túnel SSH para Postgres VPS | 🟡 **Não testado nesta sessão** | Executar manualmente: `pwsh ./scripts/dev-tunnel.ps1`. Necessário antes da Fase 5 (migração Prisma). |
| Servidor MCP Playwright | 🟡 **Pasta `.playwright-mcp/` existe** | Confirmar se está ativo na sessão antes da Fase 7. |
| Workflow CI deploy | 🟢 Verde | `.github/workflows/deploy.yml` registrado. |

---

## 6. O que existe / O que funciona / O que falta

### Existe e funciona
- Pipeline EasyPanel completo (Dockerfile + webhook + GH Actions + healthz + version).
- Documento acadêmico LaTeX consolidado.
- Schema Prisma de 30+ modelos cobrindo ~85% das interações da UI Figma.
- Página "Em Construção" satisfazendo a regra 0.1.
- Pacote Figma Make extraído e inventariado.

### Existe mas precisa mudar
- `server.js` (vai virar `apps/api/server.js` + ganhar fallback SPA + rotas `/api/*`).
- `Dockerfile` (single-stage → multi-stage com build da SPA).
- `package.json` raiz (vira `workspaces` + scripts agregados).
- Schema Prisma (`provider="sqlite"` → `"postgresql"` + apagar migrations sqlite + nova migration `add_streak_and_conquistas`).
- `LoginPage.tsx` do Figma (reescrever conforme regra 0.1, decisão B1).

### Não existe — a criar
- Estrutura monorepo `apps/web/` + `apps/api/`.
- 11 endpoints REST `/api/*` (Fase 4 do plano).
- Seed mínimo Prisma.
- Modelos `Conquista` + `UsuarioConquista` + colunas de streak.
- Suíte Vitest + Playwright (estação) com testes RED para cada item do backlog.

---

## 7. Conclusão

O projeto está **pronto para entrar na Fase 2** (Análise de Produto) com as seguintes ressalvas:

1. P1 e P2 resolvidos. **Resta confirmar P3, P4, P5** com o desenvolvedor (questões abertas a seguir).
2. Antes da Fase 5, **executar manualmente o túnel SSH** e confirmar o MCP Playwright na sessão.
3. A regra 0.1 já está cumprida na página atual — reescrita da `LoginPage` na SPA é apenas portabilidade do conteúdo + adoção do design system Figma.

**Próximo passo:** Fase 2 (cruzar LaTeX × rotas Figma) **OU** rodar a rodada formal de validação P3–P5 antes (recomendado, pois P3 muda nomes de pastas e P4 muda dependências).
