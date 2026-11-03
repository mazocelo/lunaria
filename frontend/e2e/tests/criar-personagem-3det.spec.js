import { test, expect } from '@playwright/test';
import { pularOnboarding } from '../support/auth.js';

/**
 * Fluxo 3 — Criacao de personagem 3D&T (ficha-livre).
 * O modo 3D&T e deterministico (sem LLM): distribui pontos de Caracteristicas
 * e cria. `podeCriar` exige apenas nome preenchido e pontos nao estourados.
 */
test.describe('Criar personagem 3D&T', () => {
  test('distribui caracteristicas e cria o personagem', async ({ page }) => {
    // A sessao ja vem autenticada via storageState (ver auth.setup.js).
    await pularOnboarding(page);
    await page.goto('/novo-personagem?sistema=tresdet');

    // Confirma que a ficha 3D&T renderizou.
    await expect(
      page.getByRole('heading', { name: /3D&T Alpha.*Ficha de Personagem/i }),
    ).toBeVisible({ timeout: 20_000 });

    // Botao Criar comeca desabilitado (nome vazio).
    const btnCriar = page.getByRole('button', { name: /^criar personagem$/i });
    await expect(btnCriar).toBeDisabled();

    // Preenche um nome unico.
    const nome = `QA 3DT E2E ${Date.now().toString().slice(-6)}`;
    await page.getByPlaceholder(/nome do personagem/i).fill(nome);

    // Distribui 4 pontos nas Caracteristicas usando o botao "+" da secao.
    const secaoCaracteristicas = page.locator('section', {
      has: page.getByRole('heading', { name: /caracteristicas/i }),
    });
    const botoesMais = secaoCaracteristicas.getByRole('button', { name: '+' });
    await expect(botoesMais.first()).toBeVisible();

    let cliques = 0;
    const totalBotoes = await botoesMais.count();
    for (let i = 0; i < totalBotoes && cliques < 4; i += 1) {
      const botao = botoesMais.nth(i);
      if (await botao.isEnabled()) {
        await botao.click();
        cliques += 1;
        // espera o contador refletir o clique antes do proximo
        await expect(
          secaoCaracteristicas.locator('text=/\\d+\\s*pts/i'),
        ).toBeVisible();
      }
    }
    expect(cliques).toBeGreaterThan(0);

    // Criar agora deve estar habilitado.
    await expect(btnCriar).toBeEnabled();

    // Cria o personagem — POST /personagens e redirect para /personagens.
    const [criacao] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/personagens') && r.request().method() === 'POST',
        { timeout: 30_000 },
      ),
      btnCriar.click(),
    ]);
    expect(criacao.status(), 'POST /personagens deveria responder 2xx').toBeLessThan(300);

    // Apos criar, o app navega para a lista de personagens.
    await page.waitForURL(/\/personagens$/, { timeout: 30_000 });

    // O personagem recem-criado aparece na lista.
    await expect(page.getByText(nome, { exact: false })).toBeVisible({
      timeout: 20_000,
    });
  });
});
