import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright (Bloco E — E3/E4).
 *
 * IMPORTANTE: estes testes E2E rodam SOMENTE na estação de desenvolvimento
 * (Windows 11). A VPS de produção é headless (sem GUI) — não execute Playwright
 * lá (Seção 2.5 das instruções do repositório).
 *
 * baseURL é configurável via env PLAYWRIGHT_BASE_URL. Padrão: produção
 * (sempre no ar e com dados semeados). Para validar local, exporte
 * PLAYWRIGHT_BASE_URL=http://localhost:3010 antes de `npm run test:e2e`.
 */
const BASE_URL =
    process.env.PLAYWRIGHT_BASE_URL ||
    'https://acolhimento.faesa.gmcsistemas.com.br';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list']],
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
