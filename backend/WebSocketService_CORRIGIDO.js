// 🔧 WebSocketService CORRIGIDO - Implementação Singleton
// Para resolver múltiplas conexões e timeouts

import { io } from 'socket.io-client';

class WebSocketService {
  // ✅ CORREÇÃO 1: Singleton pattern
  static instance = null;
  
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    
    this.socket = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.url = 'ws://localhost:3001';
    this.currentUser = null;
    this.currentRoom = null;
    this.listeners = new Map();
    
    // ✅ CORREÇÃO 2: Configurações otimizadas
    this.defaultOptions = {
      transports: ['websocket', 'polling'],
      timeout: 30000,        // Aumentado de 20000
      pingTimeout: 60000,    // Aumentado
      pingInterval: 25000,
      forceNew: false,       // Mudado para false
      autoConnect: false,
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,           // ✅ ATIVADO
      reconnectionAttempts: 5,      // ✅ NOVO
      reconnectionDelay: 1000,      // ✅ NOVO
      reconnectionDelayMax: 5000,   // ✅ NOVO
    };
    
    WebSocketService.instance = this;
  }

  // ✅ CORREÇÃO 3: Método getInstance
  static getInstance() {
    if (!this.instance) {
      this.instance = new WebSocketService();
    }
    return this.instance;
  }

  // ✅ CORREÇÃO 4: Prevenção de múltiplas conexões
  async connect(options = {}) {
    console.log('🔌 === INICIANDO CONEXÃO WEBSOCKET (CORRIGIDA) ===');
    
    // Prevenir múltiplas conexões simultâneas
    if (this.isConnected()) {
      console.log('🔌 WebSocket já conectado, reutilizando conexão existente');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('🔌 Conexão em andamento, aguardando...');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    
    try {
      this.connectionPromise = this._doConnect(options);
      await this.connectionPromise;
      return this.socket;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  async _doConnect(options = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    console.log('🚀 Criando nova conexão WebSocket...');
    console.log('📊 Configuração:', { 
      url: this.url, 
      timeout: mergedOptions.timeout,
      reconnection: mergedOptions.reconnection 
    });

    // Limpar conexão anterior se existir
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(this.url, mergedOptions);
    
    // ✅ CORREÇÃO 5: Configurar listeners básicos
    this._setupBasicListeners();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Timeout na conexão WebSocket (30s)');
        reject(new Error('Timeout na conexão WebSocket'));
      }, mergedOptions.timeout);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket conectado com sucesso');
        resolve(this.socket);
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Erro na conexão WebSocket:', error);
        reject(error);
      });
    });
  }

  _setupBasicListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Evento connect recebido');
      this._notifyListeners('connect', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Evento disconnect recebido:', reason);
      this.currentRoom = null;
      this._notifyListeners('disconnect', { reason, timestamp: Date.now() });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconectado após', attemptNumber, 'tentativas');
      this._notifyListeners('reconnect', { attemptNumber, timestamp: Date.now() });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Erro na reconexão:', error);
      this._notifyListeners('reconnect_error', { error, timestamp: Date.now() });
    });
  }

  // ✅ CORREÇÃO 6: Autenticação normalizada
  async authenticate(userData) {
    console.log('🔐 === INICIANDO AUTENTICAÇÃO (CORRIGIDA) ===');
    
    if (!this.isConnected()) {
      throw new Error('WebSocket não está conectado');
    }

    // ✅ NORMALIZAR dados do usuário
    const dadosNormalizados = this._normalizarDadosUsuario(userData);
    
    if (!dadosNormalizados.id || !dadosNormalizados.email) {
      throw new Error('Dados do usuário incompletos para autenticação');
    }

    console.log('📤 Dados normalizados:', dadosNormalizados);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Timeout na autenticação (10s)');
        reject(new Error('Timeout na autenticação'));
      }, 10000);

      // Listener para resposta
      const handleAuthenticated = (response) => {
        clearTimeout(timeout);
        this.socket.off('authenticated', handleAuthenticated);
        
        console.log('✅ Autenticação bem-sucedida:', response);
        this.currentUser = dadosNormalizados;
        this._notifyListeners('authenticated', response);
        resolve(response);
      };

      this.socket.once('authenticated', handleAuthenticated);
      
      // Enviar dados de autenticação
      this.socket.emit('authenticate', dadosNormalizados);
      console.log('📡 Evento authenticate enviado');
    });
  }

  // ✅ CORREÇÃO 7: Normalização de dados do usuário
  _normalizarDadosUsuario(userData) {
    if (!userData) return null;
    
    const token = userData.token || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  null;
    
    return {
      userId: userData.userId || userData.id,
      username: userData.username || userData.name || userData.nome || 'Usuário',
      email: userData.email,
      token: token,
      personagemId: userData.personagemId || null
    };
  }

  // ✅ CORREÇÃO 8: Join room melhorado
  async joinRoom(roomData) {
    console.log('🏠 === INICIANDO JOIN_ROOM (CORRIGIDO) ===');
    
    if (!this.isConnected()) {
      throw new Error('WebSocket não está conectado');
    }

    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // ✅ NORMALIZAR dados da sala
    const dadosNormalizados = {
      roomId: String(roomData.roomId),
      userId: this.currentUser.userId,
      username: this.currentUser.username,
      historiaId: roomData.historiaId || null
    };

    console.log('📤 Dados normalizados para join_room:', dadosNormalizados);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Timeout no join_room (10s)');
        reject(new Error('Timeout no join_room'));
      }, 10000);

      // Listener para resposta
      const handleRoomJoined = (response) => {
        clearTimeout(timeout);
        this.socket.off('room_joined', handleRoomJoined);
        
        console.log('✅ Entrou na sala com sucesso:', response);
        this.currentRoom = response.roomId;
        this._notifyListeners('room_joined', response);
        resolve(response);
      };

      this.socket.once('room_joined', handleRoomJoined);
      
      // Enviar dados de entrada na sala
      this.socket.emit('join_room', dadosNormalizados);
      console.log('📡 Evento join_room enviado');
    });
  }

  // ✅ CORREÇÃO 9: Sistema de listeners melhorado
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Também registrar no socket se estiver conectado
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

  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener ${event}:`, error);
        }
      });
    }
  }

  // ✅ CORREÇÃO 10: Status de conexão confiável
  isConnected() {
    return this.socket && this.socket.connected;
  }

  isAuthenticated() {
    return this.isConnected() && this.currentUser !== null;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // ✅ CORREÇÃO 11: Desconexão controlada
  disconnect() {
    console.log('🔌 Desconectando WebSocket...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentUser = null;
    this.currentRoom = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    
    console.log('✅ WebSocket desconectado');
  }

  // ✅ MÉTODOS EXTRAS para compatibilidade
  
  async leaveRoom() {
    if (!this.currentRoom || !this.isConnected()) return;
    
    this.socket.emit('leave_room', {
      roomId: this.currentRoom,
      userId: this.currentUser?.userId,
      username: this.currentUser?.username
    });
    
    this.currentRoom = null;
  }

  emit(event, data) {
    if (this.isConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Tentativa de emit sem conexão:', event);
    }
  }
}

// ✅ CORREÇÃO 12: Export singleton
const webSocketService = new WebSocketService();
export default webSocketService;

// ✅ CORREÇÃO 13: Export da classe para testes
export { WebSocketService };

// ✅ EXEMPLO DE USO CORRIGIDO:
/*
import webSocketService from './WebSocketService_CORRIGIDO.js';

// 1. Conectar (só uma vez por aplicação)
await webSocketService.connect();

// 2. Autenticar
await webSocketService.authenticate({
  id: user.id,
  name: user.name || user.nome,
  email: user.email,
  token: localStorage.getItem('authToken')
});

// 3. Entrar na sala
await webSocketService.joinRoom({
  roomId: `historia_${historiaId}`,
  historiaId: historiaId
});

// 4. Listeners (registrar uma vez)
webSocketService.on('user_joined', (data) => {
  console.log('Usuário entrou:', data);
});

webSocketService.on('aventura_iniciada', (data) => {
  console.log('Aventura iniciada:', data);
});
*/ 