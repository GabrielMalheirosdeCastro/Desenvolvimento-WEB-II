# Banco de Dados do Site de Acolhimento FAESA — Tecnologias e Modelagem

**Data:** 2026-03-08  
**Autor:** Gabriel Malheiros de Castro  
**Disciplina:** D001508 — Desenvolvimento de Aplicações Web II  
**Referência:** Conteúdo Programático da disciplina (Módulos 1–3)

---

## Objetivo deste Documento

Descrever, em formato de lista e sem código, a estrutura do banco de dados do projeto Site de Acolhimento FAESA e justificar as escolhas tecnológicas, conectando cada decisão aos fundamentos do conteúdo programático da disciplina.

---

## 1. Tecnologia de Banco de Dados Escolhida

> **Decisão arquitetural (revisão 2026-04-26):** é utilizado **um único banco de dados**
> — PostgreSQL 17.6 do **Supabase self-hosted** rodando na VPS Hostinger — tanto em
> **produção** (container `acolhimento_faesa` na rede Docker `easypanel`) quanto em
> **desenvolvimento** (estação Windows 11, sem Postgres local, via túnel SSH em
> `localhost:6543` e `localhost:5432`). Não existe instância separada de banco para
> dev. Consulte [`setup-desenvolvimento-windows.md`](setup-desenvolvimento-windows.md) e
> [`ambiente-producao-easypanel.md`](ambiente-producao-easypanel.md) para detalhes
> operacionais.

### 1.1 Banco Principal — PostgreSQL 17.6 (via Supabase self-hosted)

- **Tipo:** Banco de dados relacional (SQL)
- **Modelo de dados:** Tabelas com linhas e colunas, relacionamentos via chaves primárias e estrangeiras
- **Hospedagem:** **Supabase self-hosted** (PostgreSQL 17.6 + Kong + GoTrue + PostgREST + Realtime + Storage + Edge Functions + Supavisor) na **VPS Hostinger Ubuntu 24.04** — a **mesma máquina** que executa o EasyPanel e o contêner da aplicação. Não utiliza Supabase Cloud (DBaaS).
- **Por que relacional e não NoSQL:**
    - O sistema possui entidades com relacionamentos bem definidos (Usuário cria Plano, Plano contém Metas, Usuário participa de Mentoria)
    - Necessidade de integridade referencial (ex: não pode existir uma Meta sem Plano)
    - Consultas complexas com JOINs são frequentes (dashboards, relatórios de coordenação)
    - Suporte nativo a transações ACID — essencial para operações como registro de pontuação e badges simultâneos

### 1.2 Cache — Redis (a definir)

- **Tipo:** Banco de dados em memória, estrutura chave-valor
- **Hospedagem:** **a definir** — opções em avaliação: container Redis na própria VPS
  ou Upstash serverless
- **Finalidade no projeto:**
    - Cache de sessões de usuário autenticado
    - Armazenamento temporário de dados do dashboard (evita consultas repetidas ao PostgreSQL)
    - Rate limiting de requisições à API
    - Filas de notificações push em tempo real

### 1.3 ORM — Prisma

- **Tipo:** Object-Relational Mapping (mapeamento objeto-relacional)
- **Finalidade:** Camada intermediária entre o Node.js e o PostgreSQL
- **Por que usar um ORM:**
    - Traduz operações de banco em chamadas de funções JavaScript/TypeScript
    - Garante segurança de tipos (type-safety) com TypeScript
    - Gerencia migrations (alterações estruturais no banco) de forma versionada
    - Previne SQL Injection por padrão

---

## 2. Conexão com o Conteúdo Programático

A escolha e a operação dessas tecnologias dependem diretamente dos três módulos da disciplina.

### 2.1 Fundamentos de JavaScript → Modelagem e Manipulação de Dados

| Tópico do Conteúdo | Relação com o Banco de Dados |
|---------------------|------------------------------|
| **Tipos de dados (primitivos e objetos)** | Cada coluna no banco possui um tipo equivalente em JavaScript — `String` para nomes, `Number` para pontuações, `Boolean` para status, `Date` para timestamps. O Prisma mapeia tipos do PostgreSQL para tipos JS/TS automaticamente. |
| **Variáveis: var, let, const** | Os resultados das consultas ao banco são armazenados em variáveis. `const` é o padrão para dados retornados (imutáveis após recebidos); `let` para dados que serão transformados antes de enviar ao cliente. |
| **Funções (declaração, arrow functions, closures)** | As operações de banco são encapsuladas em funções — cada endpoint da API contém uma função que executa a consulta e retorna o resultado. Arrow functions são usadas em callbacks de tratamento de dados. |
| **Manipulação de arrays: map, filter, reduce, forEach, find** | Os resultados do banco chegam como arrays de objetos. `map` transforma cada registro para o formato da resposta da API; `filter` aplica regras de negócio sobre os resultados; `reduce` agrega dados para dashboards (somar horas de estudo, contar metas concluídas); `find` localiza um registro específico. |
| **Objetos e desestruturação** | Cada registro do banco é um objeto JavaScript. A desestruturação extrai campos específicos (ex: extrair apenas `nome` e `email` de um objeto Usuário para a resposta da API, omitindo `senha`). |
| **Spread/rest operator** | O spread operator combina dados de múltiplas consultas em um único objeto de resposta (ex: dados do usuário + estatísticas do dashboard). O rest operator captura campos opcionais em filtros de busca. |
| **Template literals** | Utilizados na construção de mensagens dinâmicas relacionadas ao banco — mensagens de erro, logs de operação, notificações personalizadas com dados do usuário. |

### 2.2 Programação Assíncrona → Operações de Banco de Dados

| Tópico do Conteúdo | Relação com o Banco de Dados |
|---------------------|------------------------------|
| **Event Loop e modelo single-threaded** | Node.js é single-threaded. Cada consulta ao banco de dados é uma operação de I/O que **não bloqueia** a thread principal — o Event Loop delega a operação ao sistema operacional e continua processando outras requisições. Sem esse modelo, uma consulta lenta travaria o servidor inteiro. |
| **Callbacks e callback hell** | Historicamente, cada operação de banco recebia um callback para tratar o resultado. Encadear múltiplas consultas dependentes (buscar usuário → buscar planos do usuário → buscar metas de cada plano) gerava callback hell — aninhamento ilegível de funções. |
| **Promises** | O Prisma e o cliente Supabase retornam Promises para todas as operações. Uma consulta ao banco retorna uma Promise que resolve com os dados ou rejeita com um erro. O encadeamento com `.then()` e `.catch()` substitui callbacks aninhados. |
| **async/await** | Sintaxe padrão para operações de banco no projeto. Cada função que acessa o banco é declarada como `async` e cada chamada ao Prisma usa `await`. Isso garante que o resultado da consulta esteja disponível antes de prosseguir, mantendo o código legível e linear. |

### 2.3 Node.js e Ecossistema → Infraestrutura do Banco de Dados

| Tópico do Conteúdo | Relação com o Banco de Dados |
|---------------------|------------------------------|
| **Instalação e configuração do ambiente** | O Node.js é pré-requisito para executar o Prisma CLI (ferramenta de linha de comando que gerencia o banco) e o servidor da aplicação que se conecta ao PostgreSQL. |
| **Módulos nativos (fs, path, http, os)** | O módulo `fs` é relevante para ler arquivos de configuração do banco (variáveis de ambiente); `path` resolve caminhos de arquivos de migration; `http` é a base sobre a qual frameworks como Express e NestJS constroem o servidor que recebe requisições e consulta o banco. |
| **CommonJS vs ES Modules** | O Prisma gera seu client como módulo ES (`import { PrismaClient } from '@prisma/client'`). O projeto deve usar ES Modules consistentemente para compatibilidade com o ecossistema moderno (Next.js, NestJS). |
| **npm: package.json, instalação de pacotes, scripts** | O Prisma, o cliente Supabase e o driver do Redis (ioredis/upstash-redis) são pacotes npm instalados via `package.json`. Scripts npm automatizam operações de banco: migration, seed (popular dados iniciais), reset. |
| **Servidor HTTP básico** | O servidor Node.js recebe requisições HTTP do frontend e, para cada rota, executa a operação correspondente no banco de dados via Prisma. O ciclo completo é: requisição HTTP → função do servidor → consulta ao banco → resposta HTTP com dados. |

---

## 3. Entidades do Banco de Dados (Lista Completa)

### 3.1 Entidades Já Definidas no Documento Monográfico

1. **Usuario**
    - Representa cada pessoa cadastrada na plataforma (aluno, veterano/mentor, coordenador)
    - Campos principais: identificador, nome, e-mail institucional, matrícula, tipo de usuário, data de cadastro, status ativo/inativo
    - É a entidade central — quase todas as outras se relacionam com ela

2. **PlanoEstudo**
    - Plano de estudos personalizado criado por um usuário
    - Campos principais: identificador, título, descrição, data início, data fim, meta semanal de horas, status do plano
    - Um usuário pode ter vários planos; cada plano pertence a um único usuário

3. **Meta**
    - Objetivo específico dentro de um plano de estudos
    - Campos principais: identificador, descrição, prazo, status de conclusão, prioridade, categoria
    - Cada meta pertence a um plano; um plano contém várias metas

4. **SessaoConcentracao**
    - Registro de uma sessão de foco/concentração realizada pelo usuário (Pomodoro, mindfulness)
    - Campos principais: identificador, tipo de exercício, duração em minutos, data e hora de realização, pontuação obtida, status de conclusão
    - Um usuário realiza várias sessões; cada sessão pertence a um único usuário

5. **Mentoria**
    - Registro de relação de mentoria entre dois usuários (mentor e mentorado)
    - Campos principais: identificador, referência ao mentor, referência ao mentorado, data de início, status da mentoria, avaliação do mentor, avaliação do mentorado
    - Relação N:N — um usuário pode ser mentor de vários e mentorado de vários

6. **Recurso**
    - Material de apoio disponível na biblioteca da plataforma (artigo, vídeo, podcast, documento)
    - Campos principais: identificador, título, tipo de recurso, URL, descrição, tags, avaliação média
    - Pode ser favoritado por vários usuários; pode estar associado a várias metas

7. **AvaliacaoBemEstar**
    - Questionário periódico de bem-estar preenchido pelo usuário
    - Campos principais: identificador, data de preenchimento, nível de estresse, satisfação acadêmica, horas de sono, respostas adicionais
    - Um usuário preenche várias avaliações ao longo do tempo

8. **Badge**
    - Emblema/conquista da gamificação
    - Campos principais: identificador, nome, descrição, ícone, pontos necessários para desbloquear, categoria
    - Um usuário pode conquistar vários badges

### 3.2 Entidades Faltantes (Identificadas na Análise de Lacunas)

As entidades abaixo são necessárias para cobrir requisitos funcionais que ainda não possuem modelagem de dados:

9. **Post** (RF08 — Fórum de Discussão)
    - Publicação feita por um usuário no fórum
    - Campos necessários: identificador, título, conteúdo, data de publicação, referência ao autor, categoria/tag, contagem de respostas

10. **Comentario** (RF08 — Fórum de Discussão)
    - Resposta a um post do fórum
    - Campos necessários: identificador, conteúdo, data de publicação, referência ao autor, referência ao post

11. **Notificacao** (RF10 — Notificações e Lembretes)
    - Registro de notificação enviada ou pendente para um usuário
    - Campos necessários: identificador, referência ao usuário destinatário, tipo de notificação (push, e-mail, in-app), título, mensagem, status (lida/não lida), data de envio

12. **Trilha** (RF07 — Trilhas de Aprendizagem)
    - Sequência estruturada de recursos e atividades por curso/período
    - Campos necessários: identificador, nome, descrição, curso vinculado, período, lista ordenada de recursos

13. **Mensagem** (RF15 — Chat com Suporte)
    - Mensagem individual dentro de uma conversa de chat
    - Campos necessários: identificador, referência ao remetente, referência ao destinatário ou sala, conteúdo, data/hora de envio, status de leitura

14. **PontuacaoUsuario** (RF13 — Gamificação)
    - Registro do score acumulado de gamificação de cada usuário
    - Campos necessários: identificador, referência ao usuário, pontos totais, data da última atualização, histórico de pontos por ação

---

## 4. Relacionamentos entre Entidades

### 4.1 Relações Um-para-Muitos (1:N)

- **Usuario → PlanoEstudo:** Um usuário cria vários planos de estudo; cada plano pertence a um único usuário
- **PlanoEstudo → Meta:** Um plano contém várias metas; cada meta pertence a um único plano
- **Usuario → SessaoConcentracao:** Um usuário realiza várias sessões de concentração; cada sessão pertence a um único usuário
- **Usuario → AvaliacaoBemEstar:** Um usuário preenche várias avaliações ao longo do tempo; cada avaliação pertence a um único usuário
- **Usuario → Post:** Um usuário escreve vários posts no fórum; cada post tem um único autor
- **Post → Comentario:** Um post recebe vários comentários; cada comentário pertence a um único post
- **Usuario → Comentario:** Um usuário escreve vários comentários; cada comentário tem um único autor
- **Usuario → Notificacao:** Um usuário recebe várias notificações; cada notificação é destinada a um único usuário
- **Usuario → PontuacaoUsuario:** Um usuário possui um único registro de pontuação (1:1 na prática, mas gerenciado como 1:N para histórico)

### 4.2 Relações Muitos-para-Muitos (N:N)

- **Usuario ↔ Mentoria:** Um usuário pode ser mentor em várias mentorias e mentorado em outras; cada mentoria envolve exatamente dois usuários (um como mentor, outro como mentorado) — neste caso a própria tabela `Mentoria` serve como tabela de junção com campos extras (avaliações, status)
- **Usuario ↔ Recurso (favoritar):** Um usuário pode favoritar vários recursos; um recurso pode ser favoritado por vários usuários — necessita tabela de junção intermediária
- **Meta ↔ Recurso:** Uma meta pode ter vários recursos associados; um recurso pode estar vinculado a várias metas — necessita tabela de junção intermediária
- **Usuario ↔ Badge:** Um usuário conquista vários badges; um badge pode ser conquistado por vários usuários — necessita tabela de junção intermediária com data de conquista
- **Trilha ↔ Recurso:** Uma trilha contém vários recursos ordenados; um recurso pode pertencer a várias trilhas — necessita tabela de junção intermediária com campo de ordenação

---

## 5. Enums (Tipos Enumerados Necessários)

São valores fixos e pré-definidos que restringem o que pode ser armazenado em determinados campos:

1. **TipoUsuario** — Define o papel do usuário na plataforma
    - ALUNO, VETERANO, MENTOR, COORDENADOR, ADMIN

2. **StatusPlano** — Estado atual de um plano de estudos
    - RASCUNHO, ATIVO, PAUSADO, CONCLUIDO, CANCELADO

3. **Prioridade** — Nível de prioridade de uma meta
    - BAIXA, MEDIA, ALTA, URGENTE

4. **TipoExercicio** — Modalidade de sessão de concentração
    - POMODORO, MINDFULNESS, RESPIRACAO, LEITURA_FOCADA

5. **StatusMentoria** — Estado atual de uma relação de mentoria
    - SOLICITADA, ACEITA, EM_ANDAMENTO, CONCLUIDA, CANCELADA

6. **TipoRecurso** — Formato do material de apoio
    - ARTIGO, VIDEO, PODCAST, DOCUMENTO, LINK_EXTERNO

7. **CategoriaBadge** — Área da gamificação à qual o badge pertence
    - ESTUDO, CONCENTRACAO, MENTORIA, COMUNIDADE, BEM_ESTAR

8. **TipoNotificacao** — Canal de entrega da notificação
    - PUSH, EMAIL, IN_APP

9. **StatusNotificacao** — Estado de leitura da notificação
    - NAO_LIDA, LIDA, ARQUIVADA

---

## 6. Resumo das Tecnologias por Camada

| Camada | Tecnologia | Tipo | Papel no Projeto |
|--------|-----------|------|------------------|
| **Persistência principal** | PostgreSQL 17.6 (Supabase self-hosted na VPS) | Banco relacional SQL | Armazena todas as entidades, relacionamentos e dados permanentes — mesma instância em dev e produção |
| **Cache e tempo real** | Redis (a definir) | Banco chave-valor em memória | Sessões de autenticação, cache de dashboard, rate limiting, filas de notificação |
| **Mapeamento objeto-relacional** | Prisma | ORM para Node.js/TypeScript | Traduz operações JS em queries SQL, gerencia migrations, garante type-safety |
| **Autenticação no banco** | Supabase Auth | Serviço de autenticação integrado | OAuth 2.0, JWT, Row Level Security (RLS) — políticas de acesso direto nas tabelas |
| **Tempo real no banco** | Supabase Realtime | WebSocket integrado ao PostgreSQL | Notificações em tempo real quando dados mudam no banco (alternativa ao Socket.io) |
| **Hospedagem do banco** | **Supabase self-hosted** na VPS Hostinger | Stack Docker própria | PostgreSQL 17.6 + Supavisor (pooling) + Kong + GoTrue + Storage; **mesma VPS** que executa o EasyPanel e o contêner da aplicação |
| **Deploy da aplicação** | EasyPanel (Docker Swarm + Traefik) na mesma VPS | PaaS auto-hospedada | Build a partir de `Dockerfile`, TLS Let's Encrypt automático, conexão ao Postgres via DNS interno Docker (`supabase-pooler:6543`) |

---

## 7. Decisões Técnicas Relevantes

### 7.1 Por que Supabase self-hosted e não PostgreSQL puro?

- O projeto está deployed em uma VPS Hostinger própria (não serverless), com EasyPanel orquestrando containers Docker
- Supabase self-hosted entrega, em uma única stack, o conjunto que seria necessário montar manualmente: Postgres 17.6, Supavisor (pooler), GoTrue (auth), PostgREST (REST automático do schema), Realtime, Storage e Edge Functions
- O **Supavisor** (porta 6543, transaction mode) protege o Postgres contra exaustão de conexões, mesmo em picos vindos do contêner da aplicação
- O banco roda na **mesma VPS** que a aplicação e que a estação de desenvolvimento acessa via túnel SSH — elimina latência de rede WAN e custos de DBaaS
- Banco único para dev e prod garante paridade absoluta de dados, extensões e schema, eliminando classe inteira de bugs do tipo "funciona local mas quebra em produção"

### 7.2 Por que Redis em separado?

- PostgreSQL não é eficiente para dados efêmeros de alta frequência (sessões de autenticação, cache de consultas repetidas)
- Redis opera em memória — latência de microsegundos contra milissegundos do PostgreSQL
- Hospedagem ainda em avaliação: container Redis na própria VPS (sem custo adicional, mesma rede Docker) *vs.* Upstash serverless (zero operação, pay-per-request)

### 7.3 Por que Prisma como ORM?

- Type-safety com TypeScript — erros de consulta são detectados em tempo de desenvolvimento, não em produção
- Migrations versionadas — cada alteração na estrutura do banco gera um arquivo de migration rastreável
- Integração oficial com Supabase — documentação e suporte direto da equipe Prisma
- Todas as operações do Prisma retornam Promises — alinha diretamente com o conteúdo de Programação Assíncrona (Módulo 2)

### 7.4 Duas URLs de conexão ao mesmo banco (Prisma)

- O Prisma utiliza duas URLs apontando para o **mesmo PostgreSQL** da VPS:
    - **DATABASE_URL** — conexão via Supavisor (porta 6543, transaction mode) — usada pela aplicação em runtime (em produção resolve `supabase-pooler:6543`; em dev resolve `localhost:6543` via túnel SSH)
    - **DIRECT_URL** — conexão direta ao PostgreSQL (porta 5432) — usada exclusivamente para executar migrations (`supabase-db:5432` em prod, `localhost:5432` em dev)
- Motivo: o Supavisor em transaction mode não suporta prepared statements, que o Prisma utiliza internamente nas migrations
- O único fator que muda entre dev e prod é **o host** (`localhost` vs nome de serviço Docker); credenciais, schema e dados são idênticos pois trata-se da mesma instância física

---

## 8. Checklist de Completude do Banco de Dados

| # | Item | Status |
|---|------|--------|
| 1 | Tecnologia principal definida (PostgreSQL 17.6 / Supabase self-hosted, mesma instância em dev e prod) | Definido |
| 2 | Cache definido (Redis — hospedagem em avaliação: container na VPS *vs.* Upstash) | Parcial |
| 3 | ORM definido (Prisma) | Definido |
| 4 | 8 entidades principais modeladas (diagrama de classes + ER) | Definido |
| 5 | 6 entidades complementares identificadas (Post, Comentario, Notificacao, Trilha, Mensagem, PontuacaoUsuario) | Identificado — pendente modelagem formal |
| 6 | Relacionamentos 1:N mapeados | Definido |
| 7 | Relacionamentos N:N mapeados com tabelas de junção | Parcial — necessita tabelas intermediárias explícitas |
| 8 | Enums detalhados com valores | Identificado — pendente inclusão no documento monográfico |
| 9 | Campos de contexto acadêmico (curso, período) em Usuario e PlanoEstudo | Pendente |
| 10 | Definição do campo `respostas` em AvaliacaoBemEstar (JSONB vs normalizado) | Pendente |
