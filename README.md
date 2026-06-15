# Site de Acolhimento FAESA

> Documento de Requisitos, Arquitetura e Diagramas para o desenvolvimento de uma plataforma web de acolhimento estudantil.

---

## 📋 Informações Acadêmicas

| Campo | Informação |
|---|---|
| **Instituição** | FAESA — Campus Vitória |
| **Disciplina** | D001508 — Desenvolvimento de Aplicações Web II |
| **Turma** | CI-1014-261-5DC1 NATEC01 |
| **Docente** | Otávio Lube dos Santos |
| **Aluno** | Gabriel Malheiros de Castro |
| **Matrícula** | 23110145 |
| **Ano** | 2026 |

---

## 📌 Sobre o Projeto

O **Site de Acolhimento FAESA** é uma plataforma web responsiva que centraliza recursos de acolhimento para os estudantes da FAESA, acompanhando o aluno desde o ingresso até a conclusão do curso. A proposta visa promover **organização, bem-estar e excelência acadêmica**.

> *"Criar uma plataforma digital de acolhimento que acompanhe o estudante FAESA desde o ingresso até a conclusão do curso, promovendo organização, bem-estar e excelência acadêmica."*

---

## 🎯 Funcionalidades Principais

| ID | Funcionalidade | Prioridade |
|---|---|---|
| RF01 | Cadastro e Login (SSO institucional) | Alta |
| RF02 | Plano de Estudos Personalizado | Alta |
| RF03 | Cronograma Interativo (drag-and-drop) | Alta |
| RF04 | Exercícios de Concentração (Pomodoro, mindfulness) | Alta |
| RF05 | Dashboard de Progresso acadêmico | Alta |
| RF06 | Biblioteca de Recursos (artigos, vídeos, podcasts) | Média |
| RF07 | Trilhas de Aprendizagem por curso e período | Média |
| RF08 | Fórum de Discussão | Média |
| RF09 | Sistema de Mentoria (veteranos × calouros) | Média |
| RF10 | Notificações e Lembretes (push e e-mail) | Média |
| RF11 | Avaliação de Bem-estar | Média |
| RF12 | Atividades Extracurriculares | Baixa |
| RF13 | Gamificação (pontos, badges, rankings) | Baixa |
| RF14 | Relatórios para Coordenação | Baixa |
| RF15 | Chat com Suporte psicopedagógico | Baixa |
| RF16 | Chatbot IA de Acolhimento (respostas adaptadas por faixa etária: 17–20, 21–25, 26+) | Alta |

---

## 🏗️ Arquitetura do Sistema

A plataforma segue uma arquitetura em 4 camadas:

```
┌─────────────────────────────────────────┐
│   Camada de Apresentação (Frontend)     │
│   React.js / Next.js · Tailwind CSS     │
│   PWA / Service Worker                  │
└──────────────────┬──────────────────────┘
                   │ HTTP/HTTPS
┌──────────────────▼──────────────────────┐
│   Camada de API (Backend)               │
│   API REST / GraphQL · Auth JWT/OAuth   │
│   WebSocket (Real-time)                 │
└──────────────────┬──────────────────────┘
                   │ Chamadas de Serviço
┌──────────────────▼──────────────────────┐
│   Camada de Serviços (Domínio)          │
│   Plano de Estudos · Concentração       │
│   Mentoria · Gamificação                │
└──────────────────┬──────────────────────┘
                   │ ORM / Queries
┌──────────────────▼──────────────────────┐
│   Camada de Dados (Persistência)        │
│   PostgreSQL · Redis (Cache)            │
│   S3 / Storage                          │
└─────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | React.js / Next.js 14+ | SSR/SSG para performance, TypeScript |
| **Estilização** | Tailwind CSS + shadcn/ui | Design system responsivo, dark mode |
| **Backend** | Node.js + NestJS | Alta performance, ecossistema JS unificado |
| **Banco de Dados** | **Supabase self-hosted** (PostgreSQL 17.6) | Stack Supabase completa instalada na **mesma VPS** que hospeda a aplicação; pooler Supavisor incluso |
| **Cache** | Redis (a definir) | Avaliação pendente: container Redis na própria VPS *vs.* Upstash serverless |
| **ORM** | Prisma | Type-safe, migrations automáticas; conexão direta ao Postgres via rede overlay Docker |
| **Autenticação** | Supabase Auth (GoTrue) + NextAuth.js | OAuth 2.0, JWT, RLS, SSO institucional |
| **Real-time** | Supabase Realtime / Socket.io | Chat, fórum e notificações ao vivo |
| **Deploy** | **EasyPanel (Docker Swarm) + Traefik** em **VPS Hostinger** | Build a partir de `Dockerfile`, TLS Let's Encrypt automático, redeploy via webhook |
| **Testes** | Jest + Cypress + Playwright | Cobertura unitária, integração e E2E |
| **Monitoramento** | Sentry + (Grafana/Uptime Kuma a definir) | Error tracking; observabilidade pendente |

> **Banco de Dados — Decisão Técnica revisada (2026-04-26):** o projeto adota **Supabase self-hosted**
> (PostgreSQL 17.6 + Kong + GoTrue + PostgREST + Realtime + Storage + Edge Functions + Supavisor)
> rodando na **mesma VPS Hostinger** que executa o EasyPanel. A aplicação se conecta pela rede
> overlay Docker `easypanel`, sem expor o Postgres na internet. O Prisma usa `DATABASE_URL`
> (`supabase-pooler:6543`, transaction mode) para queries e `DIRECT_URL` (`supabase-db:5432`) para
> migrations. Detalhes operacionais em [`/opt/supabase/.../DEPLOY-EXECUTADO-2026-04.md`](../postgres17-supabase-easypanel/docs/DEPLOY-EXECUTADO-2026-04.md)
> e em [docs/ambiente-producao-easypanel.md](docs/ambiente-producao-easypanel.md).

---

## 🚀 Ambiente de Produção

| Item | Valor |
|---|---|
| **URL pública** | <https://acolhimento.faesa.gmcsistemas.com.br> |
| **Servidor** | VPS Hostinger — Ubuntu 24.04.4 LTS, 2 vCPU AMD EPYC 9354P, 7.8 GiB RAM, 96 GB SSD |
| **Swap** | 4 GiB (`/swapfile`, persistente via `/etc/fstab`) — evita OOM no build do `vite` |
| **IP** | `187.77.47.53` (DNS Cloudflare *DNS-only*) |
| **Orquestrador** | Docker 29.4.1 + Swarm + EasyPanel |
| **Reverse proxy** | Traefik 3.6.7 (gerenciado pelo EasyPanel) com Let's Encrypt automático |
| **Banco de dados** | Supabase self-hosted (PostgreSQL 17.6) — **mesma VPS** |
| **Build** | Dockerfile (multi-stage, `node:20-alpine`, usuário não-root) |
| **Gatilho de deploy** | Webhook do EasyPanel (segredo `EASYPANEL_DEPLOY_WEBHOOK`) |
| **GitHub Action** | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — dispara em `push` para `master` |

> O **mesmo banco de dados** é utilizado para desenvolvimento e produção (não há Postgres na
> estação de trabalho Windows 11). O acesso de desenvolvimento ocorre via **túnel SSH** —
> ver [docs/setup-desenvolvimento-windows.md](docs/setup-desenvolvimento-windows.md).
>
> **Status (2026-06-13):** banco de produção populado com a persona real (Gabriel,
> matrícula `23110145`). Todos os endpoints `/api/*` respondem `"source": "db"` — o fallback
> estático deixou de ser exercido em produção. Versão publicada: **v1.3.2**.

---

## 🗄️ Banco de Dados (Dev e Produção)

A porta 5432 do Postgres **não está exposta na internet** (decisão de segurança). O acesso depende do contexto:

| Contexto | Como conectar |
|---|---|
| **App em produção** (container EasyPanel anexo à overlay `easypanel`) | `DATABASE_URL=postgresql://postgres.gmc:SENHA@supabase-pooler:6543/postgres?pgbouncer=true`<br/>`DIRECT_URL=postgresql://postgres:SENHA@supabase-db:5432/postgres` |
| **Dev na estação Windows 11** (sem Postgres local) | Abrir túnel SSH: `pwsh ./scripts/dev-tunnel.ps1` → conectar em `localhost:6543` (pooler) e `localhost:5432` (direct) |
| **Administração via DBeaver/pgAdmin** | Mesmo túnel SSH (script PowerShell acima) |
| **psql interativo no servidor** | `ssh root@vps.gmcsistemas.com.br "docker exec -it supabase-db psql -U postgres"` |

> O subprojeto [`banco-dados-requisitos-projeto/`](banco-dados-requisitos-projeto/) contém uma
> **modelagem isolada em SQLite** usada apenas para validar o schema Prisma de 33 tabelas.
> A migração desse schema para o Postgres da VPS ocorrerá quando a fase de desenvolvimento da
> aplicação iniciar.

---

## 📦 Deploy

A aplicação é construída a partir do [`Dockerfile`](Dockerfile) na raiz e implantada via
EasyPanel. Existem **cinco formas** de disparar o redeploy (todas levam ao mesmo webhook):

| # | Forma | Quando usar |
|---|---|---|
| 1 | **Automática** — `git push origin master` | Fluxo padrão. A GitHub Action [`deploy.yml`](.github/workflows/deploy.yml) dispara o webhook automaticamente. |
| 2 | `npm run deploy` | Disparo manual local — lê `.env`, valida o segredo, chama o webhook via `fetch`. |
| 3 | `./scripts/deploy.sh` | Mesma coisa em bash (Linux/macOS/WSL). |
| 4 | VS Code task **Deploy: trigger EasyPanel webhook** | Pelo Command Palette ▸ *Tasks: Run Task*. |
| 5 | `curl` manual | `curl -fsS -X POST "$EASYPANEL_DEPLOY_WEBHOOK"` — *fallback* de emergência. |

### Configuração do segredo

1. **Local:** copie `.env.example` → `.env` e preencha `EASYPANEL_DEPLOY_WEBHOOK`.
   `.env` já está no [.gitignore](.gitignore) — **nunca** comite o token.
2. **GitHub Actions:** *Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret* —
   nome: `EASYPANEL_DEPLOY_WEBHOOK`, valor: a URL completa fornecida pelo EasyPanel.

### Variáveis de ambiente da aplicação

| Variável | Onde usa | Observação |
|---|---|---|
| `PORT` | Servidor Express | Default `3010` (escolhido para não conflitar com a UI do EasyPanel na porta 3000). EasyPanel injeta o valor real em produção. |
| `NODE_ENV` | Servidor Express | `production` em produção. |
| `DATABASE_URL` | Prisma (runtime) | Apontará para `supabase-pooler:6543` quando a app real for iniciada. |
| `DIRECT_URL` | Prisma (migrations) | Apontará para `supabase-db:5432`. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | SDK Supabase | Os dois primeiros são frontend-safe; o `service_role` é **backend only**. |
| `EASYPANEL_DEPLOY_WEBHOOK` | Scripts de deploy | Tratar como segredo. |

### Estado atual do deploy

> A versão atual (`v1.3.0`) é um **monorepo** composto por uma **SPA React** (`apps/web`)
> servida por um **backend Express** (`apps/api`) que expõe uma **API REST** documentada na
> seção [🔌 API REST](#-api-rest). O backend é **resiliente**: quando a variável `DATABASE_URL`
> está ausente (ex.: estação de desenvolvimento Windows sem Postgres local), os endpoints
> respondem com dados estáticos de fallback, permitindo demonstrar a aplicação sem o banco.
> O pipeline GitHub → EasyPanel → Traefik → HTTPS permanece validado por `/healthz` e `/version`.

---

## 🔌 API REST

O backend Express (`apps/api`) expõe uma API REST organizada em três módulos com
responsabilidades separadas:

| Arquivo | Responsabilidade |
|---|---|
| [`apps/api/server.js`](apps/api/server.js) | Inicialização do servidor, healthcheck, versão, serviço da SPA e *graceful shutdown* (`SIGTERM`/`SIGINT`). |
| [`apps/api/routes.js`](apps/api/routes.js) | Roteador REST com todos os endpoints de negócio (`/api/*`). |
| [`apps/api/db.js`](apps/api/db.js) | Pool de conexão PostgreSQL compartilhado e função de query parametrizada. |

### Princípio de resiliência (*graceful degradation*)

Cada endpoint tenta executar a query no PostgreSQL. Se o pool estiver conectado **e** houver
resultado, responde com `"source": "db"`. Se `DATABASE_URL` estiver ausente **ou** a query
falhar, responde com dados estáticos coerentes marcados com `"source": "fallback"`. Isso permite
demonstrar a aplicação completa sem depender do banco de produção.

### Endpoints de infraestrutura

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/healthz` | Healthcheck completo (status, versão, Node, *uptime*, timestamp). |
| `GET` | `/version` | Nome e versão do projeto (validação de redeploy). |

### Endpoints de negócio (`/api`)

| Método | Rota | Finalidade | Requisito |
|---|---|---|---|
| `GET` | `/api/_status` | Indica se o banco está `connected` ou em `fallback`. | — |
| `GET` | `/api/me` | Retorna a persona logada (protótipo, sem autenticação real). | — |
| `GET` | `/api/dashboard/upcoming` | Próximas atividades de estudo do usuário. | RF05 |
| `GET` | `/api/dashboard/week` | Horas de estudo da semana corrente (Seg–Dom). | RF05 |
| `GET` | `/api/dashboard/streak` | Sequência atual e recorde de estudo (gamificação). | RF13 |
| `GET` | `/api/dashboard/badges` | Conquistas recentes do usuário. | RF13 |
| `GET` | `/api/eventos` | Eventos institucionais (palestras, oficinas). | RF12 |
| `POST` | `/api/lgpd/consentimento` | Registra o aceite do termo LGPD. | RNF09 |
| `GET` | `/api/usuario/dados` | Exporta os dados pessoais do titular (portabilidade). | RNF09 |
| `DELETE` | `/api/usuario/conta` | Anonimiza/elimina a conta do titular (confirmação obrigatória). | RNF09 |
| `GET` | `/api/mentorias?papel=mentor` | Lista mentores cadastrados. | RF09 |
| `POST` | `/api/mentorias/cadastro-mentor` | Marca a persona logada como mentor. | RF09 |

> Qualquer rota não atendida acima devolve o `index.html` da SPA React buildada
> (`apps/web/dist`), delegando o roteamento ao **React Router** no lado do cliente.

### Segurança

- **Queries parametrizadas** (`$1`, `$2`, …) via driver `pg` — proteção contra injeção de SQL (OWASP A03).
- **Sanitização de entrada** no `POST /api/lgpd/consentimento`: todos os campos recebidos do
  cliente são convertidos para string e truncados antes da persistência.

### Como executar e testar localmente

```powershell
# 1. Subir o servidor da API (porta 3010)
node apps/api/server.js

# 2. Em outro terminal, testar um endpoint
Invoke-WebRequest -Uri "http://localhost:3010/healthz" -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri "http://localhost:3010/api/dashboard/streak" -UseBasicParsing | Select-Object -ExpandProperty Content
```

> Relatório técnico completo da API, com resultados de testes:
> [docs/relatórios entrega/relatorio-funcionamento-api.md](docs/relat%C3%B3rios%20entrega/relatorio-funcionamento-api.md).

---

## 🧪 Testes e Qualidade

A partir da v1.13.0 o projeto tem endurecimento de segurança na API (`helmet` +
`express-rate-limit`). A **v1.15.0** formaliza a suíte de testes em **Vitest** (unitários +
integração com `supertest`) com **cobertura ≥ 80%** na lógica de API (atual: **97,46%**).

| Comando | O que roda | Onde |
|---------|-----------|------|
| `npm test` | Vitest (unit auth/chatbot + integração supertest) com cobertura | Estação **e** CI |
| `npm run test:watch` | Vitest em modo watch (desenvolvimento) | Estação |
| `npm run test:e2e` | Specs Playwright (login + smoke v1.12.0) | **Só na estação Windows** |

```powershell
# Suite Vitest (lógica de auth/chatbot + integração do apiRouter — não exigem banco nem GUI)
npm test

# E2E na estação (a VPS é headless — não rode Playwright lá)
npx playwright install   # primeira vez: baixa o Chromium
npm run test:e2e

# Validar contra produção (padrão) ou local:
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3010"; npm run test:e2e

# Smoke autenticado (opcional) — sem segredos no repositório:
$env:TEST_USER_EMAIL = "seu.email@faesa.br"
$env:TEST_USER_PASSWORD = "<sua-senha>"
npm run test:e2e
```

> O `smoke-v1.12.0.spec` é **pulado** automaticamente se `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`
> não estiverem no ambiente. No CI ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)),
> o job `test` roda `npm test` **antes** do deploy (`needs: test`); os specs Playwright **não**
> entram no CI por exigirem interface gráfica.

---

## 👥 Personas

- **Lucas (Calouro, 18 anos)** — quer se organizar e ter excelência acadêmica desde o início
- **Mariana (Veterana/Mentora, 22 anos)** — quer desenvolver liderança e contribuir com a comunidade
- **Prof. Ricardo (Coordenador, 45 anos)** — quer reduzir evasão e melhorar a experiência acadêmica

---

## 📊 Documentação

O arquivo [`site_acolhimento_faesa.tex`](site_acolhimento_faesa.tex) contém o documento completo do projeto, incluindo:

- ✅ Análise de Requisitos Funcionais e Não Funcionais
- ✅ Diagrama de Casos de Uso (UML)
- ✅ Diagrama de Classes (UML)
- ✅ Diagrama de Componentes / Arquitetura
- ✅ Diagrama de Fluxo de Navegação
- ✅ Diagrama Entidade-Relacionamento (ER)
- ✅ Diagrama de Atividades do Chatbot IA (RF16)
- ✅ Stack Tecnológica Recomendada
- ✅ Personas e Histórias de Usuário

Projeto inclui uma área permanente de banco de dados em [banco-dados-requisitos-projeto/README.md](banco-dados-requisitos-projeto/README.md), com modelo relacional SQLite de 33 tabelas aderente aos requisitos do projeto em [banco-dados-requisitos-projeto/schema.sql](banco-dados-requisitos-projeto/schema.sql), modelagem em Prisma em [banco-dados-requisitos-projeto/prisma/schema.prisma](banco-dados-requisitos-projeto/prisma/schema.prisma), e DER em Mermaid em [banco-dados-requisitos-projeto/der-fonte.mmd](banco-dados-requisitos-projeto/der-fonte.mmd) para apoio técnico às análises do banco.

Guias operacionais de infraestrutura/deploy:

- [docs/ambiente-producao-easypanel.md](docs/ambiente-producao-easypanel.md) — arquitetura de produção, runbook, troubleshooting.
- [docs/setup-desenvolvimento-windows.md](docs/setup-desenvolvimento-windows.md) — setup da estação Windows 11 com túnel SSH para o Postgres da VPS.

### Como compilar o documento LaTeX

Requer **MiKTeX** (Windows) ou **TeX Live** instalado.

```bash
# Recomendado: lualatex (necessário para TikZ e fontawesome5)
lualatex site_acolhimento_faesa.tex

# Ou via latexmk (gerencia passagens automaticamente)
latexmk -lualatex site_acolhimento_faesa.tex
```

---

## ⚙️ Configuração do Ambiente (VS Code)

Este projeto inclui configurações otimizadas para o VS Code:

- [`.vscode/settings.json`](.vscode/settings.json) — configurações do LaTeX Workshop (compilador lualatex, build automático, visualizador de PDF)
- [`.vscode/extensions.json`](.vscode/extensions.json) — extensões recomendadas para o projeto

Ao abrir o workspace, o VS Code sugerirá automaticamente a instalação das extensões recomendadas.

---

## 📦 Requisitos Não Funcionais

| ID | Categoria | Meta |
|---|---|---|
| RNF01 | Responsividade | Mobile-First, todos os dispositivos |
| RNF02 | Performance | Carregamento ≤ 3s em 3G |
| RNF03 | Segurança | OAuth 2.0, TLS 1.3, proteção XSS/CSRF |
| RNF04 | Acessibilidade | WCAG 2.1 nível AA |
| RNF05 | Disponibilidade | Uptime mínimo 99,5% |
| RNF06 | Escalabilidade | Até 10.000 usuários simultâneos |
| RNF07 | Usabilidade | Interface intuitiva, Design System consistente, taxa de erro ≤2% |
| RNF08 | Manutenibilidade | Código documentado, arquitetura modular, cobertura de testes ≥80% |
| RNF09 | LGPD | Conformidade total com Lei 13.709/2018 |
| RNF10 | Internacionalização | pt-BR como idioma principal, preparação para en-US |
