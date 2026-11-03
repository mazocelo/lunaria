import { describe, it, expect } from 'vitest';
import lunariaEngine from '../game-systems/lunaria/index.js';

describe('lunaria extrairBonusEquipamentos', () => {
  it('agrega bonus de equipamentos Lunaria', () => {
    const equipamentos = [
      { bonus: { ataque: 2, dano: 1, armadura: 0 } },
      { bonus: { ataque: 0, dano: 0, armadura: 3 } },
    ];
    const result = lunariaEngine.extrairBonusEquipamentos(equipamentos);
    expect(result.ataque).toBe(2);
    expect(result.dano).toBe(1);
    expect(result.armadura).toBe(3);
  });

  it('retorna zeros para array vazio', () => {
    const result = lunariaEngine.extrairBonusEquipamentos([]);
    expect(result.ataque).toBe(0);
  });
});

describe('lunaria buildCombatState', () => {
  it('retorna state com esquiva e armadura', () => {
    const personagem = {
      nome: 'Aria',
      atributos: { constituicao: 14, destreza: 12, agilidade: 10, inteligencia: 10, carisma: 10 },
      nivel: 1,
      raca_nome: 'Humano',
    };
    const bonusEquip = { ataque: 1, dano: 0, armadura: 2, esquiva_bonus: 0, esquiva_penalidade: 0 };
    const state = lunariaEngine.buildCombatState(personagem, bonusEquip);
    expect(state).toHaveProperty('hp_max');
    expect(state).toHaveProperty('personagemNome', 'Aria');
    expect(state.armadura).toBe(2);
  });

  it('retorna defaults para personagem null', () => {
    const state = lunariaEngine.buildCombatState(null, {});
    expect(state.hp_max).toBe(15);
    expect(state.personagemNome).toBe('Jogador');
  });
});

describe('lunaria getIniciativaConfig', () => {
  it('retorna d20 + agilidade modifier', () => {
    const personagem = { atributos: { agilidade: 14 } };
    const config = lunariaEngine.getIniciativaConfig(personagem);
    expect(config.atributo).toBe('Agilidade');
    expect(config.lados).toBe(20);
    expect(config.modificador).toBe(2);
  });
});

describe('lunaria resolverConsumo', () => {
  it('retorna array vazio (não implementado)', () => {
    const result = lunariaEngine.resolverConsumo({}, { efeito: 'teste' });
    expect(result).toEqual([]);
  });
});
