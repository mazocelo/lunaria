import { describe, it, expect } from 'vitest';
import { runInvariants } from './invariants.js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CENARIO_ID = '02-magia-com-custo';
const cenario = JSON.parse(readFileSync(join(__dirname, '../fixtures/scenarios', `${CENARIO_ID}.json`), 'utf8'));
const MODELS = ['groq', 'gemini', 'sonnet'];

for (const model of MODELS) {
  const logPath = join(__dirname, '../fixtures/frozen', CENARIO_ID, `${model}.json`);

  describe(`${CENARIO_ID} [${model}]`, () => {
    if (!existsSync(logPath)) {
      it.skip(`log not found — run: node scripts/canonical-runner.js ${CENARIO_ID} --model ${model}`, () => {});
      return;
    }

    const log = JSON.parse(readFileSync(logPath, 'utf8'));
    const results = runInvariants(log, cenario);

    for (const [name, result] of Object.entries(results.results)) {
      it(name, () => {
        expect(result.falhas, result.falhas.join('\n')).toEqual([]);
      });
    }

    it('execution completed', () => {
      expect(log.statusExecucao).toBe('concluida');
    });
  });
}
