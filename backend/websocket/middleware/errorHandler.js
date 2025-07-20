import { SOCKET_EVENTS } from '../events/eventTypes.js';

/**
 * Middleware de tratamento de erros para WebSocket
 */
export const errorHandler = (socket, next) => {
  // Interceptar erros não capturados no socket
  socket.on('error', (error) => {
    handleSocketError(socket, error, 'socket_error');
  });

  // Wrapper para capturar erros em handlers de eventos
  const originalOn = socket.on;
  socket.on = function(event, handler) {
    const wrappedHandler = (...args) => {
      try {
        const result = handler.apply(socket, args);
        
        // Se o handler retorna uma Promise, capturar erros assíncronos
        if (result && typeof result.catch === 'function') {
          result.catch((error) => {
            handleSocketError(socket, error, event);
          });
        }
        
        return result;
      } catch (error) {
        handleSocketError(socket, error, event);
      }
    };
    
    return originalOn.call(socket, event, wrappedHandler);
  };

  next();
};

/**
 * Função para tratar erros de socket
 */
function handleSocketError(socket, error, context) {
  console.error(`❌ Erro WebSocket [${context}]:`, {
    error: error.message,
    stack: error.stack,
    socketId: socket.id,
    userId: socket.userId,
    username: socket.username,
    context,
    timestamp: new Date().toISOString()
  });

  // Determinar tipo de erro e resposta apropriada
  const errorResponse = categorizeError(error, context);
  
  // Emitir erro para o cliente
  socket.emit(SOCKET_EVENTS.ERROR, {
    code: errorResponse.code,
    message: errorResponse.message,
    context,
    timestamp: new Date(),
    recoverable: errorResponse.recoverable
  });

  // Para erros críticos, desconectar o cliente
  if (!errorResponse.recoverable) {
    setTimeout(() => {
      socket.disconnect(true);
    }, 1000);
  }
}

/**
 * Categorizar tipos de erro
 */
function categorizeError(error, context) {
  // Erros de autenticação
  if (error.code === 'AUTH_REQUIRED' || error.code === 'GM_REQUIRED') {
    return {
      code: error.code,
      message: error.message,
      recoverable: true
    };
  }

  // Erros de rate limiting
  if (error.code === 'RATE_LIMIT_EXCEEDED' || error.code === 'HEAVY_ACTION_RATE_LIMIT') {
    return {
      code: error.code,
      message: 'Muitas requisições. Tente novamente em alguns momentos.',
      recoverable: true
    };
  }

  // Erros de validação
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos fornecidos.',
      recoverable: true
    };
  }

  // Erros de conexão com banco de dados
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      code: 'DATABASE_ERROR',
      message: 'Erro interno do servidor. Tente novamente.',
      recoverable: true
    };
  }

  // Erros de timeout
  if (error.code === 'ETIMEDOUT') {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'Operação expirou. Tente novamente.',
      recoverable: true
    };
  }

  // Erros de parsing JSON
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      code: 'JSON_PARSE_ERROR',
      message: 'Formato de dados inválido.',
      recoverable: true
    };
  }

  // Erros de memória ou recursos
  if (error.code === 'ERR_OUT_OF_MEMORY' || error.message.includes('memory')) {
    return {
      code: 'RESOURCE_ERROR',
      message: 'Servidor sobrecarregado. Tente novamente.',
      recoverable: false
    };
  }

  // Erro genérico
  return {
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno do servidor.',
    recoverable: true
  };
}

/**
 * Middleware para capturar erros específicos de eventos
 */
export const eventErrorHandler = (eventName) => {
  return (socket, next) => {
    const originalHandler = socket.listeners(eventName)[0];
    
    if (originalHandler) {
      socket.off(eventName, originalHandler);
      
      socket.on(eventName, async (...args) => {
        try {
          await originalHandler.apply(socket, args);
        } catch (error) {
          handleSocketError(socket, error, eventName);
        }
      });
    }
    
    next();
  };
};

/**
 * Middleware para timeout de operações
 */
export const timeoutHandler = (timeoutMs = 30000) => {
  return (socket, next) => {
    socket.timeout = timeoutMs;
    
    // Adicionar timeout para operações longas
    socket.withTimeout = (operation, timeout = timeoutMs) => {
      return Promise.race([
        operation,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Operation timeout'));
          }, timeout);
        })
      ]);
    };
    
    next();
  };
};

/**
 * Middleware para recovery automático
 */
export const autoRecoveryHandler = (socket, next) => {
  let errorCount = 0;
  const maxErrors = 5;
  const resetInterval = 60000; // 1 minuto

  socket.errorCount = 0;
  socket.lastError = null;

  // Resetar contador de erros periodicamente
  const resetTimer = setInterval(() => {
    errorCount = 0;
  }, resetInterval);

  socket.on('disconnect', () => {
    clearInterval(resetTimer);
  });

  // Interceptar erros para contagem
  socket.on('error', (error) => {
    errorCount++;
    socket.errorCount = errorCount;
    socket.lastError = error;

    // Se muitos erros, implementar backoff
    if (errorCount >= maxErrors) {
      console.warn(`⚠️ Muitos erros para socket ${socket.id}, implementando backoff`);
      
      socket.emit(SOCKET_EVENTS.WARNING, {
        message: 'Muitos erros detectados. Conexão será limitada temporariamente.',
        backoffTime: resetInterval,
        timestamp: new Date()
      });

      // Desconectar temporariamente
      setTimeout(() => {
        socket.disconnect(true);
      }, 5000);
    }
  });

  next();
};

export default errorHandler; 