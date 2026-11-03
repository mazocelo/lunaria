import { describe, it, expect } from 'vitest';
import {
  TURN_STATUS,
  getTurnState,
  syncTurnAliases,
  transitionTurnState,
  incrementTurnInteractions,
  resetTurnInteractions,
  buildTurnEventPayload,
} from '../websocket/utils/turnStateMachine.js';

// ── helpers ──

function makeSessao(turnoOverrides = {}, estadoJogoOverrides = {}) {
  return {
    estadoJogo: {
      turno: {
        status: TURN_STATUS.IDLE,
        jogadorAtual: null,
        rodadaAtual: 1,
        contadorInteracoes: 0,
        iniciadoEm: null,
        lockReason: null,
        loteTesteAtivo: null,
        ...turnoOverrides,
      },
      ...estadoJogoOverrides,
    },
  };
}

// ── TURN_STATUS constants ──

describe('TURN_STATUS', () => {
  it('exposes all expected status values', () => {
    expect(TURN_STATUS.IDLE).toBe('idle');
    expect(TURN_STATUS.STARTING).toBe('starting');
    expect(TURN_STATUS.ACTIVE).toBe('active');
    expect(TURN_STATUS.AWAITING_ROLL).toBe('awaiting_roll');
    expect(TURN_STATUS.RESOLVING_ROLL).toBe('resolving_roll');
    expect(TURN_STATUS.FINISHING).toBe('finishing');
  });

  it('has exactly 6 statuses', () => {
    expect(Object.keys(TURN_STATUS)).toHaveLength(6);
  });
});

// ── getTurnState ──

describe('getTurnState', () => {
  it('returns full turn state from a well-formed session', () => {
    const sessao = makeSessao({
      status: TURN_STATUS.ACTIVE,
      jogadorAtual: 'player1',
      rodadaAtual: 3,
      contadorInteracoes: 5,
      iniciadoEm: '2026-01-01T00:00:00.000Z',
      lockReason: 'rolling',
      loteTesteAtivo: 'lote-abc',
    });
    const state = getTurnState(sessao);

    expect(state.status).toBe(TURN_STATUS.ACTIVE);
    expect(state.jogadorAtual).toBe('player1');
    expect(state.rodadaAtual).toBe(3);
    expect(state.contadorInteracoes).toBe(5);
    expect(state.iniciadoEm).toBe('2026-01-01T00:00:00.000Z');
    expect(state.lockReason).toBe('rolling');
    expect(state.loteTesteAtivo).toBe('lote-abc');
  });

  it('defaults to IDLE when turno is missing and turnoIniciado is false', () => {
    const sessao = { estadoJogo: {} };
    const state = getTurnState(sessao);
    expect(state.status).toBe(TURN_STATUS.IDLE);
  });

  it('defaults to ACTIVE when turno is missing and turnoIniciado is true', () => {
    const sessao = { estadoJogo: { turnoIniciado: true } };
    const state = getTurnState(sessao);
    expect(state.status).toBe(TURN_STATUS.ACTIVE);
  });

  it('falls back to legacy rodadaAtual from estadoJogo', () => {
    const sessao = { estadoJogo: { rodadaAtual: 7 } };
    const state = getTurnState(sessao);
    expect(state.rodadaAtual).toBe(7);
  });

  it('falls back to legacy contadorMensagensTurno from estadoJogo', () => {
    const sessao = { estadoJogo: { contadorMensagensTurno: 12 } };
    const state = getTurnState(sessao);
    expect(state.contadorInteracoes).toBe(12);
  });

  it('handles empty object session', () => {
    const state = getTurnState({});
    expect(state.status).toBe(TURN_STATUS.IDLE);
    expect(state.jogadorAtual).toBeNull();
    expect(state.rodadaAtual).toBe(1);
    expect(state.contadorInteracoes).toBe(0);
    expect(state.iniciadoEm).toBeNull();
    expect(state.lockReason).toBeNull();
    expect(state.loteTesteAtivo).toBeNull();
  });

  it('handles undefined session (default parameter)', () => {
    const state = getTurnState();
    expect(state.status).toBe(TURN_STATUS.IDLE);
    expect(state.rodadaAtual).toBe(1);
    expect(state.contadorInteracoes).toBe(0);
  });

  it('handles null session gracefully via default', () => {
    // default param won't fire for null, but estadoJogo access will use ||
    const state = getTurnState(null);
    expect(state.status).toBe(TURN_STATUS.IDLE);
  });
});

// ── syncTurnAliases ──

describe('syncTurnAliases', () => {
  it('writes turno object into estadoJogo', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 3, rodadaAtual: 2 });
    syncTurnAliases(sessao);

    expect(sessao.estadoJogo.turno).toBeDefined();
    expect(sessao.estadoJogo.turno.status).toBe(TURN_STATUS.ACTIVE);
  });

  it('sets turnoIniciado to true for ACTIVE status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.turnoIniciado).toBe(true);
  });

  it('sets turnoIniciado to true for STARTING status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.STARTING });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.turnoIniciado).toBe(true);
  });

  it('sets turnoIniciado to true for AWAITING_ROLL status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.AWAITING_ROLL });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.turnoIniciado).toBe(true);
  });

  it('sets turnoIniciado to true for RESOLVING_ROLL status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.RESOLVING_ROLL });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.turnoIniciado).toBe(true);
  });

  it('sets turnoIniciado to false for IDLE status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.IDLE });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.turnoIniciado).toBe(false);
  });

  it('sets turnoIniciado to false for FINISHING status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.FINISHING });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.turnoIniciado).toBe(false);
  });

  it('syncs contadorMensagensTurno alias', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 7 });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.contadorMensagensTurno).toBe(7);
  });

  it('syncs rodadaAtual alias', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, rodadaAtual: 4 });
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo.rodadaAtual).toBe(4);
  });

  it('returns the turno snapshot', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE });
    const result = syncTurnAliases(sessao);
    expect(result.status).toBe(TURN_STATUS.ACTIVE);
  });

  it('creates estadoJogo when missing', () => {
    const sessao = {};
    syncTurnAliases(sessao);
    expect(sessao.estadoJogo).toBeDefined();
    expect(sessao.estadoJogo.turno).toBeDefined();
  });

  it('handles undefined session (default parameter)', () => {
    // Should not throw
    const result = syncTurnAliases();
    expect(result.status).toBe(TURN_STATUS.IDLE);
  });
});

// ── transitionTurnState ──

describe('transitionTurnState', () => {
  it('transitions IDLE → STARTING', () => {
    const sessao = makeSessao({ status: TURN_STATUS.IDLE });
    const result = transitionTurnState(sessao, TURN_STATUS.STARTING);

    expect(result.status).toBe(TURN_STATUS.STARTING);
    expect(sessao.estadoJogo.turno.status).toBe(TURN_STATUS.STARTING);
  });

  it('transitions STARTING → ACTIVE', () => {
    const sessao = makeSessao({ status: TURN_STATUS.STARTING });
    const result = transitionTurnState(sessao, TURN_STATUS.ACTIVE);
    expect(result.status).toBe(TURN_STATUS.ACTIVE);
  });

  it('transitions ACTIVE → AWAITING_ROLL', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE });
    const result = transitionTurnState(sessao, TURN_STATUS.AWAITING_ROLL);
    expect(result.status).toBe(TURN_STATUS.AWAITING_ROLL);
  });

  it('transitions AWAITING_ROLL → RESOLVING_ROLL', () => {
    const sessao = makeSessao({ status: TURN_STATUS.AWAITING_ROLL });
    const result = transitionTurnState(sessao, TURN_STATUS.RESOLVING_ROLL);
    expect(result.status).toBe(TURN_STATUS.RESOLVING_ROLL);
  });

  it('transitions RESOLVING_ROLL → FINISHING', () => {
    const sessao = makeSessao({ status: TURN_STATUS.RESOLVING_ROLL });
    const result = transitionTurnState(sessao, TURN_STATUS.FINISHING);
    expect(result.status).toBe(TURN_STATUS.FINISHING);
  });

  it('transitions FINISHING → IDLE', () => {
    const sessao = makeSessao({ status: TURN_STATUS.FINISHING });
    const result = transitionTurnState(sessao, TURN_STATUS.IDLE);
    expect(result.status).toBe(TURN_STATUS.IDLE);
  });

  it('sets iniciadoEm automatically when transitioning to STARTING without one', () => {
    const sessao = makeSessao({ status: TURN_STATUS.IDLE, iniciadoEm: null });
    const before = new Date().toISOString();
    const result = transitionTurnState(sessao, TURN_STATUS.STARTING);
    const after = new Date().toISOString();

    expect(result.iniciadoEm).toBeDefined();
    expect(result.iniciadoEm).not.toBeNull();
    expect(result.iniciadoEm >= before).toBe(true);
    expect(result.iniciadoEm <= after).toBe(true);
  });

  it('does not overwrite existing iniciadoEm when transitioning to STARTING', () => {
    const ts = '2025-06-15T12:00:00.000Z';
    const sessao = makeSessao({ status: TURN_STATUS.IDLE, iniciadoEm: ts });
    const result = transitionTurnState(sessao, TURN_STATUS.STARTING);
    expect(result.iniciadoEm).toBe(ts);
  });

  it('allows explicit iniciadoEm override in metadata', () => {
    const ts = '2099-12-31T23:59:59.000Z';
    const sessao = makeSessao({ status: TURN_STATUS.IDLE });
    const result = transitionTurnState(sessao, TURN_STATUS.STARTING, { iniciadoEm: ts });
    expect(result.iniciadoEm).toBe(ts);
  });

  it('allows iniciadoEm null override in metadata', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, iniciadoEm: '2025-01-01T00:00:00.000Z' });
    const result = transitionTurnState(sessao, TURN_STATUS.FINISHING, { iniciadoEm: null });
    expect(result.iniciadoEm).toBeNull();
  });

  it('clears lockReason when transitioning to IDLE', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, lockReason: 'processing' });
    const result = transitionTurnState(sessao, TURN_STATUS.IDLE);
    expect(result.lockReason).toBeNull();
  });

  it('preserves lockReason for non-IDLE transitions', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, lockReason: 'rolling' });
    const result = transitionTurnState(sessao, TURN_STATUS.AWAITING_ROLL);
    expect(result.lockReason).toBe('rolling');
  });

  it('merges metadata into turno state', () => {
    const sessao = makeSessao({ status: TURN_STATUS.IDLE });
    const result = transitionTurnState(sessao, TURN_STATUS.STARTING, {
      jogadorAtual: 'hero42',
      rodadaAtual: 5,
    });
    expect(result.jogadorAtual).toBe('hero42');
    expect(result.rodadaAtual).toBe(5);
  });

  it('syncs legacy aliases after transition', () => {
    const sessao = makeSessao({ status: TURN_STATUS.IDLE, contadorInteracoes: 0 });
    transitionTurnState(sessao, TURN_STATUS.ACTIVE, { contadorInteracoes: 3, rodadaAtual: 2 });

    expect(sessao.estadoJogo.turnoIniciado).toBe(true);
    expect(sessao.estadoJogo.contadorMensagensTurno).toBe(3);
    expect(sessao.estadoJogo.rodadaAtual).toBe(2);
  });

  it('does not enforce valid transition order (no guard)', () => {
    // The machine does not restrict which transitions are valid;
    // any state can move to any other state
    const sessao = makeSessao({ status: TURN_STATUS.IDLE });
    const result = transitionTurnState(sessao, TURN_STATUS.FINISHING);
    expect(result.status).toBe(TURN_STATUS.FINISHING);
  });

  it('creates estadoJogo when session has none', () => {
    const sessao = {};
    const result = transitionTurnState(sessao, TURN_STATUS.STARTING);
    expect(sessao.estadoJogo).toBeDefined();
    expect(result.status).toBe(TURN_STATUS.STARTING);
  });

  it('handles undefined session (default parameter)', () => {
    const result = transitionTurnState(undefined, TURN_STATUS.IDLE);
    expect(result.status).toBe(TURN_STATUS.IDLE);
  });
});

// ── incrementTurnInteractions ──

describe('incrementTurnInteractions', () => {
  it('increments counter from 0 to 1', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 0 });
    const result = incrementTurnInteractions(sessao);
    expect(result.contadorInteracoes).toBe(1);
  });

  it('increments counter from 5 to 6', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 5 });
    const result = incrementTurnInteractions(sessao);
    expect(result.contadorInteracoes).toBe(6);
  });

  it('preserves current status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.AWAITING_ROLL, contadorInteracoes: 2 });
    const result = incrementTurnInteractions(sessao);
    expect(result.status).toBe(TURN_STATUS.AWAITING_ROLL);
    expect(result.contadorInteracoes).toBe(3);
  });

  it('syncs legacy alias after increment', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 10 });
    incrementTurnInteractions(sessao);
    expect(sessao.estadoJogo.contadorMensagensTurno).toBe(11);
  });

  it('handles session with no prior counter (defaults to 0 + 1)', () => {
    const sessao = { estadoJogo: { turno: { status: TURN_STATUS.ACTIVE } } };
    const result = incrementTurnInteractions(sessao);
    expect(result.contadorInteracoes).toBe(1);
  });

  it('handles empty session', () => {
    const result = incrementTurnInteractions({});
    expect(result.contadorInteracoes).toBe(1);
  });
});

// ── resetTurnInteractions ──

describe('resetTurnInteractions', () => {
  it('resets counter to 0', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 15 });
    const result = resetTurnInteractions(sessao);
    expect(result.contadorInteracoes).toBe(0);
  });

  it('preserves current status', () => {
    const sessao = makeSessao({ status: TURN_STATUS.RESOLVING_ROLL, contadorInteracoes: 8 });
    const result = resetTurnInteractions(sessao);
    expect(result.status).toBe(TURN_STATUS.RESOLVING_ROLL);
    expect(result.contadorInteracoes).toBe(0);
  });

  it('syncs legacy alias after reset', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 20 });
    resetTurnInteractions(sessao);
    expect(sessao.estadoJogo.contadorMensagensTurno).toBe(0);
  });

  it('is idempotent when already 0', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 0 });
    const result = resetTurnInteractions(sessao);
    expect(result.contadorInteracoes).toBe(0);
  });

  it('handles empty session', () => {
    const result = resetTurnInteractions({});
    expect(result.contadorInteracoes).toBe(0);
  });
});

// ── buildTurnEventPayload ──

describe('buildTurnEventPayload', () => {
  it('returns turno object with expected keys', () => {
    const sessao = makeSessao({
      status: TURN_STATUS.ACTIVE,
      jogadorAtual: 'p1',
      rodadaAtual: 2,
      contadorInteracoes: 3,
      lockReason: null,
      loteTesteAtivo: 'lote-1',
    });
    const payload = buildTurnEventPayload(sessao);

    expect(payload.turno).toBeDefined();
    expect(payload.turno.status).toBe(TURN_STATUS.ACTIVE);
    expect(payload.turno.jogadorAtual).toBe('p1');
    expect(payload.turno.rodadaAtual).toBe(2);
    expect(payload.turno.contadorInteracoes).toBe(3);
    expect(payload.turno.lockReason).toBeNull();
    expect(payload.turno.loteTesteAtivo).toBe('lote-1');
  });

  it('does not expose iniciadoEm in turno payload', () => {
    const sessao = makeSessao({ iniciadoEm: '2026-01-01T00:00:00.000Z' });
    const payload = buildTurnEventPayload(sessao);
    expect(payload.turno.iniciadoEm).toBeUndefined();
  });

  it('returns empty testesPendentes when none exist', () => {
    const sessao = makeSessao();
    const payload = buildTurnEventPayload(sessao);
    expect(payload.testesPendentes).toEqual([]);
  });

  it('filters testesPendentes to only pending status', () => {
    const sessao = makeSessao({}, {
      testesPendentes: [
        { id: 't1', status: 'pending' },
        { id: 't2', status: 'resolved' },
        { id: 't3', status: 'pending' },
      ],
    });
    const payload = buildTurnEventPayload(sessao);

    expect(payload.testesPendentes).toHaveLength(2);
    expect(payload.testesPendentes[0].id).toBe('t1');
    expect(payload.testesPendentes[1].id).toBe('t3');
  });

  it('sets testePendente to estadoJogo.testePendente when present', () => {
    const tp = { id: 'custom', status: 'pending' };
    const sessao = makeSessao({}, { testePendente: tp });
    const payload = buildTurnEventPayload(sessao);
    expect(payload.testePendente).toBe(tp);
  });

  it('falls back testePendente to first filtered pending test', () => {
    const sessao = makeSessao({}, {
      testesPendentes: [
        { id: 't1', status: 'resolved' },
        { id: 't2', status: 'pending' },
      ],
    });
    const payload = buildTurnEventPayload(sessao);
    expect(payload.testePendente.id).toBe('t2');
  });

  it('sets testePendente to null when no pending tests and no legacy field', () => {
    const sessao = makeSessao({}, {
      testesPendentes: [{ id: 't1', status: 'resolved' }],
    });
    const payload = buildTurnEventPayload(sessao);
    expect(payload.testePendente).toBeNull();
  });

  it('handles null entries in testesPendentes array', () => {
    const sessao = makeSessao({}, {
      testesPendentes: [null, { id: 't1', status: 'pending' }, undefined],
    });
    const payload = buildTurnEventPayload(sessao);
    expect(payload.testesPendentes).toHaveLength(1);
    expect(payload.testesPendentes[0].id).toBe('t1');
  });

  it('handles non-array testesPendentes gracefully', () => {
    const sessao = makeSessao({}, { testesPendentes: 'not-an-array' });
    const payload = buildTurnEventPayload(sessao);
    expect(payload.testesPendentes).toEqual([]);
  });

  it('handles empty session', () => {
    const payload = buildTurnEventPayload({});
    expect(payload.turno.status).toBe(TURN_STATUS.IDLE);
    expect(payload.testesPendentes).toEqual([]);
    expect(payload.testePendente).toBeNull();
  });

  it('handles undefined session (default parameter)', () => {
    const payload = buildTurnEventPayload();
    expect(payload.turno.status).toBe(TURN_STATUS.IDLE);
    expect(payload.testesPendentes).toEqual([]);
    expect(payload.testePendente).toBeNull();
  });
});

// ── integration: full lifecycle ──

describe('turn lifecycle integration', () => {
  it('runs a full turn lifecycle: IDLE → STARTING → ACTIVE → AWAITING_ROLL → RESOLVING_ROLL → FINISHING → IDLE', () => {
    const sessao = makeSessao({ status: TURN_STATUS.IDLE });

    // Start the turn
    let state = transitionTurnState(sessao, TURN_STATUS.STARTING, { jogadorAtual: 'wizard' });
    expect(state.status).toBe(TURN_STATUS.STARTING);
    expect(state.iniciadoEm).not.toBeNull();
    expect(sessao.estadoJogo.turnoIniciado).toBe(true);

    // Activate
    state = transitionTurnState(sessao, TURN_STATUS.ACTIVE);
    expect(state.status).toBe(TURN_STATUS.ACTIVE);
    expect(sessao.estadoJogo.turnoIniciado).toBe(true);

    // Interact a few times
    incrementTurnInteractions(sessao);
    incrementTurnInteractions(sessao);
    state = incrementTurnInteractions(sessao);
    expect(state.contadorInteracoes).toBe(3);
    expect(sessao.estadoJogo.contadorMensagensTurno).toBe(3);

    // Await roll
    state = transitionTurnState(sessao, TURN_STATUS.AWAITING_ROLL, { lockReason: 'dice_roll' });
    expect(state.status).toBe(TURN_STATUS.AWAITING_ROLL);
    expect(state.lockReason).toBe('dice_roll');

    // Resolve roll
    state = transitionTurnState(sessao, TURN_STATUS.RESOLVING_ROLL);
    expect(state.status).toBe(TURN_STATUS.RESOLVING_ROLL);

    // Finish
    state = transitionTurnState(sessao, TURN_STATUS.FINISHING);
    expect(state.status).toBe(TURN_STATUS.FINISHING);
    expect(sessao.estadoJogo.turnoIniciado).toBe(false);

    // Back to idle
    state = transitionTurnState(sessao, TURN_STATUS.IDLE);
    expect(state.status).toBe(TURN_STATUS.IDLE);
    expect(state.lockReason).toBeNull();
    expect(sessao.estadoJogo.turnoIniciado).toBe(false);

    // Verify payload
    const payload = buildTurnEventPayload(sessao);
    expect(payload.turno.status).toBe(TURN_STATUS.IDLE);
    expect(payload.turno.contadorInteracoes).toBe(3);
  });

  it('resets interactions between turns', () => {
    const sessao = makeSessao({ status: TURN_STATUS.ACTIVE, contadorInteracoes: 10 });

    // Finish current turn
    transitionTurnState(sessao, TURN_STATUS.IDLE);
    resetTurnInteractions(sessao);

    const state = getTurnState(sessao);
    expect(state.contadorInteracoes).toBe(0);
    expect(state.status).toBe(TURN_STATUS.IDLE);

    // Start new turn
    transitionTurnState(sessao, TURN_STATUS.STARTING, { jogadorAtual: 'rogue' });
    incrementTurnInteractions(sessao);

    const newState = getTurnState(sessao);
    expect(newState.contadorInteracoes).toBe(1);
    expect(newState.jogadorAtual).toBe('rogue');
  });
});
