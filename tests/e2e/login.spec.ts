import { test, expect } from '@playwright/test';

/**
 * E4 — Validação visual da tela de login.
 *
 * Verifica os 4 metadados obrigatórios (Disciplina, Docente, Aluno,
 * Repositório) e o badge de versão `site-acolhimento-faesa · vX.Y.Z`.
 * Não requer autenticação nem banco — apenas o carregamento da SPA.
 *
 * Rodar SÓ na estação Windows (VPS é headless).
 */
test.describe('Tela de login — metadados obrigatórios e badge de versão', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByTestId('login-page')).toBeVisible();
    });

    test('exibe os 4 metadados acadêmicos', async ({ page }) => {
        const metadata = page.getByTestId('login-metadata');
        await expect(metadata).toBeVisible();

        await expect(page.getByTestId('meta-disciplina')).toContainText(
            'Desenvolvimento de Aplicações Web II',
        );
        await expect(page.getByTestId('meta-disciplina')).toContainText('D001508');
        await expect(page.getByTestId('meta-docente')).toContainText(
            'Otávio Lube dos Santos',
        );
        await expect(page.getByTestId('meta-aluno')).toContainText(
            'Gabriel Malheiros de Castro',
        );
        await expect(page.getByTestId('meta-aluno')).toContainText('23110145');
        await expect(page.getByTestId('meta-repositorio')).toContainText(
            'GabrielMalheirosdeCastro/Desenvolvimento-WEB-II',
        );
    });

    test('exibe o badge de versão no formato esperado', async ({ page }) => {
        const badge = page.getByTestId('login-version-badge');
        await expect(badge).toBeVisible();
        // Formato: "site-acolhimento-faesa · vX.Y.Z"
        await expect(badge).toContainText('site-acolhimento-faesa');
        await expect(badge).toHaveText(/·\s*v\d+\.\d+\.\d+/);
    });

    test('apresenta o formulário de login com e-mail e senha', async ({ page }) => {
        await expect(page.getByTestId('login-form')).toBeVisible();
        await expect(page.getByTestId('login-email')).toBeVisible();
        await expect(page.locator('#senha')).toBeVisible();
    });
});
