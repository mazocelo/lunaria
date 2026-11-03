import type { Socket } from 'socket.io-client';
import { SOCKET_TIMEOUTS } from '../../constants/game';

/**
 * SOCKET STATES - Estados iniciais da conexao WebSocket
 *
 * Shapes locais soltos (`Record<string, unknown>` quando o backend ainda nao
 * tem schema TS). Migrar para tipos formais quando os DTOs do socket
 * estabilizarem.
 */

export type SocketUser = {
  id?: number | string;
  username?: string;
  nome?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export type SocketListenerCallback = (...args: unknown[]) => void;
export type SocketListenerMap = Map<string, Set<SocketListenerCallback>>;

export type SocketState = {
  socket: Socket | null;
  listeners: SocketListenerMap;
  connectionOptions: Record<string, unknown>;

  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  isReconnecting: boolean;
  connectionAttempts: number;
  lastConnectionTime: number | null;
  connectionStartTime: number | null;

  currentUser: SocketUser | null;
  userRole: string | null;
  socketToken: string | null;

  roomId: string | null;
  inRoom: boolean;
  joiningRoomId: string | null;
  roomUsers: Array<Record<string, unknown>>;
  session: Record<string, unknown> | null;
  participantes: Array<Record<string, unknown>>;

  rateLimitExceeded: boolean;
  rateLimitResetTime: number | null;
  lastMessageTime: number | null;

  error: string | null;

  aventuraIniciada: boolean;
  statusJogo: string | null;
  totalJogadoresSala: number;

  faseJogo: string;
  rodadaAtual: number;
  turnoAtual: number;
  jogadorAtual: Record<string, unknown> | null;
  ordemJogadores: Array<Record<string, unknown>>;
  ordemDefinida: boolean;
  resultadosDados: Record<string, Record<string, unknown>>;
  ehMeuTurno: boolean;
  turnoIniciado: boolean;
  turnoStatus: string;
  aguardandoRespostaMestre: boolean;
  mestrePensando: boolean;
  mestreTimedOut: boolean;
  mestreStale: boolean;
  pendingMestreRequestId: string | null;
  pendingMestreRequestKind: string | null;
  pendingMestreSentAt: string | null;
  activeMestreRequestId: string | null;
  activeMestreRequestStatus: string | null;
  activeMestreRequestAttempt: number;
  activeMestreRequestUserId: number | string | null;
  activeMestrePlayerMessageId: number | string | null;
  activeMestreUpdatedAt: string | null;
  lastRegenerableMestreRequest: Record<string, unknown> | null;
  testePendente: Record<string, unknown> | null;
  testesPendentes: Array<Record<string, unknown>>;
  cooldownRoleplay: number;
  rodadaFinalizada: number | null;
  estadoJogo: Record<string, unknown>;
  erroMensagem: string | null;

  combateAtivo: boolean;
  combateFase: string | null;
  combateMonstros: Array<Record<string, unknown>>;
  combateJogadores: Record<string, Record<string, unknown>>;
  combateRodada: number;
  combateResultado: string | null;
  combateLog: Array<Record<string, unknown>>;
  combateXpGanho: number;
  combateOrdemIniciativa: Array<Record<string, unknown>>;
  combateTurnoAtual: Record<string, unknown> | null;
  combateIniciativaPendente: boolean;
  combateIniciativaModificador: number;

  lastLevelUp: Record<string, unknown> | null;
  lastCombateLoot: Record<string, unknown> | null;
  sessionRecap: Record<string, unknown> | null;

  logLevel: 'error' | 'info' | string;
  configs: {
    CONNECTION_TIMEOUT: number;
    AUTH_TIMEOUT: number;
    ROOM_TIMEOUT: number;
    SESSION_TIMEOUT: number;
  };
};

export const socketInitialStates: SocketState = {
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
    reconnectionDelayMax: 10000,
  },

  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  isReconnecting: false,
  connectionAttempts: 0,
  lastConnectionTime: null,
  connectionStartTime: null,

  currentUser: null,
  userRole: null,
  socketToken: null,

  roomId: null,
  inRoom: false,
  joiningRoomId: null,
  roomUsers: [],
  session: null,
  participantes: [],

  rateLimitExceeded: false,
  rateLimitResetTime: null,
  lastMessageTime: null,

  error: null,

  aventuraIniciada: false,
  statusJogo: null,
  totalJogadoresSala: 0,

  faseJogo: 'aguardando_inicio',
  rodadaAtual: 1,
  turnoAtual: 0,
  jogadorAtual: null,
  ordemJogadores: [],
  ordemDefinida: false,
  resultadosDados: {},
  ehMeuTurno: false,
  turnoIniciado: false,
  turnoStatus: 'idle',
  aguardandoRespostaMestre: false,
  mestrePensando: false,
  mestreTimedOut: false,
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

  combateAtivo: false,
  combateFase: null,
  combateMonstros: [],
  combateJogadores: {},
  combateRodada: 0,
  combateResultado: null,
  combateLog: [],
  combateXpGanho: 0,
  combateOrdemIniciativa: [],
  combateTurnoAtual: null,
  combateIniciativaPendente: false,
  combateIniciativaModificador: 0,

  lastLevelUp: null,
  lastCombateLoot: null,
  sessionRecap: null,

  logLevel: import.meta.env.PROD ? 'error' : 'info',
  configs: {
    CONNECTION_TIMEOUT: SOCKET_TIMEOUTS.CONNECTION,
    AUTH_TIMEOUT: SOCKET_TIMEOUTS.AUTHENTICATION,
    ROOM_TIMEOUT: SOCKET_TIMEOUTS.ROOM_JOIN_LEAVE,
    SESSION_TIMEOUT: SOCKET_TIMEOUTS.SESSION_START,
  },
};

export default socketInitialStates;
