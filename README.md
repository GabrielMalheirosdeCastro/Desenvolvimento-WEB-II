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
| **Banco de Dados** | Supabase (PostgreSQL 16+) | PostgreSQL gerenciado em nuvem; compatível com Vercel (serverless pooling via Supavisor) |
| **Cache** | Redis (Upstash) | Serverless Redis compatível com Vercel; sessões e notificações em tempo real |
| **ORM** | Prisma | Type-safe, migrations automáticas; integração oficial com Supabase |
| **Autenticação** | Supabase Auth + NextAuth.js | Auth nativo do Supabase (OAuth 2.0, JWT, SSO) |
| **Real-time** | Supabase Realtime / Socket.io | Chat e notificações ao vivo |
| **Deploy** | Vercel + Docker | CI/CD automatizado, escalabilidade |
| **Testes** | Jest + Cypress + Playwright | Cobertura unitária, integração e E2E |
| **Monitoramento** | Sentry + Grafana | Error tracking e métricas de performance |

> **Banco de Dados — Decisão Técnica (2026-02-28):** O Supabase foi adotado como solução de
> banco de dados em nuvem em substituição ao PostgreSQL self-hosted. O Supabase **é** PostgreSQL
> (v16+) com gerenciamento, pooling e Auth incluídos. A compatibilidade com Vercel (serverless) é
> garantida pelo **Supavisor** (connection pooler nativo do Supabase), que evita o esgotamento de
> conexões em funções serverless. No Prisma, usa-se `DATABASE_URL` (Supavisor transaction mode,
> porta 6543) para queries em produção e `DIRECT_URL` (conexão direta, porta 5432) para migrations.
> Fontes consultadas: [supabase.com/pricing](https://supabase.com/pricing),
> [supabase.com/docs/guides/database/connecting-to-postgres](https://supabase.com/docs/guides/database/connecting-to-postgres),
> [supabase.com/partners/integrations/prisma](https://supabase.com/partners/integrations/prisma).

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

Projeto inclui uma área permanente de banco de dados em [banco-dados-requisitos-projeto/README.md](banco-dados-requisitos-projeto/README.md), com modelo relacional SQLite de 33 tabelas aderente aos requisitos do projeto em [banco-dados-requisitos-projeto/schema.sql](banco-dados-requisitos-projeto/schema.sql), script de validação e carga em [banco-dados-requisitos-projeto/scripts/setup_and_demo.py](banco-dados-requisitos-projeto/scripts/setup_and_demo.py), e DER em Mermaid em [banco-dados-requisitos-projeto/der-fonte.mmd](banco-dados-requisitos-projeto/der-fonte.mmd) para apoio técnico às análises do banco.

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
