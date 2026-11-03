/**
 * Socket Store - Conexao: connect, authenticate, disconnect, token
 */
import io from 'socket.io-client';
import type { SocketGetState, SocketSetState } from './types';

const WS_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';

type AuthData = {
  token?: string | null;
  userId?: number | string;
  username?: string;
  [key: string]: unknown;
};

export type SocketConnectionActions = {
  connect: (authData?: AuthData | null) => Promise<void>;
  authenticate: (authData: AuthData) => Promise<unknown>;
  connectToSocket: (authData?: AuthData | null) => Promise<void>;
  setSocketToken: (token: string | null) => void;
  clearSocketToken: () => void;
  disconnect: () => void;
  resetSocketState: () => void;
};

export const createConnectionActions = (set: SocketSetState, get: SocketGetState): SocketConnectionActions => ({
  connect: async (authData = null) => {
    const state = get();
    const { isConnected, socket, socketToken, configs, connectionOptions } = state;
    const validateToken = state.validateToken as (token: string) => boolean;
    const log = state.log as (event: string, data?: Record<string, unknown>, level?: string) => void;
    const setupInternalListeners = state.setupInternalListeners as () => void;

    return new Promise<void>((resolve, reject) => {
      try {
        const token = authData?.token || socketToken;

        log('Connection starting', { hasAuth: !!token });

        if (token && !validateToken(token)) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
            const expiryDate = payload.exp ? new Date(payload.exp * 1000) : null;
            const now = new Date();

            log('Invalid or expired token provided', {
              expiresAt: expiryDate?.toLocaleString(),
              currentTime: now.toLocaleString(),
              isExpired: expiryDate ? expiryDate <= now : true,
              suggestion: 'Token deve ser renovado antes da conexao WebSocket',
            }, 'error');
          } catch {
            log('Invalid token format', {}, 'error');
          }

          return reject(new Error('Token invalido ou expirado. Por favor, tente novamente.'));
        }

        if (isConnected && socket) {
          log('Already connected', { success: true });
          return resolve();
        }

        set({
          isConnecting: true,
          error: null,
          connectionStartTime: Date.now(),
        });

        const options = {
          ...connectionOptions,
          auth: token ? { token } : (authData || {}),
        };

        const newSocket = io(WS_BASE_URL, options);
        set({ socket: newSocket });

        setupInternalListeners();

        const timeout = setTimeout(() => {
          log('Connection timeout', {}, 'error');
          reject(new Error(`Timeout de conexao apos ${configs.CONNECTION_TIMEOUT}ms`));
        }, configs.CONNECTION_TIMEOUT);

        newSocket.once('connect', () => {
          clearTimeout(timeout);
          set({
            isConnected: true,
            isConnecting: false,
            lastConnectionTime: Date.now(),
          });
          const start = get().connectionStartTime || Date.now();
          log('Connected successfully', {
            socketId: newSocket.id,
            duration: Date.now() - start,
            success: true,
          });
          resolve();
        });

        newSocket.once('connect_error', (error: Error) => {
          clearTimeout(timeout);
          set({ isConnecting: false });
          log('Connection failed', { error: error.message }, 'error');
          reject(error);
        });

        newSocket.connect();

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ isConnecting: false });
        log('Connection exception', { error: message }, 'error');
        reject(error instanceof Error ? error : new Error(message));
      }
    });
  },

  authenticate: async (authData) => {
    const state = get();
    const { socket, isAuthenticated, configs } = state;
    const log = state.log as (event: string, data?: Record<string, unknown>, level?: string) => void;

    return new Promise<unknown>((resolve, reject) => {
      if (!socket || !socket.connected) {
        return reject(new Error('WebSocket nao conectado'));
      }

      if (isAuthenticated) {
        log('Already authenticated', { success: true });
        return resolve({ user: get().currentUser });
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout de autenticacao apos ${configs.AUTH_TIMEOUT}ms`));
      }, configs.AUTH_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('authenticated', onAuthenticated);
        socket.off('error', onGenericError);
      };

      const onAuthenticated = (data: unknown) => {
        cleanup();
        resolve(data);
      };

      const onGenericError = (error: unknown) => {
        cleanup();
        const message = (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string')
          ? (error as { message: string }).message
          : 'Erro ao autenticar no websocket';
        reject(new Error(message));
      };

      socket.once('authenticated', onAuthenticated);
      socket.once('error', onGenericError);
      socket.emit('authenticate', authData);
    });
  },

  connectToSocket: async (authData = null) => {
    const state = get();
    const { isConnected, isConnecting } = state;
    const connect = state.connect as (data?: AuthData | null) => Promise<void>;
    const authenticate = state.authenticate as (data: AuthData) => Promise<unknown>;

    if (isConnected || isConnecting) {
      return;
    }

    try {
      await connect(authData);

      if (authData?.token) {
        await authenticate(authData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('SocketStore: Erro na conexao automatica:', message);
      set({ error: message });
      throw error;
    }
  },

  setSocketToken: (token) => {
    set({ socketToken: token });
  },

  clearSocketToken: () => {
    set({ socketToken: null });
  },

  disconnect: () => {
    const { socket } = get();

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      inRoom: false,
      roomId: null,
      session: null,
      currentUser: null,
      userRole: null,
      socketToken: null,
      roomUsers: [],
      error: null,
    });
  },

  resetSocketState: () => {
    const disconnect = get().disconnect as () => void;
    disconnect();

    set({
      listeners: new Map(),
      connectionStartTime: null,
      lastConnectionTime: null,
      connectionAttempts: 0,
      rateLimitExceeded: false,
      rateLimitResetTime: null,
      lastMessageTime: null,
      aventuraIniciada: false,
    });
  },
});
