export { PHASES, getPhaseByRoute, getNextPhase } from './config/phaseConfig.js';
export { resolvePhaseRedirect } from './config/routeRules.js';
export {
  getCurrentCharacter,
  getParticipants,
  getGameStatus,
  canStartGame,
  isInLobby,
  isGameActive,
  getHistoriaInfo,
  isRoomOwner,
} from './core/gameSessionSelectors.js';
