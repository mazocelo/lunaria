import { SystemHandlers } from './systemHandlers.js';
import { ConnectionHandlers } from './connectionHandlers.js';
import { GameHandlers } from './gameHandlers.js';
import { ChatHandlers } from './chatHandlers.js';

/**
 * Registro central de todos os handlers WebSocket
 */
export class WebSocketHandlers {
  constructor(io) {
    this.io = io;
    this.systemHandlers = new SystemHandlers(io);
    this.connectionHandlers = new ConnectionHandlers(io);
    this.gameHandlers = new GameHandlers(io);
    this.chatHandlers = new ChatHandlers(io);
  }

  /**
   * Registrar todos os handlers para um socket
   */
  registerHandlers(socket) {
    // Handler de conexão (registra todos os eventos do socket)
    this.connectionHandlers.handleConnection(socket);
    
    // Registrar handlers específicos de jogo nos eventos já configurados
    this.registerGameHandlers(socket);
    this.registerChatHandlers(socket);
    
    // Handlers de sistema
    this.systemHandlers.registerHandlers(socket);
    
    // Log de conexão
    console.log(`🔌 Todos os handlers registrados para socket: ${socket.id}`);
  }

  /**
   * Registrar handlers específicos de jogo
   */
  registerGameHandlers(socket) {
    // Registrar handlers de jogo (usa once-style para evitar duplicatas)
    const gameEvents = ['start_session', 'end_session', 'player_action'];
    gameEvents.forEach(evt => socket.removeAllListeners(evt));

    socket.on('start_session', (data) => {
      if (!data || typeof data !== 'object') return socket.emit('error', { message: 'Dados inválidos para start_session' });
      this.gameHandlers.handleStartSession(socket, data);
    });
    socket.on('end_session', (data) => {
      if (!data || typeof data !== 'object') return socket.emit('error', { message: 'Dados inválidos para end_session' });
      this.gameHandlers.handleEndSession(socket, data);
    });
    socket.on('player_action', (data) => {
      if (!data || typeof data !== 'object') return socket.emit('error', { message: 'Dados inválidos para player_action' });
      this.gameHandlers.handlePlayerAction(socket, data);
    });
  }

  /**
   * Registrar handlers específicos de chat
   */
  registerChatHandlers(socket) {
    // Registrar handlers de chat (limpa anteriores para evitar duplicatas)
    const chatEvents = ['send_message', 'typing_start', 'typing_stop'];
    chatEvents.forEach(evt => socket.removeAllListeners(evt));

    socket.on('send_message', (data) => {
      if (!data || typeof data !== 'object' || !data.roomId) return socket.emit('error', { message: 'Dados inválidos para send_message' });
      this.chatHandlers.handleSendMessage(socket, data);
    });
    socket.on('typing_start', (data) => {
      if (!data || typeof data !== 'object') return;
      this.chatHandlers.handleTypingStart(socket, data);
    });
    socket.on('typing_stop', (data) => {
      if (!data || typeof data !== 'object') return;
      this.chatHandlers.handleTypingStop(socket, data);
    });
    socket.on('get_message_history', (data) => {
      if (!data || typeof data !== 'object') return;
      this.chatHandlers.getMessageHistory(socket, data);
    });

    // Limpar typing quando usuário desconectar
    socket.on('disconnect', () => {
      this.chatHandlers.clearUserTyping(socket.userId);
    });
  }

  /**
   * Obter estatísticas de todos os handlers
   */
  async getStats() {
    return {
      system: this.systemHandlers.getStats(),
      connections: this.connectionHandlers.getConnectionStats(),
      sessions: await this.gameHandlers.getSessionStats(),
      chat: this.chatHandlers.getChatStats()
    };
  }

  /**
   * Broadcast para todas as conexões
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Broadcast para uma sala específica
   */
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Obter informações de uma sala
   */
  async getRoomInfo(roomId) {
    const sockets = await this.io.in(roomId).fetchSockets();
    return {
      roomId,
      connectedUsers: sockets.length,
      users: sockets.map(socket => ({
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username
      }))
    };
  }
}

/**
 * Função de compatibilidade para configurar handlers (mantém API antiga)
 */
export function setupEventHandlers(socket, io, server) {
  console.log(`🎯 Configurando handlers para socket: ${socket.id}`);
  
  // Se não existe instância global de handlers, criar uma
  if (!io.webSocketHandlers) {
    io.webSocketHandlers = new WebSocketHandlers(io);
  }

  // Registrar handlers
  io.webSocketHandlers.registerHandlers(socket);
}

export default setupEventHandlers; 