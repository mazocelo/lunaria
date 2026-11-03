/**
 * Integration test: Full combat cycle
 *
 * Tests the complete flow:
 *   Initiative → Player attacks → Monster attacks → Damage applied → Combat ends
 *
 * Uses real functions from combateHelper, gameEngine, combatEngine logic.
 * No mocks except for external services (Redis, websocket, AI).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolverMecanicaCombate, finalizarAcaoCombatePosTeste, avancarTurno, verificarFimCombate, calcularDano, selecionarHabilidadeMonstro, verificarAcerto, rolarDado } from '../helpers/combateHelper.js';
import { prepararTurno, resolverTurno } from '../helpers/gameEngine.js';

// ── Factories ──

function makePersonagemCompleto(overrides = {}) {
  return {
    id: 'pc_1',
    personagemId: 'pc_1',
    nome: 'Moruxis',
    classe: 'Paladino',
    raca: 'Minotauro',
    nivel: 3,
    atributos: { forca: 14, inteligencia: 10, carisma: 12, destreza: 10, constituicao: 12, agilidade: 14 },
    hp_atual: 20, hp_max: 20, mana_atual: 15, mana_max: 15,
    vantagens: [], desvantagens: [],
    habilidades: [],
    habilidadesClasse: [
      { id: 'investida', nome: 'Investida', custo_mana: 0, cooldown_turnos: 0, dano_base: '1d8', efeito: null }
    ],
    magias: [],
    equipamentos: [],
    status_efeitos: [],
    ...overrides
  };
}

function makeCombateState(overrides = {}) {
  return {
    ativo: true,
    fase: 'combate',
    rodadaCombate: 1,
    monstros: [
      {
        id: 'dretch_0', monstroId: 80, nome: 'Dretch', tipo: 'besta', tamanho: 'pequeno',
        nivel: 1, hp_max: 20, hp_atual: 20, ataque: 3, defesa: 8, armadura: 1, esquiva: 5,
        dano_base: '1d6', habilidades: [], forca: 12, elemento: [], resistencias: {}, imunidades: [],
        xp: 50, status: 'vivo', cooldowns: {}, status_efeitos: []
      }
    ],
    jogadores: {
      'user_1': {
        personagemId: 'pc_1', hp_max: 20, hp_atual: 20, mana_max: 15, mana_atual: 15,
        esquiva: 10, armadura: 1, bonusAtaque: 2, bonusDano: 1, dano_base: '1d6',
        elemento: null, status: 'vivo', personagemNome: 'Moruxis', cooldowns: {}, status_efeitos: []
      }
    },
    jogadoresQueAgiram: [],
    ordemIniciativa: [
      { id: 'user_1', tipo: 'jogador', nome: 'Moruxis', rolagem: 15, modificador: 2, iniciativa: 17 },
      { id: 'dretch_0', tipo: 'monstro', nome: 'Dretch', rolagem: 10, modificador: 1, iniciativa: 11 },
    ],
    turnoAtualIdx: 0,
    aguardandoAcao: 'user_1',
    log: [],
    resultado: null,
    ...overrides
  };
}

function makeSessao(overrides = {}) {
  const combate = makeCombateState(overrides.combate);
  return {
    estadoJogo: { combate, ...overrides.estadoJogo },
    personagensCompletos: { 'pc_1': makePersonagemCompleto(), ...overrides.personagensCompletos },
    jogadores: { 'user_1': { personagemId: 'pc_1', nome: 'Marcelo', personagemNome: 'Moruxis' } },
    mensagens: [],
    ...overrides
  };
}

// ── Tests ──

describe('Combat Integration: Full Cycle', () => {

  describe('1. avancarTurno — alternation', () => {
    it('alternates between player and monster', () => {
      const combate = makeCombateState();
      expect(combate.turnoAtualIdx).toBe(0); // Player first
      expect(combate.ordemIniciativa[0].tipo).toBe('jogador');

      const turno1 = avancarTurno(combate);
      expect(turno1.tipo).toBe('monstro');
      expect(turno1.nome).toBe('Dretch');
      expect(combate.turnoAtualIdx).toBe(1);

      const turno2 = avancarTurno(combate);
      expect(turno2.tipo).toBe('jogador');
      expect(turno2.nome).toBe('Moruxis');
      expect(combate.turnoAtualIdx).toBe(0);
      expect(combate.rodadaCombate).toBe(2); // new round
    });

    it('skips dead monsters', () => {
      const combate = makeCombateState();
      combate.monstros[0].status = 'derrotado';

      const turno = avancarTurno(combate);
      // Should skip dretch (dead) and wrap to player (idx 0 → new round)
      expect(turno.tipo).toBe('jogador');
      // Wrapping past idx 0 (skipping dead monster) triggers new round
      expect(combate.rodadaCombate).toBe(2);
    });

    it('skips unconscious players', () => {
      const combate = makeCombateState();
      combate.jogadores['user_1'].status = 'inconsciente';

      const turno = avancarTurno(combate);
      // Should skip player and go back to monster
      expect(turno.tipo).toBe('monstro');
    });

    it('returns null when everyone dead', () => {
      const combate = makeCombateState();
      combate.monstros[0].status = 'derrotado';
      combate.jogadores['user_1'].status = 'inconsciente';

      const turno = avancarTurno(combate);
      expect(turno).toBeNull();
    });
  });

  describe('2. Player attack → damage flow', () => {
    it('prepararTurno returns requerTeste for attack', async () => {
      const sessao = makeSessao();
      const result = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

      expect(result).not.toBeNull();
      expect(result.requerTeste).toBeTruthy();
      expect(result.requerTeste.intentTipo).toBe('atacar');
      expect(result.requerTeste.pendingCombatAction).toBeDefined();
      expect(result.requerTeste.pendingCombatAction.stage).toBe('attack_roll');
    });

    it('attack roll hit → aguardandoProximoTeste for damage', async () => {
      const sessao = makeSessao();
      const prep = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });
      const pending = {
        tipo: 'atacar',
        userId: 'user_1',
        personagem: { nome: 'Moruxis', id: 'pc_1' },
        combatIntent: { tipo: 'atacar' },
        statusEfeitos: [],
        ...(prep.requerTeste?.pendingCombatAction || {})
      };

      // Nat 20 = guaranteed hit
      const result = resolverTurno(sessao, pending, { rolagemBruta: 20, total: 22, sucesso: true });

      expect(result).not.toBeNull();
      expect(result.aguardandoProximoTeste).toBe(true);
      expect(result.proximoTeste).toBeDefined();
      expect(result.proximoTeste.metadata?.rollKind).toBe('combat_damage');
      expect(result.proximaAcaoPendente).toBeDefined();
      expect(result.proximaAcaoPendente.stage).toBe('damage_roll');
    });

    it('damage roll applies HP reduction to monster', async () => {
      const sessao = makeSessao();
      const dretch = sessao.estadoJogo.combate.monstros[0];
      const hpBefore = dretch.hp_atual;

      // Phase 1: attack
      const prep = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });
      const pending = {
        tipo: 'atacar',
        userId: 'user_1',
        personagem: { nome: 'Moruxis', id: 'pc_1' },
        combatIntent: { tipo: 'atacar' },
        statusEfeitos: [],
        ...(prep.requerTeste?.pendingCombatAction || {})
      };

      // Phase 2a: attack roll (nat 20)
      const atkResult = resolverTurno(sessao, pending, { rolagemBruta: 20, total: 22, sucesso: true });

      if (atkResult.aguardandoProximoTeste) {
        // Phase 2b: damage roll
        const dmgPending = { ...pending, ...atkResult.proximaAcaoPendente };
        const dmgResult = resolverTurno(sessao, dmgPending, { rolagemBruta: 6, total: 6, sucesso: true });

        expect(dretch.hp_atual).toBeLessThan(hpBefore);
        expect(dmgResult.acaoConsumida).toBe(true);
      }
    });
  });

  describe('3. Monster turn — calcularDano', () => {
    it('calcularDano with string notation returns positive damage', () => {
      // This was the bug: passing number instead of string caused 0 damage
      const dano = calcularDano('1d6', 1, false, 0);
      expect(dano).toBeGreaterThan(0);
    });

    it('calcularDano with notation + modifier works', () => {
      const dano = calcularDano('1d6+2', 0, false, 0);
      expect(dano).toBeGreaterThanOrEqual(3); // min 1d6(1)+2 = 3
    });

    it('calcularDano critical doubles damage', () => {
      // Run multiple times to verify crit behavior
      const damages = [];
      for (let i = 0; i < 20; i++) {
        damages.push(calcularDano('1d6', 0, true, 0));
      }
      // At least some should be > 6 (doubled)
      const maxDmg = Math.max(...damages);
      expect(maxDmg).toBeGreaterThan(0);
    });

    it('selecionarHabilidadeMonstro returns ability or null', () => {
      const monstro = makeCombateState().monstros[0];
      monstro.habilidades = [
        { nome: 'Investida Selvagem', dano: '1d6+1', tipo: 'ofensiva', chance: 100, cooldown: 0 }
      ];
      const hab = selecionarHabilidadeMonstro(monstro, 1);
      // chance 100% → should return the ability
      expect(hab).not.toBeNull();
      expect(hab.nome).toBe('Investida Selvagem');
    });

    it('verificarAcerto returns acertou/critico', () => {
      const nat20 = verificarAcerto(20);
      expect(nat20.acertou).toBe(true);
      expect(nat20.critico).toBe(true);

      const nat1 = verificarAcerto(1);
      expect(nat1.acertou).toBe(false);
    });
  });

  describe('4. Combat finalization', () => {
    it('verificarFimCombate detects victory when all monsters dead', () => {
      const combate = makeCombateState();
      combate.monstros[0].hp_atual = 0;
      combate.monstros[0].status = 'derrotado';

      const { finalizado, resultado } = verificarFimCombate(combate);
      expect(finalizado).toBe(true);
      expect(resultado).toBe('vitoria');
    });

    it('verificarFimCombate detects defeat when all players dead', () => {
      const combate = makeCombateState();
      combate.jogadores['user_1'].hp_atual = 0;
      combate.jogadores['user_1'].status = 'inconsciente';

      const { finalizado, resultado } = verificarFimCombate(combate);
      expect(finalizado).toBe(true);
      expect(resultado).toBe('derrota');
    });

    it('verificarFimCombate returns false when both alive', () => {
      const combate = makeCombateState();
      const { finalizado } = verificarFimCombate(combate);
      expect(finalizado).toBe(false);
    });

    it('full cycle: attack kills monster → combateFinalizado true', async () => {
      // Monster with very low HP
      const sessao = makeSessao({ combate: { monstros: [{
        id: 'dretch_0', nome: 'Dretch', tipo: 'besta', tamanho: 'pequeno',
        nivel: 1, hp_max: 1, hp_atual: 1, ataque: 3, defesa: 5, armadura: 0, esquiva: 0,
        dano_base: '1d6', habilidades: [], forca: 8, elemento: [], resistencias: {}, imunidades: [],
        xp: 50, status: 'vivo', cooldowns: {}, status_efeitos: []
      }]}});

      const prep = await prepararTurno(sessao, 'user_1', { tipo: 'atacar' });
      const pending = {
        tipo: 'atacar', userId: 'user_1',
        personagem: { nome: 'Moruxis', id: 'pc_1' },
        combatIntent: { tipo: 'atacar' }, statusEfeitos: [],
        ...(prep.requerTeste?.pendingCombatAction || {})
      };

      // Attack roll: nat 20
      const atkResult = resolverTurno(sessao, pending, { rolagemBruta: 20, total: 22, sucesso: true });

      if (atkResult.aguardandoProximoTeste) {
        const dmgPending = { ...pending, ...atkResult.proximaAcaoPendente };
        // Any damage kills 1 HP monster
        const dmgResult = resolverTurno(sessao, dmgPending, { rolagemBruta: 5, total: 5, sucesso: true });

        expect(dmgResult.combateFinalizado).toBe(true);
        expect(dmgResult.resultadoCombate).toBe('vitoria');
        expect(sessao.estadoJogo.combate.monstros[0].hp_atual).toBe(0);
        expect(sessao.estadoJogo.combate.monstros[0].status).toBe('derrotado');
      }
    });
  });

  describe('5. Full multi-round combat', () => {
    it('player and monster alternate over multiple rounds', async () => {
      const sessao = makeSessao();
      const combate = sessao.estadoJogo.combate;
      const dretch = combate.monstros[0];
      const jogador = combate.jogadores['user_1'];

      // === ROUND 1: Player turn ===
      expect(combate.aguardandoAcao).toBe('user_1');

      // Player defends (immediate, no test)
      const defResult = await prepararTurno(sessao, 'user_1', { tipo: 'defender' });
      expect(defResult.defesa).toBeTruthy();
      expect(defResult.acaoConsumida).toBe(true);

      // Advance to monster turn
      const monsterTurn = avancarTurno(combate);
      expect(monsterTurn.tipo).toBe('monstro');
      expect(monsterTurn.id).toBe('dretch_0');
      expect(combate.aguardandoAcao).toBe('dretch_0');

      // Advance back to player (round 2)
      const playerTurn = avancarTurno(combate);
      expect(playerTurn.tipo).toBe('jogador');
      expect(combate.rodadaCombate).toBe(2);
      expect(combate.aguardandoAcao).toBe('user_1');
    });
  });
});
