import { PHASES } from './phaseConfig';

interface ResolveState {
  hasHistoria: boolean;
  hasCharacter: boolean;
  isSalaAberta: boolean;
}

/**
 * Determina para qual fase redirecionar com base no estado atual.
 */
export function resolvePhaseRedirect(
  currentPhaseId: string,
  { hasHistoria, hasCharacter, isSalaAberta }: ResolveState,
): string | null {
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
