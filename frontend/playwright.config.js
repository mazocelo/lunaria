import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Configuracao da suite E2E do Lunaria.
 *
 * Variaveis de ambiente reconhecidas (todas opcionais — ver e2e/README.md):
 *   E2E_BASE_URL   URL do frontend sob teste   (default: http://localhost:5173)
 *   E2E_EMAIL      e-mail da conta de teste    (default: conta de QA de dev)
 *   E2E_SENHA      senha da conta de teste     (default: senha de QA de dev)
 *   CI             quando setado, ativa modo CI (retries, sem reuso de servidor)
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const STORAGE_STATE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'e2e/.auth/user.json',
);

export default defineConfig({
  testDir: './e2e',
  // Cada arquivo .spec roda em serie internamente; arquivos rodam em paralelo.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: './test-results',

  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 1000 },
  },

  projects: [
    // Roda uma unica vez: autentica e grava o storageState (ver auth.setup.js).
    {
      name: 'setup',
      testMatch: /support\/auth\.setup\.js/,
    },
    // Os specs reusam a sessao gravada pelo projeto "setup".
    {
      name: 'chromium',
      testMatch: /tests\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
