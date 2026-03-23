import { describe, it, expect } from 'vitest';
import { calcularDinheiroInicial, calcularPrecoVenda, LIMITES_EQUIP } from '../helpers/economiaHelper.js';

describe('economiaHelper', () => {
  describe('calcularDinheiroInicial', () => {
    it('retorna valor base entre 100 e 600 sem modificadores', () => {
      for (let i = 0; i < 20; i++) {
        const result = calcularDinheiroInicial([], []);
        expect(result).toBeGreaterThanOrEqual(100);
        expect(result).toBeLessThanOrEqual(600);
      }
    });

    it('retorna valor gigante com Riqueza', () => {
      for (let i = 0; i < 10; i++) {
        const result = calcularDinheiroInicial([{ nome: 'Riqueza' }], []);
        expect(result).toBeGreaterThanOrEqual(100_000_000);
        expect(result).toBeLessThanOrEqual(600_000_000);
      }
    });

    it('aumenta com vantagem Boa Fama', () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(calcularDinheiroInicial([{ nome: 'Boa Fama' }], []));
      }
      const media = results.reduce((a, b) => a + b, 0) / results.length;
      expect(media).toBeGreaterThan(300);
    });

    it('diminui com desvantagem Inculto', () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(calcularDinheiroInicial([], [{ nome: 'Inculto' }]));
      }
      const media = results.reduce((a, b) => a + b, 0) / results.length;
      expect(media).toBeLessThan(350);
    });

    it('aceita pericias por tipo', () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(calcularDinheiroInicial([{ nome: 'Sobrevivência', tipo: 'pericia' }], []));
      }
      const media = results.reduce((a, b) => a + b, 0) / results.length;
      expect(media).toBeGreaterThan(500);
    });
  });

  describe('calcularPrecoVenda', () => {
    it('retorna metade arredondada pra baixo', () => {
      expect(calcularPrecoVenda(100)).toBe(50);
      expect(calcularPrecoVenda(151)).toBe(75);
      expect(calcularPrecoVenda(1)).toBe(0);
      expect(calcularPrecoVenda(0)).toBe(0);
    });
  });

  describe('LIMITES_EQUIP', () => {
    it('define limites corretos', () => {
      expect(LIMITES_EQUIP.arma).toBe(1);
      expect(LIMITES_EQUIP.armadura).toBe(1);
      expect(LIMITES_EQUIP.acessorio).toBe(2);
      expect(LIMITES_EQUIP.consumivel).toBe(0);
      expect(LIMITES_EQUIP.pergaminho).toBe(0);
    });
  });
});
