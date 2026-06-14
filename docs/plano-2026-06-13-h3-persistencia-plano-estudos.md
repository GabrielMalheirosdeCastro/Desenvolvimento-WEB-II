# Plano de Ação — H3: Persistência do Plano de Estudos (CRUD de metas)

**Data:** 2026-06-13
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** Item **H3** do [docs/atividades/pendencias-versao-final-producao.md](atividades/pendencias-versao-final-producao.md).
A tela [apps/web/src/app/pages/StudyPlanPage.tsx](../apps/web/src/app/pages/StudyPlanPage.tsx) é hoje um
mock somente-leitura: os "goals" vivem em `useState`, o checkbox só altera estado local e os botões
"+ Nova Meta", editar e excluir são inertes. O objetivo é torná-la funcional com persistência real
no Postgres, sem quebrar o código existente nem o deploy no EasyPanel.

## Objetivo

Entregar um **slice vertical mínimo e seguro** de CRUD de metas:
1. Listar as metas reais do usuário autenticado (não mais o mock).
2. Criar nova meta (botão "+ Nova Meta" → formulário → grava no banco).
3. Marcar/desmarcar como concluída (checkbox → grava status no banco).
4. Excluir meta (botão lixeira → remove do banco).

**Fora de escopo nesta entrega** (para reduzir risco e evitar over-engineering):
- Edição inline (botão lápis) — fica para um H3.2 posterior.
- Drag-and-drop / "Organizar Horários" (item de baixa prioridade no Bloco H).
- Metas semanais agregadas (`metas_semanais`) — usaremos `atividades_estudo`.

## Decisões técnicas (para não quebrar nada)

- **Mapeamento de dados:** o "goal" da UI (`title`, `subject`, `deadline`, `completed`) mapeia para a
  tabela **já existente** `atividades_estudo`:
  - `title` → `nome`
  - `subject` → `descricao`
  - `deadline` → `data_agendada`
  - `completed` → `status` (`'done'` | `'pending'`) + `data_realizacao` (preenchida ao concluir)
  - **Nenhuma migration nova** — as tabelas já estão em produção desde 2026-04-30.
- **Endpoints aditivos** em [apps/api/routes.js](../apps/api/routes.js), todos protegidos por `requireAuth`
  e escopados ao dono via `usuario_id = req.usuario.sub`:
  - `GET    /api/metas` — lista metas do usuário logado.
  - `POST   /api/metas` — cria meta `{ title, subject, deadline }`.
  - `PATCH  /api/metas/:id` — alterna `completed` (atualiza `status`/`data_realizacao`).
  - `DELETE /api/metas/:id` — exclui (com checagem de propriedade).
  - **Não altero** as rotas `GET /api/dashboard/*` nem as `MATRICULA_PADRAO` (continuam intactas).
- **Resolução do plano:** cada meta exige `plano_estudo_id`. O backend busca o plano mais recente do
  usuário; se não houver, cria um "Plano padrão" (idempotente). Tudo escopado a `usuario_id`.
- **Segurança (OWASP):** queries 100% parametrizadas (sem concatenação); toda mutação valida
  propriedade (`WHERE id = $1 AND usuario_id = $2`); `:id` validado como inteiro; entrada (title)
  validada/limitada em tamanho. Sem dados sensíveis em logs.
- **Frontend:** `fetch` com `credentials: 'include'` (a tela já está sob `ProtectedRoute`). Estados de
  carregando/vazio/erro tratados. Estatísticas (total/concluídas/pendentes) passam a ser **calculadas**
  das metas reais, não mais hardcoded.

## Etapas

- [ ] 1. **Backend** — adicionar os 4 endpoints (`GET/POST/PATCH/DELETE /api/metas`) em `routes.js`,
      com `requireAuth`, parametrização e checagem de propriedade. Helper interno para obter/criar o
      plano do usuário.
- [ ] 2. **Revisão 1** — reler o diff do backend; validar SQL, status codes (400/401/403/404/503),
      e resiliência quando `!isConnected()`.
- [ ] 3. **Validação backend isolada** — subir API local com túnel SSH ao banco; testar os 4 endpoints
      via `curl` autenticado (login → cookie → CRUD → conferir no banco). Sem browser.
- [ ] 4. **Frontend** — reescrever `StudyPlanPage.tsx`: carregar via `GET /api/metas`, formulário de
      nova meta, checkbox→`PATCH`, lixeira→`DELETE`, estatísticas calculadas, estados de loading/vazio.
- [ ] 5. **Revisão 2** — reler o diff do frontend; conferir tipos TS, acessibilidade básica do form,
      tratamento de erro, zero regressão visual nas demais telas.
- [ ] 6. **Build + lint** — `npm run build` (regenera `apps/web/dist` versionado) e `get_errors` limpo.
- [ ] 7. **Validação E2E na estação** — via Playwright MCP (a VPS é headless): login → criar meta →
      marcar concluída → recarregar (persistiu) → excluir. Conforme §2.5 das instruções.
- [ ] 8. **Versionamento** — bump MINOR `1.4.1 → 1.5.0` (nova feature) nos 3 `package.json`,
      atualizar `CHANGELOG.md` e a pendência H3 para ✅.
- [ ] 9. **Commit atômico** (Conventional Commits pt-BR) + push `master`.
- [ ] 10. **Deploy** — redeploy EasyPanel (`scripts/deploy.mjs`), aguardar publicação, validar
      `/version` == 1.5.0 e `/healthz` ok (§12.1).
- [ ] 11. **Verificação pós-deploy** — em produção, login + criar/concluir/excluir uma meta de teste
      e remover o dado de teste ao final.

## Impacto Esperado

- Arquivos modificados: `apps/api/routes.js`, `apps/web/src/app/pages/StudyPlanPage.tsx`,
  `apps/web/dist/**` (rebuild), `package.json` (x3), `CHANGELOG.md`,
  `docs/atividades/pendencias-versao-final-producao.md`.
- Banco: **sem migration** (tabelas já existem). Apenas novas linhas em `atividades_estudo`/`planos_estudo`.
- README: sem mudança estrutural (não atualizar).

## Riscos e Cuidados

- **Quebra de deploy (OOM no build do Vite na VPS):** mitigado — o `dist` é buildado **localmente** e
  versionado em git; o Dockerfile só copia o `dist`. Sempre rodar `npm run build` antes do commit.
- **Regressão nas rotas existentes:** evitada — endpoints novos são aditivos; nada do que existe é tocado.
- **IDOR (acessar meta de outro usuário):** evitado — toda query filtra por `usuario_id = req.usuario.sub`.
- **Token antigo sem `sub`:** improvável (auth recém-implementada); `requireAuth` rejeita token inválido.
- **Tela fora do ar se a API falhar:** tratamento de erro/vazio no front evita tela branca.

## Critério de Conclusão

- Em produção (v1.5.0), um usuário autenticado cria uma meta, ela persiste após recarregar a página,
  o checkbox grava o status no banco e a exclusão remove a meta — tudo validado via Playwright MCP na
  estação e confirmado no banco. `/version` retorna `1.5.0` e `/healthz` `ok`. Rotas e telas
  pré-existentes permanecem sem regressão.
