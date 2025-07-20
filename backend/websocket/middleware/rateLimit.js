/**
 * Middleware de rate limiting para WebSocket
 */
class RateLimiter {
  constructor() {
    this.clients = new Map();
    this.limits = {
      // Limites por minuto
      guest: 30,      // Visitantes: 30 eventos/min
      player: 60,     // Jogadores: 60 eventos/min
      gm: 120,        // GMs: 120 eventos/min
      admin: 300      // Admins: 300 eventos/min
    };
    
    // Limpar contadores a cada minuto
    setInterval(() => {
      this.clients.clear();
    }, 60000);
  }

  /**
   * Verificar se o cliente excedeu o limite
   */
  isRateLimited(socket) {
    const clientId = socket.id;
    const role = socket.role || 'guest';
    const limit = this.limits[role] || this.limits.guest;

    // Obter contador atual do cliente
    let clientData = this.clients.get(clientId);
    
    if (!clientData) {
      clientData = {
        count: 0,
        lastReset: Date.now(),
        role: role
      };
      this.clients.set(clientId, clientData);
    }

    // Resetar contador se passou mais de 1 minuto
    const now = Date.now();
    if (now - clientData.lastReset > 60000) {
      clientData.count = 0;
      clientData.lastReset = now;
    }

    // Incrementar contador
    clientData.count++;

    // Verificar se excedeu o limite
    if (clientData.count > limit) {
      return {
        limited: true,
        limit,
        current: clientData.count,
        resetTime: clientData.lastReset + 60000
      };
    }

    return {
      limited: false,
      limit,
      current: clientData.count,
      remaining: limit - clientData.count
    };
  }

  /**
   * Obter estatísticas do cliente
   */
  getClientStats(socketId) {
    return this.clients.get(socketId) || null;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Middleware de rate limiting
 */
export const rateLimitMiddleware = (socket, next) => {
  const result = rateLimiter.isRateLimited(socket);
  
  if (result.limited) {
    const error = new Error('Rate limit exceeded');
    error.code = 'RATE_LIMIT_EXCEEDED';
    error.data = {
      limit: result.limit,
      current: result.current,
      resetTime: result.resetTime
    };
    
    console.log(`🚫 Rate limit exceeded for ${socket.id} (${socket.role}): ${result.current}/${result.limit}`);
    return next(error);
  }

  // Adicionar informações de rate limit ao socket
  socket.rateLimit = {
    limit: result.limit,
    remaining: result.remaining,
    current: result.current
  };

  next();
};

/**
 * Middleware específico para eventos que consomem mais recursos
 */
export const heavyActionRateLimit = (socket, next) => {
  const clientId = socket.id;
  const heavyActionKey = `heavy_${clientId}`;
  
  let heavyActionData = rateLimiter.clients.get(heavyActionKey);
  
  if (!heavyActionData) {
    heavyActionData = {
      count: 0,
      lastReset: Date.now()
    };
    rateLimiter.clients.set(heavyActionKey, heavyActionData);
  }

  // Resetar a cada 5 minutos para ações pesadas
  const now = Date.now();
  if (now - heavyActionData.lastReset > 300000) {
    heavyActionData.count = 0;
    heavyActionData.lastReset = now;
  }

  heavyActionData.count++;

  // Limite mais restritivo para ações pesadas (ex: geração de IA)
  const heavyLimit = socket.role === 'admin' ? 20 : 
                     socket.role === 'gm' ? 10 : 
                     socket.role === 'player' ? 5 : 2;

  if (heavyActionData.count > heavyLimit) {
    const error = new Error('Heavy action rate limit exceeded');
    error.code = 'HEAVY_ACTION_RATE_LIMIT';
    error.data = {
      limit: heavyLimit,
      current: heavyActionData.count,
      resetTime: heavyActionData.lastReset + 300000
    };
    
    console.log(`🚫 Heavy action rate limit exceeded for ${socket.id}: ${heavyActionData.count}/${heavyLimit}`);
    return next(error);
  }

  next();
};

export { rateLimiter };
export default rateLimitMiddleware; 