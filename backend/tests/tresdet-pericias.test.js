import { describe, it, expect } from 'vitest';
import { resolverTeste } from '../game-systems/tresdet/testEngine.js';

describe('tresdet resolverTeste with pericias', () => {
  const personagem = {
    atributos_personagem: [{ nome: 'H', valor: 3 }],
  };

  it('applies bonus when opcoes.bonus is provided', () => {
    // With bonus +1, dc effectively becomes dc-1
    // H=3, dc=0, bonus=1 -> alvo = 3 - 0 + 1 = 4, so d6 <= 4 succeeds
    const results = Array.from({ length: 100 }, () => resolverTeste(personagem, 'H', 0, { bonus: 1 }));
    // With alvo=4 (H3 + bonus1), only d6=5,6 fail = ~33% failure
    const successRate = results.filter(r => r.sucesso).length / results.length;
    expect(successRate).toBeGreaterThan(0.5);
  });

  it('works without opcoes (backward compatible)', () => {
    const result = resolverTeste(personagem, 'H', 0);
    expect(result).toHaveProperty('sucesso');
    expect(result).toHaveProperty('rolagem');
    expect(result).toHaveProperty('detalhes');
  });

  it('applies penalty when bonus is negative', () => {
    // H=3, dc=0, bonus=-3 -> alvo = max(0, 3 - 0 - 3) = 0, impossible (d6 always > 0)
    const results = Array.from({ length: 50 }, () => resolverTeste(personagem, 'H', 0, { bonus: -3 }));
    const successRate = results.filter(r => r.sucesso).length / results.length;
    expect(successRate).toBe(0);
  });

  it('applies +1 per pericia in opcoes.pericias', () => {
    // H=3, dc=0, pericias=['Investigação'] -> bonus +1 -> alvo = 4
    const results = Array.from({ length: 100 }, () =>
      resolverTeste(personagem, 'H', 0, { pericias: ['Investigação'] }),
    );
    const successRate = results.filter(r => r.sucesso).length / results.length;
    expect(successRate).toBeGreaterThan(0.5);
  });

  it('combines pericias and bonus', () => {
    // H=3, dc=0, pericias=['Crime'], bonus=1 -> total bonus +2 -> alvo = 5
    const results = Array.from({ length: 100 }, () =>
      resolverTeste(personagem, 'H', 0, { pericias: ['Crime'], bonus: 1 }),
    );
    // alvo=5, only d6=6 fails = ~17% failure
    const successRate = results.filter(r => r.sucesso).length / results.length;
    expect(successRate).toBeGreaterThan(0.7);
  });

  it('includes bonus info in detalhes string', () => {
    const result = resolverTeste(personagem, 'H', 0, { bonus: 2 });
    expect(result.detalhes).toContain('+2');
  });

  it('includes negative bonus in detalhes string', () => {
    const result = resolverTeste(personagem, 'H', 0, { bonus: -1 });
    expect(result.detalhes).toContain('-1');
  });
});
