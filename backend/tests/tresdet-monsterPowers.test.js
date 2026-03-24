import { describe, it, expect } from 'vitest';
import { resolverAbsorcao, resolverRessurreicao, temPoder } from '../game-systems/tresdet/monsterPowerEngine.js';

describe('resolverAbsorcao', () => {
  it('returns absorbed damage amount', () => {
    const monstro = { nome: 'Golem' };
    const result = resolverAbsorcao(monstro, 5);
    expect(result.danoAbsorvido).toBe(5);
    expect(result.detalhes).toContain('Golem');
    expect(result.detalhes).toContain('5');
  });
});

describe('resolverRessurreicao', () => {
  it('respawns with half HP', () => {
    const monstro = { nome: 'Hidra', hp_max: 20 };
    const result = resolverRessurreicao(monstro);
    expect(result.ressuscitou).toBe(true);
    expect(result.hpRestaurado).toBe(10);
  });

  it('rounds up for odd HP', () => {
    const monstro = { nome: 'Troll', hp_max: 15 };
    const result = resolverRessurreicao(monstro);
    expect(result.hpRestaurado).toBe(8);
  });
});

describe('temPoder', () => {
  it('finds power by name', () => {
    const monstro = { habilidades: [{ nome: 'Absorção', descricao: 'absorve dano' }] };
    expect(temPoder(monstro, 'Absorção')).toBeTruthy();
  });

  it('returns null when power not found', () => {
    const monstro = { habilidades: [{ nome: 'Garra', descricao: 'ataque' }] };
    expect(temPoder(monstro, 'Absorção')).toBeNull();
  });

  it('handles null/empty habilidades', () => {
    expect(temPoder({}, 'Absorção')).toBeNull();
    expect(temPoder({ habilidades: null }, 'Absorção')).toBeNull();
  });
});
