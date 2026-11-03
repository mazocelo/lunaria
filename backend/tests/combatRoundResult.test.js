import { describe, it, expect } from 'vitest';
import { createCombatRoundResult } from '../helpers/combat/combatRoundResult.js';

describe('createCombatRoundResult', () => {
  it('retorna todos os 15 campos com defaults', () => {
    const result = createCombatRoundResult();

    expect(result.intentTipo).toBeNull();
    expect(result.acaoConsumida).toBe(false);
    expect(result.statusEfeitos).toEqual([]);
    expect(result.ataqueJogador).toBeNull();
    expect(result.defesa).toBeNull();
    expect(result.fuga).toBeNull();
    expect(result.habilidade).toBeNull();
    expect(result.contraAtaques).toEqual([]);
    expect(result.rodadaAvancou).toBe(false);
    expect(result.combateFinalizado).toBe(false);
    expect(result.resultadoCombate).toBeNull();
    expect(result.statusRemovidos).toEqual([]);
    expect(result.statusEfeitosMonstro).toEqual([]);
    expect(result.jogadorDerrotado).toBe(false);
    expect(result.requerTeste).toBeNull();
  });

  it('aplica overrides corretamente', () => {
    const result = createCombatRoundResult({
      intentTipo: 'atacar',
      acaoConsumida: true,
      combateFinalizado: true,
      resultadoCombate: 'vitoria',
    });

    expect(result.intentTipo).toBe('atacar');
    expect(result.acaoConsumida).toBe(true);
    expect(result.combateFinalizado).toBe(true);
    expect(result.resultadoCombate).toBe('vitoria');
    // Campos nao sobrepostos permanecem default
    expect(result.defesa).toBeNull();
    expect(result.contraAtaques).toEqual([]);
    expect(result.jogadorDerrotado).toBe(false);
  });

  it('nenhum campo e undefined', () => {
    const result = createCombatRoundResult();
    for (const [key, value] of Object.entries(result)) {
      expect(value, `campo '${key}' nao deve ser undefined`).not.toBeUndefined();
    }
  });

  it('cada chamada retorna objeto independente', () => {
    const a = createCombatRoundResult();
    const b = createCombatRoundResult();
    a.intentTipo = 'atacar';
    expect(b.intentTipo).toBeNull();
  });

  it('arrays sao copias independentes', () => {
    const a = createCombatRoundResult();
    const b = createCombatRoundResult();
    a.statusEfeitos.push('veneno');
    expect(b.statusEfeitos).toHaveLength(0);
  });
});
