# Laboratorio Temporario Isolado

Este diretorio foi criado para testar localmente, de forma descartavel, os artefatos tecnicos derivados do PDF de DER.

## O que existe aqui

- `schema.sql`: estrutura relacional temporaria (SQLite) com as 33 tabelas do PDF.
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

## Como remover sem afetar o projeto

Apague somente este diretorio:

```powershell
Set-Location "c:/Users/Gabriel.Malheiros/OneDrive - FAESA/Desktop/Desenvolvimento WEB II"
Remove-Item -Recurse -Force "temp-prisma-lab"
```

A remocao elimina integralmente o ambiente temporario sem alterar os demais arquivos do projeto.
