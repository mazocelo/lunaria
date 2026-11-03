import { describe, it, expect } from 'vitest';
import { resolverTesteMorte, verificarPertoDaMorte } from '../game-systems/tresdet/combatEngine.js';

describe('tresdet resolverTesteMorte', () => {
  it('returns valid status and rolagem', () => {
    const result = resolverTesteMorte({});
    expect(['muito_fraco', 'inconsciente', 'quase_morto', 'morto']).toContain(result.status);
    expect(result.rolagem).toBeGreaterThanOrEqual(1);
    expect(result.rolagem).toBeLessThanOrEqual(6);
    expect(result.detalhes).toContain('Teste de Morte');
  });

  it('covers all possible outcomes over many rolls', () => {
    const statuses = new Set();
    for (let i = 0; i < 200; i++) {
      statuses.add(resolverTesteMorte({}).status);
    }
    expect(statuses.has('muito_fraco')).toBe(true);
    expect(statuses.has('inconsciente')).toBe(true);
    expect(statuses.has('quase_morto')).toBe(true);
    expect(statuses.has('morto')).toBe(true);
  });
});

describe('tresdet verificarPertoDaMorte', () => {
  it('returns true when hp <= R and hp > 0', () => {
    const p = { hp_atual: 2, atributos_personagem: [{ nome: 'R', valor: 3 }] };
    expect(verificarPertoDaMorte(p)).toBe(true);
  });

  it('returns false when hp > R', () => {
    const p = { hp_atual: 10, atributos_personagem: [{ nome: 'R', valor: 3 }] };
    expect(verificarPertoDaMorte(p)).toBe(false);
  });

  it('returns false when hp = 0', () => {
    const p = { hp_atual: 0, atributos_personagem: [{ nome: 'R', valor: 3 }] };
    expect(verificarPertoDaMorte(p)).toBe(false);
  });
});
