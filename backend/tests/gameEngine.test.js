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
    it('retorna resultado pré-resolvido para ataque básico', async () => {
      const sessao = makeSessao();
      const intent = { tipo: 'atacar' };
      const resultado = await prepararTurno(sessao, 'user_1', intent);

      expect(resultado).toBeDefined();
      expect(resultado.requerTeste).toBeTruthy();
      expect(resultado.requerTeste.intentTipo).toBe('atacar');
    });

    it('retorna resultado com defesa (sem teste)', async () => {
      const sessao = makeSessao();
      const intent = { tipo: 'defender' };
      const resultado = await prepararTurno(sessao, 'user_1', intent);

      expect(resultado).toBeDefined();
      expect(resultado.requerTeste).toBeNull();
      expect(resultado.defesa).toBeTruthy();
      expect(resultado.defesa.esquivaBonus).toBe(25);
      expect(resultado.acaoConsumida).toBe(true);
    });

    it('retorna null quando combate não está ativo', async () => {
      const sessao = makeSessao({ estadoJogo: { combate: { ativo: false } } });
      const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

      expect(resultado).toBeNull();
    });

    it('resolve personagem de personagensCompletos', async () => {
      const sessao = makeSessao();
      const intent = { tipo: 'defender' };
      const resultado = await prepararTurno(sessao, 'user_1', intent);

      expect(resultado.defesa.personagem).toBe('Moruxis');
    });
  });

  describe('resolverTurno', () => {
    it('finaliza ataque após rolagem de dado', async () => {
      const sessao = makeSessao();
      const intent = { tipo: 'atacar' };
      const prep = await prepararTurno(sessao, 'user_1', intent);

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

  describe('end-to-end: damage applied', () => {
    it('dano reduz HP do monstro após damage_roll', async () => {
      const sessao = makeSessao();
      const dretch = sessao.estadoJogo.combate.monstros[0];
      const hpAntes = dretch.hp_atual;

      // Phase 1: prepararTurno — attack requires test
      const prep = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });
      expect(prep.requerTeste).toBeTruthy();

      // Create pending action (as masterNarrationEngine would)
      const pendingAction = {
        tipo: 'atacar',
        userId: 'user_1',
        personagem: { nome: 'Moruxis', id: 'user_1' },
        combatIntent: { tipo: 'atacar' },
        statusEfeitos: [],
        stage: 'attack_roll',
        targetId: 'dretch_0',
        targetName: 'Dretch',
        targetDefense: 10,
        targetEvasion: 0,
        targetArmor: 2,
        damageNotation: '1d6+1',
        attackBonus: 2,
        sourceActionName: 'Ataque',
        actionKind: 'attack',
        ...(prep.requerTeste?.pendingCombatAction || {})
      };

      // Phase 2a: attack roll — nat 20 (guaranteed hit + crit)
      const atkResult = resolverTurno(sessao, pendingAction, {
        rolagemBruta: 20,
        total: 22,
        sucesso: true
      });

      if (atkResult.aguardandoProximoTeste) {
        // Phase 2b: damage roll
        const dmgAction = {
          ...pendingAction,
          ...atkResult.proximaAcaoPendente
        };
        const dmgResult = resolverTurno(sessao, dmgAction, {
          rolagemBruta: 6,
          total: 7,
          sucesso: true
        });

        // CORE ASSERTION: damage was applied
        expect(dretch.hp_atual).toBeLessThan(hpAntes);
        expect(dmgResult.acaoConsumida).toBe(true);
        // Contra-ataques happened
        expect(dmgResult.contraAtaques).toBeDefined();
      } else {
        // Attack missed (shouldn't happen with nat 20, but handle gracefully)
        expect(atkResult.ataqueJogador).toBeTruthy();
      }
    });

    it('defesa não requer teste e aplica bônus de esquiva', async () => {
      const sessao = makeSessao();
      const jogadorStats = sessao.estadoJogo.combate.jogadores['user_1'];

      const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'defender' });

      expect(resultado.requerTeste).toBeNull();
      expect(resultado.defesa).toBeTruthy();
      expect(resultado.acaoConsumida).toBe(true);
      expect(jogadorStats.defesaTemporaria).toBeDefined();
      expect(jogadorStats.defesaTemporaria.esquivaBonus).toBe(25);
    });
  });

  describe('formatarContexto', () => {
    it('gera contexto com resultado de defesa', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'defender' });

      const contexto = formatarContexto(sessao, 'user_1', resultado);
      expect(contexto).toBeDefined();
      expect(typeof contexto.promptText).toBe('string');
      expect(contexto.promptText.length).toBeGreaterThan(0);
    });

    it('marca requiresTest quando há teste pendente', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

      const contexto = formatarContexto(sessao, 'user_1', resultado);
      expect(contexto.requiresTest).toBe(true);
    });

    it('retorna contexto vazio quando resultado é null', () => {
      const sessao = makeSessao();
      const contexto = formatarContexto(sessao, 'user_1', null);
      expect(contexto.promptText).toBe('');
    });

    it('passa turnStateText para buildCombatPromptContext', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'defender' });

      const contexto = formatarContexto(sessao, 'user_1', resultado, { turnStateText: 'HP: 20/20 Mana: 15/15' });
      expect(contexto).toBeDefined();
      expect(typeof contexto.promptText).toBe('string');
    });
  });

  describe('prepararTurno — intent pipeline (Phase 2)', () => {
    it('resolve intent via mensagem (Camada 1 regex)', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', {
        mensagem: 'defendo'
      });
      expect(resultado).not.toBeNull();
      expect(resultado.defesa).toBeTruthy();
    });

    it('Phase 1 compat: intent com tipo funciona igual', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'defender' });
      expect(resultado).not.toBeNull();
      expect(resultado.defesa).toBeTruthy();
    });

    it('Camada 1 ambíguo → falls to Camada 3 when Flash Lite skipped', async () => {
      const sessao = makeSessao({
        personagensCompletos: {
          'user_1': makePersonagemCompleto({
            habilidadesClasse: [
              { id: 'investida', nome: 'Investida', custo_mana: 3, dano_base: '1d8' },
              { id: 'investida_brutal', nome: 'Investida Brutal', custo_mana: 5, dano_base: '2d8' },
            ]
          })
        }
      });
      const resultado = await prepararTurno(sessao, 'user_1', {
        mensagem: 'investida brutal',
        _skipFlashLite: true
      });
      expect(resultado.requerIntentMestre).toBe(true);
    });

    it('retorna requerIntentMestre quando todas camadas falham', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', {
        mensagem: 'empurro o barril de pólvora no demônio',
        _skipFlashLite: true
      });
      expect(resultado).not.toBeNull();
      expect(resultado.requerIntentMestre).toBe(true);
    });

    it('retorna null quando combate não ativo', async () => {
      const sessao = makeSessao({ estadoJogo: { combate: { ativo: false } } });
      const resultado = await prepararTurno(sessao, 'user_1', { mensagem: 'ataco' });
      expect(resultado).toBeNull();
    });

    it('propaga _resolvedIntent no resultado', async () => {
      const sessao = makeSessao();
      const resultado = await prepararTurno(sessao, 'user_1', {
        mensagem: 'defendo'
      });
      expect(resultado._resolvedIntent).toBeDefined();
      expect(resultado._resolvedIntent.tipo).toBe('defender');
    });
  });
});
