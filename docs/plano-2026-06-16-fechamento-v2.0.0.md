# Plano de Ação — Fechamento da versão v2.0.0 (Entrega Acadêmica Final)

**Data:** 2026-06-16
**Solicitado por:** Gabriel Malheiros de Castro (matrícula 23110145)
**Contexto:** O projeto está em **v1.30.0** em produção, com os 16 RFs implementados. A frente
**E3** (teste E2E da jornada principal) já foi registrada (commits `3d0d078`, `cf759a8`). Restam
três frentes — **D2** (acessibilidade WCAG AA), **D4** (monitoramento de uptime) e **D6** (carga) —
antes do bump MAJOR para **v2.0.0**. Este plano descreve o fechamento sem quebrar o código e
respeitando as restrições críticas de deploy/EasyPanel.

## Objetivo

Concluir as três frentes pendentes (D2, D4, D6), colar os snippets do Bloco G no Overleaf e
executar o bump final v2.0.0 com redeploy validado, **sem nenhuma regressão** de comportamento e
**sem impacto colateral** no pipeline do EasyPanel.

## Restrições Críticas de Deploy/EasyPanel (invariantes deste plano)

- O [Dockerfile](../Dockerfile) é single-stage e copia para a imagem **apenas**
  `package.json`, `apps/api/` e `apps/web/dist/`. **Nunca** `tests/`, `docs/`, `.github/` ou
  `packages/`. Logo, mudanças nesses diretórios são **inertes** para o artefato publicado.
- O `apps/web/dist/` é **versionado** e precisa ser **regenerado** (`npm run build`) antes de
  qualquer commit que altere o frontend (estratégia de 2026-05-03 contra OOM do Vite na VPS).
- O workflow [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) já ignora
  `docs/**`, `*.md`, `*.tex`, `packages/**`, `.vscode/**` via `paths-ignore` — então commits
  puramente documentais **não** disparam redeploy.
- Bump de versão e redeploy (Seções 11.1 e 12.1) ocorrem **somente** no passo final v2.0.0,
  porque é a única etapa que altera comportamento visível do app.
- `.tex` é editado **somente no Overleaf** (regra 0.1): o Bloco G entra por cópia manual.
- Testes de navegação/visual rodam **somente na estação** (Seção 2.5): a VPS é headless.

## Etapas

- [x] 1. **D4 — Workflow de uptime** (autônomo, feito pelo agente). Criar
  `.github/workflows/uptime.yml`: job agendado (`cron`) que faz `curl` em `/healthz` e `/version`
  da produção e falha se não responder 200. Arquivo novo em `.github/` → fora da imagem Docker,
  sem bump, sem redeploy.
- [ ] 2. **D2 — Auditoria WCAG AA** (execução do aluno + conserto do agente). Aluno roda Lighthouse
  (aba *Accessibility*) nas telas `/login`, `/dashboard`, `/dashboard/plano-estudos`,
  `/dashboard/bem-estar`, `/dashboard/forum`, `/dashboard/perfil` e cola o relatório. Agente
  corrige **apenas** as violações apontadas (contraste/token, `aria-label`, foco), validando com
  `npm test` + `npm run build`. Se houver correção visível → entra no bump v2.0.0.
- [ ] 3. **D6 — Teste de carga** (execução do aluno + registro do agente). Aluno roda
  `npx autocannon -c 20 -d 30 https://acolhimento.faesa.gmcsistemas.com.br/version` (endpoint leve,
  sem escrita) e cola a saída. Agente registra a evidência em `docs/`. Sem código, sem bump.
- [ ] 4. **Bloco G no Overleaf** (execução do aluno). Colar os snippets LaTeX (stack, diagramas
  TikZ, correções RF/RNF, bloco de conclusão) gerados nas etapas anteriores. Não toca o repo local.
- [ ] 5. **Bump v2.0.0** (agente, com confirmação). Aplicar correções de D2 (se houver) →
  `npm run build` (regenera `apps/web/dist/`) → bump `1.30.0 → 2.0.0` nos três `package.json`
  (raiz, `apps/api`, `apps/web`) → mover `[Unreleased]` para `## [2.0.0] - <data>` no CHANGELOG →
  commit atômico `chore(release): v2.0.0` → push.
- [ ] 6. **Redeploy + validação** (agente, Seção 12.1). `node scripts/deploy.mjs` → aguardar →
  `curl /version` deve retornar `2.0.0` e `/healthz` deve retornar `ok`. Comparar com `package.json`.

## Impacto Esperado

- Arquivos criados/modificados:
  - Etapa 1: `.github/workflows/uptime.yml` (novo).
  - Etapa 3: `docs/evidencia-d6-carga.md` (novo).
  - Etapa 2: possíveis ajustes pontuais em `apps/web/src/**` (somente se Lighthouse apontar).
  - Etapa 5: `package.json` (x3), `CHANGELOG.md`, `apps/web/dist/**` (rebuild).
- README precisa ser atualizado? Sim, na etapa 5 (badge/seção de versão, se aplicável).
- CHANGELOG precisa ser atualizado? Sim, na etapa 5.

## Riscos e Cuidados

- **D2 pode exigir mudança de cor/aria visível** → nesse caso há rebuild do `dist/` e redeploy.
  Validar contraste com `npm test` + inspeção visual via Playwright MCP na estação antes do push.
- **D4 cron na produção**: GET idempotente em `/healthz` e `/version` (endpoints públicos e leves).
  Frequência conservadora (ex.: a cada 30 min) para carga desprezível.
- **D6 autocannon**: mirar **somente** `/version` ou `/healthz` (sem escrita, sem autenticação)
  para não poluir o banco de produção. Duração curta (30 s) e concorrência moderada (20).
- **Bump v2.0.0**: é a única etapa que altera comportamento. Seguir o ritual completo das
  Seções 11.1/12.1; não declarar concluído até `/version` publicado bater com `package.json`.

## Critério de Conclusão

- D4: workflow `uptime.yml` válido no GitHub Actions, executando o cron e o `workflow_dispatch`
  com sucesso (200 em `/healthz` e `/version`).
- D2: relatório Lighthouse sem violações AA bloqueantes (ou todas corrigidas e revalidadas).
- D6: evidência de carga registrada em `docs/` com throughput/latência aceitáveis para o protótipo.
- Bloco G colado no Overleaf e documento compilando.
- v2.0.0 publicado: `curl https://acolhimento.faesa.gmcsistemas.com.br/version` retorna `2.0.0`
  e `/healthz` retorna `ok`, coincidindo com o `package.json` da branch `master`.
