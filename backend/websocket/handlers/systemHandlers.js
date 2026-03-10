import { SYSTEM_EVENTS } from '../events/eventTypes.js';

/**
 * Handlers para eventos de sistema (status, debug)
 * Heartbeat via Socket.IO nativo (pingInterval/pingTimeout) — sem ping/pong manual
 */
export class SystemHandlers {
  constructor(io) {
    this.io = io;
  }

  /**
   * Registrar handlers de sistema para um socket
   * (alias usado pelo index.js)
   */
  registerHandlers(socket) {
    this.setupSystemHandlers(socket);
  }

  /**
   * Configurar handlers de eventos de sistema
   */
  setupSystemHandlers(socket) {
    // Handler para obter status do servidor
    socket.on('get_server_status', (data, callback) => {
      this.handleGetServerStatus(socket, data, callback);
    });

    // Handler para obter informações do socket
    socket.on('get_socket_info', (data, callback) => {
      this.handleGetSocketInfo(socket, data, callback);
    });

    // Handler para teste de conexão
    socket.on('connection_test', (data, callback) => {
      this.handleConnectionTest(socket, data, callback);
    });

    // Handlers de debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      socket.on('debug_log', (data) => {
        this.handleDebugLog(socket, data);
      });

      socket.on('get_event_history', (data, callback) => {
        this.handleGetEventHistory(socket, data, callback);
      });
    }
  }

  /**
   * Handler para obter status do servidor
   */
  handleGetServerStatus(socket, data, callback) {
    try {
      const connectedClients = this.io.engine.clientsCount || 0;
      const status = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connectedClients,
        serverTime: new Date(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform
      };

      if (callback) {
        callback({ success: true, data: status });
      } else {
        socket.emit(SYSTEM_EVENTS.STATUS_UPDATE, status);
      }
    } catch (error) {
      console.error('❌ Server status error:', error.message);
      if (callback) callback({ success: false, error: error.message });
    }
  }

  /**
   * Handler para obter informações do socket
   */
  handleGetSocketInfo(socket, data, callback) {
    try {
      const socketInfo = {
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
        role: socket.role,
        isAuthenticated: socket.isAuthenticated,
        connectedAt: socket.connectedAt,
        rooms: Array.from(socket.rooms),
        transport: socket.conn?.transport?.name
      };

      if (callback) {
        callback({ success: true, data: socketInfo });
      } else {
        socket.emit(SYSTEM_EVENTS.INFO, socketInfo);
      }
    } catch (error) {
      console.error('❌ Socket info error:', error.message);
      if (callback) callback({ success: false, error: error.message });
    }
  }

  /**
   * Handler para teste de conexão
   */
  handleConnectionTest(socket, data, callback) {
    try {
      const testResult = {
        success: true,
        message: 'Conexão funcionando corretamente',
        timestamp: new Date(),
        roundTripTime: data?.startTime ? Date.now() - data.startTime : null,
        socketId: socket.id,
        echo: data
      };

      if (callback) {
        callback(testResult);
      } else {
        socket.emit('connection_test_result', testResult);
      }
    } catch (error) {
      console.error('❌ Connection test error:', error.message);
      if (callback) callback({ success: false, error: error.message });
    }
  }

  /**
   * Handler para logs de debug (desenvolvimento)
   */
  handleDebugLog(socket, data) {
    try {
      socket.emit('debug_response', {
        received: true,
        timestamp: new Date(),
        data
      });
    } catch (error) {
      console.error('❌ Debug log error:', error.message);
    }
  }

  /**
   * Handler para obter histórico de eventos (desenvolvimento)
   */
  handleGetEventHistory(socket, data, callback) {
    try {
      const history = { message: 'Event history not available', events: [] };
      if (callback) callback({ success: true, data: history });
    } catch (error) {
      console.error('❌ Event history error:', error.message);
      if (callback) callback({ success: false, error: error.message });
    }
  }

  /**
   * Retornar stats básicas (chamado pelo index.js getStats)
   */
  getStats() {
    return {
      connectedClients: this.io?.engine?.clientsCount || 0,
      uptime: process.uptime()
    };
  }

  /**
   * Limpar recursos para um socket específico
   */
  cleanup(socketId) {
    // Nada a limpar — Socket.IO nativo cuida do heartbeat/timeout
  }
}

// Compatibilidade com função original
export function setupSystemHandlers(socket, io, server, eventEmitter) {
  const systemHandlers = new SystemHandlers(io);
  systemHandlers.setupSystemHandlers(socket);
  return systemHandlers;
}

export default SystemHandlers;
