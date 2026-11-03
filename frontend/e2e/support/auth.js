/**
 * Helpers compartilhados pelos specs.
 *
 * A autenticacao em si e feita uma unica vez pelo projeto "setup"
 * (support/auth.setup.js), e a sessao e reusada via storageState — ver
 * playwright.config.js. Os specs de fluxo ja entram autenticados; o
 * login.spec.js exercita o login real explicitamente.
 */

/**
 * Marca o tour de onboarding como concluido antes da app carregar.
 *
 * Em uma conta nova/limpa, o `OnboardingTour` abre um modal fixo (z-[60]) que
 * intercepta cliques na UI. Dispensa-lo via localStorage e setup de ambiente de
 * teste — nao mascara bug de produto — e mantem os specs deterministicos.
 * Deve ser chamado ANTES do primeiro page.goto().
 * @param {import('@playwright/test').Page} page
 */
export async function pularOnboarding(page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('lunaria_onboarding_completed', 'true');
    } catch {
      /* contexto sem localStorage — ignora */
    }
  });
}

/**
 * Coletor de erros de console e pageerrors de uma pagina.
 * Retorna um array vivo que vai sendo preenchido conforme a pagina executa.
 * Ignora ruido conhecido que nao indica bug de produto (favicon, libs de 3os).
 * @param {import('@playwright/test').Page} page
 */
export function coletarErros(page) {
  const erros = [];
  const IGNORAR = [
    /favicon/i,
    /Failed to load resource.*404/i, // recursos estaticos opcionais
    /ResizeObserver loop/i,
    /\[vite\]/i,
  ];
  const relevante = (txt) => !IGNORAR.some((re) => re.test(txt));

  page.on('console', (msg) => {
    if (msg.type() === 'error' && relevante(msg.text())) {
      erros.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    erros.push(`[pageerror] ${err.message}`);
  });
  return erros;
}
