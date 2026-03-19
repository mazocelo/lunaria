/**
 * GameEngine — facade over combat mechanics.
 *
 * Centralizes ALL mechanical resolution for combat.
 * Does NOT call AI, emit websocket events, or persist to Redis.
 *
 * Uses existing functions from combateHelper, testeHelper, etc.
 */
import { resolverMecanicaCombate, finalizarAcaoCombatePosTeste } from './combateHelper.js';
import { buildCombatPromptContext } from './combatPromptContext.js';
import logger from './logger.js';

const log = logger.child({ module: 'gameEngine' });

/**
 * Phase 1: Pre-resolve combat mechanics for a player's action.
 * If the action requires a dice roll (test), returns the test request.
 * If the action is immediate (defend), returns the full result.
 *
 * @param {Object} sessao - Full session state
 * @param {string} userId - Player who acted
 * @param {Object} intent - { tipo, habilidadeId?, magiaId?, alvoId?, ... }
 * @returns {import('./combat/combatRoundResult.js').CombatRoundResult|null}
 */
export function prepararTurno(sessao, userId, intent) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) {
    log.debug({ userId }, 'prepararTurno: combate não ativo');
    return null;
  }

  const personagem = _resolvePersonagem(sessao, userId);
  if (!personagem) {
    log.warn({ userId }, 'prepararTurno: personagem não encontrado');
    return null;
  }

  return resolverMecanicaCombate(combate, userId, sessao, personagem, intent);
}

/**
 * Phase 2: Resolve combat action AFTER player rolls dice.
 * Wraps finalizarAcaoCombatePosTeste.
 *
 * @param {Object} sessao - Full session state
 * @param {Object} acaoPendente - Pending combat action (from sessao.estadoJogo.acaoPendenteCombate)
 * @param {Object} resultadoTeste - Test result from testeHelper.resolverTeste()
 * @returns {import('./combat/combatRoundResult.js').CombatRoundResult|null}
 */
export function resolverTurno(sessao, acaoPendente, resultadoTeste) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) {
    log.debug('resolverTurno: combate não ativo');
    return null;
  }
  if (!acaoPendente) {
    log.warn('resolverTurno: acaoPendente é null');
    return null;
  }

  return finalizarAcaoCombatePosTeste(sessao, acaoPendente, resultadoTeste);
}

/**
 * Build AI prompt context from mechanical results.
 *
 * @param {Object} sessao - Session state
 * @param {string} userId - Player who acted
 * @param {Object|null} resultado - CombatRoundResult from prepararTurno/resolverTurno
 * @param {Object} [options]
 * @param {string} [options.turnStateText] - Pre-computed turn state text (HP, mana, status)
 * @returns {{ promptText: string, mechanicalSummary: string, requiresTest: boolean }}
 */
export function formatarContexto(sessao, userId, resultado, options = {}) {
  if (!resultado) {
    return { promptText: '', mechanicalSummary: '', requiresTest: false };
  }

  const combate = sessao?.estadoJogo?.combate || null;
  const personagem = _resolvePersonagem(sessao, userId);

  return buildCombatPromptContext({
    combate,
    userId,
    personagem,
    turnStateText: options.turnStateText || '',
    resultadoMecanico: resultado,
    pendingTest: Boolean(resultado.requerTeste)
  });
}

/**
 * Resolve personagem from sessao.personagensCompletos using multiple ID strategies.
 * @private
 */
function _resolvePersonagem(sessao, userId) {
  const completos = sessao?.personagensCompletos || {};

  // Try direct userId match
  if (completos[userId]) return completos[userId];

  // Try personagemId from jogadores map
  const jogadorInfo = sessao?.jogadores?.[userId];
  const personagemId = jogadorInfo?.personagemId || jogadorInfo?.personagem_id;
  if (personagemId && completos[String(personagemId)]) {
    return completos[String(personagemId)];
  }

  // Try combat jogadores
  const combatJogador = sessao?.estadoJogo?.combate?.jogadores?.[userId];
  const combatPcId = combatJogador?.personagemId;
  if (combatPcId && completos[String(combatPcId)]) {
    return completos[String(combatPcId)];
  }

  return null;
}

export { _resolvePersonagem as resolvePersonagem };
