/**
 * Middleware de Rate Limiting para WebSocket
 */
export class RateLimitMiddleware {
  constructor() {
    this.connections = new Map(); // socketId -> connection info
    this.eventLimits = new Map(); // eventType -> limit config
    
    // Configurações padrão de rate limiting
    this.setupDefaultLimits();
    
    // Limpeza periódica de dados antigos
    this.startCleanupInterval();
  }

  /**
   * Configurar limites padrão para diferentes tipos de eventos
   */
  setupDefaultLimits() {
    this.eventLimits.set('send_message', {
      maxRequests: 30,      // 30 mensagens
      windowMs: 60 * 1000,  // por minuto
      blockDurationMs: 5 * 60 * 1000 // bloquear por 5 minutos
    });

    this.eventLimits.set('player_action', {
      maxRequests: 60,      // 60 ações
      windowMs: 60 * 1000,  // por minuto
      blockDurationMs: 2 * 60 * 1000 // bloquear por 2 minutos
    });

    this.eventLimits.set('join_room', {
      maxRequests: 10,      // 10 tentativas
      windowMs: 60 * 1000,  // por minuto
      blockDurationMs: 5 * 60 * 1000 // bloquear por 5 minutos
    });

    this.eventLimits.set('typing_start', {
      maxRequests: 120,     // 120 eventos
      windowMs: 60 * 1000,  // por minuto
      blockDurationMs: 1 * 60 * 1000 // bloquear por 1 minuto
    });

    this.eventLimits.set('ping', {
      maxRequests: 60,      // 60 pings
      windowMs: 60 * 1000,  // por minuto
      blockDurationMs: 1 * 60 * 1000 // bloquear por 1 minuto
    });
  }

  /**
   * Middleware principal de rate limiting
   */
  checkRateLimit(socket, eventType) {
    const socketId = socket.id;
    const now = Date.now();

    // Obter configuração do limite para este tipo de evento
    const limit = this.eventLimits.get(eventType) || {
      maxRequests: 100,
      windowMs: 60 * 1000,
      blockDurationMs: 5 * 60 * 1000
    };

    // Obter ou criar dados de conexão
    if (!this.connections.has(socketId)) {
      this.connections.set(socketId, {
        socketId,
        userId: socket.userId,
        username: socket.username,
        events: new Map(),
        blockedUntil: new Map(),
        connectedAt: now
      });
    }

    const connectionData = this.connections.get(socketId);

    // Verificar se está bloqueado para este evento
    if (connectionData.blockedUntil.has(eventType)) {
      const blockedUntil = connectionData.blockedUntil.get(eventType);
      if (now < blockedUntil) {
        const remainingMs = blockedUntil - now;
        socket.emit('rate_limit_exceeded', {
          eventType,
          message: `Rate limit excedido. Tente novamente em ${Math.ceil(remainingMs / 1000)} segundos.`,
          remainingMs,
          retryAfter: new Date(blockedUntil).toISOString()
        });
        return false;
      } else {
        // Remover bloqueio expirado
        connectionData.blockedUntil.delete(eventType);
      }
    }

    // Obter ou criar dados do evento
    if (!connectionData.events.has(eventType)) {
      connectionData.events.set(eventType, {
        requests: [],
        totalRequests: 0
      });
    }

    const eventData = connectionData.events.get(eventType);

    // Remover requests antigos da janela de tempo
    const windowStart = now - limit.windowMs;
    eventData.requests = eventData.requests.filter(timestamp => timestamp > windowStart);

    // Verificar se excedeu o limite
    if (eventData.requests.length >= limit.maxRequests) {
      // Bloquear por período determinado
      connectionData.blockedUntil.set(eventType, now + limit.blockDurationMs);
      
      console.log(`🚫 Rate limit excedido para ${socket.username || socketId} no evento ${eventType}`);
      
      socket.emit('rate_limit_exceeded', {
        eventType,
        message: `Rate limit excedido. Muitas tentativas de ${eventType}.`,
        maxRequests: limit.maxRequests,
        windowMs: limit.windowMs,
        blockDurationMs: limit.blockDurationMs,
        retryAfter: new Date(now + limit.blockDurationMs).toISOString()
      });

      return false;
    }

    // Adicionar request atual
    eventData.requests.push(now);
    eventData.totalRequests++;

    // Log de warning se estiver próximo do limite
    if (eventData.requests.length > limit.maxRequests * 0.8) {
      console.log(`⚠️ ${socket.username || socketId} próximo do rate limit para ${eventType}: ${eventData.requests.length}/${limit.maxRequests}`);
    }

    return true;
  }

  /**
   * Obter estatísticas de rate limiting para um socket
   */
  getSocketStats(socketId) {
    const connectionData = this.connections.get(socketId);
    if (!connectionData) {
      return null;
    }

    const stats = {
      socketId,
      userId: connectionData.userId,
      username: connectionData.username,
      connectedAt: connectionData.connectedAt,
      events: {},
      blockedEvents: []
    };

    // Estatísticas por evento
    for (const [eventType, eventData] of connectionData.events.entries()) {
      const limit = this.eventLimits.get(eventType);
      const now = Date.now();
      const windowStart = now - (limit?.windowMs || 60000);
      const recentRequests = eventData.requests.filter(timestamp => timestamp > windowStart);

      stats.events[eventType] = {
        recentRequests: recentRequests.length,
        maxRequests: limit?.maxRequests || 100,
        totalRequests: eventData.totalRequests,
        remainingRequests: Math.max(0, (limit?.maxRequests || 100) - recentRequests.length)
      };
    }

    // Eventos bloqueados
    const now = Date.now();
    for (const [eventType, blockedUntil] of connectionData.blockedUntil.entries()) {
      if (now < blockedUntil) {
        stats.blockedEvents.push({
          eventType,
          blockedUntil: new Date(blockedUntil).toISOString(),
          remainingMs: blockedUntil - now
        });
      }
    }

    return stats;
  }

  /**
   * Obter estatísticas gerais de rate limiting
   */
  getGlobalStats() {
    const now = Date.now();
    let totalConnections = this.connections.size;
    let activeConnections = 0;
    let blockedConnections = 0;
    let totalEvents = 0;

    for (const [socketId, connectionData] of this.connections.entries()) {
      // Verificar se conexão é recente (ativa nos últimos 5 minutos)
      if (now - connectionData.connectedAt < 5 * 60 * 1000) {
        activeConnections++;
      }

      // Verificar se tem eventos bloqueados
      let hasBlockedEvents = false;
      for (const [eventType, blockedUntil] of connectionData.blockedUntil.entries()) {
        if (now < blockedUntil) {
          hasBlockedEvents = true;
          break;
        }
      }
      
      if (hasBlockedEvents) {
        blockedConnections++;
      }

      // Contar eventos totais
      for (const [eventType, eventData] of connectionData.events.entries()) {
        totalEvents += eventData.totalRequests;
      }
    }

    return {
      totalConnections,
      activeConnections,
      blockedConnections,
      totalEvents,
      eventLimits: Object.fromEntries(this.eventLimits)
    };
  }

  /**
   * Remover dados de uma conexão
   */
  removeConnection(socketId) {
    this.connections.delete(socketId);
    console.log(`🧹 Dados de rate limiting removidos para socket: ${socketId}`);
  }

  /**
   * Limpeza periódica de dados antigos
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000); // Limpar a cada 10 minutos
  }

  /**
   * Limpar dados antigos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos
    let removedCount = 0;

    for (const [socketId, connectionData] of this.connections.entries()) {
      // Remover conexões muito antigas
      if (now - connectionData.connectedAt > maxAge) {
        this.connections.delete(socketId);
        removedCount++;
        continue;
      }

      // Limpar eventos antigos
      for (const [eventType, eventData] of connectionData.events.entries()) {
        const limit = this.eventLimits.get(eventType);
        const windowStart = now - (limit?.windowMs || 60000);
        eventData.requests = eventData.requests.filter(timestamp => timestamp > windowStart);
      }

      // Remover bloqueios expirados
      for (const [eventType, blockedUntil] of connectionData.blockedUntil.entries()) {
        if (now >= blockedUntil) {
          connectionData.blockedUntil.delete(eventType);
        }
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Rate limiting cleanup: ${removedCount} conexões antigas removidas`);
    }
  }

  /**
   * Configurar limite customizado para um evento
   */
  setEventLimit(eventType, config) {
    this.eventLimits.set(eventType, {
      maxRequests: config.maxRequests || 100,
      windowMs: config.windowMs || 60000,
      blockDurationMs: config.blockDurationMs || 5 * 60 * 1000
    });
  }
}

// Instância singleton
export const rateLimitMiddleware = new RateLimitMiddleware(); 