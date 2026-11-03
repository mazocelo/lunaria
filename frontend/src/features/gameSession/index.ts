export { PHASES, getPhaseByRoute, getNextPhase } from './config/phaseConfig';
export { resolvePhaseRedirect } from './config/routeRules';
export {
  getCurrentCharacter,
  getParticipants,
  getGameStatus,
  canStartGame,
  isInLobby,
  isGameActive,
  getHistoriaInfo,
  isRoomOwner,
} from './core/gameSessionSelectors';
