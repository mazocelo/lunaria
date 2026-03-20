/**
 * Tests for the Socket Zustand store.
 *
 * Covers:
 * - Initial state values
 * - Connection state helpers (selectors)
 * - Token validation utility
 * - Data normalization utilities (user, historia, room)
 * - Safe emit behaviour
 * - Disconnect / reset actions
 * - Phase machine transitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external dependencies that the socket store imports at module level
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    id: 'mock-socket-id',
    connected: false,
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    io: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('../../utils/audio.js', () => ({
  playSound: vi.fn(),
}));

vi.mock('../../utils/notifications.js', () => ({
  sendNotification: vi.fn(),
}));

vi.mock('../../components/Jogo/NotificationManager.jsx', () => ({
  showGameNotification: vi.fn(),
}));

// ---- Import store after mocks are in place ----
import { useSocketStore, socketInitialStates } from '../../store/socket/index.js';
import { transicaoFase, FASES_VALIDAS } from '../../store/socket/faseMachine.js';

// Helper: deep-clone plain initial states (ignores Map/Set; sockets are null)
function cloneInitialState() {
  return JSON.parse(JSON.stringify({
    ...socketInitialStates,
    listeners: {},   // Map cannot be JSON-serialized
    socket: null,
  }));
}

// ---- Reset store before each test ----
beforeEach(() => {
  useSocketStore.setState({
    ...socketInitialStates,
    // Overwrite non-serialisable defaults so each test starts clean
    listeners: new Map(),
    socket: null,
  }, true); // `true` replaces state entirely
});

// ===========================================================================
// Initial state
// ===========================================================================

describe('Socket Store - Initial State', () => {
  it('should have isConnected = false', () => {
    expect(useSocketStore.getState().isConnected).toBe(false);
  });

  it('should have isConnecting = false', () => {
    expect(useSocketStore.getState().isConnecting).toBe(false);
  });

  it('should have isAuthenticated = false', () => {
    expect(useSocketStore.getState().isAuthenticated).toBe(false);
  });

  it('should have isReconnecting = false', () => {
    expect(useSocketStore.getState().isReconnecting).toBe(false);
  });

  it('should have socket = null', () => {
    expect(useSocketStore.getState().socket).toBeNull();
  });

  it('should have currentUser = null', () => {
    expect(useSocketStore.getState().currentUser).toBeNull();
  });

  it('should have userRole = null', () => {
    expect(useSocketStore.getState().userRole).toBeNull();
  });

  it('should have roomId = null', () => {
    expect(useSocketStore.getState().roomId).toBeNull();
  });

  it('should have inRoom = false', () => {
    expect(useSocketStore.getState().inRoom).toBe(false);
  });

  it('should have empty roomUsers array', () => {
    expect(useSocketStore.getState().roomUsers).toEqual([]);
  });

  it('should have rateLimitExceeded = false', () => {
    expect(useSocketStore.getState().rateLimitExceeded).toBe(false);
  });

  it('should have aventuraIniciada = false', () => {
    expect(useSocketStore.getState().aventuraIniciada).toBe(false);
  });

  it('should default faseJogo to aguardando_inicio', () => {
    expect(useSocketStore.getState().faseJogo).toBe('aguardando_inicio');
  });

  it('should have rodadaAtual = 1', () => {
    expect(useSocketStore.getState().rodadaAtual).toBe(1);
  });

  it('should have turnoAtual = 0', () => {
    expect(useSocketStore.getState().turnoAtual).toBe(0);
  });

  it('should have ehMeuTurno = false', () => {
    expect(useSocketStore.getState().ehMeuTurno).toBe(false);
  });

  it('should have combateAtivo = false', () => {
    expect(useSocketStore.getState().combateAtivo).toBe(false);
  });

  it('should have empty combateMonstros', () => {
    expect(useSocketStore.getState().combateMonstros).toEqual([]);
  });

  it('should have empty combateJogadores', () => {
    expect(useSocketStore.getState().combateJogadores).toEqual({});
  });

  it('should have connection options with websocket transport', () => {
    const opts = useSocketStore.getState().connectionOptions;
    expect(opts.transports).toContain('websocket');
    expect(opts.autoConnect).toBe(false);
    expect(opts.reconnection).toBe(true);
  });
});

// ===========================================================================
// Selectors (computed state)
// ===========================================================================

describe('Socket Store - Selectors', () => {
  // Import the selectors object
  let useSocketSelectors;
  beforeEach(async () => {
    const mod = await import('../../store/socket/index.js');
    useSocketSelectors = mod.useSocketSelectors;
  });

  it('connectionStatus returns disconnected when not connected', () => {
    expect(useSocketSelectors.connectionStatus()).toBe('disconnected');
  });

  it('connectionStatus returns connected when connected but not in room', () => {
    useSocketStore.setState({ isConnected: true, isConnecting: false, isReconnecting: false, inRoom: false });
    expect(useSocketSelectors.connectionStatus()).toBe('connected');
  });

  it('connectionStatus returns ready when connected and in room', () => {
    useSocketStore.setState({ isConnected: true, isConnecting: false, isReconnecting: false, inRoom: true });
    expect(useSocketSelectors.connectionStatus()).toBe('ready');
  });

  it('connectionStatus returns connecting when isConnecting', () => {
    useSocketStore.setState({ isConnected: true, isConnecting: true });
    expect(useSocketSelectors.connectionStatus()).toBe('connecting');
  });

  it('connectionStatus returns reconnecting when isReconnecting', () => {
    useSocketStore.setState({ isConnected: true, isConnecting: false, isReconnecting: true, inRoom: false });
    expect(useSocketSelectors.connectionStatus()).toBe('reconnecting');
  });

  it('canSendMessage returns false when disconnected', () => {
    expect(useSocketSelectors.canSendMessage()).toBe(false);
  });

  it('canSendMessage returns false when rate limited', () => {
    useSocketStore.setState({ isConnected: true, inRoom: true, rateLimitExceeded: true });
    expect(useSocketSelectors.canSendMessage()).toBe(false);
  });

  it('canSendMessage returns true when connected, in room, no rate limit', () => {
    useSocketStore.setState({ isConnected: true, inRoom: true, rateLimitExceeded: false });
    expect(useSocketSelectors.canSendMessage()).toBe(true);
  });

  it('roomStatus returns room details', () => {
    useSocketStore.setState({ inRoom: true, roomId: 'room-1', roomUsers: [{ id: 1 }, { id: 2 }] });
    const status = useSocketSelectors.roomStatus();
    expect(status.inRoom).toBe(true);
    expect(status.roomId).toBe('room-1');
    expect(status.userCount).toBe(2);
  });

  it('rateLimitStatus reflects exceeded state', () => {
    useSocketStore.setState({ rateLimitExceeded: true, rateLimitResetTime: 1234 });
    const status = useSocketSelectors.rateLimitStatus();
    expect(status.exceeded).toBe(true);
    expect(status.canSend).toBe(false);
    expect(status.resetTime).toBe(1234);
  });

  it('authStatus returns authentication details', () => {
    useSocketStore.setState({
      isAuthenticated: true,
      currentUser: { id: 42, username: 'hero' },
      userRole: 'jogador',
    });
    const auth = useSocketSelectors.authStatus();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user.id).toBe(42);
    expect(auth.role).toBe('jogador');
    expect(auth.isReady).toBeTruthy();
  });

  it('connectionInfo includes socketId as null when no socket', () => {
    const info = useSocketSelectors.connectionInfo();
    expect(info.socketId).toBeNull();
  });
});

// ===========================================================================
// Token validation
// ===========================================================================

describe('Socket Store - validateToken', () => {
  it('rejects malformed tokens', () => {
    const { validateToken } = useSocketStore.getState();
    expect(validateToken('not-a-jwt')).toBe(false);
  });

  it('rejects expired tokens', () => {
    const { validateToken } = useSocketStore.getState();
    // Create a JWT payload with exp in the past
    const payload = { exp: Math.floor(Date.now() / 1000) - 3600 };
    const b64 = btoa(JSON.stringify(payload));
    const fakeToken = `header.${b64}.signature`;
    expect(validateToken(fakeToken)).toBe(false);
  });

  it('accepts valid (future) tokens', () => {
    const { validateToken } = useSocketStore.getState();
    const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
    const b64 = btoa(JSON.stringify(payload));
    const fakeToken = `header.${b64}.signature`;
    expect(validateToken(fakeToken)).toBe(true);
  });
});

// ===========================================================================
// Data normalization
// ===========================================================================

describe('Socket Store - normalizarDadosUsuario', () => {
  it('normalizes userId -> id, username -> name', () => {
    const { normalizarDadosUsuario } = useSocketStore.getState();
    const result = normalizarDadosUsuario({ userId: 10, username: 'Aldaric', email: 'g@m.com' });
    expect(result.id).toBe(10);
    expect(result.name).toBe('Aldaric');
    expect(result.email).toBe('g@m.com');
    expect(result.role).toBe('jogador'); // default
  });

  it('throws when id is missing', () => {
    const { normalizarDadosUsuario } = useSocketStore.getState();
    expect(() => normalizarDadosUsuario({ username: 'NoId' })).toThrow('ID do usu');
  });

  it('throws when name is missing', () => {
    const { normalizarDadosUsuario } = useSocketStore.getState();
    expect(() => normalizarDadosUsuario({ userId: 1 })).toThrow('Nome do usu');
  });

  it('throws when data is null', () => {
    const { normalizarDadosUsuario } = useSocketStore.getState();
    expect(() => normalizarDadosUsuario(null)).toThrow();
  });
});

describe('Socket Store - normalizarDadosHistoria', () => {
  it('normalizes historiaId -> id, titulo -> nome', () => {
    const { normalizarDadosHistoria } = useSocketStore.getState();
    const result = normalizarDadosHistoria({ historiaId: 5, titulo: 'A Quest', userId: 1 });
    expect(result.id).toBe(5);
    expect(result.titulo).toBe('A Quest');
    expect(result.nome).toBe('A Quest');
  });

  it('throws when id is missing', () => {
    const { normalizarDadosHistoria } = useSocketStore.getState();
    expect(() => normalizarDadosHistoria({ titulo: 'No Id' })).toThrow('ID da hist');
  });

  it('throws when data is null', () => {
    const { normalizarDadosHistoria } = useSocketStore.getState();
    expect(() => normalizarDadosHistoria(null)).toThrow();
  });
});

describe('Socket Store - prepareRoomData', () => {
  it('builds correct roomId and extracts user/historia fields', () => {
    const { prepareRoomData } = useSocketStore.getState();
    const result = prepareRoomData(
      {
        userId: 7,
        username: 'Lyraeth',
        historiaId: 3,
        titulo: 'Floresta',
        personagemId: 99,
        personagemNome: 'Archer',
      },
      'session-abc'
    );
    expect(result.roomId).toBe('historia_3');
    expect(result.userId).toBe(7);
    expect(result.username).toBe('Lyraeth');
    expect(result.historiaId).toBe(3);
    expect(result.personagemId).toBe(99);
    expect(result.sessionId).toBe('session-abc');
  });
});

// ===========================================================================
// Safe emit
// ===========================================================================

describe('Socket Store - safeEmit', () => {
  it('returns false when not connected', () => {
    const { safeEmit } = useSocketStore.getState();
    expect(safeEmit('test_event', {})).toBe(false);
  });

  it('returns true and calls socket.emit when connected', () => {
    const mockSocket = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      io: { on: vi.fn(), off: vi.fn() },
    };
    useSocketStore.setState({ socket: mockSocket, isConnected: true });

    const { safeEmit } = useSocketStore.getState();
    const result = safeEmit('dice_roll', { value: 6 });

    expect(result).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('dice_roll', { value: 6 });
  });
});

// ===========================================================================
// Disconnect / Reset
// ===========================================================================

describe('Socket Store - disconnect', () => {
  it('resets connection state and nullifies socket', () => {
    const mockSocket = {
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
    };
    useSocketStore.setState({
      socket: mockSocket,
      isConnected: true,
      isAuthenticated: true,
      inRoom: true,
      roomId: 'room-1',
      currentUser: { id: 1 },
    });

    useSocketStore.getState().disconnect();

    const state = useSocketStore.getState();
    expect(state.socket).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.inRoom).toBe(false);
    expect(state.roomId).toBeNull();
    expect(state.currentUser).toBeNull();
    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});

describe('Socket Store - resetSocketState', () => {
  it('disconnects and clears all transient state', () => {
    const mockSocket = {
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
    };
    useSocketStore.setState({
      socket: mockSocket,
      isConnected: true,
      connectionAttempts: 5,
      rateLimitExceeded: true,
      aventuraIniciada: true,
    });

    useSocketStore.getState().resetSocketState();

    const state = useSocketStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.connectionAttempts).toBe(0);
    expect(state.rateLimitExceeded).toBe(false);
    expect(state.aventuraIniciada).toBe(false);
  });
});

// ===========================================================================
// setSocketToken / clearSocketToken
// ===========================================================================

describe('Socket Store - token management', () => {
  it('setSocketToken stores the token', () => {
    useSocketStore.getState().setSocketToken('abc-123');
    expect(useSocketStore.getState().socketToken).toBe('abc-123');
  });

  it('clearSocketToken removes the token', () => {
    useSocketStore.setState({ socketToken: 'existing' });
    useSocketStore.getState().clearSocketToken();
    expect(useSocketStore.getState().socketToken).toBeNull();
  });
});

// ===========================================================================
// Phase machine (faseMachine.js)
// ===========================================================================

describe('Socket Store - FaseMachine (transicaoFase)', () => {
  it('exports all expected phases', () => {
    expect(FASES_VALIDAS).toContain('aguardando_inicio');
    expect(FASES_VALIDAS).toContain('rolagem_inicial');
    expect(FASES_VALIDAS).toContain('rodada_em_andamento');
    expect(FASES_VALIDAS).toContain('entre_rodadas');
    expect(FASES_VALIDAS).toContain('combate');
    expect(FASES_VALIDAS).toContain('finalizado');
  });

  it('allows aguardando_inicio -> rolagem_inicial', () => {
    expect(transicaoFase('aguardando_inicio', 'rolagem_inicial')).toBe('rolagem_inicial');
  });

  it('allows rolagem_inicial -> rodada_em_andamento', () => {
    expect(transicaoFase('rolagem_inicial', 'rodada_em_andamento')).toBe('rodada_em_andamento');
  });

  it('allows rodada_em_andamento -> entre_rodadas', () => {
    expect(transicaoFase('rodada_em_andamento', 'entre_rodadas')).toBe('entre_rodadas');
  });

  it('allows rodada_em_andamento -> combate', () => {
    expect(transicaoFase('rodada_em_andamento', 'combate')).toBe('combate');
  });

  it('allows rodada_em_andamento -> finalizado', () => {
    expect(transicaoFase('rodada_em_andamento', 'finalizado')).toBe('finalizado');
  });

  it('allows entre_rodadas -> rodada_em_andamento', () => {
    expect(transicaoFase('entre_rodadas', 'rodada_em_andamento')).toBe('rodada_em_andamento');
  });

  it('allows entre_rodadas -> finalizado', () => {
    expect(transicaoFase('entre_rodadas', 'finalizado')).toBe('finalizado');
  });

  it('allows combate -> rodada_em_andamento', () => {
    expect(transicaoFase('combate', 'rodada_em_andamento')).toBe('rodada_em_andamento');
  });

  it('allows finalizado -> aguardando_inicio', () => {
    expect(transicaoFase('finalizado', 'aguardando_inicio')).toBe('aguardando_inicio');
  });

  it('rejects invalid transitions (returns current phase)', () => {
    // aguardando_inicio cannot go directly to combate
    expect(transicaoFase('aguardando_inicio', 'combate')).toBe('aguardando_inicio');
  });

  it('returns same phase for no-op transitions', () => {
    expect(transicaoFase('combate', 'combate')).toBe('combate');
  });
});

// ===========================================================================
// DTOs (normalizers)
// ===========================================================================

describe('Socket Store - DTOs', () => {
  let dtos;
  beforeEach(async () => {
    dtos = await import('../../store/socket/dtos.js');
  });

  describe('normalizeMonstro', () => {
    it('normalizes hp fields from camelCase', () => {
      const raw = { id: 1, nome: 'Goblin', hpAtual: 10, hpMax: 20 };
      const result = dtos.normalizeMonstro(raw);
      expect(result.hp_atual).toBe(10);
      expect(result.hp_max).toBe(20);
      expect(result.nome).toBe('Goblin');
      expect(result.status).toBe('vivo');
    });

    it('defaults missing fields', () => {
      const result = dtos.normalizeMonstro({ id: 2 });
      expect(result.nome).toBe('Monstro');
      expect(result.nivel).toBe(1);
      expect(result.hp_atual).toBe(0);
      expect(result.armadura).toBe(0);
    });

    it('handles null input', () => {
      expect(dtos.normalizeMonstro(null)).toBeNull();
    });
  });

  describe('normalizeJogadorStats', () => {
    it('normalizes camelCase stat fields', () => {
      const result = dtos.normalizeJogadorStats({ hpAtual: 50, hpMax: 100, manaAtual: 30, manaMax: 60 });
      expect(result.hp_atual).toBe(50);
      expect(result.hp_max).toBe(100);
      expect(result.mana_atual).toBe(30);
      expect(result.mana_max).toBe(60);
      expect(result.status).toBe('vivo');
    });

    it('handles null input', () => {
      expect(dtos.normalizeJogadorStats(null)).toBeNull();
    });
  });

  describe('normalizeCombateIniciado', () => {
    it('returns normalized monstros and jogadores', () => {
      const result = dtos.normalizeCombateIniciado({
        monstros: [{ id: 1, nome: 'Orc', hpAtual: 20, hpMax: 20 }],
        jogadores: {
          '10': { hpAtual: 50, hpMax: 100 },
        },
        rodada: 1,
      });
      expect(result.monstros).toHaveLength(1);
      expect(result.monstros[0].hp_atual).toBe(20);
      expect(result.jogadores['10'].hp_atual).toBe(50);
      expect(result.rodada).toBe(1);
    });
  });

  describe('normalizeCombateFinalizado', () => {
    it('normalizes resultado and xpTotal', () => {
      const result = dtos.normalizeCombateFinalizado({ resultado: 'vitoria', xpTotal: 150 });
      expect(result.resultado).toBe('vitoria');
      expect(result.xpTotal).toBe(150);
    });

    it('defaults missing fields', () => {
      const result = dtos.normalizeCombateFinalizado({});
      expect(result.resultado).toBeNull();
      expect(result.xpTotal).toBe(0);
    });
  });

  describe('normalizeResultadoAcao', () => {
    it('normalizes attack result', () => {
      const result = dtos.normalizeResultadoAcao({
        tipo: 'ataque_jogador',
        acertou: true,
        critico: false,
        dano: 12,
        hpRestante: 8,
      });
      expect(result.tipo).toBe('ataque_jogador');
      expect(result.acertou).toBe(true);
      expect(result.dano).toBe(12);
      expect(result.hpRestante).toBe(8);
    });
  });

  describe('normalizeJogadorFerido', () => {
    it('normalizes player injured data', () => {
      const result = dtos.normalizeJogadorFerido({
        userId: 'u1',
        nome: 'Kaelren',
        hpAtual: 5,
        derrotado: false,
        dano: 10,
      });
      expect(result.userId).toBe('u1');
      expect(result.hp_atual).toBe(5);
      expect(result.derrotado).toBe(false);
    });
  });
});
