const TURN_STATUS = {
  IDLE: 'idle',
  STARTING: 'starting',
  ACTIVE: 'active',
  AWAITING_ROLL: 'awaiting_roll',
  RESOLVING_ROLL: 'resolving_roll',
  FINISHING: 'finishing'
};

function ensureEstadoJogo(sessao = {}) {
  if (!sessao.estadoJogo) {
    sessao.estadoJogo = {};
  }
  return sessao.estadoJogo;
}

function deriveLegacyTurnoIniciado(status) {
  return [TURN_STATUS.STARTING, TURN_STATUS.ACTIVE, TURN_STATUS.AWAITING_ROLL, TURN_STATUS.RESOLVING_ROLL].includes(status);
}

export function getTurnState(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  const turno = estadoJogo.turno || {};

  return {
    status: turno.status || (estadoJogo.turnoIniciado ? TURN_STATUS.ACTIVE : TURN_STATUS.IDLE),
    jogadorAtual: turno.jogadorAtual ?? null,
    rodadaAtual: turno.rodadaAtual ?? estadoJogo.rodadaAtual ?? 1,
    contadorInteracoes: turno.contadorInteracoes ?? estadoJogo.contadorMensagensTurno ?? 0,
    iniciadoEm: turno.iniciadoEm ?? null,
    lockReason: turno.lockReason ?? null,
    loteTesteAtivo: turno.loteTesteAtivo ?? null
  };
}

export function syncTurnAliases(sessao = {}) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const turno = getTurnState(sessao);

  estadoJogo.turno = turno;
  estadoJogo.turnoIniciado = deriveLegacyTurnoIniciado(turno.status);
  estadoJogo.contadorMensagensTurno = turno.contadorInteracoes;
  estadoJogo.rodadaAtual = turno.rodadaAtual;
  return turno;
}

export function transitionTurnState(sessao = {}, nextState, metadata = {}) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const current = getTurnState(sessao);
  const turno = {
    ...current,
    ...metadata,
    status: nextState,
    iniciadoEm: metadata.iniciadoEm !== undefined
      ? metadata.iniciadoEm
      : (nextState === TURN_STATUS.STARTING && !current.iniciadoEm ? new Date().toISOString() : current.iniciadoEm)
  };

  if (nextState === TURN_STATUS.IDLE) {
    turno.lockReason = null;
  }

  estadoJogo.turno = turno;
  return syncTurnAliases(sessao);
}

export function incrementTurnInteractions(sessao = {}) {
  const turno = getTurnState(sessao);
  return transitionTurnState(sessao, turno.status, {
    contadorInteracoes: (turno.contadorInteracoes || 0) + 1
  });
}

export function resetTurnInteractions(sessao = {}) {
  const turno = getTurnState(sessao);
  return transitionTurnState(sessao, turno.status, {
    contadorInteracoes: 0
  });
}

export function buildTurnEventPayload(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  const turno = getTurnState(sessao);
  const testesPendentes = Array.isArray(estadoJogo.testesPendentes)
    ? estadoJogo.testesPendentes.filter(teste => teste?.status === 'pending')
    : [];

  return {
    turno: {
      status: turno.status,
      jogadorAtual: turno.jogadorAtual,
      rodadaAtual: turno.rodadaAtual,
      contadorInteracoes: turno.contadorInteracoes,
      lockReason: turno.lockReason,
      loteTesteAtivo: turno.loteTesteAtivo
    },
    testesPendentes,
    testePendente: estadoJogo.testePendente || testesPendentes[0] || null
  };
}

export { TURN_STATUS };
