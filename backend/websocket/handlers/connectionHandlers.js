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
   * Log estruturado para handlers de conexão
   */
  log(level, event, socketId, userId = null, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '📡',
      'WARN': '⚠️',
      'ERROR': '❌',
      'SUCCESS': '✅',
      'DEBUG': '🔍'
    }[level] || '📡';
    
    const userInfo = userId ? `[User:${userId}]` : '';
    const socketInfo = `[Socket:${socketId?.substring(0, 8)}...]`;
    const handlerInfo = '[ConnectionHandler]';
    
    console.log(`${prefix} ${timestamp} ${event} ${handlerInfo}${socketInfo}${userInfo}`, data);
  }

  /**
   * Handler para nova conexão
   */
  handleConnection(socket) {
    const startTime = Date.now();
    
    this.log('INFO', 'CONNECTION_HANDLER_START', socket.id, null, {
      transport: socket.conn?.transport?.name,
      remoteAddress: socket.conn?.remoteAddress,
      userAgent: socket.handshake.headers['user-agent']?.substring(0, 50),
      connectedUsers: this.connectedUsers.size
    });

    try {
      // Registrar eventos do socket
      this.log('INFO', 'REGISTERING_SOCKET_EVENTS', socket.id, null, {
        handshakeHeaders: Object.keys(socket.handshake.headers),
        query: socket.handshake.query
      });
      
      this.registerSocketEvents(socket);

      // Emitir evento de nova conexão
      const connectionEvent = {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      };

      this.log('INFO', 'EMITTING_CONNECTION_EVENT', socket.id, null, {
        eventType: EVENT_TYPES.CONNECTION.NEW,
        eventData: connectionEvent
      });

      this.eventEmitter.emit(EVENT_TYPES.CONNECTION.NEW, connectionEvent);

      // Enviar mensagem de boas-vindas
      const welcomeMessage = {
        message: 'Conectado ao servidor RPG Chat Game!',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      };

      socket.emit('welcome', welcomeMessage);

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'CONNECTION_HANDLER_COMPLETED', socket.id, null, {
        processingTimeMs: processingTime,
        welcomeMessage: welcomeMessage
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'CONNECTION_HANDLER_ERROR', socket.id, null, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
    }
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
   * Handler para autenticação de usuário (atualizado para JWT)
   */
  async handleAuthentication(socket, data) {
    const startTime = Date.now();
    
    this.log('INFO', 'AUTH_HANDLER_START', socket.id, socket.userId, {
      receivedData: data ? Object.keys(data) : [],
      socketIsAuthenticated: socket.isAuthenticated,
      socketUserId: socket.userId,
      socketUsername: socket.username
    });

    try {
      // Se usuário já está autenticado pelo middleware JWT, apenas confirmar
      if (socket.isAuthenticated && socket.userId) {
        this.log('INFO', 'AUTH_JWT_ALREADY_AUTHENTICATED', socket.id, socket.userId, {
          username: socket.username,
          email: socket.email,
          connectedUsersCount: this.connectedUsers.size
        });

        const userInfo = {
          userId: socket.userId,
          username: socket.username,
          email: socket.email,
          socketId: socket.id,
          connectedAt: new Date().toISOString(),
          rooms: new Set(),
          isAuthenticated: true
        };

        this.connectedUsers.set(socket.userId, userInfo);

        this.log('SUCCESS', 'AUTH_USER_INFO_STORED', socket.id, socket.userId, {
          userInfo: {
            userId: userInfo.userId,
            username: userInfo.username,
            email: userInfo.email,
            connectedAt: userInfo.connectedAt
          },
          totalConnectedUsers: this.connectedUsers.size
        });

        // Emitir evento de autenticação
        const authEvent = {
          userId: socket.userId,
          username: socket.username,
          email: socket.email,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        };

        this.log('INFO', 'AUTH_EMITTING_EVENT', socket.id, socket.userId, {
          eventType: EVENT_TYPES.USER.AUTHENTICATED,
          eventData: authEvent
        });

        this.eventEmitter.emit(EVENT_TYPES.USER.AUTHENTICATED, authEvent);

        // Confirmar autenticação
        const authResponse = {
          userId: socket.userId,
          username: socket.username,
          email: socket.email,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        };

        socket.emit('authenticated', authResponse);

        this.log('SUCCESS', 'AUTH_RESPONSE_SENT', socket.id, socket.userId, {
          authResponse: authResponse
        });

        // Enviar lista de salas disponíveis
        this.log('INFO', 'AUTH_SENDING_AVAILABLE_ROOMS', socket.id, socket.userId);
        await this.sendAvailableRooms(socket);

        const processingTime = Date.now() - startTime;
        this.log('SUCCESS', 'AUTH_HANDLER_COMPLETED', socket.id, socket.userId, {
          username: socket.username,
          processingTimeMs: processingTime
        });

        return;
      }

      // Para usuários não autenticados, solicitar token JWT
      this.log('WARN', 'AUTH_JWT_REQUIRED', socket.id, null, {
        socketIsAuthenticated: socket.isAuthenticated,
        hasUserId: !!socket.userId,
        receivedData: data
      });

      socket.emit('auth_error', {
        error: 'Token JWT válido necessário. Use o token obtido no login HTTP.',
        code: 'JWT_REQUIRED'
      });

      const processingTime = Date.now() - startTime;
      this.log('WARN', 'AUTH_HANDLER_JWT_REQUIRED', socket.id, null, {
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'AUTH_HANDLER_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });

      socket.emit('auth_error', {
        error: 'Erro interno na autenticação'
      });
    }
  }

  /**
   * Handler para entrar em uma sala
   */
  async handleJoinRoom(socket, data) {
    const startTime = Date.now();
    
    this.log('INFO', 'JOIN_ROOM_HANDLER_START', socket.id, socket.userId, {
      receivedData: data,
      userAuthenticated: !!socket.userId,
      username: socket.username
    });

    try {
      const { roomId, sessionId } = data;

      if (!socket.userId) {
        this.log('ERROR', 'JOIN_ROOM_USER_NOT_AUTHENTICATED', socket.id, null, {
          receivedData: data
        });
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!roomId) {
        this.log('ERROR', 'JOIN_ROOM_MISSING_ROOM_ID', socket.id, socket.userId, {
          receivedData: data
        });
        socket.emit('error', { message: 'RoomId é obrigatório' });
        return;
      }

      this.log('INFO', 'JOIN_ROOM_VALIDATION_PASSED', socket.id, socket.userId, {
        roomId: roomId,
        sessionId: sessionId,
        username: socket.username
      });

      // Entrar na sala
      this.log('INFO', 'JOIN_ROOM_SOCKET_JOINING', socket.id, socket.userId, {
        roomId: roomId,
        currentRooms: Array.from(socket.rooms)
      });

      await socket.join(roomId);

      this.log('SUCCESS', 'JOIN_ROOM_SOCKET_JOINED', socket.id, socket.userId, {
        roomId: roomId,
        roomsAfterJoin: Array.from(socket.rooms)
      });

      // Atualizar informações do usuário
      const userInfo = this.connectedUsers.get(socket.userId);
      if (userInfo) {
        const previousRooms = Array.from(userInfo.rooms);
        userInfo.rooms.add(roomId);
        userInfo.currentRoom = roomId;

        this.log('SUCCESS', 'JOIN_ROOM_USER_INFO_UPDATED', socket.id, socket.userId, {
          roomId: roomId,
          previousRooms: previousRooms,
          currentRooms: Array.from(userInfo.rooms),
          currentRoom: userInfo.currentRoom
        });
      } else {
        this.log('WARN', 'JOIN_ROOM_USER_INFO_NOT_FOUND', socket.id, socket.userId, {
          roomId: roomId,
          connectedUsersCount: this.connectedUsers.size
        });
      }

      // Emitir evento de entrada na sala
      const roomJoinEvent = {
        userId: socket.userId,
        username: socket.username,
        roomId,
        sessionId,
        timestamp: new Date().toISOString()
      };

      this.log('INFO', 'JOIN_ROOM_EMITTING_EVENT', socket.id, socket.userId, {
        eventType: EVENT_TYPES.ROOM.USER_JOINED,
        eventData: roomJoinEvent
      });

      this.eventEmitter.emit(EVENT_TYPES.ROOM.USER_JOINED, roomJoinEvent);

      // Notificar outros usuários na sala
      const userJoinedNotification = {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      };

      this.log('INFO', 'JOIN_ROOM_NOTIFYING_OTHER_USERS', socket.id, socket.userId, {
        roomId: roomId,
        notification: userJoinedNotification
      });

      socket.to(roomId).emit('user_joined', userJoinedNotification);

      // Confirmar entrada na sala
      const roomJoinedResponse = {
        roomId,
        sessionId,
        timestamp: new Date().toISOString()
      };

      socket.emit('room_joined', roomJoinedResponse);

      this.log('SUCCESS', 'JOIN_ROOM_CONFIRMATION_SENT', socket.id, socket.userId, {
        response: roomJoinedResponse
      });

      // Enviar informações da sessão se existir
      if (sessionId) {
        this.log('INFO', 'JOIN_ROOM_SENDING_SESSION_INFO', socket.id, socket.userId, {
          sessionId: sessionId
        });
        await this.sendSessionInfo(socket, sessionId);
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'JOIN_ROOM_HANDLER_COMPLETED', socket.id, socket.userId, {
        roomId: data.roomId,
        sessionId: data.sessionId,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'JOIN_ROOM_HANDLER_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });

      socket.emit('error', {
        message: 'Erro ao entrar na sala'
      });
    }
  }

  /**
   * Handler para sair de uma sala
   */
  async handleLeaveRoom(socket, data) {
    const startTime = Date.now();

    this.log('INFO', 'LEAVE_ROOM_HANDLER_START', socket.id, socket.userId, {
      receivedData: data,
      username: socket.username
    });

    try {
      const { roomId } = data;

      if (!roomId) {
        this.log('ERROR', 'LEAVE_ROOM_MISSING_ROOM_ID', socket.id, socket.userId, {
          receivedData: data
        });
        socket.emit('error', { message: 'RoomId é obrigatório' });
        return;
      }

      this.log('INFO', 'LEAVE_ROOM_VALIDATION_PASSED', socket.id, socket.userId, {
        roomId: roomId,
        currentRooms: Array.from(socket.rooms)
      });

      // Sair da sala
      this.log('INFO', 'LEAVE_ROOM_SOCKET_LEAVING', socket.id, socket.userId, {
        roomId: roomId,
        roomsBeforeLeave: Array.from(socket.rooms)
      });

      await socket.leave(roomId);

      this.log('SUCCESS', 'LEAVE_ROOM_SOCKET_LEFT', socket.id, socket.userId, {
        roomId: roomId,
        roomsAfterLeave: Array.from(socket.rooms)
      });

      // Atualizar informações do usuário
      const userInfo = this.connectedUsers.get(socket.userId);
      if (userInfo) {
        const previousRooms = Array.from(userInfo.rooms);
        const wasCurrentRoom = userInfo.currentRoom === roomId;
        
        userInfo.rooms.delete(roomId);
        if (userInfo.currentRoom === roomId) {
          userInfo.currentRoom = null;
        }

        this.log('SUCCESS', 'LEAVE_ROOM_USER_INFO_UPDATED', socket.id, socket.userId, {
          roomId: roomId,
          previousRooms: previousRooms,
          currentRooms: Array.from(userInfo.rooms),
          wasCurrentRoom: wasCurrentRoom,
          newCurrentRoom: userInfo.currentRoom
        });
      } else {
        this.log('WARN', 'LEAVE_ROOM_USER_INFO_NOT_FOUND', socket.id, socket.userId, {
          roomId: roomId
        });
      }

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
    const startTime = Date.now();
    
    this.log('WARN', 'DISCONNECTING_HANDLER_START', socket.id, socket.userId, {
      reason: reason,
      username: socket.username,
      userRooms: Array.from(socket.rooms),
      connectedUsersCount: this.connectedUsers.size
    });

    try {
      // Notificar salas sobre a desconexão iminente
      const roomsToNotify = [];
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          roomsToNotify.push(roomId);
        }
      });

      this.log('INFO', 'DISCONNECTING_NOTIFYING_ROOMS', socket.id, socket.userId, {
        roomsToNotify: roomsToNotify,
        reason: reason
      });

      const disconnectingEvent = {
        userId: socket.userId,
        username: socket.username,
        reason,
        timestamp: new Date().toISOString()
      };

      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user_disconnecting', disconnectingEvent);
          
          this.log('INFO', 'DISCONNECTING_ROOM_NOTIFIED', socket.id, socket.userId, {
            roomId: roomId,
            eventData: disconnectingEvent
          });
        }
      });

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'DISCONNECTING_HANDLER_COMPLETED', socket.id, socket.userId, {
        reason: reason,
        roomsNotified: roomsToNotify.length,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'DISCONNECTING_HANDLER_ERROR', socket.id, socket.userId, {
        reason: reason,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
    }
  }

  /**
   * Handler para desconexão
   */
  handleDisconnection(socket, reason) {
    const startTime = Date.now();
    const connectionDuration = socket.connectedAt ? Date.now() - socket.connectedAt : 'unknown';
    
    this.log('WARN', 'DISCONNECTION_HANDLER_START', socket.id, socket.userId, {
      reason: reason,
      username: socket.username,
      connectionDurationMs: connectionDuration,
      connectedUsersBeforeRemoval: this.connectedUsers.size
    });

    try {
      const userInfo = this.connectedUsers.get(socket.userId);
      
      // Remover usuário da lista de conectados
      if (socket.userId) {
        this.log('INFO', 'DISCONNECTION_REMOVING_USER', socket.id, socket.userId, {
          userInfo: userInfo ? {
            username: userInfo.username,
            rooms: Array.from(userInfo.rooms),
            currentRoom: userInfo.currentRoom,
            connectedAt: userInfo.connectedAt
          } : null
        });

        this.connectedUsers.delete(socket.userId);

        this.log('SUCCESS', 'DISCONNECTION_USER_REMOVED', socket.id, socket.userId, {
          connectedUsersAfterRemoval: this.connectedUsers.size
        });
      } else {
        this.log('INFO', 'DISCONNECTION_UNAUTHENTICATED_USER', socket.id, null, {
          reason: reason,
          socketIdOnly: socket.id
        });
      }

      // Emitir evento de desconexão
      const disconnectionEvent = {
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
        reason,
        timestamp: new Date().toISOString()
      };

      this.log('INFO', 'DISCONNECTION_EMITTING_EVENT', socket.id, socket.userId, {
        eventType: EVENT_TYPES.CONNECTION.DISCONNECTED,
        eventData: disconnectionEvent
      });

      this.eventEmitter.emit(EVENT_TYPES.CONNECTION.DISCONNECTED, disconnectionEvent);

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'DISCONNECTION_HANDLER_COMPLETED', socket.id, socket.userId, {
        reason: reason,
        username: socket.username,
        connectionDurationMs: connectionDuration,
        processingTimeMs: processingTime,
        finalStats: {
          connectedUsers: this.connectedUsers.size,
          activeSessions: this.activeSessions.size
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'DISCONNECTION_HANDLER_ERROR', socket.id, socket.userId, {
        reason: reason,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        connectionDurationMs: connectionDuration
      });
    }
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