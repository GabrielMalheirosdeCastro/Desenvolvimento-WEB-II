# Plano de Ação — Refatoração dos 5 Diagramas TikZ Priorizados

**Data:** 2026-03-03
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** Análise técnica identificou problemas de legibilidade, sobreposição de caminhos, cardinalidades incompletas e estilos deprecados nos diagramas TikZ do documento `site_acolhimento_faesa.tex`. Os 5 diagramas abaixo foram priorizados para refatoração.

## Objetivo

Refatorar os 5 diagramas TikZ com maior número de problemas, tornando-os:
- Legíveis quando compilados em PDF (sem texto microscópico)
- Compiláveis com segurança no Overleaf (LuaLaTeX)
- Semanticamente corretos (cardinalidades, estereótipos, notação UML)

## Etapas

- [x] 1. Análise completa dos diagramas existentes e classificação de severidade
- [ ] 2. **Diagrama de Casos de Uso** — System boundary auto-fit; rotas curvas para Estudante; estereótipos `\footnotesize`
- [ ] 3. **Diagrama de Classes** — Manter 8 classes; renomear estilo local; rotas curvas para setas longas; corrigir `Diamond[open]`; melhor espaçamento vertical
- [ ] 4. **Diagrama de Componentes/Arquitetura** — Reposicionar serviços externos para dentro da área segura do `\resizebox`
- [ ] 5. **Diagrama de Fluxo de Navegação** — Separar caminhos de `home` para segunda linha com âncoras e curvas distintas
- [ ] 6. **Diagrama ER** — Remover estilos mortos (`attr`, `pk`); completar cardinalidades faltantes; reposicionar losangos r5/r6/r7

## Impacto Esperado

- Arquivos que serão modificados: `site_acolhimento_faesa.tex` (via Overleaf)
- Seções do documento afetadas:
  - 4.1 Diagrama de Casos de Uso
  - 4.2 Diagrama de Classes
  - 4.3 Diagrama de Componentes / Arquitetura
  - 4.4 Diagrama de Fluxo de Navegação
  - 4.5 Diagrama Entidade-Relacionamento (ER)
- README/CHANGELOG precisam ser atualizados? **Sim** — registrar a refatoração no CHANGELOG (`Changed`)

## Riscos e Cuidados

- **Compilação:** Todo código será testado mentalmente com as bibliotecas TikZ já carregadas no preâmbulo. Usar apenas construtos padrão (`to[out/in]`, `fit`, `anchors`).
- **Regressão visual:** O aluno deve compilar cada diagrama individualmente no Overleaf após colar, verificando se o PDF está legível antes de prosseguir com o próximo.
- **`\tikzstyle` deprecado:** O preâmbulo ainda usa `\tikzstyle` (linhas 116–125). Os novos diagramas definem estilos localmente dentro de cada `tikzpicture`, eliminando dependência dos estilos globais deprecados. Recomenda-se migrar o preâmbulo para `\tikzset` numa etapa futura.

## Critério de Conclusão

- [ ] Os 5 diagramas compilam sem erros no Overleaf com LuaLaTeX
- [ ] Nenhum texto fica ilegível no PDF gerado (verificação visual)
- [ ] Cardinalidades completas no ER
- [ ] CHANGELOG.md atualizado com entrada `Changed`
