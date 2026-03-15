import { PHASES } from './phaseConfig.js';

/**
 * Determina para qual fase redirecionar com base no estado atual.
 * @param {string} currentPhaseId - ID da fase atual (e.g. 'character_select', 'lobby', 'active')
 * @param {object} state - Estado atual da sessao
 * @param {boolean} state.hasCharacter - Se o jogador ja selecionou personagem
 * @param {boolean} state.isRoomJoined - Se o jogador esta na sala
 * @param {boolean} state.isGameStarted - Se o jogo ja foi iniciado
 * @returns {string|null} routeSegment to redirect to, or null if current phase is valid
 */
export function resolvePhaseRedirect(
  currentPhaseId,
  { hasCharacter, isRoomJoined, isGameStarted },
) {
  const phase = Object.values(PHASES).find((p) => p.id === currentPhaseId);
  if (!phase) return PHASES.CHARACTER_SELECT.routeSegment;

  // Se a fase exige personagem e nao tem -> voltar para selecao
  if (phase.requiresCharacter && !hasCharacter) {
    return PHASES.CHARACTER_SELECT.routeSegment;
  }

  // Se a fase exige estar na sala e nao esta -> voltar para lobby
  if (phase.requiresRoomJoin && !isRoomJoined) {
    return PHASES.LOBBY.routeSegment;
  }

  // Se o jogo ja iniciou e esta em fase anterior -> avancar
  if (isGameStarted && currentPhaseId !== 'active') {
    return PHASES.ACTIVE.routeSegment;
  }

  return null; // fase atual e valida
}
