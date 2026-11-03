import { describe, it, expect } from 'vitest';
import { calcularPECombate, calcularConversoesPE, converterPE } from '../game-systems/tresdet/progressionEngine.js';

describe('calcularPECombate', () => {
  it('awards 1 PE per monster', () => {
    const monstros = [{ nome: 'Goblin' }, { nome: 'Orc' }, { nome: 'Troll' }];
    const result = calcularPECombate(monstros);
    expect(result.peTotal).toBe(3);
    expect(result.detalhes).toHaveLength(3);
  });

  it('returns 0 for empty array', () => {
    expect(calcularPECombate([]).peTotal).toBe(0);
    expect(calcularPECombate(null).peTotal).toBe(0);
  });

  it('uses fallback name for unnamed monsters', () => {
    const result = calcularPECombate([{}]);
    expect(result.detalhes[0]).toContain('Monstro');
  });
});

describe('calcularConversoesPE', () => {
  it('calculates available conversions', () => {
    const result = calcularConversoesPE(25);
    expect(result.caracteristicas).toBe(2);
    expect(result.moedas).toBe(2500);
    expect(result.magias).toBe(25);
    expect(result.autoSucessos).toBe(25);
  });

  it('returns 0 caracteristicas for less than 10 PE', () => {
    const result = calcularConversoesPE(9);
    expect(result.caracteristicas).toBe(0);
  });
});

describe('converterPE', () => {
  it('converts 10 PE to 1 characteristic point', () => {
    const result = converterPE(10, 'caracteristica');
    expect(result.peGasto).toBe(10);
    expect(result.ganho).toContain('+1');
  });

  it('converts 1 PE to 100 moedas', () => {
    const result = converterPE(1, 'tesouro');
    expect(result.peGasto).toBe(1);
    expect(result.ganho).toContain('100');
  });

  it('converts 1 PE to a new spell', () => {
    const result = converterPE(1, 'magia');
    expect(result.peGasto).toBe(1);
    expect(result.ganho).toContain('magia');
  });

  it('converts 1 PE to auto success', () => {
    const result = converterPE(1, 'auto_sucesso');
    expect(result.peGasto).toBe(1);
    expect(result.ganho).toContain('automatico');
  });

  it('returns null when insufficient PE', () => {
    expect(converterPE(5, 'caracteristica')).toBeNull();
  });

  it('returns null for unknown tipo', () => {
    expect(converterPE(10, 'invalido')).toBeNull();
  });
});
