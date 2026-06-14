# Lista de Pendências — Versão Final em Produção

**Projeto:** Site de Acolhimento FAESA
**Autor:** Gabriel Malheiros de Castro (matrícula 23110145)
**Disciplina:** Desenvolvimento de Aplicações Web II (D001508) — FAESA Campus Vitória
**Data:** 2026-06-13
**Versão atual em produção:** v1.6.0 (Avaliação de Bem-estar / RF11 com persistência real em banco)
**URL:** <https://acolhimento.faesa.gmcsistemas.com.br>

---

## 1. Objetivo do Documento

Este documento consolida **tudo que ainda falta** para evoluir o estado atual (protótipo v1.3.1,
publicado e funcional) até a **versão final de produção** prevista na especificação de requisitos
(RF01–RF16 / RNF01–RNF10) e no documento LaTeX do projeto.

> **Estado atual em uma frase:** o protótipo está no ar, com SPA React + API Express + PostgreSQL
> conectado e **autenticação local real** (login e-mail+senha, `bcrypt`/`JWT`, logout — v1.4.1).
> Porém as telas internas ainda operam com **dados parcialmente mocados** e os botões de ação
> (criar, salvar, iniciar, alternar) **não disparam operações reais de escrita** (Bloco H). As
> lacunas abaixo são o que separa o protótipo da versão final.

> **Atualização 2026-06-13 — auditoria de usabilidade (vídeo).** Uma varredura manual de todas as
> telas (executada sobre a aplicação real em <https://acolhimento.faesa.gmcsistemas.com.br>)
> confirmou que os fluxos de **navegação** funcionam, mas as **ações locais** (CRUD, persistência,
> troca de tema, logout, edição de preferências) têm comportamento **estático**. Os achados foram
> consolidados no novo **Bloco H** e refinaram os Blocos A e C.

> **Atualização 2026-06-13 — Fase 0 concluída (seed em produção + auto-deploy).** O **Bloco C**
> (C1, C2, C3, C5) e o item **F1** foram entregues. O banco de produção foi populado com a persona
> real (Gabriel, `23110145`) e **todos os endpoints `/api/*` respondem `"source": "db"`**
> (validado por `curl` e por inspeção visual via Playwright MCP no dashboard). A versão publicada
> subiu para **v1.3.2**. Durante o redeploy foi diagnosticado e corrigido um **OOM no build do
> EasyPanel** (VPS sem swap) — mitigado com 4 GiB de swap persistente. Detalhes em
> [docs/plano-2026-06-13-seed-producao-e-autodeploy.md](../plano-2026-06-13-seed-producao-e-autodeploy.md).

> **Atualização 2026-06-13 — Bloco A entregue (autenticação local + login real).** Os itens
> **A1, A3, A5 e A6** foram concluídos e publicados (**v1.4.0**, corrigida em **v1.4.1**). O sistema
> agora exige login com **e-mail institucional + senha** (hash `bcrypt` cost 12, sessão `JWT` HS256
> em cookie `httpOnly` + `SameSite=Strict` + `Secure`), com middleware `requireAuth`, rota `/login`
> como porta de entrada e **logout real**. O `nome` cadastrado passou a ser exibido na área logada
> (cabeçalho + saudação), com tratamento de títulos acadêmicos (ex.: "Prof. Ricardo Almeida" →
> "Ricardo"). O **A4** (RBAC por papel) ficou **parcial**: existem `requireRole` e a coluna
> `tipo_usuario` (`ALUNO`/`DOCENTE`) + flag `eMentor`, mas o trio aluno/mentor/coordenador ainda não
> está completo. Como medida de segurança, o `JWT_SECRET` de produção foi **rotacionado** após ter
> sido exposto em texto durante a sessão.

> **Atualização 2026-06-13 — Bloco H iniciado (H3 entregue).** O item **H3** (Plano de Estudos —
> persistir metas) foi concluído e publicado (**v1.5.0**). As telas RF02/RF03 deixaram de ser mock
> somente-leitura: agora há **CRUD real de metas** (`GET/POST/PATCH/DELETE /api/metas`) persistido
> na tabela `atividades_estudo`, com escopo por usuário autenticado (anti-IDOR) e queries
> parametrizadas. O `GET` foi validado em produção com **10 metas reais** carregadas do seed do
> banco. O _drag-and-drop_ ("Organizar horários") foi **adiado** para entrega futura. Restam os
> demais itens do Bloco H (H1, H2, H4–H10).

> **Atualização 2026-06-13 — higiene de segurança.** Removida uma **senha Postgres hardcoded** do
> script `scripts/diag-prod.sh` (passou a ler a variável de ambiente `PGPASSWORD_GMC`, com
> validação de presença). Confirmado que `docs/secrets.md` está no `.gitignore` e **não é
> versionado**. _Pendência aberta:_ a senha da conta de produção `gabriel.castro@faesa.br` precisa
> ser trocada (foi exposta em captura de tela) e **ainda não há fluxo de redefinição de senha** —
> candidato a novo item de backlog (ex.: `PATCH /api/auth/senha` autenticada).

> **Atualização 2026-06-14 — Bloco B iniciado (B1 / RF11 entregue).** O item **B1**
> (**Avaliação de Bem-estar**) foi concluído e publicado (**v1.6.0**). Duas rotas **aditivas** e
> autenticadas (`GET /api/bem-estar` e `POST /api/bem-estar`, com `requireAuth` e escopo
> `usuario_id = req.usuario.sub` anti-IDOR) persistem as autoavaliações na tabela
> `questionarios_bem_estar` (sem migração — schema já existente). As escalas `humor`/`estresse`/`sono`
> (1–5) são serializadas em JSON na coluna `respostas`, e o `resultado`
> (`positivo`/`atencao`/`critico`) é calculado no servidor. A SPA ganhou a tela
> `/dashboard/bem-estar` (formulário + cartões de resumo + histórico). O seed de produção foi
> atualizado e **executado via túnel SSH**: a persona Gabriel (`23110145`) já tem 3 avaliações reais
> no banco de produção (validado por consulta direta). Restam os demais itens do Bloco B (B2–B7).

### Legenda

| Marcador | Significado |
|---|---|
| **Prioridade** | 🔴 Alta · 🟡 Média · 🟢 Baixa |
| **Complexidade** | P (pequena) · M (média) · G (grande) |
| **Status** | ⬜ Não iniciado · 🟨 Parcial (UI ou backend isolado) · ✅ Concluído |

---

## 2. Bloco A — Autenticação e Identidade (bloqueador crítico)

> No protótipo, a decisão **B4** dispensou login real: a rota `/` redireciona direto para
> `/dashboard` e a tela de login não valida credenciais. Para produção isto **precisa** mudar.

| # | Pendência | RF/RNF | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|
| A1 | Implementar autenticação real local: **cadastro e login com e-mail + senha** (sem SSO institucional) | RF01 | 🔴 | G | ✅ |
| A2 | ~~Integração SSO / OAuth 2.0 com o provedor institucional FAESA~~ — **DESCARTADO**: sem autorização institucional para usar o provedor de identidade da FAESA. Substituído por autenticação local própria (A1/A3) | RF01, RNF03 | — | — | ❌ |
| A3 | Sessão/JWT, hash de senha com **`bcrypt`** (`passwordHash`) e middleware de proteção de rotas | RF01, RNF03 | 🔴 | M | ✅ |
| A4 | Controle de acesso por papel (aluno / mentor / coordenador) | RF14 | 🔴 | M | 🟨 |
| A5 | Reverter o redirect `/` → `/dashboard`; tornar `/login` a porta de entrada real | RF01 | 🔴 | P | ✅ |
| A6 | **Logout real** — o botão "Sair" hoje apenas recarrega o Dashboard; precisa encerrar sessão e voltar a `/login` (achado do vídeo, 00:28) | RF01 | 🔴 | P | ✅ |

> **Decisão de escopo (2026-06-13):** a autenticação **não** usará SSO/OAuth 2.0 com o provedor
> institucional FAESA (sem autorização). O login será **local**: cadastro por e-mail + senha,
> com hash `bcrypt` e sessão JWT. O e-mail institucional pode continuar sendo **validado por
> formato** (domínio FAESA) no cadastro, mas sem federação de identidade externa.

> **Status (2026-06-13, v1.4.1):** A1, A3, A5 e A6 ✅ entregues. Falta apenas **A4** (RBAC completo
> por papel aluno/mentor/coordenador) — a infraestrutura (`requireRole`, `tipo_usuario`, `eMentor`)
> já existe, mas o modelo de três papéis ainda não foi finalizado.

**Critério de pronto:** usuário só acessa o dashboard após autenticar com e-mail + senha; "Sair"
encerra a sessão de verdade; rotas de coordenação exigem papel `coordenador`. **Parcialmente
atingido:** login/logout reais ✅; falta o RBAC completo (A4).

---

## 3. Bloco B — Requisitos Funcionais Não Implementados

> Funcionalidades previstas na especificação que **não existem** ou estão apenas como UI no
> protótipo atual.

| # | Pendência | RF | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|
| B1 | **Avaliação de Bem-estar** — questionários periódicos de autoavaliação. **Entregue na v1.6.0:** UI (`/dashboard/bem-estar`) + `GET/POST /api/bem-estar` + persistência em `questionarios_bem_estar` + seed da persona em produção | RF11 | 🟡 | M | ✅ |
| B2 | **Chatbot IA de Acolhimento** — respostas adaptadas por faixa etária (17–20, 21–25, 26+) | RF16 | 🔴 | G | ⬜ |
| B3 | **Chat com Suporte Psicopedagógico** — canal direto com o NAP (mensageria, ex.: Socket.io) | RF15 | 🟢 | G | ⬜ |
| B4 | **Relatórios para Coordenação** — painel admin com dados agregados e anônimos | RF14 | 🟡 | G | ⬜ |
| B5 | **Notificações e Lembretes** — backend real (push/e-mail); hoje só existe o sininho na UI | RF10 | 🟡 | M | 🟨 |
| B6 | **Eventos extracurriculares** — aba/agregador dedicado (hoje misturado na Biblioteca) | RF12 | 🟢 | P | 🟨 |
| B7 | **Gamificação completa** — ranking dedicado entre alunos (hoje só pontos/badges/streak) | RF13 | 🟢 | M | 🟨 |

**Observação:** o schema Prisma **já modela** as tabelas de suporte a RF11, RF14 e RF15
(`QuestionarioBemEstar`, `RelatorioAnonimizado`/`AuditoriaDado`, `ChatTicket`/`ChatMensagem`),
então a maior parte do esforço é UI + endpoints, não modelagem de dados.

---

## 4. Bloco C — Dados em Produção (seed)

> Hoje os endpoints respondem `"source": "fallback"` porque as tabelas de produção **estão vazias**.
> A conexão com o banco funciona (`/api/_status` → `connected`), mas não há linhas para ler.
>
> **✅ Resolvido em 2026-06-13 (v1.3.2):** seed de produção executado; os endpoints passaram a
> responder `"source": "db"`. C4 (carga de biblioteca/trilhas) permanece em aberto.

| # | Pendência | Prioridade | Complexidade | Status |
|---|---|---|---|---|
| C1 | Popular seed de produção com a persona principal (`23110145`) e dados reais de dashboard | 🔴 | P | ✅ |
| C2 | Popular `eventos`, `atividades_estudo`, `usuario_conquistas`, `gamificacao` em produção | 🔴 | P | ✅ |
| C3 | Validar que os endpoints passam a responder `"source": "db"` após o seed | 🔴 | P | ✅ |
| C4 | Definir estratégia de carga inicial de recursos/biblioteca e trilhas | 🟡 | M | ⬜ |
| C5 | Corrigir o nome exibido no perfil/header — vídeo mostrava "Gabriel Matheos de Castro" (typo); confirmado correto ("Gabriel Malheiros de Castro") na tela após o seed | 🟡 | P | ✅ |

**Critério de pronto:** `GET /api/me` em produção retorna `"source": "db"` com a persona real e o
nome correto. **✅ Atingido.**

---

## 5. Bloco D — Requisitos Não Funcionais

| # | Pendência | RNF | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|
| D1 | **Segurança** — proteção XSS/CSRF, headers de segurança, TLS 1.3, rate limiting | RNF03 | 🔴 | M | 🟨 |
| D2 | **Acessibilidade** — conformidade WCAG 2.1 AA (contraste, leitor de tela, navegação por teclado) | RNF04 | 🟡 | M | ⬜ |
| D3 | **Cobertura de testes ≥ 80%** — hoje não há suíte automatizada | RNF08 | 🟡 | G | ⬜ |
| D4 | **Disponibilidade / monitoria 24/7** — uptime ≥ 99,5% com alertas | RNF05 | 🟡 | M | ⬜ |
| D5 | **Performance** — carregamento ≤ 3s em 3G (otimização de bundle, lazy loading) | RNF02 | 🟡 | M | ⬜ |
| D6 | **Escalabilidade** — validar comportamento sob carga (meta de 10k usuários simultâneos) | RNF06 | 🟢 | G | ⬜ |
| D7 | **LGPD** — completar gestão de consentimento, exportação e exclusão de dados pessoais | RNF09 | 🟡 | M | 🟨 |
| D8 | **Internacionalização** — preparar estrutura i18n (pt-BR → en-US) | RNF10 | 🟢 | M | ⬜ |

---

## 6. Bloco H — Interatividade e Operações de Escrita das Telas (achados do vídeo)

> **Origem:** auditoria de usabilidade de 2026-06-13. As telas RF02–RF09 existem visualmente e
> consomem dados via `GET /api/*`, mas **nenhuma ação de escrita/persistência está implementada** —
> os botões abrem/fecham no máximo um estado visual temporário, sem chamar a API nem gravar no
> banco. Este bloco transforma os mocks somente-leitura em telas funcionais.

| # | Pendência | RF | Origem (vídeo) | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|---|
| H1 | **Header → Perfil** — avatar/nome no canto superior direito não navega; deve abrir menu ou levar a `/dashboard/perfil` | RF05 | 00:08 | 🟡 | P | ⬜ |
| H2 | **Dashboard interativo** — "Ver todas as Conquistas" e demais painéis não são clicáveis | RF05, RF13 | 00:36 | 🟡 | M | ⬜ |
| H3 | **Plano de Estudos — persistir metas** — checkbox "Concluída" não gravava; "+ Nova Meta" inerte. **Entregue na v1.5.0:** CRUD real de metas (`GET/POST/PATCH/DELETE /api/metas`) persistido em `atividades_estudo`. _Drag-and-drop ("Organizar horários") adiado para entrega futura._ | RF02, RF03 | 00:49 | 🟢 | G | ✅ |
| H4 | **Concentração — "Iniciar Exercício Guiado"** não aciona o timer/assistente de respiração | RF04 | 01:06 | 🟡 | M | ⬜ |
| H5 | **Mentoria — "Entrar"** (sala/sessão ao vivo) não carrega; **"Cadastrar-me como Mentor(a)"** não dá feedback (endpoint existe, falta ligar a UI) | RF09 | 01:15 | 🟡 | M | 🟨 |
| H6 | **Fórum — "+ Novo Tópico"** não abre editor; falta criação/persistência de tópicos e comentários | RF08 | 01:32 | 🟡 | M | ⬜ |
| H7 | **Biblioteca — "Iniciar Trilha", "Sugerir Recurso", "Acessar Recurso"** sem ação operacional | RF06, RF07 | 01:39 | 🟡 | M | ⬜ |
| H8 | **Perfil — edição de dados** — campos apenas mocados; falta `PUT`/salvar alterações | RF05 | 01:52 | 🟡 | M | ⬜ |
| H9 | **Alternância de Tema (Claro/Escuro/Automático)** — seletor abre mas não aplica o tema | RNF07 | 01:52 | 🟢 | M | ⬜ |
| H10 | **Seletor de Idioma (PT-BR/EN-US)** — abre mas não traduz (depende da estrutura i18n do item D8) | RNF10 | 01:52 | 🟢 | M | ⬜ |

**Critério de pronto:** cada botão de ação das telas existentes dispara uma chamada real à API
(ou efeito visual real, no caso de tema), com persistência verificável no banco quando aplicável.

> **Nota de ligação com outros blocos:** H10 (idioma) é a contraparte de UI do item **D8** (i18n);
> H9 (tema) atende **RNF07** (usabilidade/Design System); H5 reaproveita os endpoints de mentoria
> já entregues na v1.2.0 (faltando apenas o feedback de UI e a sala de sessão).

---

## 7. Bloco E — Qualidade e Testes

| # | Pendência | Prioridade | Complexidade | Status |
|---|---|---|---|---|
| E1 | Configurar suíte de testes unitários (Vitest) para lógica da API | 🟡 | M | ⬜ |
| E2 | Testes de integração API/DB (supertest) | 🟡 | M | ⬜ |
| E3 | Testes E2E da SPA via Playwright MCP (rodam **só na estação Windows** — VPS é headless) | 🟡 | M | ⬜ |
| E4 | Validação visual da tela de login (4 metadados + badge de versão) automatizada | 🟢 | P | 🟨 |
| E5 | Integrar testes ao pipeline de CI (rodar antes do deploy) | 🟡 | M | ⬜ |

---

## 8. Bloco F — Infraestrutura e DevOps

| # | Pendência | Prioridade | Complexidade | Status |
|---|---|---|---|---|
| F1 | **Reativar auto-deploy** — GitHub Secret `EASYPANEL_DEPLOY_WEBHOOK` cadastrado; workflow valida o secret e dispara o webhook (best-effort, pois a VPS filtra IPs dos runners). Redeploy oficial pela estação via `scripts/deploy.mjs` | 🔴 | P | ✅ |
| F2 | **Backup off-host** do banco (regra 3-2-1; ex.: Backblaze B2 / Storage Box) | 🔴 | M | ✅ |
| F3 | **Hardening SSH** — trocar senha de root, desabilitar `PasswordAuthentication`, 2FA, fail2ban | 🔴 | M | ✅ |
| F4 | **Snapshot da VPS** antes de upgrades maiores (ex.: PG 17 → 18) | 🟡 | P | ⬜ |
| F5 | Aumentar limite de RAM do `supabase-analytics` (operando ~97%) | 🟡 | P | ⬜ |
| F6 | Avaliar Cloudflare em modo proxied (WAF/CDN) após validar integrações | 🟢 | P | ⬜ |
| F7 | Pipeline de **migrations em produção** (`prisma migrate deploy` no deploy ou CI) | 🟡 | M | 🟨 |
| F8 | **Swap na VPS** — 4 GiB (`/swapfile`, persistente em `/etc/fstab`) para evitar OOM no build do `vite` no EasyPanel | 🔴 | P | ✅ |

---

## 9. Bloco G — Documentação e Entrega Acadêmica

| # | Pendência | Prioridade | Complexidade | Status |
|---|---|---|---|---|
| G1 | Atualizar o documento LaTeX (Overleaf) com o estado final do sistema | 🟡 | M | ⬜ |
| G2 | Atualizar `README.md` e `CHANGELOG.md` a cada entrega de bloco | 🟡 | P | 🟨 |
| G3 | Documento de arquitetura final (diagramas atualizados pós-implementação) | 🟢 | M | ⬜ |
| G4 | Manual do usuário / roteiro de demonstração para a banca | 🟢 | P | ⬜ |

---

## 10. Ordem Sugerida de Execução

A sequência abaixo prioriza desbloqueadores e itens de maior risco primeiro.

```
1. Bloco C (seed em produção)          ✅ CONCLUÍDO (v1.3.2) — tirou tudo do "fallback"
2. Bloco F (F1 auto-deploy ✅, F8 swap ✅, F2 backup ✅, F3 SSH ✅)  → estabilidade e segurança da base
3. Bloco A (autenticação local e-mail+senha + logout)   ✅ CONCLUÍDO (v1.4.1) — falta só A4 (RBAC completo)
4. Bloco H (tornar as telas mock funcionais)    🟨 EM ANDAMENTO — H3 ✅ (v1.5.0); próximos: H1 (P) ou H5 (backend pronto)
5. Bloco B (RF11 ✅ v1.6.0; RF16 prioritário)   → completar requisitos de alta prioridade
6. Bloco D + E (qualidade, testes, RNFs) → endurecer para "produção de verdade"
7. Bloco B restante (RF14, RF15)        → features de menor prioridade
8. Bloco G (documentação/entrega)       → fechamento acadêmico
```

---

## 11. Resumo Executivo

| Bloco | Tema | Itens | Prioridade dominante |
|---|---|---|---|
| A | Autenticação e identidade | 6 | 🔴 Alta |
| B | RFs não implementados | 7 | 🟡 Média |
| C | Seed em produção | 5 | 🔴 Alta |
| D | Requisitos não funcionais | 8 | 🟡 Média |
| H | Interatividade / escrita das telas (vídeo) | 10 | 🟡 Média |
| E | Qualidade e testes | 5 | 🟡 Média |
| F | Infraestrutura e DevOps | 8 | 🔴 Alta |
| G | Documentação e entrega | 4 | 🟢 Baixa |

**Total:** 53 pendências mapeadas — **15 concluídas** (A1, A3, A5, A6, **B1**, C1, C2, C3, C5, F1, F2, F3,
F8, **H3** e a validação visual E4 parcial) + **A4 parcial**; ~37 em aberto.

> **Conclusão honesta para a banca:** o protótipo entrega a espinha dorsal (infra, deploy, SPA, API,
> banco conectado, 9 dos 16 RFs em nível de UI/endpoint de leitura) e, desde a v1.4.1, **autenticação
> local real** (login e-mail+senha com `bcrypt`/`JWT`, logout e proteção de rotas). O **Bloco H**
> (tornar as telas funcionais) já está **em andamento**: o **H3** (Plano de Estudos com CRUD real de
> metas) foi entregue na **v1.5.0** e a **Avaliação de Bem-estar (B1/RF11)** na **v1.6.0** (com seed da
> persona em produção), mas as demais telas RF02–RF09 ainda são **mocks somente-leitura**
> — seus botões de ação não persistem nada. A versão final depende, em ordem de criticidade, de
> **concluir as telas funcionais restantes (escrita/CRUD do Bloco H)**, **completar o RBAC por papel
> (A4)**, **a feature de RF de alta prioridade restante (RF16)** e **endurecimento de segurança/infra**,
> seguidos das features de menor prioridade e da cobertura de testes exigida pelo RNF08.

---

## 12. Referências Internas

- [docs/relatorios faesa/diagnostico-prototipo-v1.md](../relatorios%20faesa/diagnostico-prototipo-v1.md) — diagnóstico do protótipo.
- [docs/relatorios faesa/fase2-matriz-rotas-rf.md](../relatorios%20faesa/fase2-matriz-rotas-rf.md) — matriz Rota × Requisito e gaps.
- [docs/relatorios faesa/especificacao-requisitos-entrega-01.md](../relatorios%20faesa/especificacao-requisitos-entrega-01.md) — RF01–RF16 / RNF01–RNF10.
- [docs/plano-2026-04-26-primeiro-prototipo.md](../plano-2026-04-26-primeiro-prototipo.md) — backlog do protótipo (concluído na v1.2.0).
- [docs/ambiente-producao-easypanel.md](../ambiente-producao-easypanel.md) — infraestrutura de produção e próximos passos.
- [docs/relatórios entrega/relatorio-ambiente-producao-banco-dados.md](../relatórios%20entrega/relatorio-ambiente-producao-banco-dados.md) — ambiente e conexão com o banco.
- **Auditoria de usabilidade (vídeo, 2026-06-13)** — varredura manual de todas as telas sobre a
  aplicação real (<https://acolhimento.faesa.gmcsistemas.com.br>); fonte direta do Bloco H.
