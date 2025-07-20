import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/WebSocketService.js';

/**
 * Hook para gerenciar conexão WebSocket de forma reativa
 * @param {Object} options - Opções de configuração
 * @returns {Object} Estado e métodos do WebSocket
 */
export const useWebSocket = (options = {}) => {
  const {
    autoConnect = false,
    authData = null,
    onConnect = null,
    onDisconnect = null,
    onError = null,
    onMessage = null
  } = options;

  // Estados
  const [isConnected, setIsConnected] = useState(webSocketService.connected);
  const [isAuthenticated, setIsAuthenticated] = useState(webSocketService.authenticated);
  const [currentUser, setCurrentUser] = useState(webSocketService.user);
  const [currentRoom, setCurrentRoom] = useState(webSocketService.room);
  const [currentSession, setCurrentSession] = useState(webSocketService.session);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Refs para callbacks
  const callbacksRef = useRef({ onConnect, onDisconnect, onError, onMessage });
  callbacksRef.current = { onConnect, onDisconnect, onError, onMessage };

  // Função para conectar
  const connect = useCallback(async (authOptions = null) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      await webSocketService.connect(authOptions || authData);
    } catch (err) {
      setError(err.message);
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, authData]);

  // Função para autenticar
  const authenticate = useCallback(async (authOptions) => {
    try {
      setError(null);
      await webSocketService.authenticate(authOptions);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para entrar em sala
  const joinRoom = useCallback(async (roomId, sessionId = null) => {
    try {
      setError(null);
      await webSocketService.joinRoom(roomId, sessionId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para sair da sala
  const leaveRoom = useCallback(async () => {
    try {
      await webSocketService.leaveRoom();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para iniciar sessão
  const startSession = useCallback(async (sessionData) => {
    try {
      setError(null);
      return await webSocketService.startSession(sessionData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para enviar mensagem
  const sendMessage = useCallback((messageData) => {
    try {
      webSocketService.sendMessage(messageData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para ação de jogador
  const playerAction = useCallback((actionData) => {
    try {
      webSocketService.playerAction(actionData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para desconectar
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Event listeners
  useEffect(() => {
    const updateStates = () => {
      setIsConnected(webSocketService.connected);
      setIsAuthenticated(webSocketService.authenticated);
      setCurrentUser(webSocketService.user);
      setCurrentRoom(webSocketService.room);
      setCurrentSession(webSocketService.session);
    };

    // Listeners de conexão
    const handleConnected = () => {
      updateStates();
      if (callbacksRef.current.onConnect) {
        callbacksRef.current.onConnect();
      }
    };

    const handleDisconnected = (data) => {
      updateStates();
      if (callbacksRef.current.onDisconnect) {
        callbacksRef.current.onDisconnect(data);
      }
    };

    const handleConnectionError = (data) => {
      setError(data.error?.message || 'Erro de conexão');
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(data.error);
      }
    };

    const handleAuthenticated = () => {
      updateStates();
    };

    const handleRoomJoined = () => {
      updateStates();
    };

    const handleRoomLeft = () => {
      updateStates();
    };

    const handleSessionStarted = () => {
      updateStates();
    };

    const handleSessionEnded = () => {
      updateStates();
    };

    const handleNewMessage = (data) => {
      if (callbacksRef.current.onMessage) {
        callbacksRef.current.onMessage(data);
      }
    };

    const handleRateLimitExceeded = (data) => {
      setError(`Rate limit excedido: ${data.message}`);
    };

    // Adicionar listeners
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('connection_error', handleConnectionError);
    webSocketService.on('authenticated', handleAuthenticated);
    webSocketService.on('room_joined', handleRoomJoined);
    webSocketService.on('room_left', handleRoomLeft);
    webSocketService.on('session_started', handleSessionStarted);
    webSocketService.on('session_ended', handleSessionEnded);
    webSocketService.on('new_message', handleNewMessage);
    webSocketService.on('rate_limit_exceeded', handleRateLimitExceeded);

    // Estado inicial
    updateStates();

    // Cleanup
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('connection_error', handleConnectionError);
      webSocketService.off('authenticated', handleAuthenticated);
      webSocketService.off('room_joined', handleRoomJoined);
      webSocketService.off('room_left', handleRoomLeft);
      webSocketService.off('session_started', handleSessionStarted);
      webSocketService.off('session_ended', handleSessionEnded);
      webSocketService.off('new_message', handleNewMessage);
      webSocketService.off('rate_limit_exceeded', handleRateLimitExceeded);
    };
  }, []);

  // Auto connect
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting, connect]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isConnected) {
        webSocketService.disconnect();
      }
    };
  }, []);

  return {
    // Estados
    isConnected,
    isAuthenticated,
    isConnecting,
    currentUser,
    currentRoom,
    currentSession,
    error,

    // Métodos
    connect,
    disconnect,
    authenticate,
    joinRoom,
    leaveRoom,
    startSession,
    sendMessage,
    playerAction,
    clearError,

    // Utilitários
    startTyping: webSocketService.startTyping.bind(webSocketService),
    stopTyping: webSocketService.stopTyping.bind(webSocketService),
    ping: webSocketService.ping.bind(webSocketService),

    // Event listeners
    on: webSocketService.on.bind(webSocketService),
    off: webSocketService.off.bind(webSocketService),
    once: webSocketService.once.bind(webSocketService)
  };
}; 