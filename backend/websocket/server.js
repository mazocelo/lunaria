import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from '../redis/redis-config.js';
import { setupEventHandlers } from './handlers/index.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { loggingMiddleware } from './middleware/logging.js';
import { errorHandler } from './middleware/errorHandler.js';
import { SOCKET_EVENTS } from './events/eventTypes.js';

/**
 * Classe principal do servidor WebSocket
 */
class WebSocketServer {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.io = null;
    this.connectedClients = new Map();
    this.rooms = new Map();
  }

  /**
   * Inicializar o servidor WebSocket
   */
  async initialize() {
    try {
    // Configurar Socket.IO - Detecta automaticamente dev/prod
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.io = new Server(this.httpServer, {
      cors: {
        origin: isProduction 
          ? process.env.FRONTEND_URL || "https://lunaria-backend-3754d2d676ff.herokuapp.com"
          : "*", // Em dev, permite todas as origens
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    console.log('🔌 Socket.IO configurado:', {
      environment: isProduction ? 'production' : 'development',
      cors: isProduction ? process.env.FRONTEND_URL : '*'
    });

      // Configurar Redis Adapter para escalabilidade
      if (process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL) {
        const pubClient = redisClient.duplicate();
        const subClient = redisClient.duplicate();
        
        await pubClient.connect();
        await subClient.connect();
        
        this.io.adapter(createAdapter(pubClient, subClient));
        console.log('✅ Redis adapter configurado para WebSocket');
      }

      // Configurar middlewares
      this.setupMiddlewares();

      // Configurar event handlers
      this.setupEventHandlers();

      console.log('🚀 Servidor WebSocket inicializado com sucesso');
      
      return this.io;
    } catch (error) {
      console.error('❌ Erro ao inicializar WebSocket:', error);
      throw error;
    }
  }

  /**
   * Configurar middlewares
   */
  setupMiddlewares() {
    // Middleware de logging
    this.io.use(loggingMiddleware);
    
    // Middleware de autenticação
    this.io.use(authMiddleware);
    
    // Middleware de rate limiting
    this.io.use(rateLimitMiddleware);
    
    // Middleware de tratamento de erros
    this.io.use(errorHandler);
  }

  /**
   * Configurar event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);
      
      // Armazenar informações do cliente
      this.connectedClients.set(socket.id, {
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Configurar handlers de eventos
      setupEventHandlers(socket, this.io, this);

      // Evento de desconexão
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado: ${socket.id} - Motivo: ${reason}`);
        this.handleDisconnection(socket);
      });

      // Emitir evento de conexão bem-sucedida
      socket.emit(SOCKET_EVENTS.CONNECTION_SUCCESS, {
        socketId: socket.id,
        serverTime: new Date(),
        message: 'Conectado com sucesso ao servidor RPG'
      });
    });
  }

  /**
   * Manipular desconexão de cliente
   */
  handleDisconnection(socket) {
    // Remover cliente da lista
    this.connectedClients.delete(socket.id);
    
    // Notificar salas sobre desconexão
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, {
          userId: socket.userId,
          username: socket.username,
          leftAt: new Date()
        });
      }
    });
  }

  /**
   * Obter estatísticas do servidor
   */
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      rooms: this.rooms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Broadcast para todos os clientes
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Enviar mensagem para sala específica
   */
  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Obter clientes conectados em uma sala
   */
  async getRoomClients(roomId) {
    const sockets = await this.io.in(roomId).fetchSockets();
    return sockets.map(socket => ({
      id: socket.id,
      userId: socket.userId,
      username: socket.username
    }));
  }
}

export default WebSocketServer; 