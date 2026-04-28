# Fase 3 — Análise de Negócios: Personas × Rotas × Histórias de Usuário

> **Data:** 2026-04-28
> **Fase:** 3 — Análise de Negócios
> **Plano de referência:** [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md)
> **Insumos:** [site_acolhimento_faesa.tex](../../site_acolhimento_faesa.tex) §3 (Personas e US01–US08), [docs/relatorios faesa/fase2-matriz-rotas-rf.md](fase2-matriz-rotas-rf.md)

---

## 1. Personas do LaTeX

| ID | Persona | Idade | Papel | Necessidade-chave | Dor principal |
|----|---------|-------|-------|-------------------|---------------|
| **P-A** | **Lucas** (Calouro) | 18 | Aluno SI 1º período | Organizar horários e adaptar-se à rotina | Sentir-se perdido com volume de disciplinas |
| **P-B** | **Mariana** (Veterana/Mentora) | 22 | Aluna Psicologia 7º período | Compartilhar experiências e mentorar | Falta de canal estruturado |
| **P-C** | **Prof. Ricardo** (Coordenador) | 45 | Coordenador de curso | Acompanhar engajamento e bem-estar | Dados dispersos, sem visão consolidada |

> **Diagrama de Casos de Uso (LaTeX §4)** acrescenta um 4º ator: **Admin** (operacional). Não há persona detalhada para ele — entra como "ator técnico", fora do escopo v1.0.0.

---

## 2. Cobertura das Personas no v1.0.0

| Persona | Status no v1.0.0 | Justificativa |
|---------|------------------|---------------|
| **P-A Lucas (Aluno)** | 🟢 **Persona primária** | Decisão B4 (`/` → `/dashboard`) trata o aluno como usuário único. 100% das 8 rotas de dashboard são desenhadas para ele. |
| **P-B Mariana (Mentora)** | 🟡 **Cobertura parcial** | A rota `/dashboard/mentoria` existe, mas Figma desenha o lado **mentee** (busca + agenda mentor). Lado **mentor** (cadastro/oferta de slots) **não tem UI**. |
| **P-C Prof. Ricardo (Coordenador)** | 🔴 **Fora de escopo** | RF14 (Relatórios) já adiada para v2.0.0. Persona ≠ aluno + exige auth real (incompatível com B4). |

---

## 3. Matriz Persona × Rota × RF (Cobertura Funcional)

| Rota | P-A Lucas | P-B Mariana (mentora) | P-C Ricardo (coord) | RFs |
|------|-----------|------------------------|---------------------|-----|
| `/` LoginPage | 🟢 redirect direto | 🟢 redirect direto | 🔴 sem distinção de papel | RF01 (parcial) |
| `/dashboard` | 🟢 visão completa | 🟡 visão de aluno (sem painel de mentees) | 🔴 sem painel agregado | RF05, RF13, RF10 |
| `/dashboard/plano-estudos` | 🟢 | 🟢 (também é aluna) | 🔴 | RF02, RF03, RF07 |
| `/dashboard/concentracao` | 🟢 | 🟢 | 🔴 | RF04 |
| `/dashboard/mentoria` | 🟢 buscar mentor | 🟡 só visão de mentee — **sem aba "Sou mentora"** | 🔴 | RF09 |
| `/dashboard/forum` | 🟢 | 🟢 | 🔴 sem moderação/visão admin | RF08 |
| `/dashboard/biblioteca` | 🟢 | 🟢 | 🔴 sem curadoria | RF06, RF12 (após 8a) |
| `/dashboard/perfil` | 🟢 + LGPD modal (8b) | 🟢 + LGPD modal (8b) | 🔴 | RF13 (parcial), RNF09 |
| `*` NotFound | N/A | N/A | N/A | — |

**Conclusões:**
- **P-A Lucas** é atendido por **8/8 rotas autenticadas** = 100% do v1.0.0.
- **P-B Mariana** tem **gap funcional na rota `/dashboard/mentoria`** (lado mentor ausente).
- **P-C Ricardo** **não tem rota alguma** no v1.0.0.

---

## 4. Cobertura das Histórias de Usuário (US01–US08)

| US | Persona implícita | RF | Rota Figma | Status v1.0.0 |
|----|-------------------|----|----|----------------|
| US01 — Plano de estudos semanal | P-A Lucas | RF02 | `/dashboard/plano-estudos` | 🟢 |
| US02 — Exercícios de concentração | P-A | RF04 | `/dashboard/concentracao` | 🟢 |
| US03 — Visualizar progresso | P-A | RF05 | `/dashboard` | 🟢 |
| US04 — Cadastrar-se como mentora | **P-B Mariana** | RF09 | `/dashboard/mentoria` | 🔴 **GAP** — UI só tem lado mentee |
| US05 — Relatórios de engajamento | **P-C Ricardo** | RF14 | — | 🔴 **adiado v2.0.0** |
| US06 — Lembretes de metas | P-A | RF10 | `NotificationBell` (header) | 🟢 |
| US07 — Acessar biblioteca | P-A | RF06 | `/dashboard/biblioteca` | 🟢 |
| US08 — Ganhar badges | P-A | RF13 | `/dashboard` + `/dashboard/perfil` | 🟢 (depende item 9) |

**Resultado:** **6/8 US cobertas** no v1.0.0. **US04 e US05** ficam pendentes.

---

## 5. Gaps de Persona Identificados

### 5.1 GP-1 — Lado Mentora ausente (US04, P-B Mariana)

**Sintoma:** Schema Prisma tem o modelo `Mentoria` com FK para mentor (Usuario) e mentee (Usuario), mas Figma `MentorshipPage.tsx` só renderiza o fluxo **buscar mentor** (perspectiva do aluno). Não há:
- Aba/seção "Sou mentora" para Mariana se cadastrar.
- Listagem de mentees atribuídos.
- Configuração de slots/disponibilidade.

**Decisão técnica recomendada:**
- **Opção A (mínima, recomendada para v1.0.0):** Adicionar **toggle/aba "Buscar mentor | Sou mentor(a)"** no `MentorshipPage` cobrindo apenas: cadastro como mentor, listar mentees pendentes. Sem agenda complexa. **Bump PATCH**, ~2h.
- **Opção B:** Adiar tudo para v1.1.0. Documentar US04 como dívida.
- **Opção C:** Página dedicada `/dashboard/mentoria/sou-mentor`. Mais limpo, mais esforço (~4h).

### 5.2 GP-2 — Persona Coordenador inexistente no v1.0.0 (US05, P-C Ricardo)

**Sintoma:** Sem rota, sem auth real, sem painel admin. Já estava adiada na Fase 2 (RF14 → v2.0.0). Confirmação aqui.

**Decisão:** Manter adiamento. Documentar persona P-C como **excluída do v1.0.0**.

### 5.3 GP-3 — Ator Admin (Casos de Uso §4 LaTeX) sem persona

**Sintoma:** O diagrama de casos de uso lista 4 atores; o LaTeX só detalha 3 personas. Admin é ator operacional sem necessidade de detalhamento neste prototipo.

**Decisão:** Não fazer nada. Anotar como dívida documental para edição futura no Overleaf (opcional).

---

## 6. Cenários de Uso Concretos (Fluxos do v1.0.0)

### Cenário 1 — Onboarding Lucas (P-A) no primeiro acesso

1. Acessa `/` → redirect → `/dashboard`.
2. **Modal LGPD bloqueante** (item 8b) aparece. Aceita.
3. Vê o `DashboardHome` com mocks zerados/seed mínimo.
4. Navega para `/dashboard/plano-estudos`, cria 3 metas semanais (US01).
5. Volta ao dashboard, vê streak=1, badges desbloqueada "Primeiro Plano" (item 9).
6. Recebe notificação no `NotificationBell` (US06).

**Backlog que sustenta:** itens 5, 6, 7, 8, 8b, 9.

### Cenário 2 — Mariana (P-B) no fluxo de mentora

1. Acessa `/` → redirect → `/dashboard`.
2. Navega para `/dashboard/mentoria`.
3. **Hoje (sem GP-1):** só consegue buscar mentor (mesmo sendo veterana).
4. **Com GP-1 resolvido (Opção A):** vê toggle "Sou mentora", habilita perfil, recebe lista de calouros.

### Cenário 3 — Ricardo (P-C) tenta acessar

1. Acessa `/` → redirect → `/dashboard`.
2. Vê o mesmo dashboard de aluno (sem distinção de papel).
3. **Limitação assumida:** sem auth real, sem painel admin. Adiado v2.0.0.

---

## 7. Recomendações para o Backlog (Fase 6)

### Item novo proposto

| # | Item | Arquivos | Critério | Bump |
|---|------|----------|----------|------|
| **8c** | **Gap GP-1 (US04 lado mentora):** adicionar toggle "Buscar mentor / Sou mentor(a)" no `MentorshipPage` consumindo `Mentoria` (ambos os lados da FK) via `GET /api/mentorias?papel=mentor` e `POST /api/mentorias/cadastro-mentor` | `apps/web/src/app/pages/MentorshipPage.tsx`, `apps/api/` (2 endpoints) | Toggle alterna visões; cadastro como mentor persiste e aparece em listagem de outros usuários | PATCH |

### Itens **inalterados** que cobrem cenários

- Items 4, 5, 6, 7, 8 → Cenário 1 do Lucas.
- Items 7 + 8b → Modal LGPD.
- Item 9 → Streak/badges (US08).

### Dívidas formalizadas

| Dívida | Persona | Versão-alvo |
|--------|---------|-------------|
| US04 lado mentora (caso optemos por Opção B/C ou se P-A Lucas absorve tudo) | P-B Mariana | v1.0.0 (8c) **OU** v1.1.0 |
| US05 Relatórios Coordenação | P-C Ricardo | v2.0.0 |
| Ator Admin do caso de uso (§4 LaTeX) | — | v2.0.0 |

---

## 8. Pendência Nova (P9)

| ID | Pergunta | Por quê |
|----|----------|---------|
| **P9** | Como tratar GP-1 (US04 lado mentora) no v1.0.0? **(a) Toggle no MentorshipPage** (item 8c, ~2h, Opção A) / **(b) Adiar para v1.1.0** / **(c) Página dedicada `/dashboard/mentoria/sou-mentor`** (~4h, Opção C) | Define se v1.0.0 cobre 7/8 ou 6/8 das US do LaTeX. Persona P-B fica parcial sem isso. |

---

## 9. Resumo Executivo

- **3 personas no LaTeX**, mas o v1.0.0 atende efetivamente **1 inteira (Lucas)** + **parte da segunda (Mariana sem o lado mentora)**. **Coordenador (Ricardo)** fica para v2.0.0.
- **6 de 8 US cobertas** no v1.0.0 sem nenhum ajuste. **US04** depende da decisão P9. **US05** está adiada.
- Apenas **um sub-item novo (8c)** seria adicionado ao backlog se escolhermos Opção A para P9.
- O diagrama de casos de uso do LaTeX (§4) **continua válido sem edição** — só não é integralmente implementado no v1.0.0.

---

## 10. Próximos Passos

1. ✋ Aguardar decisão **P9** (lado mentora).
2. Se P9-a: adicionar item **8c** ao backlog Fase 6 do plano principal.
3. Avançar para **Fase 4 (Análise de Requisitos Técnicos)** — formalizar contrato dos endpoints `/api/*` e mapeamento Feature × Schema (insumo direto para item 7 do backlog).
