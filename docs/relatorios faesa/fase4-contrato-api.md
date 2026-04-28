# Fase 4 — Análise de Requisitos Técnicos: Contrato API + Matriz Feature×Schema

> **Data:** 2026-04-28
> **Fase:** 4 — Análise de Requisitos Técnicos
> **Plano de referência:** [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md)
> **Insumos:** [Fase 2](fase2-matriz-rotas-rf.md), [Fase 3](fase3-personas-rotas.md), [schema.prisma](../../banco-dados-requisitos-projeto/prisma/schema.prisma)

---

## 1. Stack do Backend (decisões consolidadas)

| Camada | Escolha | Justificativa |
|--------|---------|---------------|
| Runtime | Node.js 20 (já em uso) | Já no Dockerfile, alinhado com EasyPanel |
| Framework | **Express 4.21.2** (manter) | App atual já usa, sem necessidade de NestJS para v1.0.0 |
| ORM | **Prisma** (já em uso, será migrado para postgres) | Schema 30+ modelos pronto |
| Validação | **zod** (a adicionar) | Validar bodies de POST contra schemas tipados |
| Banco | **PostgreSQL 17.6** via Supabase self-hosted (VPS) | Decisão B2 / Fase 1 |
| Auth | **NENHUMA** (decisão B4) | Endpoints públicos no v1.0.0; usuário fixo via header `X-User-Id` ou seed |
| Padrão de resposta | JSON `{data, error}` | Simples, sem overengineering |
| CORS | Mesma origem (Express serve a SPA) | Sem CORS necessário |

**Observação sobre auth no v1.0.0:** sem auth real, a API precisa de uma estratégia simulada. **Escolha técnica:** todos os endpoints aceitam header `X-User-Id` (default 1 = usuário do seed "Lucas Calouro"). Isso permite testar o lado mentora (item 8c) trocando o header.

---

## 2. Endpoints REST do v1.0.0

Convenção: prefixo `/api`, kebab-case nas rotas, JSON em todos os payloads.

### 2.1 Mapeamento por Rota Figma

| Rota Figma | Endpoints consumidos | Método | Schema (Prisma) |
|------------|----------------------|--------|-----------------|
| `/dashboard` (DashboardHome) | `/api/dashboard/resumo` | GET | `Usuario` + `Gamificacao` + agregados |
| | `/api/dashboard/horas-semanais` | GET | `AtividadeEstudo` (group by week) |
| | `/api/dashboard/proximas-atividades` | GET | union de `AtividadeEstudo` + `Mentoria` + `QuestionarioBemEstar` |
| | `/api/notificacoes` | GET | `Notificacao` |
| `/dashboard/plano-estudos` | `/api/planos-estudo` | GET, POST | `PlanoEstudo` |
| | `/api/planos-estudo/:id/metas` | GET, POST | `MetaSemanal` |
| | `/api/planos-estudo/:id/atividades` | GET, POST, PATCH, DELETE | `AtividadeEstudo` |
| | `/api/trilhas` | GET | `TrilhaAprendizagem` |
| `/dashboard/concentracao` | `/api/exercicios-concentracao` | GET | `ExercicioConcentracao` |
| | `/api/exercicios-concentracao/sessoes` | POST | (registra sessão concluída → grava em `AtividadeEstudo`) |
| `/dashboard/mentoria` | `/api/mentorias?papel=mentee` | GET | `Mentoria` (lado mentee) |
| | `/api/mentorias?papel=mentor` | GET | `Mentoria` (lado mentor — item 8c) |
| | `/api/mentorias/cadastro-mentor` | POST | `Usuario` (flag `eMentor=true` ou similar) |
| | `/api/mentorias` | POST | `Mentoria` (criar agendamento) |
| `/dashboard/forum` | `/api/forum/discussoes` | GET, POST | `ForumDiscussao` |
| | `/api/forum/discussoes/:id/posts` | GET, POST | `ForumPost` |
| | `/api/forum/posts/:id/comentarios` | GET, POST | `ForumComentario` |
| `/dashboard/biblioteca` | `/api/recursos` | GET | `Recurso` |
| | `/api/eventos` (item 8a) | GET | `Evento` |
| `/dashboard/perfil` | `/api/usuarios/me` | GET, PATCH | `Usuario` |
| | `/api/gamificacao/me` | GET | `Gamificacao` + `UsuarioConquista` |
| | `/api/lgpd/consentimento` (item 8b) | GET, POST | `ConsentimentoLgpd` |

**Total:** **22 endpoints REST**, agrupados em **7 controllers lógicos**.

### 2.2 Agrupamento por Controller (estrutura `apps/api/routes/`)

```
apps/api/
├── server.js                    # bootstrap + middleware + mount
├── lib/
│   ├── prisma.js                # singleton Prisma Client
│   └── currentUser.js           # middleware lê X-User-Id, default 1
└── routes/
    ├── dashboard.routes.js      # 4 endpoints
    ├── planos-estudo.routes.js  # 4 endpoints
    ├── concentracao.routes.js   # 2 endpoints
    ├── mentoria.routes.js       # 4 endpoints (incl. 8c)
    ├── forum.routes.js          # 3 endpoints
    ├── biblioteca.routes.js     # 2 endpoints (incl. 8a)
    ├── perfil.routes.js         # 3 endpoints (incl. 8b LGPD)
    └── notificacoes.routes.js   # 1 endpoint
```

---

## 3. Contratos JSON (Resumido)

> Padrão: sucesso `{ data: ... }`, erro `{ error: { code, message, details? } }`. Status HTTP segue REST clássico (200/201/400/404/500).

### 3.1 `GET /api/dashboard/resumo`

```json
{
  "data": {
    "usuario": { "id": 1, "nome": "Lucas Calouro", "curso": "Sistemas de Informação", "periodo": 1 },
    "gamificacao": {
      "pontosTotais": 320,
      "rankingPosicao": 12,
      "streakAtual": 5,
      "streakRecorde": 12,
      "conquistasRecentes": [
        { "codigo": "primeiro_plano", "nome": "Primeiro Plano", "icone": "trophy", "desbloqueadoEm": "2026-04-25T10:00:00Z" }
      ]
    },
    "metasSemanais": { "concluidas": 3, "total": 5 },
    "horasEstudoSemana": 8.5
  }
}
```

### 3.2 `GET /api/dashboard/horas-semanais?desde=2026-04-21`

```json
{
  "data": [
    { "data": "2026-04-21", "horas": 1.5 },
    { "data": "2026-04-22", "horas": 2.0 },
    { "data": "2026-04-23", "horas": 0.0 },
    { "data": "2026-04-24", "horas": 3.0 },
    { "data": "2026-04-25", "horas": 2.0 }
  ]
}
```

### 3.3 `GET /api/dashboard/proximas-atividades?limite=5`

```json
{
  "data": [
    { "tipo": "atividade_estudo", "id": 17, "titulo": "Revisar Cálculo I", "quando": "2026-04-29T14:00:00Z" },
    { "tipo": "mentoria", "id": 3, "titulo": "Sessão com Mariana", "quando": "2026-04-30T10:00:00Z" },
    { "tipo": "questionario_bem_estar", "id": 8, "titulo": "Avaliação Semanal", "quando": "2026-05-02T00:00:00Z" }
  ]
}
```

### 3.4 `POST /api/planos-estudo`

```json
// request
{ "titulo": "Plano Q2 2026", "descricao": "Foco em provas N1" }

// response 201
{ "data": { "id": 7, "titulo": "Plano Q2 2026", "criadoEm": "2026-04-28T15:00:00Z" } }
```

### 3.5 `POST /api/planos-estudo/:id/atividades`

```json
// request
{
  "titulo": "Estudar Banco de Dados II",
  "dataAgendada": "2026-04-30T19:00:00Z",
  "duracaoMinutos": 60,
  "disciplinaId": 12
}

// response 201
{ "data": { "id": 42, ... } }
```

### 3.6 `POST /api/exercicios-concentracao/sessoes`

```json
// request
{ "exercicioId": 1, "duracaoMinutos": 25, "concluido": true }

// response 201 — também grava AtividadeEstudo correspondente
{ "data": { "atividadeEstudoId": 88, "pontosGanhos": 10 } }
```

### 3.7 `POST /api/mentorias/cadastro-mentor` (item 8c)

```json
// request
{ "areasAtuacao": ["Psicologia", "Acolhimento"], "biografia": "Veterana..." }

// response 200
{ "data": { "usuarioId": 2, "eMentor": true } }
```

### 3.8 `POST /api/lgpd/consentimento` (item 8b)

```json
// request
{ "versaoTermo": "v1.0.0", "aceito": true }

// response 201
{ "data": { "id": 1, "registradoEm": "2026-04-28T15:00:00Z" } }
```

### 3.9 `GET /api/notificacoes`

```json
{
  "data": [
    { "id": 1, "titulo": "Meta atingida!", "mensagem": "...", "lida": false, "criadaEm": "..." }
  ]
}
```

### 3.10 Padrão de erro

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "duracaoMinutos deve ser positivo", "details": { "field": "duracaoMinutos" } } }
```

---

## 4. Matriz Feature × Schema (Cobertura por Modelo)

| Feature/Rota | Modelos Prisma usados | Operação dominante | Lacunas no schema |
|--------------|------------------------|--------------------|--------------------|
| `/dashboard` resumo | `Usuario`, `Gamificacao`, `MetaSemanal`, `AtividadeEstudo`, `UsuarioConquista`* | READ + agregação | **Streak/Conquista** (item 9) |
| `/dashboard` horas | `AtividadeEstudo` | READ + groupBy(week) | OK (`duracaoMinutos` existe) |
| `/dashboard` próximas | `AtividadeEstudo` ∪ `Mentoria` ∪ `QuestionarioBemEstar` | READ + UNION | OK |
| `/dashboard/plano-estudos` | `PlanoEstudo`, `MetaSemanal`, `AtividadeEstudo`, `TrilhaAprendizagem` | CRUD | OK |
| `/dashboard/concentracao` | `ExercicioConcentracao` + `AtividadeEstudo` (registro) | READ + CREATE | OK |
| `/dashboard/mentoria` (mentee) | `Mentoria`, `Usuario` | READ + CREATE | OK |
| `/dashboard/mentoria` (mentor — 8c) | `Mentoria`, `Usuario` | READ + UPDATE flag | **Falta flag `eMentor` em `Usuario` ou tabela `MentorPerfil`** — confirmar P10 |
| `/dashboard/forum` | `ForumDiscussao`, `ForumPost`, `ForumComentario` | CRUD | OK |
| `/dashboard/biblioteca` | `Recurso`, `Evento` (item 8a) | READ | OK |
| `/dashboard/perfil` | `Usuario`, `Gamificacao`, `ConsentimentoLgpd` | READ + UPDATE + CREATE | OK (após item 9 para conquistas) |
| `NotificationBell` | `Notificacao` | READ + UPDATE (lida) | OK |

(*) modelo a ser criado pela migration `add_streak_and_conquistas` (item 9 do backlog).

---

## 5. Erros Conhecidos do Schema (Lacunas Adicionais)

### 5.1 Achado E-1 — Falta de marcador "é mentor" no `Usuario`

Para o item 8c funcionar, o backend precisa saber **quais usuários são mentores**. Opções:

| Opção | Mudança | Prós/Contras |
|-------|---------|--------------|
| (a) Adicionar coluna `eMentor Boolean @default(false)` em `Usuario` | Migration trivial | Simples, mas mistura papel com perfil |
| (b) Criar tabela `MentorPerfil` (1:1 com `Usuario`) | Migration nova com 5+ campos (`areasAtuacao`, `biografia`, `disponivel`, etc.) | Mais limpo, expansível |
| (c) Inferir mentor pela presença de `Mentoria` onde ele aparece como `mentorId` | Zero migration | Frágil para "sou mentor mas ainda sem mentees" |

**Pendência P10** abaixo.

### 5.2 Achado E-2 — `Notificacao.lida` precisa ser confirmado

A UI do `NotificationBell` separa lidas/não-lidas. Precisa-se confirmar que o modelo `Notificacao` tem flag `lida Boolean` ou equivalente. **A confirmar na próxima leitura do schema** (não-bloqueante para o plano).

### 5.3 Achado E-3 — Versão do termo LGPD

`POST /api/lgpd/consentimento` envia `versaoTermo`. O modelo `ConsentimentoLgpd` precisa ter coluna `versaoTermo String`. **A confirmar.** Se faltar, somar à migration do item 8b.

---

## 6. Cobertura RNF (Requisitos Não-Funcionais) no v1.0.0

| RNF | Como será atendido | Status v1.0.0 |
|-----|--------------------|----------------|
| RNF01 Responsividade | Tailwind 4 + Radix (Figma já entrega) | 🟢 |
| RNF02 Performance ≤3s | Vite build estático + Express servindo `dist/` | 🟢 esperado |
| RNF03 Segurança (OAuth, TLS, XSS, CSRF) | TLS via Traefik. **OAuth/auth real fora do escopo (B4).** Helmet + sanitização básica. | 🟡 parcial |
| RNF04 Acessibilidade WCAG 2.1 AA | Radix UI tem boa base ARIA. **Auditoria formal fica fora do escopo.** | 🟡 base |
| RNF05 Disponibilidade 99.5% | EasyPanel + healthcheck + autorestart Docker | 🟢 |
| RNF06 Escalabilidade 10k usuários | **Não testado.** Serve 1 usuário no protótipo. | 🔴 fora |
| RNF07 Manutenibilidade | Monorepo `apps/web`+`apps/api`, Prisma, ESM | 🟢 |
| RNF08 Internacionalização | pt-BR fixo no protótipo | 🔴 fora |
| **RNF09 LGPD** | Modal item 8b + tabela `ConsentimentoLgpd` | 🟢 |
| RNF10 Backup | Supabase self-hosted backups (infra VPS, não no app) | 🟢 herda |

---

## 7. Pendência Nova (P10)

| ID | Pergunta | Por quê |
|----|----------|---------|
| **P10** | Como marcar usuário como mentor (item 8c)? **(a) Coluna `eMentor` em `Usuario`** (mínimo, ~10 min) / **(b) Tabela nova `MentorPerfil`** (mais limpo, ~30 min) / **(c) Inferir por FK em `Mentoria`** (zero migration, mas frágil) | Define se a migration de v1.0.0 ganha mais um delta. Afeta itens 8c + 9. |

---

## 8. Resumo Executivo

- **22 endpoints REST** definidos em **7 controllers** dentro de `apps/api/routes/`.
- **Stack:** Express + Prisma + Postgres + zod (validação). Sem auth real (B4), sem CORS (mesma origem), sem GraphQL/tRPC.
- **Header `X-User-Id`** simula identidade no protótipo.
- **3 lacunas técnicas** mapeadas (E-1 mentor, E-2 notificação.lida, E-3 versão termo LGPD). Apenas E-1 é bloqueante e gera **P10**.
- **RNFs:** 6 verdes, 2 parciais, 2 fora de escopo. RNF09 (LGPD) garantido pelo item 8b.
- **Itens do backlog impactados:** itens 7, 8, 8a, 8b, 8c (todos os de implementação API/UI).

---

## 9. Próximos Passos

1. ✋ Aguardar decisão **P10** (marcador de mentor).
2. Confirmar achados E-2 e E-3 numa leitura rápida do schema antes da Fase 7.
3. Avançar para **Fase 5 (Análise de Infraestrutura)** — planejar migração sqlite→postgres, monorepo, Dockerfile multi-stage. **Pré-requisito:** túnel SSH testado manualmente.
