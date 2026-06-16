# Plano de Ação — Atributos de Profissão no Perfil de Mentoria

**Data:** 2026-06-16
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** A tela de Mentoria já distingue o papel do mentor (aluno veterano /
professor / coordenação) reaproveitando a coluna `usuarios.tipo_usuario`
(entregue na v1.24.0, sem migração). O próximo passo desejado é coletar e exibir
**atributos de profissão adicionais** — titulação acadêmica, área de atuação e
departamento — para enriquecer o perfil e remover qualquer ambiguidade sobre a
qualificação de quem orienta. Diferente da v1.24.0, esses atributos **não
existem** no schema atual e exigem alteração de banco, portanto saem do escopo
"sem migração" e precisam deste plano antes de qualquer execução.

> **Status:** PROPOSTO. Nenhuma alteração de schema ou código deve ser iniciada
> até confirmação explícita do aluno. Este documento é somente pesquisa/planejamento.

## Objetivo

Permitir que um usuário marcado como mentor (`e_mentor = TRUE`) registre, de
forma opcional e validada, atributos de profissão exibidos no card de mentoria:

- **Titulação** (ex.: Graduando, Graduado, Especialista, Mestre, Doutor).
- **Área de atuação** (texto curto livre, ex.: "Banco de Dados", "Redes").
- **Departamento/Curso de vínculo** (ex.: "ADS", "Engenharia de Software").

Esses dados complementam — não substituem — o `tipo_usuario` já exibido.

## Decisão de Modelagem (a confirmar)

Duas opções avaliadas (trade-off direto):

| Opção | Descrição | Custo | Risco |
|-------|-----------|-------|-------|
| **A — Colunas em `usuarios`** | Adicionar `titulacao`, `area_atuacao`, `departamento` (todas `TEXT NULL`) na tabela `usuarios`. | Baixo | Baixo. Tabela central; colunas opcionais e nuláveis não quebram queries existentes (todas usam SELECT explícito de colunas). |
| **B — Tabela `perfil_mentor` 1:1** | Nova tabela `perfil_mentor (usuario_id PK/FK, titulacao, area_atuacao, departamento)`. | Médio | Baixo. Isola atributos de mentoria, mas exige JOIN extra em todas as listagens de mentor. |

**Recomendação:** **Opção A** para o escopo acadêmico atual — menor superfície de
mudança, sem JOINs adicionais nas rotas `GET /api/mentorias` e
`GET /api/mentorias/sessoes`. Migrar para B só se o perfil de mentor crescer
para muitos campos.

## Etapas (Opção A)

- [ ] 1. **Schema Prisma** — adicionar em `model Usuario`
      (`packages/db/prisma/schema.prisma`):
      `titulacao String? @map("titulacao")`,
      `areaAtuacao String? @map("area_atuacao")`,
      `departamento String? @map("departamento")`.
- [ ] 2. **Migração Postgres** — gerar migration aditiva
      (`prisma migrate dev --name add_atributos_profissao_mentor`) que executa
      `ALTER TABLE "usuarios" ADD COLUMN "titulacao" TEXT, ADD COLUMN
      "area_atuacao" TEXT, ADD COLUMN "departamento" TEXT;`. Colunas NULL =
      retrocompatível (linhas existentes ficam com NULL, sem default obrigatório).
- [ ] 3. **Schema SQLite de referência** — espelhar as 3 colunas em
      `packages/db/schema.sql` (tabela `usuarios`) para manter paridade.
- [ ] 4. **Backend — leitura** — incluir `titulacao`, `area_atuacao`,
      `departamento` nos SELECT de `GET /api/mentorias` e
      `GET /api/mentorias/sessoes` e devolvê-los no payload (camelCase).
- [ ] 5. **Backend — escrita** — nova rota `PUT /api/mentorias/perfil`
      (`requireAuth`, escopada a `req.usuario.sub`, anti-IDOR). Validar:
      titulação dentro de um enum fechado; área e departamento como texto
      `trim()` de 0–120 caracteres; todos opcionais. Sem `isConnected()` →
      503; `query()` null → 500 (mesmo padrão das rotas atuais).
- [ ] 6. **Frontend** — no "Painel do(a) Mentor(a)" (`MentorshipPage.tsx`),
      formulário opcional "Completar meu perfil de mentoria" (select de
      titulação + inputs de área e departamento) que chama `PUT /perfil`.
      Exibir os atributos preenchidos como linhas/selos no card de mentor,
      abaixo do selo de papel já existente (`rotuloPapel`).
- [ ] 7. **Testes** — unit/integração para a validação da rota `PUT /perfil`
      (enum de titulação, limites de tamanho, escopo do `sub`). Manter cobertura
      ≥ 80%.
- [ ] 8. **Versão/Docs** — bump MINOR (nova funcionalidade), atualizar
      `CHANGELOG.md` e `README.md` (se a stack/estrutura mudar). Redeploy +
      verificação `/version` e `/healthz` (Seção 12.1).

## Impacto Esperado

- Arquivos modificados: `packages/db/prisma/schema.prisma`,
  nova migration em `packages/db/prisma/migrations/`, `packages/db/schema.sql`,
  `apps/api/routes.js`, `apps/web/src/app/pages/MentorshipPage.tsx`,
  `CHANGELOG.md`, possivelmente `README.md`.
- Banco de produção: `ALTER TABLE usuarios` (aditivo, colunas NULL).
- README/CHANGELOG: **Sim**, atualizar.

## Riscos e Cuidados

- **Migração em produção (Supabase self-hosted na VPS):** validar primeiro em
  ambiente de desenvolvimento via túnel SSH (`scripts/dev-tunnel.ps1`). Aplicar
  `ALTER TABLE` aditivo é seguro (não bloqueia leitura/escrita de forma
  perceptível em tabela pequena), mas exige `DIRECT_URL` (porta 5432), não o
  pooler.
- **Retrocompatibilidade:** todas as colunas devem ser `NULL` (sem `NOT NULL`
  nem default obrigatório) para não exigir backfill das linhas existentes.
- **Validação de entrada:** titulação deve ser um enum fechado no backend
  (nunca confiar no cliente); área/departamento com limite de tamanho para
  evitar abuso de armazenamento.
- **Privacidade (LGPD):** são dados profissionais de baixo risco, mas mantê-los
  opcionais e exibidos apenas no contexto de mentoria.
- **Não destrutivo:** nenhuma coluna existente é alterada ou removida.

## Critério de Conclusão

O mentor consegue, opcionalmente, registrar titulação, área e departamento; os
valores persistem na tabela `usuarios`; aparecem no card de mentoria e no
seletor de agendamento; a suíte de testes permanece verde (≥ 80% cobertura); e
a versão publicada em produção (`/version`) reflete o bump correspondente.
