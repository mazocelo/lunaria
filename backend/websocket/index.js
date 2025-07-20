import { WebSocketServer } from './server/WebSocketServer.js';

/**
 * Inicializar servidor WebSocket
 * @param {http.Server} httpServer - Servidor HTTP do Express
 * @param {Object} options - Opções de configuração
 * @returns {WebSocketServer} - Instância do servidor WebSocket
 */
export function initializeWebSocket(httpServer, options = {}) {
  try {
    console.log('🚀 Inicializando servidor WebSocket...');
    
    const webSocketServer = new WebSocketServer(httpServer, options);
    
    console.log('✅ Servidor WebSocket inicializado com sucesso');
    return webSocketServer;
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor WebSocket:', error);
    throw error;
  }
}

// Exportar classes principais
export { WebSocketServer } from './server/WebSocketServer.js';
export { WebSocketHandlers } from './handlers/index.js';
export { EventEmitter } from './events/EventEmitter.js';
export { EVENT_TYPES } from './events/eventTypes.js';

// Exportar middlewares
export { authMiddleware } from './middleware/authMiddleware.js';
export { rateLimitMiddleware } from './middleware/rateLimitMiddleware.js';

// Exportar handlers específicos
export { ConnectionHandlers } from './handlers/connectionHandlers.js';
export { GameHandlers } from './handlers/gameHandlers.js';
export { ChatHandlers } from './handlers/chatHandlers.js';

export default initializeWebSocket; 