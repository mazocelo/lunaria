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

function normalizeTestePayload(payload = {}, fallbackUserId = null, groupId = null) {
  return {
    id: payload.id || `teste_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    groupId: payload.groupId || groupId || createGroupId(),
    origem: payload.origem || 'mestre',
    jogadorAlvo: payload.jogadorAlvo != null ? String(payload.jogadorAlvo) : (fallbackUserId != null ? String(fallbackUserId) : null),
    personagemAlvo: payload.personagemAlvo ?? null,
    teste: payload.teste || '',
    atributo: payload.atributo || null,
    pericia: payload.pericia || null,
    dificuldade: payload.dificuldade || 'Media',
    contexto: payload.contexto || null,
    tipoDado: payload.tipoDado || payload.tipo || 'd20',
    criadoEm: payload.criadoEm || new Date().toISOString(),
    status: payload.status || 'pending',
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

export function getTestesPendentes(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  if (Array.isArray(estadoJogo.testesPendentes) && estadoJogo.testesPendentes.length > 0) {
    return estadoJogo.testesPendentes.filter(teste => teste?.status !== 'cancelled');
  }
  return getLegacyTestes(sessao);
}

export function getTestePendente(sessao = {}, options = {}) {
  const { userId = null, groupId = null, testeId = null } = options;
  const testes = getTestesPendentes(sessao);

  if (testeId) {
    return testes.find(teste => String(teste.id) === String(testeId)) || null;
  }
  if (userId != null) {
    return testes.find(teste => String(teste.jogadorAlvo) === String(userId) && (!groupId || String(teste.groupId) === String(groupId))) || null;
  }
  if (groupId != null) {
    return testes.find(teste => String(teste.groupId) === String(groupId)) || null;
  }

  const turno = getTurnState(sessao);
  if (turno.jogadorAtual != null) {
    const doJogadorAtual = testes.find(teste => String(teste.jogadorAlvo) === String(turno.jogadorAtual));
    if (doJogadorAtual) return doJogadorAtual;
  }

  return testes[0] || null;
}

export function syncTesteAliases(sessao = {}) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const turno = getTurnState(sessao);
  const testesPendentes = getTestesPendentes(sessao);
  const testeAtual = getTestePendente(sessao, {
    userId: turno.jogadorAtual,
    groupId: turno.loteTesteAtivo
  }) || testesPendentes[0] || null;

  estadoJogo.testesPendentes = testesPendentes;
  estadoJogo.testePendente = testeAtual;
  estadoJogo.dadosSolicitados = testesPendentes.length > 0;
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

  return testesPendentes;
}

export function criarTestesPendentes(sessao = {}, payload = {}, fallbackUserId = null) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const existentes = getTestesPendentes(sessao);
  const itens = Array.isArray(payload) ? payload : [payload];
  const groupId = payload?.groupId || createGroupId();
  const testes = itens
    .map(item => normalizeTestePayload(item, fallbackUserId, groupId))
    .filter(item => item.jogadorAlvo != null);

  estadoJogo.testesPendentes = [...existentes, ...testes];
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
  const estadoJogo = ensureEstadoJogo(sessao);
  const { testId = null, userId = null, groupId = null, nextTurnState = null } = options;
  let testes = getTestesPendentes(sessao);

  if (!testId && !userId && !groupId) {
    testes = [];
  } else {
    testes = testes.filter(teste => {
      if (testId && String(teste.id) === String(testId)) return false;
      if (userId && String(teste.jogadorAlvo) === String(userId) && (!groupId || String(teste.groupId) === String(groupId))) return false;
      if (!userId && groupId && String(teste.groupId) === String(groupId)) return false;
      return true;
    });
  }

  estadoJogo.testesPendentes = testes;
  if (testes.length === 0) {
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

  transitionTurnState(sessao, TURN_STATUS.RESOLVING_ROLL, {
    lockReason: 'resolvendo_teste',
    loteTesteAtivo: teste.groupId || null
  });

  return { ok: true, motivo: null, teste };
}

export function hasPendingTests(sessao = {}, options = {}) {
  const { groupId = null } = options;
  const testes = getTestesPendentes(sessao);
  if (!groupId) return testes.length > 0;
  return testes.some(teste => String(teste.groupId) === String(groupId));
}

export function emitirSolicitacaoTeste(io, roomId, sessao = {}, payload = {}) {
  const testes = Array.isArray(payload.testesPendentes) && payload.testesPendentes.length > 0
    ? payload.testesPendentes
    : getTestesPendentes(sessao);

  for (const teste of testes) {
    const evento = {
      narrativa: payload.narrativa || '',
      tipoDado: teste.tipoDado || 'd20',
      teste: teste.teste,
      dificuldade: toDifficultyLabel(teste.dificuldade),
      modificador: payload.modificador ?? 0,
      atributo: payload.atributo || teste.atributo || null,
      contexto: teste.contexto || null,
      origem: teste.origem || 'mestre',
      testePendente: teste,
      testesPendentes: testes,
      timestamp: Date.now()
    };

    io.to(roomId).emit('mestre_solicita_dados', evento);
    io.to(roomId).emit('solicitacao_dados', evento);
  }

  io.to(roomId).emit('turno_estado_atualizado', {
    roomId,
    ...buildTurnEventPayload(sessao),
    timestamp: Date.now()
  });
}
