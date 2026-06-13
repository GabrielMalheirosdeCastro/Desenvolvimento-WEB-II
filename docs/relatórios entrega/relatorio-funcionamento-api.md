# Relatório de Funcionamento da API — Site de Acolhimento FAESA

**Data:** 2026-06-13
**Autor:** Gabriel Malheiros de Castro
**Disciplina:** Desenvolvimento de Aplicações Web II (D001508) — FAESA Campus Vitória
**Versão do projeto:** 1.3.0
**Componente avaliado:** Camada de API REST (`apps/api/`)

---

## 1. Objetivo do Relatório

Este documento explica **como a API REST do Site de Acolhimento FAESA funciona**, quais endpoints
estão disponíveis, qual a arquitetura adotada e quais foram os resultados da verificação prática
executada em ambiente local. Serve como material de apresentação técnica para o docente.

---

## 2. Visão Geral da Arquitetura

A API é construída em **Node.js** com o framework **Express 4**, organizada em três módulos com
responsabilidades bem separadas:

| Arquivo | Responsabilidade |
|---------|------------------|
| `apps/api/server.js` | Inicialização do servidor, healthcheck, versão, serviço da SPA e *graceful shutdown*. |
| `apps/api/routes.js` | Roteador REST com todos os endpoints de negócio (`/api/*`). |
| `apps/api/db.js` | Pool de conexão PostgreSQL compartilhado e função de query parametrizada. |

### 2.1 Fluxo de uma requisição

```
Cliente (SPA React)
      │  HTTP GET/POST
      ▼
server.js  ── /healthz, /version (monitoramento)
      │
      ├── /api/*  ───►  routes.js  ───►  db.js  ───►  PostgreSQL (Supabase VPS)
      │                    │                              │
      │                    └── se banco indisponível ─────┘
      │                         devolve fallback estático
      ▼
express.static(apps/web/dist)  ── serve a SPA buildada
      │
      └── fallback SPA: rotas desconhecidas devolvem index.html (React Router)
```

### 2.2 Princípio de Resiliência (*Graceful Degradation*)

O diferencial central do design é a **resiliência a indisponibilidade de banco de dados**. Cada
endpoint segue o padrão:

1. Tenta executar a query no PostgreSQL através de `db.js`.
2. Se o pool estiver conectado **e** houver resultado → responde com `"source": "db"`.
3. Se a variável `DATABASE_URL` estiver ausente **ou** a query falhar → responde com dados
   estáticos coerentes marcados com `"source": "fallback"`.

Esse mecanismo permite **demonstrar a aplicação completa sem depender do banco de produção**,
essencial em ambiente acadêmico e em estações de desenvolvimento sem PostgreSQL local.

---

## 3. Endpoints Disponíveis

### 3.1 Endpoints de Infraestrutura (monitoramento)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/healthz` | Healthcheck completo (status, versão, Node, *uptime*, timestamp). |
| `GET` | `/version` | Retorna nome e versão do projeto (validação de redeploy). |

### 3.2 Endpoints de Negócio (`/api`)

| Método | Rota | Finalidade | Requisito |
|--------|------|-----------|-----------|
| `GET` | `/api/_status` | Indica se o banco está `connected` ou em `fallback`. | — |
| `GET` | `/api/me` | Retorna a persona logada (protótipo, sem autenticação real). | — |
| `GET` | `/api/dashboard/upcoming` | Próximas atividades de estudo do usuário. | RF — Dashboard |
| `GET` | `/api/dashboard/week` | Horas de estudo da semana corrente (Seg–Dom). | RF — Dashboard |
| `GET` | `/api/dashboard/streak` | Sequência atual e recorde de estudo (gamificação). | RF — Gamificação |
| `GET` | `/api/dashboard/badges` | Conquistas recentes do usuário. | RF — Gamificação |
| `GET` | `/api/eventos` | Eventos institucionais (palestras, oficinas). | RF12 / Gap G4 |
| `POST` | `/api/lgpd/consentimento` | Registra aceite do termo LGPD. | RNF09 / Gap G5 |
| `GET` | `/api/mentorias?papel=mentor` | Lista mentores cadastrados. | US04 / Gap GP-1 |
| `POST` | `/api/mentorias/cadastro-mentor` | Marca a persona logada como mentor. | US04 / Gap GP-1 |

### 3.3 Roteamento da SPA

Qualquer rota não atendida pelos itens acima devolve o `index.html` da SPA React buildada
(`apps/web/dist`), delegando o roteamento ao **React Router** no lado do cliente.

---

## 4. Detalhes Técnicos Relevantes

### 4.1 Segurança das Queries

Todas as consultas usam **queries parametrizadas** (`$1`, `$2`, …) através do driver `pg`,
prevenindo **injeção de SQL** (OWASP A03). Nenhuma concatenação de string com entrada do usuário
é feita na construção de SQL.

```js
// Exemplo de query.parametrizada (apps/api/db.js)
const result = await pool.query(sql, params); // params = ['23110145']
```

### 4.2 Tratamento de Entrada no POST LGPD

O endpoint `POST /api/lgpd/consentimento` sanitiza e limita o tamanho de todos os campos
recebidos do cliente antes de persistir, evitando dados maliciosos ou excessivamente grandes:

```js
const finalidade = String(req.body?.finalidade || 'uso_geral').slice(0, 80);
const versaoTermo = String(req.body?.versaoTermo || '1.0').slice(0, 16);
const ip = (...).toString().slice(0, 64);
const ua = String(req.headers['user-agent'] || '').slice(0, 255);
```

### 4.3 Pool de Conexão

O pool PostgreSQL é configurado com limite de 5 conexões, *timeout* de conexão de 5s e
*idle timeout* de 30s. Em rede interna (`supabase-pooler`/`localhost`) o SSL é desativado;
em conexões externas, SSL é aplicado.

### 4.4 Encerramento Gracioso (*Graceful Shutdown*)

O servidor escuta os sinais `SIGTERM` e `SIGINT` (enviados pelo Docker/EasyPanel em cada
redeploy), encerrando as conexões abertas de forma ordenada antes de finalizar o processo.

---

## 5. Verificação Prática (Testes Executados)

Os testes foram realizados em **2026-06-13** na estação de desenvolvimento (Windows 11), com o
servidor rodando em `http://localhost:3010`. Como a estação **não possui PostgreSQL local**, todos
os endpoints responderam em **modo fallback** — comportamento esperado e correto.

### 5.1 Resultados — Endpoints GET

| Endpoint | Status HTTP | `source` | Resultado |
|----------|:-----------:|----------|-----------|
| `/healthz` | `200` | — | OK (v1.3.0, Node v22.20.0) |
| `/version` | `200` | — | OK |
| `/api/_status` | `200` | `db: fallback` | OK |
| `/api/me` | `200` | `fallback` | OK |
| `/api/dashboard/upcoming` | `200` | `fallback` | OK |
| `/api/dashboard/week` | `200` | `fallback` | OK |
| `/api/dashboard/streak` | `200` | `fallback` | OK |
| `/api/dashboard/badges` | `200` | `fallback` | OK |
| `/api/eventos` | `200` | `fallback` | OK |
| `/api/mentorias?papel=mentor` | `200` | `fallback` | OK |

### 5.2 Resultados — Endpoint POST e Rota Inexistente

| Endpoint | Método | Status HTTP | Resultado |
|----------|--------|:-----------:|-----------|
| `/api/lgpd/consentimento` | `POST` | `200` | `persisted: false` (banco indisponível, aceite no cliente) |
| `/api/rota-inexistente` | `GET` | `200` | Cai no fallback SPA (`text/html`) — correto por design |

### 5.3 Exemplo de Resposta Real

```json
// GET /healthz
{
  "status": "ok",
  "service": "site-acolhimento-faesa",
  "version": "1.3.0",
  "env": "development",
  "node": "v22.20.0",
  "uptime_s": 35,
  "timestamp": "2026-06-13T16:25:49.959Z"
}
```

```json
// GET /api/dashboard/streak
{ "source": "fallback", "atual": 12, "recorde": 18, "ultima": null }
```

```json
// POST /api/lgpd/consentimento
{
  "source": "fallback",
  "persisted": false,
  "consentiu": true,
  "finalidade": "teste",
  "versaoTermo": "1.0",
  "mensagem": "Banco indisponível — aceite registrado apenas no cliente."
}
```

---

## 6. Conclusão

A camada de API **está funcionando corretamente**. Todos os 12 endpoints testados responderam
com `HTTP 200`, e o mecanismo de *fallback* operou conforme projetado quando o banco de dados
não está disponível.

### Pontos fortes demonstrados

- Arquitetura modular com separação clara de responsabilidades.
- Resiliência a indisponibilidade de banco (*graceful degradation*).
- Queries parametrizadas (proteção contra injeção de SQL).
- Sanitização de entrada no endpoint de escrita (LGPD).
- Healthcheck e versionamento para monitoramento e validação de deploy.
- Encerramento gracioso compatível com o ambiente Docker/EasyPanel.

### Ressalva (escopo da validação)

Os ramos de código que executam **SQL real** (`"source": "db"`) **não foram exercitados** neste
teste, pois a estação não possui banco conectado. Para validar as queries contra o schema
PostgreSQL de produção, é necessário:

1. Abrir o túnel SSH para a VPS (`scripts/dev-tunnel.ps1`).
2. Definir `DATABASE_URL` no arquivo `.env`.
3. Repetir os testes e confirmar que `/api/_status` retorna `db: connected` e os endpoints
   retornam `"source": "db"`.

---

## 7. Como Reproduzir os Testes

```powershell
# 1. Subir o servidor da API
node apps/api/server.js

# 2. Em outro terminal, testar os endpoints GET
$base = "http://localhost:3010"
$endpoints = @("/healthz","/version","/api/_status","/api/me",
  "/api/dashboard/upcoming","/api/dashboard/week","/api/dashboard/streak",
  "/api/dashboard/badges","/api/eventos","/api/mentorias?papel=mentor")
foreach ($e in $endpoints) {
  $r = Invoke-WebRequest -Uri "$base$e" -UseBasicParsing -TimeoutSec 5
  Write-Host ("[{0}] GET {1}" -f $r.StatusCode, $e)
  Write-Host $r.Content
}

# 3. Testar o endpoint POST de consentimento LGPD
Invoke-WebRequest -Uri "$base/api/lgpd/consentimento" -Method Post `
  -ContentType "application/json" `
  -Body '{"finalidade":"teste","versaoTermo":"1.0"}' -UseBasicParsing
```
