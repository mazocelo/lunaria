// src/__tests__/wizard/custoTraco.test.ts
import { describe, it, expect } from 'vitest';
import { formatarCustoTraco } from '../../Pages/Personagem/Wizard/stages/custoTraco';
import { motivosDeBloqueio, saldoAposTroca } from '../../Pages/Personagem/Wizard/stages/orcamento';

describe('formatarCustoTraco', () => {
  it('verbo explícito, sem depender do sinal', () => {
    expect(formatarCustoTraco(2)).toMatchObject({ texto: 'Custa 2 pts', efeito: 'gasta' });
    expect(formatarCustoTraco(1).texto).toBe('Custa 1 pt');
    expect(formatarCustoTraco(-2)).toMatchObject({ texto: 'Devolve 2 pts', efeito: 'devolve' });
    expect(formatarCustoTraco(0)).toMatchObject({ texto: 'Grátis', efeito: 'gratis' });
    expect(formatarCustoTraco(null).texto).toBe('Grátis');
  });
  it('gasta em âmbar, devolve em verde', () => {
    expect(formatarCustoTraco(2).classe).toContain('amber');
    expect(formatarCustoTraco(-2).classe).toContain('emerald');
  });
});

describe('motivosDeBloqueio', () => {
  const o = { pontosCriacaoRestantes: 3, pontosDesvantagem: -2, maxCustoDesvantagem: 3, tierMaximo: 1 };
  it('vantagem: saldo e tier', () => {
    expect(motivosDeBloqueio('vantagem', [{ id: 1, custo: 3 }, { id: 2, custo: 5 }, { id: 3, custo: 1, nivel: 2 }], o))
      .toEqual({ 2: 'Saldo insuficiente (faltam 2 pts)', 3: 'Requer tier 2' });
  });
  it('desvantagem: teto de devolução', () => {
    expect(motivosDeBloqueio('desvantagem', [{ id: 4, custo: -1 }, { id: 5, custo: -2 }], o))
      .toEqual({ 5: 'Teto de desvantagens atingido (2/3)' });
  });
});

describe('saldoAposTroca', () => {
  it('desconta o custo da escolha atual da mesma categoria', () => {
    expect(saldoAposTroca(2, 1, 4)).toBe(-1);
    expect(saldoAposTroca(2, 0, 0)).toBe(2);
  });
});
