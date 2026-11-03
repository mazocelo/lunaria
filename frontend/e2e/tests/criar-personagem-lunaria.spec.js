import { test, expect } from '@playwright/test';
import { pularOnboarding, coletarErros } from '../support/auth.js';

/**
 * Fluxo 2 — Criacao de personagem Lunaria.
 *
 * NOTA DE ESCOPO: o wizard Lunaria e conduzido por chat com o Mestre IA
 * (POST /mestre-criador/interagir a cada etapa). Uma criacao completa exige
 * varias rodadas de LLM real — lento, nao-deterministico e consome cota.
 *
 * Para uma rede de regressao robusta e NAO-flaky, esta suite cobre a parte
 * deterministica do fluxo: o seletor de sistema, a montagem do wizard, o
 * carregamento dos catalogos e o render da primeira etapa. A criacao completa
 * via chat fica como test.skip (ver abaixo) — deve ser exercida manualmente ou
 * por um job dedicado que tolere o custo de LLM.
 */
test.describe('Criar personagem Lunaria', () => {
  test.beforeEach(async ({ page }) => {
    // A sessao ja vem autenticada via storageState (ver auth.setup.js).
    await pularOnboarding(page);
  });

  test('seletor de sistema oferece Lunaria, 3D&T e D&D 5e', async ({ page }) => {
    await page.goto('/novo-personagem');

    await expect(
      page.getByRole('heading', { name: /escolha o sistema/i }),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole('button', { name: /lunaria rpg/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /3d&t alpha/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /d&d 5e/i })).toBeVisible();
  });

  test('selecionar Lunaria abre o wizard e renderiza a primeira etapa', async ({ page }) => {
    const erros = coletarErros(page);
    await page.goto('/novo-personagem');

    await page.getByRole('button', { name: /lunaria rpg/i }).click();

    // A escolha vira ?sistema=lunaria na URL.
    await expect(page).toHaveURL(/sistema=lunaria/);

    // A barra de progresso do wizard tem 10 etapas; a primeira e o nome.
    await expect(page.getByText('1/10')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/batize a centelha do heroi/i),
    ).toBeVisible();

    // O campo de input do chat com o Mestre esta presente.
    await expect(page.locator('textarea, input[type="text"]').last()).toBeVisible();

    expect(erros, `Erros de console ao abrir o wizard:\n${erros.join('\n')}`).toEqual([]);
  });

  test('wizard Lunaria pre-carrega os catalogos (racas, classes, vantagens)', async ({ page }) => {
    const catalogosCarregados = new Set();
    page.on('response', (resp) => {
      const url = resp.url();
      for (const c of ['/racas', '/classes', '/vantagens', '/desvantagens']) {
        if (url.includes(c) && resp.status() < 400) catalogosCarregados.add(c);
      }
    });

    await page.goto('/novo-personagem?sistema=lunaria');
    await expect(page.getByText('1/10')).toBeVisible({ timeout: 20_000 });

    // O wizard depende desses catalogos para montar as etapas.
    expect(catalogosCarregados.has('/racas')).toBeTruthy();
    expect(catalogosCarregados.has('/classes')).toBeTruthy();
    expect(catalogosCarregados.has('/vantagens')).toBeTruthy();
  });

  // Criacao completa via chat com o Mestre IA: depende de LLM real, e lenta e
  // nao-deterministica. Mantida fora da rede de regressao automatica.
  // Para exercer manualmente: remover o .skip e rodar com LLM disponivel.
  test.skip('cria um personagem Lunaria completo pelo chat do Mestre', async () => {
    // Intencionalmente vazio — ver comentario acima.
  });
});
