import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocketStore } from '../../../store/socket/index.js';

/**
 * Hook de socket para sessao de jogo.
 * Wrapper fino sobre socketStore com flows de conexao simplificados.
 *
 * Responsabilidades:
 * - Ler estado do socket (isConnected, isAuthenticated, inRoom, etc.)
 * - connectAndAuth(userData) — conectar + autenticar
 * - joinGameRoom(roomData) — entrar na sala
 * - onEvent / offEvent — subscribe/unsubscribe de eventos
 * - cleanup() — remover todas as subscriptions
 * - Tracking local de connecting/error
 */
export function useGameSessionSocket() {
  // === SOCKET STORE STATE ===
  const isConnected = useSocketStore(s => s.isConnected);
  const isStoreConnecting = useSocketStore(s => s.isConnecting);
  const isAuthenticated = useSocketStore(s => s.isAuthenticated);
  const isReconnecting = useSocketStore(s => s.isReconnecting);
  const storeError = useSocketStore(s => s.error);
  const inRoom = useSocketStore(s => s.inRoom);
  const roomUsers = useSocketStore(s => s.roomUsers);

  // === SOCKET STORE ACTIONS ===
  const socketConnect = useSocketStore(s => s.connect);
  const socketAuthenticate = useSocketStore(s => s.authenticate);
  const socketJoinRoom = useSocketStore(s => s.joinRoom);
  const socketOn = useSocketStore(s => s.on);
  const socketOff = useSocketStore(s => s.off);

  // === LOCAL STATE ===
  const [localError, setLocalError] = useState(null);
  const [localConnecting, setLocalConnecting] = useState(false);
  const subscriptionsRef = useRef([]);

  // ------------------------------------------------------------------
  // connectAndAuth — conectar ao WebSocket e autenticar em sequencia
  // ------------------------------------------------------------------
  const connectAndAuth = useCallback(async (userData) => {
    try {
      setLocalConnecting(true);
      setLocalError(null);

      // 1. Conectar
      await socketConnect();

      // 2. Obter token da store (gerado durante connect)
      const socketToken = useSocketStore.getState().socketToken;

      // 3. Autenticar
      await socketAuthenticate({
        token: socketToken,
        userId: String(userData.userId),
        username: userData.username,
        email: userData.email,
      });

      // 4. Aguardar confirmacao de autenticacao do backend
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Auth timeout')),
          5000
        );
        const check = () => {
          const state = useSocketStore.getState();
          if (state.isAuthenticated) {
            clearTimeout(timeout);
            resolve();
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });

      setLocalConnecting(false);
    } catch (err) {
      const message = err.message || 'Erro ao conectar e autenticar';
      setLocalError(message);
      setLocalConnecting(false);
      throw err;
    }
  }, [socketConnect, socketAuthenticate]);

  // ------------------------------------------------------------------
  // joinGameRoom — entrar na sala do jogo
  // ------------------------------------------------------------------
  const joinGameRoom = useCallback(async (roomData) => {
    try {
      setLocalError(null);
      await socketJoinRoom(roomData);
    } catch (err) {
      const message = err.message || 'Erro ao entrar na sala';
      setLocalError(message);
      throw err;
    }
  }, [socketJoinRoom]);

  // ------------------------------------------------------------------
  // onEvent — registrar listener e rastrear para cleanup
  // ------------------------------------------------------------------
  const onEvent = useCallback((eventName, handler) => {
    if (socketOn) {
      socketOn(eventName, handler);
      subscriptionsRef.current.push({ eventName, handler });
    }
  }, [socketOn]);

  // ------------------------------------------------------------------
  // offEvent — remover listener especifico
  // ------------------------------------------------------------------
  const offEvent = useCallback((eventName, handler) => {
    if (socketOff) {
      socketOff(eventName, handler);
      subscriptionsRef.current = subscriptionsRef.current.filter(
        sub => !(sub.eventName === eventName && sub.handler === handler)
      );
    }
  }, [socketOff]);

  // ------------------------------------------------------------------
  // cleanup — remover todas as subscriptions rastreadas
  // ------------------------------------------------------------------
  const cleanup = useCallback(() => {
    if (socketOff) {
      for (const sub of subscriptionsRef.current) {
        socketOff(sub.eventName, sub.handler);
      }
    }
    subscriptionsRef.current = [];
  }, [socketOff]);

  // ------------------------------------------------------------------
  // clearError — limpar erro local
  // ------------------------------------------------------------------
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  // Cleanup automatico no unmount
  useEffect(() => {
    return () => {
      // Usar socketOff diretamente da ref para evitar stale closure
      const currentSubs = subscriptionsRef.current;
      const off = useSocketStore.getState().off;
      if (off) {
        for (const sub of currentSubs) {
          off(sub.eventName, sub.handler);
        }
      }
      subscriptionsRef.current = [];
    };
  }, []);

  // ------------------------------------------------------------------
  // RETURN
  // ------------------------------------------------------------------
  return {
    // State (merged: store + local)
    isConnected,
    isConnecting: isStoreConnecting || localConnecting,
    isAuthenticated,
    isReconnecting,
    socketError: localError || storeError,
    inRoom,
    roomUsers,

    // Connection flows
    connectAndAuth,
    joinGameRoom,

    // Event subscription
    onEvent,
    offEvent,

    // Lifecycle
    cleanup,
    clearError,
  };
}

export default useGameSessionSocket;
