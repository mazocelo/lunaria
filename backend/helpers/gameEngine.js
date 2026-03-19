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
import { resolveCombatIntent } from '../websocket/utils/combatIntentResolver.js';
import logger from './logger.js';

const log = logger.child({ module: 'gameEngine' });

/**
 * Pre-resolve combat mechanics for a player's action.
 * Accepts either a resolved intent ({ tipo, ... }) or a message-based object ({ mensagem, ... }).
 * If the action requires a dice roll (test), returns the test request.
 * If the action is immediate (defend), returns the full result.
 *
 * @param {Object} sessao - Full session state
 * @param {string} userId - Player who acted
 * @param {Object} intentOrMessage - { tipo, ... } OR { mensagem, _skipFlashLite?, explicitIntent? }
 * @returns {Promise<import('./combat/combatRoundResult.js').CombatRoundResult|null>}
 */
export async function prepararTurno(sessao, userId, intentOrMessage) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) {
    log.debug({ userId }, 'prepararTurno: combate não ativo');
    return null;
  }
  if (combate.fase === 'iniciativa') {
    log.debug({ userId }, 'prepararTurno: aguardando iniciativa');
    return null;
  }

  // Phase 1 compat: intent already resolved
  if (intentOrMessage?.tipo) {
    return _prepararMecanica(sessao, userId, intentOrMessage);
  }

  // Phase 2: resolve intent from message
  const mensagem = intentOrMessage?.mensagem;
  if (!mensagem) return null;

  const explicitIntent = intentOrMessage?.explicitIntent || null;
  const skipFlashLite = intentOrMessage?._skipFlashLite || false;

  const intent = await _resolveIntentPipeline(sessao, userId, mensagem, explicitIntent, { skipFlashLite });
  if (!intent) {
    return { requerIntentMestre: true, mensagem };
  }

  const resultado = _prepararMecanica(sessao, userId, intent);
  if (resultado) resultado._resolvedIntent = intent;
  return resultado;
}

async function _resolveIntentPipeline(sessao, userId, mensagem, explicitIntent, options = {}) {
  const combate = sessao?.estadoJogo?.combate;
  const personagem = _resolvePersonagem(sessao, userId);

  // Camada 1: Regex + name match
  const resolution = resolveCombatIntent({
    mensagem,
    explicitIntent,
    personagemCompleto: personagem,
    combate,
    userId
  });

  if (resolution.intent && !resolution.ambiguous) {
    log.info({ camada: 1, tipo: resolution.intent.tipo, confidence: resolution.confidence }, 'intent resolved by regex');
    return resolution.intent;
  }

  // Camada 2: Flash Lite classifier
  if (!options.skipFlashLite) {
    try {
      const { classificarIntent } = await import('./intentClassifier.js');
      const llmResult = await classificarIntent(mensagem, personagem, combate, {
        candidates: resolution.candidates || []
      });
      if (llmResult?.intent) {
        log.info({ camada: 2, tipo: llmResult.intent.tipo }, 'intent resolved by flash_lite');
        return llmResult.intent;
      }
    } catch (err) {
      log.warn({ err: err.message }, 'intentClassifier failed (fail-open)');
    }
  }

  // Camada 3: delegate to Mestre AI
  log.info({ camada: 3, mensagem }, 'intent delegated to mestre');
  return null;
}

function _prepararMecanica(sessao, userId, intent) {
  const combate = sessao?.estadoJogo?.combate;
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
