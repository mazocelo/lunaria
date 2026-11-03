import { defineConfig } from 'vitest/config';

/**
 * Config dos testes unitários do backend (`npm test`).
 *
 * Os cenários canônicos de IA (`tests/scenarios/NN-*.test.js`) ficam de fora
 * desta suíte: eles asseguram logs "frozen" gerados por chamadas reais de LLM
 * e são rodados sob demanda via `npm run test:canonical`.
 *
 * `tests/scenarios/invariants.test.js` é um teste unitário do motor de
 * invariantes (fixtures sintéticas, sem LLM) — permanece na suíte padrão.
 */
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      'tests/scenarios/[0-9]*.test.js',
    ],
  },
});
