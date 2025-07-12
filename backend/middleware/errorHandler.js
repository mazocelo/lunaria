/**
 * Middleware de tratamento de erros centralizado
 */

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware de tratamento de erros
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro na aplicação:', err);
  
  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }
  
  // Erros de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: errors
    });
  }
  
  // Erros de conexão com banco
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      error: 'Erro de conexão com banco de dados',
      message: 'Serviço temporariamente indisponível'
    });
  }
  
  // Erros de registro não encontrado
  if (err.name === 'SequelizeEmptyResultError') {
    return res.status(404).json({
      success: false,
      error: 'Registro não encontrado'
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

// Middleware para validar dados de entrada
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Middleware para logging de requisições
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    
    const logLevel = status >= 400 ? '❌' : '✅';
    console.log(`${logLevel} ${method} ${url} - ${status} (${duration}ms)`);
  });
  
  next();
}; 