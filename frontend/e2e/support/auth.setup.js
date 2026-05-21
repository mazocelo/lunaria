import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { CREDENCIAIS } from './env.js';

/**
 * Setup de autenticacao — roda UMA vez antes dos specs (ver playwright.config.js,
 * projeto "setup" como dependencia do projeto "chromium").
 *
 * Faz login real pela UI e salva o storageState em e2e/.auth/user.json. Os demais
 * specs reusam essa sessao, em vez de cada teste logar de novo — o backend limita
 * /auth/login a 10 tentativas / 15 min, entao logar por teste deixaria a suite
 * flaky por rate limiting.
 */
export const STORAGE_STATE = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../.auth/user.json',
);

setup('autentica e salva a sessao', async ({ page }) => {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  await page.goto('/');
  await page.locator('#login-email').waitFor({ state: 'visible' });

  await page.locator('#login-email').fill(CREDENCIAIS.email);
  await page.locator('#login-senha').fill(CREDENCIAIS.senha);
  await page.getByRole('button', { name: /entrar na aventura/i }).click();

  await page.waitForURL(/\/historias/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/historias/);

  await page.context().storageState({ path: STORAGE_STATE });
});
