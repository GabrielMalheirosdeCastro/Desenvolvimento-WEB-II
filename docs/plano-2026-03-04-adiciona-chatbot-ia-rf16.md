# Plano de Ação — Adição de RF16 (Chatbot IA com Respostas Adaptáveis por Faixa Etária)

**Data:** 2026-03-04
**Solicitado por:** Gabriel Malheiros de Castro
**Contexto:** O aluno identificou a necessidade de um chatbot inteligente que adapte suas respostas com base na faixa etária informada pelo estudante. O RF15 (Chat com Suporte humano) será mantido. O chatbot IA será catalogado como **RF16** com prioridade **Alta**.

## Objetivo

Adicionar ao documento o requisito funcional RF16, incluindo:
1. Entrada na tabela de Requisitos Funcionais (seção 2.1)
2. Regra de negócio RN07 associada às faixas etárias
3. Diagrama de Atividades TikZ ilustrando o fluxo decisório do chatbot
4. Atualização do README.md com o novo RF
5. Atualização do CHANGELOG.md

## Definição do Escopo — RF16

| Campo | Valor |
|-------|-------|
| **ID** | RF16 |
| **Nome** | Chatbot IA de Acolhimento |
| **Prioridade** | Alta |
| **Descrição** | Assistente virtual inteligente que coleta a idade do estudante e adapta suas respostas sobre problemas acadêmicos, emocionais e administrativos conforme a faixa etária. |

### Faixas Etárias e Comportamento

| Faixa | Perfil | Comportamento da IA |
|-------|--------|---------------------|
| 17–20 anos | Calouro típico | Linguagem acessível, orientação básica sobre rotina universitária, dicas de adaptação, ênfase em organização de estudos e integração social |
| 21–25 anos | Veterano / intermediário | Orientação sobre estágio, TCC, mentoria, gestão de tempo avançada, planejamento de carreira |
| 26+ anos | Aluno maduro / retornando | Conciliação trabalho-estudo, revalidação de créditos, flexibilidade de horários, suporte emocional para retorno aos estudos |

### Regra de Negócio Associada

**RN07** — O chatbot IA deve solicitar a idade do estudante antes de iniciar o atendimento. A idade informada determina a faixa etária (17–20, 21–25, 26+) e o conjunto de respostas adaptadas. Se a idade for menor que 17, o chatbot deve redirecionar para o suporte humano (RF15).

## Etapas

- [ ] 1. Adicionar RF16 na tabela de requisitos funcionais do `.tex` (seção 2.1) — via Overleaf
- [ ] 2. Adicionar RN07 na lista de regras de negócio do `.tex` (seção 2.3) — via Overleaf
- [ ] 3. Inserir Diagrama de Atividades do Chatbot no `.tex` (nova subseção 4.6) — via Overleaf
- [ ] 4. Atualizar tabela de RFs no `README.md` — local
- [ ] 5. Atualizar `CHANGELOG.md` — local
- [ ] 6. Compilar com `lualatex` no Overleaf e validar PDF

## Impacto Esperado

- Arquivos que serão modificados: `site_acolhimento_faesa.tex` (via Overleaf), `README.md`, `CHANGELOG.md`
- Seções do documento afetadas:
  - 2.1 Requisitos Funcionais (nova linha RF16)
  - 2.3 Regras de Negócio (nova RN07)
  - 4.x Nova subseção: Diagrama de Atividades do Chatbot IA
- README/CHANGELOG precisam ser atualizados? **Sim**

## Riscos e Cuidados

- O diagrama de atividades usa construtos TikZ padrão (retângulos, losangos, setas). Não requer pacotes adicionais além dos já carregados.
- A faixa etária é auto-declarada pelo estudante — não buscar dados de matrícula automaticamente (simplicidade e LGPD).
- O chatbot IA complementa o RF15 (chat humano) — não o substitui. Incluir caminho de fallback para suporte humano no diagrama.

## Critério de Conclusão

- [ ] RF16 aparece na tabela de Requisitos Funcionais do PDF com prioridade Alta
- [ ] RN07 aparece na caixa de Regras de Negócio
- [ ] O diagrama de atividades compila sem erros e é legível no PDF
- [ ] O README.md lista RF16
- [ ] O CHANGELOG.md registra a adição
