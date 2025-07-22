import io from 'socket.io-client';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.lunaria.app.br'
  : 'http://localhost:3001';

const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'wss://api.lunaria.app.br'
  : (window.location.protocol === 'https:'
      ? `https://${window.location.hostname}:3001`
      : `http://${window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname}:3001`
  );

// Configurações centralizadas
const CONFIG = {
  CONNECTION_TIMEOUT: 60000,
  AUTH_TIMEOUT: 10000,
  ROOM_TIMEOUT: 10000,
  SESSION_TIMEOUT: 10000,
  MONITOR_INTERVAL: 30000, // Reduzido de 5s para 30s
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'error' : 'info' // Controle de logs
};

class WebSocketService {
  static instance = null;
  
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.room = null;
    this.session = null;
    this.user = null;
    this.listeners = new Map();
    this.connectionStartTime = null;
    this.connectionMonitor = null;
    
    this.connectionOptions = {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: CONFIG.CONNECTION_TIMEOUT,
      pingTimeout: 120000,
      autoConnect: false,
      forceNew: false
    };

    WebSocketService.instance = this;
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Sistema de logs otimizado
  log(event, data = {}, level = 'info') {
    if (CONFIG.LOG_LEVEL === 'error' && level !== 'error') return;
    
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : data.success ? '✅' : data.warning ? '⚠️' : '📡';
    
    if (level === 'error' || data.error) {
      console.error(`${prefix} ${timestamp} [WS] ${event}`, data);
    } else if (CONFIG.LOG_LEVEL === 'info') {
      console.log(`${prefix} ${timestamp} [WS] ${event}`, {
        ...data,
        state: { connected: this.connected, authenticated: this.authenticated }
      });
    }
  }

  // Sistema de eventos otimizado
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log(`Error in listener for ${event}`, { error: error.message }, 'error');
        }
      });
    }
  }

  // Conexão otimizada
  async connect(authData = null) {
    return new Promise((resolve, reject) => {
      try {
        this.log('Connection starting', { hasAuth: !!authData?.token });

        // Validação de token mais eficiente
        if (authData?.token && !this.validateToken(authData.token)) {
          this.log('Invalid token provided', {}, 'error');
          return reject(new Error('Token inválido'));
        }

        if (this.connected && this.socket) {
          this.log('Already connected', { success: true });
          return resolve();
        }

        this.connectionStartTime = Date.now();
        
        const options = {
          ...this.connectionOptions,
          auth: authData || {}
        };

        this.socket = io(WS_BASE_URL, options);
        
        this.setupListeners();
        
        const timeout = setTimeout(() => {
          this.log('Connection timeout', {}, 'error');
          reject(new Error(`Timeout de conexão após ${CONFIG.CONNECTION_TIMEOUT}ms`));
        }, CONFIG.CONNECTION_TIMEOUT);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          this.log('Connected successfully', { 
            socketId: this.socket.id,
            duration: Date.now() - this.connectionStartTime,
            success: true 
          });
          this.startConnectionMonitor();
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.log('Connection failed', { error: error.message }, 'error');
          reject(error);
        });

        this.socket.connect();

      } catch (error) {
        this.log('Connection exception', { error: error.message }, 'error');
        reject(error);
      }
    });
  }

  // Validação de token otimizada
  validateToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch (e) {
      return false;
    }
  }

  // Setup de listeners consolidado
  setupListeners() {
    // Listeners de conexão
    this.socket.on('connect', () => {
      this.connected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.authenticated = false;
      this.log('Disconnected', { reason });
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.log('Connection error', { error: error.message }, 'error');
      this.emit('connection_error', { error });
    });

    // Listeners de jogo
    const gameEvents = [
      'authenticated', 'room_joined', 'room_left', 'session_started', 'session_ended',
      'chat_message', 'rpg_action', 'dice_roll', 'status_update', 'room_users',
      'game_started', 'player_joined', 'player_left', 'room_owner_changed', 'rate_limit_exceeded'
    ];

    gameEvents.forEach(event => {
      this.socket.on(event, (data) => this.emit(event, data));
    });
  }

  // Monitor de conexão otimizado
  startConnectionMonitor() {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
    }

    this.connectionMonitor = setInterval(() => {
      if (this.connected && this.socket) {
        this.log('Connection check', { 
          duration: Date.now() - (this.connectionStartTime || Date.now()),
          room: this.room 
        });
      }
    }, CONFIG.MONITOR_INTERVAL);
  }

  // Autenticação melhorada
  async authenticate(authData) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        const error = new Error('WebSocket não conectado');
        this.log('Auth failed - not connected', {}, 'error');
        return reject(error);
      }

      this.log('Authentication starting');

      const normalizedData = this.normalizarDadosUsuario(authData);
      
      const timeout = setTimeout(() => {
        this.log('Authentication timeout', {}, 'error');
        reject(new Error(`Timeout de autenticação após ${CONFIG.AUTH_TIMEOUT}ms`));
      }, CONFIG.AUTH_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        this.socket.off('authenticated', onAuth);
        this.socket.off('authentication_error', onAuthError);
      };

      const onAuth = (data) => {
        cleanup();
        this.authenticated = true;
        this.user = data.user;
        this.log('Authentication successful', { userId: data.user?.id, success: true });
        resolve(data);
      };

      const onAuthError = (error) => {
        cleanup();
        this.log('Authentication failed', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      this.socket.once('authenticated', onAuth);
      this.socket.once('authentication_error', onAuthError);
      this.socket.emit('authenticate', normalizedData);
    });
  }

  // Entrada em sala melhorada
  async joinRoom(roomData, sessionId = null) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected || !this.authenticated) {
        const error = new Error('WebSocket não conectado ou não autenticado');
        this.log('Join room failed - invalid state', {}, 'error');
        return reject(error);
      }

      this.log('Joining room', { hasSession: !!sessionId });

      const joinData = this.prepareRoomData(roomData, sessionId);
      
      const timeout = setTimeout(() => {
        this.log('Join room timeout', {}, 'error');
        reject(new Error(`Timeout ao entrar na sala após ${CONFIG.ROOM_TIMEOUT}ms`));
      }, CONFIG.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        this.socket.off('room_joined', onJoined);
        this.socket.off('join_room_error', onError);
      };

      const onJoined = (data) => {
        cleanup();
        this.room = data.roomId;
        this.session = data.session;
        this.log('Room joined', { roomId: data.roomId, users: data.users?.length, success: true });
        resolve(data);
      };

      const onError = (error) => {
        cleanup();
        this.log('Join room error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      this.socket.once('room_joined', onJoined);
      this.socket.once('join_room_error', onError);
      this.socket.emit('join_room', joinData);
    });
  }

  // Preparação de dados de sala
  prepareRoomData(roomData, sessionId) {
    const userData = this.normalizarDadosUsuario(roomData);
    const historiaData = this.normalizarDadosHistoria(roomData);

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
  }

  // Métodos com padrão similar otimizado
  async leaveRoom() {
    return this.executeWithTimeout('leave_room', 'room_left', {}, CONFIG.ROOM_TIMEOUT);
  }

  async startSession(sessionData) {
    return this.executeWithTimeout('start_session', 'session_started', sessionData, CONFIG.SESSION_TIMEOUT);
  }

  // Método genérico para operações com timeout
  async executeWithTimeout(emitEvent, responseEvent, data, timeout) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        return reject(new Error('WebSocket não conectado'));
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout na operação ${emitEvent}`));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.socket.off(responseEvent, onSuccess);
        this.socket.off(`${emitEvent}_error`, onError);
      };

      const onSuccess = (result) => {
        cleanup();
        if (emitEvent === 'leave_room') {
          this.room = null;
          this.session = null;
        } else if (emitEvent === 'start_session') {
          this.session = result.session;
        }
        resolve(result);
      };

      const onError = (error) => {
        cleanup();
        reject(new Error(error.message));
      };

      this.socket.once(responseEvent, onSuccess);
      this.socket.once(`${emitEvent}_error`, onError);
      this.socket.emit(emitEvent, data);
    });
  }

  // Métodos de envio simplificados
  sendMessage(messageData) {
    this.safeEmit('chat_message', messageData);
  }

  playerAction(actionData) {
    this.safeEmit('rpg_action', actionData);
  }

  rollDice(diceData) {
    this.safeEmit('dice_roll', diceData);
  }

  updateStatus(statusData) {
    this.safeEmit('status_update', statusData);
  }

  startTyping() {
    this.safeEmit('typing_start');
  }

  stopTyping() {
    this.safeEmit('typing_stop');
  }

  ping() {
    this.safeEmit('ping');
  }

  // Emit seguro
  safeEmit(event, data = {}) {
    if (this.socket && this.connected && this.authenticated) {
      this.socket.emit(event, data);
    } else {
      this.log(`Cannot emit ${event} - invalid state`, { 
        connected: this.connected, 
        authenticated: this.authenticated 
      }, 'error');
    }
  }

  // Desconexão melhorada
  disconnect() {
    this.log('Disconnecting');
    
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
      this.connectionMonitor = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected = false;
    this.authenticated = false;
    this.room = null;
    this.session = null;
    this.user = null;
    this.connectionStartTime = null;
  }

  // Informações de diagnóstico
  getDiagnosticInfo() {
    return {
      connected: this.connected,
      authenticated: this.authenticated,
      room: this.room,
      session: this.session,
      user: this.user,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0
    };
  }

  async testConnectivity() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        timeout: 5000 
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Normalização de dados otimizada
  normalizarDadosUsuario(userData) {
    if (!userData) {
      throw new Error('Dados do usuário são obrigatórios');
    }

    const normalized = {
      id: userData.userId || userData.id,
      name: userData.username || userData.name || userData.nome,
      email: userData.email,
      token: userData.token,
      personagemId: userData.personagemId
    };

    if (!normalized.id || !normalized.name) {
      throw new Error('ID e nome do usuário são obrigatórios');
    }

    return normalized;
  }

  normalizarDadosHistoria(historiaData) {
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
  }
}

export const getWebSocketService = () => {
  return WebSocketService.getInstance();
};

export { WebSocketService };
export const { normalizarDadosUsuario, normalizarDadosHistoria } = WebSocketService.prototype; 