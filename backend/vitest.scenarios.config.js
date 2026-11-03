import { defineConfig } from 'vitest/config';

/**
 * Config dos cenários canônicos de IA (`npm run test:canonical`).
 *
 * Estes testes (`tests/scenarios/NN-*.test.js`) NÃO chamam o LLM: eles
 * validam logs "frozen" já gravados em `tests/fixtures/frozen/`.
 *
 * Os logs frozen são (re)gerados por `node scripts/canonical-runner.js`, que
 * executa os cenários contra modelos REAIS (Groq/Gemini/Sonnet) e CONSOME
 * COTA DE LLM. Rode o runner apenas quando precisar atualizar os fixtures.
 */
export default defineConfig({
  test: {
    include: ['tests/scenarios/[0-9]*.test.js'],
  },
});
