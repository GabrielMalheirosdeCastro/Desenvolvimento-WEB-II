# Plano de Ação — Desenvolvimento do Primeiro Protótipo

> **Projeto:** Site de Acolhimento FAESA
> **Data original:** 2026-04-26
> **Revisão:** 2026-04-28 — incorporação do pacote Figma Make ([docs/pagina-acolhimento-faesa/](pagina-acolhimento-faesa/)) como UI oficial do protótipo.
> **Objetivo:** Conduzir o agente, de ponta a ponta, na construção, validação e deploy do **primeiro protótipo funcional**, atuando em múltiplos papéis (Produto, Requisitos, Infra, Sistemas, Dev TDD e QA), tendo como ponto de partida a UI gerada no Figma Make e o schema Prisma já modelado.

---

## 0. Contexto e Premissas Gerais

Antes de iniciar qualquer fase, o agente deve internalizar as seguintes regras invariantes que valem para **todas** as etapas:

### 0.1. Regras de Negócio Fixas (Tela de Login)
- Os dados de **`Disciplina`**, **`Docente`**, **`Aluno`** e **`Repositório`** **DEVEM** ser mantidos visíveis na tela de login. Nenhuma alteração de layout ou refatoração pode removê-los.
- O rótulo de versão **`site-acolhimento-faesa · v0.X.0`** exibido na tela de login é o **mecanismo oficial de validação de redeploy**. A cada build/versão publicada, o agente valida o sucesso do deploy apenas consultando a tela de login e conferindo o número de versão.
- Toda alteração de versão deve ser refletida em [package.json](../package.json), [CHANGELOG.md](../CHANGELOG.md) e na string exibida na tela de login.
- **Decorrência da decisão B4 (28/04/2026):** o protótipo **não exige autenticação real**. A rota raiz (`/`) **redireciona direto para `/dashboard`**. A tela de login é acessível em `/login` apenas para satisfazer a regra 0.1 — exibe os 4 metadados + badge de versão + um botão "Entrar" que faz `navigate("/dashboard")` sem validar credenciais.

### 0.2. Higiene Documental
- Em **toda** fase, o agente deve verificar se alguma documentação ou instrução em [docs/](.) ficou **desatualizada** em relação ao estado real do projeto.
- Documentação obsoleta deve ser **atualizada** ou **removida** (após confirmação com o desenvolvedor) — nada de manter arquivos zumbis.

### 0.3. Comunicação com o Desenvolvedor
- Sempre que houver **dúvida, ambiguidade ou lacuna**, o agente **deve perguntar ao desenvolvedor** antes de assumir qualquer coisa.
- Toda pergunta deve vir acompanhada de **pelo menos uma sugestão de solução** (preferencialmente 2–3 opções com prós/contras).
- Decisões tomadas devem ser registradas no Apêndice B.

### 0.4. Ambiente de Execução de Testes — Playwright MCP

> **Regra crítica de infraestrutura.** O servidor de produção é uma **VPS Ubuntu 24.04 sem interface gráfica (headless)**. Por isso, **nenhum teste de navegação, E2E, visual ou de usabilidade pode ser executado na VPS**.

- **Onde rodam testes de UI/E2E:** **somente na estação de trabalho do desenvolvedor (Windows 11)**, que possui display, navegador e o **servidor MCP do Playwright** disponível para o agente.
- **Verificação obrigatória antes da Fase 7 e da Fase 8:** o agente **deve confirmar** se o **servidor MCP do Playwright** está **configurado e ativo na estação de trabalho**.
- **Tipos de teste por ambiente:**

  | Tipo de teste | Onde executa | Ferramenta |
  |---------------|--------------|------------|
  | Unitário (lógica pura) | Estação **ou** VPS | Vitest |
  | Integração de API/DB (sem browser) | Estação **ou** VPS | Vitest + supertest |
  | E2E SPA (rotas `/`, `/login`, `/dashboard/*`) | **Somente estação** | **Playwright via MCP** |
  | Validação visual da tela de login (`Disciplina`/`Docente`/`Aluno`/`Repositório` + `v0.X.0`) | **Somente estação** | **Playwright via MCP** |
  | Validação pós-deploy do rótulo de versão em produção | **Somente estação** | **Playwright via MCP** apontando para `https://acolhimento.faesa.gmcsistemas.com.br/login` |

### 0.5. Decisões de Arquitetura (28/04/2026 — decisões B1–B5)

Ratificadas em sessão de planejamento com o desenvolvedor. Consultar Apêndice B para detalhamento.

| ID | Decisão | Impacto |
|----|---------|---------|
| **B1** | LoginPage do Figma será **reescrita inteira** mantendo o design system (paleta `#003366` / `#0066CC` / `#28A745`, tipografia, componentes Radix), mas o conteúdo respeita a regra 0.1. | Substitui o conteúdo de [docs/pagina-acolhimento-faesa/src/app/pages/LoginPage.tsx](pagina-acolhimento-faesa/src/app/pages/LoginPage.tsx). |
| **B2** | Schema Prisma migra de `sqlite` para `postgresql` **antes** da adoção da UI. Migrations limpas + seed mínimo. | Modifica [banco-dados-requisitos-projeto/prisma/schema.prisma](../banco-dados-requisitos-projeto/prisma/schema.prisma). Conexão com Postgres self-hosted da VPS via túnel SSH em dev (`scripts/dev-tunnel.ps1`). |
| **B3** | Estrutura **monorepo npm workspaces**: `apps/web/` (SPA Vite/React do Figma) + `apps/api/` (Express atual). Build conjunto. | Reorganização do repositório raiz. |
| **B4** | **Sem autenticação no protótipo.** Rota `/` redireciona para `/dashboard`. LoginPage acessível em `/login` apenas como artefato da regra 0.1. | Remove necessidade de `passwordHash`, sessão, JWT no MVP. |
| **B5** | **Remover MUI + Emotion** do `apps/web/package.json` no commit de adoção. Manter apenas Radix/shadcn. | Reduz ~5 dependências e bundle. |

### 0.6. Regras Invariantes do Pacote Figma

- **Origem:** Figma Make (`@figma/my-make-file` em [docs/pagina-acolhimento-faesa/package.json](pagina-acolhimento-faesa/package.json)).
- **Não preservar:** [docs/pagina-acolhimento-faesa/src/imports/pasted_text/](pagina-acolhimento-faesa/src/imports/pasted_text/) — são cópias dos planos `.md` do diretório `docs/`. Excluir na migração.
- **Verificar antes do build:** o plugin `figmaAssetResolver()` em [docs/pagina-acolhimento-faesa/vite.config.ts](pagina-acolhimento-faesa/vite.config.ts) aponta para `src/assets/` — pasta **não veio no ZIP**. Varredura por imports `figma:asset/...` é **obrigatória** antes do primeiro build em `apps/web/`.
- **Toda interação na UI atual é mock client-side.** Nenhuma chamada HTTP existe. Toda integração com a API/Prisma será construída do zero na Fase 7.

---

## Fase 1 — Análise da Situação Atual (Diagnóstico)

**Papel:** Analista Geral / Tech Lead

**Tarefas:**
1. Mapear a estrutura completa do repositório listando: código-fonte da app atual, pacote Figma extraído, documentação, scripts, schema de banco, configurações de deploy.
2. Ler e resumir os arquivos-chave:
   - Aplicação atual: [README.md](../README.md), [CHANGELOG.md](../CHANGELOG.md), [server.js](../server.js), [package.json](../package.json), [public/index.html](../public/index.html), [public/styles.css](../public/styles.css), [Dockerfile](../Dockerfile)
   - Banco: [banco-dados-requisitos-projeto/prisma/schema.prisma](../banco-dados-requisitos-projeto/prisma/schema.prisma), [banco-dados-requisitos-projeto/schema.sql](../banco-dados-requisitos-projeto/schema.sql), [banco-dados-requisitos-projeto/der-fonte.mmd](../banco-dados-requisitos-projeto/der-fonte.mmd)
   - **Pacote Figma (NOVO):** [docs/pagina-acolhimento-faesa/package.json](pagina-acolhimento-faesa/package.json), [src/app/routes.tsx](pagina-acolhimento-faesa/src/app/routes.tsx), [src/app/App.tsx](pagina-acolhimento-faesa/src/app/App.tsx), todas as páginas em [src/app/pages/](pagina-acolhimento-faesa/src/app/pages/), [src/app/layouts/DashboardLayout.tsx](pagina-acolhimento-faesa/src/app/layouts/DashboardLayout.tsx), [src/app/components/NotificationBell.tsx](pagina-acolhimento-faesa/src/app/components/NotificationBell.tsx), [vite.config.ts](pagina-acolhimento-faesa/vite.config.ts).
3. Identificar a **versão atual** declarada (`package.json`, `CHANGELOG`, login screen) e checar se estão sincronizadas.
4. Verificar **acessos do banco**: o Postgres self-hosted da VPS está acessível? O túnel SSH em [scripts/dev-tunnel.ps1](../scripts/dev-tunnel.ps1) funciona?
5. Produzir um **resumo do estado atual** (1 página) cobrindo: o que existe, o que funciona, o que está incompleto, status do pacote Figma.

**Entregável:** Diagnóstico salvo como [docs/relatorios faesa/diagnostico-prototipo-v1.md](relatorios%20faesa/diagnostico-prototipo-v1.md).

---

## Fase 2 — Análise de Produto

**Papel:** Analista de Produto

**Tarefas:**
1. Ler integralmente [site_acolhimento_faesa.tex](../site_acolhimento_faesa.tex) e extrair: visão, personas, jornadas, requisitos funcionais (RF01–RF15) e não-funcionais (RNF01–RNF10).
2. Cruzar **requisitos do LaTeX × rotas do Figma** usando a tabela abaixo como base inicial:

   | Rota Figma | Arquivo | Requisitos LaTeX cobertos (a confirmar) |
   |------------|---------|------------------------------------------|
   | `/login` | [LoginPage.tsx](pagina-acolhimento-faesa/src/app/pages/LoginPage.tsx) | Identificação institucional + regra 0.1 |
   | `/dashboard` | [DashboardHome.tsx](pagina-acolhimento-faesa/src/app/pages/DashboardHome.tsx) | RF de visão geral, gamificação, próximas atividades |
   | `/dashboard/plano-estudos` | [StudyPlanPage.tsx](pagina-acolhimento-faesa/src/app/pages/StudyPlanPage.tsx) | RF de plano de estudos, metas semanais |
   | `/dashboard/concentracao` | [ConcentrationPage.tsx](pagina-acolhimento-faesa/src/app/pages/ConcentrationPage.tsx) | RF de exercícios de concentração |
   | `/dashboard/mentoria` | [MentorshipPage.tsx](pagina-acolhimento-faesa/src/app/pages/MentorshipPage.tsx) | RF de mentoria entre alunos |
   | `/dashboard/forum` | [ForumPage.tsx](pagina-acolhimento-faesa/src/app/pages/ForumPage.tsx) | RF de fórum de discussão |
   | `/dashboard/biblioteca` | [LibraryPage.tsx](pagina-acolhimento-faesa/src/app/pages/LibraryPage.tsx) | RF de biblioteca de recursos |
   | `/dashboard/perfil` | [ProfilePage.tsx](pagina-acolhimento-faesa/src/app/pages/ProfilePage.tsx) | RF de perfil acadêmico |

3. Identificar **requisitos do LaTeX que NÃO têm rota correspondente** no Figma (chatbot, questionário de bem-estar, eventos, LGPD). Decidir: (a) cortar do MVP, (b) acoplar a outra rota existente, (c) criar rota nova.
4. Confirmar que a **paleta visual** do Figma (`#003366`, `#0066CC`, `#28A745`, `#FF8C00`, `#6C757D`, `#F5F7FA`) está alinhada com o documento de cores em [docs/documento-cores-tecnologias-frontend.md](documento-cores-tecnologias-frontend.md).
5. **Não procurar arquivos `.fig`** — o pacote Figma Make já está em `docs/pagina-acolhimento-faesa/` e é a fonte oficial de design.

**Entregável:** Lista de incoerências/lacunas + matriz Rota×Requisito anexada ao diagnóstico.

---

## Fase 3 — Validação com o Desenvolvedor

**Papel:** Facilitador

**Tarefas:**
1. Consolidar **todas** as perguntas das Fases 1 e 2 em uma única rodada de validação.
2. Para cada pergunta, apresentar **2–3 opções de solução** com recomendação.
3. Aguardar respostas antes de prosseguir para a Fase 4. **Não assumir respostas.**
4. Registrar as decisões no Apêndice B.

**Critério de saída:** Todas as ambiguidades de produto resolvidas e documentadas. Decisões B1–B5 já estão registradas — não revalidar.

---

## Fase 4 — Análise de Requisitos Técnicos

**Papel:** Analista de Requisitos

**Tarefas:**
1. Mapear, para cada feature do protótipo, os requisitos técnicos. Use a matriz **Feature × Schema Prisma × Endpoint × Status** abaixo como ponto de partida (cobertura agregada estimada: **~85%**).

   | Feature (rota) | Modelos Prisma | Gap identificado | Status |
   |----------------|----------------|------------------|--------|
   | Login (`/login`) | `Usuario` | B4 dispensa auth real → sem gap | ✅ |
   | Dashboard – cards de meta/horas | `MetaSemanal`, `AtividadeEstudo` | Confirmar campo `duracaoMinutos` em `AtividadeEstudo` | ⚠️ Pendente |
   | Dashboard – sequência de dias (streak) | `Gamificacao` | **Confirmar se há `streakAtual`/`streakRecorde`**. Provável migration nova. | ⚠️ Pendente |
   | Dashboard – conquistas/badges | `Gamificacao` | **Provável precisar de `Conquista` + `UsuarioConquista`** (não vi no DER) | ❌ Falta |
   | Dashboard – próximas atividades (feed misto) | `AtividadeEstudo` ∪ `Mentoria` ∪ `QuestionarioBemEstar` | **Endpoint agregador novo** (`GET /api/feed/proximas-atividades`) | ❌ Falta |
   | Dashboard – sininho | `Notificacao` | OK | ✅ |
   | Plano de estudos | `PlanoEstudo`, `MetaSemanal`, `AtividadeEstudo` | OK | ✅ |
   | Concentração | `ExercicioConcentracao` | OK | ✅ |
   | Mentoria | `Mentoria` (Mentor/Mentorado) | OK | ✅ |
   | Fórum | `ForumDiscussao`, `ForumPost`, `ForumComentario` | OK (já tem migration `forum_comentario_hardening`) | ✅ |
   | Biblioteca | `Recurso`, `UsuarioRecurso`, `TrilhaAprendizagem`, `TrilhaRecurso` | OK | ✅ |
   | Perfil | `Usuario` + `MatriculaAcademica` + `DisciplinaCursada` + `Curso` + `Turma` | Endpoint exige join de 5 tabelas | ⚠️ Complexo |

2. **Mapear endpoints REST mínimos** necessários no `apps/api/`. Como B4 dispensa auth, todos são `GET` públicos no MVP:
   - `GET /api/usuario/me` (mock fixo retornando "Gabriel Malheiros de Castro")
   - `GET /api/dashboard/resumo`
   - `GET /api/dashboard/horas-semanais`
   - `GET /api/dashboard/proximas-atividades`
   - `GET /api/notificacoes`
   - `GET /api/plano-estudos`
   - `GET /api/concentracao/exercicios`
   - `GET /api/mentoria`
   - `GET /api/forum`
   - `GET /api/biblioteca/recursos`
   - `GET /api/perfil`
3. Definir variáveis de ambiente novas: `DATABASE_URL`, `DIRECT_URL` (Prisma + Postgres), `SUPABASE_URL` se aplicável (já documentadas em [docs/secrets.md](secrets.md)).
4. Verificar consistência com [docs/documento-banco-de-dados-tecnologias.md](documento-banco-de-dados-tecnologias.md) e [docs/relatorio-tecnologias-banco-persistencia.md](relatorio-tecnologias-banco-persistencia.md).

**Entregável:** Matriz consolidada Feature × Modelo × Endpoint × Status + lista de migrations Prisma novas a criar.

---

## Fase 5 — Análise de Infraestrutura

**Papel:** Analista de Infra / DevOps

**Tarefas:**
1. **Validar acessos:**
   - **Banco Postgres self-hosted (VPS):** confirmar credenciais em [SUPABASE-CREDENTIALS.txt](../../../SUPABASE-CREDENTIALS.txt) e [docs/secrets.md](secrets.md). Testar conexão via túnel SSH.
   - **EasyPanel:** revisar [docs/ambiente-producao-easypanel.md](ambiente-producao-easypanel.md), [scripts/deploy.sh](../scripts/deploy.sh), [scripts/deploy.mjs](../scripts/deploy.mjs).
   - **Playwright MCP (estação):** confirmar disponibilidade conforme regra 0.4. Sem MCP, Fases 7 e 8 ficam **bloqueadas**.
2. **Plano de migração Prisma `sqlite → postgresql` (decisão B2):**
   - Trocar `provider = "sqlite"` por `"postgresql"` em [banco-dados-requisitos-projeto/prisma/schema.prisma](../banco-dados-requisitos-projeto/prisma/schema.prisma).
   - Adicionar `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")`.
   - **Apagar a pasta de migrations sqlite existentes** (`20260425000000_forum_comentario_hardening` foi gerada para SQLite — incompatível).
   - Rodar `prisma migrate dev --name init_postgres` apontando para o Postgres da VPS via túnel.
   - Criar **seed mínimo** ([banco-dados-requisitos-projeto/prisma/seed.ts](../banco-dados-requisitos-projeto/prisma/seed.ts)): 1 `InstituicaoFaesa`, 1 `Curso`, 1 `Turma`, 1 `Disciplina`, 1 `Usuario` (Gabriel), 1 `MatriculaAcademica`, 1 `Notificacao`, 1 `PlanoEstudo` com `MetaSemanal`.
3. **Plano de reorganização monorepo (decisão B3):**

   ```
   Desenvolvimento-WEB-II/
   ├── apps/
   │   ├── web/                           # Frontend Vite/React (ex-Figma)
   │   │   ├── package.json               # SEM MUI/Emotion (decisão B5)
   │   │   ├── vite.config.ts
   │   │   ├── index.html
   │   │   └── src/                       # main.tsx, app/, styles/
   │   └── api/                           # Backend Express
   │       ├── package.json
   │       └── server.js                  # ex-server.js da raiz
   ├── banco-dados-requisitos-projeto/    # Inalterado (Prisma)
   ├── package.json                       # workspaces npm + scripts agregados
   ├── Dockerfile                         # Multi-stage: build apps/web + bundle apps/api
   ├── docs/                              # Inalterado
   ├── scripts/                           # Inalterado
   └── site_acolhimento_faesa.tex         # Inalterado (Overleaf)
   ```

   - **`package.json` da raiz** declara `"workspaces": ["apps/*"]` + scripts: `dev`, `build`, `start`, `deploy`.
   - **Dockerfile multi-stage:** estágio 1 instala deps + roda `npm run build -w apps/web`; estágio 2 copia `apps/web/dist` + `apps/api/` + `node_modules` da api e expõe `PORT`.
4. **Plano de ajuste do Express (`apps/api/server.js`):**
   - Continuar servindo `/healthz` e `/version` (regra de validação de redeploy).
   - Servir `apps/web/dist/` como estático.
   - Fallback SPA: `app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))`.
   - Adicionar router `/api/*` com os endpoints da Fase 4.
5. **Limpeza pré-build do `apps/web/`:**
   - Remover `src/imports/pasted_text/` (lixo, decisão 0.6).
   - Buscar imports `figma:asset/` em todo `src/app/`. Se existirem, criar `src/assets/` com placeholders ou substituir por SVG inline.
   - Remover do `package.json`: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@popperjs/core`, `react-popper` (decisão B5).
6. **Smoke tests:** `npm run dev` em `apps/web/` e `apps/api/` simultaneamente. Confirmar que `/api/usuario/me` responde JSON e que `http://localhost:5173` renderiza a SPA.

**Entregável:** Checklist de infra com status verde/amarelo/vermelho por item + diff conceitual do `package.json` raiz e Dockerfile.

---

## Fase 6 — Análise de Sistemas (Backlog Executável)

**Papel:** Analista de Sistemas

**Backlog ordenado** (cada item gera **uma iteração TDD na Fase 7**, com bump SemVer ao final):

| # | Item | Arquivos afetados | Critério de aceite | Tipo de bump |
|---|------|-------------------|--------------------|--------------|
| 1 | Migrar Prisma sqlite→postgres + seed mínimo | `banco-dados-requisitos-projeto/prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts` | `prisma migrate status` limpo + seed roda sem erro | MINOR |
| 2 | Reorganizar repo em monorepo `apps/web` + `apps/api` | mover `server.js`→`apps/api/`, mover `docs/pagina-acolhimento-faesa/*`→`apps/web/`, criar `package.json` raiz com workspaces | `npm install` na raiz instala ambos os workspaces | MINOR |
| 3 | Limpar `apps/web/`: remover MUI/Emotion + `pasted_text/` + verificar `figma:asset/` | `apps/web/package.json`, `apps/web/src/imports/`, varredura no `src/app/` | `npm run build -w apps/web` sem erros | PATCH |
| 4 | Reescrever `LoginPage` com regra 0.1 (Disciplina/Docente/Aluno/Repositório + badge versão dinâmico) | `apps/web/src/app/pages/LoginPage.tsx` | E2E Playwright valida presença dos 4 metadados + badge `vX.Y.Z` que bate com `/version` | PATCH |
| 5 | Redirect `/` → `/dashboard` (decisão B4) + manter `/login` acessível | `apps/web/src/app/routes.tsx` | Acessar `http://localhost:3000/` redireciona para `/dashboard`. `/login` renderiza tela conforme item 4. | PATCH |
| 6 | Ajustar Express: servir SPA build + fallback `*` + manter `/healthz` `/version` | `apps/api/server.js`, `Dockerfile` | `curl /version` OK, `curl /` retorna HTML do React, deep links (`/dashboard/plano-estudos` reload direto) funcionam | MINOR |
| 7 | Implementar endpoints `GET /api/*` da Fase 4 com Prisma | `apps/api/server.js` (ou novo `apps/api/routes/`) | Cada endpoint retorna JSON contra dados do seed | MINOR |
| 8 | Substituir mocks no `DashboardHome`, `NotificationBell`, demais páginas por `fetch('/api/...')` | todas as páginas e componentes em `apps/web/src/app/` | UI renderiza dados reais do Postgres via API, sem mocks hard-coded | MINOR |
| 8a | **Gap G4 (RF12 Eventos):** adicionar aba/filtro "Eventos" no `LibraryPage` consumindo modelo `Evento` via `GET /api/eventos` | `apps/web/src/app/pages/LibraryPage.tsx`, `apps/api/` (novo endpoint) | Aba "Eventos" lista registros do seed; filtro alterna entre Recursos/Eventos | PATCH |
| 8b | **Gap G5 (RNF09 LGPD):** modal bloqueante de consentimento no primeiro acesso (decisão P7-a) consumindo `ConsentimentoLgpd` via `POST /api/lgpd/consentimento` | `apps/web/src/app/components/LgpdModal.tsx` (novo), `apps/web/src/app/layouts/RootLayout.tsx`, `apps/api/` (novo endpoint) | Primeiro acesso exibe modal; após aceite, registro persistido no banco e modal não reaparece | MINOR |
| 8c | **Gap GP-1 (US04 lado mentora):** toggle "Buscar mentor / Sou mentor(a)" no `MentorshipPage` consumindo `Mentoria` via `GET /api/mentorias?papel=mentor` e `POST /api/mentorias/cadastro-mentor` | `apps/web/src/app/pages/MentorshipPage.tsx`, `apps/api/` (2 endpoints) | Toggle alterna visuão; cadastro como mentor persiste e aparece em listagem para outros usuários | PATCH |
| 9 | Migration `add_streak_and_conquistas`: `+Gamificacao.streakAtual/streakRecorde/dataUltimaAtividade`, novo modelo `Conquista` (`codigo`, `nome`, `descricao`, `icone`, `pontosBonus`), novo modelo `UsuarioConquista` (com `desbloqueadoEm` + unique composto), migrar `Gamificacao.badges String?` → relação 1:N, **+ `Usuario.eMentor Boolean @default(false)` (decisão P10-a, sustenta item 8c)** | `prisma/schema.prisma`, nova migration, seed estendido com 3 conquistas iniciais + 1 usuário com `eMentor=true` | Dashboard renderiza streak/badges; `GET /api/mentorias?papel=mentor` retorna lista filtrada por `eMentor=true` | MINOR |
| 10 | Ajustar Dockerfile multi-stage + `.dockerignore` + workflow `.github/workflows/deploy.yml` | `Dockerfile`, `.dockerignore`, `.github/workflows/deploy.yml` | Build local da imagem funciona; `docker run` expõe app na porta esperada | PATCH |
| 11 | Bump MAJOR para `v1.0.0`, atualizar `CHANGELOG.md`, commitar e disparar deploy EasyPanel | `package.json`, `CHANGELOG.md`, `apps/web/src/app/pages/LoginPage.tsx` (string da versão se hard-coded) | `curl https://acolhimento.faesa.gmcsistemas.com.br/version` retorna `1.0.0` + Playwright MCP confirma badge na tela `/login` em produção | **MAJOR** |

> **Observação sobre versionamento:** O salto para `v1.0.0` no item 11 marca o primeiro protótipo funcional com UI real + dados reais. Itens 1–10 podem ser micro-bumps (`v0.X.Y`) durante o desenvolvimento, ou consolidados em um único bump MAJOR ao final — decisão tática do desenvolvedor durante a Fase 7.

**Entregável:** Backlog ratificado pelo desenvolvedor antes da Fase 7.

---

## Fase 7 — Desenvolvimento (TDD)

**Papel:** Desenvolvedor Especializado

**Regra de ouro:** **Teste primeiro, código depois.** Sem exceção.

**Pré-condição obrigatória:** Verificar que o servidor MCP do Playwright está ativo (regra 0.4). Se não estiver, parar e perguntar ao desenvolvedor.

**Ciclo por item do backlog (Fase 6):**

1. **RED** — Escrever o(s) teste(s) que falham, cobrindo o critério de aceite definido na Fase 6:
   - **Itens 1, 7, 9** → testes de integração API/DB com Vitest + supertest (qualquer ambiente).
   - **Itens 4, 5, 8** → testes E2E Playwright via MCP (**somente estação**) verificando rotas SPA, conteúdo renderizado e dados consumidos da API.
   - **Item 6** → mix: smoke `curl` para `/healthz`, `/version`, deep link `/dashboard/perfil`.
   - **Itens 2, 3, 10** → testes de build (`npm run build` exit 0; `docker build` exit 0).
   - **Item 4 obrigatoriamente** valida presença de `Disciplina`, `Docente`, `Aluno`, `Repositório` e badge `site-acolhimento-faesa · vX.Y.Z` na rota `/login` (regra 0.1).
2. Rodar a suíte e **confirmar que falham pelo motivo esperado**.
3. **GREEN** — Implementar o mínimo de código para passar o teste.
4. Rodar a suíte e confirmar que passa.
5. **REFACTOR** — Melhorar o código mantendo testes verdes.
6. Atualizar [CHANGELOG.md](../CHANGELOG.md) com a entrada da iteração.
7. Aplicar bump SemVer conforme tabela da Fase 6 (regra do `copilot-instructions.md` Seção 11.1) atualizando `package.json` raiz, `apps/web/package.json` se aplicável, e a string de versão na `LoginPage`.
8. Commit atômico em pt-BR (Conventional Commits, Seção 9 das instruções).

**Critério de saída da fase:** 100% dos testes verdes, build local funcionando, versão atualizada e refletida em `/version` localmente.

---

## Fase 8 — QA com Foco no Usuário

**Papel:** Analista de QA

> **Pré-requisito de ambiente:** validação UI/E2E **só pode ser executada na estação** com o servidor MCP do Playwright ativo (regra 0.4).

**Tarefas:**
1. Garantir que o **seed da Fase 5** está aplicado no Postgres da VPS (ou criar dados de teste extras prefixados com `qa_test_` para limpeza futura).
2. Documentar IDs/dados criados em [docs/relatorios faesa/qa-dados-teste-v1.md](relatorios%20faesa/qa-dados-teste-v1.md) para remoção posterior.
3. Executar a jornada do usuário ponta a ponta usando esses dados via Playwright MCP, na seguinte ordem:
   - Acessar `/` → confirmar redirect para `/dashboard`.
   - Acessar `/login` → confirmar regra 0.1 (4 metadados + badge versão correto).
   - Clicar "Entrar" → confirmar `navigate("/dashboard")`.
   - `/dashboard` → confirmar cards (metas, horas, streak), gráfico recharts, lista de próximas atividades, sininho com notificações reais.
   - Navegar pela sidebar para cada uma das 7 sub-rotas → confirmar render sem erros e dados vindos da API.
   - Recarregar `/dashboard/perfil` (deep link) → confirmar fallback SPA do Express funcionando.
4. Validar usabilidade, mensagens de erro, responsividade básica (sidebar mobile do `DashboardLayout`).
5. Para **cada falha**: **retornar à Fase 7** com relato detalhado (passo, esperado, observado, screenshot via MCP). Não tentar corrigir como QA.

**Critério de saída:** Todos os cenários passam. Lista de dados de teste registrada para limpeza futura.

---

## Fase 9 — Loop de Correção

**Papel:** Coordenador

- Sempre que **qualquer teste** (TDD ou QA) falhar:
  1. Pausar o avanço.
  2. Voltar para a Fase 7.
  3. Reescrever/ajustar testes se necessário, corrigir código, repetir RED-GREEN-REFACTOR.
  4. Re-executar QA somente após toda a suíte automatizada estar verde.

---

## Fase 10 — Entrega (Commit, Push, Deploy)

**Papel:** Release Engineer

**Pré-requisitos:**
- ✅ Suíte de testes 100% verde
- ✅ QA aprovado (Fase 8)
- ✅ Versão `v1.0.0` (ou bump final) atualizada em [package.json](../package.json), [CHANGELOG.md](../CHANGELOG.md) e tela `/login`
- ✅ Documentação obsoleta atualizada/removida (regra 0.2) — **remover [docs/Página de acolhimento FAESA.zip](Página%20de%20acolhimento%20FAESA.zip) e a pasta extraída [docs/pagina-acolhimento-faesa/](pagina-acolhimento-faesa/)** após o item 2 do backlog (decisão P5)

**Tarefas:**
1. `git status` — revisar alterações.
2. Commit final com mensagem semântica: `feat: primeiro protótipo v1.0.0 — adoção UI Figma + integração Prisma/Postgres`.
3. `git push origin master`.
4. Executar deploy via [scripts/deploy.mjs](../scripts/deploy.mjs).
5. **Validar o redeploy** (regra 0.1):
   - `curl https://acolhimento.faesa.gmcsistemas.com.br/version` → versão bate com `package.json`.
   - `curl https://acolhimento.faesa.gmcsistemas.com.br/healthz` → `{"status":"ok"}`.
   - **Playwright MCP** abre `https://acolhimento.faesa.gmcsistemas.com.br/login` e valida visualmente os 4 metadados + badge `site-acolhimento-faesa · v1.0.0`.
6. **Não apagar os dados de teste** criados na Fase 8 — serão removidos em rotina dedicada.

**Critério de saída:** Versão `v1.0.0` visível em produção, validada por `/version` (qualquer ambiente) **e** validada visualmente pela tela `/login` (Playwright MCP, somente estação).

---

## Apêndice A — Checklist Resumido

- [ ] Fase 1: Diagnóstico do estado atual (incl. inventário do pacote Figma)
- [ ] Fase 2: Análise de produto (LaTeX × rotas Figma × paleta)
- [ ] Fase 3: Perguntas validadas com o desenvolvedor (B1–B5 já fechadas)
- [ ] Fase 4: Requisitos técnicos mapeados (matriz Feature×Schema×Endpoint)
- [ ] Fase 5: Infra validada — Postgres acessível, monorepo planejado, Dockerfile multi-stage projetado, MCP Playwright ativo
- [ ] Fase 6: Backlog ordenado (11 itens) aprovado pelo desenvolvedor
- [ ] Fase 7: Implementação via TDD (RED → GREEN → REFACTOR) item a item
- [ ] Fase 8: QA E2E via Playwright MCP com dados reais do seed
- [ ] Fase 9: Loop de correção (se aplicável)
- [ ] Fase 10: Commit, push, deploy EasyPanel e validação dupla (`/version` + visual da tela `/login`)
- [ ] Higiene documental: docs obsoletas atualizadas/removidas; ZIP do Figma removido após adoção
- [ ] `Disciplina`, `Docente`, `Aluno`, `Repositório` presentes na tela `/login`
- [ ] `site-acolhimento-faesa · v1.0.0` (ou bump final) atualizado e visível em produção
- [ ] Servidor MCP do Playwright verificado na estação antes de qualquer teste E2E/UI

---

## Apêndice B — Registro de Decisões

| # | Data | Pergunta | Opções apresentadas | Decisão | Responsável |
|---|------|----------|--------------------|---------|-------------|
| B1 | 2026-04-28 | Como adaptar a `LoginPage` do Figma para satisfazer regra 0.1 (Disciplina/Docente/Aluno/Repositório + badge versão)? | (a) Adicionar bloco fixo no rodapé / (b) Substituir rodapé atual / (c) Reescrever a tela inteira respeitando o design system | **(c) Reescrever a tela inteira** mantendo design system Figma + conteúdo da regra 0.1 | Gabriel |
| B2 | 2026-04-28 | Migração SQLite → Postgres do schema Prisma | (a) Migrar agora antes da UI / (b) SQLite em dev + Postgres em prod / (c) Adiar | **(a) Migrar agora**, antes de adotar a UI. Migrations limpas + seed mínimo. | Gabriel |
| B3 | 2026-04-28 | Como servir a SPA Vite + manter Express? | (a) Mover Figma para a raiz substituindo `public/` / (b) Monorepo `apps/web` + `apps/api` / (c) Frontend em outro container | **(b) Monorepo** `apps/web` + `apps/api`, build conjunto | Gabriel |
| B4 | 2026-04-28 | Estratégia de autenticação no protótipo | (a) Auth mock localStorage / (b) Bcrypt + endpoint /auth/login / (c) Pular login (rota raiz vai pro dashboard) | **(c) Pular login** no protótipo. Rota raiz redireciona para `/dashboard`. `/login` mantida apenas como artefato da regra 0.1. | Gabriel |
| B5 | 2026-04-28 | MUI + shadcn convivendo no `apps/web/` | (a) Remover MUI/Emotion / (b) Manter ambos / (c) Manter MUI e remover shadcn | **(a) Remover MUI/Emotion** no commit de adoção, ficar só com Radix/shadcn | Gabriel |

### Pendências resolvidas em 2026-04-28 (Fase 1 — diagnóstico)

| # | Pergunta | Resolução |
|---|----------|-----------|
| P1 | `Gamificacao` tem campos de `streak*` e relação com `Conquista`/`UsuarioConquista`? | ❌ **Não tem.** `Gamificacao` atual: `pontosTotais`, `badges String?` solto, `rankingPosicao`. Confirmado: migration nova obrigatória — ver item 9 do backlog (Fase 6). |
| P2 | `AtividadeEstudo` tem campo de duração? | ✅ **Já tem** `duracaoMinutos Int?`. Sem migration. |
| P3 | Workspaces npm: nomenclatura final? | **`apps/web` + `apps/api`** (padrão Turborepo/Nx). |
| P4 | Manter `react-router 7` ou migrar para Next.js? | **Manter `react-router 7`** do Figma. Zero atrito. LaTeX será atualizado depois para refletir a stack real. |
| P5 | Destino do ZIP `docs/Página de acolhimento FAESA.zip`? | **Remover** após a migração para `apps/web/` (regra 0.2 — higiene documental). Item adicionado à Fase 10. |

### Pendências resolvidas em 2026-04-28 (Fase 2 — matriz rotas×RF)

> Referência: [docs/relatorios faesa/fase2-matriz-rotas-rf.md](relatorios%20faesa/fase2-matriz-rotas-rf.md)

| # | Pergunta | Resolução |
|---|----------|-----------|
| P6 | Modelos `Chatbot*` no schema sem RF correspondente | **Manter dormente** no schema. Adicionar **RF16 — Chatbot Conversacional** no LaTeX em edição futura no Overleaf. Sem UI no v1.0.0. |
| P7 | Como apresentar consentimento LGPD na UI | **Modal bloqueante no primeiro acesso** consumindo `ConsentimentoLgpd`. Vira item 8b do backlog. |
| P8 | `AvaliacaoDisciplina` sem RF nem UI | **Manter dormente.** Dado de input acadêmico, alimenta dashboard futuramente. Sem mudança no v1.0.0. |

### Pendências resolvidas em 2026-04-28 (Fase 3 — personas×rotas)

> Referência: [docs/relatorios faesa/fase3-personas-rotas.md](relatorios%20faesa/fase3-personas-rotas.md)

| # | Pergunta | Resolução |
|---|----------|-----------|
| P9 | Lado mentora (US04, persona P-B Mariana) no v1.0.0 | **Toggle no `MentorshipPage`** (Opção A). Vira item **8c** do backlog. Cobre US04 no v1.0.0. |

### Pendências resolvidas em 2026-04-28 (Fase 4 — contrato API)

> Referência: [docs/relatorios faesa/fase4-contrato-api.md](relatorios%20faesa/fase4-contrato-api.md)

| # | Pergunta | Resolução |
|---|----------|-----------|
| P10 | Como marcar usuário como mentor (sustenta item 8c) | **Coluna `eMentor Boolean @default(false)` em `Usuario`**. Soma ao item 9 (mesma migration `add_streak_and_conquistas`). |

### Pendências resolvidas em 2026-04-28 (Fase 5 — infraestrutura)

> Referência: [docs/relatorios faesa/fase5-infra-plano.md](relatorios%20faesa/fase5-infra-plano.md)

| # | Pergunta | Resolução |
|---|----------|-----------|
| P11 | Onde colocar o Prisma no monorepo? | **`packages/db/`** separado (Turborepo-style). Estrutura final: `apps/web/`, `apps/api/`, `packages/db/`. |

### Bloqueadores manuais antes da Fase 7

| ID | Bloqueador | Ação |
|----|------------|------|
| B-1 | Túnel SSH não testado | `pwsh ./scripts/dev-tunnel.ps1` + `psql "$env:DIRECT_URL" -c "SELECT version();"` |
| B-2 | MCP Playwright não confirmado | Verificar painel MCP do VS Code |
| B-3 | Env vars EasyPanel | Confirmar `DATABASE_URL` no painel do serviço |

### Dívidas declaradas para v1.1.0 / v2.0.0 (Fase 2)

| RF | Motivo do adiamento | Versão-alvo |
|----|---------------------|-------------|
| RF11 — Avaliação de Bem-estar | Exige nova rota `/dashboard/bem-estar` + lógica de questionário periódico | v1.1.0 |
| RF14 — Relatórios Coordenação | Persona ≠ aluno; exige auth real (incompatível com B4) | v2.0.0 |
| RF15 — Chat Suporte Psicopedagógico | Exige Socket.io + canal moderado | v2.0.0 |
| RF12 dedicado | Aba dedicada `/dashboard/eventos` separada da biblioteca | v1.1.0 |
| RF16 — Chatbot (novo) | Modelos já existem; aguarda redacionamento no LaTeX | v1.2.0 |

---

## Apêndice C — Dados de Teste Criados (a remover no futuro)

> Preencher na Fase 8 com prefixo `qa_test_` e IDs/PKs gerados.

| Tabela | ID/PK | Descrição | Criado em |
|--------|-------|-----------|-----------|
|        |       |           |           |

---

## Apêndice D — Inventário do Pacote Figma Make (referência rápida)

**Localização:** [docs/pagina-acolhimento-faesa/](pagina-acolhimento-faesa/)

**Stack:**
- React 18.3.1 + Vite 6.3.5 + TypeScript
- react-router 7.13.0 (`createBrowserRouter`)
- Tailwind CSS 4.1.12 (`@tailwindcss/vite`)
- Radix UI (set completo via shadcn) + lucide-react + recharts + react-hook-form + sonner + motion + react-dnd + embla + cmdk + vaul
- ⚠️ MUI 7 + Emotion (a remover, decisão B5)
- Plugin custom `figmaAssetResolver()` em [vite.config.ts](pagina-acolhimento-faesa/vite.config.ts) para resolver `figma:asset/...`

**Rotas (`createBrowserRouter`):**
- `/` (atualmente `LoginPage`, mudará para redirect → `/dashboard` no item 5)
- `/login` (será criada no item 5; reescrita no item 4)
- `/dashboard` (`DashboardHome`)
- `/dashboard/plano-estudos` (`StudyPlanPage`)
- `/dashboard/concentracao` (`ConcentrationPage`)
- `/dashboard/mentoria` (`MentorshipPage`)
- `/dashboard/forum` (`ForumPage`)
- `/dashboard/biblioteca` (`LibraryPage`)
- `/dashboard/perfil` (`ProfilePage`)
- `*` (`NotFound`)

**Layouts:**
- [RootLayout.tsx](pagina-acolhimento-faesa/src/app/layouts/RootLayout.tsx) — passthrough (`<Outlet/>`)
- [DashboardLayout.tsx](pagina-acolhimento-faesa/src/app/layouts/DashboardLayout.tsx) — sidebar fixa + header com `NotificationBell` e avatar "GM"

**Componentes globais:**
- [NotificationBell.tsx](pagina-acolhimento-faesa/src/app/components/NotificationBell.tsx) — sininho com 3 notificações mock
- [ImageWithFallback.tsx](pagina-acolhimento-faesa/src/app/components/figma/ImageWithFallback.tsx) — wrapper de imagem do Figma
- 47 componentes shadcn/ui em [src/app/components/ui/](pagina-acolhimento-faesa/src/app/components/ui/)

**Estado de dados:** **100% mock client-side.** Nenhum fetch HTTP. Toda integração com a API/Prisma será construída do zero na Fase 7.

**Lixo identificado (a remover):**
- [src/imports/pasted_text/](pagina-acolhimento-faesa/src/imports/pasted_text/) — cópias dos planos `.md` de `docs/`.
