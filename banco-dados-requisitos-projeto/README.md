# Area de Banco de Dados do Projeto

Este diretorio consolida a base de banco de dados do projeto, com modelo relacional alinhado aos requisitos funcionais e nao funcionais definidos na documentacao.

## O que existe aqui

- `schema.sql`: estrutura relacional SQLite com 33 tabelas aderentes aos requisitos do projeto.
- `scripts/setup_and_demo.py`: cria banco, valida as 33 tabelas, insere dados de exemplo e executa consultas.
- `der-fonte.mmd`: fonte Mermaid das cardinalidades do DER.
- `dev.db`: banco local gerado em tempo de execucao.

## Como executar

No PowerShell, dentro deste diretorio:

```powershell
python scripts/setup_and_demo.py
```

Ou:

```powershell
./run-lab.ps1
```

## Observacao de isolamento

Esta area permanece isolada do fluxo principal do documento LaTeX e pode evoluir sem impactar os demais artefatos do repositorio.
