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
    return useSocketStore.getState().getConnectionStatus();
  },
  
  // Informações completas da conexão
  connectionInfo: () => {
    return useSocketStore.getState().getConnectionInfo();
  },
  
  // Pode enviar mensagem
  canSendMessage: () => {
    return useSocketStore.getState().canSendMessage();
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