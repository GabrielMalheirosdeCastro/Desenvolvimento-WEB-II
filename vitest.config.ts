import { defineConfig } from 'vitest/config';

// ============================================================
// Configuracao do Vitest (v1.15.0 — D3/RNF08 / Bloco E).
// ------------------------------------------------------------
// - Ambiente Node (a API e headless; nao ha DOM nestes testes).
// - Suites unitarias (logica pura) + integracao (supertest sobre o
//   apiRouter em modo fallback, sem banco real — nao polui producao).
// - Os specs E2E do Playwright (tests/e2e) ficam FORA do Vitest; rodam
//   so na estacao via `npm run test:e2e` (Secao 2.5 das instrucoes).
// - Cobertura focada na logica testavel sem banco (auth.js + chatbot.js),
//   com limiar de 80% (lines/functions/branches/statements). A cobertura
//   completa dos handlers de routes.js depende de um banco de teste e fica
//   como continuacao (ver CHANGELOG/backlog).
// ============================================================
export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
        setupFiles: ['tests/setup.mjs'],
        include: [
            'tests/unit/**/*.test.{mjs,js,ts}',
            'tests/integration/**/*.test.{mjs,js,ts}',
        ],
        exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**', 'apps/web/dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'html'],
            reportsDirectory: 'coverage',
            include: ['apps/api/auth.js', 'apps/api/chatbot.js'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
});
