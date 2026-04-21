# Relatório de API — Site de Acolhimento FAESA

**Data:** 21 de abril de 2026
**Autor:** Gabriel Malheiros de Castro
**Disciplina:** Desenvolvimento de Aplicações Web II (D001508) — FAESA Campus Vitória
**Versão do documento:** 1.0
**Stack-alvo:** NestJS 10 + Prisma 5 + PostgreSQL 16 (Supabase) + Upstash Redis + Socket.io 4
**Base path:** `/api/v1`

---

## Sumário

1. [Sumário Executivo](#1-sumário-executivo)
2. [Convenções Globais](#2-convenções-globais)
3. [Autenticação e Autorização (RBAC)](#3-autenticação-e-autorização-rbac)
4. [Tratamento de Erros HTTP](#4-tratamento-de-erros-http)
5. [Rate Limiting e Cache (Upstash/Redis)](#5-rate-limiting-e-cache-upstashredis)
6. [Conformidade LGPD](#6-conformidade-lgpd)
7. [WebSockets e Tempo Real (Socket.io)](#7-websockets-e-tempo-real-socketio)
8. [Endpoints REST por Domínio](#8-endpoints-rest-por-domínio)
   - [8.1 Auth e Identidade](#81-auth-e-identidade-rf01)
   - [8.2 Usuários](#82-usuários)
   - [8.3 Acadêmico](#83-acadêmico-catálogo-institucional)
   - [8.4 Matrícula e Histórico](#84-matrícula-e-histórico-acadêmico)
   - [8.5 Plano de Estudo](#85-plano-de-estudo-rf02-rf03)
   - [8.6 Exercícios de Concentração](#86-exercícios-de-concentração-rf04)
   - [8.7 Dashboard](#87-dashboard-rf05)
   - [8.8 Recursos e Trilhas](#88-recursos-e-trilhas-rf06-rf07)
   - [8.9 Fórum](#89-fórum-rf08)
   - [8.10 Mentoria](#810-mentoria-rf09)
   - [8.11 Notificações](#811-notificações-rf10)
   - [8.12 Bem-Estar](#812-bem-estar-rf11)
   - [8.13 Eventos](#813-eventos-rf12)
   - [8.14 Gamificação](#814-gamificação-rf13)
   - [8.15 Relatórios Agregados](#815-relatórios-agregados-rf14)
   - [8.16 Chat de Suporte Psicopedagógico](#816-chat-de-suporte-psicopedagógico-rf15)
   - [8.17 Chatbot IA](#817-chatbot-ia-rf16)
   - [8.18 LGPD e Auditoria](#818-lgpd-e-auditoria-rnf09)
9. [Anexos](#9-anexos)
   - [9.1 Matriz RF ↔ Endpoints](#91-matriz-rf--endpoints)
   - [9.2 Tabela de Códigos de Erro](#92-tabela-de-códigos-de-erro)
   - [9.3 Glossário](#93-glossário)
   - [9.4 Referências](#94-referências)

---

## 1. Sumário Executivo

Este documento define o **contrato funcional da camada de API REST e WebSocket** do projeto
*Site de Acolhimento FAESA*, derivado diretamente:

- Dos **33 modelos** declarados no arquivo
  [`banco-dados-requisitos-projeto/prisma/schema.prisma`](../banco-dados-requisitos-projeto/prisma/schema.prisma);
- Dos **16 Requisitos Funcionais (RF01–RF16)** e **10 Requisitos Não Funcionais
  (RNF01–RNF10)** especificados em
  [`docs/relatorios faesa/especificacao-requisitos-entrega-01.md`](relatorios%20faesa/especificacao-requisitos-entrega-01.md);
- Da arquitetura de persistência detalhada em
  [`docs/relatorio-tecnologias-banco-persistencia.md`](relatorio-tecnologias-banco-persistencia.md).

### Cobertura

| Métrica                              | Valor      |
| ------------------------------------ | ---------- |
| Módulos REST                         | 18         |
| Endpoints REST                       | ~115       |
| Namespaces WebSocket                 | 4          |
| Modelos Prisma cobertos              | 33/33      |
| Requisitos Funcionais cobertos       | 16/16      |
| Papéis (RBAC)                        | 4          |

### Princípios arquiteturais

1. **REST + JSON** como protocolo padrão para operações CRUD e consultas.
2. **WebSocket (Socket.io)** para domínios com necessidade de baixa latência (chat, notificações,
   chatbot, mentoria).
3. **Stateless por requisição** — toda autorização derivada do JWT (Bearer token).
4. **RLS no banco** (Postgres + Supabase) como segunda camada defensiva — a API nunca é a única
   barreira contra acesso indevido.
5. **Anonimização obrigatória** para endpoints agregados (RF14) e chatbot público (RF16).
6. **Auditoria automática** para todas as operações sobre dados pessoais (RNF09 / LGPD).

### Escopo deste documento

- ✅ Define **o que cada endpoint deve fazer**, **quem pode chamá-lo** e **qual a forma do
  payload**.
- ❌ Não descreve a implementação interna (controllers, services, repositories) nem código
  TypeScript executável.
- ❌ Não substitui especificação OpenAPI formal (que deverá ser gerada na fase de codificação).

---

## 2. Convenções Globais

### 2.1 Versionamento

Todas as rotas são versionadas via **URI path versioning**:

```
https://acolhimento.faesa.br/api/v1/<recurso>
```

Mudanças incompatíveis (breaking changes) exigem incremento da versão maior (`/api/v2`).
Versões anteriores devem ser mantidas por **no mínimo 6 meses** após o anúncio de deprecação,
sinalizadas via header de resposta:

```
Deprecation: true
Sunset: Wed, 21 Oct 2026 23:59:59 GMT
Link: <https://acolhimento.faesa.br/api/v2/planos>; rel="successor-version"
```

### 2.2 Formato de dados

- **Content-Type:** `application/json; charset=utf-8`
- **Convenção de campos no JSON:** `camelCase` (request e response).
- **Convenção de campos no banco:** `snake_case` (mapeamento via `@map` no Prisma).
- **Datas:** ISO-8601 UTC (`2026-04-21T14:30:00Z`).
- **IDs:** numéricos (`Int`) para entidades acadêmicas; recomenda-se UUID v7 para entidades
  expostas externamente em versões futuras.
- **Decimais e dinheiro:** strings com ponto decimal (evitar perda de precisão em JSON).

### 2.3 Headers obrigatórios

| Header           | Direção  | Descrição                                                         |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `Authorization`  | Request  | `Bearer <jwt>` em endpoints autenticados                          |
| `Content-Type`   | Request  | `application/json` para POST/PUT/PATCH com body                   |
| `Accept`         | Request  | `application/json`                                                |
| `Accept-Language`| Request  | `pt-BR` (default) — preparado para `en-US`                        |
| `X-Request-Id`   | Ambos    | UUID gerado pelo cliente; ecoado pela API para correlação de logs |
| `X-Forwarded-For`| Request  | Preservado pela borda; usado para auditoria LGPD                  |

### 2.4 Paginação

Padrão **cursor-based** preferido para listas grandes; **page-based** aceitável para listas
curtas (configuração administrativa).

#### Page-based

```
GET /api/v1/recursos?page=2&limit=20
```

```json
{
  "data": [ /* ... 20 itens ... */ ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 137,
    "totalPages": 7
  }
}
```

- `limit` máximo: **100**. Default: **20**.
- `page` inicia em **1**.

#### Cursor-based (preferencial para feeds, mensagens, notificações)

```
GET /api/v1/notificacoes?limit=20&cursor=eyJpZCI6MTIzfQ==
```

```json
{
  "data": [ /* ... */ ],
  "meta": {
    "limit": 20,
    "nextCursor": "eyJpZCI6MTAzfQ==",
    "hasMore": true
  }
}
```

### 2.5 Filtros e ordenação

- **Filtros:** `?filter[campo]=valor` ou `?campo=valor` (ambos aceitos).
- **Ordenação:** `?sort=campo` (ascendente) ou `?sort=-campo` (descendente).
- **Múltiplos sorts:** `?sort=-criadoEm,nome`.
- **Busca textual:** `?q=termo` (full-text quando disponível).

### 2.6 Envelope de resposta

Todas as respostas de **lista** seguem o envelope `{ data, meta }`. Respostas de **recurso
único** retornam diretamente o objeto, sem envelope.

### 2.7 Operações em lote (bulk)

Quando aplicável, endpoints específicos são providos:

```
POST /api/v1/notificacoes/bulk
PUT  /api/v1/metas/bulk-concluir
```

Respostas devem indicar parciais sucessos com status `207 Multi-Status` quando aplicável.

---

## 3. Autenticação e Autorização (RBAC)

### 3.1 Fluxo de autenticação

#### OAuth 2.0 + JWT

```
┌────────┐                     ┌────────────┐                     ┌─────────────┐
│ Client │ ── credenciais ──▶ │  /auth/    │ ── valida no SSO ─▶│ FAESA SSO / │
│        │                     │   login    │                     │  Supabase   │
│        │ ◀── access+refresh │            │ ◀── tokens OK ──── │     Auth    │
└────────┘                     └────────────┘                     └─────────────┘
     │
     │ Bearer <access>
     ▼
┌─────────────────────┐
│  /api/v1/<recurso>  │
└─────────────────────┘
```

#### Tokens

| Token              | TTL      | Onde armazenar (cliente)        |
| ------------------ | -------- | ------------------------------- |
| `access_token`     | 15 min   | Memória / `httpOnly Cookie`     |
| `refresh_token`    | 7 dias   | `httpOnly Secure SameSite=Lax`  |

Renovação via `POST /api/v1/auth/refresh`. Logout invalida o refresh no Redis (blacklist).

#### Claims do JWT

```json
{
  "sub": "usuario_uuid",
  "email": "aluno@faesa.br",
  "papel": "ALUNO",
  "matricula": "20211234",
  "consentimentos": ["dados_basicos", "uso_chatbot"],
  "iat": 1729512000,
  "exp": 1729512900
}
```

### 3.2 Papéis (Roles)

| Papel        | Descrição                                   | Acesso primário                                                                                |
| ------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ALUNO`      | Estudante regularmente matriculado          | Próprios dados; recursos públicos; mentoria como mentorado; chat de suporte                    |
| `MENTOR`     | Aluno veterano com CRA ≥ 7,0                | Tudo de ALUNO + aceitar mentorias + criar recursos + moderar fórum (limitado)                  |
| `COORDENADOR`| Equipe pedagógica institucional             | Relatórios agregados (RF14); criar/gerenciar eventos; **nunca** acessa dados individuais       |
| `ADMIN`      | Gestor técnico do sistema                   | Acesso total para administração; gestão de catálogos; auditoria                                |

### 3.3 Matriz de permissões (resumo)

| Domínio                    | ALUNO | MENTOR | COORDENADOR | ADMIN |
| -------------------------- | :---: | :----: | :---------: | :---: |
| Próprio perfil             | RWD\* | RWD\*  | R\*\*       | RW    |
| Catálogo acadêmico         | R     | R      | R           | RWD   |
| Plano de estudo (próprio)  | RWD   | RWD    | —           | R     |
| Mentoria (como mentorado)  | RW    | —      | —           | R     |
| Mentoria (como mentor)     | —     | RWD    | —           | R     |
| Fórum (criação/edição)     | RW    | RW + M | —           | RWD   |
| Recursos                   | R     | RW     | R           | RWD   |
| Eventos (CRUD)             | R     | R      | RWD         | RWD   |
| Inscrição em eventos       | RW    | RW     | RW          | RW    |
| Relatórios agregados       | —     | —      | R           | R     |
| Chatbot                    | RW    | RW     | RW          | RW    |
| Auditoria                  | R\*\*\*| —     | —           | R     |
| Catálogos administrativos  | —     | —      | —           | RWD   |

> Legenda: **R** = leitura • **W** = escrita • **D** = exclusão • **M** = moderação
> `*` apenas próprio • `**` apenas dados agregados • `***` apenas próprios logs

### 3.4 Implementação técnica recomendada

- **Guard global:** `JwtAuthGuard` aplicado por padrão (com `@Public()` para exceções).
- **Decorator de papéis:** `@Roles('ALUNO', 'MENTOR')` + `RolesGuard`.
- **Verificação de propriedade:** `@OwnerOnly('usuarioId')` para endpoints de recursos
  pessoais (compara `req.user.sub` com `params/body`).
- **RLS no Postgres** como segunda camada — `SET app.current_user_id = $1` por conexão.

---

## 4. Tratamento de Erros HTTP

### 4.1 Envelope padrão de erro

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "O campo 'titulo' é obrigatório.",
    "details": [
      { "field": "titulo", "rule": "required" },
      { "field": "dataInicio", "rule": "isISO8601" }
    ],
    "requestId": "8b3a1c1d-...",
    "timestamp": "2026-04-21T14:32:11Z"
  }
}
```

### 4.2 Códigos HTTP utilizados

| Status | Significado                              | Quando usar                                                              |
| -----: | ---------------------------------------- | ------------------------------------------------------------------------ |
| 200    | OK                                       | GET, PUT, PATCH com sucesso e corpo de resposta                          |
| 201    | Created                                  | POST que cria novo recurso                                               |
| 202    | Accepted                                 | Solicitações assíncronas (exportação LGPD, geração de relatório)         |
| 204    | No Content                               | DELETE com sucesso, PUT idempotente sem retorno                          |
| 207    | Multi-Status                             | Operações bulk com sucesso parcial                                       |
| 400    | Bad Request                              | Validação falhou, JSON malformado                                        |
| 401    | Unauthorized                             | JWT ausente, expirado ou inválido                                        |
| 403    | Forbidden                                | Autenticado mas sem permissão (papel/RLS)                                |
| 404    | Not Found                                | Recurso não existe ou pertence a outro usuário (mascarado)               |
| 409    | Conflict                                 | Violação de unicidade, estado inválido (ex: plano ativo já existe)       |
| 410    | Gone                                     | Recurso anonimizado/excluído por LGPD                                    |
| 422    | Unprocessable Entity                     | Validação semântica (ex: data fim < data início)                         |
| 423    | Locked                                   | Conta suspensa, ticket congelado por moderação                           |
| 429    | Too Many Requests                        | Rate limit excedido — header `Retry-After` obrigatório                   |
| 451    | Unavailable For Legal Reasons            | Conteúdo bloqueado por requisição LGPD                                   |
| 500    | Internal Server Error                    | Erro não tratado — sempre logar `requestId`                              |
| 502    | Bad Gateway                              | Falha de upstream (Supabase, Upstash, OpenAI)                            |
| 503    | Service Unavailable                      | Manutenção programada ou circuit breaker aberto                          |
| 504    | Gateway Timeout                          | Timeout em integração externa                                            |

### 4.3 Códigos de erro do domínio

Definidos no anexo [9.2](#92-tabela-de-códigos-de-erro).

---

## 5. Rate Limiting e Cache (Upstash/Redis)

### 5.1 Rate limiting

Implementação sugerida: **token bucket distribuído** via Upstash Redis.

| Categoria                            | Limite                  | Janela    |
| ------------------------------------ | ----------------------- | --------- |
| Endpoints públicos (não autenticado) | 30 req                  | 1 min/IP  |
| Padrão autenticado (ALUNO/MENTOR)    | 100 req                 | 1 min/usu |
| COORDENADOR/ADMIN                    | 1000 req                | 1 min/usu |
| Chatbot (RF16)                       | 20 mensagens            | 1 min/sessão |
| Login (`/auth/login`)                | 5 tentativas            | 15 min/IP |
| Recuperação de senha                 | 3 solicitações          | 1 h/email |
| Exportação LGPD                      | 1 solicitação           | 24 h/usuário |

#### Headers de resposta

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1729512060
Retry-After: 42                  (apenas em 429)
```

### 5.2 Cache

Implementação: **cache-aside** com Upstash Redis. TTLs sugeridos:

| Recurso                                  | Chave (padrão)                       | TTL        |
| ---------------------------------------- | ------------------------------------ | ---------- |
| Dashboard do aluno                       | `dash:user:{id}`                     | 5 min      |
| Catálogo de cursos/disciplinas           | `cat:cursos`, `cat:disciplinas`      | 1 h        |
| Recursos públicos (lista paginada)       | `recursos:p{page}:l{limit}:{filter}` | 30 min     |
| Trilhas de aprendizagem                  | `trilhas:all`                        | 1 h        |
| Ranking de gamificação                   | `gamif:ranking:semana`               | 10 min     |
| Relatórios agregados (RF14)              | `rel:{tipo}:{periodo}:{filtros}`     | 1 h        |
| Configuração de notificações             | `notif:prefs:{userId}`               | 24 h       |
| Sessões de WebSocket (presence)          | `ws:online:{userId}`                 | 90 s       |

#### Invalidação

Toda escrita relevante (POST/PUT/DELETE) deve disparar invalidação explícita:

```
POST /api/v1/planos          → invalida dash:user:{id}
PUT  /api/v1/metas/:id/concluir → invalida dash:user:{id}, gamif:ranking:semana
POST /api/v1/recursos        → invalida recursos:* (pattern delete)
```

---

## 6. Conformidade LGPD

### 6.1 Princípios aplicados

A API implementa os **6 princípios da Lei 13.709/2018** mais relevantes ao contexto:

1. **Finalidade** — toda coleta declara propósito (em `consentimentos_lgpd.finalidade`).
2. **Adequação e necessidade** — minimização: nunca solicitar dado não usado.
3. **Livre acesso** — `GET /api/v1/usuarios/:id/dados-pessoais` retorna export completo.
4. **Qualidade dos dados** — endpoints de PUT permitem correção pelo titular.
5. **Transparência** — auditoria pública ao titular via `GET /api/v1/auditoria/logs/:usuarioId`.
6. **Segurança e prevenção** — TLS 1.3, criptografia em repouso (Supabase), RLS.

### 6.2 Consentimento

Modelo: `ConsentimentoLgpd` (tabela `consentimentos_lgpd`).

- Registrado em **toda** ação que coleta dado novo: cadastro, primeiro acesso ao chatbot,
  participação em mentoria, etc.
- Captura obrigatória: `tipo`, `finalidade`, `baseLegal`, `versaoTermo`, `ip`, `userAgent`,
  `dataConcessao`.
- Revogação via `DELETE /api/v1/lgpd/consentimentos/:tipo` — dispara fluxo assíncrono de
  anonimização parcial (não bloqueante).

### 6.3 Auditoria

Modelo: `AuditoriaDado` (tabela `auditoria_dados`).

Campos obrigatórios em **todo** registro:

| Campo        | Tipo      | Descrição                                               |
| ------------ | --------- | ------------------------------------------------------- |
| `ator`       | String    | `usuarioId` ou `SYSTEM` ou `SERVICE:nome`               |
| `acao`       | Enum      | `CREATE`, `READ`, `UPDATE`, `DELETE`, `EXPORT`, `ANON`  |
| `entidade`   | String    | Nome do modelo (ex: `PlanoEstudo`)                      |
| `entidadeId` | String?   | ID do registro afetado                                  |
| `sujeitoId`  | String?   | `usuarioId` titular dos dados (pode ≠ `ator`)           |
| `baseLegal`  | Enum      | `CONSENTIMENTO`, `OBRIG_LEGAL`, `LEGITIMO_INTERESSE`    |
| `finalidade` | String    | Texto curto descrevendo o propósito                     |
| `ip`         | String?   | IP do cliente                                           |
| `userAgent`  | String?   | UA do navegador                                         |
| `criadoEm`   | DateTime  | Imutável                                                |

Implementação recomendada: **interceptor NestJS global** que registra automaticamente.

### 6.4 Direitos do titular

| Direito                        | Endpoint                                              | SLA       |
| ------------------------------ | ----------------------------------------------------- | --------- |
| Confirmação de tratamento      | `GET /api/v1/lgpd/consentimentos/me`                  | imediato  |
| Acesso aos dados               | `GET /api/v1/usuarios/:id/dados-pessoais`             | imediato  |
| Correção                       | `PUT /api/v1/usuarios/:id`                            | imediato  |
| Anonimização/exclusão          | `POST /api/v1/lgpd/excluir-conta`                     | 31 dias   |
| Portabilidade (export JSON)    | `POST /api/v1/lgpd/exportar-dados`                    | 48 horas  |
| Revogação de consentimento     | `DELETE /api/v1/lgpd/consentimentos/:tipo`            | 24 horas  |
| Informação sobre uso/compart.  | `GET /api/v1/auditoria/logs/:usuarioId`               | imediato  |

### 6.5 Anonimização

- **RF14 (Relatórios):** nunca retorna `usuarioId`. Agregações sempre por dimensão (curso,
  período, faixa etária).
- **RF16 (Chatbot):** apenas `faixaEtaria` (`17-20`, `21-25`, `26+`) e `cursoCategoria` (não o
  curso específico).
- **Exclusão de conta:** dados pessoais são substituídos por `usuario_anonimizado_<hash>`;
  registros relacionais são preservados para integridade estatística.

---

## 7. WebSockets e Tempo Real (Socket.io)

### 7.1 Conexão

```
wss://acolhimento.faesa.br/socket.io/?token=<jwt>
```

Token JWT validado no handshake via middleware. Conexões sem token autenticado podem usar
apenas o namespace `/chatbot` (modo público anonimizado).

### 7.2 Namespaces

| Namespace        | Quem pode entrar                | Salas (rooms)                          |
| ---------------- | ------------------------------- | -------------------------------------- |
| `/chat`          | ALUNO + atendentes              | `ticket:{ticketId}`                    |
| `/mentoria`      | ALUNO (mentorado), MENTOR       | `mentoria:{mentoriaId}`                |
| `/notificacoes`  | Qualquer autenticado            | `user:{userId}`                        |
| `/chatbot`       | Público (token de sessão)       | `bot:{conversaId}`                     |

### 7.3 Eventos

#### `/chat` (RF15)

| Direção | Evento              | Payload                                           |
| ------- | ------------------- | ------------------------------------------------- |
| C → S   | `entrar:ticket`     | `{ ticketId }`                                    |
| C → S   | `mensagem:enviar`   | `{ ticketId, conteudo }`                          |
| C → S   | `digitando`         | `{ ticketId, status: "iniciou"\|"parou" }`        |
| S → C   | `mensagem:nova`     | `{ id, ticketId, autorId, conteudo, criadoEm }`  |
| S → C   | `ticket:atualizado` | `{ ticketId, status, atendenteId }`               |
| S → C   | `digitando`         | `{ ticketId, autorId, status }`                   |

#### `/mentoria` (RF09)

| Direção | Evento              | Payload                                           |
| ------- | ------------------- | ------------------------------------------------- |
| C → S   | `entrar:sala`       | `{ mentoriaId }`                                  |
| C → S   | `mensagem:enviar`   | `{ mentoriaId, conteudo }`                        |
| S → C   | `mensagem:nova`     | `{ id, mentoriaId, autorId, conteudo, criadoEm }`|
| S → C   | `mentor:online`     | `{ mentoriaId, mentorId, online: true\|false }`   |

#### `/notificacoes` (RF10)

| Direção | Evento                | Payload                                          |
| ------- | --------------------- | ------------------------------------------------ |
| C → S   | `subscribe`           | `{ }` (sala `user:{userId}` automática)          |
| S → C   | `notificacao:nova`    | `{ id, tipo, titulo, conteudo, link, criadoEm }` |
| S → C   | `badge:contador`      | `{ naoLidas: number }`                           |

#### `/chatbot` (RF16)

| Direção | Evento                  | Payload                                            |
| ------- | ----------------------- | -------------------------------------------------- |
| C → S   | `iniciar:conversa`      | `{ faixaEtaria, cursoCategoria }`                  |
| C → S   | `mensagem:enviar`       | `{ conversaId, conteudo }`                         |
| S → C   | `mensagem:streaming`    | `{ conversaId, chunk, fim: false }`                |
| S → C   | `mensagem:completa`     | `{ conversaId, mensagemId, conteudoCompleto }`     |
| S → C   | `recomendacao`          | `{ tipo, titulo, link }`                           |

### 7.4 Garantias

- **Entrega:** `at-least-once` com `acknowledgements` Socket.io.
- **Persistência:** toda mensagem é gravada no Postgres **antes** do broadcast.
- **Ordenação:** garantida por sala (single emitter por `roomId`).
- **Reconexão:** cliente recebe mensagens perdidas via `GET /api/v1/chat/tickets/:id/mensagens?cursor=`.

---

## 8. Endpoints REST por Domínio

> **Nota de leitura:** Em todas as tabelas, "Auth" indica se o endpoint exige JWT;
> "Papel" indica os papéis autorizados (— = qualquer autenticado).
> Endpoints com `*` no nome do parâmetro indicam que apenas o **próprio usuário** ou ADMIN
> podem acessar.

---

### 8.1 Auth e Identidade (RF01)

**Modelos:** `Usuario`, `ConsentimentoLgpd`

#### `POST /api/v1/auth/register`

| Atributo  | Valor                                                                |
| --------- | -------------------------------------------------------------------- |
| RF        | RF01                                                                 |
| Auth      | Público                                                              |
| Papel     | —                                                                    |
| Descrição | Cadastra novo aluno e dispara registro de consentimento LGPD inicial |

**Request:**

```json
{
  "email": "aluno@faesa.br",
  "matricula": "20211234",
  "senha": "string (min 12, 1 maiúsc, 1 num, 1 símbolo)",
  "nomeCompleto": "Gabriel Malheiros de Castro",
  "consentimentos": [
    { "tipo": "dados_basicos", "versaoTermo": "1.0", "concedido": true }
  ]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "email": "aluno@faesa.br",
  "matricula": "20211234",
  "papel": "ALUNO",
  "consentimentosPendentes": ["uso_chatbot"]
}
```

**Erros:** `400` (validação), `409` (email/matrícula já existe).
**Auditoria:** `USUARIO_CRIADO`, `CONSENTIMENTO_CONCEDIDO`.

#### `POST /api/v1/auth/login`

| Atributo  | Valor                              |
| --------- | ---------------------------------- |
| RF        | RF01                               |
| Auth      | Público                            |
| Rate lim. | 5 tentativas / 15 min / IP         |

**Request:** `{ "email", "senha" }`
**Response 200:** `{ "accessToken", "refreshToken", "usuario": { id, papel, ... } }`
**Erros:** `401` (credenciais inválidas), `423` (conta suspensa), `429` (rate limit).

#### `POST /api/v1/auth/sso/faesa`

| Atributo  | Valor                                              |
| --------- | -------------------------------------------------- |
| RF        | RF01                                               |
| Auth      | Público                                            |
| Descrição | Login via OAuth 2.0 com SSO institucional FAESA    |

**Request:** `{ "code": "authorization_code_do_provedor" }`
**Response 200:** idem login.

#### `POST /api/v1/auth/refresh`

**Request:** `{ "refreshToken": "..." }` (ou cookie httpOnly)
**Response 200:** `{ "accessToken", "refreshToken" }` (rotação de refresh).
**Erros:** `401` (refresh inválido/blacklisted).

#### `POST /api/v1/auth/logout`

**Auth:** obrigatório. Invalida refresh token (blacklist Redis).
**Response 204.**

#### `GET /api/v1/auth/me`

**Auth:** obrigatório.
**Response 200:** dados do usuário corrente + papel + consentimentos ativos.

#### `POST /api/v1/auth/recuperar-senha`

| Atributo  | Valor                          |
| --------- | ------------------------------ |
| Auth      | Público                        |
| Rate lim. | 3 / hora / email               |

**Request:** `{ "email" }`
**Response 202** (sempre — não revela se email existe).

#### `PUT /api/v1/auth/redefinir-senha`

**Request:** `{ "token", "novaSenha" }`
**Response 204.**
**Erros:** `400` (token inválido/expirado), `422` (senha fraca).

---

### 8.2 Usuários

**Modelo:** `Usuario`

#### `GET /api/v1/usuarios/:id*`

**Auth:** obrigatório • **Papel:** próprio ou ADMIN.
**Response 200:** perfil completo.
**Erros:** `403` (outro usuário), `404` (não existe ou anonimizado).

#### `PUT /api/v1/usuarios/:id*`

**Request:** campos editáveis (`nomeCompleto`, `telefone`, `avatarUrl`, `bio`, `preferencias`).
**Response 200:** perfil atualizado.
**Auditoria:** `USUARIO_ATUALIZADO` (com diff).

#### `DELETE /api/v1/usuarios/:id*`

| Atributo  | Valor                                                        |
| --------- | ------------------------------------------------------------ |
| Papel     | Próprio (LGPD)                                               |
| Descrição | Inicia processo de anonimização (31 dias para reversão)     |

**Response 202:** `{ "previsaoExclusao": "2026-05-22T...Z" }`
**Auditoria:** `USUARIO_EXCLUSAO_SOLICITADA`.

#### `GET /api/v1/usuarios/:id*/dados-pessoais`

**Descrição:** Exportação LGPD imediata em JSON (todos os dados pessoais).
**Response 200:** `application/json` (ou `Content-Disposition: attachment`).

#### `GET /api/v1/mentores`

**Auth:** ALUNO.
**Query:** `?cursoId=&disciplinaId=&disponivel=true`
**Response 200:** lista anonimizada de mentores disponíveis (sem email/telefone).

---

### 8.3 Acadêmico (catálogo institucional)

**Modelos:** `InstituicaoFaesa`, `Curso`, `Turma`, `Disciplina`, `TurmaDisciplina`

| Método | Rota                                       | Auth | Papel               | Descrição                                  |
| ------ | ------------------------------------------ | ---- | ------------------- | ------------------------------------------ |
| GET    | `/api/v1/instituicoes`                     | Pub. | —                   | Lista campi FAESA                          |
| GET    | `/api/v1/instituicoes/:id`                 | Pub. | —                   | Detalhe                                    |
| POST   | `/api/v1/instituicoes`                     | Sim  | ADMIN               | Cadastra campus                            |
| PUT    | `/api/v1/instituicoes/:id`                 | Sim  | ADMIN               | Atualiza                                   |
| GET    | `/api/v1/cursos`                           | Sim  | —                   | Lista cursos (filtro `?instituicaoId=`)    |
| GET    | `/api/v1/cursos/:id`                       | Sim  | —                   | Detalhe                                    |
| POST   | `/api/v1/cursos`                           | Sim  | ADMIN               | Cria curso                                 |
| PUT    | `/api/v1/cursos/:id`                       | Sim  | ADMIN               | Atualiza                                   |
| DELETE | `/api/v1/cursos/:id`                       | Sim  | ADMIN               | Soft-delete (`ativo=false`)                |
| GET    | `/api/v1/turmas`                           | Sim  | —                   | Lista (`?ano=&semestre=&turno=&cursoId=`)  |
| GET    | `/api/v1/turmas/:id`                       | Sim  | —                   | Detalhe                                    |
| GET    | `/api/v1/turmas/:id/disciplinas`           | Sim  | —                   | Disciplinas vinculadas                     |
| POST   | `/api/v1/turmas`                           | Sim  | ADMIN               | Cria turma                                 |
| PUT    | `/api/v1/turmas/:id`                       | Sim  | ADMIN               | Atualiza                                   |
| GET    | `/api/v1/disciplinas`                      | Sim  | —                   | Catálogo                                   |
| GET    | `/api/v1/disciplinas/:id`                  | Sim  | —                   | Detalhe                                    |
| POST   | `/api/v1/disciplinas`                      | Sim  | ADMIN               | Cadastra disciplina                        |
| PUT    | `/api/v1/disciplinas/:id`                  | Sim  | ADMIN               | Atualiza                                   |
| POST   | `/api/v1/turmas/:id/disciplinas`           | Sim  | ADMIN               | Vincula disciplina à turma                 |
| DELETE | `/api/v1/turmas/:turmaId/disciplinas/:id`  | Sim  | ADMIN               | Desvincula                                 |

**Cache:** `cat:cursos`, `cat:disciplinas`, `cat:turmas:{ano}:{semestre}` (TTL 1h).
**Invalidação:** qualquer POST/PUT/DELETE sobre estes recursos.

---

### 8.4 Matrícula e Histórico Acadêmico

**Modelos:** `MatriculaAcademica`, `DisciplinaCursada`, `AvaliacaoDisciplina`

#### `GET /api/v1/matriculas/me`

**Auth:** ALUNO. Retorna matrícula ativa do usuário.

#### `POST /api/v1/matriculas`

**Papel:** ADMIN (ou job de integração com sistema FAESA).
**Request:** `{ usuarioId, turmaId, dataMatricula, status }`

#### `GET /api/v1/matriculas/:id*/historico`

**Papel:** próprio ou ADMIN.
**Response 200:** lista de `DisciplinaCursada` com nota, frequência, status.

#### `POST /api/v1/disciplinas-cursadas`

**Papel:** ADMIN. Lança histórico (integração).

#### `GET /api/v1/avaliacoes-disciplina`

**Query:** `?disciplinaId=&turmaId=`
**Response 200:** lista paginada (anônima — `usuarioId` omitido).

#### `POST /api/v1/avaliacoes-disciplina`

**Papel:** ALUNO (que cursou a disciplina).
**Request:** `{ disciplinaCursadaId, nota: 1-5, comentario, anonima: bool }`
**Response 201.**
**Erros:** `403` (não cursou), `409` (já avaliou).

#### `GET /api/v1/disciplinas/:id/avaliacoes`

**Response 200:** `{ media, distribuicao: {1: n, 2: n, ...}, comentariosRecentes: [...] }`
**Cache:** `disc:{id}:aval` TTL 30 min.

---

### 8.5 Plano de Estudo (RF02, RF03)

**Modelos:** `PlanoEstudo`, `MetaSemanal`, `AtividadeEstudo`

| Método | Rota                                     | Papel         | Descrição                                       |
| ------ | ---------------------------------------- | ------------- | ----------------------------------------------- |
| GET    | `/api/v1/planos`                         | ALUNO         | Lista planos do aluno autenticado               |
| POST   | `/api/v1/planos`                         | ALUNO         | Cria plano personalizado                        |
| GET    | `/api/v1/planos/:id*`                    | Próprio       | Detalhe                                         |
| PUT    | `/api/v1/planos/:id*`                    | Próprio       | Atualiza metadados                              |
| DELETE | `/api/v1/planos/:id*`                    | Próprio       | Remove (soft delete)                            |
| PUT    | `/api/v1/planos/:id*/cronograma`         | Próprio       | Atualiza cronograma drag-drop (RF03)            |
| GET    | `/api/v1/planos/:id*/metas`              | Próprio       | Lista metas semanais                            |
| POST   | `/api/v1/planos/:id*/metas`              | Próprio       | Cria meta                                       |
| PUT    | `/api/v1/metas/:id*`                     | Próprio       | Atualiza meta                                   |
| PUT    | `/api/v1/metas/:id*/concluir`            | Próprio       | Marca como concluída → gatilho gamificação      |
| DELETE | `/api/v1/metas/:id*`                     | Próprio       | Remove                                          |
| POST   | `/api/v1/atividades-estudo`              | ALUNO         | Registra sessão (data, duração, disciplinaId)   |
| GET    | `/api/v1/atividades-estudo`              | Próprio       | Histórico paginado                              |

#### Detalhe — `POST /api/v1/planos`

**Request:**

```json
{
  "titulo": "Plano 2026.1 - Foco em Cálculo II",
  "dataInicio": "2026-04-22",
  "dataFim": "2026-07-30",
  "objetivo": "Recuperar média na disciplina",
  "disciplinasIds": [12, 17]
}
```

**Response 201:** plano criado com `id`.
**Erros:** `409` se já existir plano com sobreposição de datas para as mesmas disciplinas
(regra de negócio configurável).
**Cache:** invalida `dash:user:{id}`.
**Auditoria:** `PLANO_CRIADO`.

#### Detalhe — `PUT /api/v1/metas/:id*/concluir`

**Side effects:**
1. Atualiza `MetaSemanal.status = "CONCLUIDA"`, `concluidaEm = now()`.
2. Em **transação**: incrementa `Gamificacao.pontos`, avalia regras de badges.
3. Invalida `dash:user:{id}` e `gamif:ranking:semana`.
4. Dispara notificação push (se preferência ativa).

**Response 200:** `{ meta, gamificacao: { pontosAdicionados, novosBadges: [...] } }`

---

### 8.6 Exercícios de Concentração (RF04)

**Modelo:** `ExercicioConcentracao`

| Método | Rota                                  | Papel    | Descrição                                  |
| ------ | ------------------------------------- | -------- | ------------------------------------------ |
| POST   | `/api/v1/exercicios/iniciar`          | ALUNO    | Inicia sessão (Pomodoro/respiração/foco)   |
| PUT    | `/api/v1/exercicios/:id*/finalizar`   | Próprio  | Encerra com métricas (duração real, pausas)|
| GET    | `/api/v1/exercicios/historico`        | Próprio  | Histórico paginado                         |
| GET    | `/api/v1/exercicios/estatisticas`     | Próprio  | Agregados (total min, streak)              |

**`POST /api/v1/exercicios/iniciar` — Request:**

```json
{
  "tipo": "POMODORO",
  "duracaoPlanejadaMinutos": 25,
  "objetivo": "Estudar Cálculo II - Cap 4"
}
```

**Response 201:** `{ id, iniciadoEm, expiraEm }`.

**`PUT /:id/finalizar` — Request:**

```json
{
  "duracaoRealMinutos": 23,
  "pausas": 1,
  "concluido": true,
  "humorAposSessao": 4
}
```

**Auditoria:** `EXERCICIO_FINALIZADO`.

---

### 8.7 Dashboard (RF05)

**Agregação de:** `PlanoEstudo`, `MetaSemanal`, `Gamificacao`, `QuestionarioBemEstar`,
`AtividadeEstudo`.

| Método | Rota                                       | Papel | Descrição                                |
| ------ | ------------------------------------------ | ----- | ---------------------------------------- |
| GET    | `/api/v1/dashboard/me`                     | ALUNO | Estatísticas consolidadas                |
| GET    | `/api/v1/dashboard/progresso-semanal`      | ALUNO | Série temporal últimas 12 semanas        |
| GET    | `/api/v1/dashboard/streak`                 | ALUNO | Sequência de dias ativos                 |
| GET    | `/api/v1/dashboard/recomendacoes`          | ALUNO | Sugestões personalizadas (recursos, ações)|

**Cache:** `dash:user:{id}` TTL 5 min.

**`GET /api/v1/dashboard/me` — Response 200:**

```json
{
  "metasSemana": { "concluidas": 4, "total": 7, "percentual": 57 },
  "horasEstudoSemana": 12.5,
  "exerciciosConcentracao": { "sessoes": 8, "minutosFoco": 195 },
  "bemEstar": { "scoreMedio": 3.8, "ultimaAvaliacao": "2026-04-19T..." },
  "gamificacao": { "nivel": 5, "pontos": 1420, "badges": 12 },
  "rankingSemana": { "posicao": 23, "totalParticipantes": 184 },
  "proximosEventos": [ { "id", "titulo", "dataInicio" } ]
}
```

---

### 8.8 Recursos e Trilhas (RF06, RF07)

**Modelos:** `Recurso`, `TrilhaAprendizagem`, `TrilhaRecurso`, `UsuarioRecurso`

#### Recursos

| Método | Rota                                       | Papel              | Descrição                          |
| ------ | ------------------------------------------ | ------------------ | ---------------------------------- |
| GET    | `/api/v1/recursos`                         | —                  | Biblioteca paginada                |
| GET    | `/api/v1/recursos/:id`                     | —                  | Detalhe (tracking de visualização) |
| POST   | `/api/v1/recursos`                         | MENTOR/ADMIN       | Cria recurso                       |
| PUT    | `/api/v1/recursos/:id`                     | MENTOR(autor)/ADMIN| Atualiza                           |
| DELETE | `/api/v1/recursos/:id`                     | ADMIN              | Remove (soft delete)               |
| POST   | `/api/v1/recursos/:id/favoritar`           | ALUNO              | Marca favorito                     |
| DELETE | `/api/v1/recursos/:id/favoritar`           | ALUNO              | Desfavorita                        |
| POST   | `/api/v1/recursos/:id/concluir`            | ALUNO              | Registra conclusão                 |
| GET    | `/api/v1/recursos/:id/avaliacoes`          | —                  | Avaliações do recurso              |
| POST   | `/api/v1/recursos/:id/avaliacoes`          | ALUNO              | Avalia (1-5 + comentário)          |

**Filtros aceitos:** `?tipo=video|artigo|podcast&cursoId=&disciplinaId=&q=`
**Cache:** `recursos:p{page}:l{limit}:{filterHash}` TTL 30 min.

#### Trilhas

| Método | Rota                                          | Papel         | Descrição                          |
| ------ | --------------------------------------------- | ------------- | ---------------------------------- |
| GET    | `/api/v1/trilhas`                             | —             | Lista trilhas                      |
| GET    | `/api/v1/trilhas/:id`                         | —             | Detalhe + recursos ordenados       |
| GET    | `/api/v1/trilhas/:id/progresso`               | ALUNO         | Progresso pessoal                  |
| POST   | `/api/v1/trilhas/:id/iniciar`                 | ALUNO         | Inscreve aluno na trilha           |
| POST   | `/api/v1/trilhas`                             | MENTOR/ADMIN  | Cria trilha                        |
| PUT    | `/api/v1/trilhas/:id`                         | Autor/ADMIN   | Atualiza                           |
| POST   | `/api/v1/trilhas/:id/recursos`                | Autor/ADMIN   | Adiciona recurso à trilha          |
| DELETE | `/api/v1/trilhas/:id/recursos/:recursoId`     | Autor/ADMIN   | Remove recurso                     |

---

### 8.9 Fórum (RF08)

**Modelos:** `ForumDiscussao`, `ForumPost`, `ForumComentario`

| Método | Rota                                              | Papel                  | Descrição                       |
| ------ | ------------------------------------------------- | ---------------------- | ------------------------------- |
| GET    | `/api/v1/forum/discussoes`                        | —                      | Lista discussões                |
| POST   | `/api/v1/forum/discussoes`                        | ALUNO/MENTOR           | Cria discussão                  |
| GET    | `/api/v1/forum/discussoes/:id`                    | —                      | Detalhe + posts paginados       |
| PUT    | `/api/v1/forum/discussoes/:id`                    | Autor/MENTOR(M)/ADMIN  | Atualiza título/categoria       |
| DELETE | `/api/v1/forum/discussoes/:id`                    | Autor/ADMIN            | Remove (soft)                   |
| POST   | `/api/v1/forum/discussoes/:id/posts`              | —                      | Adiciona post                   |
| PUT    | `/api/v1/forum/posts/:id`                         | Autor                  | Edita (até 10 min)              |
| DELETE | `/api/v1/forum/posts/:id`                         | Autor/MENTOR(M)/ADMIN  | Remove                          |
| POST   | `/api/v1/forum/posts/:id/comentarios`             | —                      | Comenta                         |
| PUT    | `/api/v1/forum/comentarios/:id`                   | Autor                  | Edita comentário                |
| DELETE | `/api/v1/forum/comentarios/:id`                   | Autor/ADMIN            | Remove                          |
| POST   | `/api/v1/forum/posts/:id/curtir`                  | —                      | Curte (idempotente)             |
| DELETE | `/api/v1/forum/posts/:id/curtir`                  | —                      | Descurte                        |
| POST   | `/api/v1/forum/posts/:id/denunciar`               | —                      | Reporta moderação               |
| GET    | `/api/v1/forum/denuncias`                         | MENTOR/ADMIN           | Fila de moderação               |
| PUT    | `/api/v1/forum/denuncias/:id/resolver`            | MENTOR(M)/ADMIN        | Aprova/rejeita                  |

**`POST /api/v1/forum/discussoes/:id/posts` — Request:**

```json
{
  "conteudo": "Markdown sanitizado (max 10.000 caracteres)",
  "anexos": [ { "url", "tipo": "imagem|arquivo" } ]
}
```

**Validações:**
- Sanitização HTML/Markdown obrigatória (proteção XSS — RNF03).
- Limite 10.000 caracteres no conteúdo.
- Máximo 5 anexos por post.

---

### 8.10 Mentoria (RF09)

**Modelo:** `Mentoria`

| Método | Rota                                            | Papel              | Descrição                         |
| ------ | ----------------------------------------------- | ------------------ | --------------------------------- |
| GET    | `/api/v1/mentorias`                             | ALUNO/MENTOR       | Lista próprias mentorias          |
| GET    | `/api/v1/mentorias/:id*`                        | Participante       | Detalhe                           |
| POST   | `/api/v1/mentorias/solicitar`                   | ALUNO              | Solicita mentor                   |
| PUT    | `/api/v1/mentorias/:id*/aceitar`                | MENTOR (alvo)      | Aceita solicitação                |
| PUT    | `/api/v1/mentorias/:id*/recusar`                | MENTOR (alvo)      | Recusa (com motivo)               |
| PUT    | `/api/v1/mentorias/:id*/finalizar`              | MENTOR/ALUNO       | Encerra mentoria                  |
| POST   | `/api/v1/mentorias/:id*/avaliar`                | ALUNO              | Avalia mentor (1-5)               |
| GET    | `/api/v1/mentorias/:id*/mensagens`              | Participante       | Histórico de chat (cursor)        |

**`POST /api/v1/mentorias/solicitar` — Request:**

```json
{
  "mentorId": "uuid",
  "disciplinaId": 12,
  "motivo": "Dificuldade em integrais por substituição",
  "modalidade": "online|presencial"
}
```

**Erros:** `409` (já existe mentoria ativa com este mentor).
**Notificação:** WebSocket `notificacao:nova` para o mentor.

> Mensagens em tempo real são trocadas via namespace WebSocket `/mentoria` (ver [§7.3](#73-eventos)).

---

### 8.11 Notificações (RF10)

**Modelo:** `Notificacao`

| Método | Rota                                            | Papel    | Descrição                          |
| ------ | ----------------------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/v1/notificacoes`                          | —        | Lista (cursor-based)               |
| GET    | `/api/v1/notificacoes/contador`                 | —        | `{ naoLidas: number }`             |
| PUT    | `/api/v1/notificacoes/:id*/lida`                | Próprio  | Marca como lida                    |
| PUT    | `/api/v1/notificacoes/marcar-todas-lidas`       | —        | Bulk                               |
| DELETE | `/api/v1/notificacoes/:id*`                     | Próprio  | Remove                             |
| GET    | `/api/v1/notificacoes/preferencias`             | —        | Lê preferências                    |
| PUT    | `/api/v1/notificacoes/preferencias`             | —        | Atualiza canais                    |

**`PUT /api/v1/notificacoes/preferencias` — Request:**

```json
{
  "canais": {
    "push": true,
    "email": false,
    "inApp": true
  },
  "categorias": {
    "mentoria": ["push", "inApp"],
    "metas": ["inApp"],
    "forum": [],
    "eventos": ["email"]
  },
  "horarioSilencioso": { "inicio": "22:00", "fim": "07:00" }
}
```

**Cache:** `notif:prefs:{userId}` TTL 24h, invalidação imediata em PUT.

---

### 8.12 Bem-Estar (RF11)

**Modelo:** `QuestionarioBemEstar`

| Método | Rota                                            | Papel    | Descrição                                      |
| ------ | ----------------------------------------------- | -------- | ---------------------------------------------- |
| GET    | `/api/v1/bem-estar/questionarios`               | ALUNO    | Templates disponíveis (semanal, mensal)        |
| POST   | `/api/v1/bem-estar/respostas`                   | ALUNO    | Submete resposta → calcula score               |
| GET    | `/api/v1/bem-estar/respostas/:id*`              | Próprio  | Detalhe de uma resposta                        |
| GET    | `/api/v1/bem-estar/historico`                   | Próprio  | Evolução temporal (últimos 6 meses)            |
| GET    | `/api/v1/bem-estar/recomendacoes`               | Próprio  | Sugestões baseadas no score atual              |

**`POST /api/v1/bem-estar/respostas` — Request:**

```json
{
  "questionarioId": 1,
  "respostas": [
    { "perguntaId": 1, "valor": 4 },
    { "perguntaId": 2, "valor": 3 }
  ]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "score": 3.6,
  "categoria": "MODERADO",
  "alerta": false,
  "recomendacoes": [ { "tipo": "recurso", "id": 42, "titulo": "..." } ]
}
```

**Regra crítica:** se `categoria == "CRÍTICO"`, dispara notificação **opt-in** ao
psicopedagogo de plantão (somente com consentimento explícito do aluno em `consentimentos_lgpd`).

**Auditoria:** `BEM_ESTAR_RESPONDIDO`.

---

### 8.13 Eventos (RF12)

**Modelos:** `Evento`, `UsuarioEvento`

| Método | Rota                                            | Papel              | Descrição                          |
| ------ | ----------------------------------------------- | ------------------ | ---------------------------------- |
| GET    | `/api/v1/eventos`                               | —                  | Agenda paginada                    |
| GET    | `/api/v1/eventos/:id`                           | —                  | Detalhe                            |
| POST   | `/api/v1/eventos`                               | COORD/ADMIN        | Cria evento                        |
| PUT    | `/api/v1/eventos/:id`                           | COORD/ADMIN        | Atualiza                           |
| DELETE | `/api/v1/eventos/:id`                           | COORD/ADMIN        | Cancela (soft)                     |
| POST   | `/api/v1/eventos/:id/inscrever`                 | ALUNO              | Inscrição                          |
| DELETE | `/api/v1/eventos/:id/inscricao`                 | ALUNO              | Cancela inscrição                  |
| GET    | `/api/v1/eventos/:id/inscritos`                 | COORD/ADMIN        | Lista (anonimizada para COORD)     |
| GET    | `/api/v1/eventos/me/inscricoes`                 | ALUNO              | Eventos em que se inscreveu        |
| POST   | `/api/v1/eventos/:id/checkin`                   | COORD/ADMIN        | Confirma presença                  |

**Validações em inscrição:**
- Verificar `vagasDisponiveis > 0`.
- Verificar `prazoInscricao > now()`.
- Erro `409` se já inscrito.

---

### 8.14 Gamificação (RF13)

**Modelo:** `Gamificacao`

| Método | Rota                                            | Papel    | Descrição                          |
| ------ | ----------------------------------------------- | -------- | ---------------------------------- |
| GET    | `/api/v1/gamificacao/me`                        | ALUNO    | Pontos, nível, badges, próximo nível|
| GET    | `/api/v1/gamificacao/badges`                    | —        | Catálogo completo de badges        |
| GET    | `/api/v1/gamificacao/badges/:id`                | —        | Detalhe + critério de obtenção     |
| GET    | `/api/v1/gamificacao/ranking`                   | —        | Top 100 (apelido + nível, não ID)  |
| GET    | `/api/v1/gamificacao/ranking/curso/:cursoId`    | —        | Ranking por curso                  |
| GET    | `/api/v1/gamificacao/historico`                 | Próprio  | Eventos de pontuação               |

**Privacidade no ranking:**
- Aluno pode optar por aparecer como "Anônimo" via preferência.
- Endpoint nunca retorna `usuarioId` direto — apenas `rankingId` opaco.

**Cache:** `gamif:ranking:semana` TTL 10 min, `gamif:ranking:curso:{id}` TTL 10 min.

---

### 8.15 Relatórios Agregados (RF14)

**Modelo:** `RelatorioAnonimizado`

| Método | Rota                                                  | Papel        | Descrição                              |
| ------ | ----------------------------------------------------- | ------------ | -------------------------------------- |
| GET    | `/api/v1/relatorios/engajamento`                      | COORDENADOR  | Métricas agregadas de uso              |
| GET    | `/api/v1/relatorios/bem-estar`                        | COORDENADOR  | Indicadores de saúde mental anônimos   |
| GET    | `/api/v1/relatorios/uso-recursos`                     | COORDENADOR  | Recursos mais acessados                |
| GET    | `/api/v1/relatorios/desempenho-academico`             | COORDENADOR  | Médias de notas por dimensão           |
| GET    | `/api/v1/relatorios/mentoria`                         | COORDENADOR  | Estatísticas de mentoria               |
| POST   | `/api/v1/relatorios/exportar`                         | COORDENADOR  | Solicita exportação CSV/PDF (assíncrono)|
| GET    | `/api/v1/relatorios/exportacoes/:id`                  | COORDENADOR  | Status + URL de download (24h)         |

**Query params padrão:**

```
?periodoInicio=2026-01-01&periodoFim=2026-04-30
&dimensoes=curso,faixaEtaria,turno
&filtros[cursoId]=12&filtros[turno]=noturno
```

**⚠️ Regras absolutas:**
1. **Nunca** retornar registros individuais — sempre `count`, `avg`, `sum`, `percentil`.
2. **Threshold de k-anonimato:** se qualquer célula resultar em < 5 indivíduos, retornar
   "—" ou agrupar até atingir o mínimo.
3. **Auditoria obrigatória:** toda consulta gera registro `RELATORIO_CONSULTADO` com
   filtros aplicados.

**Cache:** `rel:{tipo}:{hash(filtros)}` TTL 1h.

**Response exemplo:**

```json
{
  "periodo": { "inicio": "2026-01-01", "fim": "2026-04-30" },
  "dimensao": "curso",
  "metrica": "horasEstudoMedia",
  "dados": [
    { "cursoId": 12, "cursoNome": "Eng. Software", "valor": 14.2, "n": 87 },
    { "cursoId": 17, "cursoNome": "ADS",            "valor": 11.8, "n": 64 }
  ],
  "geradoEm": "2026-04-21T14:32:00Z",
  "anonimizado": true
}
```

---

### 8.16 Chat de Suporte Psicopedagógico (RF15)

**Modelos:** `ChatTicket`, `ChatMensagem`

| Método | Rota                                              | Papel              | Descrição                            |
| ------ | ------------------------------------------------- | ------------------ | ------------------------------------ |
| POST   | `/api/v1/chat/tickets`                            | ALUNO              | Abre ticket                          |
| GET    | `/api/v1/chat/tickets/me`                         | ALUNO              | Lista próprios tickets               |
| GET    | `/api/v1/chat/tickets/:id*`                       | Próprio/Atendente  | Detalhe                              |
| GET    | `/api/v1/chat/tickets/:id*/mensagens`             | Próprio/Atendente  | Histórico (cursor)                   |
| POST   | `/api/v1/chat/tickets/:id*/mensagens`             | Próprio/Atendente  | Envia (fallback HTTP do WS)          |
| PUT    | `/api/v1/chat/tickets/:id*/encerrar`              | Atendente          | Encerra ticket                       |
| PUT    | `/api/v1/chat/tickets/:id*/transferir`            | Atendente/ADMIN    | Transfere para outro atendente       |
| GET    | `/api/v1/chat/tickets/fila`                       | Atendente/ADMIN    | Tickets pendentes (FIFO + prioridade)|

**`POST /api/v1/chat/tickets` — Request:**

```json
{
  "categoria": "ANSIEDADE | DESEMPENHO | DUVIDA_ACADEMICA | OUTRO",
  "urgencia": "BAIXA | MEDIA | ALTA",
  "descricaoInicial": "Texto livre (até 2000 caracteres)",
  "anonimo": false
}
```

**Response 201:** `{ id, categoria, status: "ABERTO", criadoEm }`.
**Side effects:** notifica fila de atendentes via WS `/notificacoes` (sala `atendentes`).

> Comunicação em tempo real via namespace WebSocket `/chat` (ver [§7.3](#73-eventos)).
> Mensagens são persistidas no Postgres antes do broadcast.

**LGPD:** mensagens são criptografadas em repouso (Supabase pgcrypto) e expostas apenas a
participantes do ticket. Auditoria registra acesso (`CHAT_MENSAGEM_LIDA`).

---

### 8.17 Chatbot IA (RF16)

**Modelos:** `ChatbotConversa`, `ChatbotMensagem`

| Método | Rota                                                | Papel                      | Descrição                       |
| ------ | --------------------------------------------------- | -------------------------- | ------------------------------- |
| POST   | `/api/v1/chatbot/conversas`                         | Público (anonimizado)      | Inicia conversa                 |
| GET    | `/api/v1/chatbot/conversas/:id`                     | Token de sessão            | Recupera conversa               |
| POST   | `/api/v1/chatbot/conversas/:id/mensagens`           | Token de sessão            | Envia mensagem (sync)           |
| GET    | `/api/v1/chatbot/conversas/:id/mensagens`           | Token de sessão            | Histórico                       |
| DELETE | `/api/v1/chatbot/conversas/:id`                     | Token de sessão            | Encerra + descarta              |
| POST   | `/api/v1/chatbot/conversas/:id/avaliar`             | Token de sessão            | Avalia utilidade (1-5)          |

**`POST /api/v1/chatbot/conversas` — Request:**

```json
{
  "faixaEtaria": "17-20 | 21-25 | 26+",
  "cursoCategoria": "EXATAS | HUMANAS | SAUDE | TECNOLOGIA",
  "topico": "ANSIEDADE_PROVAS | TEMPO_ESTUDO | RELACIONAMENTO | OUTRO"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "tokenSessao": "jwt_curto_1h",
  "primeiraResposta": "Olá! Vou te ajudar com..."
}
```

**Regras críticas (LGPD + RF16):**
1. **Não vincular** conversa ao `usuarioId` mesmo se autenticado.
2. **Não persistir** dados sensíveis identificáveis — pipeline de PII redaction antes do
   armazenamento.
3. Conversa é **descartada após 30 dias** automaticamente (job).
4. Avaliação é separada e nunca correlacionável.

> Streaming de resposta IA via namespace WebSocket `/chatbot` (ver [§7.3](#73-eventos)).

**Rate limit:** 20 mensagens / minuto / sessão.

---

### 8.18 LGPD e Auditoria (RNF09)

**Modelos:** `ConsentimentoLgpd`, `AuditoriaDado`

#### Consentimentos

| Método | Rota                                                | Papel    | Descrição                            |
| ------ | --------------------------------------------------- | -------- | ------------------------------------ |
| GET    | `/api/v1/lgpd/consentimentos/me`                    | —        | Lista consentimentos ativos          |
| POST   | `/api/v1/lgpd/consentimentos`                       | —        | Concede/atualiza consentimento       |
| DELETE | `/api/v1/lgpd/consentimentos/:tipo`                 | —        | Revoga (anonimização parcial async)  |
| GET    | `/api/v1/lgpd/termos`                               | Pub.     | Lista termos vigentes (versão atual) |
| GET    | `/api/v1/lgpd/termos/:tipo/:versao`                 | Pub.     | Texto do termo                       |

#### Direitos do titular

| Método | Rota                                                | Papel       | Descrição                          |
| ------ | --------------------------------------------------- | ----------- | ---------------------------------- |
| POST   | `/api/v1/lgpd/exportar-dados`                       | —           | Solicita export (SLA 48h)          |
| GET    | `/api/v1/lgpd/exportacoes/:id`                      | Próprio     | Status + URL                       |
| POST   | `/api/v1/lgpd/excluir-conta`                        | —           | Solicita exclusão (31 dias)        |
| DELETE | `/api/v1/lgpd/excluir-conta`                        | —           | Cancela solicitação (até prazo)    |

#### Auditoria

| Método | Rota                                                | Papel              | Descrição                          |
| ------ | --------------------------------------------------- | ------------------ | ---------------------------------- |
| GET    | `/api/v1/auditoria/logs`                            | ADMIN              | Trilha completa filtrável          |
| GET    | `/api/v1/auditoria/logs/:usuarioId*`                | Próprio/ADMIN      | Logs por sujeito de dados          |
| GET    | `/api/v1/auditoria/logs/entidade/:nome/:id`         | ADMIN              | Logs de uma entidade               |

**`GET /api/v1/auditoria/logs` — Filtros:**

```
?ator=&acao=CREATE,UPDATE&entidade=PlanoEstudo
&dataInicio=2026-04-01&dataFim=2026-04-21&page=1&limit=50
```

**Imutabilidade:** registros de auditoria são append-only — `PUT/DELETE` não são providos.

---

## 9. Anexos

### 9.1 Matriz RF ↔ Endpoints

| RF   | Funcionalidade                       | Endpoints principais                                                |
| ---- | ------------------------------------ | ------------------------------------------------------------------- |
| RF01 | Cadastro + Login (SSO FAESA)         | `POST /auth/register`, `/auth/login`, `/auth/sso/faesa`             |
| RF02 | Plano de Estudos Personalizado       | `POST /planos`, `GET/PUT /planos/:id`                               |
| RF03 | Cronograma Interativo (drag-drop)    | `PUT /planos/:id/cronograma`                                        |
| RF04 | Exercícios de Concentração           | `POST /exercicios/iniciar`, `PUT /exercicios/:id/finalizar`         |
| RF05 | Dashboard de Progresso               | `GET /dashboard/me`, `/dashboard/progresso-semanal`                 |
| RF06 | Biblioteca de Recursos               | `GET /recursos`, `POST /recursos/:id/concluir`                      |
| RF07 | Trilhas de Aprendizagem              | `GET /trilhas`, `POST /trilhas/:id/iniciar`                         |
| RF08 | Fórum de Discussão                   | `POST /forum/discussoes`, `/forum/discussoes/:id/posts`             |
| RF09 | Sistema de Mentoria                  | `POST /mentorias/solicitar`, WS `/mentoria`                         |
| RF10 | Notificações e Lembretes             | `GET /notificacoes`, WS `/notificacoes`                             |
| RF11 | Avaliação de Bem-Estar               | `POST /bem-estar/respostas`, `GET /bem-estar/historico`             |
| RF12 | Atividades Extracurriculares         | `GET /eventos`, `POST /eventos/:id/inscrever`                       |
| RF13 | Gamificação (pontos/badges/ranking)  | `GET /gamificacao/me`, `/gamificacao/ranking`                       |
| RF14 | Relatórios Agregados (Coordenação)   | `GET /relatorios/engajamento`, `/relatorios/bem-estar`              |
| RF15 | Chat com Suporte Psicopedagógico     | `POST /chat/tickets`, WS `/chat`                                    |
| RF16 | Chatbot IA (anonimizado)             | `POST /chatbot/conversas`, WS `/chatbot`                            |

### 9.2 Tabela de códigos de erro

| Code                          | HTTP | Significado                                                  |
| ----------------------------- | :--: | ------------------------------------------------------------ |
| `VALIDATION_FAILED`           | 400  | Falha de validação de schema                                 |
| `INVALID_JSON`                | 400  | JSON malformado                                              |
| `AUTH_REQUIRED`               | 401  | JWT ausente                                                  |
| `AUTH_INVALID`                | 401  | JWT inválido/expirado                                        |
| `AUTH_REVOKED`                | 401  | Token revogado (logout/blacklist)                            |
| `FORBIDDEN`                   | 403  | Sem permissão (papel/RLS)                                    |
| `LGPD_CONSENT_MISSING`        | 403  | Operação requer consentimento não concedido                  |
| `RESOURCE_NOT_FOUND`          | 404  | Recurso inexistente                                          |
| `RESOURCE_OWNED_BY_OTHER`     | 404  | (mascarado p/ não vazar existência)                          |
| `RESOURCE_CONFLICT`           | 409  | Violação de unicidade                                        |
| `STATE_INVALID`               | 409  | Estado da máquina não permite a operação                     |
| `RESOURCE_GONE`               | 410  | Recurso anonimizado/excluído                                 |
| `SEMANTIC_VALIDATION`         | 422  | Validação semântica (regra de negócio)                       |
| `ACCOUNT_LOCKED`              | 423  | Conta suspensa                                               |
| `RATE_LIMIT_EXCEEDED`         | 429  | Limite de requisições                                        |
| `LGPD_BLOCKED`                | 451  | Conteúdo bloqueado por LGPD                                  |
| `INTERNAL_ERROR`              | 500  | Erro não tratado                                             |
| `UPSTREAM_ERROR`              | 502  | Falha em serviço externo (Supabase/Upstash/IA)               |
| `MAINTENANCE`                 | 503  | Manutenção programada                                        |
| `UPSTREAM_TIMEOUT`            | 504  | Timeout em integração                                        |

### 9.3 Glossário

| Termo                | Definição                                                                  |
| -------------------- | -------------------------------------------------------------------------- |
| **JWT**              | JSON Web Token — credencial portadora assinada                             |
| **RBAC**             | Role-Based Access Control — autorização por papel                          |
| **RLS**              | Row-Level Security — política de acesso por linha no Postgres              |
| **k-anonimato**      | Garantia de que cada registro é indistinguível de pelo menos k–1 outros    |
| **PII redaction**    | Remoção/mascaramento de dados pessoais identificáveis                      |
| **Cache-aside**      | Padrão: app consulta cache, em miss consulta BD e popula                   |
| **At-least-once**    | Garantia de entrega: cada mensagem pode ser entregue ≥ 1 vez               |
| **Soft delete**      | Marcação `ativo=false` sem remoção física                                  |
| **Bulk**             | Operação em lote (múltiplos registros em uma chamada)                      |

### 9.4 Referências

#### Internas
- [`banco-dados-requisitos-projeto/prisma/schema.prisma`](../banco-dados-requisitos-projeto/prisma/schema.prisma)
- [`docs/relatorios faesa/especificacao-requisitos-entrega-01.md`](relatorios%20faesa/especificacao-requisitos-entrega-01.md)
- [`docs/relatorios faesa/entrega-der-fase-2-site-acolhimento-faesa.md`](relatorios%20faesa/entrega-der-fase-2-site-acolhimento-faesa.md)
- [`docs/relatorio-tecnologias-banco-persistencia.md`](relatorio-tecnologias-banco-persistencia.md)
- [`docs/documento-banco-de-dados-tecnologias.md`](documento-banco-de-dados-tecnologias.md)
- [`site_acolhimento_faesa.tex`](../site_acolhimento_faesa.tex)

#### Externas (alta confiabilidade — documentação oficial)
- [NestJS — Documentation](https://docs.nestjs.com/)
- [Prisma — Reference](https://www.prisma.io/docs)
- [Supabase — Auth + RLS](https://supabase.com/docs/guides/auth)
- [Upstash — Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Socket.io — Server API](https://socket.io/docs/v4/server-api/)
- [LGPD — Lei 13.709/2018 (Planalto)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x00-introduction/)
- [RFC 7231 — HTTP/1.1 Semantics](https://datatracker.ietf.org/doc/html/rfc7231)
- [RFC 9457 — Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457)

---

**Fim do documento.**
