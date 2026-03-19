/**
 * GameEngine — facade over combat mechanics.
 *
 * Centralizes ALL mechanical resolution for combat.
 * Does NOT call AI, emit websocket events, or persist to Redis.
 *
 * Uses existing functions from combateHelper, testeHelper, etc.
 */
import { resolverMecanicaCombate } from './combateHelper.js';
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
