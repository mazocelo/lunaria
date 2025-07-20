import { SYSTEM_EVENTS, SOCKET_EVENTS } from '../events/eventTypes.js';

/**
 * Configurar handlers de eventos de sistema
 */
export function setupSystemHandlers(socket, io, server, eventEmitter) {
  console.log(`🔧 Configurando handlers de sistema para: ${socket.id}`);

  // Handler para ping/pong (heartbeat)
  socket.on(SYSTEM_EVENTS.PING, (data, callback) => {
    const pongData = {
      timestamp: new Date(),
      serverTime: Date.now(),
      clientTime: data?.timestamp,
      latency: data?.timestamp ? Date.now() - data.timestamp : null
    };

    if (callback) {
      callback(pongData);
    } else {
      eventEmitter.emitToSocket(SYSTEM_EVENTS.PONG, pongData);
    }
  });

  // Handler para heartbeat personalizado
  socket.on(SYSTEM_EVENTS.HEARTBEAT, (data) => {
    socket.lastHeartbeat = new Date();
    
    eventEmitter.emitToSocket(SYSTEM_EVENTS.HEARTBEAT, {
      received: true,
      serverTime: new Date(),
      clientData: data
    });
  });

  // Handler para obter status do servidor
  socket.on('get_server_status', (data, callback) => {
    const status = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connectedClients: server.connectedClients.size,
      serverTime: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version
    };

    if (callback) {
      callback({ success: true, data: status });
    } else {
      eventEmitter.emitToSocket(SYSTEM_EVENTS.STATUS_UPDATE, status);
    }
  });

  // Handler para obter informações do socket
  socket.on('get_socket_info', (data, callback) => {
    const socketInfo = {
      id: socket.id,
      userId: socket.userId,
      username: socket.username,
      role: socket.role,
      isAuthenticated: socket.isAuthenticated,
      connectedAt: socket.connectedAt,
      rooms: Array.from(socket.rooms),
      rateLimit: socket.rateLimit,
      errorCount: socket.errorCount || 0
    };

    if (callback) {
      callback({ success: true, data: socketInfo });
    } else {
      eventEmitter.emitToSocket(SYSTEM_EVENTS.INFO, socketInfo);
    }
  });

  // Handler para teste de conexão
  socket.on('connection_test', (data, callback) => {
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
      eventEmitter.emitToSocket('connection_test_result', testResult);
    }
  });

  // Handler para logs de debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    socket.on('debug_log', (data) => {
      console.log(`🐛 Debug log from ${socket.id}:`, data);
      
      eventEmitter.emitToSocket('debug_response', {
        received: true,
        timestamp: new Date(),
        data: data
      });
    });

    // Handler para obter histórico de eventos
    socket.on('get_event_history', (data, callback) => {
      const history = eventEmitter.getEventHistory();
      
      if (callback) {
        callback({ success: true, data: history });
      }
    });
  }

  // Configurar heartbeat automático
  setupAutomaticHeartbeat(socket, eventEmitter);

  // Configurar timeout detection
  setupTimeoutDetection(socket, eventEmitter);

  console.log(`✅ Handlers de sistema configurados para: ${socket.id}`);
}

/**
 * Configurar heartbeat automático
 */
function setupAutomaticHeartbeat(socket, eventEmitter) {
  const heartbeatInterval = 30000; // 30 segundos
  
  const interval = setInterval(() => {
    if (socket.connected) {
      eventEmitter.emitToSocket(SYSTEM_EVENTS.HEARTBEAT, {
        type: 'server_heartbeat',
        timestamp: new Date()
      });
    } else {
      clearInterval(interval);
    }
  }, heartbeatInterval);

  socket.on('disconnect', () => {
    clearInterval(interval);
  });
}

/**
 * Configurar detecção de timeout
 */
function setupTimeoutDetection(socket, eventEmitter) {
  const timeoutLimit = 120000; // 2 minutos
  let lastActivity = Date.now();

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
      console.warn(`⏰ Socket timeout detectado para ${socket.id}`);
      
      eventEmitter.emitToSocket(SYSTEM_EVENTS.WARNING, {
        type: 'timeout_warning',
        message: 'Conexão inativa detectada',
        timeSinceLastActivity,
        timestamp: new Date()
      });

      // Desconectar após aviso
      setTimeout(() => {
        if (socket.connected) {
          socket.disconnect(true);
        }
      }, 10000);
      
      clearInterval(timeoutCheck);
    }
  }, 60000); // Verificar a cada minuto

  socket.on('disconnect', () => {
    clearInterval(timeoutCheck);
  });
}

export default setupSystemHandlers; 