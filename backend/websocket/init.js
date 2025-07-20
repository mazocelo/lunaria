import WebSocketServer from './server.js';

/**
 * Inicializar servidor WebSocket
 */
export async function initializeWebSocket(httpServer) {
  try {
    const wsServer = new WebSocketServer(httpServer);
    const io = await wsServer.initialize();
    
    console.log('🚀 Servidor WebSocket inicializado com sucesso');
    
    return {
      io,
      server: wsServer,
      getStats: () => wsServer.getStats(),
      broadcast: (event, data) => wsServer.broadcast(event, data),
      sendToRoom: (roomId, event, data) => wsServer.sendToRoom(roomId, event, data)
    };
  } catch (error) {
    console.error('❌ Erro ao inicializar WebSocket:', error);
    throw error;
  }
}

export default initializeWebSocket; 