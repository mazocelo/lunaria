import gerenciadorSessoes from '../../redis/sessoes.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';

/**
 * Handlers para eventos de conexão WebSocket
 */
export class ConnectionHandlers {
  constructor(io) {
    this.io = io;
    this.eventEmitter = EventEmitter.getInstance();
    this.connectedUsers = new Map(); // userId -> socket info
    this.activeSessions = new Map(); // sessionId -> session info
  }

  /**
   * Handler para nova conexão
   */
  handleConnection(socket) {
    console.log(`🔗 Nova conexão WebSocket: ${socket.id}`);

    // Registrar eventos do socket
    this.registerSocketEvents(socket);

    // Emitir evento de nova conexão
    this.eventEmitter.emit(EVENT_TYPES.CONNECTION.NEW, {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      userAgent: socket.handshake.headers['user-agent'],
      ip: socket.handshake.address
    });

    // Enviar mensagem de boas-vindas
    socket.emit('welcome', {
      message: 'Conectado ao servidor RPG Chat Game!',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registrar todos os eventos do socket
   */
  registerSocketEvents(socket) {
    // Eventos de autenticação
    socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
    socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
    socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));

    // Eventos de jogo
    socket.on('start_session', (data) => this.handleStartSession(socket, data));
    socket.on('end_session', (data) => this.handleEndSession(socket, data));
    socket.on('player_action', (data) => this.handlePlayerAction(socket, data));

    // Eventos de chat
    socket.on('send_message', (data) => this.handleSendMessage(socket, data));
    socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));

    // Eventos de sistema
    socket.on('ping', (data) => this.handlePing(socket, data));
    socket.on('get_status', (data) => this.handleGetStatus(socket, data));

    // Eventos de desconexão
    socket.on('disconnect', (reason) => this.handleDisconnection(socket, reason));
    socket.on('disconnecting', (reason) => this.handleDisconnecting(socket, reason));
  }

  /**
   * Handler para autenticação de usuário
   */
  async handleAuthentication(socket, data) {
    try {
      const { userId, username, token } = data;

      // Validar dados de autenticação
      if (!userId || !username) {
        socket.emit('auth_error', {
          error: 'UserId e username são obrigatórios'
        });
        return;
      }

      // Armazenar informações do usuário
      const userInfo = {
        userId,
        username,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
        rooms: new Set(),
        isAuthenticated: true
      };

      this.connectedUsers.set(userId, userInfo);
      socket.userId = userId;
      socket.username = username;

      console.log(`👤 Usuário autenticado: ${username} (${userId})`);

      // Emitir evento de autenticação
      this.eventEmitter.emit(EVENT_TYPES.USER.AUTHENTICATED, {
        userId,
        username,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Confirmar autenticação
      socket.emit('authenticated', {
        userId,
        username,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Enviar lista de salas disponíveis
      await this.sendAvailableRooms(socket);

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      socket.emit('auth_error', {
        error: 'Erro interno na autenticação'
      });
    }
  }

  /**
   * Handler para entrar em uma sala
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, sessionId } = data;

      if (!socket.userId) {
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!roomId) {
        socket.emit('error', { message: 'RoomId é obrigatório' });
        return;
      }

      // Entrar na sala
      await socket.join(roomId);

      // Atualizar informações do usuário
      const userInfo = this.connectedUsers.get(socket.userId);
      if (userInfo) {
        userInfo.rooms.add(roomId);
        userInfo.currentRoom = roomId;
      }

      console.log(`🏠 ${socket.username} entrou na sala: ${roomId}`);

      // Emitir evento de entrada na sala
      this.eventEmitter.emit(EVENT_TYPES.ROOM.USER_JOINED, {
        userId: socket.userId,
        username: socket.username,
        roomId,
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Notificar outros usuários na sala
      socket.to(roomId).emit('user_joined', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      // Confirmar entrada na sala
      socket.emit('room_joined', {
        roomId,
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Enviar informações da sessão se existir
      if (sessionId) {
        await this.sendSessionInfo(socket, sessionId);
      }

    } catch (error) {
      console.error('❌ Erro ao entrar na sala:', error);
      socket.emit('error', {
        message: 'Erro ao entrar na sala'
      });
    }
  }

  /**
   * Handler para sair de uma sala
   */
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit('error', { message: 'RoomId é obrigatório' });
        return;
      }

      // Sair da sala
      await socket.leave(roomId);

      // Atualizar informações do usuário
      const userInfo = this.connectedUsers.get(socket.userId);
      if (userInfo) {
        userInfo.rooms.delete(roomId);
        if (userInfo.currentRoom === roomId) {
          userInfo.currentRoom = null;
        }
      }

      console.log(`🚪 ${socket.username} saiu da sala: ${roomId}`);

      // Emitir evento de saída da sala
      this.eventEmitter.emit(EVENT_TYPES.ROOM.USER_LEFT, {
        userId: socket.userId,
        username: socket.username,
        roomId,
        timestamp: new Date().toISOString()
      });

      // Notificar outros usuários na sala
      socket.to(roomId).emit('user_left', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      // Confirmar saída da sala
      socket.emit('room_left', {
        roomId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao sair da sala:', error);
      socket.emit('error', {
        message: 'Erro ao sair da sala'
      });
    }
  }

  /**
   * Handler para ping/pong
   */
  handlePing(socket, data) {
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Handler para obter status
   */
  handleGetStatus(socket, data) {
    const userInfo = this.connectedUsers.get(socket.userId);
    
    socket.emit('status', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      rooms: userInfo ? Array.from(userInfo.rooms) : [],
      currentRoom: userInfo?.currentRoom || null,
      connectedAt: userInfo?.connectedAt || null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handler para desconexão (antes de desconectar)
   */
  handleDisconnecting(socket, reason) {
    console.log(`🔌 ${socket.username || socket.id} desconectando... Motivo: ${reason}`);

    // Notificar salas sobre a desconexão iminente
    socket.rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('user_disconnecting', {
          userId: socket.userId,
          username: socket.username,
          reason,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Handler para desconexão
   */
  handleDisconnection(socket, reason) {
    console.log(`❌ ${socket.username || socket.id} desconectado. Motivo: ${reason}`);

    // Remover usuário da lista de conectados
    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);
    }

    // Emitir evento de desconexão
    this.eventEmitter.emit(EVENT_TYPES.CONNECTION.DISCONNECTED, {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Enviar salas disponíveis
   */
  async sendAvailableRooms(socket) {
    try {
      const sessions = await gerenciadorSessoes.listarSessoesAtivas();
      const rooms = sessions.map(session => ({
        roomId: session.id,
        sessionId: session.id,
        name: session.nome || `Sessão ${session.id}`,
        players: session.jogadores || [],
        maxPlayers: session.maxJogadores || 6,
        status: session.status,
        createdAt: session.criadaEm
      }));

      socket.emit('available_rooms', {
        rooms,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao buscar salas:', error);
    }
  }

  /**
   * Enviar informações da sessão
   */
  async sendSessionInfo(socket, sessionId) {
    try {
      const session = await gerenciadorSessoes.obterSessao(sessionId);
      if (session) {
        socket.emit('session_info', {
          session,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar informações da sessão:', error);
    }
  }

  /**
   * Obter estatísticas de conexão
   */
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      activeSessions: this.activeSessions.size,
      connectedUsers: Array.from(this.connectedUsers.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        connectedAt: user.connectedAt,
        roomsCount: user.rooms.size,
        currentRoom: user.currentRoom
      }))
    };
  }
} 