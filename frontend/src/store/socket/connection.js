/**
 * Socket Store - Conexão: connect, authenticate, monitor, disconnect, token
 */
import io from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';

export const createConnectionActions = (set, get) => ({
  // ===== MONITOR DE CONEXÃO =====
  startConnectionMonitor: () => {
    const { configs } = get();

    const monitor = setInterval(() => {
      const { socket, isConnected } = get();
      if (socket && isConnected) {
        socket.emit('ping');
        set({ lastPingTime: Date.now() });
      }
    }, configs.MONITOR_INTERVAL);

    set({ connectionMonitor: monitor });
  },

  stopConnectionMonitor: () => {
    const { connectionMonitor } = get();
    if (connectionMonitor) {
      clearInterval(connectionMonitor);
      set({ connectionMonitor: null });
    }
  },

  // ===== CONEXÃO PRINCIPAL =====
  connect: async (authData = null) => {
    const { isConnected, isConnecting, socket, socketToken, validateToken, log, setupInternalListeners, startConnectionMonitor, configs, connectionOptions } = get();

    return new Promise((resolve, reject) => {
      try {
        const token = authData?.token || socketToken;

        log('Connection starting', { hasAuth: !!token });

        if (token && !validateToken(token)) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryDate = new Date(payload.exp * 1000);
            const now = new Date();

            log('Invalid or expired token provided', {
              expiresAt: expiryDate.toLocaleString(),
              currentTime: now.toLocaleString(),
              isExpired: expiryDate <= now,
              suggestion: 'Token deve ser renovado antes da conexão WebSocket'
            }, 'error');
          } catch (e) {
            log('Invalid token format', {}, 'error');
          }

          return reject(new Error('Token inválido ou expirado. Por favor, tente novamente.'));
        }

        if (isConnected && socket) {
          log('Already connected', { success: true });
          return resolve();
        }

        set({
          isConnecting: true,
          error: null,
          connectionStartTime: Date.now()
        });

        const options = {
          ...connectionOptions,
          auth: token ? { token } : (authData || {})
        };

        const newSocket = io(WS_BASE_URL, options);
        set({ socket: newSocket });

        setupInternalListeners();

        const timeout = setTimeout(() => {
          log('Connection timeout', {}, 'error');
          reject(new Error(`Timeout de conexão após ${configs.CONNECTION_TIMEOUT}ms`));
        }, configs.CONNECTION_TIMEOUT);

        newSocket.once('connect', () => {
          clearTimeout(timeout);
          set({
            isConnected: true,
            isConnecting: false,
            lastConnectionTime: Date.now()
          });
          log('Connected successfully', {
            socketId: newSocket.id,
            duration: Date.now() - get().connectionStartTime,
            success: true
          });
          startConnectionMonitor();
          resolve();
        });

        newSocket.once('connect_error', (error) => {
          clearTimeout(timeout);
          set({ isConnecting: false });
          log('Connection failed', { error: error.message }, 'error');
          reject(error);
        });

        newSocket.connect();

      } catch (error) {
        set({ isConnecting: false });
        log('Connection exception', { error: error.message }, 'error');
        reject(error);
      }
    });
  },

  // ===== AUTENTICAÇÃO =====
  authenticate: async (authData) => {
    const { socket, isAuthenticated, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !socket.connected) {
        return reject(new Error('WebSocket não conectado'));
      }

      if (isAuthenticated) {
        log('Already authenticated', { success: true });
        return resolve({ user: get().currentUser });
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout de autenticação após ${configs.AUTH_TIMEOUT}ms`));
      }, configs.AUTH_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('authenticated', onAuthenticated);
        socket.off('authentication_error', onAuthError);
      };

      const onAuthenticated = (data) => {
        cleanup();
        resolve(data);
      };

      const onAuthError = (error) => {
        cleanup();
        reject(new Error(error.message));
      };

      socket.once('authenticated', onAuthenticated);
      socket.once('authentication_error', onAuthError);
      socket.emit('authenticate', authData);
    });
  },

  // ===== CONEXÃO AUTOMÁTICA =====
  connectToSocket: async (authData = null) => {
    const { isConnected, isConnecting, connect, authenticate } = get();

    if (isConnected || isConnecting) {
      return;
    }

    try {
      await connect(authData);

      if (authData?.token) {
        await authenticate(authData);
      }

    } catch (error) {
      console.error('❌ SocketStore: Erro na conexão automática:', error.message);
      set({ error: error.message });
      throw error;
    }
  },

  // ===== GERENCIAMENTO DE SOCKET TOKEN =====
  setSocketToken: (token) => {
    set({ socketToken: token });
  },

  clearSocketToken: () => {
    set({ socketToken: null });
  },

  // ===== DISCONNECT E CLEANUP =====
  disconnect: () => {
    const { socket, stopConnectionMonitor } = get();

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    stopConnectionMonitor();

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
      error: null
    });
  },

  resetSocketState: () => {
    const { disconnect } = get();
    disconnect();

    set({
      listeners: new Map(),
      connectionStartTime: null,
      connectionMonitor: null,
      lastConnectionTime: null,
      connectionAttempts: 0,
      lastPingTime: null,
      latency: 0,
      isTyping: false,
      typingTimeout: null,
      rateLimitExceeded: false,
      rateLimitResetTime: null,
      lastMessageTime: null,
      aventuraIniciada: false
    });
  }
});
