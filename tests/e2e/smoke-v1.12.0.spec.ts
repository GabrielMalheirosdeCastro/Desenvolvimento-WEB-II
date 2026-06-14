import { test, expect } from '@playwright/test';

/**
 * E3 — Smoke E2E das funcionalidades da v1.12.0 (autenticado).
 *
 * Cobre, após login real:
 *   - sino de notificações no cabeçalho (RF10 / B5);
 *   - página dedicada de Eventos (RF12 / B6);
 *   - seção "Ranking entre Alunos" no Perfil (RF13 / B7).
 *
 * Requer CREDENCIAIS via variáveis de ambiente (NUNCA commitadas):
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD
 * Se ausentes, a suíte é PULADA (não falha) — evita vazar segredos e permite
 * rodar o login.spec isoladamente. Rodar SÓ na estação Windows (VPS é headless).
 */
const EMAIL = process.env.TEST_USER_EMAIL;
const SENHA = process.env.TEST_USER_PASSWORD;

test.describe('Smoke v1.12.0 — notificações, eventos e ranking (autenticado)', () => {
    test.skip(
        !EMAIL || !SENHA,
        'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar o smoke autenticado.',
    );

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByTestId('login-page')).toBeVisible();
        await page.getByTestId('login-email').fill(EMAIL!);
        await page.locator('#senha').fill(SENHA!);
        await page.getByTestId('login-form').getByRole('button', { name: /entrar/i }).click();
        // Após autenticar, a SPA navega para o dashboard.
        await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    });

    test('página de Eventos lista eventos institucionais', async ({ page }) => {
        await page.goto('/dashboard/eventos');
        await expect(
            page.getByRole('heading', { name: 'Eventos Institucionais' }),
        ).toBeVisible();
        await expect(page.getByText('Próximos Eventos')).toBeVisible();
    });

    test('Perfil exibe a seção de Ranking entre Alunos', async ({ page }) => {
        await page.goto('/dashboard/perfil');
        await expect(page.getByRole('heading', { name: 'Meu Perfil' })).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Ranking entre Alunos' }),
        ).toBeVisible();
    });

    test('o cabeçalho do dashboard renderiza o sino de notificações', async ({ page }) => {
        await page.goto('/dashboard');
        // O sino fica no cabeçalho; localiza pelo ícone/botão de notificações.
        const sino = page.getByRole('button', { name: /notifica/i }).first();
        await expect(sino).toBeVisible();
    });
});
