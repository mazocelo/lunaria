import { SYSTEM_EVENTS, SOCKET_EVENTS } from '../events/eventTypes.js';

/**
 * Handlers para eventos de sistema
 * 🔧 ENHANCED: Logs detalhados para monitoramento completo
 */
export class SystemHandlers {
  constructor(io, server, eventEmitter) {
    this.io = io;
    this.server = server;
    this.eventEmitter = eventEmitter;
    this.heartbeatIntervals = new Map();
    this.timeoutChecks = new Map();
  }

  // 🔧 NOVO: Sistema de logs detalhado para SystemHandlers
  log(level, event, socketId, userId = null, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '🔧',
      'WARN': '⚠️',
      'ERROR': '❌',
      'SUCCESS': '✅',
      'DEBUG': '🔍'
    }[level] || '🔧';
    
    const userInfo = userId ? `[User:${userId}]` : '';
    const socketInfo = `[Socket:${socketId?.substring(0, 8)}...]`;
    const handlerInfo = '[SystemHandler]';
    
    console.log(`${prefix} ${timestamp} ${event} ${handlerInfo}${socketInfo}${userInfo}`, data);
  }

  /**
   * Configurar handlers de eventos de sistema
   */
  setupSystemHandlers(socket) {
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('INFO', 'SYSTEM_SETUP_HANDLERS_START', socketId, userId, {
      username: socket.username,
      isAuthenticated: socket.isAuthenticated
    });

    // Handler para ping/pong (heartbeat)
    socket.on(SYSTEM_EVENTS.PING, (data, callback) => {
      this.handlePing(socket, data, callback);
    });

    // Handler para heartbeat personalizado
    socket.on(SYSTEM_EVENTS.HEARTBEAT, (data) => {
      this.handleHeartbeat(socket, data);
    });

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

    // Handler para logs de debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      socket.on('debug_log', (data) => {
        this.handleDebugLog(socket, data);
      });

      // Handler para obter histórico de eventos
      socket.on('get_event_history', (data, callback) => {
        this.handleGetEventHistory(socket, data, callback);
      });
    }

    // Configurar heartbeat automático
    this.setupAutomaticHeartbeat(socket);

    // Configurar timeout detection
    this.setupTimeoutDetection(socket);

    this.log('SUCCESS', 'SYSTEM_SETUP_HANDLERS_COMPLETED', socketId, userId, {
      handlersConfigured: 6 + (process.env.NODE_ENV === 'development' ? 2 : 0)
    });
  }

  /**
   * Handler para ping/pong
   */
  handlePing(socket, data, callback) {
    try {
      const pongData = {
        timestamp: new Date(),
        serverTime: Date.now(),
        clientTime: data?.timestamp,
        latency: data?.timestamp ? Date.now() - data.timestamp : null
      };

      if (callback) {
        callback(pongData);
      } else {
        this.eventEmitter.emitToSocket(SYSTEM_EVENTS.PONG, pongData);
      }
    } catch (error) {
      console.error('❌ PING Error:', error.message);
    }
  }

  /**
   * Handler para heartbeat personalizado
   */
  handleHeartbeat(socket, data) {
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('INFO', 'SYSTEM_HEARTBEAT_RECEIVED', socketId, userId, {
      clientData: data,
      lastHeartbeat: socket.lastHeartbeat
    });

    try {
      socket.lastHeartbeat = new Date();
      
      const heartbeatResponse = {
        received: true,
        serverTime: new Date(),
        clientData: data
      };

      this.eventEmitter.emitToSocket(SYSTEM_EVENTS.HEARTBEAT, heartbeatResponse);
      
      this.log('SUCCESS', 'SYSTEM_HEARTBEAT_RESPONDED', socketId, userId, {
        serverTime: heartbeatResponse.serverTime,
        clientDataPresent: !!data
      });

    } catch (error) {
      this.log('ERROR', 'SYSTEM_HEARTBEAT_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handler para obter status do servidor
   */
  handleGetServerStatus(socket, data, callback) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('INFO', 'SYSTEM_GET_SERVER_STATUS_REQUEST', socketId, userId, {
      hasCallback: !!callback
    });

    try {
      const connectedClients = this.io.engine.clientsCount || 0;
      const status = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connectedClients: connectedClients,
        serverTime: new Date(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      };

      if (callback) {
        callback({ success: true, data: status });
        this.log('SUCCESS', 'SYSTEM_GET_SERVER_STATUS_CALLBACK', socketId, userId, {
          connectedClients: status.connectedClients,
          uptime: status.uptime,
          memoryUsage: status.memory.used
        });
      } else {
        this.eventEmitter.emitToSocket(SYSTEM_EVENTS.STATUS_UPDATE, status);
        this.log('SUCCESS', 'SYSTEM_GET_SERVER_STATUS_EMITTED', socketId, userId, {
          connectedClients: status.connectedClients,
          uptime: status.uptime
        });
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'SYSTEM_GET_SERVER_STATUS_COMPLETED', socketId, userId, {
        processingTimeMs: processingTime,
        connectedClients: status.connectedClients
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'SYSTEM_GET_SERVER_STATUS_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });

      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  /**
   * Handler para obter informações do socket
   */
  handleGetSocketInfo(socket, data, callback) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('INFO', 'SYSTEM_GET_SOCKET_INFO_REQUEST', socketId, userId, {
      hasCallback: !!callback
    });

    try {
      const socketInfo = {
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
        role: socket.role,
        isAuthenticated: socket.isAuthenticated,
        connectedAt: socket.connectedAt,
        rooms: Array.from(socket.rooms),
        rateLimit: socket.rateLimit,
        errorCount: socket.errorCount || 0,
        lastHeartbeat: socket.lastHeartbeat,
        transport: socket.conn?.transport?.name,
        remoteAddress: socket.handshake?.address
      };

      if (callback) {
        callback({ success: true, data: socketInfo });
        this.log('SUCCESS', 'SYSTEM_GET_SOCKET_INFO_CALLBACK', socketId, userId, {
          roomsCount: socketInfo.rooms.length,
          transport: socketInfo.transport,
          errorCount: socketInfo.errorCount
        });
      } else {
        this.eventEmitter.emitToSocket(SYSTEM_EVENTS.INFO, socketInfo);
        this.log('SUCCESS', 'SYSTEM_GET_SOCKET_INFO_EMITTED', socketId, userId, {
          roomsCount: socketInfo.rooms.length,
          transport: socketInfo.transport
        });
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'SYSTEM_GET_SOCKET_INFO_COMPLETED', socketId, userId, {
        processingTimeMs: processingTime,
        roomsCount: socketInfo.rooms.length
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'SYSTEM_GET_SOCKET_INFO_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });

      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  /**
   * Handler para teste de conexão
   */
  handleConnectionTest(socket, data, callback) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('INFO', 'SYSTEM_CONNECTION_TEST_REQUEST', socketId, userId, {
      hasCallback: !!callback,
      clientStartTime: data?.startTime,
      testData: data
    });

    try {
      const testResult = {
        success: true,
        message: 'Conexão funcionando corretamente',
        timestamp: new Date(),
        roundTripTime: data?.startTime ? Date.now() - data.startTime : null,
        socketId: socket.id,
        echo: data,
        serverProcessingTime: null // será preenchido abaixo
      };

      const processingTime = Date.now() - startTime;
      testResult.serverProcessingTime = processingTime;

      if (callback) {
        callback(testResult);
        this.log('SUCCESS', 'SYSTEM_CONNECTION_TEST_CALLBACK', socketId, userId, {
          roundTripTime: testResult.roundTripTime,
          processingTime: processingTime
        });
      } else {
        this.eventEmitter.emitToSocket('connection_test_result', testResult);
        this.log('SUCCESS', 'SYSTEM_CONNECTION_TEST_EMITTED', socketId, userId, {
          roundTripTime: testResult.roundTripTime,
          processingTime: processingTime
        });
      }

      this.log('SUCCESS', 'SYSTEM_CONNECTION_TEST_COMPLETED', socketId, userId, {
        roundTripTime: testResult.roundTripTime,
        processingTimeMs: processingTime,
        success: true
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'SYSTEM_CONNECTION_TEST_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });

      const errorResult = {
        success: false,
        message: 'Erro no teste de conexão',
        error: error.message,
        timestamp: new Date(),
        socketId: socket.id
      };

      if (callback) {
        callback(errorResult);
      }
    }
  }

  /**
   * Handler para logs de debug (desenvolvimento)
   */
  handleDebugLog(socket, data) {
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('DEBUG', 'SYSTEM_DEBUG_LOG_RECEIVED', socketId, userId, {
      debugData: data,
      dataType: typeof data,
      environment: process.env.NODE_ENV
    });

    try {
      const debugResponse = {
        received: true,
        timestamp: new Date(),
        data: data
      };

      this.eventEmitter.emitToSocket('debug_response', debugResponse);
      
      this.log('SUCCESS', 'SYSTEM_DEBUG_LOG_RESPONDED', socketId, userId, {
        responseTimestamp: debugResponse.timestamp
      });

    } catch (error) {
      this.log('ERROR', 'SYSTEM_DEBUG_LOG_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handler para obter histórico de eventos
   */
  handleGetEventHistory(socket, data, callback) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;

    this.log('INFO', 'SYSTEM_GET_EVENT_HISTORY_REQUEST', socketId, userId, {
      hasCallback: !!callback,
      environment: process.env.NODE_ENV
    });

    try {
      const history = this.eventEmitter.getEventHistory ? 
        this.eventEmitter.getEventHistory() : 
        { message: 'Event history not available', events: [] };
      
      if (callback) {
        callback({ success: true, data: history });
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'SYSTEM_GET_EVENT_HISTORY_COMPLETED', socketId, userId, {
        eventsCount: history.events?.length || 0,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'SYSTEM_GET_EVENT_HISTORY_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });

      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  /**
   * Configurar heartbeat automático
   */
  setupAutomaticHeartbeat(socket) {
    const socketId = socket.id;
    const userId = socket.userId;
    const heartbeatInterval = 30000; // 30 segundos
    
    this.log('INFO', 'SYSTEM_HEARTBEAT_SETUP_START', socketId, userId, {
      intervalMs: heartbeatInterval
    });

    const interval = setInterval(() => {
      if (socket.connected) {
        const heartbeatData = {
          type: 'server_heartbeat',
          timestamp: new Date(),
          socketId: socket.id,
          interval: heartbeatInterval
        };

        this.eventEmitter.emitToSocket(SYSTEM_EVENTS.HEARTBEAT, heartbeatData);
        
        this.log('DEBUG', 'SYSTEM_HEARTBEAT_SENT', socketId, userId, {
          timestamp: heartbeatData.timestamp,
          intervalMs: heartbeatInterval
        });
      } else {
        clearInterval(interval);
        this.heartbeatIntervals.delete(socketId);
        this.log('INFO', 'SYSTEM_HEARTBEAT_CLEARED_DISCONNECTED', socketId, userId);
      }
    }, heartbeatInterval);

    this.heartbeatIntervals.set(socketId, interval);

    socket.on('disconnect', () => {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socketId);
      this.log('INFO', 'SYSTEM_HEARTBEAT_CLEARED_DISCONNECT', socketId, userId);
    });

    this.log('SUCCESS', 'SYSTEM_HEARTBEAT_SETUP_COMPLETED', socketId, userId, {
      intervalMs: heartbeatInterval
    });
  }

  /**
   * Configurar detecção de timeout
   */
  setupTimeoutDetection(socket) {
    const socketId = socket.id;
    const userId = socket.userId;
    const timeoutLimit = 120000; // 2 minutos
    let lastActivity = Date.now();

    this.log('INFO', 'SYSTEM_TIMEOUT_DETECTION_SETUP_START', socketId, userId, {
      timeoutLimitMs: timeoutLimit
    });

    // Atualizar última atividade em qualquer evento
    const originalOn = socket.on;
    socket.on = function(event, handler) {
      return originalOn.call(socket, event, (...args) => {
        lastActivity = Date.now();
        return handler.apply(socket, args);
      });
    };

    // Verificar timeout periodicamente
    const timeoutCheck = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > timeoutLimit) {
        this.log('WARN', 'SYSTEM_TIMEOUT_DETECTED', socketId, userId, {
          timeSinceLastActivityMs: timeSinceLastActivity,
          timeoutLimitMs: timeoutLimit
        });
        
        const warningData = {
          type: 'timeout_warning',
          message: 'Conexão inativa detectada',
          timeSinceLastActivity,
          timestamp: new Date()
        };

        this.eventEmitter.emitToSocket(SYSTEM_EVENTS.WARNING, warningData);

        // Desconectar após aviso
        setTimeout(() => {
          if (socket.connected) {
            this.log('WARN', 'SYSTEM_TIMEOUT_DISCONNECT', socketId, userId, {
              timeSinceLastActivityMs: timeSinceLastActivity
            });
            socket.disconnect(true);
          }
        }, 10000);
        
        clearInterval(timeoutCheck);
        this.timeoutChecks.delete(socketId);
      }
    }, 60000); // Verificar a cada minuto

    this.timeoutChecks.set(socketId, timeoutCheck);

    socket.on('disconnect', () => {
      clearInterval(timeoutCheck);
      this.timeoutChecks.delete(socketId);
      this.log('INFO', 'SYSTEM_TIMEOUT_DETECTION_CLEARED', socketId, userId);
    });

    this.log('SUCCESS', 'SYSTEM_TIMEOUT_DETECTION_SETUP_COMPLETED', socketId, userId, {
      timeoutLimitMs: timeoutLimit,
      checkIntervalMs: 60000
    });
  }

  /**
   * Limpar recursos para um socket específico
   */
  cleanup(socketId) {
    this.log('INFO', 'SYSTEM_CLEANUP_START', socketId, null);

    // Limpar heartbeat
    if (this.heartbeatIntervals.has(socketId)) {
      clearInterval(this.heartbeatIntervals.get(socketId));
      this.heartbeatIntervals.delete(socketId);
    }

    // Limpar timeout check
    if (this.timeoutChecks.has(socketId)) {
      clearInterval(this.timeoutChecks.get(socketId));
      this.timeoutChecks.delete(socketId);
    }

    this.log('SUCCESS', 'SYSTEM_CLEANUP_COMPLETED', socketId, null, {
      heartbeatCleaned: true,
      timeoutCheckCleaned: true
    });
  }
}

// Manter compatibilidade com função original
export function setupSystemHandlers(socket, io, server, eventEmitter) {
  const systemHandlers = new SystemHandlers(io, server, eventEmitter);
  systemHandlers.setupSystemHandlers(socket);
  return systemHandlers;
}

export default SystemHandlers; 