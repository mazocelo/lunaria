export const PHASES = {
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

export const getPhaseByRoute = (segment) =>
  Object.values(PHASES).find((p) => p.routeSegment === segment) || null;

export const getNextPhase = (currentId) => {
  const current = Object.values(PHASES).find((p) => p.id === currentId);
  return current?.nextPhase ? PHASES[current.nextPhase] : null;
};
