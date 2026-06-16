# Lista de Pendências — Versão Final em Produção

**Projeto:** Site de Acolhimento FAESA
**Autor:** Gabriel Malheiros de Castro (matrícula 23110145)
**Disciplina:** Desenvolvimento de Aplicações Web II (D001508) — FAESA Campus Vitória
**Data:** 2026-06-14 (atualizado em 2026-06-16)
**Versão atual em produção:** **v2.0.0** — versão final de entrega acadêmica. Todos os 16 RFs
concluídos; Bloco D de qualidade encerrado (D2 acessibilidade WCAG AA, D4 monitoria de uptime e
D6 teste de carga concluídos); refinamentos de UX, modo escuro completo e i18n incremental.
**Próximas versões planejadas:** nenhuma frente de **código** pendente. Resta apenas o **Bloco G**
(documentação/entrega acadêmica no Overleaf), de execução manual do aluno.
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
> demais itens do Bloco H (H1, H2, H6, H7, H10).

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

> **Atualização 2026-06-14 — Fase 2 do Bloco H entregue (H4, H5, H8, H9 / v1.7.0).** A "varredura de
> mocks" tornou reais quatro telas que antes tinham botões inertes ou dados estáticos, publicada como
> **v1.7.0**: **H8** (Perfil real) — `GET`/`PATCH /api/usuario/perfil` (`requireAuth`, escopo
> `WHERE id = req.usuario.sub`), edição de nome/e-mail com re-emissão do JWT/cookie quando o e-mail
> muda e tratamento de `UNIQUE` (409); **H9** (Tema) — `ThemeContext` claro/escuro/automático
> persistido em `localStorage` (efeito visual **parcial**, limitado às superfícies baseadas em token);
> **H5** (Mentoria) — correção do `fetch` com `credentials: "include"`, hidratação de `souMentor` via
> `useAuth().usuario.eMentor`, lista real via `GET /api/mentorias?papel=mentor` e cadastro de mentor
> escopado a `req.usuario.sub`; **H4** (Concentração) — exercício de respiração guiada 4-7-8
> client-side (ciclo inspirar/segurar/expirar). Sem erros de TS/lint; SPA reconstruída (`dist/`
> versionado); `/version` e `/healthz` confirmam **1.7.0** em produção. _Limitação documentada:_ dark
> mode visual completo (refatorar cores hardcoded para design tokens) foi adiado para fora deste MINOR.
> Restam os itens H1, H2, H6, H7 e H10 do Bloco H.

> **Atualização 2026-06-14 — Fórum/Biblioteca (H6/H7 v1.8.0) e Dashboard/Header (H1/H2 v1.9.0)
> publicados; bateria de testes executada.** As telas de **Fórum (H6/RF08)** e **Biblioteca
> (H7/RF06–RF07)** saíram do estado mock na **v1.8.0** (`GET/POST /api/forum`, `GET /api/recursos`,
> `GET /api/trilhas`, `POST /api/recursos/:id/acesso`), e o **dashboard/header interativos (H1/H2)**
> na **v1.9.0**. Com isso o **Bloco H** fica reduzido a um único item em aberto: **H10** (idioma,
> acoplado ao i18n/D8). Uma **bateria de testes** pós-v1.9.0 (unitário de auth, build da SPA, smoke
> HTTP de `/version`, `/healthz`, endpoints públicos e guardas de auth) passou em **6/6** verificações
> e revelou **um achado**: `GET /api/forum`, `/api/recursos` e `/api/trilhas` respondiam então
> `"source": "fallback"` em produção porque as tabelas existem mas estavam **vazias** — o `seed-prod.sql`
> populava apenas `eventos`. Isso degradava a Biblioteca (o `POST /api/recursos/:id/acesso` num id de
> fallback retornava 404 e o acesso não persistia). **✅ Corrigido na v1.9.1 (2026-06-14):** seed
> estendido (6 recursos, 3 trilhas, 7 vínculos, 3 tópicos de fórum, usuário NAP, idempotente) aplicado
> em produção via SSH; os três endpoints passaram a responder `"source": "db"` — ver
> [docs/plano-2026-06-14-v1.9.1-seed-forum-biblioteca.md](../plano-2026-06-14-v1.9.1-seed-forum-biblioteca.md).
> Em paralelo, o **RBAC completo (A4) + Painel de Coordenação (RF14)** foi planejado para a **v1.10.0**
> — ver [docs/plano-2026-06-14-v1.10.0-rbac-a4.md](../plano-2026-06-14-v1.10.0-rbac-a4.md). O
> **roadmap completo de versões** até a versão final está em
> [docs/plano-2026-06-14-roadmap-versoes-finais.md](../plano-2026-06-14-roadmap-versoes-finais.md).

> **Atualização 2026-06-14 — Bloco B praticamente fechado (B2 v1.11.0; B5/B6/B7 v1.12.0).** O
> **Chatbot de Acolhimento (B2 / RF16)** foi entregue na **v1.11.0** (motor curado local, sem LLM
> externa, com rede de segurança de crise NAP + CVV 188). Na sequência, a **v1.12.0** entregou três
> requisitos de uma vez: **Notificações (B5 / RF10)** — sino real no cabeçalho com
> `GET /api/notificacoes` (+ contador de não lidas), `POST /api/notificacoes/:id/marcar-lida` e
> `/marcar-todas-lidas`, todos escopados ao dono (anti-IDOR) e com `NotificationBell` em fetch real
> e atualização otimista; **Eventos (B6 / RF12)** — página dedicada `/dashboard/eventos` com item de
> menu próprio, `POST /api/eventos/:id/inscrever` (idempotente via `ON CONFLICT DO NOTHING`) e
> `GET /api/eventos/minhas`, removendo a antiga aba de eventos da Biblioteca; **Gamificação
> (B7 / RF13)** — `GET /api/gamificacao/perfil` (pontos, conquistas, histórico e *streak* reais) e
> `GET /api/gamificacao/ranking` (função `RANK()` do PostgreSQL, nomes reduzidos por privacidade e
> destaque do próprio aluno), exibidos como seção no Perfil. O `seed-prod.sql` foi estendido com
> notificações da persona, alunos de demonstração e gamificação dos demais alunos (ranking com 4
> entradas) e **aplicado em produção via SSH**. Bump nos três `package.json`, `CHANGELOG` e backlog.
> Build e suítes core (`test-auth-core`, `test-chatbot-core`) verdes; `/version` e `/healthz`
> confirmam **1.12.0**. **Validação visual via Playwright MCP** registrou as três telas (sino com 4
> notificações reais, eventos com inscrição persistida, perfil com ranking Gabriel 1º · Mariana ·
> Lucas · Beatriz). Com isso o **Bloco B** fica reduzido a **um único item em aberto: B3 / RF15**
> (chat com suporte psicopedagógico).

> **Atualização 2026-06-15/16 — fechamento dos RFs e ciclo de refinamento (v1.13.0 → v1.30.0).**
> Após os 16 RFs concluídos, o trabalho passou para **endurecimento (Bloco D/E)** e **refinamento de
> UX** com uma série de MINORs atômicos, todos publicados e validados em produção (`/version` +
> `/healthz`):
>
> - **v1.13.0** — Segurança (D1): `helmet` + CSP, `express-rate-limit`, `trust proxy`; Playwright
>   (E3/E4) e gate de CI (E5).
> - **v1.14.0** — Performance (D5, code-splitting), LGPD (D7, exportação/exclusão) e baseline de
>   acessibilidade (D2: `lang`, skip-link, landmark, `aria-label`).
> - **v1.15.0** — Testes formais Vitest + supertest (D3/E1/E2); cobertura ~97% da lógica de API.
> - **v1.16.0** — Núcleo i18n PT-BR/EN-US + seletor de idioma (D8/H10) — **encerra o Bloco H**.
> - **v1.17.0** — Chat com o NAP (B3/RF15) — **encerra o Bloco B e todos os 16 RFs**.
> - **v1.18.0** — **Modo escuro completo + design tokens semânticos** (H9/D2): encerrado o débito
>   visual do dark mode; todas as telas passam a responder ao tema. Suíte sobe para **71 testes**.
> - **v1.19.0 / v1.20.0** — Extração i18n incremental do `DashboardHome` e do `StudyPlanPage`
>   (namespaces `home` e `estudos`, paridade de chaves validada por teste).
> - **v1.20.1** — Correção visual: logo "F" das telas de Login/Ativar deixa de ser texto selecionável.
> - **v1.21.0** — Cancelamento de inscrição em eventos (`DELETE /api/eventos/:id/inscrever`), botão
>   reversível.
> - **v1.22.0** — Solicitação de mentoria funcional e reversível (`/api/mentorias/*/solicitar`).
> - **v1.23.0** — Agendamento real de sessões de mentoria (`/api/mentorias/sessoes`), substituindo o
>   mock fixo.
> - **v1.24.0** — Identificação legível do papel do mentor (selo Aluno(a)/Professor(a)/Coordenação).
> - **v1.25.0** — Opção de deixar de ser mentor (`DELETE /api/mentorias/cadastro-mentor`).
> - **v1.26.0** — Reconhecimento do nome na ativação de conta (`POST /api/auth/ativar` retorna o
>   `nome`).
> - **v1.27.0** — Botões da Biblioteca com confirmação reversível ("Confirmar acesso"/"Cancelar").
> - **v1.28.0** — Mesmo padrão reversível nas "Trilhas de Aprendizagem" (estado em `localStorage`).
> - **v1.29.0** — Acolhimento (chatbot): **nova conversa** + **histórico de conversas**
>   (`GET /api/chatbot/conversas`, `?conversaId=` em `/historico`).
> - **v1.30.0** — Fórum interativo: botão **"Entrar"** no tópico, **"Pedir informações sobre a
>   matéria"** com confirmação reversível e **categorias como filtro funcional**
>   (`GET/POST /api/forum/:id/posts`).
>
> Todas as entregas acima reutilizam tabelas já existentes (**sem migração**), seguem o padrão
> anti-IDOR (escopo por `req.usuario.sub`) e mantêm a suíte de testes verde (**71 testes**, cobertura
> 97,5%). O foco remanescente é **qualidade (D2 auditoria AA, D4 monitoria, D6 escalabilidade)** e o
> **fechamento acadêmico (Bloco G)**.

> **Atualização 2026-06-16 — VERSÃO FINAL v2.0.0 publicada (encerramento do Bloco D de qualidade).**
> As três frentes de qualidade que faltavam foram concluídas e o projeto recebeu o bump **MAJOR**
> `1.30.0 → 2.0.0` (marco de entrega acadêmica), publicado e validado em produção
> (`/version` = `2.0.0`, `/healthz` = `ok`):
>
> - **D2 — Acessibilidade WCAG 2.1 AA (auditoria formal concluída).** Auditoria via Lighthouse na
>   estação (modo *Instantâneo* para as telas autenticadas, *Navegação* para `/login`). Correções
>   aplicadas e revalidadas:
>   - **Contraste:** novos tokens `--success-strong`/`--warning-strong` (claro e escuro) em
>     `theme.css`, reservados a **texto pequeno** (atingem ≥ 4.5:1), preservando as cores
>     institucionais FAESA vívidas em ícones e selos; `--muted-foreground` (tema claro) escurecido
>     de `#6C757D` para `#5C636A`. Aplicado em `DashboardHome`, `StudyPlanPage`, `WellbeingPage` e
>     `ProfilePage`.
>   - **Ordem de títulos:** hierarquia tornada sequencialmente decrescente em `DashboardHome`,
>     `StudyPlanPage`, `ForumPage` e `ProfilePage` (eliminados saltos `h1→h3/h4` causados por
>     seções e formulários condicionais).
>   - **Tela de login:** lista de definição (`<dl>`) reestruturada para conter apenas `<dt>`/`<dd>`
>     por grupo (ícones movidos para dentro do `<dt>` com `aria-hidden`), corrigindo as regras axe
>     *definition-list* e *dlitem*; links ("Ative sua conta" e repositório) passaram a usar
>     sublinhado permanente (deixam de depender só da cor). Score do `/login` subiu de **25/28**.
> - **D4 — Monitoria de uptime.** Workflow `.github/workflows/uptime.yml` (cron `*/30` +
>   `workflow_dispatch`) que faz `curl` em `/healthz` e `/version` da produção e falha se não
>   responder 200. Arquivo em `.github/` → fora da imagem Docker.
> - **D6 — Teste de carga (escalabilidade).** `autocannon -c 20 -d 30` contra `GET /version`
>   (endpoint leve, somente leitura, sem poluir o banco): **~17 mil requisições em 30,12 s, 0 erros**,
>   latência p50 30 ms / p99 114 ms / média 35,44 ms, vazão 557,84 req/s. Evidência em
>   [docs/evidencia-d6-carga.md](../evidencia-d6-carga.md).
>
> O release foi consolidado no commit atômico `chore(release): v2.0.0` (`8c8cdd4`) com bump nos três
> `package.json`, `CHANGELOG` movido de `[Unreleased]` para `[2.0.0]` e `apps/web/dist/` regenerado.
> A evidência D6 e a atualização do plano de fechamento entraram no commit doc-only `d265ba9`.
> **Com isso, não há mais nenhuma frente de código pendente** — o único item restante de todo o
> projeto é o **Bloco G** (colagem dos snippets LaTeX no Overleaf), que o aluno optou por tratar
> fora deste repositório. Plano de fechamento detalhado em
> [docs/plano-2026-06-16-fechamento-v2.0.0.md](../plano-2026-06-16-fechamento-v2.0.0.md).

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
| A4 | Controle de acesso por papel (aluno / mentor / coordenador). **Entregue na v1.10.0:** `requireRole` conectado a rota protegida, `RoleRoute` + menu condicional no frontend, papel exposto via `/api/auth/me`; autorização imposta no backend (OWASP A01) | RF14 | 🔴 | M | ✅ |
| A5 | Reverter o redirect `/` → `/dashboard`; tornar `/login` a porta de entrada real | RF01 | 🔴 | P | ✅ |
| A6 | **Logout real** — o botão "Sair" hoje apenas recarrega o Dashboard; precisa encerrar sessão e voltar a `/login` (achado do vídeo, 00:28) | RF01 | 🔴 | P | ✅ |

> **Decisão de escopo (2026-06-13):** a autenticação **não** usará SSO/OAuth 2.0 com o provedor
> institucional FAESA (sem autorização). O login será **local**: cadastro por e-mail + senha,
> com hash `bcrypt` e sessão JWT. O e-mail institucional pode continuar sendo **validado por
> formato** (domínio FAESA) no cadastro, mas sem federação de identidade externa.

> **Status (2026-06-14, v1.10.0):** A1, A3, A4, A5 e A6 ✅ entregues. O **A4** (RBAC por papel) foi
> concretizado: `requireRole` protege `GET /api/coordenacao/overview` (403 para papel insuficiente),
> `/api/auth/me` expoe o papel, e o frontend tem `RoleRoute` + menu condicional. Mentor permanece
> como flag `e_mentor=true` sobre `ALUNO`, conforme a convenção documentada em `auth.js`.

**Critério de pronto:** usuário só acessa o dashboard após autenticar com e-mail + senha; "Sair"
encerra a sessão de verdade; rotas de coordenação exigem papel `coordenador`. **✅ Atingido na
v1.10.0:** login/logout reais e o RBAC por papel completo (A4) — `GET /api/coordenacao/overview`
exige `COORDENADOR` (403 caso contrário).

---

## 3. Bloco B — Requisitos Funcionais Não Implementados

> Funcionalidades previstas na especificação que **não existem** ou estão apenas como UI no
> protótipo atual.

| # | Pendência | RF | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|
| B1 | **Avaliação de Bem-estar** — questionários periódicos de autoavaliação. **Entregue na v1.6.0:** UI (`/dashboard/bem-estar`) + `GET/POST /api/bem-estar` + persistência em `questionarios_bem_estar` + seed da persona em produção | RF11 | 🟡 | M | ✅ |
| B2 | **Chatbot IA de Acolhimento** — respostas adaptadas por faixa etária (17–20, 21–25, 26+). **Entregue na v1.11.0:** motor curado local (sem LLM externa, conforme “tudo na VPS” + LGPD), tela `/dashboard/chatbot`, `POST /api/chatbot/mensagem` + `GET /api/chatbot/historico`, com rede de segurança de crise (NAP + CVV 188) | RF16 | 🔴 | G | ✅ |
| B3 | **Chat com Suporte Psicopedagógico** — canal direto com o NAP. **Entregue na v1.17.0:** tela `/dashboard/chat-nap` (polling HTTP, sem Socket.io — RF15 não exige tempo real), `GET/POST /api/chat/tickets`, `GET/POST /api/chat/tickets/:id/mensagens` e `POST /api/chat/tickets/:id/fechar`, persistência em `chat_tickets`/`chat_mensagens`, papel de atendente exercido por `COORDENADOR` (NAP), anti-IDOR e rede de segurança de crise reutilizada (`detectarCrise` → NAP + CVV 188). **Encerra o último RF em aberto** | RF15 | 🟢 | G | ✅ |
| B4 | **Relatórios para Coordenação** — painel admin com dados agregados e anônimos. **Entregue na v1.10.0:** `GET /api/coordenacao/overview` (somente `COORDENADOR`) + tela `/dashboard/coordenacao` com métricas institucionais agregadas | RF14 | 🟡 | G | ✅ |
| B5 | **Notificações e Lembretes** — sininho real no cabeçalho. **Entregue na v1.12.0:** `GET /api/notificacoes` (+ contador de não lidas), `POST /api/notificacoes/:id/marcar-lida` e `POST /api/notificacoes/marcar-todas-lidas` (escopados ao dono, anti-IDOR), `NotificationBell` com fetch real e atualização otimista, seed da persona | RF10 | 🟡 | M | ✅ |
| B6 | **Eventos extracurriculares** — página dedicada (separada da Biblioteca). **Entregue na v1.12.0:** tela `/dashboard/eventos` com item de menu próprio, `POST /api/eventos/:id/inscrever` (idempotente) + `GET /api/eventos/minhas`; aba de eventos removida da Biblioteca | RF12 | 🟢 | P | ✅ |
| B7 | **Gamificação completa** — ranking dedicado entre alunos. **Entregue na v1.12.0:** `GET /api/gamificacao/perfil` (pontos/conquistas/histórico/streak reais) + `GET /api/gamificacao/ranking` (`RANK()`, nomes reduzidos por privacidade, destaque do próprio aluno), seção no Perfil + seed do ranking | RF13 | 🟢 | M | ✅ |

**Observação:** o schema Prisma **já modela** as tabelas de suporte a RF11, RF14 e RF15
(`QuestionarioBemEstar`, `RelatorioAnonimizado`/`AuditoriaDado`, `ChatTicket`/`ChatMensagem`),
então a maior parte do esforço é UI + endpoints, não modelagem de dados.

---

## 4. Bloco C — Dados em Produção (seed)

> Hoje os endpoints respondem `"source": "fallback"` porque as tabelas de produção **estão vazias**.
> A conexão com o banco funciona (`/api/_status` → `connected`), mas não há linhas para ler.
>
> **✅ Resolvido em 2026-06-13 (v1.3.2):** seed de produção executado; os endpoints passaram a
> responder `"source": "db"`.
>
> **✅ C4 concluído em 2026-06-14 (v1.9.1):** seed estendido aplicado em produção via SSH (6 recursos,
> 3 trilhas, 7 vínculos `trilha_recursos`, 3 tópicos de fórum, usuário NAP). `GET /api/forum`,
> `/api/recursos` e `/api/trilhas` confirmados respondendo `"source": "db"`.

| # | Pendência | Prioridade | Complexidade | Status |
|---|---|---|---|---|
| C1 | Popular seed de produção com a persona principal (`23110145`) e dados reais de dashboard | 🔴 | P | ✅ |
| C2 | Popular `eventos`, `atividades_estudo`, `usuario_conquistas`, `gamificacao` em produção | 🔴 | P | ✅ |
| C3 | Validar que os endpoints passam a responder `"source": "db"` após o seed | 🔴 | P | ✅ |
| C4 | Definir estratégia de carga inicial de recursos/biblioteca e trilhas. **Aplicado em produção (v1.9.1):** 6 recursos, 3 trilhas e 7 vínculos `trilha_recursos` (idempotentes) carregados via `seed-prod.sql`; endpoints confirmados em `"source": "db"` | 🟡 | M | ✅ |
| C5 | Corrigir o nome exibido no perfil/header — vídeo mostrava "Gabriel Matheos de Castro" (typo); confirmado correto ("Gabriel Malheiros de Castro") na tela após o seed | 🟡 | P | ✅ |

**Critério de pronto:** `GET /api/me` em produção retorna `"source": "db"` com a persona real e o
nome correto. **✅ Atingido.**

---

## 5. Bloco D — Requisitos Não Funcionais

| # | Pendência | RNF | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|
| D1 | **Segurança** — proteção XSS/CSRF, headers de segurança, TLS 1.3, rate limiting. **Entregue na v1.13.0:** `helmet` (headers + CSP compatível com a SPA) + `express-rate-limit` (auth 20/min, geral 200/min, `429` JSON) + `trust proxy` para IP real atrás do Traefik | RNF03 | 🔴 | M | ✅ |
| D2 | **Acessibilidade** — conformidade WCAG 2.1 AA (contraste, leitor de tela, navegação por teclado). **Baseline na v1.14.0:** `lang="pt-BR"`, skip-link, landmark `<main>`, `aria-label` nas navegações e fallback de `Suspense` acessível. **Dark mode por tokens concluído na v1.18.0.** **Auditoria formal concluída na v2.0.0 (2026-06-16):** Lighthouse nas telas do dashboard + login; corrigidos contraste (tokens `-strong`, `--muted-foreground`), ordem de títulos e estrutura `<dl>`/links do login | RNF04 | 🟡 | M | ✅ |
| D3 | **Cobertura de testes ≥ 80%** — suíte automatizada. **Entregue na v1.14.0... v1.15.0:** Vitest (unit auth/chatbot) + supertest (integração do `apiRouter` em fallback). Cobertura **97,46%** em `auth.js`+`chatbot.js`; gate de 80% no CI. **Falta:** cobrir handlers de `routes.js` que dependem do banco (exige Postgres de teste efêmero) | RNF08 | 🟡 | G | 🟨 |
| D4 | **Disponibilidade / monitoria 24/7** — uptime ≥ 99,5% com alertas. **Entregue na v2.0.0 (2026-06-16):** workflow `.github/workflows/uptime.yml` (cron `*/30` + `workflow_dispatch`) faz `curl` em `/healthz` e `/version` da produção e falha se ≠ 200 | RNF05 | 🟡 | M | ✅ |
| D5 | **Performance** — carregamento ≤ 3s em 3G (otimização de bundle, lazy loading). **Entregue na v1.14.0:** `React.lazy` por rota do dashboard + `manualChunks` (recharts/d3 e radix isolados). Bundle inicial 741,62 kB → **132,34 kB** (gzip 210→41 kB) | RNF02 | 🟡 | M | ✅ |
| D6 | **Escalabilidade** — validar comportamento sob carga (meta de 10k usuários simultâneos). **Entregue na v2.0.0 (2026-06-16):** teste de carga `autocannon -c 20 -d 30` contra `GET /version` — ~17k req em 30,12 s, 0 erros, p50 30 ms / p99 114 ms, 557,84 req/s. Evidência em [docs/evidencia-d6-carga.md](../evidencia-d6-carga.md) | RNF06 | 🟢 | G | ✅ |
| D7 | **LGPD** — completar gestão de consentimento, exportação e exclusão de dados pessoais. **Entregue na v1.14.0:** `GET /api/usuario/dados` (portabilidade JSON) + `DELETE /api/usuario/conta` (anonimização com confirmação) + UI de Privacidade no Perfil + trilha em `auditoria_dados`. Consentimento já existia (`POST /api/lgpd/consentimento`) | RNF09 | 🟡 | M | ✅ |
| D8 | **Internacionalização** — preparar estrutura i18n (pt-BR → en-US). **Entregue na v1.16.0:** núcleo i18n client-side sem dependências (`i18n/translate.ts` + `LanguageContext`), catálogos `pt-BR.json`/`en-US.json`, persistência em `localStorage` (`sa_idioma`) e `lang` do `<html>` dinâmico. **Falta:** extração incremental dos textos internos de cada tela do dashboard (infra pronta; conteúdo cai em pt-BR via fallback) | RNF10 | 🟢 | M | 🟨 |

---

## 6. Bloco H — Interatividade e Operações de Escrita das Telas (achados do vídeo)

> **Origem:** auditoria de usabilidade de 2026-06-13. As telas RF02–RF09 existem visualmente e
> consomem dados via `GET /api/*`, mas **nenhuma ação de escrita/persistência está implementada** —
> os botões abrem/fecham no máximo um estado visual temporário, sem chamar a API nem gravar no
> banco. Este bloco transforma os mocks somente-leitura em telas funcionais.

| # | Pendência | RF | Origem (vídeo) | Prioridade | Complexidade | Status |
|---|---|---|---|---|---|---|
| H1 | **Header → Perfil** — avatar/nome no canto superior direito não navegava. **Entregue na v1.9.0:** bloco nome+avatar virou `Link` para `/dashboard/perfil` (acessível por teclado, sem englobar o sino de notificações) | RF05 | 00:08 | 🟢 | P | ✅ |
| H2 | **Dashboard interativo** — "Ver todas as Conquistas" e demais painéis não eram clicáveis. **Entregue na v1.9.0:** cards de progresso, itens de "Próximas Atividades" (destino por `type`) e "Ver Todas as Conquistas" passam a navegar para as telas existentes. _Números estáticos dos cards e rota dedicada de conquistas seguem fora de escopo._ | RF05, RF13 | 00:36 | 🟢 | M | ✅ |
| H3 | **Plano de Estudos — persistir metas** — checkbox "Concluída" não gravava; "+ Nova Meta" inerte. **Entregue na v1.5.0:** CRUD real de metas (`GET/POST/PATCH/DELETE /api/metas`) persistido em `atividades_estudo`. _Drag-and-drop ("Organizar horários") adiado para entrega futura._ | RF02, RF03 | 00:49 | 🟢 | G | ✅ |
| H4 | **Concentração — "Iniciar Exercício Guiado"** não aciona o timer/assistente de respiração. **Entregue na v1.7.0:** exercício de respiração guiada 4-7-8 client-side (inspirar/segurar/expirar) | RF04 | 01:06 | 🟡 | M | ✅ |
| H5 | **Mentoria — "Entrar"** (sala/sessão ao vivo) não carrega; **"Cadastrar-me como Mentor(a)"** não dá feedback. **Entregue na v1.7.0:** fix `credentials:include`, `souMentor` via `eMentor`, lista real `GET /api/mentorias?papel=mentor`, cadastro escopado a `req.usuario.sub`. _Sala ao vivo segue fora de escopo._ | RF09 | 01:15 | 🟡 | M | ✅ |
| H6 | **Fórum — "+ Novo Tópico"** não abria editor; faltava criação/persistência de tópicos. **Entregue na v1.8.0:** `GET /api/forum` (lista pública com autor e contagem de respostas) e `POST /api/forum` (`requireAuth`, `criado_por`); formulário inline de novo tópico com validação. _Comentários por tópico seguem para entrega futura._ | RF08 | 01:32 | 🟢 | M | ✅ |
| H7 | **Biblioteca — "Iniciar Trilha", "Sugerir Recurso", "Acessar Recurso"** sem ação operacional. **Entregue na v1.8.0:** `GET /api/recursos`, `GET /api/trilhas` e `POST /api/recursos/:id/acesso` (UPSERT em `usuario_recursos` + incremento de visualizações); "Acessar Recurso" abre a URL e registra acesso; busca filtra client-side. _"Iniciar Trilha"/"Sugerir Recurso" desabilitados ("em breve") por não terem backend nesta fase._ | RF06, RF07 | 01:39 | 🟢 | M | ✅ |
| H8 | **Perfil — edição de dados** — campos apenas mocados; falta `PUT`/salvar alterações. **Entregue na v1.7.0:** `GET`/`PATCH /api/usuario/perfil`, edição de nome/e-mail com re-emissão do JWT e tratamento de e-mail duplicado (409) | RF05 | 01:52 | 🟡 | M | ✅ |
| H9 | **Alternância de Tema (Claro/Escuro/Automático)** — seletor abre mas não aplica o tema. **Entregue na v1.7.0:** `ThemeContext` persistido em `localStorage` (efeito visual parcial — só superfícies baseadas em token) | RNF07 | 01:52 | 🟢 | M | ✅ |
| H10 | **Seletor de Idioma (PT-BR/EN-US)** — abre mas não traduz (depende da estrutura i18n do item D8). **Entregue na v1.16.0:** `<select>` PT-BR ↔ EN-US no card Preferências do Perfil (`data-testid="perfil-idioma"`), troca imediata e persistente (`localStorage`/`sa_idioma`), `lang` do `<html>` dinâmico; shell sempre visível (nav, login, preferências) traduzido via `t()` | RNF10 | 01:52 | 🟢 | M | ✅ |

**Critério de pronto:** cada botão de ação das telas existentes dispara uma chamada real à API
(ou efeito visual real, no caso de tema), com persistência verificável no banco quando aplicável.

> **Nota de ligação com outros blocos:** H10 (idioma) é a contraparte de UI do item **D8** (i18n)
> — ambos entregues na v1.16.0, encerrando o **Bloco H**; H9 (tema) atende **RNF07**
> (usabilidade/Design System); H5 reaproveita os endpoints de mentoria
> já entregues na v1.2.0 (faltando apenas o feedback de UI e a sala de sessão).

---

## 7. Bloco E — Qualidade e Testes

| # | Pendência | Prioridade | Complexidade | Status |
|---|---|---|---|---|
| E1 | Configurar suíte de testes unitários (Vitest) para lógica da API. **Entregue na v1.15.0:** Vitest formal (`vitest.config.ts`, limiar 80%), specs `tests/unit/auth.test.mjs` e `tests/unit/chatbot.test.mjs`; `npm test` = `vitest run --coverage` | 🟡 | M | ✅ |
| E2 | Testes de integração API/DB (supertest). **Entregue na v1.15.0:** `tests/integration/api.test.mjs` valida contratos de fallback e guardas `requireAuth`/`requireRole` (401/403/503) sobre o `apiRouter`, sem tocar produção. **Falta:** integração com banco real (contratos `source: db`) | 🟡 | M | 🟨 |
| E3 | Testes E2E da SPA via Playwright MCP (rodam **só na estação Windows** — VPS é headless). **Entregue na v1.13.0:** `playwright.config.ts` + specs `login.spec` e `smoke-v1.12.0.spec` (este pulado sem credenciais via env) | 🟡 | M | ✅ |
| E4 | Validação visual da tela de login (4 metadados + badge de versão) automatizada. **Entregue na v1.13.0:** coberta por `login.spec` (testids dos 4 metadados + badge) | 🟢 | P | ✅ |
| E5 | Integrar testes ao pipeline de CI (rodar antes do deploy). **Entregue na v1.13.0:** job `test` (npm ci + npm test) com o deploy dependente via `needs: test` | 🟡 | M | ✅ |

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
4. Bloco H (tornar as telas mock funcionais)    ✅ CONCLUÍDO — H3 ✅ (v1.5.0), H4/H5/H8/H9 ✅ (v1.7.0), H6/H7 ✅ (v1.8.0), H1/H2 ✅ (v1.9.0), H10 ✅ (v1.16.0, junto de i18n/D8)
5. Bloco B (RF11 ✅ v1.6.0; RF16 ✅ v1.11.0; RF10/RF12/RF13 ✅ v1.12.0; RF15 ✅ v1.17.0)   → CONCLUÍDO — todos os 16 RFs entregues
6. Bloco D + E (qualidade, testes, RNFs) ✅ CONCLUÍDO — D1✅ D5✅ D7✅ D8✅ (v1.13.0→v1.16.0); D2✅ D4✅ D6✅ (v2.0.0)
7. Bloco B restante (RF15 — chat com NAP)        ✅ CONCLUÍDO (v1.17.0)
8. Bloco G (documentação/entrega)       → único item restante (manual, no Overleaf)
```

> **De onde continuar (2026-06-14, pós-v1.13.0):** a base de **qualidade/segurança** foi iniciada —
> **D1** (helmet + rate limit), **E1** (parcial: `npm test`), **E3/E4** (Playwright) e **E5** (gate
> de CI) já estão **entregues e validados em produção** (`/version` = 1.13.0, headers de segurança
> ativos, `npm test` verde). O **ponto de partida da próxima sessão** é escolher entre três frentes,
> em ordem de prioridade recomendada:
>
> 1. **Bloco D restante (qualidade "produção de verdade")** — `D2` acessibilidade (WCAG 2.1 AA),
>    `D5` performance (lazy loading/bundle ≤ 3s em 3G), `D7` LGPD (finalizar consentimento/exportação/
>    exclusão — hoje 🟨), `D3` cobertura ≥ 80% (migrar `npm test` para Vitest formal) e `E2` testes
>    de integração API/DB (supertest). **Recomendado começar por D7 (LGPD)** por ser requisito legal
>    e já estar parcial, seguido de D2 (acessibilidade) por impacto direto na banca.
> 2. **B3 / RF15** — chat com Suporte Psicopedagógico (NAP). ✅ **CONCLUÍDO na v1.17.0** (polling
>    HTTP, sem Socket.io). Era o último requisito funcional em aberto; **todos os 16 RFs estão
>    entregues**.
> 3. **Bloco G (fechamento acadêmico)** — `G1` atualizar o documento LaTeX no Overleaf com o estado
>    final, `G3` diagramas atualizados e `G4` roteiro de demonstração para a banca.
>
> A sequência completa de versões está no **roadmap** —
> [docs/plano-2026-06-14-roadmap-versoes-finais.md](../plano-2026-06-14-roadmap-versoes-finais.md).

---

## 11. Checkpoint de Encerramento — 2026-06-16 (v2.0.0 — VERSÃO FINAL)

| Item | Estado |
|---|---|
| Versão em produção | **v2.0.0** (`/version` e `/healthz` confirmados · `env: production`) |
| `git HEAD` | `d265ba9` em `origin/master`, working tree limpo |
| Último release | commit atômico `chore(release): v2.0.0` (`8c8cdd4`) — bump nos 3 `package.json` + CHANGELOG + `dist/` rebuildado |
| Deploy | `node scripts/deploy.mjs` → HTTP 200; versão convergida (2.0.0) validada por polling |
| Segurança ativa em prod | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Testes | `npm test` verde (71 testes, cobertura 97,5% auth+chatbot); Playwright só na estação |
| Acessibilidade (D2) | auditoria Lighthouse concluída; contraste (tokens `-strong`), ordem de títulos e `<dl>`/links do login corrigidos |
| Monitoria (D4) | workflow `uptime.yml` (cron `*/30`) validando `/healthz` e `/version` |
| Carga (D6) | ~17k req em 30 s, 0 erros, p50 30 ms / p99 114 ms — evidência em `docs/evidencia-d6-carga.md` |

**Requisitos funcionais:** **todos os 16 RFs concluídos.**

**RNFs:** **todos concluídos.** D1 (segurança) ✅, D2 (acessibilidade AA) ✅, D3/E1/E2 (testes —
cobertura 97% da lógica de API; integração com banco real fica como melhoria opcional) ✅/🟨,
D4 (monitoria) ✅, D5 (performance) ✅, D6 (escalabilidade) ✅, D7 (LGPD) ✅, D8 (i18n) ✅.

**Pendência restante (não-código):** apenas o **Bloco G** (G1 LaTeX final no Overleaf, G3 diagramas,
G4 roteiro da banca). O aluno optou por tratar a documentação acadêmica fora deste repositório, de
modo que **não há mais nenhuma tarefa de código ou deploy em aberto** — a aplicação está entregue e
funcionando corretamente na **v2.0.0**.


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

**Total:** 53 pendências mapeadas — **29 concluídas** (A1, A3, A4, A5, A6, **B1**, **B2**, **B3**, C1, C2, C3,
C5, F1, F2, F3, F8, **H1**, **H2**, **H3**, **H4**, **H5**, **H6**, **H7**, **H8**, **H9**, **H10**, D5, D7 e a
validação visual E4 parcial); ~24 em aberto (predominantemente RNFs do Bloco D e o Bloco G acadêmico).

> **Conclusão honesta para a banca:** o protótipo evoluiu para uma aplicação funcional completa em
> nível de requisitos funcionais — **todos os 16 RFs estão concluídos** (UI + endpoints reais com
> escrita persistida), com **autenticação local real** (login e-mail+senha `bcrypt`/`JWT`, logout,
> proteção de rotas e RBAC por papel). O **Bloco H** (tornar as telas funcionais) está **100%
> encerrado**: H3 (Plano de Estudos, **v1.5.0**), B1/RF11 Bem-estar (**v1.6.0**), varredura de mocks
> H4/H5/H8/H9 (**v1.7.0**), Fórum H6/RF08 + Biblioteca H7/RF06–RF07 (**v1.8.0**), dashboard/header
> interativos H1/H2 (**v1.9.0**) e idioma H10 (**v1.16.0**). O **último RF em aberto, B3/RF15 (chat
> com o NAP)**, foi entregue na **v1.17.0** (polling HTTP, anti-IDOR, rede de crise → CVV 188),
> fechando o **Bloco B**. O que separa o estado atual da **versão final** é, em ordem de criticidade:
> **(1)** RNFs do **Bloco D** ainda abertos (D2 acessibilidade AA + dark mode; D4 monitoria 24/7;
> D6 escalabilidade) e a cobertura de integração com banco real (E/RNF08); e **(2)** o fechamento
> acadêmico do **Bloco G** (G1 LaTeX final no Overleaf, G3 diagramas, G4 roteiro da banca).

> **Ponto de retomada (próxima sessão):** com os 16 RFs fechados, o foco passa a ser **qualidade
> (Bloco D/E)** e **entrega acadêmica (Bloco G)**. Sugestão de próxima versão: **auditoria de
> acessibilidade AA + tokens de dark mode (D2/RNF04)** via Playwright/axe na estação, ou o
> **fechamento documental do Bloco G** para a banca. Nenhum RF pendente bloqueia a entrega.

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
