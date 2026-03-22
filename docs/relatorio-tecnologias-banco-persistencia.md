# Relatório Consolidado — Tecnologias, Banco de Dados e Persistência do Projeto

**Data:** 2026-03-11  
**Autor:** Gabriel Malheiros de Castro  
**Disciplina:** D001508 — Desenvolvimento de Aplicações Web II  
**Tipo:** Documento de referência — consolidação de todos os artefatos do repositório

---

## Objetivo deste Documento

Apresentar um relatório técnico completo e unificado sobre **todas as tecnologias, a estratégia de banco de dados e o modelo de persistência** do projeto Site de Acolhimento FAESA, sintetizando as informações dispersas nos seguintes artefatos:

| Documento-fonte | Conteúdo extraído |
|-----------------|-------------------|
| `site_acolhimento_faesa.tex` | Requisitos (RF01–RF16, RNF01–RNF10), diagramas UML, stack tecnológica, personas, arquitetura em 4 camadas |
| `README.md` | Visão geral do projeto, tabela de stack, arquitetura ASCII, instruções de compilação |
| `CHANGELOG.md` | Histórico de decisões técnicas (adoção do Supabase, Upstash, correções de diagramas) |
| `copilot-instructions.md` | Configuração de ambiente, estratégia de conexão Prisma/Supavisor, regras operacionais |
| `docs/documento-banco-de-dados-tecnologias.md` | Modelagem completa do banco, entidades, relacionamentos, enums, decisões técnicas |
| `docs/documento-cores-tecnologias-frontend.md` | Paleta de cores, HTML5, CSS3, JavaScript, Tailwind, shadcn/ui, fluxo de renderização |
| `docs/plano-2026-03-08-analise-fase-projeto-design.md` | Análise dos 5 eixos de design (Arquitetura, Banco, APIs, Protótipos, Tecnologias), lacunas identificadas |
| `docs/plano-2026-03-11-mapeamento-avaliacoes-praticas.md` | Mapeamento de avaliações, conceitos de Express.js, CRUD, integração com banco |

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Camada de Persistência — Banco de Dados](#2-camada-de-persistência--banco-de-dados)
3. [Camada de Cache — Redis](#3-camada-de-cache--redis)
4. [Camada de Mapeamento — ORM Prisma](#4-camada-de-mapeamento--orm-prisma)
5. [Modelo de Dados — Entidades e Relacionamentos](#5-modelo-de-dados--entidades-e-relacionamentos)
6. [Camada de Apresentação — Tecnologias Front-End](#6-camada-de-apresentação--tecnologias-front-end)
7. [Camada de API — Tecnologias Back-End](#7-camada-de-api--tecnologias-back-end)
8. [Autenticação e Segurança](#8-autenticação-e-segurança)
9. [Comunicação em Tempo Real](#9-comunicação-em-tempo-real)
10. [Infraestrutura de Deploy](#10-infraestrutura-de-deploy)
11. [Testes e Monitoramento](#11-testes-e-monitoramento)
12. [Mapa Tecnológico Unificado](#12-mapa-tecnológico-unificado)
13. [Lacunas Consolidadas e Status de Resolução](#13-lacunas-consolidadas-e-status-de-resolução)
14. [Glossário de Termos Técnicos](#14-glossário-de-termos-técnicos)

---

## 1. Visão Geral da Arquitetura

O Site de Acolhimento FAESA adota uma **arquitetura monolítica modular em 4 camadas**, com separação clara de responsabilidades. Não é microsserviços — os módulos de domínio são componentes lógicos dentro de um mesmo deploy.

```
┌─────────────────────────────────────────────────┐
│   CAMADA 1 — APRESENTAÇÃO (Frontend)            │
│   Next.js 14+ (React) · TypeScript              │
│   Tailwind CSS · shadcn/ui · PWA / Service Worker│
├─────────────────────────────────────────────────┤
│   CAMADA 2 — API (Backend)                      │
│   API REST (Express.js / NestJS)                │
│   Auth JWT/OAuth · WebSocket (Socket.io)        │
├─────────────────────────────────────────────────┤
│   CAMADA 3 — SERVIÇOS (Domínio)                 │
│   Plano de Estudos · Concentração               │
│   Mentoria · Gamificação · Fórum · Chat         │
│   Notificações · Bem-Estar · Trilhas · Chatbot  │
├─────────────────────────────────────────────────┤
│   CAMADA 4 — DADOS (Persistência)               │
│   PostgreSQL 16+ (Supabase) · Redis (Upstash)   │
│   Prisma ORM · Supabase Auth · S3/Storage       │
└─────────────────────────────────────────────────┘
```

### 1.1 Padrão Arquitetural

- **Cliente-servidor com separação em camadas** (Layered Architecture).
- O frontend (Next.js) atua como **BFF** (Backend-for-Frontend) — pode acessar o banco diretamente via Server Components e Server Actions para operações CRUD simples.
- O backend (NestJS) concentra lógica de domínio complexa, WebSocket e jobs agendados.
- A comunicação entre frontend e backend é via **API REST** (decisão consolidada — GraphQL foi descartado por complexidade desnecessária para desenvolvedor solo).

### 1.2 Integrações Externas Documentadas

| Integração | Finalidade |
|------------|-----------|
| E-mail Service | Notificações por e-mail (RF10) |
| Push Notifications | Lembretes de Pomodoro, sessões de mentoria (RF10) |
| FAESA SSO | Single Sign-On institucional (RF01) |
| LMS Integration | Integração com sistema acadêmico existente |

---

## 2. Camada de Persistência — Banco de Dados

### 2.1 Tecnologia Escolhida: PostgreSQL 16+ via Supabase

| Atributo | Valor |
|----------|-------|
| **Tipo** | Banco de dados relacional (SQL) |
| **Modelo de dados** | Tabelas com linhas e colunas, relacionamentos via chaves primárias e estrangeiras |
| **Hospedagem** | Supabase Cloud (DBaaS — Database as a Service) |
| **Versão mínima** | PostgreSQL 16+ |
| **Pooling de conexões** | Supavisor (incluso no Supabase) |
| **Conformidade** | Transações ACID |

### 2.2 Justificativa da Escolha — Por que SQL Relacional?

A raiz técnica da escolha por banco relacional está na natureza dos dados do projeto:

1. **Entidades com relacionamentos bem definidos** — Usuário cria Plano, Plano contém Metas, Usuário participa de Mentoria. Esses vínculos exigem integridade referencial garantida pelo banco.
2. **Integridade referencial obrigatória** — Não pode existir uma Meta sem Plano, nem uma Mentoria sem dois Usuários vinculados. Foreign keys são essenciais.
3. **Consultas complexas frequentes** — Dashboards e relatórios de coordenação (RF05, RF14) exigem JOINs entre múltiplas tabelas.
4. **Transações ACID** — Operações como registrar pontuação e desbloquear badges simultaneamente (RF13) exigem atomicidade — ou ambas acontecem, ou nenhuma.

### 2.3 Justificativa da Escolha — Por que Supabase e Não PostgreSQL Puro?

| Fator | PostgreSQL puro | Supabase (PostgreSQL gerenciado) |
|-------|----------------|----------------------------------|
| **Conexão serverless** | Limite de ~100 conexões simultâneas; serverless (Vercel) esgota em picos | Supavisor (connection pooler nativo) resolve o problema |
| **Autenticação** | Requer implementação separada | Supabase Auth integrado (OAuth 2.0, JWT, RLS, SSO) |
| **Storage de arquivos** | Requer S3 ou similar separado | Supabase Storage integrado |
| **Tempo real** | Requer Socket.io ou similar | Supabase Realtime integrado (WebSocket sobre PostgreSQL) |
| **Backup** | Configuração manual | Backup automático gerenciado |
| **Custo** | Self-hosted: servidor dedicado | Free tier disponível (pausa após 7 dias inativo); Pro: $25/mês |

### 2.4 Estratégia de Conexão em Ambiente Serverless

O deploy na Vercel (serverless) impõe que cada invocação de função abre e fecha conexões com o banco. Para evitar o esgotamento de conexões, o Prisma utiliza **duas URLs distintas**:

| Variável de ambiente | Porta | Modo | Uso |
|---------------------|-------|------|-----|
| `DATABASE_URL` | 6543 | Supavisor (transaction mode) | Queries da aplicação em produção (serverless-safe) |
| `DIRECT_URL` | 5432 | Conexão direta ao PostgreSQL | Exclusivamente para migrations (`prisma migrate deploy` / `prisma db push`) |

**Razão técnica:** O Supavisor em transaction mode não suporta prepared statements, que o Prisma utiliza internamente nas migrations. A `DIRECT_URL` garante que migrations conversem diretamente com o PostgreSQL sem intermediário.

### 2.5 Histórico da Decisão

- **Versão 0.1.0 (2026-02-28):** PostgreSQL self-hosted definido como banco.
- **Versão 0.3.0 (2026-02-28):** Migração para Supabase (PostgreSQL 16+ gerenciado) para compatibilidade com Vercel serverless. Registrado no CHANGELOG.

---

## 3. Camada de Cache — Redis

### 3.1 Tecnologia Escolhida: Redis via Upstash

| Atributo | Valor |
|----------|-------|
| **Tipo** | Banco de dados em memória, estrutura chave-valor |
| **Hospedagem** | Upstash (Redis serverless, pay-per-request) |
| **Latência** | Microsegundos (vs milissegundos do PostgreSQL) |
| **Compatibilidade** | Nativa com ambiente serverless Vercel |

### 3.2 Finalidades no Projeto

| Uso | Descrição | Requisito relacionado |
|-----|-----------|----------------------|
| **Cache de sessões** | Armazenamento temporário de sessões de usuário autenticado | RF01 |
| **Cache de dashboard** | Dados pré-computados do dashboard para evitar consultas repetidas ao PostgreSQL | RF05 |
| **Rate limiting** | Limitação de requisições à API por IP/usuário para proteção contra abuso | RNF03 |
| **Filas de notificação** | Enfileiramento de notificações push em tempo real antes do envio | RF10 |

### 3.3 Justificativa — Por que Redis Separado?

- PostgreSQL não é eficiente para dados efêmeros de alta frequência (sessões, cache).
- Redis opera em memória — latência de microsegundos contra milissegundos do PostgreSQL para leituras de cache.
- Upstash é serverless (pay-per-request) — não requer servidor Redis dedicado; compatível com o modelo da Vercel.

### 3.4 Pacotes npm Associados

- `@upstash/redis` — Cliente Redis otimizado para Upstash/serverless.
- `ioredis` — Alternativa genérica de cliente Redis para Node.js.

---

## 4. Camada de Mapeamento — ORM Prisma

### 4.1 O que é o Prisma

Prisma é um **Object-Relational Mapping** (mapeamento objeto-relacional) — camada intermediária entre o Node.js/TypeScript e o PostgreSQL que traduz operações de banco em chamadas de funções JavaScript.

### 4.2 Funções no Projeto

| Função | Descrição |
|--------|-----------|
| **Type-safety** | Erros de consulta são detectados em tempo de desenvolvimento, não em produção. Cada query retorna tipos TypeScript inferidos do schema. |
| **Migrations versionadas** | Cada alteração na estrutura do banco (criar tabela, adicionar coluna, alterar tipo) gera um arquivo de migration rastreável e versionável no Git. |
| **Prevenção de SQL Injection** | Queries parametrizadas por padrão — dados do usuário nunca são concatenados diretamente no SQL. |
| **Integração oficial com Supabase** | Documentação e suporte direto da equipe Prisma para Supabase. |
| **Promises nativas** | Todas as operações retornam Promises — alinha com programação assíncrona (async/await) do Node.js. |

### 4.3 Operações CRUD via Prisma

| Operação | Método Prisma | SQL equivalente |
|----------|--------------|-----------------|
| **Create** | `prisma.entidade.create({ data: {...} })` | `INSERT INTO entidade (...) VALUES (...)` |
| **Read (muitos)** | `prisma.entidade.findMany({ where: {...} })` | `SELECT * FROM entidade WHERE ...` |
| **Read (único)** | `prisma.entidade.findUnique({ where: { id } })` | `SELECT * FROM entidade WHERE id = ...` |
| **Update** | `prisma.entidade.update({ where: { id }, data: {...} })` | `UPDATE entidade SET ... WHERE id = ...` |
| **Delete** | `prisma.entidade.delete({ where: { id } })` | `DELETE FROM entidade WHERE id = ...` |

### 4.4 Configuração do Schema Prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // Supavisor (transaction mode, porta 6543)
  directUrl = env("DIRECT_URL")      // Conexão direta para migrations (porta 5432)
}
```

### 4.5 Relação com Conteúdo da Disciplina

| Conteúdo programático | Como o Prisma se conecta |
|-----------------------|--------------------------|
| Tipos de dados JS (string, number, boolean, Date) | Prisma mapeia tipos do PostgreSQL para tipos TypeScript automaticamente |
| Promises e async/await | Toda operação Prisma retorna uma Promise, exigindo `await` |
| ES Modules | Prisma Client é importado como ES Module (`import { PrismaClient } from '@prisma/client'`) |
| npm e package.json | `prisma` e `@prisma/client` são dependências npm; scripts de migration no `package.json` |

---

## 5. Modelo de Dados — Entidades e Relacionamentos

### 5.1 Entidades Principais (8 — já modeladas no diagrama de classes e ER do `.tex`)

| # | Entidade | Descrição | Campos principais |
|---|----------|-----------|-------------------|
| 1 | **Usuario** | Pessoa cadastrada (aluno, veterano/mentor, coordenador) | id, nome, email institucional, matrícula, tipo (TipoUsuario), dataCadastro, ativo |
| 2 | **PlanoEstudo** | Plano de estudos personalizado | id, titulo, descricao, dataInicio, dataFim, metaSemanal, status (StatusPlano) |
| 3 | **Meta** | Objetivo dentro de um plano | id, descricao, prazo, concluida, prioridade (Prioridade), categoria |
| 4 | **SessaoConcentracao** | Sessão de foco (Pomodoro, mindfulness) | id, tipo (TipoExercicio), duracao, dataRealizacao, pontuacao, concluida |
| 5 | **Mentoria** | Relação de mentoria entre dois usuários | id, mentorId, mentoradoId, dataInicio, status (StatusMentoria), avaliacaoMentor, avaliacaoMentorado |
| 6 | **Recurso** | Material de apoio (artigo, vídeo, podcast) | id, titulo, tipo (TipoRecurso), url, descricao, tags, avaliacao |
| 7 | **AvaliacaoBemEstar** | Questionário periódico de bem-estar | id, dataPreenchimento, nivelEstresse, satisfacaoAcademica, horasSono, respostas |
| 8 | **Badge** | Emblema/conquista da gamificação | id, nome, descricao, icone, pontosNecessarios, categoria (CategoriaBadge) |

### 5.2 Entidades Complementares (6 — identificadas na análise de lacunas, pendentes de modelagem formal)

| # | Entidade | Requisito funcional | Campos necessários |
|---|----------|---------------------|--------------------|
| 9 | **Post** | RF08 — Fórum de Discussão | id, titulo, conteudo, dataPublicacao, autorId, categoria, contagemRespostas |
| 10 | **Comentario** | RF08 — Fórum de Discussão | id, conteudo, dataPublicacao, autorId, postId |
| 11 | **Notificacao** | RF10 — Notificações e Lembretes | id, usuarioDestinatarioId, tipo (TipoNotificacao), titulo, mensagem, status (StatusNotificacao), dataEnvio |
| 12 | **Trilha** | RF07 — Trilhas de Aprendizagem | id, nome, descricao, cursoVinculado, periodo, listaRecursos (ordenada) |
| 13 | **Mensagem** | RF15 — Chat com Suporte | id, remetenteId, destinatarioId, conteudo, dataHoraEnvio, statusLeitura |
| 14 | **PontuacaoUsuario** | RF13 — Gamificação | id, usuarioId, pontosTotais, dataUltimaAtualizacao, historicoPontos |

### 5.3 Relacionamentos Um-para-Muitos (1:N)

| Entidade pai | Entidade filha | Descrição |
|-------------|----------------|-----------|
| Usuario | PlanoEstudo | Um usuário cria vários planos; cada plano pertence a um único usuário |
| PlanoEstudo | Meta | Um plano contém várias metas; cada meta pertence a um único plano |
| Usuario | SessaoConcentracao | Um usuário realiza várias sessões; cada sessão pertence a um único usuário |
| Usuario | AvaliacaoBemEstar | Um usuário preenche várias avaliações; cada avaliação pertence a um único usuário |
| Usuario | Post | Um usuário escreve vários posts; cada post tem um único autor |
| Post | Comentario | Um post recebe vários comentários; cada comentário pertence a um único post |
| Usuario | Comentario | Um usuário escreve vários comentários; cada comentário tem um único autor |
| Usuario | Notificacao | Um usuário recebe várias notificações; cada notificação tem um único destinatário |
| Usuario | PontuacaoUsuario | Um usuário possui um registro de pontuação (1:1 na prática, gerenciado como 1:N para histórico) |

### 5.4 Relacionamentos Muitos-para-Muitos (N:N)

| Entidade A | Entidade B | Tabela de junção necessária | Campos extras na junção |
|-----------|-----------|----------------------------|------------------------|
| Usuario | Mentoria | A própria Mentoria serve como junção (mentorId + mentoradoId) | status, avaliações |
| Usuario | Recurso (favoritar) | UsuarioRecursoFavorito | dataFavorito |
| Meta | Recurso | MetaRecurso | — |
| Usuario | Badge | UsuarioBadge | dataConquista |
| Trilha | Recurso | TrilhaRecurso | ordemNaTrilha |

### 5.5 Tipos Enumerados (Enums)

| Enum | Valores | Campo(s) que utiliza |
|------|---------|---------------------|
| **TipoUsuario** | ALUNO, VETERANO, MENTOR, COORDENADOR, ADMIN | Usuario.tipo |
| **StatusPlano** | RASCUNHO, ATIVO, PAUSADO, CONCLUIDO, CANCELADO | PlanoEstudo.status |
| **Prioridade** | BAIXA, MEDIA, ALTA, URGENTE | Meta.prioridade |
| **TipoExercicio** | POMODORO, MINDFULNESS, RESPIRACAO, LEITURA_FOCADA | SessaoConcentracao.tipo |
| **StatusMentoria** | SOLICITADA, ACEITA, EM_ANDAMENTO, CONCLUIDA, CANCELADA | Mentoria.status |
| **TipoRecurso** | ARTIGO, VIDEO, PODCAST, DOCUMENTO, LINK_EXTERNO | Recurso.tipo |
| **CategoriaBadge** | ESTUDO, CONCENTRACAO, MENTORIA, COMUNIDADE, BEM_ESTAR | Badge.categoria |
| **TipoNotificacao** | PUSH, EMAIL, IN_APP | Notificacao.tipo |
| **StatusNotificacao** | NAO_LIDA, LIDA, ARQUIVADA | Notificacao.status |

### 5.6 Diagrama Resumido de Persistência

```
              ┌──────────────┐
              │   USUARIO    │
              └──────┬───────┘
         ┌───────┬───┼───┬──────────┬───────────┬──────────┐
         ▼       ▼   ▼   ▼          ▼           ▼          ▼
   PlanoEstudo  Sessao  Avaliacao  Mentoria  Notificacao  Pontuacao
       │       Concen.  BemEstar  (N:N via    (1:N)       Usuario
       ▼                          mentor+
     Meta ←──── N:N ────→ Recurso  mentorado)
       │                    ▲
       │                    │── N:N ── Trilha
       └── Recurso (N:N)   │
                            │── N:N ── Usuario (favorito)
                            │
                     Post ← Usuario
                      │
                  Comentario ← Usuario

         ┌────── N:N ──────┐
       Usuario            Badge
         └── UsuarioBadge ─┘
```

---

## 6. Camada de Apresentação — Tecnologias Front-End

### 6.1 HTML5 — Estrutura Semântica

| Aspecto | Aplicação no projeto |
|---------|---------------------|
| **Tags semânticas** | `<header>` (barra superior), `<nav>` (sidebar), `<main>` (conteúdo central), `<section>` (blocos lógicos), `<article>` (posts do fórum), `<footer>` (rodapé), `<aside>` (painel de atividades) |
| **Formulários HTML5** | `<input type="email">` (e-mail @faesa.br), `<input type="password">`, `<input type="date">`, validação nativa (`required`, `pattern`, `placeholder`) |
| **Elementos multimídia** | `<audio>` (sons de concentração), `<video>` (tutoriais onboarding), `<canvas>` (animações respiratórias) |
| **APIs nativas** | Web Storage (localStorage/sessionStorage), Drag and Drop (calendário interativo), Notifications API (push no navegador), Geolocation (sugestões presenciais) |

### 6.2 CSS3 — Estilização e Layout

| Aspecto | Aplicação no projeto |
|---------|---------------------|
| **Layout** | Flexbox (alinhamento de itens em linhas), CSS Grid (dashboard: grid de 2–3 colunas para cards e gráficos) |
| **Responsividade** | Mobile-First (RNF01). Breakpoints: `<640px` (mobile, 1 coluna), `640–1024px` (tablet, 2 colunas), `>1024px` (desktop completo) |
| **Animações** | `transition` (hover em botões/cards), `@keyframes` (exercício respiratório 4-7-8), `transform` (feedback em badges), timer Pomodoro (conic-gradient/SVG) |
| **Tipografia** | Fontes web via Google Fonts, hierarquia com `font-weight`, tamanhos responsivos (`rem`, `em`) |
| **Abstração** | **Tailwind CSS** como framework utilitário — não há CSS puro em arquivos separados. Classes diretamente no JSX (ex: `bg-faesa-azul rounded-lg p-4`) |

### 6.3 JavaScript / TypeScript — Interatividade

| Aspecto | Aplicação no projeto |
|---------|---------------------|
| **Manipulação de DOM** | Atualizar cards em tempo real, mostrar/ocultar sidebar mobile, filtrar listas de recursos, exibir modais |
| **Gerenciamento de estado** | React Hooks (`useState`, `useEffect`, `useContext`), Server Components (Next.js) |
| **Comunicação com servidor** | `fetch()` API nativa + `async/await`, tratamento de erros com `try/catch` |
| **WebSockets** | Socket.io para chat de mentoria, notificações instantâneas, atualizações do fórum |
| **Timer** | `setInterval`/`setTimeout` (Pomodoro), `requestAnimationFrame` (animações respiratórias), `Date` API (calendário) |
| **Validação** | HTML5 nativa + Zod (validação de esquemas TypeScript) |
| **TypeScript** | Todo código JavaScript é escrito em TypeScript (.ts/.tsx) para tipagem estática, autocompletar e detecção de erros em desenvolvimento |

### 6.4 Paleta de Cores Institucional

| Nome | Hexadecimal | Papel na interface |
|------|-------------|-------------------|
| `faesaAzul` | `#003366` | Cor primária — headers, sidebar, botões CTA, ícones de destaque |
| `faesaAzulClaro` | `#0066CC` | Cor secundária — subtítulos, links, cards informativos, hover/focus |
| `faesaVerde` | `#28A745` | Cor de sucesso — metas concluídas, barras de progresso, badges, confirmações |
| `faesaLaranja` | `#FF8C00` | Cor de alerta — atividades pendentes, badges de mentoria, notificações, urgência |
| `faesaCinza` | `#6C757D` | Texto secundário — ícones inativos, subtítulos de rodapé, rótulos de gráfico |
| `faesaBranco` | `#FFFFFF` | Fundo de cards, texto sobre fundos escuros |
| `faesaBG` | `#F5F7FA` | Fundo geral da aplicação |

**Acessibilidade:** A combinação `faesaAzul` (#003366) sobre `faesaBranco` (#FFFFFF) oferece ratio de contraste superior a 10:1 (WCAG 2.1 nível AAA).

### 6.5 Frameworks e Bibliotecas de UI

| Tecnologia | Tipo | Papel |
|-----------|------|-------|
| **Next.js 14+** | Framework React | SSR/SSG, App Router, Server Components, Server Actions |
| **React.js** | Biblioteca de componentes | Árvore de componentes reutilizáveis via JSX |
| **Tailwind CSS** | Framework CSS utilitário | Gera CSS3 otimizado a partir de classes utilitárias; cores FAESA registradas em `tailwind.config.ts` |
| **shadcn/ui** | Biblioteca de componentes UI | Componentes pré-construídos (botões, modais, tabs) com Radix UI + Tailwind, acessíveis (WCAG), copiados para o projeto (customização total) |
| **Zod** | Validação de dados | Esquemas de validação TypeScript-first para formulários e dados de API |

### 6.6 Fluxo de Renderização de uma Página

1. Navegador recebe **HTML** do servidor (via Next.js SSR ou SSG)
2. HTML referencia **CSS** (Tailwind gera CSS utilitário a partir das classes)
3. Navegador monta a árvore DOM e aplica estilos — tela aparece para o usuário
4. Scripts **JavaScript** (React/Next.js) carregam e **hidratam** a página (tornando-a interativa)
5. JavaScript gerencia atualizações dinâmicas sem recarregar a página (SPA behavior)

---

## 7. Camada de API — Tecnologias Back-End

### 7.1 Node.js — Runtime

| Atributo | Descrição |
|----------|-----------|
| **Modelo** | Single-threaded para código JS; I/O não-bloqueante via Event Loop e libuv |
| **Por que** | Mesmo ecossistema JavaScript do frontend, alta performance para I/O (requests ao banco, APIs externas) |
| **Módulos nativos utilizados** | `http` (base dos frameworks), `fs` (leitura de configurações), `path` (caminhos de migrations) |
| **Sistema de módulos** | ES Modules (`import`/`export`) — o projeto não utiliza CommonJS |

### 7.2 Express.js — Framework HTTP

Express.js é a camada de abstração sobre o módulo `http` nativo do Node.js. É o framework utilizado para demonstrar competência nas avaliações da disciplina.

| Conceito Express | Aplicação no projeto |
|-----------------|---------------------|
| **Roteamento declarativo** | `app.get('/planos', handler)`, `app.post('/planos', handler)` |
| **Middleware pipeline** | `express.json()` (parsing de body), autenticação JWT, logging, CORS, validação |
| **Parâmetros de rota** | `/planos/:id` → `req.params.id` |
| **Query strings** | `/planos?status=ativo&page=1` → `req.query.status` |
| **Corpo da requisição** | `req.body` após parsing de JSON |
| **Códigos de status** | 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error) |

### 7.3 NestJS — Framework de Domínio

NestJS é o framework principal do back-end para lógica complexa:

| Aspecto | Descrição |
|---------|-----------|
| **Padrão** | Arquitetura modular — cada módulo encapsula um domínio (PlanoEstudo, Mentoria, Gamificação etc.) |
| **Base** | Usa Express.js internamente por padrão |
| **Uso no projeto** | Reservado para operações que exigem WebSocket, lógica de domínio complexa e jobs agendados |
| **Separação** | Next.js Server Actions para CRUD simples; NestJS para o restante |

### 7.4 Padrão REST — Design de API

A decisão consolidada é **REST puro** (GraphQL descartado). Os endpoints inferidos dos requisitos funcionais:

| Domínio | Rotas base | Verbos HTTP |
|---------|-----------|-------------|
| Auth | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/sso/callback` | POST, GET |
| Planos | `/planos`, `/planos/:id`, `/planos/:id/metas` | GET, POST, PUT, DELETE |
| Sessões | `/sessoes`, `/sessoes/:id/finalizar` | GET, POST, PUT |
| Dashboard | `/dashboard/stats`, `/dashboard/progresso-semanal` | GET |
| Recursos | `/recursos`, `/recursos/:id/favoritar`, `/recursos/:id/avaliar` | GET, POST |
| Trilhas | `/trilhas`, `/trilhas/:cursoId` | GET |
| Fórum | `/forum/posts`, `/forum/posts/:id/comentarios` | GET, POST |
| Mentoria | `/mentorias/solicitar`, `/mentorias/:id/aceitar`, `/mentorias/:id/avaliar` | POST, PUT |
| Notificações | `/notificacoes`, `/notificacoes/:id/lida` | GET, PUT |
| Bem-estar | `/avaliacoes`, `/avaliacoes/historico` | GET, POST |
| Relatórios | `/relatorios/engajamento`, `/relatorios/bem-estar` | GET |
| Gamificação | `/badges`, `/pontuacao/ranking` | GET |

### 7.5 Fluxo requisição → resposta com banco

```
Cliente HTTP → Express Router → Controller → Service → Prisma ORM → PostgreSQL
                                                                       ↓
                                                                    Resultado
                                                                       ↓
Cliente HTTP ← Resposta JSON ← Controller ← Service ← Prisma ORM ← Dados
```

| Camada | Responsabilidade |
|--------|-----------------|
| **Router** | Define rota e verbo HTTP; direciona para o controller |
| **Controller** | Extrai dados de `req` (params, query, body); chama o service; formata e envia `res` |
| **Service** | Lógica de negócio (ex: "aluno só pode ter 5 planos ativos"); chama o ORM |
| **Prisma ORM** | Traduz chamadas em SQL; gerencia conexão; retorna dados tipados |
| **PostgreSQL** | Executa query SQL; garante integridade e ACID |

---

## 8. Autenticação e Segurança

### 8.1 Tecnologias de Autenticação

| Tecnologia | Papel |
|-----------|-------|
| **Supabase Auth** | Provedor principal de autenticação — OAuth 2.0, JWT, Row Level Security (RLS), SSO institucional |
| **NextAuth.js (Auth.js v5)** | Integração com Next.js — gerencia sessões no frontend, callbacks de autenticação |
| **JWT (JSON Web Tokens)** | Formato do token de autenticação — transporta claims do usuário entre cliente e servidor |
| **OAuth 2.0** | Protocolo de autorização — delegar autenticação para provedor externo (FAESA SSO, Google, etc.) |

### 8.2 Row Level Security (RLS)

O Supabase permite definir **políticas de acesso direto nas tabelas** do PostgreSQL. Cada query é filtrada automaticamente com base no `user_id` do JWT:

- Um aluno só visualiza seus próprios planos de estudo.
- Um coordenador visualiza dados agregados de todos os alunos.
- Um mentor acessa apenas as mentorias em que participa.

### 8.3 Requisitos de Segurança (RNF03)

| Medida | Implementação |
|--------|--------------|
| OAuth 2.0 | Supabase Auth + NextAuth.js |
| TLS 1.3 | Forçado pela Vercel em produção (HTTPS obrigatório) |
| Proteção XSS | React sanitiza output por padrão; CSP headers na Vercel |
| Proteção CSRF | Server Actions do Next.js incluem tokens CSRF automáticos |
| LGPD (RNF09) | Conformidade com Lei 13.709/2018 |

---

## 9. Comunicação em Tempo Real

### 9.1 Opções Disponíveis

| Tecnologia | Tipo | Uso planejado |
|-----------|------|---------------|
| **Supabase Realtime** | WebSocket integrado ao PostgreSQL | Notificações automáticas quando dados mudam no banco (alternativa simplificada ao Socket.io) |
| **Socket.io** | Biblioteca WebSocket para Node.js | Chat de mentoria (RF15), notificações push instantâneas, atualizações ao vivo no fórum (RF08) |

### 9.2 Recomendação Consolidada

- **Supabase Realtime** para notificações baseadas em mudanças de dados (ex: novo comentário no fórum dispara notificação automaticamente).
- **Socket.io** reservado para funcionalidades de chat que exigem controle granular (presença online, typing indicators, salas por mentoria).

---

## 10. Infraestrutura de Deploy

### 10.1 Vercel — Plataforma de Deploy

| Atributo | Valor |
|----------|-------|
| **Modelo** | Serverless — funções efêmeras por requisição |
| **Deploy nativo** | Next.js (zero-config) |
| **CI/CD** | Automatizado via integração com GitHub (push → build → deploy) |
| **Preview deployments** | Cada PR gera um ambiente de preview com URL única |
| **HTTPS** | TLS automático em todos os domínios |
| **Analytics** | Vercel Analytics para monitoramento de performance (substitui Grafana no escopo acadêmico) |

### 10.2 Impacto do Modelo Serverless na Arquitetura

| Aspecto | Impacto | Solução adotada |
|---------|---------|-----------------|
| **Conexões com banco** | Cada invocação abre/fecha conexão | Supavisor (connection pooling) |
| **Cold starts** | Primeira invocação após inatividade demora mais | Funções pequenas, Edge Runtime quando possível |
| **Stateless** | Funções não mantêm estado entre invocações | Redis (Upstash) para sessões e cache |
| **Timeout** | Funções serverless têm limite de execução (~10s default) | Operações pesadas delegadas a background jobs |

### 10.3 Docker

Docker está mencionado na stack, porém com escopo **restrito ao desenvolvimento local e testes**. A Vercel não utiliza Docker em produção diretamente. Docker pode ser utilizado para:

- Ambiente de desenvolvimento local padronizado.
- PostgreSQL local para testes sem depender do Supabase.
- Builds reproduzíveis para CI.

---

## 11. Testes e Monitoramento

### 11.1 Ferramentas de Teste

| Ferramenta | Tipo | Escopo |
|-----------|------|--------|
| **Jest** | Testes unitários | Funções de lógica de negócio, serviços, utilitários |
| **Playwright** | Testes E2E (End-to-End) | Fluxos completos no navegador (login, criar plano, completar meta) |

**Nota:** A análise de lacunas identificou redundância entre Cypress e Playwright. A recomendação consolidada é **Playwright sobre Cypress** (mais moderno, mais rápido, suporte multi-browser nativo). Jest permanece para testes unitários.

### 11.2 Monitoramento

| Ferramenta | Tipo | Escopo |
|-----------|------|--------|
| **Sentry** | Error tracking | Captura exceções em produção, stack traces, contexto do usuário |
| **Vercel Analytics** | Performance e uso | Métricas de Core Web Vitals, latência por rota, uso por região |

**Nota:** Grafana foi listado na stack original, mas exige infraestrutura adicional (Prometheus como datasource). Para escopo acadêmico, **Vercel Analytics + Sentry** são suficientes.

---

## 12. Mapa Tecnológico Unificado

A tabela abaixo consolida **todas as tecnologias** do projeto, organizadas por camada e com referência ao requisito ou justificativa que embasa cada escolha.

| Camada | Tecnologia | Tipo/Linguagem | Função no projeto | Requisito/Justificativa |
|--------|-----------|----------------|-------------------|------------------------|
| **Estrutura** | HTML5 | HTML | Marcação semântica, formulários, multimídia, APIs nativas | RNF04 (acessibilidade) |
| **Estilização** | CSS3 via Tailwind CSS | CSS | Cores, layout (Grid/Flexbox), responsividade, animações | RNF01 (mobile-first) |
| **Componentes UI** | shadcn/ui (Radix UI) | HTML + CSS + JS | Componentes visuais acessíveis e customizáveis | RNF04 (WCAG 2.1 AA), RNF07 (usabilidade) |
| **Interatividade** | JavaScript / TypeScript via React + Next.js | JS/TS | DOM dinâmico, estado, comunicação com servidor | Ecossistema unificado |
| **Validação** | HTML5 nativa + Zod | HTML + JS | Validação de formulários e esquemas de dados de API | RNF03 (segurança) |
| **Framework frontend** | Next.js 14+ (App Router) | TypeScript | SSR/SSG, Server Components, Server Actions, BFF | RNF02 (performance ≤3s) |
| **Runtime backend** | Node.js | JavaScript | Servidor assíncrono, Event Loop, I/O não-bloqueante | Performance V8 |
| **Framework API (avaliação)** | Express.js | JavaScript | Rotas REST, middleware, CRUD — requisito da disciplina | Conteúdo programático |
| **Framework API (produção)** | NestJS | TypeScript | Arquitetura modular, WebSocket, lógica de domínio complexa | Escalabilidade |
| **Persistência principal** | PostgreSQL 16+ (Supabase) | SQL | Entidades, relacionamentos, integridade referencial, ACID | Dados estruturados com JOINs |
| **Cache e tempo real** | Redis (Upstash) | Chave-valor | Sessões, cache de dashboard, rate limiting, filas de notificação | Latência (microsegundos) |
| **ORM** | Prisma | TypeScript | Mapeamento objeto-relacional, migrations, type-safety, anti-SQLi | Produtividade + segurança |
| **Autenticação** | Supabase Auth + NextAuth.js (Auth.js v5) | — | OAuth 2.0, JWT, RLS, SSO institucional | RF01, RNF03 |
| **Tempo real (dados)** | Supabase Realtime | WebSocket | Notificações automáticas por mudança de dados no banco | RF10 |
| **Tempo real (chat)** | Socket.io | WebSocket (JS) | Chat de mentoria, presença online, typing indicators | RF15 |
| **Deploy** | Vercel | Serverless | CI/CD, preview deployments, TLS automático | RNF05 (disponibilidade 99,5%) |
| **Containers (dev)** | Docker | — | Ambiente local padronizado, PostgreSQL de teste | Reprodutibilidade |
| **Testes unitários** | Jest | JavaScript | Funções de negócio, serviços, utilitários | RNF08 (cobertura ≥80%) |
| **Testes E2E** | Playwright | JavaScript | Fluxos completos no navegador | RNF08 |
| **Error tracking** | Sentry | — | Captura exceções em produção | RNF05 |
| **Analytics** | Vercel Analytics | — | Core Web Vitals, latência, uso | RNF02 |

---

## 13. Lacunas Consolidadas e Status de Resolução

Esta tabela unifica todas as lacunas identificadas no plano de análise de design (2026-03-08) com o status de resolução atualizado.

### 13.1 Banco de Dados e Modelo de Dados

| # | Lacuna | Prioridade | Status |
|---|--------|-----------|--------|
| L6 | Tabela de junção explícita para N:N Usuario↔Mentoria | Alta | **Resolvido** — Mentoria contém mentorId e mentoradoId diretamente |
| L7 | Falta entidade Post/Comentario (RF08 — Fórum) | Alta | **Identificado** — modelagem descrita no doc de banco, pendente inclusão formal no .tex |
| L8 | Falta entidade Notificacao (RF10) | Alta | **Identificado** — idem |
| L9 | Falta entidade Trilha (RF07) | Alta | **Identificado** — idem |
| L10 | Falta entidade Mensagem (RF15 — Chat) | Alta | **Identificado** — idem |
| L11 | Campo `respostas` em AvaliacaoBemEstar genérico | Média | **Pendente** — decidir entre JSONB (flexível) ou tabela normalizada (consultável) |
| L12 | Falta PontuacaoUsuario para gamificação | Alta | **Identificado** — descrito no doc de banco |
| L13 | Enums sem valores detalhados | Média | **Resolvido** — 9 enums detalhados com valores no doc de banco |
| L14 | Falta campos cursoId/periodoId em Usuario e PlanoEstudo | Média | **Pendente** |

### 13.2 Design de APIs

| # | Lacuna | Prioridade | Status |
|---|--------|-----------|--------|
| L15 | Nenhum endpoint formalmente definido | Alta | **Parcial** — endpoints inferidos e listados nos planos, falta documento OpenAPI formal |
| L16 | Formato de resposta JSON indefinido (envelope, paginação, erros) | Alta | **Pendente** |
| L17 | Versionamento de API indefinido | Média | **Pendente** |
| L18 | Autenticação por endpoint indefinida | Alta | **Pendente** |
| L19 | Eventos WebSocket sem especificação | Média | **Pendente** |

### 13.3 Arquitetura

| # | Lacuna | Prioridade | Status |
|---|--------|-----------|--------|
| L1 | REST vs GraphQL indefinido | Alta | **Resolvido** — REST adotado |
| L2 | Monorepo vs repositórios separados | Média | **Pendente** — recomendação é monorepo com Turborepo |
| L3 | Falta diagrama de sequência para fluxos críticos | Média | **Pendente** |
| L4 | Camada de domínio incompleta (faltam módulos) | Média | **Identificado** |
| L5 | PWA/Service Worker sem definição de estratégia | Baixa | **Pendente** |

### 13.4 Tecnologias

| # | Lacuna | Prioridade | Status |
|---|--------|-----------|--------|
| L26 | Versões de dependências não fixadas | Média | **Pendente** — será resolvido no package.json futuro |
| L27 | Fronteira Next.js vs NestJS indefinida | Alta | **Resolvido** — Next.js para CRUD/SSR; NestJS para WebSocket e domínio complexo |
| L28 | Docker vs Vercel — escopo confuso | Baixa | **Resolvido** — Docker para dev local; Vercel para produção |
| L29 | Redundância de frameworks de teste | Baixa | **Resolvido** — Jest + Playwright (Cypress descartado) |
| L30 | Falta ferramenta de monorepo | Média | **Pendente** |

---

## 14. Glossário de Termos Técnicos

| Termo | Definição |
|-------|-----------|
| **ACID** | Atomicidade, Consistência, Isolamento, Durabilidade — propriedades de transações que garantem integridade dos dados no banco relacional |
| **BFF** | Backend-for-Frontend — padrão onde o servidor renderiza páginas e atua como intermediário entre cliente e APIs |
| **Connection Pooling** | Técnica de reutilizar conexões ao banco de dados em vez de abrir/fechar para cada requisição |
| **CRUD** | Create, Read, Update, Delete — as quatro operações básicas de persistência de dados |
| **DBaaS** | Database as a Service — banco de dados gerenciado em nuvem |
| **Event Loop** | Mecanismo do Node.js que gerencia operações assíncronas em uma única thread |
| **Foreign Key** | Chave estrangeira — campo em uma tabela que referencia a chave primária de outra, garantindo integridade referencial |
| **Hidratação** | Processo pelo qual o React transforma HTML estático (SSR) em componentes interativos no navegador |
| **JWT** | JSON Web Token — formato compacto de token para transmissão segura de claims entre partes |
| **Migration** | Arquivo versionado que descreve uma alteração na estrutura do banco de dados |
| **OAuth 2.0** | Protocolo de autorização que permite delegar autenticação a provedores externos |
| **ORM** | Object-Relational Mapping — camada que traduz operações de objetos em queries SQL |
| **RLS** | Row Level Security — política de segurança do PostgreSQL que filtra linhas por usuário |
| **Serverless** | Modelo de execução onde o provedor gerencia a infraestrutura; funções são efêmeras (executam e encerram) |
| **SPA** | Single Page Application — aplicação web que atualiza a tela sem recarregar a página inteira |
| **SSO** | Single Sign-On — autenticação única que dá acesso a múltiplos sistemas |
| **SSR** | Server-Side Rendering — renderização da página no servidor antes de enviar ao navegador |
| **SSG** | Static Site Generation — geração de HTML estático no momento do build |
| **Supavisor** | Connection pooler nativo do Supabase — gerencia conexões ao PostgreSQL em ambiente serverless |
| **Type-safety** | Garantia de que operações são feitas sobre tipos corretos, detectando erros em compilação |
| **WCAG** | Web Content Accessibility Guidelines — diretrizes de acessibilidade para conteúdo web |
| **WebSocket** | Protocolo de comunicação bidirecional persistente entre cliente e servidor |

---

## Referências Internas

- [site_acolhimento_faesa.tex](../site_acolhimento_faesa.tex) — Documento monográfico principal
- [README.md](../README.md) — Documentação pública do projeto
- [CHANGELOG.md](../CHANGELOG.md) — Histórico de alterações
- [copilot-instructions.md](../.github/copilot-instructions.md) — Instruções operacionais do repositório
- [documento-banco-de-dados-tecnologias.md](documento-banco-de-dados-tecnologias.md) — Modelagem detalhada do banco
- [documento-cores-tecnologias-frontend.md](documento-cores-tecnologias-frontend.md) — Paleta de cores e tecnologias front-end
- [plano-2026-03-08-analise-fase-projeto-design.md](plano-2026-03-08-analise-fase-projeto-design.md) — Análise da fase de design
- [plano-2026-03-11-mapeamento-avaliacoes-praticas.md](plano-2026-03-11-mapeamento-avaliacoes-praticas.md) — Mapeamento de avaliações práticas
