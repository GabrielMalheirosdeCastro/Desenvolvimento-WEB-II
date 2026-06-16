# Resumo Geral do Projeto — Site de Acolhimento FAESA

**Disciplina:** Desenvolvimento de Aplicações Web II (D001508)
**Aluno:** Gabriel Malheiros de Castro — matrícula 23110145
**Docente:** Otávio Lube dos Santos
**Instituição:** FAESA Campus Vitória
**Versão final em produção:** **v2.0.0** (2026-06-16)
**Produção:** <https://acolhimento.faesa.gmcsistemas.com.br>
**Documento gerado em:** 2026-06-16

> Este documento é um **resumo consolidado e didático** de tudo que foi construído no
> projeto, versão a versão. Ele complementa o [CHANGELOG.md](../CHANGELOG.md) (registro
> técnico formal) e o documento de [pendências](atividades/pendencias-versao-final-producao.md)
> (estado de entrega). Aqui o objetivo é **explicar a história do projeto** em linguagem
> clara, agrupando as versões por fase de evolução.

---

## 1. Visão Geral da Evolução

O projeto nasceu como um **artefato acadêmico em LaTeX** (documentação de requisitos do
sistema) e evoluiu para uma **aplicação web real, publicada em produção**, com os 16
requisitos funcionais (RF01–RF16) implementados e os requisitos não funcionais (RNF)
endurecidos para qualidade de entrega.

A linha do tempo de versões segue o **Versionamento Semântico (SemVer)**:

| Fase | Versões | Tema central |
|------|---------|--------------|
| **0. Infraestrutura** | 0.4.0 → 0.5.0 | Pipeline de deploy + migração para Postgres + monorepo |
| **1. Primeiro protótipo** | 1.0.0 → 1.0.2 | SPA React real em produção + Dockerfile single-stage |
| **2. API REST** | 1.1.0 → 1.3.2 | Endpoints, pool Postgres, fallback resiliente, seed |
| **3. Autenticação local** | 1.4.0 → 1.4.1 | Login com e-mail/senha (bcrypt + JWT) — Bloco A |
| **4. Funcionalidades reais** | 1.5.0 → 1.12.0 | Substituição de mocks por dados reais (Blocos B e H) |
| **5. Qualidade e infra** | 1.13.0 → 1.16.0 | Segurança, testes, LGPD, performance, i18n (Blocos D/E) |
| **6. Último RF** | 1.17.0 | Chat com o NAP (RF15) — fecha os 16 RFs |
| **7. Refinamento de UX** | 1.18.0 → 1.30.0 | Dark mode completo, i18n incremental, interatividade total |
| **8. Entrega final** | 2.0.0 | Acessibilidade WCAG AA, monitoria, evidências de carga |

---

## 2. Fase 0 — Infraestrutura (0.4.0 → 0.5.0)

Antes de qualquer linha da aplicação real, foi montada toda a base de operação.

### v0.4.0 (2026-04-26) — Pipeline de deploy "Em Construção"
- Aplicação **mínima Node 20 + Express** servindo uma página "Em Construção", criada
  **exclusivamente para validar o pipeline** EasyPanel → Traefik → HTTPS antes do
  desenvolvimento real. Endpoints `/`, `/healthz` e `/version`.
- `Dockerfile`, `scripts/deploy.mjs`/`deploy.sh` (webhook do EasyPanel),
  `scripts/dev-tunnel.ps1` (túnel SSH para o Postgres da VPS) e
  `.github/workflows/deploy.yml` (auto-deploy em `push`).
- Documentação operacional: [ambiente de produção](ambiente-producao-easypanel.md) e
  [setup Windows](setup-desenvolvimento-windows.md).
- No documento LaTeX (Overleaf): adicionados o **RF16 (chatbot por faixa etária)**, a
  subseção de **Limitações de Escopo**, a regra de negócio RN07 e correções de diagramas.

### v0.5.0 (2026-05-03) — Postgres + Monorepo
- **Migração de SQLite para PostgreSQL 17.6** (Supabase self-hosted na VPS), via Prisma 7
  com driver adapter `@prisma/adapter-pg`. Migrations iniciais (~30 tabelas) e seed das
  personas de demonstração.
- **Reorganização em monorepo** com workspaces: `apps/api` (Express), `apps/web` (SPA) e
  `packages/db` (Prisma). Higiene do repositório (remoção de `node_modules` versionado por
  engano).

---

## 3. Fase 1 — Primeiro Protótipo Funcional (1.0.0 → 1.0.2)

### v1.0.0 (2026-05-03) — SPA real em produção
- A **SPA React (`apps/web`)** e o **backend Express (`apps/api`)** passam a rodar como um
  **único artefato unificado**: o Express serve o `dist/` da SPA e faz fallback de rotas
  profundas (`/login`, `/dashboard/*`) para `index.html`.
- **Tela de Login** conforme a regra acadêmica: exibe Disciplina, Docente, Aluno,
  Repositório e o badge de versão `site-acolhimento-faesa · v{version}` lido de `/version`.
- Primeiro **MAJOR**: o produto real substitui a página "Em Construção".

### v1.0.1 e v1.0.2 (2026-05-03) — Ajustes de build no servidor
- **v1.0.1:** correção do `npm ci` que falhava no EasyPanel (trocado por `npm install`).
- **v1.0.2:** **Dockerfile reescrito como single-stage** — o `apps/web/dist/` passa a ser
  **buildado localmente e versionado no Git**, e o Docker apenas o copia. Decisão tomada
  porque o build multi-stage estourava a memória (OOM) na VPS apertada que coabita com o
  Supabase. *(Por isso, até hoje, é obrigatório rodar `npm run build` antes de commitar
  mudanças de frontend.)*

---

## 4. Fase 2 — API REST e Integração com o Banco (1.1.0 → 1.3.2)

### v1.1.0 (2026-05-03) — Primeira API REST
- Endpoints de diagnóstico e dashboard (`/api/_status`, `/api/me`,
  `/api/dashboard/upcoming|week|badges`).
- **Pool Postgres compartilhado** (`pg`) apontando para o pooler do Supabase.
- **Resiliência por design:** quando o banco está indisponível, todo endpoint retorna um
  payload de fallback marcado com `source: "fallback"` — o deploy nunca quebra por falta
  de banco.

### v1.2.0 (2026-05-03) — Eventos, LGPD e Mentor
- Eventos institucionais (`GET /api/eventos`), **modal LGPD bloqueante** no primeiro acesso
  (`POST /api/lgpd/consentimento`) e toggle "Buscar mentor / Sou mentor(a)".

### v1.3.0 → v1.3.2 (2026-05-13 → 2026-06-13) — Streak, debug e seed
- **v1.3.0:** endpoint de *streak* (sequência de dias) e proxy de desenvolvimento no Vite
  (`/api`, `/version`, `/healthz` → Express local).
- **v1.3.1:** fluxo de **debug F5 no VS Code** e documentação da API REST.
- **v1.3.2:** seed de produção corrigido (popula `gamificacao` e alinha o `PlanoEstudo` ao
  schema). Também resolveu o **build OOM no EasyPanel** com a criação de **4 GiB de swap**
  na VPS. A partir daqui os endpoints de dashboard respondem `source: "db"`.

---

## 5. Fase 3 — Autenticação Local (1.4.0 → 1.4.1) — Bloco A

### v1.4.0 (2026-06-13) — Login próprio
- **Decisão de arquitetura:** sem autorização institucional para usar o SSO da FAESA, a
  integração **SSO/OAuth foi descartada**. O sistema passou a usar **autenticação local
  própria** (e-mail + senha).
- **Backend (`auth.js`):** hash de senha com `bcryptjs` (cost 12), sessão por **JWT HS256**
  em cookie `httpOnly` + `SameSite=Strict` + `Secure`, e middlewares `requireAuth` e
  `requireRole` (base do RBAC). Rotas `POST /api/auth/ativar`, `/login`, `/logout` e
  `GET /api/auth/me`.
- **Frontend:** `AuthContext`/`useAuth`, `ProtectedRoute`, `LoginPage` (formulário real) e
  `AtivarPage` (primeiro acesso). O **nome do usuário** passa a aparecer na área logada.

### v1.4.1 (2026-06-13) — Correção de saudação
- Saudação e iniciais passam a ignorar títulos acadêmicos (`Prof.`, `Dra.` etc.):
  "Prof. Ricardo Almeida" agora é saudado como "Ricardo" (avatar "RA").

---

## 6. Fase 4 — Funcionalidades Reais (1.5.0 → 1.12.0) — Blocos B e H

Nesta fase, as telas que exibiam **dados fictícios (mocks)** passaram a usar **dados reais
persistidos no banco**, sempre com autenticação, escopo por dono (anti-IDOR) e validação no
servidor.

| Versão | Data | Entrega |
|--------|------|---------|
| **v1.5.0** | 2026-06-13 | **Plano de Estudos** com CRUD real de metas (RF02/RF03 — item H3) |
| **v1.6.0** | 2026-06-14 | **Avaliação de Bem-estar** (RF11 — item B1): humor/estresse/sono |
| **v1.7.0** | 2026-06-14 | **Perfil real e editável**, tema persistido, mentoria funcional, respiração 4-7-8 |
| **v1.7.1** | 2026-06-14 | *Hotfix:* import faltante quebrava a tela de Mentoria em produção |
| **v1.8.0** | 2026-06-14 | **Fórum** e **Biblioteca de Recursos** funcionais (RF06–RF08) |
| **v1.9.0** | 2026-06-14 | **Dashboard e cabeçalho interativos** (navegação real — H1/H2) |
| **v1.9.1** | 2026-06-14 | Seed de produção para Fórum/Biblioteca + criação do usuário institucional **NAP** |
| **v1.10.0** | 2026-06-14 | **RBAC efetivo** ponta a ponta + **Painel de Coordenação** (RF14) |
| **v1.11.0** | 2026-06-14 | **Chatbot de Acolhimento** (RF16): respostas por faixa etária, motor local (sem LLM), rede de segurança de crise → CVV 188 |
| **v1.12.0** | 2026-06-14 | **Notificações reais** (RF10), **página de Eventos** (RF12) e **gamificação + ranking** (RF13) |

**Destaques desta fase:**
- Todas as rotas novas são **aditivas** (não quebram contrato existente) e seguem o padrão
  `source: db|fallback` com `503` quando o banco está offline.
- **Segurança (OWASP A01):** a autorização é sempre validada no backend; o condicional no
  frontend é apenas UX. Acesso a recurso de outro usuário retorna 404 (não revela
  existência).
- O **chatbot** (RF16) é determinístico e local, em conformidade com a política "tudo na
  VPS" e a LGPD — nenhuma mensagem do aluno sai da infraestrutura própria.

---

## 7. Fase 5 — Qualidade, Segurança e Infraestrutura (1.13.0 → 1.16.0) — Blocos D e E

### v1.13.0 (2026-06-14) — Endurecimento de segurança e testes
- **Segurança da API (RNF03):** `helmet` (cabeçalhos + CSP) e `express-rate-limit`
  (limite estrito em `/api/auth/*`, geral em `/api/*`, resposta `429`). `trust proxy`
  para o IP real atrás do Traefik.
- **Testes E2E (Playwright)** e **gate de testes no CI**: o deploy passa a depender dos
  testes core (`needs: test`).

### v1.14.0 (2026-06-15) — Performance, LGPD e acessibilidade (baseline)
- **Code-splitting (RNF02):** o bundle inicial caiu de **741 kB → 132 kB** (~82% menor)
  com `React.lazy` e `manualChunks`.
- **LGPD (RNF09):** exportação dos dados pessoais (`GET /api/usuario/dados`) e exclusão
  de conta com anonimização (`DELETE /api/usuario/conta`).
- **Acessibilidade (baseline):** `lang="pt-BR"`, skip-link, landmark `<main>` e
  `aria-label` nas navegações.

### v1.15.0 (2026-06-15) — Suíte de testes formal (Vitest)
- **Vitest + cobertura v8**, limiar de **80%**. Testes unitários (auth, chatbot) e de
  integração (supertest sobre o `apiRouter` em modo fallback, nunca apontando para
  produção). Cobertura de **97,46%** dos statements em `auth.js` + `chatbot.js`.

### v1.16.0 (2026-06-15) — Internacionalização (i18n)
- Núcleo de i18n **client-side sem dependências externas**, catálogos **PT-BR / EN-US** e
  **seletor de idioma funcional** no Perfil. Cobertura do shell sempre visível (navegação,
  login, preferências) com paridade de chaves validada por teste.

---

## 8. Fase 6 — Último Requisito Funcional (1.17.0)

### v1.17.0 (2026-06-15) — Chat com o NAP (RF15)
- Canal direto de mensageria entre o aluno e o **Núcleo de Apoio Psicopedagógico (NAP)**,
  **fechando o último RF em aberto** — todos os 16 RFs concluídos.
- Transporte por **polling HTTP simples** (sem Socket.io): RF15 não exige tempo real, e o
  polling evita configurar WebSocket no Traefik, mantendo a política "tudo na VPS".
- A mesma tela adapta-se ao papel (aluno abre atendimentos; NAP responde). A **rede de
  segurança de crise** do chatbot é reutilizada, encaminhando ao NAP e ao CVV 188.

---

## 9. Fase 7 — Refinamento de UX (1.18.0 → 1.30.0)

Com os 16 RFs prontos, esta fase tornou a aplicação **interativa de verdade** e **visualmente
coesa**, eliminando botões inertes e completando o tema escuro.

| Versão | Entrega |
|--------|---------|
| **v1.18.0** | **Modo escuro completo** (todas as telas migradas para *design tokens* semânticos) |
| **v1.19.0** | i18n da tela inicial do dashboard (`DashboardHome`) |
| **v1.20.0** | i18n da tela **Plano de Estudos** |
| **v1.20.1** | *Fix:* logo "F" das telas de login deixou de ser texto selecionável |
| **v1.21.0** | Cancelamento de inscrição em eventos (fluxo reversível) |
| **v1.22.0** | Solicitação de mentoria funcional e reversível |
| **v1.23.0** | Agendamento real de sessões de mentoria (substitui mock) |
| **v1.24.0** | Identificação do papel do mentor (selo legível em vez do valor cru) |
| **v1.25.0** | Opção de deixar de ser mentor (idempotente, não destrutiva) |
| **v1.26.0** | Reconhecimento do nome na ativação de conta |
| **v1.27.0** | Confirmação reversível ao acessar itens da Biblioteca |
| **v1.28.0** | Confirmação reversível ao iniciar Trilhas de Aprendizagem |
| **v1.29.0** | Chatbot: nova conversa + histórico de conversas |
| **v1.30.0** | Fórum: entrar em tópico, ver respostas, perguntar e filtrar por categoria |

**Padrão consolidado nesta fase:** ações com efeito passam a ter **confirmação reversível**
("Confirmar"/"Cancelar"), evitando cliques acidentais, sempre com `aria-label` para leitores
de tela e sem migração de schema (reaproveitando tabelas já existentes).

---

## 10. Fase 8 — Entrega Final (2.0.0)

### v2.0.0 (2026-06-16) — Versão final de entrega acadêmica
Consolida os 16 RFs e endurece os RNF de qualidade reunidos para a banca.

- **Acessibilidade WCAG 2.1 AA (D2):** auditoria via Lighthouse nas telas do dashboard e de
  login, com correções de:
  - **Contraste:** novos tokens `--success-strong` / `--warning-strong` (reservados a texto
    pequeno) e `--muted-foreground` escurecido — garantindo ≥ 4,5:1 sem descaracterizar as
    cores institucionais usadas em ícones e selos.
  - **Ordem de títulos:** eliminados saltos `h1→h3`/`h4` em `DashboardHome`, `StudyPlanPage`,
    `ForumPage` e `ProfilePage`.
  - **Login:** lista de definição (`<dl>`) reestruturada e links com sublinhado permanente
    (não dependem mais só da cor).
- **Monitoria de disponibilidade (D4):** workflow `uptime.yml` (cron a cada 30 min) verifica
  `/healthz` e `/version` em produção.
- **Escalabilidade (D6):** teste de carga com `autocannon` — **~17 mil requisições em 30 s,
  0 erros**, p50 30 ms / p99 114 ms. Evidência em [evidencia-d6-carga.md](evidencia-d6-carga.md).
- **README reconciliado** com a implementação real (monolito React + Express + Postgres
  self-hosted), substituindo a stack proposta inicialmente.

---

## 11. Estado Final do Projeto

| Dimensão | Estado |
|----------|--------|
| **Requisitos funcionais** | **16/16 concluídos** (RF01–RF16) |
| **Requisitos não funcionais** | Segurança, performance, acessibilidade AA, LGPD, i18n, monitoria e carga concluídos |
| **Testes** | 71 testes Vitest verdes; cobertura 97,5% (auth + chatbot) |
| **Versão em produção** | **v2.0.0** confirmada via `/version` e `/healthz` |
| **Pendência restante** | Apenas o **Bloco G** (documentação acadêmica final no Overleaf), tratado fora deste repositório por opção do aluno |

A aplicação está **entregue e funcionando** em <https://acolhimento.faesa.gmcsistemas.com.br>.
Não há mais nenhuma tarefa de código ou deploy em aberto.

---

## 12. Stack Tecnológica Entregue

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + Vite 6, React Router 7, Tailwind 4, i18n próprio, tema por tokens |
| **Backend** | Express 4, autenticação local (bcryptjs + JWT HS256, cookie `httpOnly`), `helmet`, `express-rate-limit` |
| **Banco** | PostgreSQL 17.6 (Supabase self-hosted), acesso via pool `pg` |
| **Testes** | Vitest + cobertura v8 (CI), Playwright E2E (estação Windows) |
| **Infra** | Docker single-stage, EasyPanel + Traefik 3.6.7, VPS Hostinger Ubuntu 24.04 |
| **CI/CD** | GitHub Actions (gate de testes + webhook de deploy) + monitoria `uptime.yml` |

---

> **Referências cruzadas:**
> - Registro técnico formal: [CHANGELOG.md](../CHANGELOG.md)
> - Estado de entrega e pendências: [pendencias-versao-final-producao.md](atividades/pendencias-versao-final-producao.md)
> - Evidência de carga (D6): [evidencia-d6-carga.md](evidencia-d6-carga.md)
> - Ambiente de produção: [ambiente-producao-easypanel.md](ambiente-producao-easypanel.md)
