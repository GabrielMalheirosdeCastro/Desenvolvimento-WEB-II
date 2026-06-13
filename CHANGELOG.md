# Changelog

Todas as alterações relevantes deste projeto serão documentadas aqui.

O formato segue o padrão [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

## [1.3.1] - 2026-06-13

### Added

- **Fluxo de debug F5 no VS Code** (`.vscode/`): tarefas `Dev: serve + wait`, `Dev: wait for server ready` e `Dev: stop Express server` sobem o Express (porta 3010), aguardam `/healthz` responder 200 e encerram o servidor ao fim da sessao de debug.
- **Documentacao do funcionamento da API REST** no `README.md` e em `docs/relatórios entrega/relatorio-funcionamento-api.md`, descrevendo os endpoints `/api/*`, o mecanismo de fallback resiliente e os endpoints de validacao `/healthz` e `/version`.

### Changed

- Bump 1.3.0 -> **1.3.1** (PATCH — tooling de debug + documentacao, sem alteracao de contrato de API). `apps/web` e `apps/api` alinhados em 1.3.1.

## [1.3.0] - 2026-05-13

### Added

- **Endpoint `GET /api/dashboard/streak`** em `apps/api/routes.js`: retorna `streak_atual`, `streak_recorde` e `data_ultima_atividade` do modelo `Gamificacao` para a persona logada (matricula `23110145`). Fallback estatico mantem `atual=12 / recorde=18`.
- **Card "Sequencia de Dias"** do `DashboardHome.tsx` agora consome o endpoint via `fetch('/api/dashboard/streak')` e exibe o recorde abaixo do contador (antes era hard-coded em `12`).
- **Proxy de desenvolvimento no Vite** (`apps/web/vite.config.ts`): rotas `/api`, `/version` e `/healthz` sao encaminhadas para `http://localhost:3010`. Sem isso, em `npm run dev:web` a SPA nao alcancava o Express e todos os componentes caiam silenciosamente no fallback estatico.

### Changed

- Bump 1.2.0 -> **1.3.0** (MINOR — novo endpoint + nova feature de UI retrocompativel + integracao dev). `apps/web` e `apps/api` alinhados em 1.3.0.

## [1.2.0] - 2026-05-03

### Added

- **Sprint 8a — Eventos institucionais (RF12 / gap G4):**
    - `GET /api/eventos` lista registros do modelo `Evento` (titulo, descricao, tipo, data, local, vagas).
    - `LibraryPage` ganha abas **Recursos / Eventos**; aba Eventos consome o endpoint e renderiza cards com data formatada (pt-BR), local, vagas e botao de inscricao.
- **Sprint 8b — Modal LGPD bloqueante (RNF09 / gap G5 / decisao P7-a):**
    - Novo componente `apps/web/src/app/components/LgpdModal.tsx` montado no `RootLayout`.
    - Exibido no primeiro acesso; armazena flag em `localStorage` apos aceite.
    - `POST /api/lgpd/consentimento` persiste na tabela `consentimentos_lgpd` (usuario, finalidade, versao do termo, IP, user-agent).
- **Sprint 8c — Toggle mentor/buscar (US04 / gap GP-1):**
    - `MentorshipPage` ganha toggle **Buscar mentor / Sou mentor(a)**.
    - `GET /api/mentorias?papel=mentor` lista usuarios com `e_mentor=TRUE`.
    - `POST /api/mentorias/cadastro-mentor` marca a persona logada como mentor (`UPDATE usuarios SET e_mentor=TRUE`).
- Middleware `express.json({ limit: '64kb' })` ativado no `apps/api/server.js` para suportar os novos endpoints POST.

### Changed

- Bump 1.1.0 -> **1.2.0** (MINOR — 4 novos endpoints + 2 features de UI retrocompativeis).

## [1.1.0] - 2026-05-03

### Added

- **Sprint 7 — API REST minima (`apps/api/routes.js`):**
    - `GET /api/_status` — diagnostico do pool Postgres (`connected`/`fallback`).
    - `GET /api/me` — dados da persona principal (matricula `23110145`).
    - `GET /api/dashboard/upcoming` — proximas atividades do plano de estudos.
    - `GET /api/dashboard/week` — horas de estudo agregadas por dia da semana corrente.
    - `GET /api/dashboard/badges` — conquistas recentes do usuario.
- **Pool Postgres compartilhado (`apps/api/db.js`)** com `pg` 8.13.x, configurado para Supabase pooler na rede overlay `easypanel` (host `supabase-pooler:6543`).
- **Resiliencia por design:** quando `DATABASE_URL` nao esta definido OU a query falha, todos os endpoints retornam payload de fallback marcado com `source: "fallback"`. Isso evita quebrar o deploy enquanto a variavel de ambiente nao e configurada no painel do EasyPanel.

### Changed

- **Sprint 8 (parcial) — `DashboardHome.tsx` consome a API real:** `weekData`, `recentBadges` e `upcomingActivities` deixam de ser literais hardcoded e passam a ser buscados via `fetch('/api/dashboard/...')` no `useEffect`. Mantem os literais como estado inicial (fallback otimista) para evitar flash visual.
- `apps/api/package.json` ganha dependencia `pg ^8.13.1`.
- Bump 1.0.2 → **1.1.0** (MINOR — nova superficie de API publica retrocompativel).

### Pending

- Configurar `DATABASE_URL` como variavel de ambiente do servico `acolhimento_faesa` no EasyPanel apontando para `postgresql://postgres.gmc:GmceNilza_01_Gmc@supabase-pooler:6543/postgres?pgbouncer=true` para que os endpoints saiam do modo fallback.

## [1.0.2] - 2026-05-03

### Changed

- **Dockerfile reescrito como single-stage (decisao operacional):** o estagio `web-build` multi-stage falhava silenciosamente no EasyPanel/VPS (provavel OOM durante `npm install` + `vite build` em VPS apertada que coabita com Supabase self-hosted). Estrategia adotada: o `apps/web/dist/` agora e gerado localmente (`npm run build -w @site-acolhimento/web` ou `npm run prepare-deploy`) e **versionado no Git**. O Dockerfile final apenas instala a API e copia o dist pronto.
- `.gitignore` atualizado: excecao explicita para `apps/web/dist/` (continua ignorando `dist/` em qualquer outro lugar).
- `.dockerignore` ajustado: exclui `apps/web/src/`, `apps/web/index.html`, configs do Vite/TS/ESLint/Tailwind — apenas o `dist/` entra na imagem (reduz contexto de build).
- `package.json` raiz: novo script `prepare-deploy` (alias de `build`) para uso explicito antes de commits que afetam a SPA.

### Rationale

- Trade-off academico aceitavel para um prototipo: o repo cresce ~700 kB por release, mas o build no servidor passa a ser instantaneo e nao depende de RAM/CPU da VPS.
- O processo manual de "buildar antes de commitar" e protegido pelo Dockerfile: se o `apps/web/dist/` estiver desatualizado/ausente, o `COPY apps/web/dist` falha o build do Docker — feedback imediato.

## [1.0.1] - 2026-05-03

### Fixed

- **Dockerfile estagio `web-build`:** trocado `npm ci --workspace ... --include-workspace-root` por `npm install --workspace ... --include-workspace-root --no-audit --no-fund`. O `npm ci` falhava no EasyPanel porque o `package-lock.json` da raiz nao tinha todas as devDeps de build do Vite resolvidas no contexto Docker (deploy ficou preso na v0.5.1 ate este patch).

## [1.0.0] - 2026-05-03

### Added

- **Sprint 4–6 — Primeiro prototipo funcional integrado:**
    - SPA React (`apps/web`) e backend Express (`apps/api`) agora rodam como um unico artefato unificado servido pelo container do EasyPanel.
    - `apps/api/server.js` passa a servir `apps/web/dist/` como conteudo estatico e implementa fallback SPA (`*` → `index.html`) para que rotas profundas (`/login`, `/dashboard/*`) funcionem em refresh direto do navegador.
    - Mantem fallback para a antiga pagina "Em Construcao" (`apps/api/public/`) quando o build da SPA esta ausente (ex.: dev local sem `npm run build`).
- **LoginPage reescrita conforme regra 0.1 do plano:** exibe Disciplina (Desenvolvimento Web II — D001508), Docente (Otavio Lube dos Santos), Aluno (Gabriel Malheiros — 23110145), Repositorio (link do GitHub) e badge `site-acolhimento-faesa · v{version}` lido dinamicamente de `/version` via `fetch`.
- **Decisao B4 do plano:** rota raiz (`/`) redireciona para `/dashboard` via `<Navigate replace>`. A rota `/login` continua acessivel para satisfazer a regra 0.1 (badge de versao + metadados academicos).

### Changed

- **Dockerfile reescrito como multi-stage:** estagio `web-build` instala devDeps do workspace `@site-acolhimento/web` e gera `apps/web/dist`; estagio `runtime` (node:20-alpine) instala apenas o workspace `@site-acolhimento/api` em modo `--omit=dev` e copia o artefato buildado da SPA do estagio anterior. Reduz superficie de ataque e tamanho final da imagem.
- `.dockerignore` ajustado para permitir `apps/web/` no contexto de build (necessario para o estagio `web-build`), excluindo apenas `apps/web/node_modules/` e `apps/web/dist/` locais.
- `.github/workflows/deploy.yml` removeu `apps/web/**` do `paths-ignore` — agora mudancas na SPA disparam redeploy automaticamente.

### Bumped

- `site-acolhimento-faesa` 0.5.1 → **1.0.0** (MAJOR): primeiro prototipo do produto em producao com SPA real (substitui a pagina "Em Construcao" na rota raiz).
- `@site-acolhimento/web` 0.5.1 → 1.0.0; `@site-acolhimento/api` 0.5.0 → 1.0.0.

### Verified

- Build local da SPA: `npm run build -w @site-acolhimento/web` em 5.37 s, 684 kB JS, 99 kB CSS.
- Smoke test do servidor unificado: `GET /version` → `{"name":"site-acolhimento-faesa","version":"1.0.0"}`; `GET /login` → HTML da SPA; `GET /dashboard/perfil` → 200 (fallback SPA OK).



### Removed

- **Sprint 3 — Limpeza do pacote Figma (decisao B5):** removidas dependencias nao utilizadas de `apps/web/package.json` (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@popperjs/core`, `react-popper`). Verificacao previa por `Select-String` confirmou que nenhum modulo da SPA importa esses pacotes — design system real e Radix + shadcn + Tailwind.
- Removido o diretorio `apps/web/src/imports/pasted_text/` (lixo trazido do Figma Make — eram copias dos `.md` do diretorio `docs/`, decisao 0.6 do plano).

### Verified

- Varredura por `figma:asset/` em `apps/web/src/` retornou zero resultados (nao ha imports quebrados de assets ausentes).
- `npm run build -w @site-acolhimento/web` concluido com sucesso (2241 modulos, 682 kB JS, 99 kB CSS, 7.24 s) — confirma que a remocao das dependencias nao quebrou a SPA.

## [0.5.0] - 2026-05-03

### Changed

- **Sprint 2 — Reorganizacao em monorepo (decisao B3):**
    - `server.js` e `public/` movidos para `apps/api/` (workspace `@site-acolhimento/api`).
    - `docs/pagina-acolhimento-faesa/` (pacote Figma) movido para `apps/web/` (workspace `@site-acolhimento/web`).
    - `banco-dados-requisitos-projeto/` movido para `packages/db/` (workspace `@site-acolhimento/db`).
    - `package.json` raiz agora declara `workspaces: ["apps/*", "packages/*"]`; `dependencies` movidas para os respectivos workspaces.
    - `Dockerfile` ajustado para layout monorepo: copia `apps/api/` e instala apenas o workspace da API. `CMD` atualizado para `node apps/api/server.js`.
    - `.dockerignore` e `.github/workflows/deploy.yml` atualizados (substitui `banco-dados-requisitos-projeto/` por `packages/` e `apps/web/`).
    - `apps/api/server.js` agora le `package.json` da raiz para responder `/version` (mantem regra 0.1).
- **Higiene do repositorio:** removido o `node_modules/` do antigo `banco-dados-requisitos-projeto/` que havia sido versionado por engano (~8.4k arquivos).

### Added

- Nova versao `0.5.0` da app raiz (MINOR: reorganizacao estrutural sem quebra do contrato `/healthz` e `/version`).

### Sprint 1 (incorporado a esta versao)

- Subprojeto `banco-dados-requisitos-projeto/` (agora `packages/db/`) migrado de SQLite para PostgreSQL 17.6 (Supabase self-hosted na VPS, acessado via tunel SSH). `provider` trocado para `postgresql` no `schema.prisma`; URLs (`DATABASE_URL`/`DIRECT_URL`) movidas para `prisma.config.ts` conforme exigencia do Prisma 7. `lib/prisma.ts` agora usa `PrismaPg` (driver adapter) em vez de `PrismaBetterSqlite3`. Adicionadas dependencias `@prisma/adapter-pg` e `pg`. Bump do subprojeto para `2.0.0`.
- Migration `20260430141247_init_postgres`: criacao inicial das ~30 tabelas no Postgres.
- Migration `20260430141332_add_streak_and_conquistas`: novo campo `Usuario.eMentor`, novos campos `Gamificacao.streakAtual/streakRecorde/dataUltimaAtividade` (substituindo `badges`), e novos modelos `Conquista` e `UsuarioConquista` (com unique composto `(usuarioId, conquistaId)`).
- `prisma/seed.ts`: popula `InstituicaoFaesa` (FAESA-VIT), cursos SI (id=1) e PSI (id=2) e as 3 personas — Lucas Silva (calouro, ALUNO), Mariana Costa (mentora, ALUNO `eMentor=true`) e Prof. Ricardo Almeida (DOCENTE).

## [0.4.0] - 2026-04-26

### Added

- **Infraestrutura de producao (2026-04-26):** documentacao e ferramental para deploy real em VPS Hostinger com EasyPanel.
    - `Dockerfile`, `.dockerignore`, `package.json`, `server.js`, `public/index.html`, `public/styles.css`, `public/favicon.svg`: aplicação mínima Node 20 + Express servindo página *Em Construção* (sem conexão com banco) — exclusivamente para validar o pipeline EasyPanel → Traefik → HTTPS antes do início do desenvolvimento real. Endpoints `/`, `/healthz` e `/version`.
    - `scripts/deploy.mjs` e `scripts/deploy.sh`: disparam o webhook de implantação do EasyPanel a partir de `EASYPANEL_DEPLOY_WEBHOOK` (lido de `.env`).
    - `scripts/dev-tunnel.ps1`: abre túneis SSH (5432 → `supabase-db`, 6543 → `supabase-pooler`) a partir do Windows 11 para acesso ao Postgres da VPS.
    - `.github/workflows/deploy.yml`: GitHub Action que dispara o webhook do EasyPanel em `push` para `master` (usando o segredo `EASYPANEL_DEPLOY_WEBHOOK`).
    - `.vscode/tasks.json`: tarefas para deploy, dev-server, build/run Docker e túnel SSH.
    - `.env.example`, `.gitignore`: contrato de variáveis de ambiente e ignorados padrão.
    - `docs/ambiente-producao-easypanel.md`: guia operacional consolidado da arquitetura de produção (VPS Hostinger + EasyPanel + Traefik + Supabase self-hosted), URL pública, runbook de redeploy, troubleshooting.
    - `docs/setup-desenvolvimento-windows.md`: passo a passo para a estação Windows 11 sem Postgres local — Node 20 LTS, túnel SSH, conexão com o banco da VPS.
- `docs/relatorio-api-site-acolhimento.md`: novo documento de contrato técnico da API REST e WebSocket — cobre os 33 modelos do schema Prisma, 16 RFs e 10 RNFs em 18 módulos (~115 endpoints REST + 4 namespaces Socket.io), com seções de RBAC (4 papéis), tratamento de erros HTTP, rate limiting/cache (Upstash), conformidade LGPD e versionamento `/api/v1`.
- `site_acolhimento_faesa.tex`: adicionada subseção 1.4 "Limitações de Escopo" — declara explicitamente o que o sistema não faz (portal acadêmico, atendimento psicológico profissional, processos financeiros, integração interinstitucional, dados de saúde protegidos).
- `site_acolhimento_faesa.tex`: adicionado RF16 — Chatbot IA de Acolhimento com respostas adaptadas por faixa etária (17–20, 21–25, 26+).
- `site_acolhimento_faesa.tex`: adicionada RN07 — regra de negócio que define a coleta obrigatória de idade e redirecionamento para suporte humano se menor de 17.
- `site_acolhimento_faesa.tex`: adicionado Diagrama de Atividades do Chatbot IA (nova seção 4.6).
- `README.md`: tabela de funcionalidades atualizada com RF16.
- `docs/plano-2026-03-04-adiciona-chatbot-ia-rf16.md`: plano de ação documentando escopo, faixas etárias e etapas.

### Fixed

- `site_acolhimento_faesa.tex`: corrigido bug de `\rowcolor` nas tabelas RF e RNF — o nome da cor (`reqFunc`, `reqNFunc`) aparecia como texto literal por falta da opção `[table]` no pacote `xcolor`.
- `site_acolhimento_faesa.tex`: corrigidos relacionamentos `<<include>>` e `<<extend>>` semanticamente incorretos no diagrama de casos de uso (seção 4.1).
- `site_acolhimento_faesa.tex`: removida composição espúria `Recurso → Meta` (`\draw[-{Diamond}]`) no diagrama de classes (seção 4.2).
- `site_acolhimento_faesa.tex`: comentário no cabeçalho do arquivo corrigido — removida menção a `pdflatex` (compilador proibido no projeto).
- `site_acolhimento_faesa.tex`: nome do aluno na capa corrigido de `Gabriel Malheiros` para `Gabriel Malheiros de Castro`.
- `site_acolhimento_faesa.tex`: matrícula 23110145 adicionada à capa do documento.
- `site_acolhimento_faesa.tex`: professor na capa corrigido de placeholder `[Nome do Professor]` para `Otávio Lube dos Santos`.
- `site_acolhimento_faesa.tex`: disciplina na capa atualizada para incluir o código `D001508`.
- `.github/copilot-instructions.md`: nomes de cores na seção 5 corrigidos (`faesamaroon`, `faesagold` → `faesaAzul`, `faesaAzulClaro`, `faesaLaranja`, etc.) para refletir a paleta real do documento.
- `README.md`: diagrama ASCII de arquitetura atualizado — camada de dados agora exibe `Supabase (PostgreSQL) · Redis/Upstash` em vez de `PostgreSQL · Redis (Cache)`.
- `README.md`: tabela de RNFs completada com RNF07 (Usabilidade), RNF08 (Manutenibilidade) e RNF10 (Internacionalização), que estavam ausentes.
- `README.md`: adicionada linha de matrícula (23110145) na tabela de Informações Acadêmicas.

### Changed

- **Stack de deploy revisada (2026-04-26):** `README.md` e `docs/relatorio-tecnologias-banco-persistencia.md` §2.3, §2.4 e §10 atualizados para refletir o ambiente real — substituição de **Vercel + Supabase Cloud** por **EasyPanel (Docker Swarm + Traefik) em VPS Hostinger + Supabase self-hosted (PostgreSQL 17.6) na mesma VPS**. Justificativa: o servidor já está provisionado e operacional, eliminando custos de Cloud e mantendo o pooling Supavisor via DNS interno Docker (`supabase-pooler:6543`).
- `.github/copilot-instructions.md`: ativado o **Gatilho de Pivô §8.4** (criação de `package.json` na raiz). Seções 2 e 2.3 refatoradas para refletir que o repositório agora contém código Node.js de aplicação (página *Em Construção*) e que o ambiente de deploy é EasyPanel/VPS, não Vercel. Restrição de não-edição local do `.tex` mantida (Overleaf continua sendo a fonte de verdade).
- `site_acolhimento_faesa.tex`: diagrama de casos de uso simplificado — reduzido de 13 para 10 casos de uso, eliminados cruzamentos de linhas, associações ator-UC trocadas de setas para linhas simples (norma UML).
- `site_acolhimento_faesa.tex`: diagrama de fluxo de navegação reestruturado — Dashboard como hub central, removidas conexões lineares artificiais entre módulos independentes.
- `site_acolhimento_faesa.tex`: diagrama ER completado com atributos-chave (PKs sublinhadas) em todas as entidades.

---

## [0.3.0] - 2026-02-28

### Changed

- Banco de dados substituído de PostgreSQL self-hosted para **Supabase (PostgreSQL 16+)**
  gerenciado em nuvem, com pooling via Supavisor para compatibilidade com Vercel serverless.
- Cache substituído de Redis genérico para **Redis (Upstash)**, serviço serverless compatível
  com o ambiente Vercel.
- Autenticação atualizada de `NextAuth.js / OAuth 2.0` para **Supabase Auth + NextAuth.js**,
  com suporte nativo a OAuth 2.0, JWT, Row Level Security (RLS) e SSO institucional.
- Real-time atualizado para mencionar **Supabase Realtime** como primeira opção ao lado de
  Socket.io.
- Diagramas TikZ de arquitetura e stack tecnológica atualizados para refletir a nova stack
  (`Supabase (PostgreSQL)`, `Redis/Upstash`).
- `README.md` atualizado com a stack revisada e nota técnica justificando a decisão de adotar
  Supabase no contexto de deploy na Vercel (serverless).

---

## [0.2.0] - 2026-02-28

### Added

- Arquivo `.github/copilot-instructions.md` com 14 seções de diretrizes para o agente de IA:
  paradigma de programação assistida por IA, construção de prompts, planos de ação, commits,
  README, CHANGELOG e regras gerais.
- Pasta `docs/` reservada para planos de ação gerados pelo Copilot.

### Changed

- `README.md` expandido com estrutura completa: metadados acadêmicos, requisitos funcionais,
  arquitetura, stack tecnológica, instruções de compilação e configuração do ambiente.

---

## [0.1.0] - 2026-02-28

### Added

- Documento principal `site_acolhimento_faesa.tex` com levantamento de requisitos funcionais
  (RF01–RF15) e não funcionais (RNF01–RNF10), diagramas UML em TikZ (casos de uso, classes,
  arquitetura em 4 camadas, fluxo de navegação, ER) e stack tecnológica proposta.
- Arquivo `.vscode/settings.json` configurado com receita `lualatexmk`, auto-build ao salvar
  e visualização de PDF na aba do editor.
- Arquivo `.vscode/extensions.json` com 8 extensões recomendadas para o projeto LaTeX.

[Unreleased]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/releases/tag/v0.1.0
