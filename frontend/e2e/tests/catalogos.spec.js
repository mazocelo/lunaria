import { test, expect } from '@playwright/test';
import { pularOnboarding, coletarErros } from '../support/auth.js';

/**
 * Fluxo 4 — Catalogos.
 * Verifica que as listas de Habilidades/Magias, Classes, Racas e Monstros
 * carregam, exibem conteudo (cards) e nao quebram com erro de console.
 */

const CATALOGOS = [
  { nome: 'Habilidades/Magias', rota: '/habilidades-magias', titulo: /habilidades/i },
  { nome: 'Classes', rota: '/classes', titulo: /classes/i },
  { nome: 'Racas', rota: '/racas', titulo: /ra[çc]as/i },
  { nome: 'Monstros', rota: '/monstros', titulo: /monstros/i },
];

test.describe('Catalogos', () => {
  test.beforeEach(async ({ page }) => {
    // A sessao ja vem autenticada via storageState (ver auth.setup.js).
    await pularOnboarding(page);
  });

  for (const catalogo of CATALOGOS) {
    test(`${catalogo.nome} carrega com conteudo e sem erro`, async ({ page }) => {
      const erros = coletarErros(page);
      const resp = await page.goto(catalogo.rota);

      // A pagina HTML em si nao pode vir com status >= 400.
      expect(resp?.status() ?? 200).toBeLessThan(400);

      // O cabecalho da pagina confirma que a rota certa renderizou.
      await expect(
        page.getByRole('heading', { name: catalogo.titulo }).first(),
      ).toBeVisible({ timeout: 20_000 });

      // Aguarda os skeletons sairem e cards reais aparecerem.
      const cards = page.locator('[class*="card"i]');
      await expect(cards.first()).toBeVisible({ timeout: 20_000 });
      expect(await cards.count()).toBeGreaterThan(0);

      // A tela nao pode estar em branco.
      const textoLen = await page.evaluate(
        () => document.body.innerText.trim().length,
      );
      expect(textoLen).toBeGreaterThan(50);

      expect(erros, `Erros de console em ${catalogo.rota}:\n${erros.join('\n')}`).toEqual([]);
    });
  }
});
