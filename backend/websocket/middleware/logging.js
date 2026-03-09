/**
 * Middleware de logging para WebSocket
 */
export const loggingMiddleware = (socket, next) => {
  const startTime = Date.now();
  
  // Log da conexão
  console.log(`🔌 Nova conexão WebSocket: ${socket.id}`, {
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
    referer: socket.handshake.headers.referer,
    timestamp: new Date().toISOString()
  });

  // Interceptar eventos emitidos pelo socket
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    logEvent('EMIT', socket, event, args[0]);
    return originalEmit.apply(socket, [event, ...args]);
  };

  // Interceptar eventos broadcast
  const originalBroadcast = socket.broadcast.emit;
  socket.broadcast.emit = function(event, ...args) {
    logEvent('BROADCAST', socket, event, args[0]);
    return originalBroadcast.apply(socket.broadcast, [event, ...args]);
  };

  // Log de desconexão
  socket.on('disconnect', (reason) => {
    const duration = Date.now() - startTime;
    console.log(`🔌 Desconexão WebSocket: ${socket.id}`, {
      reason,
      duration: `${duration}ms`,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date().toISOString()
    });
  });

  // Log de erros
  socket.on('error', (error) => {
    console.error(`❌ Erro WebSocket: ${socket.id}`, {
      error: error.message,
      stack: error.stack,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Função auxiliar para log de eventos
 */
function logEvent(type, socket, event, data) {
  // Filtrar eventos sensíveis ou muito frequentes
  const skipEvents = ['ping', 'pong'];
  
  if (skipEvents.includes(event)) {
    return;
  }

  const logData = {
    type,
    event,
    socketId: socket.id,
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date().toISOString()
  };

  // Em desenvolvimento, mostrar dados completos
  if (process.env.NODE_ENV === 'development') {
    logData.data = data;
  }

  // Log colorido baseado no tipo
  const colors = {
    EMIT: '📤',
    BROADCAST: '📡',
    RECEIVE: '📥'
  };

  console.log(`${colors[type] || '📋'} ${type}: ${event}`, logData);
}

/**
 * Middleware para log de eventos específicos
 */
export const eventLoggingMiddleware = (eventName) => {
  return (socket, next) => {
    socket.on(eventName, (data, callback) => {
      logEvent('RECEIVE', socket, eventName, data);
      
      // Continuar com o processamento normal
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
    
    next();
  };
};

/**
 * Middleware para log de performance
 */
export const performanceLoggingMiddleware = (socket, next) => {
  const performanceData = {
    startTime: Date.now(),
    eventCount: 0,
    errors: 0
  };

  socket.performanceData = performanceData;

  // Interceptar todos os eventos para contar
  const originalOn = socket.on;
  socket.on = function(event, listener) {
    return originalOn.call(socket, event, (...args) => {
      performanceData.eventCount++;
      performanceData.lastActivity = Date.now();
      
      try {
        return listener.apply(socket, args);
      } catch (error) {
        performanceData.errors++;
        console.error(`❌ Erro no handler do evento ${event}:`, error);
        throw error;
      }
    });
  };

  // Log de performance na desconexão
  socket.on('disconnect', () => {
    const duration = Date.now() - performanceData.startTime;
    const avgEventsPerSecond = performanceData.eventCount / (duration / 1000);
    
    console.log(`📊 Performance WebSocket: ${socket.id}`, {
      duration: `${duration}ms`,
      totalEvents: performanceData.eventCount,
      errors: performanceData.errors,
      avgEventsPerSecond: avgEventsPerSecond.toFixed(2),
      userId: socket.userId,
      username: socket.username
    });
  });

  next();
};

export default loggingMiddleware; 