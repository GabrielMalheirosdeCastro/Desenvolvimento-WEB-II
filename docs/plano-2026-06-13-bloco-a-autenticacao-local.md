# Plano de Ação — Bloco A: Autenticação Local (e-mail + senha)

**Data:** 2026-06-13
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** O protótipo dispensa login real (decisão B4): a rota `/` redireciona direto para
`/dashboard` e a API usa uma `MATRICULA_PADRAO = '23110145'` fixa para simular o usuário logado.
Sem autorização institucional para SSO/OAuth 2.0 da FAESA (item A2 descartado), a autenticação
passa a ser **local**: cadastro/ativação por e-mail + senha, hash `bcrypt` e sessão `JWT`.

---

## Objetivo

Implementar autenticação local real e proteção de rotas, fechando o Bloco A do relatório de
pendências (A1, A3, A4, A5, A6). Ao final: o usuário só acessa `/dashboard` após autenticar com
e-mail + senha; "Sair" encerra a sessão de verdade; rotas de coordenação exigem papel
`coordenador`; a API deixa de depender da `MATRICULA_PADRAO` e passa a identificar o usuário pelo
token.

---

## Decisões de Arquitetura (travadas)

| # | Decisão | Opção escolhida | Justificativa técnica |
|---|---------|-----------------|------------------------|
| D1 | Armazenamento do token no cliente | **Cookie `httpOnly` + `SameSite=Strict` + `Secure`** | Frontend é servido pelo mesmo Express/mesmo domínio (`acolhimento.faesa.gmcsistemas.com.br`), logo same-origin — cookie funciona sem CORS cross-site. `httpOnly` impede leitura por JS (mitiga XSS, atende RNF03). `localStorage` ficaria exposto a XSS. |
| D2 | Validação de e-mail no cadastro | **Restrito ao domínio FAESA por regex de formato** | O seed já usa `@faesa.br`. Valida `^[^@\s]+@faesa\.br$` (mais variações se necessário). Sem federação externa — apenas validação de formato. |
| D3 | Modelo de cadastro | **Restrito: ativação de matrícula pré-cadastrada** | A tabela `usuarios` já existe com `matricula_institucional UNIQUE`. O usuário define a senha para uma matrícula+e-mail que já constam no banco (fluxo "ativar conta"). Evita registro aberto e mantém integridade institucional. |
| D4 | Hash de senha | **`bcrypt` (cost factor 12)** | Padrão de mercado, resistente a brute-force. Custo 12 equilibra segurança e latência. |
| D5 | Assinatura do JWT | **`HS256` com segredo em `JWT_SECRET` (env)** | Suficiente para single-service. Segredo forte via variável de ambiente no EasyPanel; nunca commitado. Expiração curta (ex.: 8h). |
| D6 | Papéis (RBAC) | **Coluna `tipo_usuario` existente + middleware `requireRole`** | Valores: `ALUNO`, `MENTOR`, `COORDENADOR`. Sem enum no banco hoje — validação na aplicação. |

> **Pré-condição operacional (D3):** para o usuário conseguir ativar a conta, a matrícula precisa
> já existir em `usuarios`. Gabriel (`23110145`) já está no seed. Para novos usuários reais, a
> inserção da matrícula é responsabilidade de um fluxo administrativo (fora do escopo deste bloco).

---

## Etapas

### Fase 1 — Banco de dados (packages/db)
- [ ] 1. Adicionar coluna `passwordHash` (`password_hash TEXT NULL`) ao model `Usuario` no
  `schema.prisma`. Nullable para não quebrar registros existentes (matrícula sem senha = conta
  ainda não ativada).
- [ ] 2. Gerar migration Prisma (`add_password_hash`) e aplicá-la no banco de produção via túnel
  SSH (`scripts/dev-tunnel.ps1`) ou diretamente. Atualizar `schema.sql` para refletir a coluna.

### Fase 2 — Dependências
- [ ] 3. Instalar em `apps/api`: `bcryptjs`, `jsonwebtoken`, `cookie-parser`. (Optar por
  `bcryptjs` puro-JS evita problemas de build nativo no Docker/Alpine da VPS.)

### Fase 3 — Backend de autenticação (apps/api)
- [ ] 4. `server.js`: registrar `cookie-parser` antes das rotas.
- [ ] 5. Criar `apps/api/auth.js` com: `hashPassword`, `verifyPassword`, `signToken`,
  `verifyToken`, middleware `requireAuth` (lê cookie, valida JWT, injeta `req.usuario`) e
  `requireRole(...papeis)`.
- [ ] 6. Adicionar rotas em `routes.js`:
  - `POST /api/auth/ativar` — recebe `{ matricula, email, senha }`; valida domínio (D2); confere
    que a matrícula+e-mail existem e ainda não têm `password_hash`; grava o hash.
  - `POST /api/auth/login` — recebe `{ email, senha }`; valida credenciais; emite cookie JWT.
  - `POST /api/auth/logout` — limpa o cookie.
  - `GET  /api/auth/me` — retorna o usuário do token (substitui o `/api/me` hardcoded).
- [ ] 7. Refatorar as rotas `/api/*` existentes para usar `req.usuario.matricula` (do token) em
  vez de `MATRICULA_PADRAO`, protegendo-as com `requireAuth`. Rotas de coordenação recebem
  `requireRole('COORDENADOR')`.

### Fase 4 — Frontend (apps/web)
- [ ] 8. Criar `AuthContext` + hook `useAuth` (estado: usuário, `login`, `logout`, `loading`).
  No mount, chama `GET /api/auth/me` (cookie enviado automaticamente) para hidratar a sessão.
- [ ] 9. Reescrever `LoginPage.tsx`: formulário real com `email` + `senha`, chamando
  `POST /api/auth/login` (com `credentials: 'include'`). Manter o bloco obrigatório
  (Disciplina, Docente, Aluno, Repositório, badge de versão).
- [ ] 10. Criar página de ativação de conta (`/ativar`) consumindo `POST /api/auth/ativar`.
- [ ] 11. Implementar `ProtectedRoute`: redireciona para `/login` se não autenticado. Reverter o
  redirect `index` `/` → `/dashboard` para `/` → `/login` (A5).
- [ ] 12. Logout real (A6): botão "Sair" chama `POST /api/auth/logout`, limpa o contexto e
  navega para `/login`.
- [ ] 13. Garantir que todas as chamadas `fetch('/api/...')` usem `credentials: 'include'`.

### Fase 5 — Validação, versão e deploy
- [ ] 14. Testes: unitário de `hashPassword/verifyPassword/signToken`; smoke HTTP de
  `login`/`logout`/`me` (curl). Validação visual E2E da tela de login **somente na estação via
  Playwright MCP** (VPS é headless — Seção 2.5).
- [ ] 15. Bump de versão (MINOR — nova feature) em `package.json` (raiz, `apps/api`, `apps/web`),
  mover `[Unreleased]` → nova seção no `CHANGELOG.md`, atualizar `README.md`.
- [ ] 16. Commits atômicos (Seção 9.1), push, redeploy no EasyPanel e validação `/version`
  (Seção 12.1).

---

## Impacto Esperado

- **Arquivos que serão modificados/criados:**
  - `packages/db/prisma/schema.prisma`, nova migration, `packages/db/schema.sql`
  - `apps/api/package.json`, `apps/api/server.js`, `apps/api/routes.js`, **novo** `apps/api/auth.js`
  - `apps/web/src/app/routes.tsx`, `apps/web/src/app/App.tsx`,
    `apps/web/src/app/pages/LoginPage.tsx`, **nova** página de ativação,
    **novo** `AuthContext`/`useAuth`, **novo** `ProtectedRoute`
  - `package.json` (×3), `CHANGELOG.md`, `README.md`
  - `docs/atividades/pendencias-versao-final-producao.md` (marcar A1/A3/A4/A5/A6)
- **Variáveis de ambiente novas (EasyPanel):** `JWT_SECRET`, `JWT_EXPIRES_IN` (ex.: `8h`),
  `COOKIE_SECURE` (`true` em produção).
- **README/CHANGELOG precisam ser atualizados?** Sim.
- **`.tex` (Overleaf):** RF01/RNF03/stack/diagrama já ajustados na sessão anterior — sem nova
  alteração obrigatória neste bloco.

---

## Riscos e Cuidados

- **Migration em produção:** adicionar `password_hash` como NULL é não-destrutivo, mas a aplicação
  da migration toca o banco de produção (mesmo banco usado em dev via túnel). Fazer backup lógico
  da tabela `usuarios` antes (alinha com a pendência F2).
- **`JWT_SECRET` ausente:** se a env não existir em produção, o login quebra. A app deve **falhar
  explicitamente** na inicialização se `JWT_SECRET` não estiver setado (não usar fallback inseguro).
- **Cookie `Secure` em dev:** em `localhost` sem HTTPS o cookie `Secure` não é enviado. Usar
  `COOKIE_SECURE=false` no ambiente local.
- **Bloqueio de acesso:** ao reverter `/` → `/login` e proteger as rotas, qualquer regressão deixa
  o app inacessível. Validar o fluxo completo localmente antes do deploy.
- **OOM no build (histórico):** o build do `vite` já estourou RAM na VPS; o swap de 4 GiB mitigou.
  Sem relação direta, mas atenção ao tamanho do bundle ao adicionar telas.
- **`isConnected()` falso-positivo (db.js):** bug conhecido fora do escopo; não confiar em
  `/api/_status` para validar auth.

---

## Critério de Conclusão

- Acesso a `/dashboard` (e subrotas) exige login válido; sem sessão, redireciona para `/login`.
- `POST /api/auth/login` com credenciais corretas emite cookie `httpOnly` e o dashboard carrega
  dados reais (`source: db`) do usuário do token, sem `MATRICULA_PADRAO`.
- "Sair" encerra a sessão (cookie limpo) e retorna a `/login`.
- Rota(s) de coordenação respondem `403` para papel diferente de `COORDENADOR`.
- Versão publicada em produção (`/version`) bate com `package.json` e a tela de login real aparece
  em <https://acolhimento.faesa.gmcsistemas.com.br>.

---

## Sequência de Execução por Sessão (sugerida)

1. **Sessão 1:** Fase 1 + Fase 2 + Fase 3 (backend completo, validado via curl). Commit.
2. **Sessão 2:** Fase 4 (frontend + contexto + proteção de rotas). Validação Playwright MCP.
3. **Sessão 3:** Fase 5 (bump, docs, deploy, verificação de versão).
