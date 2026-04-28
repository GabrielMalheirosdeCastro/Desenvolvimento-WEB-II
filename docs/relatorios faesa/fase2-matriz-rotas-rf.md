# Fase 2 — Análise de Produto: Matriz Rotas Figma × Requisitos LaTeX

> **Data:** 2026-04-28
> **Fase:** 2 — Análise de Produto
> **Plano de referência:** [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md)
> **Insumos:** [site_acolhimento_faesa.tex](../../site_acolhimento_faesa.tex) (RF01–RF15, RNF01–RNF10) e [docs/pagina-acolhimento-faesa/src/app/routes.tsx](../pagina-acolhimento-faesa/src/app/routes.tsx) (9 rotas).

---

## 1. Inventário das Rotas Figma (9)

| # | Rota | Componente | Layout |
|---|------|-----------|--------|
| 1 | `/` | `LoginPage` | `RootLayout` (passthrough) |
| 2 | `/dashboard` | `DashboardHome` | `DashboardLayout` (sidebar + header) |
| 3 | `/dashboard/plano-estudos` | `StudyPlanPage` | `DashboardLayout` |
| 4 | `/dashboard/concentracao` | `ConcentrationPage` | `DashboardLayout` |
| 5 | `/dashboard/mentoria` | `MentorshipPage` | `DashboardLayout` |
| 6 | `/dashboard/forum` | `ForumPage` | `DashboardLayout` |
| 7 | `/dashboard/biblioteca` | `LibraryPage` | `DashboardLayout` |
| 8 | `/dashboard/perfil` | `ProfilePage` | `DashboardLayout` |
| 9 | `*` | `NotFound` | `RootLayout` |

**Componentes transversais relevantes:**
- `NotificationBell` (header do `DashboardLayout`) → atende RF10.

---

## 2. Inventário dos Requisitos Funcionais LaTeX (15)

| ID | Nome | Prioridade |
|----|------|------------|
| RF01 | Cadastro e Login (matrícula FAESA + SSO) | Alta |
| RF02 | Plano de Estudos Personalizado | Alta |
| RF03 | Cronograma Interativo (drag-and-drop) | Alta |
| RF04 | Exercícios de Concentração (Pomodoro, mindfulness) | Alta |
| RF05 | Dashboard de Progresso | Alta |
| RF06 | Biblioteca de Recursos | Média |
| RF07 | Trilhas de Aprendizagem | Média |
| RF08 | Fórum de Discussão | Média |
| RF09 | Sistema de Mentoria | Média |
| RF10 | Notificações e Lembretes | Média |
| RF11 | Avaliação de Bem-estar (questionários) | Média |
| RF12 | Atividades Extracurriculares (eventos externos) | Baixa |
| RF13 | Gamificação (pontos, badges, ranking) | Baixa |
| RF14 | Relatórios para Coordenação (anônimos) | Baixa |
| RF15 | Chat com Suporte Psicopedagógico | Baixa |

---

## 3. Matriz Rota × RF (Cobertura Direta)

| Rota | RF cobertos | Cobertura | Observações |
|------|-------------|-----------|-------------|
| `/` (LoginPage) | RF01 | 🟡 Parcial | UI existe, mas decisão B4 pula auth real no protótipo. Tela passa a ser redirect para `/dashboard` + portal estático com regra 0.1. |
| `/dashboard` (DashboardHome) | RF05, RF13 (parcial), RF10 (parcial) | 🟢 Boa | Mostra progresso, badges, streak, próximas atividades, gráfico de horas. `NotificationBell` no header cobre RF10. |
| `/dashboard/plano-estudos` (StudyPlanPage) | RF02, RF03, RF07 | 🟢 Boa | Drag-and-drop com `react-dnd` (RF03), CRUD do plano (RF02), e visual de trilhas (RF07). |
| `/dashboard/concentracao` (ConcentrationPage) | RF04 | 🟢 Total | Pomodoro, respiração, mindfulness. |
| `/dashboard/mentoria` (MentorshipPage) | RF09 | 🟢 Total | Listagem + agendamento. |
| `/dashboard/forum` (ForumPage) | RF08 | 🟢 Total | Discussões + comentários. |
| `/dashboard/biblioteca` (LibraryPage) | RF06, **RF12 (parcial)** | 🟡 Parcial | Recursos cobertos. **Eventos extracurriculares** ficam ambíguos — sem aba/seção própria, só misturados. |
| `/dashboard/perfil` (ProfilePage) | (RF13 parcial — exibição de badges) | 🟡 Auxiliar | Não cobre RF principal. Local natural para anexar consentimento LGPD (ver Seção 5). |
| `*` (NotFound) | — | N/A | Página 404. |

**Componente transversal:**
- `NotificationBell` → RF10 (UI completa, falta backend).

---

## 4. Matriz RF × Cobertura na UI (Inversa — visão por requisito)

| RF | Coberto por | Status |
|----|-------------|--------|
| RF01 | `/` LoginPage | 🟡 UI existe, sem auth real (B4) |
| RF02 | `/dashboard/plano-estudos` | 🟢 |
| RF03 | `/dashboard/plano-estudos` | 🟢 |
| RF04 | `/dashboard/concentracao` | 🟢 |
| RF05 | `/dashboard` | 🟢 |
| RF06 | `/dashboard/biblioteca` | 🟢 |
| RF07 | `/dashboard/plano-estudos` | 🟢 |
| RF08 | `/dashboard/forum` | 🟢 |
| RF09 | `/dashboard/mentoria` | 🟢 |
| RF10 | `NotificationBell` (header) | 🟡 UI existe, sem backend |
| **RF11** | **— nenhuma rota —** | 🔴 **GAP** |
| RF12 | `/dashboard/biblioteca` (parcial) | 🟡 Sem agregador dedicado de eventos |
| RF13 | `/dashboard` + `/dashboard/perfil` (parcial) | 🟡 Sem ranking dedicado |
| **RF14** | **— nenhuma rota —** | 🔴 **GAP** (público diferente: coordenação) |
| **RF15** | **— nenhuma rota —** | 🔴 **GAP** |

---

## 5. Gaps Identificados

### 5.1 Gaps de UI (RF sem rota Figma)

| Gap | Origem (LaTeX) | Schema Prisma cobre? | Tratamento no protótipo |
|-----|----------------|----------------------|-------------------------|
| **G1 — RF11 Avaliação de Bem-estar** | Questionários periódicos de autoavaliação | ✅ `QuestionarioBemEstar` modelado | **Adiar.** Não entra no v1.0.0. Documentar dívida no plano. |
| **G2 — RF14 Relatórios para Coordenação** | Painel admin com relatórios anonimizados | ✅ `RelatorioAnonimizado` + `AuditoriaDado` modelados | **Adiar.** Persona ≠ aluno. Exige autenticação real (incompatível com B4). |
| **G3 — RF15 Chat com Suporte** | Canal direto com NAP | ✅ `ChatTicket` + `ChatMensagem` modelados | **Adiar.** Requer backend de mensageria (Socket.io) — fora do escopo v1.0.0. |
| **G4 — RF12 Eventos** | Catálogo de cursos/workshops/eventos | ✅ `Evento` modelado | **Mitigar parcialmente.** Reaproveitar `LibraryPage` com filtro/aba "Eventos" no protótipo. Aba dedicada vira backlog v1.1.0. |
| **G5 — RNF09 LGPD** | Consentimento e gestão de dados pessoais | ✅ `ConsentimentoLgpd` modelado | **Inserir mini-modal de consentimento** no `ProfilePage` (decisão a confirmar com aluno). Banner leve ou seção "Privacidade". |

### 5.2 Achados orfãos (Schema tem, LaTeX não cita)

| Achado | Modelo Prisma | Observação |
|--------|---------------|------------|
| **Chatbot conversacional** | `ChatbotConversa`, `ChatbotMensagem` | **Não há RF correspondente no LaTeX.** Schema foi além do escopo do documento. Decisão pendente: (a) remover do escopo v1.0.0, (b) adicionar RF16 no LaTeX em nova edição Overleaf, (c) deixar dormente. |
| **Avaliação de Disciplina** | `AvaliacaoDisciplina` | Não tem rota nem RF. Dado de input acadêmico (provavelmente para alimentar dashboard). Decisão pendente. |
| **Auditoria** | `AuditoriaDado` | Suporta RNF09 (LGPD) e RF14 (relatórios). OK como infra, sem UI necessária no v1.0.0. |
| **Notificações persistentes** | `Notificacao` | Já cobre RF10 do lado backend. UI do `NotificationBell` consumirá. |

### 5.3 Achados orfãos (UI tem, Schema não cobre limpo)

Já mapeados no diagnóstico Fase 1:

- **Streak de gamificação** (12 dias consecutivos no dashboard) → exige migration `add_streak_and_conquistas` (item 9 do backlog).
- **Conquistas/Badges estruturadas** → mesma migration.

---

## 6. Recomendações para o Backlog (Fase 6)

### Itens para **manter como já planejado** (cobertura verde direta)
Backlog itens 4, 5, 7, 8 cobrem RF01, RF02, RF03, RF04, RF05, RF06, RF07, RF08, RF09 sem ajuste de escopo.

### Itens para **ajustar no plano**

1. **Gap G4 (Eventos):** No item 8 do backlog ("substituir mocks por fetch"), incluir explicitamente que o `LibraryPage` deve renderizar dois conjuntos: recursos (`Recurso`) + eventos (`Evento`), com filtro/aba.
2. **Gap G5 (LGPD):** Adicionar sub-item ao backlog item 8: "Adicionar modal/seção de consentimento LGPD em `ProfilePage` consumindo `ConsentimentoLgpd`."
3. **RF10 (Notificações):** Confirmar que o item 7 do backlog inclui endpoint `GET /api/notificacoes` consumido pelo `NotificationBell`.

### Itens **declarados fora do escopo v1.0.0** (dívida documentada)

| Dívida | Quando atacar |
|--------|---------------|
| RF11 (Avaliação Bem-estar) | v1.1.0 — exige nova rota `/dashboard/bem-estar` |
| RF14 (Relatórios Coordenação) | v2.0.0 — exige auth real + persona admin |
| RF15 (Chat Suporte) | v2.0.0 — exige Socket.io |
| RF12 dedicado | v1.1.0 — `/dashboard/eventos` separado |
| Chatbot | aguardar decisão (P6 abaixo) |
| Avaliação de Disciplina (UI) | aguardar decisão |

---

## 7. Pendências Novas para Validação (P6 e P7)

| ID | Pergunta | Por quê |
|----|----------|---------|
| **P6** | O `Chatbot*` deve **(a)** ser removido do schema agora, **(b)** virar RF16 no Overleaf em edição futura, ou **(c)** ficar dormente? | Schema tem 2 modelos sem âncora no documento acadêmico. Risco de inconsistência LaTeX × código. |
| **P7** | Mitigação do Gap G5 (LGPD) deve ser **(a)** modal no primeiro acesso, **(b)** seção dedicada em `ProfilePage`, ou **(c)** banner leve no rodapé do `DashboardLayout`? | Define o esforço do item de backlog adicional. |

---

## 8. Resumo Executivo

- **9 rotas Figma cobrem 9 dos 15 RFs diretamente** (60% bruto), e **3 RFs adicionais parcialmente** (RF10, RF12, RF13) → cobertura efetiva ~80%.
- **3 RFs sem rota** (RF11, RF14, RF15) são **adiados** para v1.1.0/v2.0.0 com justificativa formal (público diferente, exige auth/Socket.io).
- **2 ajustes táticos** no backlog v1.0.0:
  - Aba/filtro **Eventos** em `LibraryPage` (G4).
  - **Consentimento LGPD** em `ProfilePage` (G5).
- **2 achados orfãos do schema** (Chatbot, AvaliacaoDisciplina) entram em **decisão P6**.
- O documento LaTeX **não precisa de edição imediata no Overleaf** — todos os RFs originais permanecem válidos. As dívidas v1.1+ podem ser anotadas em `CHANGELOG.md` apenas.

---

## 9. Próximos Passos

1. ✋ **Aguardar decisão P6 e P7** antes de tocar no backlog.
2. Após P6/P7 → atualizar [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md):
   - Anexar este documento como referência na Fase 2.
   - Ajustar item 8 do backlog com sub-itens G4 e G5.
   - Adicionar seção "Dívidas v1.1+" no Apêndice.
3. Avançar para **Fase 3 (Análise de Negócios)** — formalizar a tabela de personas vs rotas (LaTeX já tem 3 personas).
