# Evidência E3 — Teste E2E da Jornada Principal (Playwright)

**Data:** 2026-06-16
**Responsável:** Gabriel Malheiros de Castro (matrícula 23110145)
**Frente:** E3 do roadmap v2.0.0 ([docs/plano-2026-06-15-v2.0.0-final-entrega-academica.md](plano-2026-06-15-v2.0.0-final-entrega-academica.md))
**Artefato sob teste:** [tests/e2e/jornada-principal.spec.ts](../tests/e2e/jornada-principal.spec.ts)

---

## 1. Objetivo

Comprovar que o repositório possui um teste end-to-end (E2E) automatizado, escrito em
Playwright, cobrindo a jornada principal do usuário autenticado (login → navegação pelas
áreas internas → logout), além de um cenário de escrita reversível (criar e remover uma
meta de estudo). Esta evidência registra a **integridade do harness** validada na estação
de trabalho (Windows 11), conforme exige a Seção 2.5 das instruções do repositório
(a VPS é headless e não executa testes de navegação).

## 2. Escopo do spec

O arquivo [tests/e2e/jornada-principal.spec.ts](../tests/e2e/jornada-principal.spec.ts)
contém três casos:

| # | Suíte | Caso | Tipo | Gate |
|---|-------|------|------|------|
| 1 | E3 — Jornada principal (somente leitura) | percorre dashboard, plano de estudos, bem-estar, fórum e perfil | Leitura | `test.skip` se faltar `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` |
| 2 | E3 — Jornada principal (somente leitura) | encerra a sessão (logout) e retorna à tela de login | Leitura | `test.skip` se faltar credenciais |
| 3 | E3 — Jornada de escrita reversível | cria uma meta, confirma na lista e a remove ao final | Escrita reversível | `test.skip` se faltar credenciais **ou** `E2E_ALLOW_WRITE != '1'` |

### Propriedades de segurança do desenho

- **Não polui produção por padrão.** O `baseURL` padrão é o ambiente de produção, mas o
  caso de escrita (nº 3) só executa quando `E2E_ALLOW_WRITE=1` é definido explicitamente.
  Sem essa variável, o caso é pulado. Quando habilitado, a meta criada possui título único
  (`E2E meta ${Date.now()}`) e é **removida ao final do próprio teste** (cleanup), tornando
  a operação idempotente e reversível.
- **Resiliente a i18n.** Os seletores usam `id` estáveis (`#senha`, `#meta-titulo`,
  `#meta-materia`) e expressões regulares bilíngues (`pt-BR|en-US`) para títulos, evitando
  quebra quando o idioma da interface muda.
- **Pula graciosamente sem credenciais.** Na ausência de `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`,
  os três casos são marcados como *skipped* — a suíte **não falha o build**.

## 3. Provas capturadas (estação Windows 11)

### 3.1 Descoberta e compilação pelo Playwright

Comando:

```powershell
npx playwright test tests/e2e/jornada-principal.spec.ts --list
```

Saída:

```
Listing tests:
  [chromium] › jornada-principal.spec.ts:52:5 › E3 — Jornada principal (somente leitura) › percorre dashboard, plano de estudos, bem-estar, fórum e perfil
  [chromium] › jornada-principal.spec.ts:81:5 › E3 — Jornada principal (somente leitura) › encerra a sessão (logout) e retorna à tela de login
  [chromium] › jornada-principal.spec.ts:100:5 › E3 — Jornada de escrita reversível (criar e remover meta) › cria uma meta, confirma na lista e a remove ao final
Total: 3 tests in 1 file
```

Interpretação: o spec **compila sem erro de TypeScript** e é **descoberto** corretamente
pelo runner (3 testes em 1 arquivo, projeto `chromium`).

### 3.2 Suíte unitária/integração permanece verde

Comando:

```powershell
npm test
```

Saída (resumo):

```
 Test Files  5 passed (5)
      Tests  71 passed (71)

 % Coverage report from v8
------------|---------|----------|---------|---------|
File        | % Stmts | % Branch | % Funcs | % Lines |
------------|---------|----------|---------|---------|
All files   |    97.5 |    94.73 |     100 |     100 |
 auth.js    |     100 |    96.15 |     100 |     100 |
 chatbot.js |   94.59 |    93.54 |     100 |     100 |
------------|---------|----------|---------|---------|
```

Interpretação: a adição do spec E2E **não quebrou** nenhum teste existente; cobertura
mantida em 97,5% de statements (limiar do projeto: 80%).

### 3.3 Isolamento total em relação ao deploy/EasyPanel

O [Dockerfile](../Dockerfile) (single-stage `node:20-alpine`) copia para a imagem
**apenas**:

```dockerfile
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api ./apps/api
COPY apps/web/dist ./apps/web/dist
```

A pasta `tests/` (e `docs/`) **nunca entra na imagem**. Logo, qualquer alteração nestes
testes é **inerte para o artefato publicado** no EasyPanel. Esta evidência **não altera o
comportamento do app** — portanto, conforme as Seções 11.1 e 12.1 das instruções, **não há
bump de versão e não há redeploy** associados a ela.

## 4. Execução autenticada (sob demanda na banca)

A execução com login real fica registrada como item de checklist, executável na estação
Windows 11 com o MCP do Playwright / Chromium já instalado. Procedimento:

```powershell
$env:TEST_USER_EMAIL = '<email da conta semeada>'
$env:TEST_USER_PASSWORD = '<senha definida na ativação>'
npm run test:e2e -- tests/e2e/jornada-principal.spec.ts
# Resultado esperado: 2 passed (jornada de leitura) / 1 skipped (escrita, sem E2E_ALLOW_WRITE)
```

> Pré-condição: a conta usada precisa ter `password_hash` definido (fluxo de ativação
> concluído). O seed de produção cria `gabriel.castro@faesa.br` (matrícula 23110145)
> **sem senha** — a ativação define a senha antes de qualquer execução autenticada.

A senha é segredo e **não deve** ser colada em chat, commit ou documento. Define-se apenas
como variável de ambiente na sessão do terminal da estação.

## 5. Conclusão

A frente **E3 (teste E2E da jornada principal)** está **implementada e validada quanto à
integridade do harness**: o spec compila, é descoberto pelo Playwright, não quebra a suíte
existente, não polui produção e não impacta o deploy. A execução autenticada é um passo
operacional reservado à estação, executável sob demanda durante a apresentação.
