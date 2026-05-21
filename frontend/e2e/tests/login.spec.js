import { test, expect } from '@playwright/test';
import { CREDENCIAIS, SENHA_INVALIDA } from '../support/env.js';
import { pularOnboarding } from '../support/auth.js';

/**
 * Fluxo 1 — Login.
 * Cobre o caminho feliz (conta de teste) e o caminho de erro (senha invalida
 * exibindo o feedback de erro na tela).
 *
 * Este spec exercita o login do zero, entao descarta o storageState reusado
 * pelos demais specs — comeca sempre deslogado.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await pularOnboarding(page);
    await page.goto('/');
    await page.locator('#login-email').waitFor({ state: 'visible' });
  });

  test('autentica com credenciais validas e redireciona para Historias', async ({ page }) => {
    await page.locator('#login-email').fill(CREDENCIAIS.email);
    await page.locator('#login-senha').fill(CREDENCIAIS.senha);
    await page.getByRole('button', { name: /entrar na aventura/i }).click();

    // O AuthContext redireciona para /historias apos login bem-sucedido.
    await page.waitForURL(/\/historias/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/historias/);

    // O formulario de login nao deve mais estar visivel.
    await expect(page.locator('#login-email')).toHaveCount(0);
  });

  test('exibe feedback de erro com senha invalida e mantem na tela de login', async ({ page }) => {
    await page.locator('#login-email').fill(CREDENCIAIS.email);
    await page.locator('#login-senha').fill(SENHA_INVALIDA);
    await page.getByRole('button', { name: /entrar na aventura/i }).click();

    // Notification renderiza com role="alert" — aguardamos o feedback aparecer.
    const alerta = page.locator('[role="alert"]');
    await expect(alerta).toBeVisible({ timeout: 20_000 });
    await expect(alerta).toContainText(/.+/);

    // Nao houve redirect: o usuario continua na tela de login.
    await expect(page).not.toHaveURL(/\/historias/);
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('valida campos obrigatorios sem submeter ao backend', async ({ page }) => {
    // Submeter vazio dispara validacao client-side; nao deve redirecionar.
    await page.getByRole('button', { name: /entrar na aventura/i }).click();

    await expect(page).not.toHaveURL(/\/historias/);
    await expect(page.locator('#login-email')).toBeVisible();
  });
});
