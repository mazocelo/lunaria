import { io } from 'socket.io-client';
import { EventEmitter } from '../utils/EventEmitter.js';

/**
 * Serviço principal de WebSocket para o RPG Chat Game
 * Gerencia conexões, autenticação e eventos
 */
let url = 'ws://localhost:3001';
export class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentRoom = null;
    this.currentSession = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventEmitter = new EventEmitter();
    this.connectionPromise = null;
    
    // Configurações
    this.config = {
      url,
      options: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: false
      }
    };
  }

  /**
   * Conecta ao servidor WebSocket
   * @param {Object} authData - Dados de autenticação
   * @returns {Promise<boolean>} Sucesso da conexão
   */
  async connect(authData = null) {
    if (this.isConnected && this.socket) {
      return true;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Configurar opções de conexão
        const options = { ...this.config.options };
        
        // Adicionar token de autenticação se fornecido
        if (authData?.token) {
          options.auth = {
            token: authData.token
          };
        }

        // Criar conexão
        this.socket = io(this.config.url, options);

        // Event listeners da conexão
        this.setupConnectionListeners(resolve, reject);
        
        // Event listeners dos eventos do jogo
        this.setupGameListeners();

        // Conectar
        this.socket.connect();

        // Timeout para conexão
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Timeout na conexão WebSocket'));
          }
        }, this.config.options.timeout);

      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Configura listeners de conexão
   */
  setupConnectionListeners(resolve, reject) {
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      this.eventEmitter.emit('connected');
      resolve(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.eventEmitter.emit('disconnected', { reason });
      
      if (reason === 'io server disconnect') {
        // Servidor desconectou, tentar reconectar
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.connectionPromise = null;
      this.eventEmitter.emit('connection_error', { error });
      reject(error);
    });

    this.socket.on('welcome', (data) => {
      console.log('👋 Mensagem de boas-vindas:', data);
      this.eventEmitter.emit('welcome', data);
    });

    // Rate limiting
    this.socket.on('rate_limit_exceeded', (data) => {
      console.warn('⚠️ Rate limit excedido:', data);
      this.eventEmitter.emit('rate_limit_exceeded', data);
    });
  }

  /**
   * Configura listeners dos eventos do jogo
   */
  setupGameListeners() {
    // Autenticação
    this.socket.on('authenticated', (data) => {
      console.log('✅ Autenticado com sucesso:', data);
      this.isAuthenticated = true;
      this.currentUser = data.user;
      this.eventEmitter.emit('authenticated', data);
    });

    // Salas
    this.socket.on('room_joined', (data) => {
      console.log('🏠 Entrou na sala:', data);
      this.currentRoom = data.roomId;
      this.eventEmitter.emit('room_joined', data);
    });

    this.socket.on('room_left', (data) => {
      console.log('🚪 Saiu da sala:', data);
      this.currentRoom = null;
      this.eventEmitter.emit('room_left', data);
    });

    this.socket.on('user_joined', (data) => {
      console.log('👤 Usuário entrou:', data);
      this.eventEmitter.emit('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('👤 Usuário saiu:', data);
      this.eventEmitter.emit('user_left', data);
    });

    // Sessões de jogo
    this.socket.on('session_started', (data) => {
      console.log('🎮 Sessão iniciada:', data);
      this.currentSession = data.sessionId;
      this.eventEmitter.emit('session_started', data);
    });

    this.socket.on('session_ended', (data) => {
      console.log('🎮 Sessão finalizada:', data);
      this.currentSession = null;
      this.eventEmitter.emit('session_ended', data);
    });

    // Chat
    this.socket.on('new_message', (data) => {
      console.log('💬 Nova mensagem:', data);
      this.eventEmitter.emit('new_message', data);
    });

    this.socket.on('private_message', (data) => {
      console.log('📨 Mensagem privada:', data);
      this.eventEmitter.emit('private_message', data);
    });

    this.socket.on('user_typing', (data) => {
      this.eventEmitter.emit('user_typing', data);
    });

    this.socket.on('message_history', (data) => {
      this.eventEmitter.emit('message_history', data);
    });

    // Ações de jogador
    this.socket.on('player_action', (data) => {
      console.log('⚔️ Ação de jogador:', data);
      this.eventEmitter.emit('player_action', data);
    });

    this.socket.on('action_result', (data) => {
      console.log('📊 Resultado da ação:', data);
      this.eventEmitter.emit('action_result', data);
    });

    // Ping/Pong
    this.socket.on('pong', () => {
      this.eventEmitter.emit('pong');
    });
  }

  /**
   * Autentica o usuário
   * @param {Object} authData - Dados de autenticação
   * @returns {Promise<boolean>} Sucesso da autenticação
   */
  async authenticate(authData) {
    if (!this.isConnected) {
      throw new Error('WebSocket não está conectado');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na autenticação'));
      }, 10000);

      this.socket.once('authenticated', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.once('auth_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || 'Erro na autenticação'));
      });

      this.socket.emit('authenticate', authData);
    });
  }

  /**
   * Entra em uma sala
   * @param {string} roomId - ID da sala
   * @param {string} sessionId - ID da sessão (opcional)
   * @returns {Promise<boolean>} Sucesso
   */
  async joinRoom(roomId, sessionId = null) {
    if (!this.isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao entrar na sala'));
      }, 10000);

      this.socket.once('room_joined', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.once('room_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || 'Erro ao entrar na sala'));
      });

      this.socket.emit('join_room', { roomId, sessionId });
    });
  }

  /**
   * Sai da sala atual
   */
  async leaveRoom() {
    if (!this.currentRoom) {
      return;
    }

    return new Promise((resolve) => {
      this.socket.once('room_left', () => {
        resolve();
      });

      this.socket.emit('leave_room', { roomId: this.currentRoom });
    });
  }

  /**
   * Inicia uma sessão de jogo
   * @param {Object} sessionData - Dados da sessão
   * @returns {Promise<Object>} Dados da sessão iniciada
   */
  async startSession(sessionData) {
    if (!this.isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao iniciar sessão'));
      }, 15000);

      this.socket.once('session_started', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.once('session_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || 'Erro ao iniciar sessão'));
      });

      this.socket.emit('start_session', sessionData);
    });
  }

  /**
   * Envia uma mensagem no chat
   * @param {Object} messageData - Dados da mensagem
   */
  sendMessage(messageData) {
    if (!this.isAuthenticated || !this.currentRoom) {
      throw new Error('Não conectado à sala');
    }

    this.socket.emit('send_message', {
      roomId: this.currentRoom,
      ...messageData
    });
  }

  /**
   * Executa uma ação de jogador
   * @param {Object} actionData - Dados da ação
   */
  playerAction(actionData) {
    if (!this.isAuthenticated || !this.currentSession) {
      throw new Error('Não conectado à sessão');
    }

    this.socket.emit('player_action', {
      sessionId: this.currentSession,
      ...actionData
    });
  }

  /**
   * Indica que está digitando
   */
  startTyping() {
    if (this.currentRoom) {
      this.socket.emit('typing_start', { roomId: this.currentRoom });
    }
  }

  /**
   * Para de indicar que está digitando
   */
  stopTyping() {
    if (this.currentRoom) {
      this.socket.emit('typing_stop', { roomId: this.currentRoom });
    }
  }

  /**
   * Envia ping para verificar conexão
   */
  ping() {
    if (this.isConnected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Tenta reconectar
   */
  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      this.eventEmitter.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Desconecta do servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentRoom = null;
    this.currentSession = null;
    this.connectionPromise = null;
  }

  /**
   * Adiciona listener para eventos
   * @param {string} event - Nome do evento
   * @param {Function} callback - Callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Remove listener de evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Callback
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Adiciona listener único para evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Callback
   */
  once(event, callback) {
    this.eventEmitter.once(event, callback);
  }

  /**
   * Getters
   */
  get connected() {
    return this.isConnected;
  }

  get authenticated() {
    return this.isAuthenticated;
  }

  get user() {
    return this.currentUser;
  }

  get room() {
    return this.currentRoom;
  }

  get session() {
    return this.currentSession;
  }
}

// Instância singleton
export const webSocketService = new WebSocketService(); 