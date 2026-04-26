# Plano de Ação — Análise da Fase de Projeto (Design): Como o Sistema Será Construído

**Data:** 2026-03-08  
**Solicitado por:** Gabriel Malheiros de Castro  
**Contexto:** Análise do documento `site_acolhimento_faesa.tex` para responder às perguntas da fase de Projeto (Design) do ciclo de desenvolvimento de software — identificando o que já está definido, o que precisa de aprofundamento e qual a recomendação técnica para cada eixo.

> **Aviso de supersessão (2026-04-26):** este plano é um snapshot da fase de design e
> menciona **Vercel + Supabase Cloud + Upstash** como stack candidata. A decisão final
> foi outra: **EasyPanel + Supabase self-hosted (PostgreSQL 17.6) na mesma VPS
> Hostinger**, com o **mesmo banco** servindo dev (via túnel SSH) e produção. Para o
> estado vigente, consulte `README.md`, [`ambiente-producao-easypanel.md`](ambiente-producao-easypanel.md),
> [`setup-desenvolvimento-windows.md`](setup-desenvolvimento-windows.md) e
> [`relatorio-tecnologias-banco-persistencia.md`](relatorio-tecnologias-banco-persistencia.md).

---

## Objetivo

Mapear, a partir do artefato monográfico existente, as decisões de projeto já tomadas e avaliar sua adequação em relação a cinco eixos: (1) Arquitetura do Sistema, (2) Modelagem do Banco de Dados, (3) Design das APIs, (4) Protótipos de Interface e (5) Escolha de Tecnologias. Para cada eixo, apresenta-se: o que o documento já define, lacunas identificadas e recomendação de ação.

---

## 1. Arquitetura do Sistema

### 1.1 O que o documento já define

O diagrama de componentes (Seção 4 — Diagrama de Componentes/Arquitetura, Figura `fig:arquitetura`) estabelece uma **arquitetura em 4 camadas**:

| Camada | Responsabilidade | Componentes documentados |
|--------|-----------------|-------------------------|
| **Apresentação (Frontend)** | Interface do usuário | React.js / Next.js, Tailwind CSS, PWA / Service Worker |
| **API (Backend)** | Lógica de entrada, autenticação, comunicação real-time | API REST / GraphQL, Auth (JWT / OAuth), WebSocket (Socket.io) |
| **Serviços (Domínio)** | Regras de negócio por módulo | Plano de Estudos, Concentração, Mentoria, Gamificação |
| **Dados (Persistência)** | Armazenamento e cache | PostgreSQL, Redis (Cache), S3 / Storage |

Integrações externas documentadas: E-mail Service, Push Notifications, FAESA SSO, LMS Integration.

O padrão arquitetural implícito é **cliente-servidor com separação em camadas (Layered Architecture)**, com elementos de **MVC** no frontend (React/Next.js lida com View + Controller via Server Components/Actions) e **serviços de domínio** no backend (padrão análogo a Service Layer/Clean Architecture, especialmente se NestJS for adotado com seus módulos).

**Não é microsserviços.** O diagrama apresenta uma arquitetura monolítica modular — os 4 módulos de domínio (Plano, Concentração, Mentoria, Gamificação) são componentes lógicos dentro de um mesmo deploy, não serviços independentes. Isso é adequado para o escopo e tamanho do projeto.

### 1.2 Lacunas identificadas

| # | Lacuna | Impacto |
|---|--------|---------|
| L1 | Não há definição explícita de se a API será REST pura ou GraphQL — o documento lista ambos como alternativa (`API REST / GraphQL`) | Afeta diretamente o design dos endpoints e o contrato de dados |
| L2 | A relação entre Next.js (frontend) e NestJS (backend) não indica se são monorepo ou repositórios separados | Afeta estrutura de projeto, CI/CD e deploy |
| L3 | Não há diagrama de sequência para os fluxos críticos (login SSO, criação de plano, solicitação de mentoria) | Dificulta entender a interação entre camadas em tempo de execução |
| L4 | A sub-camada de domínio lista apenas 4 módulos, mas o documento descreve 5 módulos (falta "Estudos Fora da FAESA") + módulos transversais (Notificações, Avaliação de Bem-estar, Relatórios, Fórum, Chat) | Arquitetura de serviços incompleta em relação aos requisitos |
| L5 | Não há definição de como o PWA / Service Worker será implementado (cache strategy, offline-first?) | Afeta RNF02 (performance) e experiência mobile |

### 1.3 Recomendação

**REST é a escolha recomendada para este projeto.** Justificativa:

- O sistema possui entidades bem definidas com operações CRUD previsíveis (planos, metas, sessões, mentorias, badges) — REST mapeia naturalmente para isso.
- GraphQL adicionaria complexidade desnecessária para um desenvolvedor solo. O overhead de schema, resolvers e N+1 queries não compensa quando os dados consumidos pelo frontend são previsíveis.
- Next.js 14+ com App Router e Server Actions pode até eliminar a necessidade de uma API REST separada para muitas operações — chamadas diretas ao banco via Prisma no servidor, com NestJS restrito a operações que exigem lógica complexa ou WebSocket.

**Padrão arquitetural recomendado:** Monolito modular com separação de responsabilidades em camadas. Next.js como BFF (Backend-for-Frontend) + NestJS para domínio e real-time. Monorepo com Turborepo ou similar.

---

## 2. Modelagem do Banco de Dados

### 2.1 O que o documento já define

**Diagrama de Classes** (Figura `fig:diagrama-classes`) — 8 entidades com atributos e métodos:

| Entidade | Atributos principais | Relacionamentos |
|----------|---------------------|-----------------|
| **Usuario** | id, nome, email, matricula, senha, tipo (TipoUsuario), dataCadastro, ativo | Cria PlanoEstudo (1:N), Realiza SessaoConcentracao (1:N), Participa Mentoria (N:N), Preenche AvaliacaoBemEstar (1:N), Conquista Badge (1:N) |
| **PlanoEstudo** | id, titulo, descricao, dataInicio, dataFim, metaSemanal, status | Contém Meta (1:N) |
| **Meta** | id, descricao, prazo, concluida, prioridade, categoria | Associada a Recurso (N:N) |
| **SessaoConcentracao** | id, tipo (TipoExercicio), duracao, dataRealizacao, pontuacao, concluida | — |
| **Mentoria** | id, mentor (Usuario), mentorado (Usuario), dataInicio, status, avaliacaoMentor, avaliacaoMentorado | — |
| **Recurso** | id, titulo, tipo (TipoRecurso), url, descricao, tags, avaliacao | — |
| **AvaliacaoBemEstar** | id, dataPreenchimento, nivelEstresse, satisfacaoAcademica, horasSono, respostas (Map) | — |
| **Badge** | id, nome, descricao, icone, pontosNecessarios, categoria (CategoriaBadge) | — |

**Diagrama ER** (Figura `fig:diagrama-er`) — Confirma as 8 entidades com cardinalidades: Usuario→PlanoEstudo (1:N), PlanoEstudo→Meta (1:N), Usuario→SessaoConcentracao (1:N), Usuario↔Mentoria (N:N), Usuario→Recurso (N:N, favorita), Usuario→AvaliacaoBemEstar (1:N), Usuario→Badge (1:N).

### 2.2 Lacunas identificadas

| # | Lacuna | Impacto |
|---|--------|---------|
| L6 | Falta tabela de junção explícita para a relação N:N entre Usuario e Mentoria (tabela `usuario_mentoria` ou modelar com campos `mentorId` e `mentoradoId` na própria entidade Mentoria) | Necessário para o Prisma schema |
| L7 | Falta entidade **Forum/Post/Comentario** — RF08 (Fórum de Discussão) não possui modelagem de dados | Módulo inteiro sem persistência definida |
| L8 | Falta entidade **Notificacao** — RF10 (Notificações e Lembretes) não possui tabela | Impossível persistir histórico de notificações |
| L9 | Falta entidade **Trilha** — RF07 (Trilhas de Aprendizagem) não possui modelo | Módulo sem persistência |
| L10 | Falta entidade **Chat/Mensagem** — RF15 (Chat com Suporte) não possui modelo | Independe de Socket.io precisar de persistência |
| L11 | O campo `respostas: Map<String, String>` em AvaliacaoBemEstar é genérico demais — não define as perguntas do questionário | Dificulta queries e relatórios |
| L12 | Falta tabela de **PontuacaoUsuario** ou relação com histórico de pontos para gamificação — Badge armazena `pontosNecessarios` mas não há registro do score acumulado do usuário | Gamificação sem persistência de score |
| L13 | Enums (TipoUsuario, StatusPlano, Prioridade, TipoExercicio, StatusMentoria, TipoRecurso, CategoriaBadge) estão listados como tipos mas nunca foram detalhados com seus valores | Necessário para o Prisma schema |
| L14 | Falta campo `cursoId` ou `periodoId` em Usuario e PlanoEstudo — RN02 exige que planos sejam vinculados ao curso e período | Regra de negócio sem suporte no modelo |

### 2.3 Recomendação

O modelo de dados está **parcialmente definido** — cobre as entidades principais mas ignora módulos inteiros (Fórum, Chat, Notificações, Trilhas). Antes de gerar o `schema.prisma`, é necessário:

1. Definir as entidades faltantes (Forum, Post, Comentario, Notificacao, Mensagem, Trilha, PontuacaoUsuario).
2. Detalhar todos os enums com seus valores possíveis.
3. Adicionar campos de contexto acadêmico (curso, período) em Usuario e PlanoEstudo.
4. Decidir se `respostas` em AvaliacaoBemEstar será JSONB (flexível) ou tabela normalizada (consultável).

---

## 3. Design das APIs

### 3.1 O que o documento já define

**O documento NÃO define APIs explicitamente.** Não há seção dedicada a rotas, endpoints, formatos de requisição/resposta, versionamento de API ou contratos de dados.

O que pode ser inferido a partir dos requisitos funcionais e diagrama de casos de uso:

| Domínio | Endpoints inferidos (se REST) | Base nos RFs |
|---------|-------------------------------|-------------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/sso/callback` | RF01 |
| **Planos** | `GET/POST /planos`, `GET/PUT/DELETE /planos/:id`, `GET/POST /planos/:id/metas` | RF02, RF03 |
| **Sessões** | `GET/POST /sessoes`, `PUT /sessoes/:id/finalizar` | RF04 |
| **Dashboard** | `GET /dashboard/stats`, `GET /dashboard/progresso-semanal` | RF05 |
| **Recursos** | `GET /recursos`, `POST /recursos/:id/favoritar`, `POST /recursos/:id/avaliar` | RF06 |
| **Trilhas** | `GET /trilhas`, `GET /trilhas/:cursoId` | RF07 |
| **Forum** | `GET/POST /forum/posts`, `POST /forum/posts/:id/comentarios` | RF08 |
| **Mentoria** | `POST /mentorias/solicitar`, `PUT /mentorias/:id/aceitar`, `POST /mentorias/:id/avaliar` | RF09 |
| **Notificações** | `GET /notificacoes`, `PUT /notificacoes/:id/lida` | RF10 |
| **Bem-estar** | `GET/POST /avaliacoes`, `GET /avaliacoes/historico` | RF11 |
| **Relatórios** | `GET /relatorios/engajamento`, `GET /relatorios/bem-estar` | RF14 |
| **Gamificação** | `GET /badges`, `GET /pontuacao/ranking` | RF13 |

### 3.2 Lacunas identificadas

| # | Lacuna | Impacto |
|---|--------|---------|
| L15 | Nenhum endpoint foi formalmente definido | Sem contrato de API documentado |
| L16 | Não há definição de formato de resposta (JSON envelope, paginação, tratamento de erros) | Inconsistências na implementação |
| L17 | Não há definição de versionamento de API (`/v1/`, header-based?) | Manutenibilidade futura |
| L18 | Não há definição de autenticação por endpoint (quais rotas precisam de token, quais são públicas, quais são admin-only) | Segurança |
| L19 | A comunicação via WebSocket (Socket.io) não tem eventos definidos (nomes, payloads) | Real-time sem especificação |

### 3.3 Recomendação

Esta é a **maior lacuna do documento na fase de Design**. Para um projeto que será implementado, é necessário no mínimo:

1. **Documento de API** — Pode ser um OpenAPI 3.0 (Swagger) ou uma tabela Markdown detalhando cada endpoint com: método HTTP, rota, autenticação necessária, corpo da requisição (JSON), corpo da resposta (JSON), códigos de status HTTP.
2. **Padrão de resposta** — Definir envelope (ex: `{ data: ..., error: ..., meta: { page, total } }`).
3. **Eventos WebSocket** — Listar eventos publisher/subscriber para o módulo de Chat e Notificações.

Se Next.js Server Actions forem usadas para operações CRUD simples, a API REST explícita pode ser reduzida aos endpoints que exigem acesso externo ou real-time.

---

## 4. Protótipos de Interface

### 4.1 O que o documento já define

**Wireframes em TikZ** (Seção 6 — Protótipos de Interface):
- **Tela de Login** (Figura `fig:wireframe-login`) — Header institucional, logo FAESA, campo de e-mail institucional (`@faesa.br`), campo de senha, botão "Entrar", link de primeiro acesso, rodapé com copyright.
- **Tela de Dashboard/Home** (Figura `fig:wireframe-dashboard`) — Header com ícones de notificação e perfil, Sidebar com menu de navegação (Dashboard, Plano de Estudos, Concentração, Biblioteca, Mentoria, Fórum, Badges, Bem-estar), cards de progresso (Metas Concluídas, Horas de Estudo, Sessões de Foco), gráfico de progresso semanal (barras por dia da semana), lista de próximas atividades, badges recentes.

**Diagrama de Fluxo de Navegação** (Figura `fig:fluxo-navegacao`):

```
Início → Login/Cadastro → Home/Dashboard
                              ├→ Plano de Estudos → Mentoria → Avaliação de Bem-estar
                              ├→ Exercícios de Concentração → Fórum → Gamificação/Badges
                              ├→ Biblioteca de Recursos → Meu Perfil → Atividades Extracurriculares
                              └← (volta ao Dashboard via gamificação)
```

### 4.2 Lacunas identificadas

| # | Lacuna | Impacto |
|---|--------|---------|
| L20 | Apenas 2 wireframes de 10+ telas identificadas no fluxo de navegação | 80% das telas sem representação visual |
| L21 | Wireframes são esquemáticos em TikZ — não servem como guia de implementação para CSS/componentes | Implementação visual sem referência |
| L22 | Não há protótipos navegáveis (Figma ou similar) mencionados como existentes — apenas como "Próximo Passo" na Conclusão | Validação com stakeholders não realizada |
| L23 | Não há Design System definido (componentes, tokens de cor aplicados a UI, tipografia, espaçamentos) — apenas as cores da paleta LaTeX e menção a shadcn/ui | Risco de inconsistência visual |
| L24 | Fluxo de navegação parece artificialmente linear (Plano→Mentoria→Bem-estar). Na prática, todas as seções são acessíveis via Sidebar. O diagrama não reflete a navegação real | Diagrama potencialmente enganoso |
| L25 | Não há wireframe de telas mobile — contradiz RNF01 (Mobile-First) | Interface mobile sem especificação |

### 4.3 Recomendação

Os wireframes TikZ são adequados como **representação acadêmica** no documento monográfico, mas insuficientes como artefato de design para implementação. Recomenda-se:

1. Criar protótipos no **Figma** como próximo passo, priorizando as telas de: Login, Dashboard, Plano de Estudos (CRUD), Sessão Pomodoro e Perfil.
2. Adotar o Design System do **shadcn/ui** (já mencionado na stack) como base de componentes — isso garante consistência sem esforço de design manual.
3. Definir breakpoints responsivos (mobile: < 768px, tablet: 768–1024px, desktop: > 1024px) e layout de sidebar (colapsável em mobile → hamburger menu).

---

## 5. Escolha de Tecnologias

### 5.1 O que o documento já define

A Seção 5 (Stack Tecnológica Recomendada) e o `copilot-instructions.md` definem:

| Camada | Tecnologia | Justificativa documentada |
|--------|-----------|--------------------------|
| Frontend | **Next.js 14+** (React) + TypeScript | SSR/SSG, segurança de tipos, ecossistema robusto |
| Estilização | **Tailwind CSS** + **shadcn/ui** | Design system consistente, utilitário, responsivo, dark mode |
| Backend | **Node.js** + **NestJS** | Mesmo ecossistema JS, alta performance V8 |
| Banco | **PostgreSQL 16+** (Supabase) | Relacional, robusto, JSON, open-source |
| Cache | **Redis** (Upstash serverless) | Sessões, notificações real-time |
| ORM | **Prisma** | Type-safe, migrations automáticas, integração TypeScript |
| Auth | **NextAuth.js** + OAuth 2.0 + Supabase Auth | SSO FAESA, JWT, refresh tokens, RLS |
| Real-time | **Socket.io** | WebSockets para chat, notificações, fórum |
| Deploy | **Vercel** + Docker | CI/CD, preview deployments |
| Testes | **Jest** + **Cypress** + **Playwright** | Unitários, integração, E2E |
| Monitoramento | **Sentry** + **Grafana** | Error tracking, logs, métricas |

### 5.2 Avaliação de adequação

| Tecnologia | Avaliação | Observação |
|-----------|-----------|------------|
| Next.js 14+ | **Adequada** | App Router com Server Components reduz JS no cliente; Server Actions simplificam mutações. Para 2026, possivelmente Next.js 15 já estará estável — verificar compatibilidade. |
| Tailwind + shadcn/ui | **Adequada** | shadcn/ui fornece componentes acessíveis (Radix UI por baixo) — atende RNF04 (WCAG 2.1 AA). |
| NestJS | **Adequada com ressalva** | NestJS é robusto para APIs complexas, mas para um dev solo pode ser overengineering. Next.js Route Handlers + Server Actions podem suprir 80% das necessidades sem um backend separado. NestJS se justifica se WebSocket e lógica de domínio forem complexos. |
| PostgreSQL (Supabase) | **Adequada** | Supabase fornece auth, storage e realtime out-of-the-box. Free tier pausa após 7 dias — para projeto acadêmico, considere o plano Pro ($25/mês) ou alternativa self-hosted. |
| Redis (Upstash) | **Adequada** | Pay-per-request, compatível com Vercel serverless. Será usado para cache de sessão e rate limiting. |
| Prisma | **Adequada** | Type-safety com TypeScript. A configuração de `DATABASE_URL` (Supavisor porta 6543) e `DIRECT_URL` (porta 5432) já está documentada no `copilot-instructions.md`. |
| NextAuth.js | **Atenção** | O projeto NextAuth.js foi renomeado para **Auth.js** (v5). Verificar se a documentação no `.tex` referencia a versão correta. |
| Socket.io | **Adequada com alternativa** | Socket.io funciona, mas o **Supabase Realtime** (já incluso no Supabase) pode substituí-lo para notificações e presença, eliminando a necessidade de servidor WebSocket separado. Socket.io se justifica apenas para o chat se precisar de controle fino. |
| Vercel | **Adequada** | Deploy nativo para Next.js. Docker mencionado, mas Vercel não usa Docker diretamente em produção — Docker seria para desenvolvimento local ou deploys fora da Vercel. Esclarecer. |
| Jest + Cypress + Playwright | **Redundância parcial** | Cypress e Playwright são ambos frameworks de teste E2E. Recomenda-se escolher **um** deles. Playwright é mais moderno, mais rápido e suporta múltiplos browsers nativamente. Sugestão: Jest (unitário) + Playwright (E2E). |
| Sentry + Grafana | **Adequada com ressalva** | Sentry é excelente para error tracking. Grafana exige infraestrutura (Prometheus ou similar como datasource) — para projeto acadêmico na Vercel, **Vercel Analytics** + **Sentry** podem ser suficientes sem necessidade de Grafana. |

### 5.3 Lacunas identificadas

| # | Lacuna | Impacto |
|---|--------|---------|
| L26 | Nenhuma versão específica fixada para as dependências (ex: Next.js "14+" é vago) | Risco de breaking changes na implementação |
| L27 | Conflito entre NestJS e Next.js Server Actions — ambos servem como backend, mas não há definição de responsabilidade clara de cada um | Duplicação de lógica |
| L28 | Docker mencionado junto com Vercel, mas Vercel não utiliza Docker em produção — escopo do Docker não está claro | Confusão na estratégia de deploy |
| L29 | 3 frameworks de teste (Jest + Cypress + Playwright) para um dev solo — sobrecarga de configuração e manutenção | Trade-off custo/benefício negativo |
| L30 | Falta ferramenta de gerenciamento de monorepo (Turborepo, Nx) se Next.js e NestJS forem projetos separados | Build e desenvolvimento local desorganizados |

### 5.3 Recomendação

A stack é **moderna e coerente**. Os pontos de ação são:

1. **Definir a fronteira Next.js vs NestJS:** Next.js Server Actions para CRUD e SSR; NestJS exclusivamente para WebSocket (chat/notificações real-time) e jobs agendados.
2. **Fixar versões** no futuro `package.json`: Next.js 15.x, NestJS 11.x, Prisma 6.x, etc.
3. **Eliminar redundância de testes:** Escolher Playwright sobre Cypress.
4. **Avaliar Supabase Realtime** como substituto parcial de Socket.io.
5. **Substituir Grafana** por Vercel Analytics para simplificar a stack de monitoramento.

---

## Resumo Geral de Lacunas e Prioridades

| Prioridade | Eixo | Lacunas | Ação necessária |
|-----------|------|---------|-----------------|
| **Alta** | Design de APIs | L15–L19 | Nenhum endpoint definido — criar documento de API |
| **Alta** | Modelagem de Banco | L6–L14 | Entidades faltantes, enums indefinidos, campos ausentes |
| **Média** | Arquitetura | L1–L5 | Decidir REST vs GraphQL, definir boundaries Next.js/NestJS |
| **Média** | Tecnologias | L26–L30 | Fixar versões, eliminar redundâncias, esclarecer Docker |
| **Baixa** | Protótipos | L20–L25 | Criar protótipos no Figma (pode ser posterior ao MVP) |

---

## Impacto Esperado

- **Arquivos que serão modificados (futuramente no Overleaf):** `site_acolhimento_faesa.tex` — seções de Diagramas UML (adicionar diagrama de sequência), Stack Tecnológica (refinar escolhas), nova seção de Design de API.
- **README/CHANGELOG precisam ser atualizados?** Sim — quando as lacunas forem endereçadas no documento.

## Riscos e Cuidados

- Não iniciar a implementação antes de resolver as lacunas de Alta prioridade (APIs e Banco). Código sem contrato de dados definido gera retrabalho.
- A escolha entre Next.js Server Actions e NestJS como backend precisa ser resolvida antes do Sprint 1 — caso contrário, haverá duplicação de lógica de autenticação e CRUD.
- O free tier do Supabase pausa após 7 dias de inatividade — considerar impacto no cronograma de desenvolvimento.

## Critério de Conclusão

Este plano estará concluído quando o aluno tiver revisado cada seção, discutido as lacunas e definido as ações a tomar para cada eixo — preferencialmente priorizando a definição de API e a complementação do modelo de dados antes de iniciar a fase de implementação.
