import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGameLoading } from './GameLoadingContext';
import { useSocketStore, useGameStore } from '../store';

/**
 * 🎮 Context Principal do Jogo - Orquestra todo o fluxo do jogo
 * 
 * Responsabilidades:
 * - Coordenar transições entre etapas
 * - Gerenciar estado global do jogo
 * - Integrar com stores Zustand
 * - Controlar fluxo de convites
 * - Sincronizar com WebSocket
 */

// 🎯 Estados possíveis do jogo
const GAME_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SELECTING_CHARACTER: 'selecting_character',
  WAITING_ROOM: 'waiting_room',
  GAME_ACTIVE: 'game_active',
  PAUSED: 'paused',
  FINISHED: 'finished',
  ERROR: 'error'
};

// 🎯 Ações do reducer
const GAME_ACTIONS = {
  SET_STATE: 'SET_STATE',
  SET_HISTORIA: 'SET_HISTORIA',
  SET_PERSONAGEM: 'SET_PERSONAGEM',
  SET_SALA_INFO: 'SET_SALA_INFO',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET: 'RESET',
  UPDATE_PARTICIPANTES: 'UPDATE_PARTICIPANTES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_LOADING: 'SET_LOADING'
};

// 🎯 Estado inicial
const initialState = {
  currentState: GAME_STATES.IDLE,
  historia: null,
  personagem: null,
  salaInfo: {
    id: null,
    isOwner: false,
    isOpen: false,
    participantes: []
  },
  gameData: {
    mensagens: [],
    statusPersonagem: null,
    configuracoes: {}
  },
  ui: {
    loading: false,
    error: null,
    fromInvite: false
  },
  metadata: {
    startedAt: null,
    lastActivity: null,
    version: '1.0.0'
  }
};

// 🎯 Reducer do jogo
const gameReducer = (state, action) => {
  switch (action.type) {
    case GAME_ACTIONS.SET_STATE:
      return {
        ...state,
        currentState: action.payload,
        metadata: {
          ...state.metadata,
          lastActivity: new Date().toISOString()
        }
      };

    case GAME_ACTIONS.SET_HISTORIA:
      return {
        ...state,
        historia: action.payload,
        metadata: {
          ...state.metadata,
          lastActivity: new Date().toISOString()
        }
      };

    case GAME_ACTIONS.SET_PERSONAGEM:
      return {
        ...state,
        personagem: action.payload,
        metadata: {
          ...state.metadata,
          lastActivity: new Date().toISOString()
        }
      };

    case GAME_ACTIONS.SET_SALA_INFO:
      return {
        ...state,
        salaInfo: {
          ...state.salaInfo,
          ...action.payload
        },
        metadata: {
          ...state.metadata,
          lastActivity: new Date().toISOString()
        }
      };

    case GAME_ACTIONS.UPDATE_PARTICIPANTES:
      return {
        ...state,
        salaInfo: {
          ...state.salaInfo,
          participantes: action.payload
        }
      };

    case GAME_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        gameData: {
          ...state.gameData,
          mensagens: [...state.gameData.mensagens, action.payload]
        }
      };

    case GAME_ACTIONS.SET_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload
        }
      };

    case GAME_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null
        }
      };

    case GAME_ACTIONS.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload
        }
      };

    case GAME_ACTIONS.RESET:
      return {
        ...initialState,
        metadata: {
          ...initialState.metadata,
          startedAt: new Date().toISOString()
        }
      };

    default:
      return state;
  }
};

// 🎮 Context
const GameContext = createContext({});

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve ser usado dentro de GameProvider');
  }
  return context;
};

// 🎮 Provider
export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const { 
    saveSelection, 
    getSelection, 
    startTransition, 
    completeTransition,
    setLoading: setLoadingContext
  } = useGameLoading();
  
  // Stores Zustand
  const gameStore = useGameStore();
  const socketStore = useSocketStore();

  // Reducer local
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    metadata: {
      ...initialState.metadata,
      startedAt: new Date().toISOString()
    }
  });

  // 🎯 AÇÕES PRINCIPAIS

  // Inicializar jogo
  const initializeGame = useCallback((historiaId, options = {}) => {
    
    dispatch({ type: GAME_ACTIONS.RESET });
    dispatch({ type: GAME_ACTIONS.SET_STATE, payload: GAME_STATES.LOADING });
    
    // Salvar configurações
    if (options.fromInvite) {
      dispatch({ 
        type: GAME_ACTIONS.SET_SALA_INFO, 
        payload: { fromInvite: true }
      });
      saveSelection('configuracoes', { 
        ...getSelection('configuracoes'), 
        fromInvite: true 
      });
    }

    // Inicializar stores
    gameStore.resetGameState();
    gameStore.mudarEtapa('selecao-personagem');
    
    setLoadingContext('jogo', true);
  }, [gameStore, saveSelection, getSelection, setLoadingContext]);

  // Selecionar personagem
  const selectCharacter = useCallback((personagem) => {
    
    dispatch({ type: GAME_ACTIONS.SET_PERSONAGEM, payload: personagem });
    dispatch({ type: GAME_ACTIONS.SET_STATE, payload: GAME_STATES.WAITING_ROOM });
    
    // Sincronizar com store
    gameStore.selecionarPersonagem(personagem);
    gameStore.mudarEtapa('sala-espera');
    
    // Salvar seleção
    saveSelection('personagemId', personagem.id);
    
    startTransition('character_selection', 'waiting_room');
  }, [gameStore, saveSelection, startTransition]);

  // Entrar na sala de espera
  const joinWaitingRoom = useCallback((salaData) => {
    
    dispatch({ 
      type: GAME_ACTIONS.SET_SALA_INFO, 
      payload: {
        id: salaData.id,
        isOwner: salaData.isOwner || false,
        isOpen: true
      }
    });
    
    // Conectar WebSocket se necessário
    if (!socketStore.isConnected && user?.token) {
      socketStore.connectToSocket({
        token: user.token,
        userId: user.id,
        username: user.nome || user.name
      });
    }
  }, [socketStore, user]);

  // Iniciar jogo ativo
  const startActiveGame = useCallback(() => {
    
    dispatch({ type: GAME_ACTIONS.SET_STATE, payload: GAME_STATES.GAME_ACTIVE });
    
    // Sincronizar com store
    gameStore.iniciarJogo();
    gameStore.abrirSala();
    gameStore.mudarEtapa('jogo-ativo');
    
    startTransition('waiting_room', 'active_game');
    
    setTimeout(() => {
      completeTransition();
    }, 1000);
  }, [gameStore, startTransition, completeTransition]);

  // Sair do jogo
  const leaveGame = useCallback(() => {
    
    dispatch({ type: GAME_ACTIONS.RESET });
    
    // Limpar stores
    gameStore.resetGameState();
    socketStore.resetSocketState();
    
    setLoadingContext('jogo', false);
  }, [gameStore, socketStore, setLoadingContext]);

  // Adicionar mensagem
  const addMessage = useCallback((mensagem) => {
    dispatch({ type: GAME_ACTIONS.ADD_MESSAGE, payload: mensagem });
    gameStore.adicionarMensagem(mensagem);
  }, [gameStore]);

  // Atualizar participantes
  const updateParticipants = useCallback((participantes) => {
    dispatch({ type: GAME_ACTIONS.UPDATE_PARTICIPANTES, payload: participantes });
  }, []);

  // Gerenciar erros
  const setError = useCallback((error) => {
    console.error('❌ GameContext: Erro:', error);
    dispatch({ type: GAME_ACTIONS.SET_ERROR, payload: error });
    dispatch({ type: GAME_ACTIONS.SET_STATE, payload: GAME_STATES.ERROR });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: GAME_ACTIONS.CLEAR_ERROR });
    if (state.currentState === GAME_STATES.ERROR) {
      dispatch({ type: GAME_ACTIONS.SET_STATE, payload: GAME_STATES.IDLE });
    }
  }, [state.currentState]);

  // 🎯 EFEITOS

  // Sincronizar com socket store
  useEffect(() => {
    if (socketStore.roomUsers) {
      updateParticipants(socketStore.roomUsers);
    }
  }, [socketStore.roomUsers, updateParticipants]);

  // Gerenciar erros do socket
  useEffect(() => {
    if (socketStore.error) {
      setError(`Erro de conexão: ${socketStore.error}`);
    }
  }, [socketStore.error, setError]);

  // 🎯 GETTERS COMPUTADOS
  const isGameActive = state.currentState === GAME_STATES.GAME_ACTIVE;
  const isInWaitingRoom = state.currentState === GAME_STATES.WAITING_ROOM;
  const isSelectingCharacter = state.currentState === GAME_STATES.SELECTING_CHARACTER;
  const hasError = state.currentState === GAME_STATES.ERROR;
  const isLoading = state.currentState === GAME_STATES.LOADING || state.ui.loading;

  const canStartGame = state.salaInfo.isOwner && 
                      state.personagem && 
                      state.salaInfo.participantes.length > 0;

  // 📦 VALOR DO CONTEXT
  const contextValue = {
    // Estado
    state,
    currentState: state.currentState,
    historia: state.historia,
    personagem: state.personagem,
    salaInfo: state.salaInfo,
    gameData: state.gameData,
    ui: state.ui,

    // Estados computados
    isGameActive,
    isInWaitingRoom,
    isSelectingCharacter,
    hasError,
    isLoading,
    canStartGame,

    // Ações principais
    initializeGame,
    selectCharacter,
    joinWaitingRoom,
    startActiveGame,
    leaveGame,
    addMessage,
    updateParticipants,

    // Ações de UI
    setError,
    clearError,

    // Referências para stores (caso necessário)
    gameStore,
    socketStore,

    // Constantes
    GAME_STATES,
    GAME_ACTIONS
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;
