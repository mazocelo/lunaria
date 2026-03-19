import { describe, it, expect } from 'vitest';
import { prepararTurno } from '../helpers/gameEngine.js';

// ── Factories ──

function makeSessao(overrides = {}) {
  const userId = 'user_1';
  return {
    estadoJogo: {
      combate: makeActiveCombat(),
      ...overrides.estadoJogo
    },
    personagensCompletos: {
      [userId]: makePersonagemCompleto(),
      ...overrides.personagensCompletos
    },
    jogadores: { [userId]: { personagemId: userId, nome: 'Moruxis' } },
    ...overrides
  };
}

function makeActiveCombat(overrides = {}) {
  return {
    ativo: true,
    rodadaCombate: 1,
    monstros: [
      { id: 'dretch_0', nome: 'Dretch', status: 'vivo', hp_atual: 25, hp_max: 25, defesa: 10, esquiva: 0, armadura: 2, dano_base: '1d6', forca: 12, habilidades: [], resistencias: {}, imunidades: [], cooldowns: {}, status_efeitos: [], xp: 30 }
    ],
    jogadores: {
      'user_1': { personagemId: 'user_1', hp_max: 20, hp_atual: 20, mana_max: 15, mana_atual: 15, esquiva: 10, armadura: 1, bonusAtaque: 2, bonusDano: 1, dano_base: '1d6', elemento: null, status: 'vivo', personagemNome: 'Moruxis', cooldowns: {}, status_efeitos: [] }
    },
    jogadoresQueAgiram: [],
    log: [],
    resultado: null,
    ...overrides
  };
}

function makePersonagemCompleto(overrides = {}) {
  return {
    id: 'user_1',
    personagemId: 'user_1',
    nome: 'Moruxis',
    classe: 'Paladino',
    raca: 'Humano',
    nivel: 3,
    atributos: { forca: 14, inteligencia: 10, carisma: 12, destreza: 10, constituicao: 12, agilidade: 10 },
    hp_atual: 20, hp_max: 20, mana_atual: 15, mana_max: 15,
    vantagens: [], desvantagens: [],
    habilidades: [
      { id: 'luz_divina', nome: 'Luz Divina', custo_mana: 5, cooldown_turnos: 0, dano_base: '2d6', efeito: null, elemento: 'sagrado', escola_magia: 'divina' }
    ],
    equipamentos: [],
    status_efeitos: [],
    ...overrides
  };
}

describe('gameEngine', () => {
  describe('prepararTurno', () => {
    it('retorna resultado pré-resolvido para ataque básico', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'atacar' };
      const resultado = prepararTurno(sessao, 'user_1', intent);

      expect(resultado).toBeDefined();
      expect(resultado.requerTeste).toBeTruthy();
      expect(resultado.requerTeste.intentTipo).toBe('atacar');
    });

    it('retorna resultado com defesa (sem teste)', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'defender' };
      const resultado = prepararTurno(sessao, 'user_1', intent);

      expect(resultado).toBeDefined();
      expect(resultado.requerTeste).toBeNull();
      expect(resultado.defesa).toBeTruthy();
      expect(resultado.defesa.esquivaBonus).toBe(25);
      expect(resultado.acaoConsumida).toBe(true);
    });

    it('retorna null quando combate não está ativo', () => {
      const sessao = makeSessao({ estadoJogo: { combate: { ativo: false } } });
      const resultado = prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

      expect(resultado).toBeNull();
    });

    it('resolve personagem de personagensCompletos', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'defender' };
      const resultado = prepararTurno(sessao, 'user_1', intent);

      expect(resultado.defesa.personagem).toBe('Moruxis');
    });
  });
});
