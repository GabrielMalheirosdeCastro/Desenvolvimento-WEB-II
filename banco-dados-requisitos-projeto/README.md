# Area de Banco de Dados do Projeto

Este diretorio consolida a base de banco de dados do projeto, com modelo relacional alinhado aos requisitos funcionais e nao funcionais definidos na documentacao.

## O que existe aqui

- `schema.sql`: estrutura relacional SQLite com 33 tabelas aderentes aos requisitos do projeto.
- `prisma/schema.prisma`: modelo de dados principal em Prisma.
- `script.ts`: script de verificacao de leitura com Prisma Client.
- `der-fonte.mmd`: fonte Mermaid das cardinalidades do DER.
- `dev.db`: banco local gerado em tempo de execucao.

## Cobertura direta de requisitos

- RF14: view `vw_rf14_relatorio_turma_desempenho` com agregacao por turma (sem identificacao individual).
- RF16: view `vw_rf16_chatbot_por_faixa` com contexto de conversas por faixa etaria.
- RNF09 (LGPD): view `vw_rnf09_lgpd_auditoria` com trilha de consentimento e eventos de auditoria.

## Como executar

No PowerShell, dentro deste diretorio:

```powershell
npm install
npm run generate
npm run check
```

## Observacao de isolamento

Esta area permanece isolada do fluxo principal do documento LaTeX e pode evoluir sem impactar os demais artefatos do repositorio.
