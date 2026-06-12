import { describe, it, expect } from 'vitest';
import {
  resolverAbsorcao,
  resolverRessurreicao,
  temPoder,
  aplicarPoderesPosDano,
  consumirDanoAbsorvido,
} from '../game-systems/tresdet/monsterPowerEngine.js';

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

describe('aplicarPoderesPosDano', () => {
  it('Absorção acumula o dano recebido entre golpes', () => {
    const monstro = { nome: 'Golem', hp: 20, habilidades: [{ nome: 'Absorção' }] };
    const r1 = aplicarPoderesPosDano(monstro, 5);
    expect(r1.danoAbsorvidoTotal).toBe(5);
    expect(monstro._danoAbsorvido).toBe(5);
    const r2 = aplicarPoderesPosDano(monstro, 3);
    expect(r2.danoAbsorvidoTotal).toBe(8);
    expect(monstro._danoAbsorvido).toBe(8);
  });

  it('Ressurreição regenera na primeira morte e marca status vivo', () => {
    const monstro = { nome: 'Hidra', hp: 0, hp_max: 20, habilidades: [{ nome: 'Ressurreição' }] };
    const r = aplicarPoderesPosDano(monstro, 10);
    expect(r.ressurreicao).toBeTruthy();
    expect(monstro.hp).toBe(10);
    expect(monstro.status).toBe('vivo');
    expect(monstro._jaRessuscitou).toBe(true);
  });

  it('marca derrotado quando ja ressuscitou', () => {
    const monstro = { nome: 'Hidra', hp: 0, hp_max: 20, _jaRessuscitou: true, habilidades: [{ nome: 'Ressurreição' }] };
    const r = aplicarPoderesPosDano(monstro, 10);
    expect(r.ressurreicao).toBeNull();
    expect(monstro.status).toBe('derrotado');
  });

  it('marca derrotado quando morre sem poderes', () => {
    const monstro = { nome: 'Lobo', hp: 0, hp_max: 8, habilidades: [] };
    const r = aplicarPoderesPosDano(monstro, 5);
    expect(r.ressurreicao).toBeNull();
    expect(r.danoAbsorvidoTotal).toBeNull();
    expect(monstro.status).toBe('derrotado');
  });

  it('nao altera status de monstro vivo apos dano nao letal', () => {
    const monstro = { nome: 'Lobo', hp: 3, status: 'vivo', habilidades: [] };
    const r = aplicarPoderesPosDano(monstro, 5);
    expect(r.ressurreicao).toBeNull();
    expect(monstro.status).toBe('vivo');
  });
});

describe('consumirDanoAbsorvido', () => {
  it('devolve e zera o dano acumulado', () => {
    const monstro = { nome: 'Golem', _danoAbsorvido: 8, habilidades: [{ nome: 'Absorção' }] };
    const r = consumirDanoAbsorvido(monstro);
    expect(r.dano).toBe(8);
    expect(monstro._danoAbsorvido).toBe(0);
  });

  it('retorna 0 sem poder ou sem acumulo', () => {
    expect(consumirDanoAbsorvido({ nome: 'Lobo', habilidades: [] }).dano).toBe(0);
    expect(consumirDanoAbsorvido({ nome: 'Golem', _danoAbsorvido: 0, habilidades: [{ nome: 'Absorção' }] }).dano).toBe(0);
  });
});
