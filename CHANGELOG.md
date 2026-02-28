# Changelog

Todas as alterações relevantes deste projeto serão documentadas aqui.

O formato segue o padrão [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Fixed

- `site_acolhimento_faesa.tex`: comentário no cabeçalho do arquivo corrigido — removida menção a `pdflatex` (compilador proibido no projeto).
- `site_acolhimento_faesa.tex`: nome do aluno na capa corrigido de `Gabriel Malheiros` para `Gabriel Malheiros de Castro`.
- `site_acolhimento_faesa.tex`: professor na capa corrigido de placeholder `[Nome do Professor]` para `Otávio Lube dos Santos`.
- `site_acolhimento_faesa.tex`: disciplina na capa atualizada para incluir o código `D001508`.
- `.github/copilot-instructions.md`: nomes de cores na seção 5 corrigidos (`faesamaroon`, `faesagold` → `faesaAzul`, `faesaAzulClaro`, `faesaLaranja`, etc.) para refletir a paleta real do documento.
- `README.md`: diagrama ASCII de arquitetura atualizado — camada de dados agora exibe `Supabase (PostgreSQL) · Redis/Upstash` em vez de `PostgreSQL · Redis (Cache)`.
- `README.md`: tabela de RNFs completada com RNF07 (Usabilidade), RNF08 (Manutenibilidade) e RNF10 (Internacionalização), que estavam ausentes.

---

## [0.3.0] - 2026-02-28

### Changed

- Banco de dados substituído de PostgreSQL self-hosted para **Supabase (PostgreSQL 16+)**
  gerenciado em nuvem, com pooling via Supavisor para compatibilidade com Vercel serverless.
- Cache substituído de Redis genérico para **Redis (Upstash)**, serviço serverless compatível
  com o ambiente Vercel.
- Autenticação atualizada de `NextAuth.js / OAuth 2.0` para **Supabase Auth + NextAuth.js**,
  com suporte nativo a OAuth 2.0, JWT, Row Level Security (RLS) e SSO institucional.
- Real-time atualizado para mencionar **Supabase Realtime** como primeira opção ao lado de
  Socket.io.
- Diagramas TikZ de arquitetura e stack tecnológica atualizados para refletir a nova stack
  (`Supabase (PostgreSQL)`, `Redis/Upstash`).
- `README.md` atualizado com a stack revisada e nota técnica justificando a decisão de adotar
  Supabase no contexto de deploy na Vercel (serverless).

---

## [0.2.0] - 2026-02-28

### Added

- Arquivo `.github/copilot-instructions.md` com 14 seções de diretrizes para o agente de IA:
  paradigma de programação assistida por IA, construção de prompts, planos de ação, commits,
  README, CHANGELOG e regras gerais.
- Pasta `docs/` reservada para planos de ação gerados pelo Copilot.

### Changed

- `README.md` expandido com estrutura completa: metadados acadêmicos, requisitos funcionais,
  arquitetura, stack tecnológica, instruções de compilação e configuração do ambiente.

---

## [0.1.0] - 2026-02-28

### Added

- Documento principal `site_acolhimento_faesa.tex` com levantamento de requisitos funcionais
  (RF01–RF15) e não funcionais (RNF01–RNF10), diagramas UML em TikZ (casos de uso, classes,
  arquitetura em 4 camadas, fluxo de navegação, ER) e stack tecnológica proposta.
- Arquivo `.vscode/settings.json` configurado com receita `lualatexmk`, auto-build ao salvar
  e visualização de PDF na aba do editor.
- Arquivo `.vscode/extensions.json` com 8 extensões recomendadas para o projeto LaTeX.

[Unreleased]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II/releases/tag/v0.1.0
