import { Server } from 'socket.io';
import { createClient } from 'redis';

/**
 * Gerenciador de WebSocket para o Role Chat Game
 */
class SocketManager {
  constructor() {
    this.io = null;
    this.redis = null;
    this.connectedUsers = new Map(); // userId -> socket
    this.roomUsers = new Map(); // roomId -> Set of userIds
  }

  /**
   * Inicializar o servidor WebSocket
   * @param {Object} server - Servidor HTTP
   */
  initialize(server) {
    console.log('🔌 Inicializando WebSocket...');
    
    // Criar servidor Socket.IO
    this.io = new Server(server, {
      cors: {
        origin: "*", // Em produção, especificar domínios permitidos
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Conectar ao Redis
    this.connectRedis();

    // Configurar eventos
    this.setupEventHandlers();

    console.log('✅ WebSocket inicializado com sucesso');
  }

  /**
   * Conectar ao Redis
   */
  async connectRedis() {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.redis.connect();
      console.log('✅ Conectado ao Redis para WebSocket');
    } catch (error) {
      console.error('❌ Erro ao conectar ao Redis:', error);
      // Continuar sem Redis se não estiver disponível
    }
  }

  /**
   * Configurar handlers de eventos
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Cliente conectado: ${socket.id}`);

      // Evento de autenticação
      socket.on('authenticate', async (data) => {
        await this.handleAuthentication(socket, data);
      });

      // Evento de entrar em sala
      socket.on('join_room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      // Evento de sair da sala
      socket.on('leave_room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      // Evento de mensagem de chat
      socket.on('chat_message', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // Evento de ação RPG
      socket.on('rpg_action', async (data) => {
        await this.handleRpgAction(socket, data);
      });

      // Evento de rolagem de dados
      socket.on('dice_roll', async (data) => {
        await this.handleDiceRoll(socket, data);
      });

      // Evento de atualização de status
      socket.on('status_update', async (data) => {
        await this.handleStatusUpdate(socket, data);
      });

      // Evento de ping para manter conexão
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Evento de desconexão
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handler para autenticação
   */
  async handleAuthentication(socket, data) {
    try {
      const { userId, username, sessionId } = data;

      if (!userId || !username) {
        socket.emit('error', { message: 'userId e username são obrigatórios' });
        return;
      }

      // Armazenar informações do usuário
      socket.userId = userId;
      socket.username = username;
      socket.sessionId = sessionId;

      this.connectedUsers.set(userId, socket);

      // Salvar no Redis
      if (this.redis) {
        await this.redis.hSet(`user:${userId}`, {
          socketId: socket.id,
          username: username,
          sessionId: sessionId,
          connectedAt: Date.now()
        });
      }

      socket.emit('authenticated', {
        userId,
        username,
        socketId: socket.id
      });

      console.log(`✅ Usuário autenticado: ${username} (${userId})`);

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      socket.emit('error', { message: 'Erro na autenticação' });
    }
  }

  /**
   * Handler para entrar em sala
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, userId, username } = data;

      if (!roomId || !userId) {
        socket.emit('error', { message: 'roomId e userId são obrigatórios' });
        return;
      }

      // Entrar na sala
      socket.join(roomId);

      // Adicionar usuário à lista da sala
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId).add(userId);

      // Salvar no Redis
      if (this.redis) {
        await this.redis.sAdd(`room:${roomId}:users`, userId);
        await this.redis.hSet(`room:${roomId}:user:${userId}`, {
          username: username,
          joinedAt: Date.now()
        });
      }

      // Notificar outros usuários
      socket.to(roomId).emit('user_joined', {
        userId,
        username,
        roomId,
        timestamp: Date.now()
      });

      // Enviar lista de usuários na sala
      const roomUsers = Array.from(this.roomUsers.get(roomId) || []);
      socket.emit('room_users', {
        roomId,
        users: roomUsers
      });

      console.log(`🎮 ${username} entrou na sala ${roomId}`);

    } catch (error) {
      console.error('❌ Erro ao entrar na sala:', error);
      socket.emit('error', { message: 'Erro ao entrar na sala' });
    }
  }

  /**
   * Handler para sair da sala
   */
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId, userId, username } = data;

      if (!roomId || !userId) {
        socket.emit('error', { message: 'roomId e userId são obrigatórios' });
        return;
      }

      // Sair da sala
      socket.leave(roomId);

      // Remover usuário da lista da sala
      const roomUserSet = this.roomUsers.get(roomId);
      if (roomUserSet) {
        roomUserSet.delete(userId);
        if (roomUserSet.size === 0) {
          this.roomUsers.delete(roomId);
        }
      }

      // Remover do Redis
      if (this.redis) {
        await this.redis.sRem(`room:${roomId}:users`, userId);
        await this.redis.del(`room:${roomId}:user:${userId}`);
      }

      // Notificar outros usuários
      socket.to(roomId).emit('user_left', {
        userId,
        username,
        roomId,
        timestamp: Date.now()
      });

      console.log(`👋 ${username} saiu da sala ${roomId}`);

    } catch (error) {
      console.error('❌ Erro ao sair da sala:', error);
      socket.emit('error', { message: 'Erro ao sair da sala' });
    }
  }

  /**
   * Handler para mensagem de chat
   */
  async handleChatMessage(socket, data) {
    try {
      const { roomId, userId, username, message, type = 'chat' } = data;

      if (!roomId || !userId || !message) {
        socket.emit('error', { message: 'roomId, userId e message são obrigatórios' });
        return;
      }

      const messageData = {
        id: Date.now().toString(),
        userId,
        username,
        message,
        type,
        roomId,
        timestamp: Date.now()
      };

      // Salvar no Redis
      if (this.redis) {
        await this.redis.lPush(`room:${roomId}:messages`, JSON.stringify(messageData));
        await this.redis.lTrim(`room:${roomId}:messages`, 0, 99); // Manter apenas as últimas 100 mensagens
      }

      // Enviar para todos na sala
      this.io.to(roomId).emit('chat_message', messageData);

      console.log(`💬 ${username}: ${message} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      socket.emit('error', { message: 'Erro ao processar mensagem' });
    }
  }

  /**
   * Handler para ação RPG
   */
  async handleRpgAction(socket, data) {
    try {
      const { roomId, userId, username, action, target, description } = data;

      if (!roomId || !userId || !action) {
        socket.emit('error', { message: 'roomId, userId e action são obrigatórios' });
        return;
      }

      const actionData = {
        id: Date.now().toString(),
        userId,
        username,
        action,
        target,
        description,
        roomId,
        timestamp: Date.now()
      };

      // Salvar no Redis
      if (this.redis) {
        await this.redis.lPush(`room:${roomId}:actions`, JSON.stringify(actionData));
      }

      // Enviar para todos na sala
      this.io.to(roomId).emit('rpg_action', actionData);

      console.log(`⚔️ ${username} executou ação: ${action} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao processar ação RPG:', error);
      socket.emit('error', { message: 'Erro ao processar ação RPG' });
    }
  }

  /**
   * Handler para rolagem de dados
   */
  async handleDiceRoll(socket, data) {
    try {
      const { roomId, userId, username, dice, result, description } = data;

      if (!roomId || !userId || !dice || !result) {
        socket.emit('error', { message: 'roomId, userId, dice e result são obrigatórios' });
        return;
      }

      const rollData = {
        id: Date.now().toString(),
        userId,
        username,
        dice,
        result,
        description,
        roomId,
        timestamp: Date.now()
      };

      // Salvar no Redis
      if (this.redis) {
        await this.redis.lPush(`room:${roomId}:rolls`, JSON.stringify(rollData));
      }

      // Enviar para todos na sala
      this.io.to(roomId).emit('dice_roll', rollData);

      console.log(`🎲 ${username} rolou ${dice}: ${result} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao processar rolagem:', error);
      socket.emit('error', { message: 'Erro ao processar rolagem' });
    }
  }

  /**
   * Handler para atualização de status
   */
  async handleStatusUpdate(socket, data) {
    try {
      const { roomId, userId, username, status, details } = data;

      if (!roomId || !userId || !status) {
        socket.emit('error', { message: 'roomId, userId e status são obrigatórios' });
        return;
      }

      const statusData = {
        userId,
        username,
        status,
        details,
        roomId,
        timestamp: Date.now()
      };

      // Salvar no Redis
      if (this.redis) {
        await this.redis.hSet(`room:${roomId}:user:${userId}`, {
          status: status,
          statusDetails: JSON.stringify(details),
          lastStatusUpdate: Date.now()
        });
      }

      // Enviar para todos na sala
      this.io.to(roomId).emit('status_update', statusData);

      console.log(`📊 ${username} atualizou status: ${status} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      socket.emit('error', { message: 'Erro ao atualizar status' });
    }
  }

  /**
   * Handler para desconexão
   */
  handleDisconnect(socket) {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);

    if (socket.userId) {
      // Remover usuário da lista de conectados
      this.connectedUsers.delete(socket.userId);

      // Remover de todas as salas
      for (const [roomId, userSet] of this.roomUsers.entries()) {
        if (userSet.has(socket.userId)) {
          userSet.delete(socket.userId);
          if (userSet.size === 0) {
            this.roomUsers.delete(roomId);
          }
        }
      }

      // Remover do Redis
      if (this.redis) {
        this.redis.del(`user:${socket.userId}`).catch(console.error);
      }
    }
  }

  /**
   * Enviar mensagem para sala específica
   */
  sendToRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  /**
   * Enviar mensagem para usuário específico
   */
  sendToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Obter estatísticas do servidor
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.roomUsers.size,
      totalRooms: this.io ? this.io.sockets.adapter.rooms.size : 0
    };
  }

  /**
   * Fechar conexões
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
    if (this.io) {
      this.io.close();
    }
  }
}

export default new SocketManager(); 