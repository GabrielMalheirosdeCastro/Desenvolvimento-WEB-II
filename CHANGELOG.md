# Changelog

Todas as alterações relevantes deste projeto serão documentadas aqui.

O formato segue o padrão [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

## [1.15.0] - 2026-06-15

### Added

- **Suíte de testes automatizada com Vitest (item E1 / Bloco E)**: introduzido `vitest` + `@vitest/coverage-v8` com [vitest.config.ts](vitest.config.ts) (ambiente `node`, limiar de cobertura **80%** em lines/functions/branches/statements). Testes unitários da lógica pura da API em [tests/unit/auth.test.mjs](tests/unit/auth.test.mjs) (hash/verify bcrypt, JWT sign/verify, `getJwtSecret` dev/prod, `cookieOptions`, `requireAuth`, `requireRole`/RBAC) e [tests/unit/chatbot.test.mjs](tests/unit/chatbot.test.mjs) (faixas etárias, derivação por data de nascimento, rede de segurança de crise → CVV/NAP, intenções e adaptação por faixa — RF16).
- **Testes de integração com supertest (item E2)**: [tests/integration/api.test.mjs](tests/integration/api.test.mjs) sobe o `apiRouter` em modo fallback (sem banco) e valida contratos `source: 'fallback'`, as guardas `requireAuth` (**401** sem cookie, incluindo as rotas LGPD `/api/usuario/dados` e `/api/usuario/conta`) e o fluxo `requireRole('COORDENADOR')` em `/api/coordenacao/overview` (**401** sem sessão → **403** com papel ALUNO → **503** sem banco com papel COORDENADOR). O harness **nunca** aponta para o Postgres de produção.
- **Cobertura ≥ 80% na lógica de API (item D3 / RNF08)**: a suíte cobre **97,46%** de statements (auth.js 100% / chatbot.js 94,44%), 100% das funções e 100% das linhas dos módulos `auth.js` e `chatbot.js`. Relatório `text`/`html`/`json-summary` gerado em `coverage/`.

### Changed

- `npm test` passa a executar **`vitest run --coverage`** (antes eram os scripts `scripts/test-*.mjs`). Adicionado `npm run test:watch`. O job `test` do CI ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) — que já é gate de deploy — agora roda a suíte Vitest com cobertura.
- Bump 1.14.0 -> **1.15.0** (MINOR — formalização da suíte de testes e cobertura) nos três `package.json`.

### Notas

- A cobertura é medida sobre a **lógica testável sem banco** (`auth.js` + `chatbot.js`). A cobertura completa dos handlers de `routes.js` que dependem do Postgres exige um banco de teste efêmero/transacional e fica como continuação (não pode apontar para produção). Os scripts antigos `scripts/test-auth-core.mjs` e `scripts/test-chatbot-core.mjs` permanecem no repositório como referência, mas não são mais acionados por `npm test`.
- Os testes E2E do Playwright (`tests/e2e/`) seguem fora deste gate (exigem GUI; a VPS é headless) e rodam só na estação via `npm run test:e2e` (Seção 2.5).

## [1.14.0] - 2026-06-15

### Added

- **Code-splitting da SPA (item D5 / RNF02)**: as páginas internas do dashboard ([apps/web/src/app/routes.tsx](apps/web/src/app/routes.tsx)) passaram a ser carregadas sob demanda via `React.lazy`, com um `<Suspense>` acessível (`role="status"` + `aria-live`) em volta do `<Outlet/>` no [DashboardLayout](apps/web/src/app/layouts/DashboardLayout.tsx). Adicionado `manualChunks` no [vite.config.ts](apps/web/vite.config.ts) separando as libs pesadas (`recharts`/`d3` em `charts`, `@radix-ui` em `radix`). **O bundle inicial caiu de 741,62 kB → 132,34 kB** (gzip 210,79 → 41,24 kB), ~82% menor; os gráficos (525 kB) só carregam nas telas que os usam.
- **Portabilidade de dados — LGPD (item D7 / RNF09)**: novo endpoint `GET /api/usuario/dados` ([apps/api/routes.js](apps/api/routes.js)) que exporta os dados pessoais do titular logado em JSON (perfil sem `password_hash`, consentimentos, plano de estudos, bem-estar, fóruns criados, notificações, gamificação e eventos inscritos), escopado a `req.usuario.sub` (anti-IDOR) e registrado em `auditoria_dados`. A SPA ganhou um botão **"Exportar meus dados (JSON)"** na nova seção **Privacidade** do [Perfil](apps/web/src/app/pages/ProfilePage.tsx), que baixa o arquivo localmente.
- **Exclusão de conta — LGPD (item D7 / RNF09)**: novo endpoint `DELETE /api/usuario/conta` que **anonimiza** o registro do titular (nome, e-mail e matrícula substituídos por valores únicos, `password_hash` → `NULL`), preservando a integridade referencial e as métricas agregadas anônimas. Exige confirmação explícita (`{ confirmar: true }`), revoga o consentimento (`consentimentos_lgpd`), registra auditoria e encerra a sessão. A UI tem um fluxo de confirmação dupla na seção Privacidade do Perfil, redirecionando ao `/login` após a exclusão.
- **Baseline de acessibilidade (item D2 / RNF04 — parcial)**: `lang="pt-BR"` e `<meta description>` corrigidos no [index.html](apps/web/index.html); **skip-link** ("Pular para o conteúdo") e landmark `<main id="conteudo-principal">` no dashboard; `aria-label` nas navegações principal (desktop/mobile); componentes novos com `role="status"`, `aria-live`, `aria-hidden`, `sr-only` e anéis de foco visíveis (`focus-visible:ring`).

### Changed

- Bump 1.13.0 -> **1.14.0** (MINOR — performance, LGPD e baseline de acessibilidade) nos três `package.json`.

### Notas

- **D2 (acessibilidade) permanece parcial**: a auditoria completa de contraste WCAG 2.1 AA e a conclusão do dark mode por *design tokens* exigem a execução do axe-core/Lighthouse via Playwright MCP **na estação** (a VPS é headless) e ficam como continuação.

## [1.13.0] - 2026-06-14

### Added

- **Endurecimento de segurança da API (item D1 / RNF03)**: adicionados [`helmet`](apps/api/server.js) (cabeçalhos de segurança + Content-Security-Policy compatível com a SPA — assets *same-origin* e `<style>` inline do `index.html`) e [`express-rate-limit`](apps/api/server.js) com dois limitadores: estrito em `/api/auth/*` (20 req/min por IP, mitiga *brute force* no login/ativação) e geral em `/api/*` (200 req/min), ambos retornando `429 rate_limit` em JSON. `/healthz` e `/version` ficam livres para monitoria. Configurado `trust proxy` para o IP real chegar via `X-Forwarded-For` atrás do Traefik.
- **Suíte de testes padronizada (item E1)**: novo script `npm test` na raiz que agrega os testes core headless ([scripts/test-auth-core.mjs](scripts/test-auth-core.mjs) + [scripts/test-chatbot-core.mjs](scripts/test-chatbot-core.mjs)), com saída não-zero em falha.
- **Testes E2E com Playwright (itens E3/E4)**: nova configuração [playwright.config.ts](playwright.config.ts) e specs em [tests/e2e](tests/e2e) — `login.spec.ts` valida os 4 metadados obrigatórios (Disciplina, Docente, Aluno, Repositório) e o badge de versão `site-acolhimento-faesa · vX.Y.Z`; `smoke-v1.12.0.spec.ts` cobre, após login autenticado, a página de Eventos, a seção de Ranking do Perfil e o sino de notificações. `baseURL` configurável via `PLAYWRIGHT_BASE_URL`; o smoke é pulado se `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` não estiverem no ambiente (sem segredos no repositório). **Executados apenas na estação Windows** — a VPS é headless.
- **Gate de testes no CI (item E5)**: o workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) ganhou um job `test` (checkout + `npm ci` + `npm test`) do qual o job de deploy passa a depender (`needs: test`), bloqueando a publicação se os testes core falharem. Os specs Playwright **não** entram no CI (exigem GUI).

### Changed

- Bump 1.12.0 -> **1.13.0** (MINOR — versão de qualidade/infra: endurecimento de segurança e suíte de testes, sem alteração de comportamento funcional) nos três `package.json`.

## [1.12.0] - 2026-06-14

### Added

- **Notificações reais (item B5 / RF10)**: o sino de notificações do cabeçalho ([apps/web/src/app/components/NotificationBell.tsx](apps/web/src/app/components/NotificationBell.tsx)) passa a consumir dados reais via novos endpoints `GET /api/notificacoes` (lista as 50 mais recentes do usuário + contador de não lidas), `POST /api/notificacoes/:id/marcar-lida` e `POST /api/notificacoes/marcar-todas-lidas`. Todos protegidos por `requireAuth`, escopados ao dono (anti-IDOR via `req.usuario.sub`), com contrato `source: db|fallback` e `503 db_indisponivel` nas escritas quando o banco está offline. A UI usa atualização otimista e degrada para lista vazia sem quebrar.
- **Página dedicada de Eventos (item B6 / RF12)**: nova tela `/dashboard/eventos` ([apps/web/src/app/pages/EventsPage.tsx](apps/web/src/app/pages/EventsPage.tsx)) com item próprio no menu lateral, **separada da Biblioteca**. Lista os eventos institucionais (`GET /api/eventos`, público) e permite **inscrição** do aluno via novo `POST /api/eventos/:id/inscrever` (`requireAuth`, idempotente por `ON CONFLICT DO NOTHING`, `404 evento_nao_encontrado`), além de `GET /api/eventos/minhas` para marcar os eventos já inscritos. A aba de Eventos que existia dentro da Biblioteca foi removida.
- **Gamificação real e ranking entre alunos (item B7 / RF13)**: o Perfil ([apps/web/src/app/pages/ProfilePage.tsx](apps/web/src/app/pages/ProfilePage.tsx)) passa a exibir pontos, conquistas (com flag `earned`), histórico e *streak* reais via `GET /api/gamificacao/perfil`, além de uma nova seção **"Ranking entre Alunos"** (`GET /api/gamificacao/ranking`) com `RANK()` sobre os pontos, nomes reduzidos por privacidade e destaque para a posição do próprio usuário. Ambos os endpoints (`requireAuth`) seguem o contrato `source: db|fallback`; a UI degrada graciosamente para valores de exemplo quando o banco está indisponível.

### Changed

- **Seed de produção** (`packages/db/prisma/seed-prod.sql`): novas seções idempotentes — notificações da persona Gabriel (7.3), alunos de demonstração (7.1) e gamificação dos demais alunos (7.2) para popular o ranking com múltiplas entradas. O relatório final foi ampliado com as contagens de `notificacoes` e `gamificacao (ranking total)`.
- Bump 1.11.0 -> **1.12.0** (MINOR — três novas funcionalidades compatíveis: notificações, eventos e gamificação reais) nos três `package.json`.

## [1.11.0] - 2026-06-14

### Added

- **Chatbot de Acolhimento (item B2 / RF16)**: novo assistente de apoio estudantil acessível em `/dashboard/chatbot`, com respostas **adaptadas por faixa etária** (17–20, 21–25, 26+). O motor de respostas é **curado e local** ([apps/api/chatbot.js](apps/api/chatbot.js)) — **sem LLM externa** —, em conformidade com a política “tudo na VPS” e com a LGPD (nenhuma mensagem do aluno sai da infraestrutura própria). Detecta intenções comuns (ansiedade, sono, organização, motivação, provas, adaptação, finanças, saudação, apoio humano) e inclui uma **rede de segurança determinística para mensagens de crise**, que encaminha ao NAP e ao CVV (188). Novos endpoints `POST /api/chatbot/mensagem` e `GET /api/chatbot/historico` (ambos `requireAuth`), com persistência *best-effort* em `chatbot_conversas`/`chatbot_mensagens` escopada ao dono (anti-IDOR) e resiliente a banco indisponível (a resposta é sempre computada no Node). A faixa etária é derivada da `data_nascimento` do usuário ou selecionável na tela. Sem migração de schema — as tabelas já existiam na migração inicial do Postgres.

### Changed

- **Testes** (`scripts/test-chatbot-core.mjs`): nova suíte unitária do motor do chatbot — validação de faixas, derivação por data de nascimento, prioridade absoluta da rede de segurança de crise, detecção de intenções (tolerante a acentos) e a adaptação efetiva do conteúdo por faixa etária. Determinística, sem banco.
- Bump 1.10.0 -> **1.11.0** (MINOR — nova funcionalidade compatível) nos três `package.json`.

## [1.10.0] - 2026-06-14

### Added

- **RBAC efetivo de ponta a ponta (item A4)**: o controle de acesso por papel passa a ser imposto no backend. O middleware `requireRole` (já existente em [apps/api/auth.js](apps/api/auth.js)) foi conectado à primeira rota protegida por papel e a convenção de papéis foi documentada no topo do módulo (`tipo_usuario` canônico `ALUNO`/`COORDENADOR`; "mentor" é a flag `e_mentor = true` sobre um `ALUNO`). No frontend, o `AuthContext` ganhou o helper `temPapel(...)`, foi criado o componente de rota `RoleRoute` (análogo ao `ProtectedRoute`, mas por papel) e o menu do `DashboardLayout` passou a exibir itens condicionalmente ao papel. **Segurança (OWASP A01):** a autorização é sempre validada na API; o condicional no frontend é apenas UX.
- **Painel de Coordenação (RF14)**: novo endpoint `GET /api/coordenacao/overview` protegido por `requireAuth + requireRole('COORDENADOR')`, retornando agregações institucionais reais (total de alunos, mentores, planos de estudo, atividades, avaliações de bem-estar, tópicos de fórum e recursos) com contrato `source: db|fallback` e `503` quando o banco está indisponível. Nova rota `/dashboard/coordenacao` (sob `RoleRoute('COORDENADOR')`) com a tela `CoordenacaoPage`, que trata os estados de carregamento, erro e acesso negado (403). O usuário institucional **NAP** (`COORDENADOR`, criado na v1.9.1) acessa o painel após ativar a conta pelo fluxo padrão (`POST /api/auth/ativar`).

### Changed

- **Testes de autorização** (`scripts/test-auth-core.mjs`): a suíte do núcleo de auth foi estendida com casos do `requireRole` — papel autorizado segue (`next`), papel insuficiente recebe `403 acesso_negado`, comparação case-insensitive, múltiplos papéis e sessão sem usuário negada. Execução determinística, sem banco.
- Bump 1.9.1 -> **1.10.0** (MINOR — nova funcionalidade compatível) nos três `package.json`.

## [1.9.1] - 2026-06-14

### Added

- **Seed de producao para Forum e Biblioteca (item C4 / RF06-08)** (`packages/db/prisma/seed-prod.sql`): novas secoes idempotentes (7.6-7.10) que populam o banco de producao com **6 recursos** institucionais (Estudos, Bem-estar, Tecnologia, Produtividade), **3 trilhas de aprendizagem** (`Fundamentos de ADS`, `Bem-estar e Saude Mental`, `Produtividade nos Estudos`), **7 vinculos** `trilha_recursos` com ordem, um usuario institucional **NAP** (`matricula NAP-FAESA`, `tipo_usuario = COORDENADOR`, sem `password_hash` — nao faz login) como autor e **3 topicos iniciais** de forum. A idempotencia usa `WHERE NOT EXISTS` (por `titulo`/`nome`) e `ON CONFLICT DO NOTHING`, sem `DELETE` de dados de usuario, de modo que a reexecucao e segura e nao apaga conteudo criado em producao. O relatorio final do seed foi ampliado com a contagem das novas tabelas.

### Fixed

- **Endpoints `GET /api/forum`, `/api/recursos` e `/api/trilhas` saem do `"source": "fallback"`**: a bateria de testes pos-v1.9.0 revelou que esses tres endpoints respondiam com dados estaticos em producao porque as tabelas existiam mas estavam vazias (o `seed-prod.sql` populava apenas `eventos`). Com o seed estendido, passam a responder `"source": "db"` e o fluxo `POST /api/recursos/:id/acesso` da Biblioteca (H7) passa a persistir o acesso a um recurso real em vez de retornar `404`.
- Bump 1.9.0 -> **1.9.1** (PATCH — correcao de dados de producao, sem alteracao de codigo da SPA). `apps/web` e `apps/api` alinhados em 1.9.1.

## [1.9.0] - 2026-06-14

### Added

- **Dashboard interativo (item H2 / RF05, RF13)** (`apps/web/src/app/pages/DashboardHome.tsx`): os elementos do painel inicial que antes eram inertes passam a navegar para as telas existentes. Os tres cards de progresso viraram `button` acessiveis ("Metas da Semana" e "Horas de Estudo" -> `/dashboard/plano-estudos`; "Sequencia de Dias" -> `/dashboard/bem-estar`); cada item de "Proximas Atividades" navega conforme o `type` (Estudo/Entrega -> plano de estudos, Mentoria -> mentoria, Questionario -> bem-estar) via helper `destinoPorTipo`; e o botao "Ver Todas as Conquistas" passa a levar ao Perfil. _Nota:_ os numeros estaticos dos cards (85%, 25h) permanecem fora de escopo deste MINOR (H2 trata de clicabilidade/navegacao, nao de agregacao de metricas reais); nao foi criada rota dedicada de conquistas.

### Changed

- **Header navega para o Perfil (item H1 / RF05)** (`apps/web/src/app/layouts/DashboardLayout.tsx`): o bloco nome + avatar do cabecalho passa a ser um `Link` para `/dashboard/perfil` (com `aria-label`, realce de foco por teclado e `hover`), sem englobar a area de clique do sino de notificacoes.
- Bump 1.8.0 -> **1.9.0** (MINOR — dashboard e header interativos, fechamento dos itens H1/H2 do Bloco H). `apps/web` e `apps/api` alinhados em 1.9.0.

## [1.8.0] - 2026-06-14

### Added

- **Forum de Discussao funcional (item H6 / RF08)** (`apps/api/routes.js`, `apps/web/src/app/pages/ForumPage.tsx`): a tela de Forum deixa de exibir topicos mockados e passa a listar topicos reais via rota **aditiva** publica `GET /api/forum` (`LEFT JOIN` em `usuarios` para o autor e contagem de respostas a partir de `forum_posts`), com fallback estatico resiliente quando o banco esta indisponivel. A criacao de topicos usa `POST /api/forum` (`requireAuth`, `criado_por = req.usuario.sub`) com validacao de titulo (3-160 chars), descricao e categoria; o frontend abre um formulario inline, envia com `credentials: "include"`, trata `401` de sessao expirada e recarrega a lista apos publicar. Estados de carregamento/vazio/erro adicionados; paginacao e filtros falsos (botoes inertes) removidos.
- **Biblioteca de Recursos funcional (itens H7 / RF06-07)** (`apps/api/routes.js`, `apps/web/src/app/pages/LibraryPage.tsx`): recursos e trilhas deixam de ser mockados e passam a carregar de `GET /api/recursos` e `GET /api/trilhas` (publicos, com fallback). O botao "Acessar Recurso" agora chama `POST /api/recursos/:id/acesso` (`requireAuth`, **UPSERT** em `usuario_recursos` via `ON CONFLICT (usuario_id, recurso_id)` e incremento de `visualizacoes`), abrindo a `url` do recurso em nova aba quando disponivel. A busca filtra recursos client-side por titulo/categoria/tipo. Botoes sem backend (`Filtros`, `Iniciar Trilha`, `Sugerir Recurso`) foram desabilitados com rotulo "em breve" para evitar acoes inertes.
- Bump 1.7.1 -> **1.8.0** (MINOR — novas funcionalidades de Forum e Biblioteca). `apps/web` e `apps/api` alinhados em 1.8.0.

### Fixed

- **UX da tela de Mentoria** (`apps/web/src/app/pages/MentorshipPage.tsx`): o banner "Candidatar-se como Mentor" agora navega para a aba de cadastro de mentor (`setModo("mentor")`) em vez de ser inerte; os botoes "Entrar" (sessao ao vivo) e "Solicitar Mentoria", que nao possuem backend nesta fase, foram desabilitados com rotulo "em breve" para nao induzir o usuario a acoes sem efeito.

## [1.7.1] - 2026-06-14

### Fixed

- **Tela de Mentoria quebrada em producao (regressao da v1.7.0)** (`apps/web/src/app/pages/MentorshipPage.tsx`): a rota `/dashboard/mentoria` lancava `Unexpected Application Error! ImageWithFallback is not defined` (`ReferenceError` em runtime), derrubando a tela inteira via ErrorBoundary do React Router. A refatoracao do item H5 (v1.7.0) passou a **usar** o componente `<ImageWithFallback>` no card "Candidatar-se como Mentor" mas **removeu o import** correspondente. Restaurado o `import { ImageWithFallback } from "../components/figma/ImageWithFallback"`. O erro nao foi detectado por TS/lint por ser uma referencia resolvida apenas em runtime; varredura confirmou que as demais telas (`ConcentrationPage`, `LibraryPage`) ja importavam o componente corretamente.
- Bump 1.7.0 -> **1.7.1** (PATCH — correcao de bug de runtime). `apps/web` e `apps/api` alinhados em 1.7.1.

## [1.7.0] - 2026-06-14

### Added

- **Perfil real e editavel (itens H8/H9)** (`apps/api/routes.js`, `apps/web/src/app/pages/ProfilePage.tsx`): a pagina de Perfil deixa de exibir dados mockados e passa a carregar a identidade real do usuario autenticado via rota **aditiva** `GET /api/usuario/perfil` (`requireAuth`, escopada a `req.usuario.sub`), com `LEFT JOIN` em `matriculas_academicas -> turmas -> cursos` para trazer curso, periodo e CRA quando disponiveis. A edicao de `nome` e `email` e persistida via `PATCH /api/usuario/perfil`: validacao de entrada, **pre-checagem de e-mail duplicado** (`409 email_em_uso`) — necessaria porque `query()` engole erros e retorna `null` em vez de lancar — e, como o e-mail e a chave de login presente no JWT, o token e **reassinado** e o cookie `httpOnly` (`sa_token`) e atualizado no mesmo response para nao deslogar o usuario.
- **Tema persistido (item H9)** (`apps/web/src/app/theme/ThemeContext.tsx`, `RootLayout.tsx`, `ProfilePage.tsx`): novo `ThemeProvider` que persiste a preferencia de tema (`claro`/`escuro`/`auto`) em `localStorage` (`sa_tema`), aplica a classe `.dark` no `documentElement` e respeita `prefers-color-scheme` no modo automatico (com listener `matchMedia`). O seletor de tema do Perfil passa a alterar o tema de fato. _Observacao:_ a aplicacao visual e parcial — apenas superficies baseadas em tokens reagem, pois varias telas usam cores fixas (hex) em vez de `var(--*)`; o refactor visual completo fica fora do escopo desta versao.
- **Exercicio de respiracao guiada 4-7-8 (item H4)** (`apps/web/src/app/pages/ConcentrationPage.tsx`): o card de respiracao deixa de ser estatico e passa a executar um ciclo guiado client-side (Inspire 4s / Segure 7s / Expire 8s) com circulo animado, contagem regressiva por fase e contador de ciclos. O timer Pomodoro existente foi mantido.

### Changed

- **Mentoria funcional (item H5)** (`apps/api/routes.js`, `apps/web/src/app/pages/MentorshipPage.tsx`): a rota `POST /api/mentorias/cadastro-mentor` agora exige `requireAuth` e usa `WHERE id = $1` com `req.usuario.sub` (antes usava uma matricula fixa de placeholder — **correcao do bug de credenciais**), retornando `503` quando o banco esta indisponivel. A tela passa a hidratar o estado "sou mentor" a partir de `usuario.eMentor`, lista mentores reais via `GET /api/mentorias?papel=mentor` (com `credentials: "include"`), filtra por busca e remove o `fallback` otimista; o cadastro chama `recarregar()` para refletir o novo papel.
- Bump 1.6.0 -> **1.7.0** (MINOR — varredura de mocks: Perfil real/editavel, tema persistido, mentoria funcional e exercicio de respiracao). `apps/web` e `apps/api` alinhados em 1.7.0.

## [1.6.0] - 2026-06-14

### Added

- **Avaliacao de Bem-estar (item B1 / RF11)** (`apps/api/routes.js`, `apps/web/src/app/pages/WellbeingPage.tsx`): nova funcionalidade de autoavaliacao periodica de bem-estar, persistida no banco via duas rotas **aditivas** e autenticadas (`requireAuth`), escopadas ao usuario da sessao (`usuario_id = req.usuario.sub`, prevenindo IDOR): `GET /api/bem-estar` (historico) e `POST /api/bem-estar` (registra avaliacao). Os dados sao gravados na tabela `questionarios_bem_estar` (ja existente — sem migracao): as escalas `humor`, `estresse` e `sono` (1 a 5) sao serializadas em JSON na coluna `respostas`, e o `resultado` (`positivo`/`atencao`/`critico`) e calculado no servidor como fonte unica de verdade (estresse e invertido no escore). Queries 100% parametrizadas, validacao de entrada (escalas inteiras 1-5, observacoes ate 500 chars) e respostas resilientes quando o banco esta indisponivel (`503`).
- **Tela de Bem-estar na SPA** (`WellbeingPage.tsx`, rota `/dashboard/bem-estar` em `routes.tsx`, item de menu em `DashboardLayout.tsx`): formulario com tres escalas (humor, estresse, sono) e observacoes opcionais, cartoes de resumo (total de avaliacoes + classificacao da ultima) e historico cronologico. Estados de carregamento, vazio e erro tratados; `fetch` com `credentials: "include"` para enviar o cookie `httpOnly`.
- **Seed de bem-estar da persona** (`packages/db/prisma/seed-prod.ts` e `seed-prod.sql`): a persona Gabriel (`23110145`) passa a ter 3 avaliacoes de bem-estar de exemplo (idempotente por `DELETE`+`INSERT`), para que a tela nasca com historico real em producao.

### Changed

- Bump 1.5.0 -> **1.6.0** (MINOR — nova funcionalidade: Avaliacao de Bem-estar / RF11). `apps/web` e `apps/api` alinhados em 1.6.0.

## [1.5.0] - 2026-06-13

### Added

- **Persistencia real do Plano de Estudos (item H3)** (`apps/api/routes.js`, `apps/web/src/app/pages/StudyPlanPage.tsx`): a pagina de Plano de Estudos deixa de usar dados mockados em estado local e passa a persistir metas no banco via quatro rotas **aditivas** e autenticadas (`requireAuth`), escopadas ao usuario da sessao (`usuario_id = req.usuario.sub`, prevenindo IDOR): `GET /api/metas` (lista), `POST /api/metas` (cria), `PATCH /api/metas/:id` (alterna conclusao) e `DELETE /api/metas/:id` (exclui). As metas sao persistidas na tabela `atividades_estudo` (mapeamento `title->nome`, `subject->descricao`, `deadline->data_agendada`, `completed->status`+`data_realizacao`); um plano de estudos padrao e criado de forma idempotente no primeiro uso. Queries 100% parametrizadas, validacao de entrada (titulo obrigatorio, limites de tamanho, `id` inteiro, data valida) e respostas resilientes quando o banco esta indisponivel (`503`).
- **Formulario de nova meta e acoes reais na UI** (`StudyPlanPage.tsx`): botao "Nova Meta" abre formulario (titulo, materia, prazo); checkbox alterna conclusao via `PATCH`; lixeira exclui via `DELETE`; estatisticas (total/concluidas/pendentes) calculadas a partir dos dados reais; estados de carregamento, vazio e erro tratados. Removido o placeholder inerte de calendario drag-and-drop (fora do escopo desta entrega).

### Changed

- Bump 1.4.1 -> **1.5.0** (MINOR — nova funcionalidade: CRUD persistente de metas do Plano de Estudos). `apps/web` e `apps/api` alinhados em 1.5.0.

## [1.4.1] - 2026-06-13

### Fixed

- **Saudacao e iniciais corretas para nomes com titulo** (`apps/web/src/app/auth/nome.ts`, `DashboardHome.tsx`, `DashboardLayout.tsx`): a extracao do primeiro nome e das iniciais passa a ignorar prefixos de tratamento academico (`Prof.`, `Profa.`, `Dr.`, `Dra.`, etc.). Antes, um usuario cadastrado como `Prof. Ricardo Almeida` era saudado como "Prof." e exibia o avatar "PA"; agora a saudacao e "Ricardo" e o avatar "RA". Logica centralizada nos helpers `primeiroNome` e `iniciaisNome`. O nome ja era dinamico por usuario; esta correcao trata apenas o caso de nomes com titulo.

## [1.4.0] - 2026-06-13

### Added

- **Backend de autenticacao local** (`apps/api/auth.js`, `apps/api/routes.js`, `apps/api/server.js`): implementacao do Bloco A conforme `docs/plano-2026-06-13-bloco-a-autenticacao-local.md`. Novo modulo `auth.js` com hash de senha via `bcryptjs` (cost 12), sessao por `JWT` HS256 (`jsonwebtoken`) e cookie `httpOnly` + `SameSite=Strict` + `Secure` (`cookie-parser`), alem dos middlewares `requireAuth` e `requireRole` (RBAC pela coluna `usuarios.tipo_usuario`). Quatro rotas **aditivas**: `POST /api/auth/ativar` (define senha de usuario pre-cadastrado com `password_hash` nulo), `POST /api/auth/login` (valida credenciais e emite o cookie de sessao), `POST /api/auth/logout` (limpa o cookie) e `GET /api/auth/me` (retorna o usuario da sessao). As rotas antigas baseadas em `MATRICULA_PADRAO` permanecem intactas.
- **Dependencias de autenticacao** em `apps/api`: `bcryptjs`, `jsonwebtoken` e `cookie-parser`.
- **Scripts de validacao** (`scripts/test-auth-core.mjs` e `scripts/smoke-auth.ps1`): teste unitario do nucleo de auth (hash/verify/JWT/guard de segredo) e smoke test HTTP das rotas. Fluxo `ativar -> login -> /auth/me -> logout` validado end-to-end contra o banco de producao (via tunel SSH), de forma nao-destrutiva.
- **Frontend de autenticacao** (Fase 4): contexto de sessao `AuthContext` + hook `useAuth` (hidrata a sessao via `GET /api/auth/me` com cookie `httpOnly`), guarda de rota `ProtectedRoute` (protege `/dashboard` e redireciona usuario nao autenticado para `/login`), `LoginPage` com formulario real de e-mail + senha e `AtivarPage` para primeiro acesso. Roteamento ajustado em `routes.tsx` (`/` -> `/login`, nova rota `/ativar`, `/dashboard` protegida); `RootLayout` provê o `AuthProvider` e o `DashboardLayout` passa a fazer logout real.
- **Nome do usuario visivel na area logada**: o `nome` cadastrado passa a ser propagado no `JWT` -> `GET /api/auth/me` -> SPA, exibido no cabecalho (`nome` + iniciais reais) e na saudacao do dashboard, com fallback para e-mail (tokens antigos sem `nome` continuam funcionando).

### Changed

- Bump 1.3.2 -> **1.4.0** (MINOR — nova funcionalidade de backend: autenticacao local). `apps/web` e `apps/api` alinhados em 1.4.0.
- **Estrategia de autenticacao alterada de SSO/OAuth para login local** (`site_acolhimento_faesa.tex` no Overleaf + `docs/atividades/pendencias-versao-final-producao.md`): sem autorizacao institucional para usar o provedor de identidade da FAESA, a integracao SSO / OAuth 2.0 foi **descartada**. O sistema passa a usar autenticacao local propria — cadastro e login com **e-mail + senha**, hash `bcrypt` e sessao `JWT`. Ajustes no documento: RF01 (login local em vez de SSO), RNF03 (autenticacao local em vez de OAuth 2.0 / SSO), tabela de stack (`bcrypt + JWT` em vez de `NextAuth.js / OAuth 2.0`) e diagrama de arquitetura (remocao do componente `FAESA SSO`). No relatorio de pendencias, o Bloco A foi reformulado e o item A2 (SSO) marcado como descartado.

## [1.3.2] - 2026-06-13

### Fixed

- **Seed de producao popula a tabela `gamificacao`** (`packages/db/prisma/seed-prod.ts` e `seed-prod.sql`): a persona Gabriel (`23110145`) passa a ter linha de gamificacao (`streak_atual=12`, `streak_recorde=18`, `pontos_totais=225`, `ranking_posicao=1`). Sem esse registro, o endpoint `GET /api/dashboard/streak` continuava respondendo `source: "fallback"` mesmo com o banco populado, pois consulta a tabela `gamificacao`.
- **Seed de producao alinhado ao schema atual de `PlanoEstudo`** (`packages/db/prisma/seed-prod.ts`): os campos obsoletos `nome`/`objetivo`/`ativo` foram substituidos por `titulo`/`descricao`/`metaHorasSemanal`/`status`, que sao os definidos no `schema.prisma`. Sem esse ajuste o seed abortava com `PrismaClientValidationError` (`Unknown argument 'nome'`).
- **Build do EasyPanel falhava com `Killed` (OOM)** antes do `npm install`: a VPS rodava sem swap e o build do `vite` (`apps/web`) estourava a RAM (Supabase self-hosted ja consome ~3.1 GiB de 7.8 GiB), acionando o `oom-killer`. Mitigado com a criacao de **4 GiB de swap** (`/swapfile`, persistente em `/etc/fstab`). Apos isso o deploy da v1.3.2 concluiu normalmente.

### Changed

- Bump 1.3.1 -> **1.3.2** (PATCH — correcao no seed de producao para cobertura completa de `source: "db"` nos endpoints de dashboard). `apps/web` e `apps/api` alinhados em 1.3.2.
- **Banco de producao populado e validado**: os endpoints `/api/me`, `/api/dashboard/streak`, `/api/dashboard/week`, `/api/dashboard/badges`, `/api/dashboard/upcoming` e `/api/eventos` passaram a responder `source: "db"` em <https://acolhimento.faesa.gmcsistemas.com.br>. Versao publicada confirmada via `GET /version` == `1.3.2`.

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
