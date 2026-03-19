import { buildTurnEventPayload, transitionTurnState, TURN_STATUS, getTurnState } from './turnStateMachine.js';

function ensureEstadoJogo(sessao = {}) {
  if (!sessao.estadoJogo) {
    sessao.estadoJogo = {};
  }
  return sessao.estadoJogo;
}

function toDifficultyLabel(value) {
  if (value == null) return 'Media';
  return String(value);
}

function createGroupId() {
  return `lote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStatus(status) {
  if (status === 'resolved' || status === 'cancelled' || status === 'pending') {
    return status;
  }
  return 'pending';
}

function normalizeTestePayload(payload = {}, fallbackUserId = null, groupId = null) {
  const status = normalizeStatus(payload.status);
  return {
    id: payload.id || `teste_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    groupId: payload.groupId || groupId || createGroupId(),
    origem: payload.origem || 'mestre',
    jogadorAlvo: payload.jogadorAlvo != null ? String(payload.jogadorAlvo) : (fallbackUserId != null ? String(fallbackUserId) : null),
    personagemAlvo: payload.personagemAlvo ?? null,
    teste: payload.teste || '',
    atributo: payload.atributo || null,
    pericia: payload.pericia || null,
    dificuldade: payload.dificuldade != null ? payload.dificuldade : 'Media',
    contexto: payload.contexto || null,
    tipoDado: payload.tipoDado || payload.tipo || 'd20',
    criadoEm: payload.criadoEm || new Date().toISOString(),
    status,
    resolvidoEm: payload.resolvidoEm || null,
    canceladoEm: payload.canceladoEm || null,
    metadata: payload.metadata || {}
  };
}

function getLegacyTestes(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  if (estadoJogo.testePendente) {
    return [normalizeTestePayload(estadoJogo.testePendente)];
  }
  if (estadoJogo.dadosSolicitados) {
    const testeInfo = estadoJogo.testeInfo || {};
    return [normalizeTestePayload({
      origem: 'legacy',
      jogadorAlvo: testeInfo.jogadorAlvo,
      teste: testeInfo.teste,
      dificuldade: testeInfo.dificuldade,
      tipoDado: testeInfo.tipoDado || 'd20',
      contexto: testeInfo.contexto || null,
      metadata: testeInfo.metadata || {}
    })];
  }
  return [];
}

function getStoredTests(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  if (Array.isArray(estadoJogo.testesPendentes) && estadoJogo.testesPendentes.length > 0) {
    return estadoJogo.testesPendentes.map((teste) => normalizeTestePayload(teste));
  }
  return getLegacyTestes(sessao);
}

function replaceStoredTests(sessao = {}, tests = []) {
  const estadoJogo = ensureEstadoJogo(sessao);
  estadoJogo.testesPendentes = tests.map((teste) => normalizeTestePayload(teste));
  return estadoJogo.testesPendentes;
}

function updateStoredTests(sessao = {}, matcher, updater) {
  const atuais = getStoredTests(sessao);
  const atualizados = atuais.map((teste) => {
    if (!matcher(teste)) return teste;
    return normalizeTestePayload(updater({ ...teste }));
  });
  replaceStoredTests(sessao, atualizados);
  return atualizados;
}

export function getTestesPendentes(sessao = {}) {
  return getStoredTests(sessao).filter((teste) => teste?.status === 'pending');
}

export function getTestePendente(sessao = {}, options = {}) {
  const { userId = null, groupId = null, testeId = null } = options;
  const testes = getTestesPendentes(sessao);

  if (testeId) {
    return testes.find((teste) => String(teste.id) === String(testeId)) || null;
  }
  if (userId != null) {
    return testes.find(
      (teste) => String(teste.jogadorAlvo) === String(userId)
        && (!groupId || String(teste.groupId) === String(groupId))
    ) || null;
  }
  if (groupId != null) {
    return testes.find((teste) => String(teste.groupId) === String(groupId)) || null;
  }

  const turno = getTurnState(sessao);
  if (turno.jogadorAtual != null) {
    const doJogadorAtual = testes.find((teste) => String(teste.jogadorAlvo) === String(turno.jogadorAtual));
    if (doJogadorAtual) return doJogadorAtual;
  }

  return testes[0] || null;
}

export function syncTesteAliases(sessao = {}) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const turno = getTurnState(sessao);
  const testesAtivos = getTestesPendentes(sessao);
  const testeAtual = getTestePendente(sessao, {
    userId: turno.jogadorAtual,
    groupId: turno.loteTesteAtivo
  }) || testesAtivos[0] || null;

  estadoJogo.testesPendentes = getStoredTests(sessao);
  estadoJogo.testePendente = testeAtual;
  estadoJogo.dadosSolicitados = testesAtivos.length > 0;
  estadoJogo.testeInfo = testeAtual
    ? {
        teste: testeAtual.teste,
        dificuldade: testeAtual.dificuldade,
        jogadorAlvo: testeAtual.jogadorAlvo,
        tipoDado: testeAtual.tipoDado,
        contexto: testeAtual.contexto,
        metadata: testeAtual.metadata || {}
      }
    : null;

  return testesAtivos;
}

export function criarTestesPendentes(sessao = {}, payload = {}, fallbackUserId = null) {
  const itens = Array.isArray(payload) ? payload : [payload];
  const groupId = payload?.groupId || itens[0]?.groupId || createGroupId();
  const existentes = getStoredTests(sessao);
  const testes = itens
    .map((item) => normalizeTestePayload(item, fallbackUserId, groupId))
    .filter((item) => item.jogadorAlvo != null);

  replaceStoredTests(sessao, [...existentes, ...testes]);
  transitionTurnState(sessao, TURN_STATUS.AWAITING_ROLL, {
    lockReason: 'teste_pendente',
    loteTesteAtivo: groupId
  });
  syncTesteAliases(sessao);
  return testes;
}

export function criarTestePendente(sessao = {}, payload = {}, fallbackUserId = null) {
  return criarTestesPendentes(sessao, payload, fallbackUserId)[0] || null;
}

export function limparTestePendente(sessao = {}, options = {}) {
  const {
    testId = null,
    userId = null,
    groupId = null,
    nextTurnState = null,
    mode = 'cancel',
    compact = false
  } = options;

  const marcouAlgum = [];
  updateStoredTests(
    sessao,
    (teste) => {
      if (!testId && !userId && !groupId) return true;
      if (testId && String(teste.id) === String(testId)) return true;
      if (userId && String(teste.jogadorAlvo) === String(userId) && (!groupId || String(teste.groupId) === String(groupId))) return true;
      if (!userId && groupId && String(teste.groupId) === String(groupId)) return true;
      return false;
    },
    (teste) => {
      marcouAlgum.push(teste.id);
      if (mode === 'resolved') {
        return {
          ...teste,
          status: 'resolved',
          resolvidoEm: teste.resolvidoEm || new Date().toISOString()
        };
      }
      return {
        ...teste,
        status: 'cancelled',
        canceladoEm: teste.canceladoEm || new Date().toISOString()
      };
    }
  );

  if (compact) {
    compactarTestesPendentes(sessao);
  } else {
    syncTesteAliases(sessao);
  }

  const existemPendentes = hasPendingTests(sessao, { groupId });
  if (!existemPendentes) {
    const turno = getTurnState(sessao);
    transitionTurnState(sessao, nextTurnState || TURN_STATUS.ACTIVE, {
      lockReason: null,
      loteTesteAtivo: null,
      jogadorAtual: turno.jogadorAtual
    });
  } else if (nextTurnState) {
    transitionTurnState(sessao, nextTurnState, { lockReason: null });
  }

  syncTesteAliases(sessao);
  return marcouAlgum;
}

export function compactarTestesPendentes(sessao = {}) {
  const restantes = getStoredTests(sessao).filter((teste) => teste?.status === 'pending');
  replaceStoredTests(sessao, restantes);
  syncTesteAliases(sessao);
  return restantes;
}

export function resolverTestePendente(sessao = {}, userId, options = {}) {
  const { testeId = null, groupId = null } = options;
  const teste = getTestePendente(sessao, { userId, testeId, groupId });
  if (!teste) {
    const turno = getTurnState(sessao);
    const testeAtivo = getTestePendente(sessao, {
      groupId: groupId || turno.loteTesteAtivo || null
    });
    if (testeAtivo && testeAtivo.jogadorAlvo && String(testeAtivo.jogadorAlvo) !== String(userId)) {
      return { ok: false, motivo: 'jogador_incorreto', teste: testeAtivo };
    }
    return { ok: false, motivo: 'sem_teste_pendente', teste: null };
  }

  if (teste.jogadorAlvo && String(teste.jogadorAlvo) !== String(userId)) {
    return { ok: false, motivo: 'jogador_incorreto', teste };
  }

  let resolvedTest = null;
  updateStoredTests(
    sessao,
    (item) => String(item.id) === String(teste.id),
    (item) => {
      resolvedTest = {
        ...item,
        status: 'resolved',
        resolvidoEm: new Date().toISOString()
      };
      return resolvedTest;
    }
  );

  transitionTurnState(sessao, TURN_STATUS.RESOLVING_ROLL, {
    lockReason: 'resolvendo_teste',
    loteTesteAtivo: teste.groupId || null
  });
  syncTesteAliases(sessao);

  return { ok: true, motivo: null, teste: resolvedTest || teste };
}

export function hasPendingTests(sessao = {}, options = {}) {
  const { groupId = null } = options;
  const testes = getTestesPendentes(sessao);
  if (!groupId) return testes.length > 0;
  return testes.some((teste) => String(teste.groupId) === String(groupId));
}

export function emitirSolicitacaoTeste(sm, roomId, sessao = {}, payload = {}) {
  const testes = Array.isArray(payload.testesPendentes) && payload.testesPendentes.length > 0
    ? payload.testesPendentes.filter((teste) => teste?.status === 'pending')
    : getTestesPendentes(sessao);

  if (!testes.length) {
    // @event turno_estado_atualizado → room (broadcast) | nenhum teste pendente
    sm.sendToRoom(roomId, 'turno_estado_atualizado', {
      roomId,
      ...buildTurnEventPayload(sessao),
      timestamp: Date.now()
    });
    return;
  }

  const testeReferencia = payload.testePendente || testes[0];
  const evento = {
    narrativa: payload.narrativa || '',
    tipoDado: payload.tipoDado || testeReferencia?.tipoDado || 'd20',
    teste: payload.teste || testeReferencia?.teste || '',
    dificuldade: toDifficultyLabel(payload.dificuldade || testeReferencia?.dificuldade),
    modificador: payload.modificador ?? 0,
    atributo: payload.atributo || testeReferencia?.atributo || null,
    contexto: payload.contexto || testeReferencia?.contexto || null,
    origem: payload.origem || testeReferencia?.origem || 'mestre',
    groupId: payload.groupId || testeReferencia?.groupId || null,
    testePendente: testeReferencia,
    testesPendentes: testes,
    timestamp: Date.now()
  };

  // @event mestre_solicita_dados → room (broadcast) | mestre solicita rolagem de dados
  sm.sendToRoom(roomId, 'mestre_solicita_dados', evento);
  // @event turno_estado_atualizado → room (broadcast) | estado do turno após solicitação
  sm.sendToRoom(roomId, 'turno_estado_atualizado', {
    roomId,
    ...buildTurnEventPayload(sessao),
    timestamp: Date.now()
  });
}
