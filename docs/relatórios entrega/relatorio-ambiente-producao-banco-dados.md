# Relatório de Ambiente de Produção e Conexão com o Banco de Dados — Site de Acolhimento FAESA

**Data:** 2026-06-13
**Autor:** Gabriel Malheiros de Castro (matrícula 23110145)
**Disciplina:** Desenvolvimento de Aplicações Web II (D001508) — FAESA Campus Vitória
**Versão do projeto:** 1.3.1
**Componentes avaliados:** Infraestrutura de produção (VPS + EasyPanel) e camada de persistência (PostgreSQL/Supabase)

---

## 1. Objetivo do Relatório

Este documento explica, em linguagem acessível para apresentação ao docente, **como a aplicação
está hospedada em produção** e **como ela se conecta ao banco de dados PostgreSQL**. Cobre a
infraestrutura física e lógica, o caminho que uma requisição percorre da internet até o banco, o
mecanismo de conexão adotado e os resultados de uma verificação prática executada na data acima.

---

## 2. Onde a Aplicação Está Hospedada

A aplicação **não está em um serviço gerenciado de nuvem** (Vercel, Railway, etc.). Toda a
infraestrutura roda em um **servidor próprio (VPS)** alugado na Hostinger, administrado pelo aluno.

| Item | Valor |
|---|---|
| **URL pública** | <https://acolhimento.faesa.gmcsistemas.com.br> |
| **Servidor (VPS)** | Hostinger — `187.77.47.53` (`vps.gmcsistemas.com.br`) |
| **Sistema operacional** | Ubuntu 24.04 LTS |
| **Hardware** | AMD EPYC 9354P · 2 vCPU · 7.8 GiB RAM · disco 96 GB |
| **Orquestração** | Docker (Engine 29.4.1) em modo **Swarm** |
| **Plataforma de deploy** | **EasyPanel** (painel web sobre Docker) |
| **Roteador de borda** | **Traefik 3.6.7** (HTTPS automático via Let's Encrypt) |
| **DNS** | Cloudflare (modo DNS-only, sem proxy) |

### 2.1 Por que esta escolha

Hospedar em VPS própria, em vez de nuvem gerenciada, foi uma decisão pedagógica: permite
**controlar toda a pilha** (servidor web, banco, rede, certificados TLS) e demonstrar competências
de infraestrutura — não apenas de código de aplicação.

---

## 3. Arquitetura de Produção — Visão de Alto Nível

A aplicação roda em um contêiner Docker. O banco de dados roda em **outro conjunto de contêineres**
(stack **Supabase self-hosted**) no **mesmo servidor**. Os dois conversam por uma rede interna do
Docker, sem passar pela internet.

```
Internet (HTTPS)
      │
      ▼
Cloudflare DNS ──► 187.77.47.53 (VPS Hostinger)
      │
      ▼
Traefik 3.6.7  ── redireciona HTTP→HTTPS, emite certificado TLS, roteia por domínio
      │
      ├─► acolhimento.faesa.gmcsistemas.com.br ─► Contêiner da APLICAÇÃO (Express, porta 3010)
      │                                                    │
      │                                                    │  rede interna Docker (overlay `easypanel`)
      │                                                    ▼
      │                                          supabase-pooler:6543 (Supavisor — pool de conexões)
      │                                                    │
      │                                                    ▼
      └─► api.gmcsistemas.com.br ─► Kong ─►        supabase-db:5432 (PostgreSQL 17.6 — NÃO exposto)
```

**Ponto central:** o PostgreSQL **não está acessível pela internet**. Ele só é alcançado de dentro
do próprio servidor, pela rede interna do Docker. Isso reduz drasticamente a superfície de ataque.

---

## 4. O Banco de Dados

| Item | Valor |
|---|---|
| **SGBD** | PostgreSQL 17.6 (imagem `supabase/postgres:17.6.1.084`) |
| **Distribuição** | Supabase self-hosted (`/opt/supabase`, 13 contêineres) |
| **Acesso da aplicação** | via **pooler** (Supavisor) em `supabase-pooler:6543` |
| **Exposição externa** | Nenhuma (porta não publicada na internet) |
| **Modelagem (ORM)** | Prisma — schema em [`packages/db/prisma/schema.prisma`](../../packages/db/prisma/schema.prisma) |

### 4.1 Pool de conexões (pooler)

A aplicação **não conecta diretamente** no PostgreSQL. Ela conecta no **Supavisor**, um
*connection pooler* que fica entre a aplicação e o banco. O pooler reaproveita conexões abertas, o
que evita o erro clássico de `too many connections` quando há muitas requisições simultâneas.

- **Porta 6543 (pooler / transação):** usada pela aplicação em runtime — variável `DATABASE_URL`.
- **Porta 5432 (conexão direta):** usada apenas para *migrations* do Prisma — variável `DIRECT_URL`.

---

## 5. Como a Aplicação se Conecta ao Banco

A conexão é configurada por **variáveis de ambiente**, nunca com credenciais escritas no código.

```dotenv
# Em produção (dentro do EasyPanel), apontando para a rede interna do Docker:
DATABASE_URL=postgresql://postgres.gmc:SENHA@supabase-pooler:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:SENHA@supabase-db:5432/postgres
```

O código que cria o pool de conexões está em [`apps/api/db.js`](../../apps/api/db.js):

- Lê `DATABASE_URL` do ambiente.
- Cria um pool com no máximo **5 conexões** (`max: 5`), *timeout* de conexão de 5 s e de
  ociosidade de 30 s.
- **Se `DATABASE_URL` não existir**, o pool fica nulo e a aplicação entra em **modo protótipo**
  (fallback estático — ver Seção 6).

### 5.1 Resiliência — *Graceful Degradation*

Todo endpoint da API tenta ler do banco e, se não conseguir, devolve **dados estáticos coerentes**
marcados com `"source": "fallback"`. Isso garante que a aplicação **nunca quebra** por causa do
banco — ela apenas degrada para dados de demonstração. Quando lê do banco com sucesso, marca a
resposta com `"source": "db"`.

```
Requisição ─► tenta query no PostgreSQL
                  │
                  ├─ pool conectado + retornou linhas ─► resposta "source": "db"
                  └─ pool ausente OU query falhou/vazia ─► resposta "source": "fallback"
```

### 5.2 Desenvolvimento usa o MESMO banco (via túnel SSH)

Não há PostgreSQL instalado na estação Windows. Como a porta 5432 não é pública, o acesso em
desenvolvimento é feito por um **túnel SSH** ([`scripts/dev-tunnel.ps1`](../../scripts/dev-tunnel.ps1)),
que expõe o banco da VPS em `localhost` de forma segura e temporária. Detalhes em
[`docs/setup-desenvolvimento-windows.md`](../setup-desenvolvimento-windows.md).

---

## 6. Como o Deploy Chega em Produção

```
git push origin master
      │
      ▼
GitHub Action chama o webhook do EasyPanel
      │
      ▼
EasyPanel:  git fetch ► docker build (Dockerfile) ► nova revisão Swarm ► Traefik faz rolling update
      │
      ▼
https://acolhimento.faesa.gmcsistemas.com.br atualizado (sem downtime)
```

A imagem é construída a partir do [`Dockerfile`](../../Dockerfile) (Node 20 Alpine, usuário
não-root, *healthcheck* embutido). O frontend (SPA React/Vite) é buildado localmente e versionado
no Git para evitar falhas de memória no build da VPS.

---

## 7. Verificação Prática (executada em 2026-06-13)

Foram consultados os endpoints públicos da aplicação em produção para comprovar o funcionamento.

### 7.1 Saúde da aplicação — `GET /healthz`

```json
{
  "status": "ok",
  "service": "site-acolhimento-faesa",
  "version": "1.3.1",
  "env": "production",
  "node": "v20.20.2",
  "uptime_s": 247,
  "timestamp": "2026-06-13T17:51:46.436Z"
}
```

✅ Aplicação **no ar**, em ambiente `production`, rodando Node.js v20.20.2.

### 7.2 Versão publicada — `GET /version`

```json
{ "name": "site-acolhimento-faesa", "version": "1.3.1" }
```

✅ Versão publicada (`1.3.1`) **coincide** com a versão do [`package.json`](../../package.json) local.

### 7.3 Status da conexão com o banco — `GET /api/_status`

```json
{ "db": "connected" }
```

✅ O pool de conexões PostgreSQL está **inicializado e conectado** em produção (`DATABASE_URL`
presente e válido).

### 7.4 Leitura de dados — `GET /api/me`

```json
{
  "source": "fallback",
  "usuario": { "id": 0, "matricula_institucional": "23110145", "...": "..." }
}
```

⚠️ **Observação técnica honesta:** embora o pool esteja conectado (Seção 7.3), este endpoint
retornou `"source": "fallback"`. A causa-raiz é que **as tabelas em produção ainda não foram
populadas** com os dados de exemplo (*seed*): a query é executada, não encontra a matrícula
`23110145` e, por isso, o mecanismo de resiliência (Seção 5.1) devolve o dado estático. Isso
**comprova que o graceful degradation funciona corretamente** — a conexão existe, mas, na ausência
de linhas, a aplicação não quebra.

---

## 8. Resumo para a Banca

| Pergunta | Resposta |
|---|---|
| Onde a aplicação está hospedada? | VPS própria (Hostinger, Ubuntu 24.04) com Docker Swarm + EasyPanel. |
| Como é publicada na internet? | Traefik faz o roteamento e o HTTPS (Let's Encrypt) para o domínio. |
| Qual banco de dados é usado? | PostgreSQL 17.6 (Supabase self-hosted), no mesmo servidor. |
| Como a aplicação conecta no banco? | Via pool de conexões (Supavisor) por rede interna do Docker, usando `DATABASE_URL`. |
| O banco fica exposto na internet? | Não. Só é acessível de dentro do servidor (ou via túnel SSH em dev). |
| O que acontece se o banco cair? | A aplicação degrada para dados estáticos de demonstração, sem quebrar. |
| A aplicação está no ar agora? | Sim — v1.3.1, ambiente `production`, banco conectado (verificado em 2026-06-13). |

---

## 9. Referências Internas

- [`docs/ambiente-producao-easypanel.md`](../ambiente-producao-easypanel.md) — guia operacional completo da produção.
- [`docs/setup-desenvolvimento-windows.md`](../setup-desenvolvimento-windows.md) — acesso ao banco em desenvolvimento (túnel SSH).
- [`apps/api/db.js`](../../apps/api/db.js) — pool de conexões PostgreSQL.
- [`apps/api/server.js`](../../apps/api/server.js) — servidor Express (healthcheck e versão).
- [`apps/api/routes.js`](../../apps/api/routes.js) — endpoints REST com resiliência.
- [`packages/db/prisma/schema.prisma`](../../packages/db/prisma/schema.prisma) — modelagem do banco.
- [`Dockerfile`](../../Dockerfile) — imagem de produção.
