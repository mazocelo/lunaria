import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { socketInitialStates } from './states';
import { createSocketActions } from './actions';
import type { SocketGetState, SocketSetState } from './types';

/**
 * SOCKET STORE - Store principal da conexao WebSocket
 *
 * Combina os estados iniciais com as acoes usando o padrao moderno do Zustand.
 * Utiliza o middleware `combine` para separar estado das actions.
 *
 * O cast em `createSocketActions` ajusta `set`/`get` para o shape laxo do
 * `SocketGetState` (vide ./types.ts) — Zustand chama o creator passando o
 * `set`/`get` reais do store, mas o tipo padrao do combine assume apenas
 * o estado inicial, sem as actions encadeadas. As actions sao concretas,
 * so a tipagem precisa do "soltar" controlado para evitar circular type.
 */
export const useSocketStore = create(
  combine(
    socketInitialStates,
    ((set, get) => createSocketActions(set as SocketSetState, get as SocketGetState)),
  ),
);

export const useSocketSelectors = {
  connectionStatus: () => {
    const { isConnected, isConnecting, isReconnecting, inRoom } = useSocketStore.getState();
    if (!isConnected) return 'disconnected';
    if (isConnecting) return 'connecting';
    if (isReconnecting) return 'reconnecting';
    if (!inRoom) return 'connected';
    return 'ready';
  },

  connectionInfo: () => {
    const s = useSocketStore.getState();
    return {
      isConnected: s.isConnected,
      isAuthenticated: s.isAuthenticated,
      isReconnecting: s.isReconnecting,
      inRoom: s.inRoom,
      roomId: s.roomId,
      socketId: s.socket?.id || null,
    };
  },

  canSendMessage: () => {
    const { isConnected, inRoom, rateLimitExceeded } = useSocketStore.getState();
    return isConnected && inRoom && !rateLimitExceeded;
  },

  roomStatus: () => {
    const { inRoom, roomId, roomUsers } = useSocketStore.getState();
    return {
      inRoom,
      roomId,
      userCount: roomUsers.length,
      users: roomUsers,
    };
  },

  rateLimitStatus: () => {
    const { rateLimitExceeded, rateLimitResetTime } = useSocketStore.getState();
    return {
      exceeded: rateLimitExceeded,
      resetTime: rateLimitResetTime,
      canSend: !rateLimitExceeded,
    };
  },

  authStatus: () => {
    const { isAuthenticated, currentUser, userRole } = useSocketStore.getState();
    return {
      isAuthenticated,
      user: currentUser,
      role: userRole,
      isReady: isAuthenticated && currentUser,
    };
  },

  estadoCompleto: () => {
    if (import.meta.env.DEV) {
      return useSocketStore.getState();
    }
    return null;
  },
};

export default useSocketStore;
export { socketInitialStates } from './states';
export { createSocketActions } from './actions';
