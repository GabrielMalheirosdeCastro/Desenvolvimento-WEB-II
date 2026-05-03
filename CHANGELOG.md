# Changelog

Todas as alterações relevantes deste projeto serão documentadas aqui.

O formato segue o padrão [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

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
