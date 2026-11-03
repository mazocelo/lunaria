export interface PhaseDef {
  id: string;
  routeSegment: string;
  pageTitle: string;
  requiresCharacter: boolean;
  requiresRoomJoin: boolean;
  nextPhase: string | null;
}

export const PHASES: Record<'CHARACTER_SELECT' | 'LOBBY' | 'ACTIVE', PhaseDef> = {
  CHARACTER_SELECT: {
    id: 'character_select',
    routeSegment: 'selecao-personagem',
    pageTitle: 'Seleção de Personagem',
    requiresCharacter: false,
    requiresRoomJoin: false,
    nextPhase: 'LOBBY',
  },
  LOBBY: {
    id: 'lobby',
    routeSegment: 'sala-espera',
    pageTitle: 'Sala de Espera',
    requiresCharacter: true,
    requiresRoomJoin: false,
    nextPhase: 'ACTIVE',
  },
  ACTIVE: {
    id: 'active',
    routeSegment: 'jogo-ativo',
    pageTitle: 'Jogo Ativo',
    requiresCharacter: true,
    requiresRoomJoin: true,
    nextPhase: null,
  },
};

export const getPhaseByRoute = (segment: string): PhaseDef | null =>
  Object.values(PHASES).find((p) => p.routeSegment === segment) || null;

export const getNextPhase = (currentId: string): PhaseDef | null => {
  const current = Object.values(PHASES).find((p) => p.id === currentId);
  if (!current?.nextPhase) return null;
  return (PHASES as Record<string, PhaseDef>)[current.nextPhase] ?? null;
};
