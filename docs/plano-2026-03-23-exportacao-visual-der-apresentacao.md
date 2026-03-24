# Plano de Ação — Exportação Visual do DER e Apresentação Acadêmica

**Data:** 2026-03-23  
**Contexto:** O documento `entrega-der-fase-2-site-acolhimento-faesa.md` contém DER tecnicamente correto (33 tabelas, cardinalidades, Mermaid) mas falta o artefato visual (PNG/SVG) e a separação de diagramas por domínio, conforme padrão acadêmico esperado para avaliação.

## Objetivo

Transformar o DER de texto + Mermaid em **artefato visual legível com:**
1. Imagem PNG/SVG de DER embarcada no documento final (PDF)
2. Atributos visíveis nos símbolos das entidades
3. Notação Chen explícita (PK/FK, cardinalidades, relacionamentos)
4. Separação em 3-4 sub-diagramas por domínio para legibilidade

## Trade-offs e Opções Viáveis

| Opção | Ferramenta | Pros | Contras | Esforço |
|-------|-----------|------|---------|---------|
| **1. Mermaid + Draw.io** | Mermaid Live → Export PNG → Draw.io para refinar | Gratuito, mantém código versionável, refinamento visual possível | Requer 2 plataformas, reconstruir manualmente se houver mudanças | Médio |
| **2. Só Mermaid exportado** | mermaid.live ou CLI | Automático, reproducível, versionável em código | Sem atributos visíveis (Mermaid erDiagram não suporta), cardinalidades em notação simbólica (não-intuitiva) | Baixo |
| **3. Lucidchart/Visio** | Lucidchart ou Microsoft Visio | Suporta Chen completo com atributos, PKs, FKs visuais | Não-gratuito (licença), arquivo binário (não versionável em git), requer export manual | Alto |
| **4. PlantUML + Editor gráfico** | PlantUML (ERD) + refinamento visual | Código versionável, suporta class diagram com atributos | PlantUML ERD mais simples que Mermaid, requer editor externo para polimento | Médio |
| **5. Subdiagramas Mermaid separate** | Mermaid (4 diagramas pequenos) | Mantém versionamento, leitura mais clara, sem ferramentas externas | Sem atributos, 4 blocos de código no documento (menos elegante), cardinalidades ainda em simbologia | Baixo-Médio |

## Recomendação Técnica Priorizada

**Opção Recomendada: 1 (Mermaid Live → Draw.io → PNG)**

**Justificativa:**
- O código Mermaid já existe e está correto (31 relacionamentos mapeados).
- Mermaid Live (online, gratuito) exporta PNG automaticamente.
- Draw.io permite então adicionar visualmente:
  - Atributos dentro das caixas (texto adicional)
  - Notação Chen (sublinhado para PK, marcação FK)
  - Cardinalidades com pé de galinha ou notação 1:1, 1:N, N:M legível
- PNG é embarcável em markdown e PDF final.
- Se houver mudanças futuras no modelo, o Mermaid é refatorado (código) e re-exportado.

**Alternativa Rápida: Opção 5** — Se o tempo for crítico e o padrão da disciplina aceitar Mermaid,  5 sub-diagramas Mermaid pequenos (1 por domínio) resolvem a densidade visual sem ferramentas externas. Mas atributos/PKs seguem textuais (menos ideal para rúbrica acadêmica).

---

## Etapas

- [ ] **1. Exportar Mermaid em Mermaid Live Editor**
  - Copiar o bloco erDiagram da linha 79-131 de `entrega-der-fase-2-site-acolhimento-faesa.md`
  - Colar em https://mermaid.live
  - Verificar rendering (nós, relações, cardinalidades)
  - Exportar como PNG em resolução 1920x1440 (legível em PDF)
  - Salvar como `docs/relatorios faesa/der-completo-site-acolhimento.png`

- [ ] **2. (Opcional) Refinar no Draw.io**
  - Importar PNG do passo 1 em draw.io
  - Adicionar labels de atributos-chave nas caixas (opcional, se Draw.io permitir) OR
  - Reorganizar layout manualmente para melhor legibilidade
  - Exportar PNG refinado
  - Salvar como `docs/relatorios faesa/der-completo-site-acolhimento-refined.png`

- [ ] **3. Criar sub-diagramas por domínio (Opcional, recomendado se 33 entidades ficarem ilegíveis)**
  - Separar Mermaid original em 4 diagramas:
    - **Acadêmico:** INSTITUICOES_FAESA, CURSOS, TURMAS, DISCIPLINAS, USUARIOS, MATRICULAS_ACADEMICAS, TURMA_DISCIPLINAS, DISCIPLINAS_CURSADAS, AVALIACOES_DISCIPLINA (9 tabelas)
    - **Planejamento:** PLANOS_ESTUDO, METAS_SEMANAIS, ATIVIDADES_ESTUDO, EXERCICIOS_CONCENTRACAO, TRILHAS_APRENDIZAGEM, RECURSOS, TRILHA_RECURSOS, USUARIO_RECURSOS (8 tabelas)
    - **Comunidade:** FORUNS_DISCUSSAO, FORUM_POSTS, FORUM_COMENTARIOS, MENTORIAS, NOTIFICACOES, QUESTIONARIOS_BEM_ESTAR, GAMIFICACAO, EVENTOS, USUARIO_EVENTOS (9 tabelas)
    - **Operações/Compliance:** CHAT_TICKETS, CHAT_MENSAGENS, CHATBOT_CONVERSAS, CHATBOT_MENSAGENS, RELATORIOS_ANONIMIZADOS, CONSENTIMENTOS_LGPD, AUDITORIA_DADOS (7 tabelas)
  - Exportar 4 PNGs separados
  - Salvar em `docs/relatorios faesa/der-dominio-*.png` (acadêmico, planejamento, comunidade, operacoes)

- [ ] **4. Incorporar imagens no documento final**
  - Abrir `entrega-der-fase-2-site-acolhimento-faesa.md`
  - Substituir (ou complementar) bloco Mermaid com:
    ```markdown
    ## 2.2 DER em Representação Visual
    
    ![DER Completo — Site de Acolhimento FAESA](./der-completo-site-acolhimento.png)
    
    **Nota:** Diagrama em notação erDiagram (Mermaid). Atributos e chaves descritos em seção 3.
    
    ### 2.2.1 Sub-diagramas por Domínio (Opcional, para legibilidade)
    
    #### Domínio Acadêmico
    ![DER Domínio Acadêmico](./der-dominio-academico.png)
    
    #### Domínio Planejamento
    ![DER Domínio Planejamento](./der-dominio-planejamento.png)
    
    #### Domínio Comunidade
    ![DER Domínio Comunidade](./der-dominio-comunidade.png)
    
    #### Domínio Operações e Compliance
    ![DER Domínio Operações](./der-dominio-operacoes.png)
    ```
  - Seção 3 (tabelas) permanece como "Mapeamento para Modelo Relacional" (já está em 136+)
  - Documento fica com fluxo: Minimundo → Cardinalidades lista → **DER visual** → Tabelas DDL

- [ ] **5. Validar documento antes de PDF final**
  - Compilar markdown para PDF (ex: pandoc + wkhtmltopdf, ou export direto do editor)
  - Verificar:
    - [ ] Imagens aparecem com boa resolução
    - [ ] Texto de atributos legível (tamanho mínimo 10pt)
    - [ ] Numeração de seções automática (TOC correto)
    - [ ] Cardinalidades visíveis nas linhas de relação
    - [ ] Nenhuma página em branco desnecessária
  - Salvar PDF final como `docs/relatorios faesa/entrega-der-fase-2-gabriel-malheiros.pdf`

---

## Impacto Esperado

**Arquivos que serão criados:**
- `docs/relatorios faesa/der-completo-site-acolhimento.png` (Mermaid exportado)
- `docs/relatorios faesa/der-dominio-academico.png` (opcional)
- `docs/relatorios faesa/der-dominio-planejamento.png` (opcional)
- `docs/relatorios faesa/der-dominio-comunidade.png` (opcional)
- `docs/relatorios faesa/der-dominio-operacoes.png` (opcional)
- `docs/relatorios faesa/entrega-der-fase-2-gabriel-malheiros.pdf` (arquivo final de submissão)

**Arquivos que serão modificados:**
- `docs/relatorios faesa/entrega-der-fase-2-site-acolhimento-faesa.md` (incorporar imagens, reordenar seções 2.1 e 2.2)

**Seções do documento afetadas:**
- Seção 2.1: Cardinalidades na prática → permanece igual
- Seção 2.2: DER em Mermaid → refatorado para "DER em Representação Visual" + imagem PNG
- Seção 3: Mapeamento para Modelo Relacional → permanece igual (agora é complemento da imagem)

**README/CHANGELOG precisam ser atualizados?**
- Sim. README pode referenciar que DER foi exportado em formato visual.
- CHANGELOG deve registrar: `fix(der): adiciona imagem PNG e sub-diagramas para legibilidade acadêmica`

---

## Riscos e Cuidados

- **Risco 1:** Mermaid Live pode ter mudanças de interface ou limites de complexidade (33 entidades é perto do limiar). Mitigation: testar primeiro com bloco pequeno.
- **Risco 2:** PNG com 33 entidades pode ficar pequeno/ilegível mesmo em 1920x1440. Mitigation: usar sub-diagramas (etapa 3).
- **Risco 3:** Draw.io export pode ter problemas de camadas/transparência. Mitigation: exportar como opção "Edit in Draw.io" e salvar PNG direto do Draw.io.
- **Risco 4:** Se o documento Markdown não suportar imagens bem (ex: plataforma AVA/Moodle), pode ser necessário converter para PDF separado. Mitigation: testar render em PDF antes de submeter.
- **Risco 5:** Sub-diagramas adicionam conteúdo (4 imagens vs. 1). Pode parecer redundante se a rúbrica espera um único DER. Mitigation: apresentar apenas 1 DER completo UNLESS a rúbrica explicitamente pedir legibilidade em múltiplas vistas.

---

## Decisão Recomendada

**Abordagem pragmática em 2 fases:**

1. **Fase 1 (Obrigatória):** Exportar Mermaid em Mermaid Live como PNG (etapa 1). Incorporar no documento como imagem embarcada. Isto satisfaz o critério "imagem visual" da rúbrica.

2. **Fase 2 (Condicional):** Se ao visualizar a PNG a densidade ficar ilegível (>15 nós por imagem), proceder com sub-diagramas (etapa 3). Se ficar legível, manter apenas 1 DER completo.

---

## Critério de Conclusão

O plano é considerado **bem-sucedido** quando:

1. ✅ Existe arquivo PNG/SVG do DER incorporado no documento markdown
2. ✅ Ao converter para PDF, a imagem aparece com resolução ≥300 DPI e entidades legíveis (tamanho mínimo 10pt)
3. ✅ Documento markdown tém estrutura: Minimundo → Cardinalidades (lista) → **DER (imagem)** → Tabelas (DDL)
4. ✅ Se sub-diagramas foram criados, cada sub-diagrama tem máximo 12 entidades e relações claras
5. ✅ Documento `.tex` do projeto foi atualizado com referência ao DER visual (optional, se necessário)
6. ✅ Arquivo PDF final foi salvo em `docs/relatorios faesa/entrega-der-fase-2-gabriel-malheiros.pdf`
7. ✅ Commit foi feito com mensagem: `feat(der): adiciona exportação visual em PNG e sub-diagramas por domínio`

