/**
 * Selectors puros para estado de sessao de jogo.
 * Recebem state slices, retornam dados derivados.
 */

interface GameStoreSlice {
  personagemSelecionado?: unknown;
  participantes?: unknown[];
  isDonoSala?: boolean;
  historiaAtual?: unknown;
  [key: string]: unknown;
}

interface SocketStoreSlice {
  isConnected?: boolean;
  isAuthenticated?: boolean;
  inRoom?: boolean;
  aventuraIniciada?: boolean;
  statusJogo?: string;
  faseJogo?: string;
  [key: string]: unknown;
}

export const getCurrentCharacter = (gameStore: GameStoreSlice) =>
  gameStore.personagemSelecionado || null;

export const getParticipants = (gameStore: GameStoreSlice): unknown[] => gameStore.participantes || [];

export const getGameStatus = (socketStore: SocketStoreSlice) => ({
  isConnected: socketStore.isConnected,
  isAuthenticated: socketStore.isAuthenticated,
  inRoom: socketStore.inRoom,
  aventuraIniciada: socketStore.aventuraIniciada,
  statusJogo: socketStore.statusJogo,
  faseJogo: socketStore.faseJogo,
});

export const canStartGame = (gameStore: GameStoreSlice, socketStore: SocketStoreSlice): boolean => {
  const participantes = getParticipants(gameStore);
  const isOwner = gameStore.isDonoSala;
  const isConnected = socketStore.isConnected;
  return Boolean(isOwner && isConnected && participantes.length > 0);
};

export const isInLobby = (socketStore: SocketStoreSlice): boolean =>
  Boolean(socketStore.inRoom && !socketStore.aventuraIniciada);

export const isGameActive = (socketStore: SocketStoreSlice): boolean =>
  Boolean(socketStore.inRoom && socketStore.aventuraIniciada);

export const getHistoriaInfo = (gameStore: GameStoreSlice) => gameStore.historiaAtual || null;

export const isRoomOwner = (gameStore: GameStoreSlice): boolean => !!gameStore.isDonoSala;
