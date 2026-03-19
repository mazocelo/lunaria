import { describe, it, expect } from 'vitest';
import { prepararTurno, resolverTurno, formatarContexto } from '../helpers/gameEngine.js';

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

  describe('resolverTurno', () => {
    it('finaliza ataque após rolagem de dado', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'atacar' };
      const prep = prepararTurno(sessao, 'user_1', intent);

      expect(prep.requerTeste).toBeTruthy();

      const acaoPendente = {
        tipo: 'atacar',
        userId: 'user_1',
        personagem: { nome: 'Moruxis', id: 'user_1' },
        combatIntent: intent,
        statusEfeitos: prep.statusEfeitos || [],
        stage: 'attack_roll',
        targetId: 'dretch_0',
        targetName: 'Dretch',
        targetDefense: 10,
        targetEvasion: 0,
        targetArmor: 2,
        damageNotation: '1d6+1',
        attackBonus: 2,
        sourceActionName: 'Ataque',
        ...(prep.requerTeste?.pendingCombatAction || {})
      };
      sessao.estadoJogo.acaoPendenteCombate = acaoPendente;

      const resultadoTeste = {
        rolagemBruta: 15,
        total: 17,
        sucesso: true
      };

      const resultado = resolverTurno(sessao, acaoPendente, resultadoTeste);
      expect(resultado).toBeDefined();
      expect(resultado.acaoConsumida !== undefined || resultado.aguardandoProximoTeste !== undefined).toBe(true);
    });

    it('retorna null quando sessao sem combate', () => {
      const sessao = makeSessao({ estadoJogo: {} });
      const resultado = resolverTurno(sessao, {}, {});
      expect(resultado).toBeNull();
    });

    it('retorna null quando acaoPendente é null', () => {
      const sessao = makeSessao();
      const resultado = resolverTurno(sessao, null, {});
      expect(resultado).toBeNull();
    });
  });

  describe('formatarContexto', () => {
    it('gera contexto com resultado de defesa', () => {
      const sessao = makeSessao();
      const resultado = prepararTurno(sessao, 'user_1', { tipo: 'defender' });

      const contexto = formatarContexto(sessao, 'user_1', resultado);
      expect(contexto).toBeDefined();
      expect(typeof contexto.promptText).toBe('string');
      expect(contexto.promptText.length).toBeGreaterThan(0);
    });

    it('marca requiresTest quando há teste pendente', () => {
      const sessao = makeSessao();
      const resultado = prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

      const contexto = formatarContexto(sessao, 'user_1', resultado);
      expect(contexto.requiresTest).toBe(true);
    });

    it('retorna contexto vazio quando resultado é null', () => {
      const sessao = makeSessao();
      const contexto = formatarContexto(sessao, 'user_1', null);
      expect(contexto.promptText).toBe('');
    });

    it('passa turnStateText para buildCombatPromptContext', () => {
      const sessao = makeSessao();
      const resultado = prepararTurno(sessao, 'user_1', { tipo: 'defender' });

      const contexto = formatarContexto(sessao, 'user_1', resultado, { turnStateText: 'HP: 20/20 Mana: 15/15' });
      expect(contexto).toBeDefined();
      expect(typeof contexto.promptText).toBe('string');
    });
  });
});
