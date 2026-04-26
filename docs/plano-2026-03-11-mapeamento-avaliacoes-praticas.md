# Plano de Ação — Mapeamento das Avaliações Práticas da Disciplina ao Projeto

**Data:** 2026-03-11  
**Solicitado por:** Gabriel Malheiros de Castro  
**Contexto:** A disciplina D001508 — Desenvolvimento de Aplicações Web II possui critérios avaliativos que envolvem entregas práticas e provas. Este documento mapeia cada critério de avaliação ao contexto do projeto Site de Acolhimento FAESA, identificando o que precisa ser estudado, o que já está definido na documentação monográfica e quais decisões técnicas impactam cada avaliação.

> **Aviso de supersessão (2026-04-26):** este plano cita **Vercel + Upstash** como
> infraestrutura prevista. A decisão final foi **EasyPanel + Supabase self-hosted
> (PostgreSQL 17.6) na mesma VPS Hostinger**, com o **mesmo banco** servindo dev (via
> túnel SSH) e produção. Estado vigente em `README.md`,
> [`ambiente-producao-easypanel.md`](ambiente-producao-easypanel.md) e
> [`setup-desenvolvimento-windows.md`](setup-desenvolvimento-windows.md).

---

## Objetivo

Organizar, sem produzir código, um mapeamento completo entre os critérios avaliativos da disciplina e o projeto, para que o aluno saiba exatamente quais conceitos dominar, quais decisões técnicas já foram tomadas e quais lacunas precisa preencher antes de cada avaliação.

---

## Parte A — Avaliações do Eixo de Fundamentos (JavaScript e Node.js)

Este eixo cobre os Módulos 1 e 2 do conteúdo programático: fundamentos de JavaScript, programação assíncrona e primeiros passos com Node.js.

---

### A1. Listas de Exercícios de JavaScript e Node.js Entregues via GitHub

#### O que se espera nesta avaliação

- Resolução de exercícios práticos de JavaScript (ES6+) e Node.js, versionados e entregues como commits no GitHub.
- Demonstração de fluência com o fluxo Git: criação de repositório, commits atômicos seguindo padrão (Conventional Commits no caso deste projeto), push para remoto.
- Cada exercício deve refletir domínio progressivo dos conceitos dos Módulos 1 e 2.

#### Conceitos que devem ser dominados

| # | Conceito | Relevância para o projeto |
|---|----------|--------------------------|
| 1 | **Tipos de dados primitivos e objetos** | Cada entidade do banco (Usuario, PlanoEstudo, Meta, etc.) será representada como objeto JavaScript/TypeScript com tipos distintos (string para nomes, number para pontuações, boolean para status, Date para timestamps). |
| 2 | **Variáveis: var, let, const** | `const` como padrão para dados recebidos do banco (imutáveis após o retorno); `let` para transformações intermediárias; `var` deve ser evitado no projeto (escopo de função, não de bloco). |
| 3 | **Funções: declaração, arrow functions, closures** | Cada endpoint da API encapsula lógica em funções. Arrow functions são usadas em callbacks de manipulação de dados. Closures aparecem em middlewares que capturam configurações (ex: middleware de autenticação que carrega a chave JWT do escopo externo). |
| 4 | **Manipulação de arrays: map, filter, reduce, forEach, find** | Resultados de consultas ao banco chegam como arrays de objetos. `map` para transformar registros no formato da resposta; `filter` para aplicar regras de negócio; `reduce` para agregar dados de dashboard; `find` para localizar registro específico. |
| 5 | **Objetos e desestruturação** | Extrair campos específicos de registros do banco (ex: `{ nome, email }` de um objeto Usuário, omitindo `senha` na resposta da API). |
| 6 | **Spread/rest operator** | Spread para combinar dados de múltiplas consultas em uma resposta única; rest para capturar parâmetros opcionais de filtros de busca. |
| 7 | **Template literals** | Construção de mensagens dinâmicas: logs de operação, mensagens de erro formatadas, notificações personalizadas com dados do usuário. |
| 8 | **Promises e async/await** | Todas as operações com Prisma (ORM) retornam Promises. Funções que acessam o banco são `async`; cada chamada ao Prisma usa `await`. |
| 9 | **Event Loop e modelo single-threaded** | Consultas ao banco são operações de I/O não-bloqueantes. O Event Loop delega a operação ao sistema operacional e continua processando outras requisições. |
| 10 | **Módulos: CommonJS vs ES Modules** | O projeto utiliza ES Modules (`import/export`) por compatibilidade com Next.js, NestJS e o Prisma Client. |

#### Conexão com o repositório GitHub do projeto

- O repositório `GabrielMalheirosdeCastro/Desenvolvimento-WEB-II` (branch `master`) já segue Conventional Commits.
- Os exercícios devem ser commitados em branches ou pastas específicas, seguindo o mesmo padrão de mensagens de commit definido na Seção 9 do `copilot-instructions.md`.
- Cada lista de exercícios representa uma oportunidade de praticar conceitos que serão usados diretamente na implementação das operações de banco e lógica de negócio do Site de Acolhimento.

---

### A2. Servidor HTTP Básico em Node.js com Rotas Estáticas

#### O que se espera nesta avaliação

- Criar um servidor HTTP usando **exclusivamente o módulo nativo `http` do Node.js** (sem Express, sem frameworks).
- Implementar rotas estáticas que respondam a diferentes URLs com conteúdos distintos.
- Demonstrar compreensão do ciclo requisição-resposta HTTP no nível mais fundamental.

#### Conceitos que devem ser dominados

| # | Conceito | Descrição aplicada |
|---|----------|--------------------|
| 1 | **Módulo `http` nativo** | `http.createServer()` cria o servidor; o callback recebe `req` (requisição) e `res` (resposta). É a base sobre a qual Express e NestJS são construídos. |
| 2 | **Objeto `req` (IncomingMessage)** | Contém `req.url` (a rota solicitada), `req.method` (GET, POST, etc.), `req.headers` (cabeçalhos HTTP). A leitura desses campos determina como o servidor processa cada requisição. |
| 3 | **Objeto `res` (ServerResponse)** | Métodos essenciais: `res.writeHead(statusCode, headers)` define código de status e cabeçalhos; `res.write(body)` escreve o corpo da resposta; `res.end()` finaliza e envia a resposta. |
| 4 | **Roteamento manual** | Sem framework, o roteamento é feito via condicionais (`if/else` ou `switch`) sobre `req.url` e `req.method`. Cada combinação URL+método mapeia para uma lógica específica. |
| 5 | **Códigos de status HTTP** | `200` (sucesso), `201` (criado), `404` (não encontrado), `500` (erro interno). O servidor deve retornar o código correto para cada situação. |
| 6 | **Content-Type** | Define o formato da resposta: `text/html` para páginas, `application/json` para dados, `text/plain` para texto simples. Deve ser definido no `writeHead`. |
| 7 | **Porta e `listen()`** | O servidor escuta em uma porta específica (`server.listen(porta, callback)`). Em produção, a porta geralmente vem de variável de ambiente (`process.env.PORT`). |

#### Como isso se conecta à arquitetura do projeto

O servidor HTTP básico é o **fundamento** sobre o qual o projeto será construído. Na arquitetura do Site de Acolhimento FAESA:

- **Express.js** (ou NestJS, que usa Express internamente por padrão) abstrai o módulo `http`, adicionando sistema de middleware, roteamento declarativo e parsing de corpo automatizado.
- O ciclo `req → processamento → res` é idêntico em todos os níveis de abstração. A diferença é que, com `http` puro, o desenvolvedor é responsável por parsing de URL, parsing de JSON do corpo, tratamento de erros e roteamento manual.
- Entender o servidor básico é pré-requisito para compreender o que frameworks como Express automatizam — e por que certos conceitos (middleware, next(), parsing de body) existem.

#### Rotas que um servidor básico deve demonstrar (exemplos conceituais)

| Método | Rota | Resposta esperada |
|--------|------|-------------------|
| GET | `/` | Página inicial (HTML ou JSON de boas-vindas) |
| GET | `/sobre` | Informações sobre o servidor/aplicação |
| GET | `/status` | Status do servidor (uptime, versão) — resposta JSON |
| GET | `/qualquer-outra` | Resposta 404 — rota não encontrada |

> Não há código neste documento. O objetivo é mapear os conceitos; a implementação será feita no momento apropriado.

---

### A3. Prova Prática de Programação JavaScript + Questões Conceituais

#### O que se espera nesta avaliação

- Prova com duas dimensões: resolução prática de problemas em JavaScript **e** respostas a questões teóricas/conceituais sobre os fundamentos da linguagem e do Node.js.
- A parte prática exige escrever código funcional sob pressão de tempo.
- A parte conceitual exige explicação formal de mecanismos internos.

#### Tópicos práticos prováveis e preparação

| # | Tópico prático | O que estudar |
|---|----------------|---------------|
| 1 | Manipulação de arrays com métodos de alta ordem | Dado um array de objetos, usar `map`, `filter`, `reduce`, `find`, `some`, `every` para extrair, transformar ou agregar dados. |
| 2 | Desestruturação e spread/rest | Extrair propriedades de objetos aninhados; combinar objetos; capturar parâmetros variáveis. |
| 3 | Funções assíncronas | Encadear operações assíncronas com `async/await`; tratar erros com `try/catch`; executar operações em paralelo com `Promise.all()`. |
| 4 | Criação de módulos | Exportar e importar funções entre arquivos usando ES Modules (`export/import`). |
| 5 | Leitura/escrita de arquivos | Usar `fs.promises.readFile()` e `fs.promises.writeFile()` de forma assíncrona para manipular dados persistidos em JSON. |

#### Tópicos conceituais prováveis e preparação

| # | Tópico conceitual | Pontos-chave para resposta formal |
|---|--------------------|------------------------------------|
| 1 | **Event Loop** | Node.js é single-threaded para código JS. O Event Loop possui fases (timers, I/O callbacks, idle/prepare, poll, check, close). Operações de I/O (banco, arquivo, rede) são delegadas ao sistema operacional via libuv; quando concluídas, o callback é colocado na fila para execução na próxima iteração do loop. |
| 2 | **Diferença entre var, let, const** | `var`: escopo de função, sofre hoisting (inicializado como `undefined`). `let`: escopo de bloco, hoisting sem inicialização (Temporal Dead Zone). `const`: escopo de bloco, não permite reatribuição (mas objetos/arrays referenciados podem ser mutados internamente). |
| 3 | **Callback hell e como Promises resolvem** | Callbacks aninhados geram código ilegível e difícil de depurar (pyramid of doom). Promises linearizam o encadeamento com `.then()/.catch()`. `async/await` é açúcar sintático sobre Promises que torna o código assíncrono visualmente similar ao síncrono. |
| 4 | **CommonJS vs ES Modules** | CommonJS: `require()`/`module.exports`, síncrono, padrão original do Node.js. ES Modules: `import`/`export`, assíncrono, padrão do ECMAScript, suportado nativamente em Node.js com `"type": "module"` no `package.json` ou extensão `.mjs`. |
| 5 | **O que é o npm e para que serve o package.json** | npm é o gerenciador de pacotes do Node.js. `package.json` declara metadados do projeto, dependências (`dependencies` para produção, `devDependencies` para desenvolvimento), scripts de automação (`scripts`), versão do projeto, e ponto de entrada (`main`). |
| 6 | **Modelo single-threaded vs multi-threaded** | Node.js usa uma thread principal para executar JS, mas operações de I/O são multi-threaded internamente (libuv thread pool com 4 threads por padrão). Isso permite alta concorrência sem a complexidade de gerenciar threads manualmente. A limitação é que operações CPU-bound bloqueiam a thread principal. |

#### Onde esses conceitos aparecem no projeto

Cada conceito acima mapeia para uma operação real no Site de Acolhimento FAESA:

- **Event Loop / async/await** → Toda consulta Prisma ao PostgreSQL é operação de I/O processada pelo Event Loop.
- **Módulos ES** → Prisma Client, rotas da API, middleware de autenticação são módulos importados/exportados.
- **npm / package.json** → Dependências do projeto: `prisma`, `@prisma/client`, `next`, `express` (ou `@nestjs/core`), `ioredis`.
- **Manipulação de arrays** → Transformar resultados de queries (lista de metas de um plano, ranking de gamificação, histórico de bem-estar) para o formato JSON da resposta da API.

---

## Parte B — Avaliações do Eixo de APIs REST (Express.js e Persistência)

Este eixo cobre o Módulo 3 do conteúdo programático: construção de APIs com Express.js, padrão REST, operações CRUD e integração com banco de dados.

---

### B1. Construção de APIs REST com Express.js e Operações CRUD

#### O que se espera nesta avaliação

- Construir uma API REST utilizando **Express.js** que implemente operações CRUD (Create, Read, Update, Delete) sobre pelo menos uma entidade.
- Demonstrar domínio do padrão REST: verbos HTTP corretos, rotas semânticas, códigos de status adequados.
- Estruturar a aplicação com separação de responsabilidades (rotas, controllers, middleware).

#### Conceitos que devem ser dominados

| # | Conceito | Descrição aplicada ao projeto |
|---|----------|-------------------------------|
| 1 | **Express.js como framework** | Camada de abstração sobre o módulo `http` nativo. Fornece: sistema de rotas declarativo (`app.get()`, `app.post()`, etc.), middleware pipeline, parsing automático de JSON, tratamento de erros centralizado. |
| 2 | **Padrão REST (Representational State Transfer)** | Cada recurso (entidade) do sistema possui uma URL base. Operações sobre o recurso são expressas pelos verbos HTTP: GET (ler), POST (criar), PUT/PATCH (atualizar), DELETE (remover). Respostas incluem código de status HTTP e corpo JSON. |
| 3 | **Operações CRUD mapeadas a HTTP** | POST → Create (inserir novo registro no banco); GET → Read (buscar um ou vários registros); PUT → Update completo / PATCH → Update parcial; DELETE → Remove o registro. |
| 4 | **Middleware** | Funções que interceptam a requisição antes de chegar ao handler final. Executadas em ordem de registro. Usos: parsing de body (`express.json()`), autenticação (verificar JWT), logging, CORS, validação de dados, tratamento de erros. |
| 5 | **Parâmetros de rota e query** | Parâmetros de rota (`/planos/:id`) identificam um recurso específico — acessados via `req.params.id`. Query strings (`/planos?status=ativo&page=1`) filtram e paginam resultados — acessadas via `req.query`. |
| 6 | **Corpo da requisição (request body)** | Dados enviados pelo cliente em POST/PUT/PATCH, acessados via `req.body` após o middleware `express.json()` fazer o parsing do JSON. |
| 7 | **Códigos de status HTTP** | `200` OK, `201` Created, `204` No Content (delete sem corpo), `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `422` Unprocessable Entity, `500` Internal Server Error. |
| 8 | **Separação de responsabilidades** | Rotas definem os caminhos e verbos; controllers contêm a lógica de negócio; services encapsulam operações de banco; middleware trata concerns transversais (auth, logging, errors). |

#### Mapeamento CRUD para entidades do projeto

As entidades do Site de Acolhimento FAESA mapeiam naturalmente para operações CRUD via REST:

| Entidade | POST (Create) | GET (Read) | PUT/PATCH (Update) | DELETE |
|----------|---------------|-----------|---------------------|--------|
| **Usuario** | Cadastro de novo usuário | Buscar perfil, listar usuários (coordenador) | Atualizar dados do perfil | Desativar conta (soft delete — manter dados, alterar status) |
| **PlanoEstudo** | Criar novo plano de estudos | Listar planos do usuário, buscar plano por ID | Alterar título, datas, meta semanal, status | Excluir plano (e metas associadas) |
| **Meta** | Adicionar meta a um plano | Listar metas de um plano, buscar meta por ID | Marcar como concluída, alterar prioridade | Remover meta do plano |
| **SessaoConcentracao** | Registrar nova sessão | Listar sessões do usuário, buscar por período | Finalizar sessão (registrar pontuação) | Excluir registro de sessão |
| **Mentoria** | Solicitar mentoria | Listar mentorias do usuário (como mentor e mentorado) | Aceitar/recusar, alterar status, avaliar | Cancelar mentoria |
| **Recurso** | Adicionar recurso à biblioteca | Listar recursos, filtrar por tipo/tag | Atualizar dados do recurso, avaliar | Remover recurso |
| **Badge** | Criar badge (coordenador/admin) | Listar badges disponíveis, badges conquistados | Atualizar critérios | Remover badge |
| **AvaliacaoBemEstar** | Preencher nova avaliação | Listar histórico de avaliações do usuário | Editar avaliação recente | Excluir avaliação |

#### Padrão de rotas REST inferido para o projeto

O documento `plano-2026-03-08-analise-fase-projeto-design.md` (Seção 3.1) já inferiu endpoints REST a partir dos requisitos funcionais. Abaixo, a estrutura organizada por recurso:

| Recurso | Rotas base | Verbos |
|---------|-----------|--------|
| Auth | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/sso/callback` | POST, GET |
| Planos | `/planos`, `/planos/:id`, `/planos/:id/metas` | GET, POST, PUT, DELETE |
| Sessões | `/sessoes`, `/sessoes/:id/finalizar` | GET, POST, PUT |
| Dashboard | `/dashboard/stats`, `/dashboard/progresso-semanal` | GET |
| Recursos | `/recursos`, `/recursos/:id/favoritar`, `/recursos/:id/avaliar` | GET, POST |
| Trilhas | `/trilhas`, `/trilhas/:cursoId` | GET |
| Forum | `/forum/posts`, `/forum/posts/:id/comentarios` | GET, POST |
| Mentoria | `/mentorias/solicitar`, `/mentorias/:id/aceitar`, `/mentorias/:id/avaliar` | POST, PUT |
| Notificações | `/notificacoes`, `/notificacoes/:id/lida` | GET, PUT |
| Bem-estar | `/avaliacoes`, `/avaliacoes/historico` | GET, POST |
| Relatórios | `/relatorios/engajamento`, `/relatorios/bem-estar` | GET |
| Gamificação | `/badges`, `/pontuacao/ranking` | GET |

> **Observação:** Na arquitetura final do projeto, muitas dessas operações CRUD poderão ser realizadas via Next.js Server Actions (chamadas diretas ao Prisma no servidor), reservando o Express.js / NestJS para endpoints que exigem lógica complexa, WebSocket ou acesso externo. Para fins avaliativos da disciplina, contudo, é necessário demonstrar a construção explícita da API REST com Express.js.

---

### B2. API Completa com Integração a Banco de Dados (SQL ou NoSQL)

#### O que se espera nesta avaliação

- Estender a API REST para que as operações CRUD efetivamente persistam dados em um banco de dados real (não apenas em memória ou arrays em variáveis).
- Demonstrar integração funcional entre Express.js e um banco de dados — SQL (PostgreSQL, MySQL, SQLite) ou NoSQL (MongoDB).
- Demonstrar compreensão de conexão, consultas e tratamento de erros na camada de dados.

#### Decisões já tomadas no projeto que impactam esta avaliação

| Decisão | Definição do projeto | Referência |
|---------|---------------------|------------|
| **Banco de dados** | PostgreSQL 16+ via Supabase (SQL relacional) | `documento-banco-de-dados-tecnologias.md`, Seção 1.1 |
| **ORM** | Prisma | `documento-banco-de-dados-tecnologias.md`, Seção 1.3 |
| **Cache** | Redis via Upstash | `documento-banco-de-dados-tecnologias.md`, Seção 1.2 |
| **Estratégia de conexão** | `DATABASE_URL` (Supavisor, porta 6543) + `DIRECT_URL` (direta, porta 5432) | `copilot-instructions.md`, Seção 2.3 |
| **Modelo de deploy** | Vercel (serverless) — impõe connection pooling obrigatório | `copilot-instructions.md`, Seção 2.3 |

#### Conceitos que devem ser dominados

| # | Conceito | Descrição |
|---|----------|-----------|
| 1 | **Conexão com banco de dados** | Estabelecer e gerenciar conexões entre a aplicação Node.js e o banco. Com Prisma: instanciar `PrismaClient` uma vez e reutilizar (singleton pattern). Sem ORM: usar driver nativo (`pg` para PostgreSQL) com connection string. |
| 2 | **Operações CRUD no banco via ORM (Prisma)** | `prisma.entidade.create()` → INSERT; `prisma.entidade.findMany()` / `findUnique()` → SELECT; `prisma.entidade.update()` → UPDATE; `prisma.entidade.delete()` → DELETE. Todas retornam Promises. |
| 3 | **Operações CRUD sem ORM (SQL puro)** | `INSERT INTO ... VALUES (...)`, `SELECT ... FROM ... WHERE ...`, `UPDATE ... SET ... WHERE ...`, `DELETE FROM ... WHERE ...`. Importante entender o SQL subjacente que o ORM abstrai. |
| 4 | **Migrations** | Alterações estruturais no banco (criar tabelas, adicionar colunas, alterar tipos) versionadas como arquivos. Com Prisma: `prisma migrate dev` (desenvolvimento) e `prisma migrate deploy` (produção). Migrations garantem que a estrutura do banco é reproduzível e rastreável. |
| 5 | **Schema do banco (Prisma Schema)** | Arquivo `schema.prisma` define modelos (entidades), campos, tipos, relações e configurações de conexão. Fonte de verdade para a estrutura do banco. |
| 6 | **Tratamento de erros de banco** | Erros comuns: violação de constraint unique, chave estrangeira inexistente, timeout de conexão, registro não encontrado. Cada erro deve ser capturado e retornado ao cliente com código HTTP apropriado (409 Conflict, 404 Not Found, 500 Internal Server Error). |
| 7 | **Validação de dados antes da persistência** | Dados recebidos via `req.body` devem ser validados (campos obrigatórios, tipos corretos, formatos válidos) antes de chegar ao banco. Bibliotecas: Zod, Joi, class-validator (NestJS). |
| 8 | **SQL vs NoSQL — trade-offs** | SQL (PostgreSQL): esquema rígido, relacionamentos via JOIN, transações ACID, adequado para dados estruturados com integridade referencial. NoSQL (MongoDB): esquema flexível (BSON/JSON), escalabilidade horizontal, adequado para dados sem relacionamentos complexos ou esquema variável. O projeto usa SQL porque as entidades possuem relacionamentos bem definidos. |

#### Camadas da integração banco ↔ API

A integração entre a API Express.js e o banco de dados segue o fluxo em camadas:

```
Cliente HTTP → Express Router → Controller → Service → Prisma/ORM → PostgreSQL → resposta
```

| Camada | Responsabilidade |
|--------|-----------------|
| **Router** | Define rota e verbo HTTP. Direciona para o controller correto. |
| **Controller** | Extrai dados de `req` (params, query, body). Chama o service. Formata e envia a resposta `res`. |
| **Service** | Contém lógica de negócio. Chama o ORM para operações de banco. Trata regras como "um aluno só pode ter 5 planos ativos". |
| **ORM (Prisma)** | Traduz chamadas de função em queries SQL. Gerencia conexão com o banco. Retorna dados tipados. |
| **Banco (PostgreSQL)** | Executa a query SQL. Retorna resultados. Garante integridade referencial e transações ACID. |

#### O que demonstrar na prova/avaliação

Para uma API com integração a banco de dados, o avaliador tipicamente espera:

1. Conexão funcional com o banco (a aplicação se conecta e opera sem erros de conexão).
2. CRUD completo sobre pelo menos uma entidade (criar, listar, buscar por ID, atualizar, excluir).
3. Dados persistem entre reinicializações do servidor (não estão em memória).
4. Tratamento de erros básico (registro não encontrado retorna 404, campo inválido retorna 400).
5. Resposta em formato JSON consistente.

---

### B3. Prova Prática: Desenvolver uma API REST Funcional com Persistência

#### O que se espera nesta avaliação

- Avaliação prática final (prova) que sintetiza todos os conceitos de Express.js, REST e banco de dados.
- Desenvolver, em tempo limitado, uma API REST funcional que persista dados em banco.
- Demonstrar capacidade de montar a aplicação do zero (estrutura de pastas, dependências, conexão, rotas, CRUD, persistência).

#### Checklist de competências necessárias

| # | Competência | O que envolve |
|---|-------------|---------------|
| 1 | **Inicializar projeto Node.js** | `npm init`, configurar `package.json`, instalar dependências (`express`, driver de banco ou ORM). |
| 2 | **Configurar Express.js** | Criar instância do app, registrar middleware (`express.json()`, CORS se necessário), definir porta. |
| 3 | **Definir rotas REST** | Criar router(s) com rotas semânticas seguindo o padrão REST para a entidade solicitada. |
| 4 | **Conectar ao banco** | Configurar conexão (connection string via variável de ambiente), instanciar client ou ORM. |
| 5 | **Implementar CRUD** | Escrever handlers para cada operação, delegando ao banco e retornando resposta JSON com status correto. |
| 6 | **Tratar erros** | Middleware de erro global; `try/catch` em cada handler assíncrono; respostas de erro com código HTTP e mensagem. |
| 7 | **Testar manualmente** | Usar ferramenta como Postman, Insomnia ou `curl` para verificar cada endpoint. |

#### Entidades do projeto adequadas para demonstração em prova

Se a prova permitir escolha de entidade, as mais adequadas para demonstrar CRUD completo em tempo limitado (por terem campos simples e poucos relacionamentos obrigatórios) são:

| Entidade | Complexidade | Por que é adequada |
|----------|-------------|-------------------|
| **Recurso** | Baixa | Campos simples (titulo, tipo, url, descricao, tags). Sem dependências obrigatórias de outras entidades. |
| **Badge** | Baixa | Campos simples (nome, descricao, icone, pontosNecessarios, categoria). Enum de categoria. |
| **Meta** | Média | Campos simples mas pertence a um PlanoEstudo (requer chave estrangeira). Demonstra relação 1:N. |
| **PlanoEstudo** | Média | Pertence a um Usuário (FK), contém Metas (1:N). Demonstra CRUD com relacionamentos. |

#### Preparação recomendada

1. **Praticar o setup do zero** — Repetir o ciclo `npm init → instalar deps → criar server → criar rotas → conectar banco → CRUD` até que o processo seja automático e rápido.
2. **Dominar a sintaxe do ORM ou SQL puro** — Saber de memória as operações básicas (`create`, `findMany`, `findUnique`, `update`, `delete` no Prisma; ou `INSERT`, `SELECT`, `UPDATE`, `DELETE` em SQL).
3. **Ter um template mental de middleware de erro** — Saber escrever um error handler global do Express sem consultar documentação.
4. **Configurar variáveis de ambiente** — Saber usar `process.env` e pacotes como `dotenv` para não hardcodar connection strings.

---

## Resumo: Mapeamento Avaliações ↔ Módulos ↔ Projeto

| Avaliação | Módulo(s) | Entregável | Conceitos-chave |
|-----------|----------|------------|-----------------|
| Listas de exercícios JS/Node.js | 1 e 2 | Commits no GitHub | Tipos, funções, arrays, async/await, módulos |
| Servidor HTTP básico | 2 | Arquivo `.js` com servidor funcional | Módulo `http`, roteamento manual, req/res, status codes |
| Prova prática JS + conceitual | 1 e 2 | Código + respostas escritas | Event Loop, var/let/const, Promises, CJS vs ESM, npm |
| APIs REST com Express.js + CRUD | 3 | API funcionando com rotas REST | Express, middleware, verbos HTTP, rotas, parâmetros |
| API + banco de dados | 3 | API com persistência real | Conexão DB, ORM/SQL, migrations, tratamento de erros |
| Prova prática API REST | 3 | API completa do zero em tempo limitado | Síntese de todos os conceitos acima |

---

## Impacto Esperado

- **Arquivos que serão modificados:** Nenhum no momento. Este documento é referência de estudo.
- **Seções do documento `.tex` afetadas:** Nenhuma diretamente — porém, o conteúdo deste mapeamento pode embasar futuras seções de Metodologia ou Fundamentação Teórica no artigo.
- **README/CHANGELOG precisam ser atualizados?** Não neste momento.

## Riscos e Cuidados

- Este documento é um mapeamento conceitual, não um guia de implementação. Não substituir o estudo prático por leitura passiva.
- A disciplina pode exigir Express.js puro para as avaliações, mesmo que o projeto final utilize NestJS ou Next.js Server Actions. Dominar Express.js é pré-requisito, não alternativa.
- Não confundir o CRUD acadêmico (demonstração de competência) com a arquitetura final do projeto (que terá camadas adicionais de autenticação, validação, cache, etc.).

## Critério de Conclusão

Este plano estará concluído quando o aluno tiver revisado cada seção, identificado lacunas em seu conhecimento atual e definido um cronograma de prática para cada eixo avaliativo — priorizando os conceitos onde há menor domínio.
