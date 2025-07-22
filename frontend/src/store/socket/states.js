/**
 * 🌐 SOCKET STATES - Estados iniciais da conexão WebSocket
 * 
 * Contém todos os estados iniciais do socket:
 * - Status da conexão WebSocket
 * - Estado de autenticação
 * - Informações do usuário conectado
 * - Estado da sala/room (conexão técnica)
 * - Controle de rate limiting
 * - Status de conectividade e latência
 * - Status de digitação (typing indicators)
 */

export const socketInitialStates = {
  // ===== STATUS DA CONEXÃO =====
  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  isReconnecting: false,
  connectionAttempts: 0,
  lastConnectionTime: null,
  
  // ===== INFORMAÇÕES DO USUÁRIO =====
  currentUser: null,
  userRole: null, // 'mestre' | 'jogador'
  
  // ===== ESTADO DA SALA/ROOM (TÉCNICO) =====
  roomId: null, // ID técnico da room WebSocket
  inRoom: false, // Se está conectado tecnicamente à room
  roomUsers: [], // Todos os usuários conectados à room (técnico, não necessariamente jogando)
  
  // ===== CONTROLE E RATE LIMITING =====
  rateLimitExceeded: false,
  rateLimitResetTime: null,
  lastMessageTime: null,
  
  // ===== STATUS DE CONECTIVIDADE =====
  error: null, // Erros específicos de conexão/socket
  lastPingTime: null,
  latency: 0,
  
  // ===== TYPING STATUS =====
  isTyping: false, // Se o usuário atual está digitando
  typingTimeout: null,
};

export default socketInitialStates; 