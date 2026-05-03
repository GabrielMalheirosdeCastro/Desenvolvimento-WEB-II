# Area de Banco de Dados do Projeto (modelagem academica em SQLite)

> **Atencao - escopo deste subprojeto:** este diretorio contem apenas a **modelagem
> relacional academica** das 33 tabelas do projeto, materializada em SQLite local
> (`dev.db`) para validacao rapida do schema Prisma e geracao do DER. **NAO e o banco
> de dados real da aplicacao.**
>
> O banco real do **Site de Acolhimento FAESA** e o **PostgreSQL 17.6 (Supabase
> self-hosted)** rodando na VPS Hostinger. Esse mesmo Postgres e utilizado tanto em
> **producao** (container `acolhimento_faesa` na rede Docker `easypanel`) quanto em
> **desenvolvimento** na estacao Windows 11, via tunel SSH (`localhost:6543` /
> `localhost:5432`). Detalhes em [`../docs/setup-desenvolvimento-windows.md`](../docs/setup-desenvolvimento-windows.md)
> e [`../docs/ambiente-producao-easypanel.md`](../docs/ambiente-producao-easypanel.md).
>
> Quando a fase de desenvolvimento da aplicacao real iniciar, o `schema.prisma` deste
> subprojeto sera **portado** para o Postgres da VPS (`provider = "postgresql"`),
> mantendo a estrutura relacional aqui validada.

## O que existe aqui

- `schema.sql`: estrutura relacional **SQLite** com 33 tabelas aderentes aos requisitos do projeto (apenas para validacao academica do modelo).
- `prisma/schema.prisma`: modelo de dados em Prisma com `provider = "sqlite"` (sera convertido para `postgresql` na portagem).
- `script.ts`: script de verificacao de leitura com Prisma Client.
- `der-fonte.mmd`: fonte Mermaid das cardinalidades do DER.
- `dev.db`: arquivo SQLite local gerado em tempo de execucao (gitignored, nao versionado).

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

Esta area permanece isolada do fluxo principal do documento LaTeX e pode evoluir sem
impactar os demais artefatos do repositorio. **O SQLite usado aqui nao tem nenhuma
relacao com o ambiente de execucao da aplicacao** \u2014 este e exclusivamente o
PostgreSQL 17.6 self-hosted da VPS, compartilhado entre dev (via tunel SSH) e producao.
