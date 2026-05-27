import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocketStore } from '../../../store/socket/index';
import { apiClient } from '../../../services/ApiClient';

interface UserData {
  userId: number | string;
  username: string;
  email?: string;
}

interface SocketSubscription {
  eventName: string;
  handler: (...args: unknown[]) => void;
}

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
  const [localError, setLocalError] = useState<string | null>(null);
  const [localConnecting, setLocalConnecting] = useState(false);
  const subscriptionsRef = useRef<SocketSubscription[]>([]);

  const obterSocketTokenValido = useCallback(async (): Promise<string> => {
    try {
      const socketState = useSocketStore.getState();

      if (socketState.socketToken && socketState.validateToken(socketState.socketToken)) {
        return socketState.socketToken;
      }

      const response = await apiClient.post('/auth/renovar') as { data?: { socketToken?: string }; socketToken?: string } | null;
      const payload = (response as { data?: { socketToken?: string } } | null)?.data || response;
      const refreshedSocketToken = (payload as { socketToken?: string } | null)?.socketToken;

      if (!refreshedSocketToken) {
        throw new Error('Nao foi possivel renovar a autenticacao do socket');
      }

      socketState.setSocketToken(refreshedSocketToken);
      return refreshedSocketToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'Não autorizado') {
        throw new Error('Sessao expirada. Faca login novamente.');
      }

      throw error;
    }
  }, []);

  const aguardarAutenticacaoSocket = useCallback(() => new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Auth timeout')), 5000);
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
  }), []);

  // ------------------------------------------------------------------
  // connectAndAuth — conectar ao WebSocket e autenticar em sequencia
  // ------------------------------------------------------------------
  const connectAndAuth = useCallback(async (userData: UserData) => {
    try {
      setLocalConnecting(true);
      setLocalError(null);

      const socketToken = await obterSocketTokenValido();

      // 1. Conectar
      await socketConnect({ token: socketToken });

      // 3. Autenticar
      await socketAuthenticate({
        token: socketToken,
        userId: String(userData.userId),
        username: userData.username,
        email: userData.email,
      });

      await aguardarAutenticacaoSocket();

      setLocalConnecting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao conectar e autenticar';
      setLocalError(message);
      setLocalConnecting(false);
      throw err;
    }
  }, [obterSocketTokenValido, socketConnect, socketAuthenticate, aguardarAutenticacaoSocket]);

  // ------------------------------------------------------------------
  // joinGameRoom — entrar na sala do jogo
  // ------------------------------------------------------------------
  const joinGameRoom = useCallback(async (roomData: Parameters<typeof socketJoinRoom>[0]) => {
    try {
      setLocalError(null);
      await socketJoinRoom(roomData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na sala';
      setLocalError(message);
      throw err;
    }
  }, [socketJoinRoom]);

  // ------------------------------------------------------------------
  // onEvent — registrar listener e rastrear para cleanup
  // ------------------------------------------------------------------
  const onEvent = useCallback((eventName: string, handler: (...args: unknown[]) => void) => {
    if (socketOn) {
      socketOn(eventName, handler);
      subscriptionsRef.current.push({ eventName, handler });
    }
  }, [socketOn]);

  // ------------------------------------------------------------------
  // offEvent — remover listener especifico
  // ------------------------------------------------------------------
  const offEvent = useCallback((eventName: string, handler: (...args: unknown[]) => void) => {
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
