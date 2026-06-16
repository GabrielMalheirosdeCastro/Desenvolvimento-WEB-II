import { test, expect } from '@playwright/test';

/**
 * E3 — Jornada principal do usuário (Bloco E / rumo à v2.0.0).
 *
 * Cobre o caminho crítico ponta a ponta APÓS login real:
 *   login -> dashboard -> Plano de Estudos -> Bem-estar -> Fórum -> Perfil -> logout.
 *
 * Organização e segurança (decisões deliberadas):
 *   1. CREDENCIAIS apenas via variáveis de ambiente — NUNCA commitadas:
 *        TEST_USER_EMAIL, TEST_USER_PASSWORD
 *      Se ausentes, a suíte é PULADA (não falha), evitando vazamento de segredos.
 *   2. O `baseURL` padrão do projeto é PRODUÇÃO (playwright.config.ts). Por isso a
 *      jornada principal é SOMENTE-LEITURA: navega e valida, sem gravar dados.
 *   3. O fluxo que ESCREVE no banco (criar meta) fica isolado num bloco separado,
 *      gated pelo flag E2E_ALLOW_WRITE=1, e é REVERSÍVEL: a meta criada é removida
 *      ao final (cleanup). Por padrão NÃO roda — não polui o banco de produção.
 *      Habilite só apontando para um ambiente descartável, por ex.:
 *        $env:PLAYWRIGHT_BASE_URL='http://localhost:3010'
 *        $env:E2E_ALLOW_WRITE='1'
 *
 * Rodar SÓ na estação Windows com GUI (a VPS é headless — Seção 2.5).
 * Os textos visíveis são casados por regex pt-BR|en-US para resistir ao i18n.
 */
const EMAIL = process.env.TEST_USER_EMAIL;
const SENHA = process.env.TEST_USER_PASSWORD;
const ALLOW_WRITE = process.env.E2E_ALLOW_WRITE === '1';

/** Faz login real e aguarda o dashboard. Reutilizado pelos blocos abaixo. */
async function login(page: import('@playwright/test').Page) {
    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await page.getByTestId('login-email').fill(EMAIL!);
    await page.locator('#senha').fill(SENHA!);
    await page
        .getByTestId('login-form')
        .getByRole('button', { name: /entrar/i })
        .click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe('E3 — Jornada principal (somente leitura)', () => {
    test.skip(
        !EMAIL || !SENHA,
        'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar a jornada autenticada.',
    );

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('percorre dashboard, plano de estudos, bem-estar, fórum e perfil', async ({
        page,
    }) => {
        // Dashboard inicial autenticado.
        await page.goto('/dashboard');
        await expect(page.getByRole('heading').first()).toBeVisible();

        // Plano de Estudos (RF02) — heading casado por i18n.
        await page.goto('/dashboard/plano-estudos');
        await expect(
            page.getByRole('heading', { name: /Plano de Estudos|Study Plan/i }),
        ).toBeVisible();

        // Bem-estar (RF11).
        await page.goto('/dashboard/bem-estar');
        await expect(page).toHaveURL(/\/dashboard\/bem-estar/);
        await expect(page.getByRole('heading').first()).toBeVisible();

        // Fórum (RF08).
        await page.goto('/dashboard/forum');
        await expect(page).toHaveURL(/\/dashboard\/forum/);
        await expect(page.getByRole('heading').first()).toBeVisible();

        // Perfil (RF13).
        await page.goto('/dashboard/perfil');
        await expect(page).toHaveURL(/\/dashboard\/perfil/);
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('encerra a sessão (logout) e retorna à tela de login', async ({ page }) => {
        await page.goto('/dashboard');
        // Botão de sair no cabeçalho/sidebar (ícone LogOut + texto Sair/Sign out).
        await page
            .getByRole('button', { name: /sair|logout|sign out/i })
            .first()
            .click();
        await page.waitForURL(/\/login/, { timeout: 15_000 });
        await expect(page.getByTestId('login-page')).toBeVisible();
    });
});

test.describe('E3 — Jornada de escrita reversível (criar e remover meta)', () => {
    test.skip(
        !EMAIL || !SENHA || !ALLOW_WRITE,
        'Requer TEST_USER_EMAIL, TEST_USER_PASSWORD e E2E_ALLOW_WRITE=1 ' +
            '(use somente em ambiente descartável — NÃO em produção).',
    );

    test('cria uma meta, confirma na lista e a remove ao final', async ({ page }) => {
        await login(page);
        await page.goto('/dashboard/plano-estudos');
        await expect(
            page.getByRole('heading', { name: /Plano de Estudos|Study Plan/i }),
        ).toBeVisible();

        // Título único para isolar a meta criada por esta execução.
        const tituloUnico = `E2E meta ${Date.now()}`;

        // Abre o formulário de nova meta (toggle no cabeçalho).
        await page
            .getByRole('button', { name: /Nova Meta|New Goal/i })
            .first()
            .click();

        // Preenche e envia (campos com id estável, independentes de i18n).
        await page.locator('#meta-titulo').fill(tituloUnico);
        await page.locator('#meta-materia').fill('E2E');
        await page
            .getByRole('button', { name: /Salvar Meta|Save Goal/i })
            .click();

        // A meta deve aparecer na lista.
        const cardMeta = page.locator('div.border-2').filter({ hasText: tituloUnico });
        await expect(cardMeta).toBeVisible({ timeout: 15_000 });

        // Cleanup reversível: o único botão dentro do card é o de excluir (lixeira).
        await cardMeta.getByRole('button').click();
        await expect(cardMeta).toHaveCount(0, { timeout: 15_000 });
    });
});
