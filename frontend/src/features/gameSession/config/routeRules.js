import { PHASES } from './phaseConfig.js';

/**
 * Determina para qual fase redirecionar com base no estado atual.
 * Preserva a semantica exata de useJogoGuard.js:
 *   - historiaAtual obrigatorio para qualquer fase exceto selecao
 *   - personagem obrigatorio para lobby e active
 *   - salaAberta obrigatorio para active (usa salaAberta, nao inRoom)
 *   - so retrocede, nunca avanca automaticamente
 *
 * @param {string} currentPhaseId - 'character_select' | 'lobby' | 'active'
 * @param {object} state
 * @param {boolean} state.hasHistoria - Se historiaAtual esta carregada
 * @param {boolean} state.hasCharacter - Se personagemSelecionado existe
 * @param {boolean} state.isSalaAberta - Se salaAberta === true (gameStore)
 * @returns {string|null} routeSegment to redirect to, or null if current phase is valid
 */
export function resolvePhaseRedirect(
  currentPhaseId,
  { hasHistoria, hasCharacter, isSalaAberta },
) {
  const phase = Object.values(PHASES).find((p) => p.id === currentPhaseId);
  if (!phase) return PHASES.CHARACTER_SELECT.routeSegment;

  // Sem historia carregada e nao esta em selecao -> voltar para selecao
  if (!hasHistoria && currentPhaseId !== 'character_select') {
    return PHASES.CHARACTER_SELECT.routeSegment;
  }

  // Sem personagem e a fase exige -> voltar para selecao
  if (phase.requiresCharacter && !hasCharacter) {
    return PHASES.CHARACTER_SELECT.routeSegment;
  }

  // Active exige salaAberta -> voltar para lobby
  if (phase.requiresRoomJoin && !isSalaAberta) {
    return PHASES.LOBBY.routeSegment;
  }

  return null; // fase atual e valida
}
