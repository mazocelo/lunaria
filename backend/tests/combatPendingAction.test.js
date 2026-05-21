import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies that combatPendingAction imports
vi.mock('../helpers/logger.js', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })
  }
}));

vi.mock('../websocket/utils/testePipeline.js', () => ({
  limparTestePendente: vi.fn(),
  compactarTestesPendentes: vi.fn()
}));

vi.mock('../websocket/utils/turnStateMachine.js', () => ({
  TURN_STATUS: {
    IDLE: 'idle',
    STARTING: 'starting',
    ACTIVE: 'active',
    AWAITING_ROLL: 'awaiting_roll',
    RESOLVING_ROLL: 'resolving_roll',
    FINISHING: 'finishing'
  }
}));

import {
  createPendingCombatAction,
  getPendingCombatAction,
  hasPendingCombatAction,
  resolvePendingCombatAction,
  cleanupStalePendingCombatAction,
  clearPendingCombatAction
} from '../websocket/utils/combatPendingAction.js';

import { limparTestePendente, compactarTestesPendentes } from '../websocket/utils/testePipeline.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createMockSessao(acaoPendente = undefined) {
  const sessao = {
    estadoJogo: {}
  };
  if (acaoPendente !== undefined) {
    sessao.estadoJogo.acaoPendenteCombate = acaoPendente;
  }
  return sessao;
}

function createDefaultParams(overrides = {}) {
  return {
    tipo: 'atacar',
    userId: 'user-1',
    personagem: { nome: 'Aldaric', classe: 'Mago' },
    combatIntent: { tipo: 'atacar', alvo: 'Goblin' },
    testeId: 'teste-123',
    statusEfeitos: [{ nome: 'envenenado' }],
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// createPendingCombatAction
// ---------------------------------------------------------------------------
describe('createPendingCombatAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a pending action with all provided fields', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();
    const result = createPendingCombatAction(sessao, params);

    expect(result.tipo).toBe('atacar');
    expect(result.userId).toBe('user-1');
    expect(result.personagem).toEqual({ nome: 'Aldaric', classe: 'Mago' });
    expect(result.combatIntent).toEqual({ tipo: 'atacar', alvo: 'Goblin' });
    expect(result.testeId).toBe('teste-123');
    expect(result.statusEfeitos).toEqual([{ nome: 'envenenado' }]);
    expect(result.criadoEm).toBeDefined();
    expect(typeof result.criadoEm).toBe('string');
  });

  it('stores the action on sessao.estadoJogo.acaoPendenteCombate', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();
    createPendingCombatAction(sessao, params);

    expect(sessao.estadoJogo.acaoPendenteCombate).toBeDefined();
    expect(sessao.estadoJogo.acaoPendenteCombate.tipo).toBe('atacar');
  });

  it('initializes estadoJogo when absent', () => {
    const sessao = {};
    const params = createDefaultParams();
    createPendingCombatAction(sessao, params);

    expect(sessao.estadoJogo).toBeDefined();
    expect(sessao.estadoJogo.acaoPendenteCombate).toBeDefined();
  });

  it('sets testeId to null when not provided', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();
    delete params.testeId;
    const result = createPendingCombatAction(sessao, params);

    expect(result.testeId).toBeNull();
  });

  it('defaults statusEfeitos to empty array when not provided', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();
    delete params.statusEfeitos;
    const result = createPendingCombatAction(sessao, params);

    expect(result.statusEfeitos).toEqual([]);
  });

  it('includes extra fields via rest params', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams({ customField: 'value', priority: 5 });
    const result = createPendingCombatAction(sessao, params);

    expect(result.customField).toBe('value');
    expect(result.priority).toBe(5);
  });

  it('sets criadoEm to a valid ISO date string', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();
    const before = new Date().toISOString();
    const result = createPendingCombatAction(sessao, params);
    const after = new Date().toISOString();

    expect(new Date(result.criadoEm).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
    expect(new Date(result.criadoEm).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
  });

  it('overwrites a previous pending action', () => {
    const sessao = createMockSessao({
      tipo: 'old',
      userId: 'old-user',
      personagem: null,
      combatIntent: null,
      testeId: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    });
    const params = createDefaultParams({ tipo: 'new-action' });
    createPendingCombatAction(sessao, params);

    expect(sessao.estadoJogo.acaoPendenteCombate.tipo).toBe('new-action');
  });

  it('returns the created action object', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();
    const result = createPendingCombatAction(sessao, params);

    expect(result).toBe(sessao.estadoJogo.acaoPendenteCombate);
  });
});

// ---------------------------------------------------------------------------
// getPendingCombatAction
// ---------------------------------------------------------------------------
describe('getPendingCombatAction', () => {
  it('returns the pending action when it exists', () => {
    const acaoPendente = { tipo: 'atacar', userId: 'u1' };
    const sessao = createMockSessao(acaoPendente);

    expect(getPendingCombatAction(sessao)).toBe(acaoPendente);
  });

  it('returns null when no pending action exists', () => {
    const sessao = createMockSessao();
    expect(getPendingCombatAction(sessao)).toBeNull();
  });

  it('returns null when estadoJogo is missing', () => {
    expect(getPendingCombatAction({})).toBeNull();
  });

  it('returns null when sessao is null', () => {
    expect(getPendingCombatAction(null)).toBeNull();
  });

  it('returns null when sessao is undefined', () => {
    expect(getPendingCombatAction(undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hasPendingCombatAction
// ---------------------------------------------------------------------------
describe('hasPendingCombatAction', () => {
  it('returns true when a pending action exists', () => {
    const sessao = createMockSessao({ tipo: 'atacar' });
    expect(hasPendingCombatAction(sessao)).toBe(true);
  });

  it('returns false when no pending action exists', () => {
    const sessao = createMockSessao();
    expect(hasPendingCombatAction(sessao)).toBe(false);
  });

  it('returns false when estadoJogo is missing', () => {
    expect(hasPendingCombatAction({})).toBe(false);
  });

  it('returns false when sessao is null', () => {
    expect(hasPendingCombatAction(null)).toBe(false);
  });

  it('returns false when sessao is undefined', () => {
    expect(hasPendingCombatAction(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolvePendingCombatAction
// ---------------------------------------------------------------------------
describe('resolvePendingCombatAction', () => {
  it('resolves the pending action when testeId matches', () => {
    const sessao = createMockSessao({
      tipo: 'atacar',
      userId: 'u1',
      testeId: 'teste-abc',
      personagem: { nome: 'Hero' },
      combatIntent: { tipo: 'atacar' },
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    });

    const testeResolvido = { id: 'teste-abc', resultado: 15 };
    const result = resolvePendingCombatAction(sessao, testeResolvido);

    expect(result).toBeDefined();
    expect(result.tipo).toBe('atacar');
    expect(result.testeId).toBe('teste-abc');
    // Action should be removed from session
    expect(sessao.estadoJogo.acaoPendenteCombate).toBeUndefined();
  });

  it('returns null when testeId does not match', () => {
    const sessao = createMockSessao({
      tipo: 'atacar',
      testeId: 'teste-abc',
      userId: 'u1',
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    });

    const testeResolvido = { id: 'teste-different' };
    const result = resolvePendingCombatAction(sessao, testeResolvido);

    expect(result).toBeNull();
    // Action should remain
    expect(sessao.estadoJogo.acaoPendenteCombate).toBeDefined();
  });

  it('returns null when no pending action exists', () => {
    const sessao = createMockSessao();
    const result = resolvePendingCombatAction(sessao, { id: 'teste-1' });
    expect(result).toBeNull();
  });

  it('returns null when testeResolvido is null', () => {
    const sessao = createMockSessao({
      tipo: 'atacar',
      testeId: 'teste-abc',
      userId: 'u1',
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    });

    const result = resolvePendingCombatAction(sessao, null);
    expect(result).toBeNull();
  });

  it('returns null when testeResolvido is undefined', () => {
    const sessao = createMockSessao({
      tipo: 'atacar',
      testeId: 'teste-abc',
      userId: 'u1',
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    });

    const result = resolvePendingCombatAction(sessao, undefined);
    expect(result).toBeNull();
  });

  it('returns a copy of the action, not the original reference', () => {
    const original = {
      tipo: 'atacar',
      userId: 'u1',
      testeId: 'teste-x',
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    };
    const sessao = createMockSessao(original);

    const result = resolvePendingCombatAction(sessao, { id: 'teste-x' });
    expect(result).not.toBe(original);
    expect(result.tipo).toBe(original.tipo);
  });

  it('matches when both testeId and testeResolvido.id are null', () => {
    const sessao = createMockSessao({
      tipo: 'atacar',
      testeId: null,
      userId: 'u1',
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString()
    });

    // testeResolvido.id is undefined, which !== null
    // acaoPendente.testeId is null
    // null !== undefined, so this should NOT match
    const result = resolvePendingCombatAction(sessao, { });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cleanupStalePendingCombatAction
// ---------------------------------------------------------------------------
describe('cleanupStalePendingCombatAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when no pending action exists', () => {
    const sessao = createMockSessao();
    expect(cleanupStalePendingCombatAction(sessao)).toBe(false);
  });

  it('returns false when action is not stale (within 5 minutes)', () => {
    const sessao = createMockSessao({
      tipo: 'atacar',
      userId: 'u1',
      testeId: null,
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: new Date().toISOString() // just now — not stale
    });

    expect(cleanupStalePendingCombatAction(sessao)).toBe(false);
    expect(sessao.estadoJogo.acaoPendenteCombate).toBeDefined();
  });

  it('cleans up a stale action (older than 5 minutes)', () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const sessao = createMockSessao({
      tipo: 'atacar',
      userId: 'u1',
      testeId: null,
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: sixMinutesAgo
    });

    const result = cleanupStalePendingCombatAction(sessao);
    expect(result).toBe(true);
    expect(sessao.estadoJogo.acaoPendenteCombate).toBeUndefined();
  });

  it('calls limparTestePendente and compactarTestesPendentes when testeId is present', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const sessao = createMockSessao({
      tipo: 'atacar',
      userId: 'u1',
      testeId: 'teste-stale-1',
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: tenMinutesAgo
    });

    cleanupStalePendingCombatAction(sessao);

    expect(limparTestePendente).toHaveBeenCalledWith(sessao, {
      testId: 'teste-stale-1',
      nextTurnState: 'active',
      mode: 'cancel'
    });
    expect(compactarTestesPendentes).toHaveBeenCalledWith(sessao);
  });

  it('does not call limparTestePendente when testeId is null', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const sessao = createMockSessao({
      tipo: 'atacar',
      userId: 'u1',
      testeId: null,
      personagem: null,
      combatIntent: null,
      statusEfeitos: [],
      criadoEm: tenMinutesAgo
    });

    cleanupStalePendingCombatAction(sessao);

    expect(limparTestePendente).not.toHaveBeenCalled();
    expect(compactarTestesPendentes).not.toHaveBeenCalled();
  });

  it('does not clean up action at exactly 5 minutes', () => {
    // Congela o relogio para que o Date.now() do teste e o do helper coincidam:
    // a condicao de borda usa <= STALE_THRESHOLD_MS e e sensivel a qualquer
    // milissegundo decorrido entre montar a sessao e chamar o cleanup.
    vi.useFakeTimers();
    try {
      const exactlyFiveMinutes = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const sessao = createMockSessao({
        tipo: 'atacar',
        userId: 'u1',
        testeId: null,
        personagem: null,
        combatIntent: null,
        statusEfeitos: [],
        criadoEm: exactlyFiveMinutes
      });

      // At exactly 5 min, Date.now() - criadoEm === STALE_THRESHOLD_MS,
      // condition is <= so it should NOT clean up
      expect(cleanupStalePendingCombatAction(sessao)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// clearPendingCombatAction
// ---------------------------------------------------------------------------
describe('clearPendingCombatAction', () => {
  it('clears the pending action', () => {
    const sessao = createMockSessao({ tipo: 'atacar' });
    clearPendingCombatAction(sessao);
    expect(sessao.estadoJogo.acaoPendenteCombate).toBeUndefined();
  });

  it('does nothing when no pending action exists', () => {
    const sessao = createMockSessao();
    expect(() => clearPendingCombatAction(sessao)).not.toThrow();
  });

  it('does nothing when estadoJogo is missing', () => {
    expect(() => clearPendingCombatAction({})).not.toThrow();
  });

  it('does nothing when sessao is null', () => {
    expect(() => clearPendingCombatAction(null)).not.toThrow();
  });

  it('does nothing when sessao is undefined', () => {
    expect(() => clearPendingCombatAction(undefined)).not.toThrow();
  });

  it('does not call limparTestePendente (unlike cleanup)', () => {
    vi.clearAllMocks();
    const sessao = createMockSessao({
      tipo: 'atacar',
      testeId: 'teste-1',
      criadoEm: new Date().toISOString()
    });
    clearPendingCombatAction(sessao);
    expect(limparTestePendente).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Full lifecycle integration
// ---------------------------------------------------------------------------
describe('combatPendingAction lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create -> has -> get -> resolve lifecycle', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams({ testeId: 'lifecycle-test' });

    // Create
    const created = createPendingCombatAction(sessao, params);
    expect(created.tipo).toBe('atacar');

    // Has
    expect(hasPendingCombatAction(sessao)).toBe(true);

    // Get
    const got = getPendingCombatAction(sessao);
    expect(got).toBe(created);

    // Resolve
    const resolved = resolvePendingCombatAction(sessao, { id: 'lifecycle-test' });
    expect(resolved.tipo).toBe('atacar');
    expect(resolved.testeId).toBe('lifecycle-test');

    // After resolve
    expect(hasPendingCombatAction(sessao)).toBe(false);
    expect(getPendingCombatAction(sessao)).toBeNull();
  });

  it('create -> has -> clear lifecycle', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams();

    createPendingCombatAction(sessao, params);
    expect(hasPendingCombatAction(sessao)).toBe(true);

    clearPendingCombatAction(sessao);
    expect(hasPendingCombatAction(sessao)).toBe(false);
    expect(getPendingCombatAction(sessao)).toBeNull();
  });

  it('create -> stale cleanup lifecycle', () => {
    const sessao = createMockSessao();
    const params = createDefaultParams({ testeId: 'stale-test' });

    createPendingCombatAction(sessao, params);
    expect(hasPendingCombatAction(sessao)).toBe(true);

    // Manually backdate criadoEm to make it stale
    sessao.estadoJogo.acaoPendenteCombate.criadoEm = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const cleaned = cleanupStalePendingCombatAction(sessao);
    expect(cleaned).toBe(true);
    expect(hasPendingCombatAction(sessao)).toBe(false);
    expect(limparTestePendente).toHaveBeenCalled();
    expect(compactarTestesPendentes).toHaveBeenCalled();
  });
});
