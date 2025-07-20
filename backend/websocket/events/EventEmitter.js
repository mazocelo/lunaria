import { EventEmitter } from 'events';
import { SOCKET_EVENTS } from './eventTypes.js';

/**
 * Classe base para emissores de eventos WebSocket
 */
class SocketEventEmitter extends EventEmitter {
  constructor(socket, io, server) {
    super();
    this.socket = socket;
    this.io = io;
    this.server = server;
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Emitir evento para o socket atual
   */
  emitToSocket(event, data, callback) {
    this.logEvent('emit_to_socket', event, data);
    
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  /**
   * Emitir evento para uma sala específica
   */
  emitToRoom(roomId, event, data) {
    this.logEvent('emit_to_room', event, { roomId, data });
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Emitir evento para todos exceto o socket atual
   */
  broadcast(event, data) {
    this.logEvent('broadcast', event, data);
    this.socket.broadcast.emit(event, data);
  }

  /**
   * Emitir evento para todos os sockets conectados
   */
  emitToAll(event, data) {
    this.logEvent('emit_to_all', event, data);
    this.io.emit(event, data);
  }

  /**
   * Emitir evento com confirmação (acknowledgment)
   */
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      this.logEvent('emit_with_ack', event, data);
      
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for acknowledgment of event: ${event}`));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  /**
   * Emitir evento de erro
   */
  emitError(error, context = {}) {
    const errorData = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date(),
      context
    };

    this.logEvent('error', SOCKET_EVENTS.ERROR, errorData);
    this.socket.emit(SOCKET_EVENTS.ERROR, errorData);
  }

  /**
   * Emitir notificação
   */
  emitNotification(type, message, data = {}) {
    const notification = {
      type,
      message,
      data,
      timestamp: new Date(),
      id: this.generateId()
    };

    this.logEvent('notification', SOCKET_EVENTS.NOTIFICATION, notification);
    this.socket.emit(SOCKET_EVENTS.NOTIFICATION, notification);
  }

  /**
   * Emitir evento de sistema
   */
  emitSystemMessage(message, level = 'info') {
    const systemMessage = {
      message,
      level,
      timestamp: new Date(),
      source: 'system'
    };

    this.logEvent('system_message', SOCKET_EVENTS.SERVER_MESSAGE, systemMessage);
    this.socket.emit(SOCKET_EVENTS.SERVER_MESSAGE, systemMessage);
  }

  /**
   * Log de eventos para debugging
   */
  logEvent(action, event, data) {
    const logEntry = {
      action,
      event,
      data,
      timestamp: new Date(),
      socketId: this.socket.id,
      userId: this.socket.userId
    };

    this.eventHistory.push(logEntry);
    
    // Manter histórico limitado
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 ${action.toUpperCase()}: ${event}`, {
        socketId: this.socket.id,
        userId: this.socket.userId,
        data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      });
    }
  }

  /**
   * Obter histórico de eventos
   */
  getEventHistory() {
    return this.eventHistory;
  }

  /**
   * Limpar histórico de eventos
   */
  clearEventHistory() {
    this.eventHistory = [];
  }

  /**
   * Gerar ID único
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validar dados do evento
   */
  validateEventData(event, data, schema) {
    try {
      // Aqui você pode implementar validação usando Joi, Zod, etc.
      // Por simplicidade, fazendo validação básica
      if (!event || typeof event !== 'string') {
        throw new Error('Nome do evento é obrigatório e deve ser string');
      }

      if (schema) {
        // Implementar validação do schema aqui
        return this.validateSchema(data, schema);
      }

      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validar schema (implementação básica)
   */
  validateSchema(data, schema) {
    // Implementação básica de validação
    // Em produção, use uma biblioteca como Joi ou Zod
    return { valid: true, data };
  }
}

export default SocketEventEmitter; 