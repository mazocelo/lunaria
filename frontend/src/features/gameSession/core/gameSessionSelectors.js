/**
 * Selectors puros para estado de sessao de jogo.
 * Recebem state slices, retornam dados derivados.
 */

export const getCurrentCharacter = (gameStore) =>
  gameStore.personagemSelecionado || null;

export const getParticipants = (gameStore) => gameStore.participantes || [];

export const getGameStatus = (socketStore) => ({
  isConnected: socketStore.isConnected,
  isAuthenticated: socketStore.isAuthenticated,
  inRoom: socketStore.inRoom,
  aventuraIniciada: socketStore.aventuraIniciada,
  statusJogo: socketStore.statusJogo,
  faseJogo: socketStore.faseJogo,
});

export const canStartGame = (gameStore, socketStore) => {
  const participantes = getParticipants(gameStore);
  const isOwner = gameStore.isDonoSala;
  const isConnected = socketStore.isConnected;
  return isOwner && isConnected && participantes.length > 0;
};

export const isInLobby = (socketStore) =>
  socketStore.inRoom && !socketStore.aventuraIniciada;

export const isGameActive = (socketStore) =>
  socketStore.inRoom && socketStore.aventuraIniciada;

export const getHistoriaInfo = (gameStore) => gameStore.historiaAtual || null;

export const isRoomOwner = (gameStore) => !!gameStore.isDonoSala;
