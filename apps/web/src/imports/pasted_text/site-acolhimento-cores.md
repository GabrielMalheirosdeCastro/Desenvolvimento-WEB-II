# Paleta de Cores e Tecnologias Front-End — Site de Acolhimento FAESA

**Data:** 2026-03-11  
**Autor:** Gabriel Malheiros de Castro  
**Disciplina:** D001508 — Desenvolvimento de Aplicações Web II  
**Referência:** Definições do preâmbulo LaTeX (`site_acolhimento_faesa.tex`, linhas 38–46) e Seção "Stack Tecnológica Recomendada"

---

## Objetivo deste Documento

Registrar, de forma descritiva e sem código, a paleta de cores planejada para as telas do Site de Acolhimento FAESA e o papel de cada tecnologia fundamental da camada front-end (HTML5, CSS3, JavaScript) no projeto. Este documento serve como referência de design e arquitetura visual para a futura implementação.

---

## 1. Paleta de Cores do Projeto

### 1.1 Cores Institucionais Primárias

Estas são as cores derivadas da identidade visual da FAESA, usadas como base em toda a interface do site.

| Nome interno       | Código hexadecimal | Amostra visual | Papel na interface |
|--------------------|--------------------|----------------|-------------------|
| `faesaAzul`        | `#003366`          | ■ Azul escuro  | Cor primária do sistema. Usada em cabeçalhos (header), barra lateral (sidebar), títulos de seção, botões de ação principal (CTA), linhas separadoras e ícones de destaque. Transmite seriedade institucional. |
| `faesaAzulClaro`   | `#0066CC`          | ■ Azul médio   | Cor secundária. Aplicada em subtítulos, links de navegação, cards informativos (ex: "Horas de Estudo"), itens de menu ativos e elementos interativos de hover/focus. |
| `faesaVerde`       | `#28A745`          | ■ Verde         | Cor de sucesso e progresso. Usada em indicadores de metas concluídas, barras de progresso completas, badges de conquista (ex: badge "Focado"), e mensagens de confirmação. |
| `faesaLaranja`     | `#FF8C00`          | ■ Laranja       | Cor de alerta e atenção. Aplicada em caixas de aviso, cards de atividades pendentes (ex: "Sessões de Foco"), badges de mentoria, notificações e indicadores de urgência moderada. |

### 1.2 Cores Neutras e de Suporte

| Nome interno       | Código hexadecimal | Amostra visual     | Papel na interface |
|--------------------|--------------------|---------------------|-------------------|
| `faesaCinza`       | `#6C757D`          | ■ Cinza médio       | Texto secundário, ícones inativos, subtítulos de rodapé, itens de menu não selecionados e rótulos de eixo em gráficos. |
| `faesaBranco`      | `#FFFFFF`          | □ Branco            | Fundo de cards, texto sobre fundos escuros (header, botões), áreas de conteúdo principal. |
| `faesaBG`          | `#F5F7FA`          | ■ Cinza muito claro | Fundo geral da aplicação (background). Suave o suficiente para não cansar a leitura em uso prolongado. Diferencia-se do branco puro dos cards, criando hierarquia visual. |

### 1.3 Cores Auxiliares (Uso em Tabelas de Requisitos)

Estas cores têm uso restrito à documentação e podem ser adaptadas para fins de UI em dashboards administrativos.

| Nome interno       | Código hexadecimal | Papel |
|--------------------|--------------------|-------|
| `reqFunc`          | `#DCE6F1`          | Fundo de linhas de requisitos funcionais em tabelas de documentação. Tom azulado suave. |
| `reqNFunc`         | `#FDE8D0`          | Fundo de linhas de requisitos não funcionais. Tom alaranjado suave. |

### 1.4 Aplicação das Cores por Componente de Tela

A tabela abaixo mapeia onde cada cor aparece nos wireframes projetados (Tela de Login e Dashboard).

| Componente de tela                   | Cor principal                | Cor secundária / Variação     |
|--------------------------------------|------------------------------|-------------------------------|
| Header (barra superior)              | `faesaAzul` (fundo)         | `faesaBranco` (texto)         |
| Sidebar (menu lateral)               | `faesaAzul` 10% opacidade   | `faesaAzul` (texto ativo), `faesaCinza` (texto inativo) |
| Botão principal (CTA)                | `faesaAzul` (fundo)         | `faesaBranco` (texto)         |
| Card "Metas Concluídas"             | `faesaVerde` 10% opacidade  | `faesaVerde` (texto e valores)|
| Card "Horas de Estudo"              | `faesaAzulClaro` 10% opacidade | `faesaAzulClaro` (texto)   |
| Card "Sessões de Foco"              | `faesaLaranja` 10% opacidade| `faesaLaranja` (texto)        |
| Barras de gráfico (Progresso Semanal)| `faesaAzul` 60% opacidade   | —                             |
| Rótulos de gráfico (dias da semana) | `faesaCinza`                 | —                             |
| Links (ex: "Primeiro acesso?")       | `faesaAzulClaro`             | —                             |
| Rodapé da página                     | `faesaCinza` 20% opacidade  | `faesaCinza` (texto)          |
| Campos de formulário (input)         | Cinza padrão `#E0E0E0` (borda) | `faesaBG` (fundo)          |
| Badges (círculos de conquista)       | Variável por tipo: `faesaVerde`, `faesaAzulClaro`, `faesaLaranja`, roxo | 20% opacidade (preenchimento) |

### 1.5 Diretrizes Gerais de Uso de Cor

- **Contraste de acessibilidade:** A combinação `faesaAzul` (#003366) sobre `faesaBranco` (#FFFFFF) oferece ratio de contraste superior a 10:1, conforme WCAG 2.1 nível AAA. Combinações com `faesaAzulClaro` sobre branco devem ser validadas (ratio próximo de 4.5:1, nível AA).
- **Opacidade como hierarquia:** Cards e áreas de fundo usam a cor primária com 10% de opacidade para criar separação visual sem poluição. Gráficos usam 60% para destaque proporcional.
- **Consistência semântica:** Verde = sucesso/progresso. Laranja = atenção/pendência. Azul = identidade/navegação. Cinza = conteúdo secundário. Manter essa convenção em todas as telas.
- **Dark mode:** O Tailwind CSS (via shadcn/ui) suporta dark mode nativo. As cores acima são a paleta para o tema claro (light). A definição da paleta dark será um trabalho futuro.

---

## 2. Tecnologias Front-End — HTML5, CSS3 e JavaScript no Projeto

### 2.1 HTML5 — Estrutura Semântica das Páginas

**O que é:** HTML5 (HyperText Markup Language, versão 5) é a linguagem de marcação padrão para estruturar o conteúdo de páginas web. Define o que cada elemento da página é (cabeçalho, parágrafo, formulário, imagem, vídeo, etc.), sem se preocupar com a aparência visual.

**Como será usado no projeto:**

- **Estrutura semântica:** As páginas do Site de Acolhimento usarão tags semânticas do HTML5 para melhorar acessibilidade e SEO:
    - `<header>` — Barra superior com logo FAESA e ícones de notificação/perfil
    - `<nav>` — Menu lateral (sidebar) com links para os módulos (Dashboard, Plano de Estudos, Mentoria, Fórum, etc.)
    - `<main>` — Área central de conteúdo (cards, gráficos, formulários)
    - `<section>` — Divisão lógica de blocos dentro da página (ex: seção de badges, seção de atividades)
    - `<article>` — Posts do fórum, artigos da biblioteca de recursos
    - `<footer>` — Rodapé com informações de copyright
    - `<aside>` — Painel de atividades próximas no dashboard

- **Formulários HTML5:** A tela de login e os formulários de cadastro utilizarão:
    - `<input type="email">` — Validação nativa de e-mail institucional (@faesa.br)
    - `<input type="password">` — Campo de senha com ocultação nativa
    - `<input type="date">` / `<input type="time">` — Seleção de datas/horários no Plano de Estudos
    - Atributos `required`, `pattern`, `placeholder` para validação no lado do cliente
    - `<form>` com `action` e `method` gerenciados pelo framework (Next.js Server Actions ou API Routes)

- **Elementos multimídia:**
    - `<audio>` — Sons ambientes do módulo de concentração (chuva, floresta, café)
    - `<video>` — Tutoriais e conteúdo onboarding para calouros
    - `<canvas>` — Possibilidade de animações visuais nos exercícios respiratórios (técnica 4-7-8)

- **APIs nativas do HTML5 relevantes:**
    - Web Storage API (`localStorage`, `sessionStorage`) — Preferências do usuário em cache local
    - Drag and Drop API — Calendário interativo do Plano de Estudos com arrastar e soltar
    - Notifications API — Notificações push no navegador (lembretes de Pomodoro, sessões de mentoria)
    - Geolocation API — Localização do campus para sugestões de atividades presenciais (uso opcional)

### 2.2 CSS3 — Estilização e Layout Visual

**O que é:** CSS3 (Cascading Style Sheets, versão 3) é a linguagem que controla a aparência visual dos elementos HTML — cores, fontes, tamanhos, posicionamentos, animações e responsividade. Separa apresentação de estrutura.

**Como será usado no projeto:**

- **Layout com Flexbox e CSS Grid:**
    - **Flexbox** será utilizado no alinhamento de itens em linhas únicas: itens de menu na sidebar, botões em formulários, badges alinhados horizontalmente
    - **CSS Grid** será utilizado para o layout principal do dashboard: grid de 2 ou 3 colunas para cards de progresso, gráficos e atividades

- **Responsividade (Mobile-First):**
    - O requisito RNF01 exige interface adaptável a desktops, tablets e smartphones
    - A abordagem será Mobile-First: estilos base projetados para telas pequenas, com `@media` queries expandindo o layout para telas maiores
    - Breakpoints planejados:
        - `< 640px` — Mobile (1 coluna, sidebar oculta em menu hambúrguer)
        - `640px – 1024px` — Tablet (2 colunas, sidebar compacta)
        - `> 1024px` — Desktop (layout completo conforme wireframes)

- **Aplicação da paleta de cores (Seção 1):**
    - CSS Custom Properties (variáveis CSS) serão usadas para centralizar as cores: `--cor-primaria: #003366;`, `--cor-sucesso: #28A745;`, etc.
    - Variáveis permitem troca de tema (light/dark) sem duplicar regras de estilo

- **Animações e transições CSS3:**
    - `transition` — Efeitos suaves em hover de botões e cards (mudança de cor e sombra)
    - `@keyframes` + `animation` — Animação visual do exercício respiratório 4-7-8 (expansão/contração de círculo)
    - `transform: scale()` / `rotate()` — Feedback visual em badges ao desbloquear conquistas
    - Timer Pomodoro com animação circular via `conic-gradient` ou SVG animado

- **Sombras e profundidade:**
    - `box-shadow` nos cards do dashboard para criar hierarquia visual (elevação dos cards sobre o fundo `faesaBG`)
    - Sombras mais pronunciadas em elementos em estado de hover/focus

- **Tipografia:**
    - Uso de fontes web via `@font-face` ou Google Fonts
    - Hierarquia tipográfica: títulos em negrito (`font-weight: 700`), corpo em peso regular (`font-weight: 400`)
    - Tamanhos responsivos com unidades relativas (`rem`, `em`) em vez de `px` fixo

### 2.3 JavaScript — Interatividade e Lógica no Navegador

**O que é:** JavaScript é a linguagem de programação que adiciona comportamento e interatividade às páginas web. Enquanto HTML define a estrutura e CSS define a aparência, JavaScript define o que acontece quando o usuário interage com a página (clica, digita, arrasta, etc.).

**Como será usado no projeto:**

- **Manipulação dinâmica da interface (DOM):**
    - Atualizar cards do dashboard em tempo real quando metas são concluídas (sem recarregar a página)
    - Mostrar/ocultar sidebar no mobile ao clicar no menu hambúrguer
    - Filtrar e ordenar listas de recursos na Biblioteca
    - Exibir modais de confirmação (ex: "Deseja realmente excluir este plano?")

- **Gerenciamento de estado (via React/Next.js):**
    - JavaScript no projeto será executado majoritariamente através do React.js (biblioteca de componentes)
    - O React usa JavaScript para criar uma árvore de componentes reutilizáveis (JSX)
    - Hooks como `useState`, `useEffect`, `useContext` gerenciam dados da interface
    - Next.js adiciona capacidades de renderização no servidor (SSR) e geração estática (SSG), ambas baseadas em JavaScript

- **Comunicação com o servidor (APIs):**
    - `fetch()` API nativa do JavaScript — Consumir endpoints REST do back-end (NestJS)
    - Requisições assíncronas (`async/await`) para buscar dados do dashboard, postar mensagens no fórum, enviar formulários
    - Tratamento de erros (`try/catch`) com feedback visual ao usuário

- **WebSockets (tempo real):**
    - Socket.io (biblioteca JavaScript) para comunicação bidirecional em tempo real
    - Aplicações: chat de mentoria, notificações push instantâneas, atualizações do fórum ao vivo
    - JavaScript gerencia a conexão WebSocket, escuta eventos e atualiza a interface automaticamente

- **Timer e agendamento:**
    - `setInterval()` / `setTimeout()` — Controle do timer Pomodoro (contagem regressiva de 25 minutos)
    - `requestAnimationFrame()` — Animação fluida do exercício respiratório
    - `Date` API — Formatação de datas/horários no calendário do Plano de Estudos

- **Validação de formulários:**
    - Validação no lado do cliente antes de enviar dados ao servidor
    - Combinação de validação HTML5 nativa + validação JavaScript customizada
    - Bibliotecas como Zod (compatível com TypeScript) para validação de esquemas de dados

- **TypeScript como superset de JavaScript:**
    - O projeto adota TypeScript, que é JavaScript com tipagem estática
    - Todo código JavaScript do projeto será escrito em TypeScript (arquivos `.ts` e `.tsx`)
    - Benefícios: detecção de erros em tempo de desenvolvimento, autocompletar no editor, documentação implícita via tipos
    - O compilador TypeScript (`tsc`) transforma TypeScript em JavaScript puro para o navegador

---

## 3. Relação entre HTML5, CSS3 e JavaScript no Projeto

### 3.1 Divisão de Responsabilidades

| Tecnologia  | Responsabilidade                     | Exemplo no projeto                                                |
|-------------|--------------------------------------|-------------------------------------------------------------------|
| **HTML5**   | Estrutura e conteúdo                 | Definir que existe um card com título "Metas Concluídas" e valor "12/20" |
| **CSS3**    | Aparência e layout                   | Aplicar fundo verde 10%, bordas arredondadas, posição no grid do dashboard |
| **JavaScript** | Comportamento e interatividade   | Atualizar o valor "12/20" para "13/20" quando o usuário completa uma meta |

### 3.2 Fluxo de Renderização de uma Página

1. O navegador recebe o **HTML** do servidor (via Next.js SSR ou SSG)
2. O HTML referencia os arquivos **CSS** (via Tailwind, que gera CSS utilitário a partir de classes)
3. O navegador monta a árvore DOM (HTML) e aplica os estilos (CSS) — a tela aparece para o usuário
4. Os scripts **JavaScript** (React/Next.js) são carregados e "hidratam" a página, tornando-a interativa
5. A partir desse ponto, JavaScript gerencia atualizações dinâmicas sem recarregar a página inteira (SPA behavior)

### 3.3 Tailwind CSS como Camada de Abstração sobre CSS3

O projeto não escreverá CSS3 puro em arquivos `.css` separados. Em vez disso, utiliza **Tailwind CSS**, que é um framework CSS utilitário. Tailwind gera CSS3 válido a partir de classes aplicadas diretamente no HTML/JSX.

**Exemplo conceitual:**
- Sem Tailwind: Criar regras CSS em arquivo separado (`background-color: #003366; border-radius: 8px; padding: 16px;`)
- Com Tailwind: Aplicar classes utilitárias diretamente nos elementos (`bg-[#003366] rounded-lg p-4`)

O Tailwind compila todas essas classes em um único arquivo CSS3 otimizado para produção. As cores da paleta FAESA (Seção 1) serão registradas no arquivo de configuração do Tailwind (`tailwind.config.ts`) como cores customizadas, permitindo uso como `bg-faesa-azul`, `text-faesa-verde`, etc.

### 3.4 shadcn/ui como Biblioteca de Componentes

O **shadcn/ui** é uma coleção de componentes de interface pré-construídos (botões, modais, menus, tabs, formulários) que combinam HTML5 semântico + estilização Tailwind CSS + interatividade JavaScript/React. Os componentes são copiados para o projeto (não instalados como dependência), permitindo customização total com a paleta FAESA.

---

## 4. Resumo Visual — Tecnologias e suas Funções

| Camada         | Tecnologia           | Linguagem base | Função no projeto                                      |
|----------------|----------------------|----------------|--------------------------------------------------------|
| Estrutura      | HTML5                | HTML           | Marcação semântica, formulários, multimídia            |
| Estilização    | CSS3 via Tailwind CSS| CSS            | Cores, layout (Grid/Flexbox), responsividade, animações|
| Componentes UI | shadcn/ui            | HTML + CSS + JS| Componentes visuais prontos e customizáveis            |
| Interatividade | JavaScript / TypeScript via React + Next.js | JS/TS | DOM dinâmico, estado, APIs, tempo real       |
| Validação      | HTML5 + Zod          | HTML + JS      | Validação nativa e programática de dados               |
| Tempo real     | Socket.io            | JS             | WebSockets para chat, notificações e fórum ao vivo     |

---

## 5. Observações Finais

- Este documento é descritivo e conceitual. Nenhum código foi produzido.
- As cores e tecnologias aqui descritas estão alinhadas com o conteúdo do arquivo `site_acolhimento_faesa.tex` (preâmbulo e seção "Stack Tecnológica Recomendada").
- A implementação prática destas definições ocorrerá em fase futura do projeto, quando a infraestrutura de código for iniciada.
- Qualquer alteração na paleta de cores deve ser refletida simultaneamente neste documento, no `tailwind.config.ts` (futuro) e no preâmbulo do `.tex`.
