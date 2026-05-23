import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { socketInitialStates } from './states.js';
import { createSocketActions } from './actions.js';

/**
 * 🌐 SOCKET STORE - Store principal da conexão WebSocket
 * 
 * Combina os estados iniciais com as ações usando o padrão moderno do Zustand.
 * Utiliza o middleware `combine` para separar estado das actions.
 */
export const useSocketStore = create(
  combine(
    socketInitialStates,
    createSocketActions
  )
);

// ===== COMPUTED STATES (SELECTORS) =====
export const useSocketSelectors = {
  // Status da conexão
  connectionStatus: () => {
    const { isConnected, isConnecting, isReconnecting, inRoom } = useSocketStore.getState();
    if (!isConnected) return 'disconnected';
    if (isConnecting) return 'connecting';
    if (isReconnecting) return 'reconnecting';
    if (!inRoom) return 'connected';
    return 'ready';
  },

  // Informações completas da conexão
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

  // Pode enviar mensagem
  canSendMessage: () => {
    const { isConnected, inRoom, rateLimitExceeded } = useSocketStore.getState();
    return isConnected && inRoom && !rateLimitExceeded;
  },
  
  // Status da sala
  roomStatus: () => {
    const { inRoom, roomId, roomUsers } = useSocketStore.getState();
    return {
      inRoom,
      roomId,
      userCount: roomUsers.length,
      users: roomUsers
    };
  },
  
  // Status de rate limiting
  rateLimitStatus: () => {
    const { rateLimitExceeded, rateLimitResetTime } = useSocketStore.getState();
    return {
      exceeded: rateLimitExceeded,
      resetTime: rateLimitResetTime,
      canSend: !rateLimitExceeded
    };
  },
  
  // Estado de autenticação
  authStatus: () => {
    const { isAuthenticated, currentUser, userRole } = useSocketStore.getState();
    return {
      isAuthenticated,
      user: currentUser,
      role: userRole,
      isReady: isAuthenticated && currentUser
    };
  },
  
  // Estado completo para debugging
  estadoCompleto: () => {
    if (process.env.NODE_ENV === 'development') {
      return useSocketStore.getState();
    }
    return null;
  }
};

// ===== EXPORTS =====
export default useSocketStore;
export { socketInitialStates } from './states.js';
export { createSocketActions } from './actions.js'; 