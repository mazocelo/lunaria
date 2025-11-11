/**
 * 🌐 SOCKET STATES - Estados iniciais da conexão WebSocket
 * 
 * Contém todos os estados iniciais do socket:
 * - Instância do Socket.io e configurações
 * - Status da conexão WebSocket
 * - Estado de autenticação
 * - Informações do usuário conectado
 * - Estado da sala/room (conexão técnica)
 * - Controle de rate limiting
 * - Status de conectividade e latência
 * - Status de digitação (typing indicators)
 * - Sistema de listeners e logs
 */

export const socketInitialStates = {
  // ===== INSTÂNCIA E CONFIGURAÇÕES =====
  socket: null, // Instância do socket.io
  listeners: new Map(), // Map para controlar listeners
  connectionOptions: {
    transports: ['websocket', 'polling'],
    upgrade: true,
    timeout: 60000,
    pingTimeout: 120000,
    autoConnect: false,
    forceNew: false
  },
  
  // ===== STATUS DA CONEXÃO =====
  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  isReconnecting: false,
  connectionAttempts: 0,
  lastConnectionTime: null,
  connectionStartTime: null,
  connectionMonitor: null,
  
  // ===== INFORMAÇÕES DO USUÁRIO =====
  currentUser: null,
  userRole: null, // 'mestre' | 'jogador'
  
  // ===== ESTADO DA SALA/ROOM (TÉCNICO) =====
  roomId: null, // ID técnico da room WebSocket
  inRoom: false, // Se está conectado tecnicamente à room
  roomUsers: [], // Todos os usuários conectados à room (técnico, não necessariamente jogando)
  session: null, // Dados da sessão atual
  
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
  
  // ===== SISTEMA DE TURNOS E RODADAS =====
  faseJogo: 'aguardando_inicio', // 'aguardando_inicio' | 'rolagem_inicial' | 'rodada_em_andamento' | 'entre_rodadas'
  rodadaAtual: 1,
  turnoAtual: 0,
  jogadorAtual: null,
  ordemJogadores: [],
  ordemDefinida: false,
  resultadosDados: {}, // {userId: {valor, username, personagemNome, timestamp}}
  ehMeuTurno: false,
  turnoIniciado: false, // Se o jogador já clicou em "Iniciar Turno"
  cooldownRoleplay: 0,
  contadorMensagensTurno: 0,
  rodadaFinalizada: null,
  estadoJogo: {},
  erroMensagem: null,
  
  // ===== CONFIGURAÇÕES E LOGS =====
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  configs: {
    CONNECTION_TIMEOUT: 60000,
    AUTH_TIMEOUT: 10000,
    ROOM_TIMEOUT: 10000,
    SESSION_TIMEOUT: 10000,
    MONITOR_INTERVAL: 30000,
  }
};

export default socketInitialStates; 