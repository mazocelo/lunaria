/**
 * 🌐 SOCKET ACTIONS - Lógicas e ações da conexão WebSocket
 * 
 * Todas as funcionalidades do WebSocket integradas diretamente no Zustand store:
 * - Controle de conexão e socket.io
 * - Gerenciamento de autenticação
 * - Manipulação de room (conexão técnica)
 * - Sistema de listeners
 * - Métodos de envio (mensagens, ações, dados)
 * - Controle de rate limiting
 * - Sistema de logs
 * - Funções utilitárias
 */
import io from 'socket.io-client';

// Configuração de URLs
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.lunaria.app.br'
  : 'http://localhost:3001';

const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'wss://api.lunaria.app.br'
  : (window.location.protocol === 'https:'
      ? `https://${window.location.hostname}:3001`
      : `http://${window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname}:3001`
  );

export const createSocketActions = (set, get) => ({
  
  // ===== SISTEMA DE LOGS =====
  log: (event, data = {}, level = 'info') => {
    const { logLevel } = get();
    if (logLevel === 'error' && level !== 'error') return;
    
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : data.success ? '✅' : data.warning ? '⚠️' : '📡';
    
    if (level === 'error' || data.error) {
      console.error(`${prefix} ${timestamp} [Socket] ${event}`, data);
    } else if (logLevel === 'info') {
      console.log(`${prefix} ${timestamp} [Socket] ${event}`, {
        ...data,
        state: { connected: get().isConnected, authenticated: get().isAuthenticated }
      });
    }
  },

  // ===== SISTEMA DE LISTENERS =====
  // Usado por: Todas as views que precisam escutar eventos WebSocket
  on: (event, callback) => {
    const { socket, listeners } = get();
    
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);

    if (socket) {
      socket.on(event, callback);
    }
    
    set({ listeners: new Map(listeners) });
  },

  // Usado por: Todas as views para remover listeners ao desmontar
  off: (event, callback) => {
    const { socket, listeners } = get();
    
    if (listeners.has(event)) {
      listeners.get(event).delete(callback);
    }

    if (socket) {
      socket.off(event, callback);
    }
    
    set({ listeners: new Map(listeners) });
  },

  // Usado por: Views que precisam de listeners únicos
  once: (event, callback) => {
    const { socket } = get();
    if (socket) {
      socket.once(event, callback);
    }
  },

  // ===== VALIDAÇÃO DE TOKEN =====
  validateToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch (e) {
      return false;
    }
  },

  // ===== CONFIGURAÇÃO DE LISTENERS INTERNOS =====
  setupInternalListeners: () => {
    const { socket, log } = get();
    
    // Listeners de conexão
    socket.on('connect', () => {
      set({ isConnected: true, isConnecting: false });
      get().log('Connected successfully', { socketId: socket.id, success: true });
    });

    socket.on('disconnect', (reason) => {
      set({ 
        isConnected: false, 
        isAuthenticated: false,
        inRoom: false,
        roomId: null 
      });
      get().log('Disconnected', { reason });
    });

    socket.on('connect_error', (error) => {
      set({ 
        isConnected: false, 
        isConnecting: false,
        error: error.message 
      });
      get().log('Connection error', { error: error.message }, 'error');
    });

    // Listeners de autenticação
    socket.on('authenticated', (data) => {
      set({
        isAuthenticated: true,
        currentUser: data.user,
        userRole: data.user?.role,
        error: null
      });
      get().log('Authenticated', { userId: data.user?.id, role: data.user?.role, success: true });
    });

    socket.on('authentication_error', (error) => {
      set({
        isAuthenticated: false,
        currentUser: null,
        userRole: null,
        error: error.message
      });
      get().log('Authentication failed', { error: error.message }, 'error');
    });

    // Listeners de room
    socket.on('room_joined', (data) => {
      set({
        inRoom: true,
        roomId: data.roomId,
        session: data.session,
        roomUsers: data.users || [],
        error: null
      });
      get().log('Room joined', { roomId: data.roomId, users: data.users?.length, success: true });
    });

    socket.on('room_left', () => {
      set({
        inRoom: false,
        roomId: null,
        session: null,
        roomUsers: []
      });
      get().log('Room left', { success: true });
    });

    socket.on('room_users', (users) => {
      set({ roomUsers: users });
      get().log('Room users updated', { count: users.length });
    });

    socket.on('connection_error', (error) => {
      set({ error: error.message });
      get().log('Connection error', { error: error.message }, 'error');
    });
  },

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
  // Usado por: JogoView - quando entra na sala de espera
  connect: async (authData = null) => {
    const { isConnected, isConnecting, socket, validateToken, log, setupInternalListeners, startConnectionMonitor, configs, connectionOptions } = get();

    return new Promise((resolve, reject) => {
      try {
        log('Connection starting', { hasAuth: !!authData?.token });

        // Validação de token
        if (authData?.token && !validateToken(authData.token)) {
          log('Invalid token provided', {}, 'error');
          return reject(new Error('Token inválido'));
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
          auth: authData || {}
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
  // Usado por: JogoView - após conectar ao WebSocket
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

  // ===== GERENCIAMENTO DE SALAS =====
  // Usado por: EtapaSalaEspera - ao entrar na sala de espera
  joinRoom: async (roomData) => {
    const { socket, isConnected, isAuthenticated, configs, log, prepareRoomData } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      if (!isAuthenticated) {
        return reject(new Error('Usuário não autenticado'));
      }

      const sessionId = Date.now().toString();
      const joinData = prepareRoomData(roomData, sessionId);

      log('Joining room', { roomId: joinData.roomId, username: joinData.username });

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao entrar na sala após ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room_joined', onJoined);
        socket.off('join_room_error', onError);
      };

      const onJoined = (data) => {
        cleanup();
        log('Room joined', { roomId: data.roomId, users: data.users?.length, success: true });
        resolve(data);
      };

      const onError = (error) => {
        cleanup();
        log('Join room error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      socket.once('room_joined', onJoined);
      socket.once('join_room_error', onError);
      socket.emit('join_room', joinData);
    });
  },

  // Usado por: EtapaSalaEspera - ao sair da sala
  leaveRoom: async () => {
    const { socket, isConnected, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao sair da sala após ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room_left', onLeft);
        socket.off('leave_room_error', onError);
      };

      const onLeft = (result) => {
        cleanup();
        set({ 
          inRoom: false,
          roomId: null,
          session: null,
          roomUsers: []
        });
        log('Room left', { success: true });
        resolve(result);
      };

      const onError = (error) => {
        cleanup();
        log('Leave room error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      socket.once('room_left', onLeft);
      socket.once('leave_room_error', onError);
      socket.emit('leave_room', {});
    });
  },

  // ===== MÉTODOS DE ENVIO =====
  // Usado por: ChatArea - envio de mensagens no chat
  sendMessage: (messageData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('chat_message', messageData);
    }
  },

  // Usado por: PainelJogadores - ações dos jogadores
  playerAction: (actionData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('rpg_action', actionData);
    }
  },

  // Usado por: InputArea - rolagem de dados
  rollDice: (diceData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('dice_roll', diceData);
    }
  },

  // Usado por: StatusPersonagem - atualização de status
  updateStatus: (statusData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('update_status', statusData);
    }
  },

  // Usado por: EtapaSalaEspera - iniciar jogo (mestre)
  startSession: async (sessionData) => {
    const { socket, isConnected, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao iniciar sessão após ${configs.SESSION_TIMEOUT}ms`));
      }, configs.SESSION_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('session_started', onStarted);
        socket.off('start_session_error', onError);
      };

      const onStarted = (result) => {
        cleanup();
        set({ session: result.session });
        log('Session started', { sessionId: result.session?.id, success: true });
        resolve(result);
      };

      const onError = (error) => {
        cleanup();
        log('Start session error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      socket.once('session_started', onStarted);
      socket.once('start_session_error', onError);
      socket.emit('start_session', sessionData);
    });
  },

  // ===== MÉTODOS UTILITÁRIOS =====
  safeEmit: (event, data) => {
    const { socket, isConnected, log } = get();
    if (!socket || !isConnected) {
      log('Cannot emit - not connected', { event }, 'error');
      return false;
    }

    try {
      socket.emit(event, data);
      log('Event emitted', { event, hasData: !!data });
      return true;
    } catch (error) {
      log('Emit failed', { event, error: error.message }, 'error');
      return false;
    }
  },

  // Preparação de dados para sala
  prepareRoomData: (roomData, sessionId) => {
    const { normalizarDadosUsuario, normalizarDadosHistoria } = get();
    const userData = normalizarDadosUsuario(roomData);
    const historiaData = normalizarDadosHistoria(roomData);

    return {
      roomId: `historia_${historiaData.id}`,
      userId: userData.id,
      username: userData.name,
      historiaId: historiaData.id,
      historiaData,
      personagemId: roomData.personagemId,
      personagemNome: roomData.personagemNome,
      sessionId
    };
  },

  // Normalização de dados de usuário
  normalizarDadosUsuario: (userData) => {
    if (!userData) {
      throw new Error('Dados do usuário são obrigatórios');
    }

    const normalized = {
      id: userData.userId || userData.id,
      name: userData.username || userData.nome || userData.name,
      email: userData.email || '',
      role: userData.role || userData.tipo || 'jogador'
    };

    if (!normalized.id) {
      throw new Error('ID do usuário é obrigatório');
    }
    if (!normalized.name) {
      throw new Error('Nome do usuário é obrigatório');
    }

    return normalized;
  },

  // Normalização de dados de história
  normalizarDadosHistoria: (historiaData) => {
    if (!historiaData) {
      throw new Error('Dados da história são obrigatórios');
    }

    const normalized = {
      id: historiaData.historiaId || historiaData.id,
      titulo: historiaData.titulo || historiaData.nome,
      nome: historiaData.nome || historiaData.titulo,
      userId: historiaData.userId,
      criador: historiaData.criador || 'Criador desconhecido',
      descricao: historiaData.descricao || '',
      tema: historiaData.tema || '',
      status: historiaData.status || 'ativa'
    };

    if (!normalized.id) {
      throw new Error('ID da história é obrigatório');
    }

    return normalized;
  },

  // ===== CONEXÃO AUTOMÁTICA (USADO PELAS VIEWS) =====
  // Usado por: JogoView - conexão automática na sala de espera
  connectToSocket: async (authData = null) => {
    const { isConnected, isConnecting, connect, authenticate } = get();

    // Evitar múltiplas tentativas de conexão
    if (isConnected || isConnecting) {
      console.log('🔄 SocketStore: Conexão já em andamento ou estabelecida');
      return;
    }

    console.log('🌐 SocketStore: Iniciando conexão automática ao WebSocket...');

    try {
      // Conectar ao WebSocket
      await connect(authData);

      // Se há dados de autenticação, autenticar automaticamente
      if (authData?.token) {
        console.log('🔐 SocketStore: Autenticando automaticamente...');
        await authenticate(authData);
      }

      console.log('✅ SocketStore: Conexão automática concluída com sucesso');
    } catch (error) {
      console.error('❌ SocketStore: Erro na conexão automática:', error.message);
      set({ error: error.message });
      throw error;
    }
  },

  // ===== DISCONNECT E CLEANUP =====
  // Usado por: Todas as views ao desmontar ou navegar
  disconnect: () => {
    const { socket, stopConnectionMonitor } = get();
    
    if (socket) {
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
      roomUsers: [],
      error: null
    });
  },

  // Reset completo do estado
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
      lastMessageTime: null
    });
  }
}); 