/**
 * Middleware de tratamento de erros centralizado
 */
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'errorHandler' });

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para capturar erros assíncronos com contexto preservado
export const asyncHandlerWithContext = (fn, context) => {
  return (req, res, next) => {
    Promise.resolve(fn.call(context, req, res, next)).catch(next);
  };
};

// Middleware de tratamento de erros
export const errorHandler = (err, req, res, next) => {
  log.error({ err }, 'Erro na aplicacao');
  
  // Prisma: record not found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Registro não encontrado'
    });
  }

  // Prisma: unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'campo';
    return res.status(409).json({
      success: false,
      error: `Registro duplicado no campo: ${field}`
    });
  }

  // Prisma: validation error
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação nos dados enviados'
    });
  }

  // Prisma: connection error
  if (err.name === 'PrismaClientInitializationError' || err.name === 'PrismaClientRustPanicError') {
    return res.status(503).json({
      success: false,
      error: 'Serviço temporariamente indisponível'
    });
  }
  
  // Erros de Redis
  if (err.message && err.message.includes('Redis')) {
    return res.status(503).json({
      success: false,
      error: 'Erro de conexão com Redis',
      message: 'Serviço de sessões temporariamente indisponível'
    });
  }
  
  // Erro genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para capturar erros 404
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`
  });
};

// Middleware para logging de requisições
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    
    if (status >= 400) {
      log.warn({ method, url, status, duration }, 'Request completed with error');
    } else {
      log.info({ method, url, status, duration }, 'Request completed');
    }
  });
  
  next();
}; 