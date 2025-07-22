// ===== STORE EXPORTS =====
import { useGameStore, useGameSelectors, initializeGameStore } from './game/index.js';
import { useSocketStore, useSocketSelectors } from './socket/index.js';

// 🎮 Game Store - Estado da sessão de jogo
export { 
  useGameStore, 
  useGameSelectors,
  gameInitialStates,
  createGameActions,
  initializeGameStore
} from './game/index.js';

// 🌐 Socket Store - Estado da conexão WebSocket
export { 
  useSocketStore, 
  useSocketSelectors,
  socketInitialStates,
  createSocketActions
} from './socket/index.js';

// ===== STORE UTILITIES =====

/**
 * 🚀 Inicializa todas as stores
 * USO: Chame uma vez na inicialização da aplicação
 */
export const initializeAllStores = () => {
  console.log('🚀 Inicializando todas as stores...');
  
  // Inicializar Game Store (com hidratação do localStorage)
  initializeGameStore();
  
  // Socket Store não precisa de inicialização especial
  console.log('✅ Todas as stores inicializadas');
};

/**
 * 💾 Persiste estados críticos de todas as stores
 * USO: Chame quando quiser salvar estado atual
 */
export const persistirEstadoCritico = () => {
  console.log('💾 Persistindo estados críticos...');
  
  const { persistirEstadoCritico: persistirGame } = useGameStore.getState();
  persistirGame();
  
  // Socket Store geralmente não precisa persistir dados de conexão
  console.log('✅ Estados críticos persistidos');
};

/**
 * 🔄 Reset completo de todas as stores
 * Útil para logout ou reset completo da aplicação
 */
export const resetAllStores = () => {
  const { resetGameState } = useGameStore.getState();
  const { resetSocketState } = useSocketStore.getState();
  
  console.log('🔄 Resetando todas as stores...');
  resetGameState();
  resetSocketState();
  console.log('✅ Reset completo finalizado');
};

/**
 * 📊 Debug: Estado atual de todas as stores
 * Útil para desenvolvimento e debugging
 */
export const getFullState = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      game: useGameStore.getState(),
      socket: useSocketStore.getState()
    };
  }
  return null;
};

/**
 * 🎯 Selectors combinados mais usados
 */
export const useCombinedSelectors = {
  // Estado completo da sessão
  sessionState: () => {
    const gameState = useGameStore.getState();
    const socketState = useSocketStore.getState();
    
    return {
      etapa: gameState.etapaAtual,
      historia: gameState.historiaAtual,
      personagem: gameState.personagemSelecionado,
      participantes: gameState.participantes,
      sessaoId: gameState.sessaoId,
      salaAberta: gameState.salaAberta,
      jogoIniciado: gameState.jogoIniciado,
      
      socketConnected: socketState.isConnected,
      socketAuthenticated: socketState.isAuthenticated,
      inRoom: socketState.inRoom,
      roomId: socketState.roomId
    };
  },
  
  // Status geral da aplicação
  appStatus: () => {
    const gameState = useGameStore.getState();
    const socketState = useSocketStore.getState();
    
    return {
      ready: !!(gameState.historiaAtual && socketState.isConnected),
      loading: gameState.loading || socketState.isConnecting,
      error: gameState.error || socketState.error,
      canPlay: !!(
        gameState.historiaAtual && 
        gameState.personagemSelecionado && 
        socketState.isConnected && 
        socketState.isAuthenticated
      )
    };
  },
  
  // Status de prontidão completo
  readinessStatus: () => {
    const gameStatus = useGameSelectors.estadoProntidao();
    const socketStatus = useSocketSelectors.connectionStatus();
    
    return {
      ...gameStatus,
      socketStatus,
      fullyReady: gameStatus.prontoParaJogar && socketStatus === 'connected'
    };
  },
  
  // Estado de debugging (desenvolvimento)
  debugState: () => {
    if (process.env.NODE_ENV === 'development') {
      return {
        game: useGameStore.getState(),
        socket: useSocketStore.getState(),
        combined: {
          session: useCombinedSelectors.sessionState(),
          app: useCombinedSelectors.appStatus(),
          readiness: useCombinedSelectors.readinessStatus()
        }
      };
    }
    return null;
  }
}; 