import { describe, it, expect } from 'vitest';
import tresdetEngine from '../game-systems/tresdet/index.js';

describe('tresdet buildCombatState', () => {
  const personagem = {
    nome: 'Koltar',
    atributos_personagem: [
      { nome: 'F', valor: 3 },
      { nome: 'H', valor: 2 },
      { nome: 'R', valor: 2 },
      { nome: 'A', valor: 1 },
      { nome: 'PdF', valor: 0 },
    ],
    stats_sistema: { temMagia: false },
  };

  const bonusEquip = { F: 1, PdF: 0, A: 1, H: 0, iniciativa: 0, especiais: [] };

  it('calcula HP corretamente (R*5)', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.hp_max).toBe(10);
  });

  it('soma bonus de equip no ofensivo', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.ofensivo.F).toBe(4);
    expect(state.ofensivo.PdF).toBe(0);
    expect(state.ofensivo.H).toBe(2);
  });

  it('soma bonus de equip no defensivo', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.defensivo.A).toBe(2);
    expect(state.defensivo.H).toBe(2);
  });

  it('mana zero sem magia', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.mana_max).toBe(0);
  });

  it('mana R*5 com magia', () => {
    const mago = { ...personagem, stats_sistema: { temMagia: true } };
    const state = tresdetEngine.buildCombatState(mago, bonusEquip);
    expect(state.mana_max).toBe(10);
  });

  it('retorna defaults para personagem null', () => {
    const state = tresdetEngine.buildCombatState(null, {});
    expect(state.hp_max).toBe(5);
    expect(state.personagemNome).toBe('Personagem');
  });
});

describe('tresdet getIniciativaConfig', () => {
  it('retorna d6 + H', () => {
    const personagem = {
      atributos_personagem: [{ nome: 'H', valor: 3 }],
    };
    const config = tresdetEngine.getIniciativaConfig(personagem);
    expect(config.atributo).toBe('Habilidade');
    expect(config.lados).toBe(6);
    expect(config.modificador).toBe(3);
  });

  it('soma bonus de iniciativa', () => {
    const personagem = {
      atributos_personagem: [{ nome: 'H', valor: 2 }],
      iniciativa_bonus: 2,
    };
    const config = tresdetEngine.getIniciativaConfig(personagem);
    expect(config.modificador).toBe(4);
  });
});

describe('tresdet resolverAtaque', () => {
  const atacante = { atributos_personagem: [{ nome: 'F', valor: 3 }, { nome: 'H', valor: 2 }] };
  const defensor = { atributos_personagem: [{ nome: 'A', valor: 1 }, { nome: 'H', valor: 1 }] };

  it('retorna shape unificado com campo dados', () => {
    const result = tresdetEngine.resolverAtaque(atacante, defensor, {});
    expect(result).toHaveProperty('acertou');
    expect(result).toHaveProperty('dano');
    expect(result).toHaveProperty('critico');
    expect(result).toHaveProperty('detalhes');
    expect(result).toHaveProperty('dados');
    expect(typeof result.detalhes).toBe('string');
    expect(result.dados).toHaveProperty('FA');
    expect(result.dados).toHaveProperty('FD');
    expect(result.dados).toHaveProperty('dadoAtaque');
    expect(result.dados).toHaveProperty('dadoDefesa');
  });
});

describe('tresdet resolverConsumo', () => {
  it('parseia cura de PV', () => {
    const item = { efeito: 'Restaura 5 Pontos de Vida.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([{ campo: 'hp', valor: 5, descricao: 'Restaura 5 Pontos de Vida' }]);
  });

  it('parseia cura total de PV', () => {
    const item = { efeito: 'Restaura todos os Pontos de Vida.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([{ campo: 'hp', valor: 'max', descricao: 'Restaura todos os Pontos de Vida' }]);
  });

  it('parseia cura de PM', () => {
    const item = { efeito: 'Restaura 10 Pontos de Magia.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([{ campo: 'mp', valor: 10, descricao: 'Restaura 10 Pontos de Magia' }]);
  });

  it('parseia cura dupla PV+PM', () => {
    const item = { efeito: 'Restaura 5 Pontos de Vida e 5 Pontos de Magia.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ campo: 'hp', valor: 5, descricao: 'Restaura 5 Pontos de Vida' });
    expect(result[1]).toEqual({ campo: 'mp', valor: 5, descricao: 'Restaura 5 Pontos de Magia' });
  });

  it('parseia cura total dupla', () => {
    const item = { efeito: 'Restaura todos os Pontos de Vida e Pontos de Magia.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toHaveLength(2);
    expect(result[0].campo).toBe('hp');
    expect(result[0].valor).toBe('max');
    expect(result[1].campo).toBe('mp');
    expect(result[1].valor).toBe('max');
  });

  it('retorna array vazio para efeito não reconhecido', () => {
    const item = { efeito: 'Cura venenos e doenças.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([]);
  });

  it('retorna array vazio para item null', () => {
    const result = tresdetEngine.resolverConsumo({}, null);
    expect(result).toEqual([]);
  });
});
