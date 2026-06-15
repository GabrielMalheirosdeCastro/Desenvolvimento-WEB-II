# Plano de Ação — Roadmap de Versões até a Versão Final de Produção

**Data:** 2026-06-14
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** Com a v1.9.0 publicada (Bloco H quase fechado — resta só H10), o aluno pediu, antes de
seguir para a próxima versão, um mapa de **quantas versões** ainda são necessárias para concluir
**todas as ~29 pendências abertas** do backlog
([docs/atividades/pendencias-versao-final-producao.md](atividades/pendencias-versao-final-producao.md))
e qual o conteúdo de cada uma.

## Objetivo

Definir uma sequência **versionada (SemVer)** e priorizada que leve o estado atual (v1.9.0) até a
**versão final de produção (v2.0.0)**, agrupando as pendências por afinidade técnica, respeitando
dependências e a ordem de criticidade já registrada no backlog (desbloqueadores e segurança primeiro,
fechamento acadêmico por último).

## Resumo — quantas versões

> **⚠️ Reconciliação 2026-06-15.** Este roadmap foi escrito na v1.9.0 e a execução **divergiu** da
> previsão original: a **v1.13.0 não foi i18n** — foi entregue como **Qualidade/Segurança** (D1
> `helmet`+rate limit, E3/E4 Playwright, E5 gate de CI, E1 parcial). Por isso a numeração de
> v1.13.0 em diante foi **renumerada** abaixo. O i18n migrou para a v1.16.0 e a ordem passou a seguir
> a decisão "robustez primeiro" (RNFs/LGPD → Testes → i18n → Chat NAP → Final), confirmada pelo aluno.

**Estado atual: v1.13.0 publicada.** Restam **5 releases de aplicação** até o marco final: **4 MINOR**
(RNFs, testes, i18n, chat NAP) e o **MAJOR v2.0.0** (fechamento). Em paralelo, a **trilha de
Infra/DevOps** (Bloco F restante) **não consome versões da SPA** — são tarefas operacionais na VPS.

### Histórico entregue (v1.9.1 → v1.13.0)

| Versão | Tipo | Tema | Pendências fechadas | Status |
|--------|------|------|---------------------|--------|
| v1.9.1 | PATCH | Seed Fórum/Biblioteca em produção | C4 | ✅ |
| v1.10.0 | MINOR | RBAC completo + Painel de Coordenação | A4, B4/RF14 | ✅ |
| v1.11.0 | MINOR | Chatbot IA de Acolhimento | B2/RF16 | ✅ |
| v1.12.0 | MINOR | Notificações, Eventos e Gamificação | B5/RF10, B6/RF12, B7/RF13 | ✅ |
| v1.13.0 | MINOR | **Qualidade/Segurança** | D1/RNF03, E3, E4, E5, E1 (parcial) | ✅ |

### Versões restantes (renumeradas — "robustez primeiro")

| Versão | Tipo | Tema | Pendências fechadas | Plano detalhado |
|--------|------|------|---------------------|-----------------|
| **v1.14.0** | MINOR | Endurecimento de RNFs | D2/RNF04, D5/RNF02, D7/RNF09 | [plano](plano-2026-06-15-v1.14.0-endurecimento-rnfs.md) — ✅ entregue |
| **v1.15.0** | MINOR | Qualidade e Testes | E1 (Vitest formal), E2, D3/RNF08 | [plano](plano-2026-06-15-v1.15.0-qualidade-testes.md) — ✅ entregue |
| **v1.16.0** | MINOR | Internacionalização (i18n) + Idioma | D8/RNF10, H10 | [plano](plano-2026-06-15-v1.16.0-i18n-idioma.md) — ✅ entregue |
| **v1.17.0** | MINOR | Chat com Suporte Psicopedagógico | B3/RF15 | [plano](plano-2026-06-15-v1.17.0-chat-nap.md) — ⬜ próxima |
| **v2.0.0** | MAJOR | Versão final + entrega acadêmica | E3 (completo), D4/RNF05, D6/RNF06, G1, G2, G3, G4 | [plano](plano-2026-06-15-v2.0.0-final-entrega-academica.md) |

> **Trilha paralela — Infra/DevOps (sem bump da SPA):** F4 (snapshot da VPS), F5 (RAM do
> `supabase-analytics`), F6 (Cloudflare proxied), F7 (pipeline de `prisma migrate deploy`). Executar
> como tarefas operacionais entre versões; F7 idealmente **antes** de qualquer versão com migração de
> schema nova.

> **Nota:** o detalhamento textual abaixo (escrito na v1.9.0) é mantido por histórico; a tabela acima
> é a **fonte de verdade** da sequência atual.

## Detalhamento por versão

### v1.9.1 — Seed Fórum/Biblioteca (PATCH) — *planejado*
- **Fecha:** C4. **Plano:** [plano-2026-06-14-v1.9.1-seed-forum-biblioteca.md](plano-2026-06-14-v1.9.1-seed-forum-biblioteca.md).
- Aplica o seed estendido (já escrito) em produção; valida `source: db` nos três endpoints.

### v1.10.0 — RBAC + Painel de Coordenação (MINOR) — *planejado*
- **Fecha:** A4 (RBAC aluno/mentor/coordenador) e **B4/RF14** (o painel de coordenação é a
  materialização do "Relatórios para Coordenação"). **Plano:**
  [plano-2026-06-14-v1.10.0-rbac-a4.md](plano-2026-06-14-v1.10.0-rbac-a4.md).

### v1.11.0 — Chatbot IA de Acolhimento (MINOR)
- **Fecha:** B2/RF16 (🔴 alta, G). Respostas adaptadas por faixa etária (17–20, 21–25, 26+).
- **Risco:** maior item de backlog; definir se usa LLM externa (custo/privacidade/LGPD) ou base de
  respostas curada local. Decisão de arquitetura antes de implementar. **Não** introduzir dependência
  de nuvem externa sem validar a regra "tudo na VPS".

### v1.12.0 — Notificações, Eventos e Gamificação (MINOR)
- **Fecha:** B5/RF10 (backend real de notificações — hoje só o sininho), B6/RF12 (aba de eventos
  dedicada, separando da Biblioteca), B7/RF13 (ranking de gamificação). Três itens 🟨 que já têm
  schema/UI parciais — esforço é endpoint + UI.

### v1.13.0 — i18n + Idioma (MINOR)
- **Fecha:** D8/RNF10 (estrutura i18n pt-BR → en-US) e **H10** (seletor de idioma — depende do D8).
  Entregues juntos por dependência direta. Fecha o **último item do Bloco H**.

### v1.14.0 — Qualidade e Testes (MINOR)
- **Fecha:** E1 (Vitest — lógica da API), E2 (supertest — integração API/DB), E4 (validação visual da
  tela de login automatizada), E5 (testes no CI antes do deploy) e **D3/RNF08** (cobertura ≥ 80%).
- E3 (E2E Playwright completo) fica para a v2.0.0 por exigir a estação (VPS é headless) e a SPA final.

### v1.15.0 — Endurecimento de RNFs (MINOR)
- **Fecha:** D1/RNF03 (XSS/CSRF, headers de segurança, rate limiting — completar o 🟨), D2/RNF04
  (acessibilidade WCAG 2.1 AA, que também conclui o dark mode por tokens pendente do H9), D5/RNF02
  (performance ≤ 3s em 3G: code-splitting do bundle de 726 kB), D7/RNF09 (LGPD — consentimento,
  exportação e exclusão de dados).

### v1.16.0 — Chat com Suporte Psicopedagógico (MINOR)
- **Fecha:** B3/RF15 (🟢 baixa, G). Mensageria com o NAP (ex.: Socket.io). Deixado por último entre
  as features por ser baixa prioridade e grande esforço.

### v2.0.0 — Versão Final + Entrega Acadêmica (MAJOR)
- **Fecha:** E3 (E2E completo via Playwright MCP na estação), D4/RNF05 (monitoria/uptime ≥ 99,5% com
  alertas), D6/RNF06 (validação de escalabilidade sob carga), G1 (LaTeX no Overleaf com o estado
  final), G2 (README/CHANGELOG finais), G3 (arquitetura pós-implementação), G4 (manual/roteiro para a
  banca).
- O salto para **MAJOR** marca a transição de "protótipo evolutivo" para "versão final entregável".

## Impacto Esperado

- Arquivos afetados: variam por versão (API `routes.js`/`auth.js`, SPA `apps/web/src/app/**`,
  `seed-prod.sql`, testes, e o `.tex` no Overleaf na v2.0.0).
- Cada versão segue o ritmo já estabelecido: **plano de ação → implementar (revisado) → build →
  bateria de testes → commit atômico → deploy único limpo → verificar `/version`**.
- README/CHANGELOG: atualizados a cada versão (item G2 é o fechamento formal na v2.0.0).

## Riscos e Cuidados

- **Dependências entre versões:** H10 depende de D8 (por isso juntos na v1.13.0); E5 (CI) depende de
  E1/E2 existirem; F7 (migrations) deve preceder versões com mudança de schema.
- **RF16 (chatbot):** principal incerteza de escopo/custo. Pode ser fatiado em mais de uma versão se a
  abordagem com LLM exigir. **Regra de ouro:** nada de infra externa sem validar a política "tudo na
  VPS" (Seção 2.4 das instruções).
- **Estimativa de versões ≠ cronograma:** o número (9 releases) é o **agrupamento lógico**; itens G
  (grande) como B2, B3, D3 podem demandar mais de um ciclo de trabalho cada.
- **Ordem é ajustável:** se a banca priorizar a demonstração visual, v1.13.0 (i18n) e v1.15.0
  (acessibilidade/perf) podem subir; se priorizar robustez, v1.14.0 (testes) sobe.

## Critério de Conclusão

Todas as 53 pendências do backlog marcadas ✅, `/version` em produção retornando **2.0.0**, suíte de
testes (unit/integração/E2E) verde no CI antes do deploy, e o documento LaTeX + README/CHANGELOG +
manual da banca finalizados.
