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

> Esta primeira versão (`v0.4.0`) é uma **página "Em Construção"** servida por
> Node.js + Express, **sem conexão com o banco de dados**. Existe apenas para validar o
> pipeline GitHub → EasyPanel → Traefik → HTTPS antes do início do desenvolvimento real.
> Endpoints disponíveis: `/` (página), `/healthz` (JSON status), `/version` (JSON versão).

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
