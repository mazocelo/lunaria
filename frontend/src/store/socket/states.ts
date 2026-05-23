import { SOCKET_TIMEOUTS } from '../../constants/game';

/**
 * 🌐 SOCKET STATES - Estados iniciais da conexão WebSocket
 */

export const socketInitialStates = {
  // ===== INSTÂNCIA E CONFIGURAÇÕES =====
  socket: null,
  listeners: new Map(),
  connectionOptions: {
    transports: ['websocket', 'polling'],
    upgrade: true,
    timeout: SOCKET_TIMEOUTS.CONNECTION,
    pingTimeout: SOCKET_TIMEOUTS.PING,
    autoConnect: false,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000
  },
  
  // ===== STATUS DA CONEXÃO =====
  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  isReconnecting: false,
  connectionAttempts: 0,
  lastConnectionTime: null,
  connectionStartTime: null,

  // ===== INFORMAÇÕES DO USUÁRIO =====
  currentUser: null,
  userRole: null, // 'mestre' | 'jogador'
  socketToken: null, // Mantido apenas em memória (Zustand) — sem localStorage
  
  // ===== ESTADO DA SALA/ROOM (TÉCNICO) =====
  roomId: null, // ID tecnico da room WebSocket
  inRoom: false, // Se esta conectado tecnicamente a room
  joiningRoomId: null,
  roomUsers: [], // Todos os usuários conectados à room (técnico, não necessariamente jogando)
  session: null, // Dados da sessão atual
  participantes: [], // ✅ NOVO: Lista de participantes da sala (atualizada em tempo real)
  
  // ===== CONTROLE E RATE LIMITING =====
  rateLimitExceeded: false,
  rateLimitResetTime: null,
  lastMessageTime: null,
  
  // ===== STATUS DE CONECTIVIDADE =====
  error: null, // Erros específicos de conexão/socket

  // ===== CONTROLE DE AVENTURA =====
  aventuraIniciada: false,
  statusJogo: null,
  totalJogadoresSala: 0,

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
  turnoStatus: 'idle',
  aguardandoRespostaMestre: false, // true entre envio de mensagem e resposta do Mestre
  mestrePensando: false, // true quando backend emite mestre_pensando { ativo: true }
  mestreTimedOut: false, // true quando mestre nao respondeu dentro do timeout
  mestreStale: false,
  pendingMestreRequestId: null,
  pendingMestreRequestKind: null,
  pendingMestreSentAt: null,
  activeMestreRequestId: null,
  activeMestreRequestStatus: null,
  activeMestreRequestAttempt: 0,
  activeMestreRequestUserId: null,
  activeMestrePlayerMessageId: null,
  activeMestreUpdatedAt: null,
  lastRegenerableMestreRequest: null,
  testePendente: null,
  testesPendentes: [],
  cooldownRoleplay: 0,
  rodadaFinalizada: null,
  estadoJogo: {},
  erroMensagem: null,
  
  // ===== SISTEMA DE COMBATE =====
  combateAtivo: false,
  combateFase: null,          // null | 'iniciativa' | 'combate'
  combateMonstros: [],       // Instâncias de monstros com HP atual
  combateJogadores: {},      // HP dos jogadores { [userId]: { hp_max, hp_atual, esquiva, armadura, status } }
  combateRodada: 0,
  combateResultado: null,    // null | 'vitoria' | 'derrota' | 'fuga'
  combateLog: [],            // Últimas ações do combate
  combateXpGanho: 0,
  combateOrdemIniciativa: [], // Ordem de iniciativa [{id, tipo, nome, iniciativa}]
  combateTurnoAtual: null,   // Quem deve agir agora {id, tipo, nome}
  combateIniciativaPendente: false, // true quando jogador precisa rolar iniciativa
  combateIniciativaModificador: 0,  // mod Agilidade para mostrar na UI

  // ===== PROGRESSÃO =====
  lastLevelUp: null, // { userId, username, novoNivel, ganhos, timestamp }
  lastCombateLoot: null, // { lootPorJogador, todosItens, timestamp }
  sessionRecap: null, // { resumo, historiaNome, xpGanho, loot } - dados do recap ao encerrar sessão

  // ===== CONFIGURAÇÕES E LOGS =====
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  configs: {
    CONNECTION_TIMEOUT: SOCKET_TIMEOUTS.CONNECTION,
    AUTH_TIMEOUT: SOCKET_TIMEOUTS.AUTHENTICATION,
    ROOM_TIMEOUT: SOCKET_TIMEOUTS.ROOM_JOIN_LEAVE,
    SESSION_TIMEOUT: SOCKET_TIMEOUTS.SESSION_START,
  }
};

export default socketInitialStates; 
