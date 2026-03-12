import { buildTurnEventPayload, transitionTurnState, TURN_STATUS } from './turnStateMachine.js';

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

function normalizeTestePayload(payload = {}, fallbackUserId = null) {
  return {
    id: payload.id || `teste_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
    metadata: payload.metadata || {}
  };
}

export function getTestePendente(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  if (estadoJogo.testePendente) {
    return estadoJogo.testePendente;
  }
  if (estadoJogo.dadosSolicitados) {
    const testeInfo = estadoJogo.testeInfo || {};
    return normalizeTestePayload({
      origem: 'legacy',
      jogadorAlvo: testeInfo.jogadorAlvo,
      teste: testeInfo.teste,
      dificuldade: testeInfo.dificuldade,
      tipoDado: testeInfo.tipoDado || 'd20',
      contexto: testeInfo.contexto || null,
      metadata: testeInfo.metadata || {}
    });
  }
  return null;
}

export function syncTesteAliases(sessao = {}) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const teste = estadoJogo.testePendente || null;

  estadoJogo.dadosSolicitados = !!teste;
  estadoJogo.testeInfo = teste
    ? {
        teste: teste.teste,
        dificuldade: teste.dificuldade,
        jogadorAlvo: teste.jogadorAlvo,
        tipoDado: teste.tipoDado,
        contexto: teste.contexto,
        metadata: teste.metadata || {}
      }
    : null;

  return teste;
}

export function criarTestePendente(sessao = {}, payload = {}, fallbackUserId = null) {
  const estadoJogo = ensureEstadoJogo(sessao);
  const teste = normalizeTestePayload(payload, fallbackUserId);
  estadoJogo.testePendente = teste;
  syncTesteAliases(sessao);
  transitionTurnState(sessao, TURN_STATUS.AWAITING_ROLL, {
    lockReason: 'teste_pendente'
  });
  return teste;
}

export function limparTestePendente(sessao = {}, options = {}) {
  const estadoJogo = ensureEstadoJogo(sessao);
  estadoJogo.testePendente = null;
  syncTesteAliases(sessao);

  if (options.nextTurnState) {
    transitionTurnState(sessao, options.nextTurnState, {
      lockReason: null
    });
  }
}

export function resolverTestePendente(sessao = {}, userId) {
  const teste = getTestePendente(sessao);
  if (!teste) {
    return { ok: false, motivo: 'sem_teste_pendente', teste: null };
  }

  if (teste.jogadorAlvo && String(teste.jogadorAlvo) !== String(userId)) {
    return { ok: false, motivo: 'jogador_incorreto', teste };
  }

  transitionTurnState(sessao, TURN_STATUS.RESOLVING_ROLL, {
    lockReason: 'resolvendo_teste'
  });

  return { ok: true, motivo: null, teste };
}

export function emitirSolicitacaoTeste(io, roomId, sessao = {}, payload = {}) {
  const teste = getTestePendente(sessao) || normalizeTestePayload(payload);
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
    timestamp: Date.now()
  };

  io.to(roomId).emit('mestre_solicita_dados', evento);
  io.to(roomId).emit('solicitacao_dados', evento);
  io.to(roomId).emit('turno_estado_atualizado', {
    roomId,
    ...buildTurnEventPayload(sessao),
    timestamp: Date.now()
  });
}
