# Esboço da Especificação de Requisitos — Primeira Entrega

**Disciplina:** Desenvolvimento de Aplicações Web II (D001508)  
**Professor:** Otávio Lube  
**Instituição:** FAESA — Centro Universitário | Campus Vitória  
**Data de entrega:** 2026-03-12  

---

## 1. Identificação

| Campo | Informação |
|-------|-----------|
| **Nome do projeto** | Site de Acolhimento FAESA |
| **Aluno** | Gabriel Malheiros de Castro |
| **Matrícula** | 23110145 |
| **Curso** | Curso superior de Analise e Desenvolvimento de Sistemas |

> Trabalho individual — não há outros integrantes.

---

## 2. Descrição do Problema

### Contexto

A FAESA — Centro Universitário, presente na educação capixaba há mais de 53 anos, é reconhecida pelo MEC como o melhor Centro Universitário do Espírito Santo pela sexta vez consecutiva e está entre os 10 melhores do Brasil (IGC/MEC). Com mais de 70 cursos de graduação e pós-graduação, mais de 75 mil alunos formados e 85% dos egressos atuando em sua área de formação, a instituição é referência em ensino de qualidade.

### Problema

O programa de acolhimento estudantil da FAESA desempenha papel fundamental na integração dos novos alunos à vida acadêmica, porém atualmente não dispõe de uma plataforma digital centralizada que reúna seus recursos de forma interativa e acessível. Os estudantes — especialmente calouros — enfrentam dificuldades para organizar horários de estudo, acompanhar seu progresso acadêmico, acessar técnicas de concentração e conectar-se com mentores e colegas de forma estruturada.

### Relevância

A ausência de uma ferramenta unificada para o acolhimento resulta em:
- Dispersão de informações entre múltiplos canais (e-mail, murais, redes sociais);
- Dificuldade no acompanhamento individualizado do progresso dos estudantes;
- Falta de dados agregados para a coordenação avaliar o engajamento e o bem-estar da comunidade acadêmica.

### Usuários-alvo

| Perfil | Descrição |
|--------|-----------|
| **Calouro** | Estudante de 1º período que precisa se adaptar à rotina universitária, organizar seus horários e receber orientação. |
| **Veterano / Mentor** | Estudante a partir do 5º período (CRA ≥ 7,0) que deseja compartilhar experiências e orientar novos alunos. |
| **Coordenador / Gestor** | Membro da equipe pedagógica que acompanha métricas agregadas de engajamento e bem-estar estudantil. |

---

## 3. Escopo do Sistema

### O que o sistema vai fazer (funcionalidades principais)

- Permitir cadastro e login via matrícula institucional FAESA (SSO / OAuth 2.0);
- Oferecer criação e gerenciamento de planos de estudo personalizados com metas semanais e mensais;
- Disponibilizar calendário interativo com drag-and-drop para organização de horários;
- Prover módulo de exercícios de concentração (Pomodoro, mindfulness, exercícios respiratórios);
- Apresentar dashboard visual com gráficos de progresso acadêmico e metas atingidas;
- Manter biblioteca de recursos (artigos, vídeos, podcasts sobre técnicas de estudo);
- Conectar veteranos (mentores) e calouros por meio de sistema de mentoria estruturado;
- Oferecer fórum de discussão para troca de experiências;
- Enviar notificações e lembretes sobre metas, prazos e atividades;
- Aplicar questionários periódicos de autoavaliação de bem-estar emocional e acadêmico;
- Implementar sistema de gamificação (pontos, badges, rankings) para motivação;
- Gerar relatórios agregados e anônimos para a coordenação;
- Disponibilizar chatbot com IA de acolhimento, com respostas adaptadas por faixa etária (17–20, 21–25, 26+).

### O que o sistema NÃO vai fazer (limitações de escopo)

- **Não substitui atendimento psicológico ou psicopedagógico presencial** — o sistema apenas encaminha e sinaliza, sem oferecer diagnóstico ou tratamento.
- **Não realiza integração direta com o sistema acadêmico (portal do aluno) da FAESA** nesta primeira versão — os dados de matrícula e período são informados pelo próprio estudante no cadastro.
- **Não contempla aplicativo mobile nativo** — o acesso será exclusivamente via navegador web (responsivo, mobile-first).
- **Não gera conteúdo pedagógico original** — a biblioteca de recursos agrega materiais externos curados e revisados pela coordenação.
- **Não realiza análise individual de desempenho por parte da coordenação** — os relatórios são estritamente agregados e anônimos, em conformidade com a LGPD.

---

## 4. Requisitos Funcionais

| ID | Requisito | Descrição | Prioridade |
|----|-----------|-----------|-----------|
| RF01 | Cadastro e Login | O sistema deve permitir cadastro com matrícula FAESA e login via e-mail institucional (SSO). | Alta |
| RF02 | Plano de Estudos Personalizado | O aluno deve poder criar, editar e gerenciar seu plano de estudos com metas semanais e mensais. | Alta |
| RF03 | Cronograma Interativo | O sistema deve oferecer calendário interativo com drag-and-drop para organização de horários de estudo. | Alta |
| RF04 | Exercícios de Concentração | O sistema deve disponibilizar módulo com técnicas de concentração (Pomodoro, mindfulness, exercícios respiratórios). | Alta |
| RF05 | Dashboard de Progresso | O sistema deve apresentar painel visual com gráficos de progresso acadêmico, metas atingidas e estatísticas. | Alta |
| RF06 | Biblioteca de Recursos | O sistema deve manter repositório de materiais sobre técnicas de estudo, artigos, vídeos e podcasts. | Média |
| RF07 | Trilhas de Aprendizagem | O sistema deve oferecer roteiros guiados de estudo para cada curso e período. | Média |
| RF08 | Fórum de Discussão | O sistema deve disponibilizar espaço para troca de experiências entre estudantes e mentores. | Média |
| RF09 | Sistema de Mentoria | O sistema deve permitir conexão entre veteranos (mentores) e calouros para orientação. | Média |
| RF10 | Notificações e Lembretes | O sistema deve enviar alertas via push e e-mail sobre metas, prazos e atividades pendentes. | Média |
| RF11 | Avaliação de Bem-estar | O sistema deve aplicar questionários periódicos para autoavaliação emocional e acadêmica. | Média |
| RF12 | Atividades Extracurriculares | O sistema deve apresentar catálogo de cursos, workshops e eventos externos recomendados. | Baixa |
| RF13 | Gamificação | O sistema deve implementar sistema de pontos, badges e rankings para motivação dos estudantes. | Baixa |
| RF14 | Relatórios para Coordenação | O sistema deve gerar relatórios agregados (anônimos) sobre engajamento e bem-estar estudantil. | Baixa |
| RF15 | Chat com Suporte | O sistema deve oferecer canal de comunicação direta com o núcleo de apoio psicopedagógico. | Baixa |
| RF16 | Chatbot IA de Acolhimento | O sistema deve disponibilizar um chatbot com inteligência artificial que ofereça respostas adaptadas por faixa etária (17–20, 21–25, 26+) para orientação e acolhimento estudantil. | Alta |

---

## 5. Requisitos Não Funcionais

| ID | Categoria | Descrição | Prioridade |
|----|-----------|-----------|-----------|
| RNF01 | Responsividade | A interface deve ser adaptável a desktops, tablets e smartphones (abordagem Mobile-First). | Alta |
| RNF02 | Performance | O tempo de carregamento de páginas deve ser ≤ 3 segundos com conexão 3G. | Alta |
| RNF03 | Segurança | O sistema deve implementar autenticação OAuth 2.0 / SSO, criptografia TLS 1.3 e proteção contra XSS e CSRF. | Alta |
| RNF04 | Acessibilidade | O sistema deve estar em conformidade com WCAG 2.1 nível AA (contraste, leitores de tela, navegação por teclado). | Alta |
| RNF05 | Disponibilidade | O sistema deve manter uptime mínimo de 99,5% com monitoramento 24/7. | Alta |
| RNF06 | Escalabilidade | O sistema deve suportar crescimento de até 10.000 usuários simultâneos. | Média |
| RNF07 | Usabilidade | A interface deve ser intuitiva, seguindo Design System consistente, com taxa de erro ≤ 2%. | Média |
| RNF08 | Manutenibilidade | O código deve ser documentado, com arquitetura modular e cobertura de testes ≥ 80%. | Média |
| RNF09 | LGPD | O sistema deve estar em conformidade total com a Lei Geral de Proteção de Dados (Lei 13.709/2018). | Alta |
| RNF10 | Internacionalização | O sistema deve suportar pt-BR como idioma principal, com preparação para en-US. | Baixa |

---

## 6. Esboço das Telas Principais

### 6.1 Tela de Login

Wireframe simplificado (320×640) contendo:
- Logo institucional FAESA centralizado no topo;
- Campo de e-mail institucional;
- Campo de senha;
- Botão "Entrar" em destaque;
- Link "Primeiro acesso? Cadastre-se";
- Opção de login via SSO institucional.

### 6.2 Dashboard Principal

Layout de painel administrativo com:
- **Sidebar lateral** com menu de navegação (Plano de Estudos, Concentração, Mentoria, Fórum, Biblioteca, Perfil);
- **3 cards de progresso** no topo (Metas da Semana, Horas de Estudo, Sequência de Dias);
- **Gráfico semanal** de horas de estudo (barras verticais por dia);
- **Lista de próximas atividades** com data, tipo e status;
- **Seção de badges recentes** conquistados pelo estudante.

### 6.3 Fluxo de Navegação

Diagrama de 9 telas interconectadas:

```
Login → Dashboard (Home)
         ├── Plano de Estudos → Mentoria
         ├── Concentração → Fórum
         ├── Biblioteca → Perfil
         ├── Bem-estar (via Mentoria)
         ├── Gamificação (via Fórum)
         └── Extracurricular (via Perfil)
```

> Os protótipos detalhados (wireframes em alta fidelidade) estão sendo desenvolvidos e serão incluídos nas entregas subsequentes. Os esboços acima representam a estrutura visual planejada.

---

## 7. Tecnologias Pretendidas

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Frontend** | React.js / Next.js 14+ | SSR/SSG para performance, TypeScript para segurança de tipos, ecossistema robusto. |
| **Estilização** | Tailwind CSS + shadcn/ui | Design system consistente, utilitário, responsivo, dark mode nativo. |
| **Backend** | Node.js + NestJS | Mesmo ecossistema JavaScript/TypeScript, alta performance com V8, amplamente adotado. |
| **Banco de Dados** | PostgreSQL 16+ (Supabase) | Relacional, robusto, suporte a JSON, extensível, open-source, gerenciado em nuvem. |
| **Cache** | Redis (Upstash) | Cache em memória para sessões, notificações em tempo real, serverless-compatible. |
| **ORM** | Prisma | Type-safe, migrations automáticas, integração nativa com TypeScript. |
| **Autenticação** | NextAuth.js / OAuth 2.0 | SSO com provedor institucional FAESA, JWT, refresh tokens. |
| **Real-time** | Socket.io | WebSockets para chat, notificações em tempo real, fórum ao vivo. |
| **Deploy** | Vercel + Docker | CI/CD automatizado, preview deployments, escalabilidade serverless. |
| **Testes** | Jest + Cypress + Playwright | Unitários, integração e E2E para cobertura completa. |
| **Monitoramento** | Sentry + Grafana | Error tracking, logs, métricas de performance. |

> A stack não é definitiva e pode ser ajustada ao longo do semestre conforme as necessidades do projeto evoluam.

---

*Documento gerado como esboço inicial para a Primeira Entrega da disciplina Desenvolvimento de Aplicações Web II — FAESA 2026/1.*
