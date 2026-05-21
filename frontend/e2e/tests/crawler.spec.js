import { test, expect } from '@playwright/test';
import { pularOnboarding, coletarErros } from '../support/auth.js';

/**
 * Fluxo 5 — Crawler das rotas principais.
 * Varre as rotas autenticadas de leitura e garante que nenhuma:
 *  - retorna HTTP 5xx na requisicao de API,
 *  - dispara erro de console / pageerror,
 *  - renderiza tela em branco.
 *
 * Rotas com efeito colateral (criacao, jogo, billing) ficam de fora — cada uma
 * tem (ou tera) cobertura dedicada.
 */

const ROTAS = [
  '/historias',
  '/explorar',
  '/personagens',
  '/feed',
  '/amigos',
  '/perfil',
  '/monstros',
  '/racas',
  '/classes',
  '/habilidades-magias',
  '/vantagens',
  '/desvantagens',
  '/equipamentos',
  '/mestres',
];

test.describe('Crawler de rotas autenticadas', () => {
  test.beforeEach(async ({ page }) => {
    // A sessao ja vem autenticada via storageState (ver auth.setup.js).
    await pularOnboarding(page);
  });

  for (const rota of ROTAS) {
    test(`rota ${rota} renderiza sem erro`, async ({ page }) => {
      const erros = coletarErros(page);
      const status5xx = [];
      page.on('response', (resp) => {
        if (resp.status() >= 500) {
          status5xx.push(`${resp.status()} ${resp.url()}`);
        }
      });

      await page.goto(rota, { waitUntil: 'networkidle' });

      // Nao caiu para a tela de login (sessao perdida): o form de login
      // so existe na home (/) — sua ausencia confirma a sessao ativa.
      await expect(page.locator('#login-email')).toHaveCount(0);
      expect(new URL(page.url()).pathname, `Redirecionou para fora de ${rota}`).toBe(rota);

      // Tela nao esta em branco.
      const textoLen = await page.evaluate(
        () => document.body.innerText.trim().length,
      );
      expect(textoLen, `Tela em branco em ${rota}`).toBeGreaterThan(50);

      // Sem 5xx e sem erro de console.
      expect(status5xx, `HTTP 5xx em ${rota}:\n${status5xx.join('\n')}`).toEqual([]);
      expect(erros, `Erros de console em ${rota}:\n${erros.join('\n')}`).toEqual([]);
    });
  }
});
