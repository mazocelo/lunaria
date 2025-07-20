import { Server as SocketIOServer } from 'socket.io';
import { WebSocketHandlers } from '../handlers/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';

/**
 * Servidor WebSocket principal para RPG Chat Game
 */
export class WebSocketServer {
  constructor(httpServer, options = {}) {
    this.httpServer = httpServer;
    this.options = {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      ...options
    };

    // Inicializar Socket.IO
    this.io = new SocketIOServer(httpServer, this.options);
    
    // Inicializar componentes
    this.handlers = new WebSocketHandlers(this.io);
    this.eventEmitter = EventEmitter.getInstance();
    
    // Estatísticas do servidor
    this.stats = {
      totalConnections: 0,
      currentConnections: 0,
      totalEvents: 0,
      startTime: new Date(),
      errors: 0
    };

    // Configurar middlewares e eventos
    this.setupMiddlewares();
    this.setupEventHandlers();
    this.startStatsReporting();

    console.log('🚀 WebSocket Server inicializado');
  }

  /**
   * Configurar middlewares do Socket.IO
   */
  setupMiddlewares() {
    // Middleware de autenticação
    this.io.use((socket, next) => {
      authMiddleware.authenticate(socket, next);
    });

    // Middleware de logging
    this.io.use((socket, next) => {
      console.log(`🔗 Nova tentativa de conexão: ${socket.id} de ${socket.handshake.address}`);
      next();
    });

    // Middleware de rate limiting (aplicado por evento)
    this.setupRateLimitingMiddleware();
  }

  /**
   * Configurar rate limiting por evento
   */
  setupRateLimitingMiddleware() {
    const originalEmit = this.io.emit;
    
    // Interceptar eventos para aplicar rate limiting
    this.io.use((socket, next) => {
      const originalOn = socket.on;
      
      socket.on = function(event, handler) {
        const wrappedHandler = (data) => {
          // Aplicar rate limiting para eventos específicos
          const rateLimitedEvents = [
            'send_message', 'player_action', 'join_room', 
            'typing_start', 'typing_stop', 'ping'
          ];
          
          if (rateLimitedEvents.includes(event)) {
            if (!rateLimitMiddleware.checkRateLimit(socket, event)) {
              return; // Bloqueado por rate limiting
            }
          }
          
          try {
            handler(data);
          } catch (error) {
            console.error(`❌ Erro no handler ${event}:`, error);
            socket.emit('error', {
              message: 'Erro interno no servidor',
              event,
              timestamp: new Date().toISOString()
            });
          }
        };
        
        return originalOn.call(this, event, wrappedHandler);
      };
      
      next();
    });
  }

  /**
   * Configurar handlers de eventos do Socket.IO
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleNewConnection(socket);
    });

    // Eventos globais do servidor
    this.eventEmitter.on(EVENT_TYPES.SERVER.STATS_UPDATE, (stats) => {
      this.io.emit('server_stats', stats);
    });

    this.eventEmitter.on(EVENT_TYPES.SERVER.BROADCAST, (data) => {
      this.io.emit(data.event, data.payload);
    });
  }

  /**
   * Lidar com nova conexão
   */
  handleNewConnection(socket) {
    // Atualizar estatísticas
    this.stats.totalConnections++;
    this.stats.currentConnections++;

    console.log(`✅ Nova conexão estabelecida: ${socket.id}`);
    console.log(`👥 Conexões ativas: ${this.stats.currentConnections}`);

    // Registrar todos os handlers para este socket
    this.handlers.registerHandlers(socket);

    // Eventos de desconexão
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Evento de erro
    socket.on('error', (error) => {
      this.handleSocketError(socket, error);
    });

    // Emitir evento de nova conexão
    this.eventEmitter.emit(EVENT_TYPES.CONNECTION.NEW, {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date().toISOString(),
      totalConnections: this.stats.currentConnections
    });
  }

  /**
   * Lidar com desconexão
   */
  handleDisconnection(socket, reason) {
    this.stats.currentConnections--;
    
    console.log(`❌ Socket desconectado: ${socket.id} - Motivo: ${reason}`);
    console.log(`👥 Conexões ativas: ${this.stats.currentConnections}`);

    // Limpar dados de rate limiting
    rateLimitMiddleware.removeConnection(socket.id);

    // Emitir evento de desconexão
    this.eventEmitter.emit(EVENT_TYPES.CONNECTION.DISCONNECTED, {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      reason,
      timestamp: new Date().toISOString(),
      totalConnections: this.stats.currentConnections
    });
  }

  /**
   * Lidar com erros de socket
   */
  handleSocketError(socket, error) {
    this.stats.errors++;
    
    console.error(`❌ Erro no socket ${socket.id}:`, error);

    // Emitir evento de erro
    this.eventEmitter.emit(EVENT_TYPES.CONNECTION.ERROR, {
      socketId: socket.id,
      userId: socket.userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Iniciar relatórios de estatísticas
   */
  startStatsReporting() {
    // Relatório a cada 5 minutos
    setInterval(async () => {
      const stats = await this.getDetailedStats();
      
      console.log('📊 Estatísticas do WebSocket Server:');
      console.log(`   Conexões atuais: ${stats.connections.current}`);
      console.log(`   Total de conexões: ${stats.connections.total}`);
      console.log(`   Sessões ativas: ${stats.sessions.total}`);
      console.log(`   Eventos processados: ${stats.events.total}`);
      console.log(`   Erros: ${stats.errors}`);

      // Emitir estatísticas para administradores
      this.broadcastToAdmins('server_stats_detailed', stats);
      
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Obter estatísticas detalhadas
   */
  async getDetailedStats() {
    const handlersStats = await this.handlers.getStats();
    const rateLimitStats = rateLimitMiddleware.getGlobalStats();
    
    return {
      server: {
        startTime: this.stats.startTime,
        uptime: Date.now() - this.stats.startTime.getTime(),
        version: process.env.npm_package_version || '1.0.0'
      },
      connections: {
        current: this.stats.currentConnections,
        total: this.stats.totalConnections
      },
      sessions: handlersStats.sessions || { total: 0, sessions: [] },
      events: {
        total: this.stats.totalEvents,
        byType: handlersStats.system?.eventCounts || {}
      },
      chat: handlersStats.chat || { activeTypingUsers: 0 },
      rateLimit: rateLimitStats,
      errors: this.stats.errors,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcast para todos os usuários
   */
  broadcast(event, data) {
    this.io.emit(event, data);
    this.stats.totalEvents++;
  }

  /**
   * Broadcast para uma sala específica
   */
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
    this.stats.totalEvents++;
  }

  /**
   * Broadcast apenas para administradores
   */
  broadcastToAdmins(event, data) {
    this.io.sockets.sockets.forEach(socket => {
      if (socket.userRole === 'admin') {
        socket.emit(event, data);
      }
    });
  }

  /**
   * Obter informações de uma sala
   */
  async getRoomInfo(roomId) {
    return await this.handlers.getRoomInfo(roomId);
  }

  /**
   * Obter lista de salas ativas
   */
  async getActiveRooms() {
    const rooms = [];
    const adapter = this.io.sockets.adapter;
    
    for (const [roomId, socketIds] of adapter.rooms.entries()) {
      // Pular salas que são IDs de socket individuais
      if (!adapter.sids.has(roomId)) {
        const roomInfo = await this.getRoomInfo(roomId);
        rooms.push(roomInfo);
      }
    }
    
    return rooms;
  }

  /**
   * Fechar servidor
   */
  async close() {
    console.log('🛑 Fechando WebSocket Server...');
    
    // Notificar todos os clientes
    this.broadcast('server_shutdown', {
      message: 'Servidor será reiniciado em breve',
      timestamp: new Date().toISOString()
    });

    // Aguardar um momento para enviar a mensagem
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fechar todas as conexões
    this.io.close();
    
    console.log('✅ WebSocket Server fechado');
  }

  /**
   * Obter instância do Socket.IO
   */
  getIO() {
    return this.io;
  }

  /**
   * Obter handlers
   */
  getHandlers() {
    return this.handlers;
  }
} 