# Plano de Ação — Revisão de Tabelas de Requisitos e Simplificação de Diagramas UML

**Data:** 2026-03-04
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** As tabelas de requisitos (RF, RNF) apresentam o nome da cor (`reqFunc`, `reqNFunc`) renderizado como texto literal nas células do PDF, devido à ausência da opção `[table]` no `\usepackage{xcolor}`. Além disso, os diagramas UML (Casos de Uso, Classes, ER, Fluxo) estão visualmente confusos e contêm erros semânticos em relacionamentos `<<include>>` e `<<extend>>`.

## Objetivo

Corrigir o bug de renderização das tabelas, revisar a escrita do documento nesses trechos e simplificar os diagramas UML para que sejam legíveis, semanticamente corretos e alinhados com a notação UML padrão.

## Etapas

- [ ] 1. **Corrigir pacote `xcolor`**: Trocar `\usepackage{xcolor}` por `\usepackage[table]{xcolor}` para habilitar `\rowcolor`.
- [ ] 2. **Corrigir comentário do cabeçalho**: Remover menção a `pdflatex` na linha 4.
- [ ] 3. **Simplificar Diagrama de Casos de Uso**: Reduzir para ~8 casos de uso essenciais, remover `<<include>>` e `<<extend>>` incorretos, trocar setas por linhas simples nas associações ator↔UC, e reposicionar os atores para evitar cruzamentos.
- [ ] 4. **Corrigir Diagrama de Classes**: Remover relacionamento espúrio `Recurso-Meta`, adicionar enumerações como classes estereotipadas `<<enum>>`.
- [ ] 5. **Completar Diagrama ER**: Adicionar atributos-chave (`pk`) nas entidades principais para que o diagrama cumpra seu propósito de modelagem de dados.
- [ ] 6. **Corrigir Diagrama de Fluxo de Navegação**: Remover conexões lineares artificiais entre módulos independentes; todos os módulos devem partir do Dashboard como hub central.
- [ ] 7. **Compilar e validar no Overleaf** com `lualatex` e verificar ausência de erros.
- [ ] 8. **Atualizar `CHANGELOG.md`** com as correções realizadas.

## Impacto Esperado

- Arquivos que serão modificados: `site_acolhimento_faesa.tex` (via Overleaf), `CHANGELOG.md`
- Seções do documento afetadas:
  - Preâmbulo (pacote `xcolor`)
  - Seção 2.1 (tabela RF) — correção visual
  - Seção 2.2 (tabela RNF) — correção visual
  - Seção 4.1 (Diagrama de Casos de Uso) — reescrita
  - Seção 4.2 (Diagrama de Classes) — ajuste de relacionamentos
  - Seção 4.4 (Diagrama de Fluxo de Navegação) — reestruturação
  - Seção 4.5 (Diagrama ER) — adição de atributos
- README/CHANGELOG precisam ser atualizados? Sim (CHANGELOG)

## Riscos e Cuidados

- Alterar o pacote `xcolor` com `[table]` pode conflitar com outros pacotes que carregam `xcolor` internamente (ex: `tcolorbox`). Solução: carregar `xcolor[table]` ANTES de `tcolorbox`.
- A simplificação do diagrama de casos de uso requer validação de que nenhum RF ficou sem representação.
- O diagrama ER com atributos pode ficar extenso; limitar aos atributos-chave (PK e FKs).

## Critério de Conclusão

1. O PDF compilado via `lualatex` no Overleaf não exibe nenhum nome de cor como texto nas tabelas.
2. Todos os diagramas compilam sem `overfull \hbox` críticos.
3. O Diagrama de Casos de Uso não possui cruzamentos de linhas e usa notação UML correta.
4. O Diagrama ER exibe pelo menos as chaves primárias de cada entidade.
5. O `CHANGELOG.md` foi atualizado sob `[Unreleased]`.
