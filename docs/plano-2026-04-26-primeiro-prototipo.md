# Plano de Ação — Desenvolvimento do Primeiro Protótipo

> **Projeto:** Site de Acolhimento FAESA
> **Data:** 2026-04-26
> **Objetivo:** Conduzir o agente, de ponta a ponta, na construção, validação e deploy do **primeiro protótipo funcional** do projeto, atuando em múltiplos papéis (Produto, Requisitos, Infra, Sistemas, Dev TDD e QA).

---

## 0. Contexto e Premissas Gerais

Antes de iniciar qualquer fase, o agente deve internalizar as seguintes regras invariantes que valem para **todas** as etapas:

### 0.1. Regras de Negócio Fixas (Tela de Login)
- Os dados de **`Disciplina`**, **`Docente`**, **`Aluno`** e **`Repositório`** **DEVEM** ser mantidos visíveis na tela de login. Nenhuma alteração de layout ou refatoração pode removê-los.
- O rótulo de versão **`site-acolhimento-faesa · v0.X.0`** exibido na tela de login é o **mecanismo oficial de validação de redeploy**. A cada build/versão publicada, o agente valida o sucesso do deploy apenas consultando a tela principal e conferindo o número de versão.
- Toda alteração de versão deve ser refletida em [package.json](../package.json), [CHANGELOG.md](../CHANGELOG.md) e na string exibida na tela de login.

### 0.2. Higiene Documental
- Em **toda** fase, o agente deve verificar se alguma documentação ou instrução em [docs/](../docs) ficou **desatualizada** em relação ao estado real do projeto.
- Documentação obsoleta deve ser **atualizada** ou **removida** (após confirmação com o desenvolvedor) — nada de manter arquivos zumbis.

### 0.3. Comunicação com o Desenvolvedor
- Sempre que houver **dúvida, ambiguidade ou lacuna**, o agente **deve perguntar ao desenvolvedor** antes de assumir qualquer coisa.
- Toda pergunta deve vir acompanhada de **pelo menos uma sugestão de solução** (preferencialmente 2–3 opções com prós/contras).
- Decisões tomadas devem ser registradas no final deste plano em "Registro de Decisões".

### 0.4. Ambiente de Execução de Testes — Playwright MCP

> **Regra crítica de infraestrutura.** O servidor de produção é uma **VPS Ubuntu 24.04 sem interface gráfica (headless)**. Por isso, **nenhum teste de navegação, E2E, visual ou de usabilidade pode ser executado na VPS**.

- **Onde rodam testes de UI/E2E:** **somente na estação de trabalho do desenvolvedor (Windows 11)**, que possui display, navegador e o **servidor MCP do Playwright** disponível para o agente.
- **Verificação obrigatória antes da Fase 7 e da Fase 8:** o agente **deve confirmar** se o **servidor MCP do Playwright** está **configurado e ativo na estação de trabalho**. Procedimento mínimo:
  1. Verificar se o MCP `playwright` aparece na lista de servidores MCP disponíveis na sessão atual.
  2. Se não aparecer, **interromper** as fases de teste UI e perguntar ao desenvolvedor:
     - "O servidor MCP do Playwright não está disponível nesta sessão. Você quer (a) instalar/habilitar o `@playwright/mcp` no VS Code da estação, (b) rodar os testes E2E manualmente, ou (c) adiar a validação E2E para a próxima sessão?"
  3. Registrar a decisão no Apêndice B.
- **Tipos de teste por ambiente:**

  | Tipo de teste | Onde executa | Ferramenta |
  |---------------|--------------|------------|
  | Unitário (lógica pura) | Estação **ou** VPS | Vitest/Jest |
  | Integração de API/DB (sem browser) | Estação **ou** VPS | Vitest/Jest + supertest |
  | E2E / navegação / login screen | **Somente estação** (headed ou headless local) | **Playwright via MCP** |
  | Validação visual da tela de login (`Disciplina`/`Docente`/`Aluno`/`Repositório` + `v0.X.0`) | **Somente estação** | **Playwright via MCP** |
  | Validação pós-deploy do rótulo de versão em produção | **Somente estação** | **Playwright via MCP** apontando para `https://acolhimento.faesa.gmcsistemas.com.br` |

- **Não tentar** instalar Chromium/Firefox na VPS para contornar a falta de GUI. Não é o ambiente adequado.

---

## Fase 1 — Análise da Situação Atual (Diagnóstico)

**Papel:** Analista Geral / Tech Lead

**Tarefas:**
1. Mapear a estrutura completa de [projects/Desenvolvimento-WEB-II/](../) listando: código-fonte, documentação, scripts, schema de banco, configurações de deploy.
2. Ler e resumir os arquivos-chave:
   - [README.md](../README.md)
   - [CHANGELOG.md](../CHANGELOG.md)
   - [server.js](../server.js)
   - [package.json](../package.json)
   - [public/index.html](../public/index.html) e [public/styles.css](../public/styles.css)
   - [banco-dados-requisitos-projeto/schema.sql](../banco-dados-requisitos-projeto/schema.sql)
   - [banco-dados-requisitos-projeto/der-fonte.mmd](../banco-dados-requisitos-projeto/der-fonte.mmd)
3. Identificar a **versão atual** declarada (package.json, CHANGELOG, login screen) e checar se estão sincronizadas.
4. Listar dependências instaladas e verificar se `node_modules` existe; rodar `npm install` se necessário.
5. Produzir um **resumo do estado atual** (1 página) cobrindo: o que existe, o que funciona, o que está incompleto.

**Entregável:** Resumo diagnóstico salvo como `docs/relatorios faesa/diagnostico-prototipo-v1.md`.

---

## Fase 2 — Análise de Produto

**Papel:** Analista de Produto

**Tarefas:**
1. Ler integralmente [site_acolhimento_faesa.tex](../site_acolhimento_faesa.tex) e extrair: visão, personas, jornadas, requisitos funcionais e não-funcionais declarados.
2. Verificar se existem **arquivos de design (Figma ou exports)** no projeto. Locais a checar:
   - Subpastas de [docs/](../docs)
   - [public/](../public)
   - Raiz do projeto
3. Cruzar texto LaTeX × código atual × tela de login existente, procurando:
   - **Incoerências** (ex.: feature descrita mas ausente)
   - **Lacunas** (ex.: tela mencionada sem mockup)
   - **Inconsistências** (ex.: terminologia divergente entre LaTeX e UI)
4. Validar que `Disciplina`, `Docente`, `Aluno`, `Repositório` e `site-acolhimento-faesa · v0.X.0` aparecem na tela de login conforme regra 0.1.
5. Caso arquivos do Figma **não estejam** no projeto, perguntar ao desenvolvedor:
   - "Os designs do Figma devem ser exportados para `docs/design/`? Ou usaremos apenas o link do Figma como referência?"
   - Sugerir: (a) export PNG/PDF + commit, (b) arquivo `.fig` versionado, (c) link público no README.

**Entregável:** Lista de incoerências/lacunas + perguntas pendentes anexadas ao diagnóstico.

---

## Fase 3 — Validação com o Desenvolvedor

**Papel:** Facilitador

**Tarefas:**
1. Consolidar **todas** as perguntas das Fases 1 e 2 em uma única rodada de validação.
2. Para cada pergunta, apresentar **2–3 opções de solução** com recomendação.
3. Aguardar respostas antes de prosseguir para a Fase 4. **Não assumir respostas.**
4. Registrar as decisões na seção "Registro de Decisões" deste documento.

**Critério de saída:** Todas as ambiguidades de produto resolvidas e documentadas.

---

## Fase 4 — Análise de Requisitos Técnicos

**Papel:** Analista de Requisitos

**Tarefas:**
1. Mapear, para cada feature do protótipo, os requisitos técnicos:
   - Endpoints de API necessários (cruzar com [docs/relatorio-api-site-acolhimento.md](relatorio-api-site-acolhimento.md))
   - Tabelas/colunas de banco (cruzar com [banco-dados-requisitos-projeto/schema.sql](../banco-dados-requisitos-projeto/schema.sql))
   - Componentes de UI
   - Regras de validação
2. Identificar gaps: o que falta no schema? Faltam endpoints? Faltam variáveis de ambiente?
3. Verificar consistência com [docs/documento-banco-de-dados-tecnologias.md](documento-banco-de-dados-tecnologias.md) e [docs/relatorio-tecnologias-banco-persistencia.md](relatorio-tecnologias-banco-persistencia.md).
4. Em caso de dúvida (ex.: "qual deve ser a regra de autenticação do aluno?"), perguntar ao desenvolvedor com sugestões.

**Entregável:** Matriz Feature × Requisitos Técnicos × Status (OK / Pendente / Bloqueado).

---

## Fase 5 — Análise de Infraestrutura

**Papel:** Analista de Infra / DevOps

**Tarefas:**
1. Validar acessos:
   - **Banco de dados:** conferir [SUPABASE-CREDENTIALS.txt](../../../SUPABASE-CREDENTIALS.txt) e [docs/secrets.md](secrets.md). Testar conexão via [banco-dados-requisitos-projeto/script.ts](../banco-dados-requisitos-projeto/script.ts) ou `psql`.
   - **Easypanel / Deploy:** revisar [docs/ambiente-producao-easypanel.md](ambiente-producao-easypanel.md) e [scripts/deploy.sh](../scripts/deploy.sh) / [scripts/deploy.mjs](../scripts/deploy.mjs).
   - **Postgres17 (workspace irmão):** validar que a stack [postgres17-supabase-easypanel](../../postgres17-supabase-easypanel/) está saudável (conferir `health-check.sh`).
   - **Playwright MCP (estação de trabalho):** confirmar disponibilidade conforme regra **0.4**. Sem MCP do Playwright, as Fases 7 (testes E2E) e 8 (QA visual) ficam **bloqueadas** até que o desenvolvedor habilite o servidor ou autorize execução manual.
2. Rodar smoke tests: `npm start` local, `curl` em endpoints básicos.
   - Os smokes via `curl` rodam em qualquer ambiente. Smokes que dependem de browser **só** rodam na estação via Playwright MCP.
3. Confirmar que `prisma generate` / migrations rodam sem erro.
4. Em caso de credencial faltando ou serviço fora do ar, **perguntar ao desenvolvedor** com proposta:
   - "A senha do Supabase parece inválida. Você quer (a) regenerar, (b) usar a credencial em `secrets.md`, (c) trocar para conexão local?"

**Entregável:** Checklist de infra com status verde/amarelo/vermelho por item.

---

## Fase 6 — Análise de Sistemas (Mapeamento de Alterações)

**Papel:** Analista de Sistemas

**Tarefas:**
1. Com base nas Fases 1–5, produzir o **plano executável** com a lista ordenada de mudanças no código:
   - Arquivos a criar
   - Arquivos a modificar
   - Arquivos a remover (após confirmação)
   - Migrations de banco a executar
   - Variáveis de ambiente a adicionar
2. Para cada item, definir:
   - Critério de aceite
   - Caso de teste correspondente (a ser escrito antes do código na Fase 7)
3. Estimar a **bump de versão** apropriada (provavelmente `v0.X.0 → v0.X+1.0` para o primeiro protótipo) e atualizar a string da tela de login conforme regra 0.1.
4. Confirmar que nenhuma alteração planejada remove `Disciplina`, `Docente`, `Aluno` ou `Repositório` da tela de login.

**Entregável:** Backlog técnico ordenado em formato checklist.

---

## Fase 7 — Desenvolvimento (TDD)

**Papel:** Desenvolvedor Especializado

**Regra de ouro:** **Teste primeiro, código depois.** Sem exceção.

**Ciclo por item do backlog:**
1. **RED** — Escrever o(s) teste(s) que falham, cobrindo o critério de aceite definido na Fase 6.
   - Testes unitários para lógica (qualquer ambiente)
   - Testes de integração para endpoints/DB (qualquer ambiente)
   - Teste E2E mínimo verificando que `Disciplina`, `Docente`, `Aluno`, `Repositório` e `v0.X.0` aparecem na tela de login. **Obrigatoriamente executado na estação via Playwright MCP** (regra 0.4).
2. Rodar a suíte e **confirmar que falham pelo motivo esperado**.
3. **GREEN** — Implementar o mínimo de código para passar o teste.
4. Rodar a suíte e confirmar que passa.
5. **REFACTOR** — Melhorar o código mantendo testes verdes.
6. Atualizar [CHANGELOG.md](../CHANGELOG.md) com a entrada da feature.
7. Atualizar a versão na tela de login + [package.json](../package.json) ao concluir o conjunto de itens da iteração.

**Critério de saída da fase:** 100% dos testes verdes, build local funcionando, versão atualizada.

---

## Fase 8 — QA com Foco no Usuário

**Papel:** Analista de QA

> **Pré-requisito de ambiente:** validação UI/E2E **só pode ser executada na estação de trabalho** com o servidor MCP do Playwright ativo (regra 0.4). Se a sessão estiver rodando na VPS sem MCP, parar e retornar à Fase 5 ou pedir ao desenvolvedor para abrir a sessão na estação.

**Tarefas:**
1. Criar **dados de teste** diretamente no banco de dados de produção/staging cobrindo cenários reais:
   - Pelo menos 1 `Disciplina`, 1 `Docente`, 1 `Aluno`, 1 `Repositório` representativos.
   - Cenários de borda (campos vazios, strings longas, caracteres especiais).
   - **Marcar** cada registro com um prefixo identificável (ex.: `qa_test_`) para facilitar limpeza futura.
2. Documentar os IDs/dados criados em `docs/relatorios faesa/qa-dados-teste-v1.md` para que possam ser **excluídos no futuro**.
3. Executar a jornada do usuário ponta a ponta usando esses dados:
   - Login
   - Visualização das entidades exigidas (`Disciplina`/`Docente`/`Aluno`/`Repositório`)
   - Confirmação visual da string `site-acolhimento-faesa · v0.X.0`
   - Demais fluxos do protótipo
4. Validar usabilidade, mensagens de erro, responsividade básica.
5. Para **cada falha encontrada**: **retornar à Fase 7** com o relato detalhado (passo, esperado, observado, evidência). Não tentar corrigir como QA.

**Critério de saída:** Todos os cenários de QA passam. Lista de dados de teste registrada para limpeza futura.

---

## Fase 9 — Loop de Correção

**Papel:** Coordenador

- Sempre que **qualquer teste** (TDD ou QA) falhar:
  1. Pausar o avanço.
  2. Voltar para a Fase 7 com o desenvolvedor.
  3. Reescrever/ajustar testes se necessário, corrigir código, repetir o ciclo RED-GREEN-REFACTOR.
  4. Re-executar QA somente após toda a suíte automatizada estar verde.

---

## Fase 10 — Entrega (Commit, Push, Deploy)

**Papel:** Release Engineer

**Pré-requisitos:**
- ✅ Suíte de testes 100% verde
- ✅ QA aprovado
- ✅ Versão `v0.X.0` atualizada em [package.json](../package.json), [CHANGELOG.md](../CHANGELOG.md) e tela de login
- ✅ Documentação obsoleta atualizada/removida (regra 0.2)

**Tarefas:**
1. `git status` — revisar alterações.
2. Commit com mensagem semântica (ex.: `feat: primeiro protótipo v0.X.0 — login + entidades base`).
3. `git push origin master`.
4. Executar deploy via [scripts/deploy.sh](../scripts/deploy.sh) ou [scripts/deploy.mjs](../scripts/deploy.mjs) conforme [docs/ambiente-producao-easypanel.md](ambiente-producao-easypanel.md).
5. **Validar o redeploy** abrindo a tela de login em produção e confirmando que a string exibida é exatamente `site-acolhimento-faesa · v0.X.0` da nova versão (regra 0.1).
   - Validação automatizada: rodar `curl https://acolhimento.faesa.gmcsistemas.com.br/version` (qualquer ambiente).
   - Validação visual da tela: **somente na estação via Playwright MCP** (regra 0.4).
6. **Não apagar os dados de teste** criados na Fase 8 — eles serão removidos posteriormente em uma rotina de limpeza dedicada.

**Critério de saída:** Versão nova visível em produção e validada pelo rótulo da tela de login.

---

## Apêndice A — Checklist Resumido

- [ ] Fase 1: Diagnóstico do estado atual
- [ ] Fase 2: Análise de produto (LaTeX, Figma, incoerências)
- [ ] Fase 3: Perguntas validadas com o desenvolvedor
- [ ] Fase 4: Requisitos técnicos mapeados
- [ ] Fase 5: Infra e acessos validados
- [ ] Fase 6: Backlog de alterações aprovado
- [ ] Fase 7: Implementação via TDD (RED → GREEN → REFACTOR)
- [ ] Fase 8: QA com dados de teste no banco
- [ ] Fase 9: Loop de correção (se aplicável)
- [ ] Fase 10: Commit, push, deploy e validação via tela de login
- [ ] Higiene documental: docs obsoletas atualizadas/removidas
- [ ] `Disciplina`, `Docente`, `Aluno`, `Repositório` presentes na tela de login
- [ ] `site-acolhimento-faesa · v0.X.0` atualizado e visível em produção
- [ ] Servidor MCP do Playwright verificado na estação antes de qualquer teste E2E/UI

---

## Apêndice B — Registro de Decisões

> Preencher conforme as perguntas das Fases 2, 3, 4 e 5 forem respondidas pelo desenvolvedor.

| # | Data | Pergunta | Opções apresentadas | Decisão | Responsável |
|---|------|----------|--------------------|---------| ----------- |
|   |      |          |                    |         |             |

---

## Apêndice C — Dados de Teste Criados (a remover no futuro)

> Preencher na Fase 8 com prefixo `qa_test_` e IDs/PKs gerados.

| Tabela | ID/PK | Descrição | Criado em |
|--------|-------|-----------|-----------|
|        |       |           |           |
