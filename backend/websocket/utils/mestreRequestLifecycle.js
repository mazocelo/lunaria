const TERMINAL_REQUEST_STATUSES = new Set([
  'completed',
  'failed',
  'timed_out',
  'superseded'
]);

const MAX_REQUEST_HISTORY = 20;

function nowIso() {
  return new Date().toISOString();
}

function cloneRequest(request) {
  return request ? JSON.parse(JSON.stringify(request)) : null;
}

function ensureRequestState(sessao) {
  sessao.estadoJogo = sessao.estadoJogo || {};
  if (!Array.isArray(sessao.estadoJogo.ultimasMestreRequests)) {
    sessao.estadoJogo.ultimasMestreRequests = [];
  }
}

function computeElapsedMs(request, updatedAt = null) {
  const acceptedAt = request?.acceptedAt ? Date.parse(request.acceptedAt) : Date.now();
  const current = updatedAt ? Date.parse(updatedAt) : Date.now();
  return Math.max(0, current - acceptedAt);
}

export function isTerminalMestreRequest(status) {
  return TERMINAL_REQUEST_STATUSES.has(status);
}

export function getActiveMestreRequest(sessao) {
  ensureRequestState(sessao);
  return sessao.estadoJogo.mestreRequestAtiva || null;
}

export function getMestreRequestHistory(sessao) {
  ensureRequestState(sessao);
  return sessao.estadoJogo.ultimasMestreRequests;
}

export function getLatestMestreRequest(sessao, requestId) {
  ensureRequestState(sessao);

  const ativa = getActiveMestreRequest(sessao);
  if (ativa?.requestId === requestId) return ativa;

  const historico = getMestreRequestHistory(sessao)
    .filter((request) => request?.requestId === requestId)
    .sort((a, b) => (b.attempt || 0) - (a.attempt || 0));

  return historico[0] || null;
}

export function buildMestreRequestStatusPayload(request, overrides = {}) {
  if (!request && !overrides?.requestId) return null;

  const merged = {
    ...(request || {}),
    ...overrides
  };
  const updatedAt = merged.updatedAt || nowIso();
  const status = merged.status || 'accepted';

  return {
    requestId: merged.requestId,
    roomId: merged.roomId || null,
    userId: merged.userId || null,
    kind: merged.kind || 'player_action',
    status,
    attempt: merged.attempt || 1,
    playerMessageId: merged.playerMessageId || null,
    errorCode: merged.errorCode || null,
    errorMessage: merged.errorMessage || null,
    canCheckStatus: !isTerminalMestreRequest(status),
    canRegenerate: status === 'failed' || status === 'timed_out',
    updatedAt,
    elapsedMs: computeElapsedMs(merged, updatedAt)
  };
}

export function emitMestreRequestStatus(sm, roomId, request, overrides = {}) {
  const payload = buildMestreRequestStatusPayload(request, overrides);
  if (!payload) return null;
  sm.sendToRoom(roomId || payload.roomId, 'mestre_request_status', payload);
  return payload;
}

export function buildRejectedBusyStatusPayload({
  requestId,
  roomId,
  userId,
  kind = 'player_action',
  activeRequest
} = {}) {
  return buildMestreRequestStatusPayload(activeRequest, {
    requestId,
    roomId,
    userId,
    kind,
    status: 'rejected_busy',
    errorCode: 'MESTRE_REQUEST_BUSY',
    errorMessage: 'Ja existe uma resposta do Mestre em andamento nesta sala. Aguarde a conclusao ou verifique o status.',
    canCheckStatus: true,
    canRegenerate: false
  });
}

export function acceptMestreRequest(sessao, payload) {
  ensureRequestState(sessao);

  const active = getActiveMestreRequest(sessao);
  if (active && !isTerminalMestreRequest(active.status)) {
    if (active.requestId === payload.requestId) {
      return { request: active, duplicate: true };
    }
    const error = new Error('MESTRE_REQUEST_BUSY');
    error.code = 'MESTRE_REQUEST_BUSY';
    error.activeRequest = active;
    throw error;
  }

  const timestamp = nowIso();
  const request = {
    requestId: payload.requestId,
    kind: payload.kind || 'player_action',
    roomId: payload.roomId,
    userId: payload.userId,
    username: payload.username,
    personagem: cloneRequest(payload.personagem) || null,
    originalMessage: payload.originalMessage || '',
    combatIntent: cloneRequest(payload.combatIntent) || null,
    playerMessageId: payload.playerMessageId || null,
    attempt: payload.attempt || 1,
    status: 'accepted',
    acceptedAt: timestamp,
    updatedAt: timestamp,
    lastHeartbeatAt: timestamp,
    errorCode: null,
    errorMessage: null
  };

  sessao.estadoJogo.mestreRequestAtiva = request;
  return { request, duplicate: false };
}

export function markMestreRequestStatus(sessao, requestId, patch = {}) {
  ensureRequestState(sessao);
  const active = getActiveMestreRequest(sessao);
  if (!active || active.requestId !== requestId) return null;

  const timestamp = nowIso();
  Object.assign(active, patch, {
    updatedAt: patch.updatedAt || timestamp,
    lastHeartbeatAt: patch.lastHeartbeatAt || timestamp
  });

  return active;
}

export function archiveMestreRequest(sessao, request) {
  ensureRequestState(sessao);
  if (!request?.requestId) return;

  const historico = getMestreRequestHistory(sessao);
  const clone = cloneRequest(request);
  const existingIndex = historico.findIndex(
    (item) => item?.requestId === clone.requestId && Number(item?.attempt || 0) === Number(clone.attempt || 0)
  );

  if (existingIndex >= 0) {
    historico[existingIndex] = clone;
  } else {
    historico.unshift(clone);
    if (historico.length > MAX_REQUEST_HISTORY) {
      historico.splice(MAX_REQUEST_HISTORY);
    }
  }
}

export function clearActiveMestreRequest(sessao) {
  ensureRequestState(sessao);
  delete sessao.estadoJogo.mestreRequestAtiva;
}

export function completeMestreRequest(sessao, requestId, attempt, patch = {}) {
  const request = markMestreRequestStatus(sessao, requestId, {
    ...patch,
    status: 'completed',
    errorCode: null,
    errorMessage: null
  });

  if (!request || Number(request.attempt || 0) !== Number(attempt || 0)) {
    return null;
  }

  archiveMestreRequest(sessao, request);
  clearActiveMestreRequest(sessao);
  return request;
}

export function failMestreRequest(sessao, requestId, attempt, status = 'failed', patch = {}) {
  const request = markMestreRequestStatus(sessao, requestId, {
    ...patch,
    status
  });

  if (!request || Number(request.attempt || 0) !== Number(attempt || 0)) {
    return null;
  }

  archiveMestreRequest(sessao, request);
  clearActiveMestreRequest(sessao);
  return request;
}

export function beginRegenerateMestreRequest(sessao, requestId, userId = null) {
  ensureRequestState(sessao);

  const active = getActiveMestreRequest(sessao);
  if (active && !isTerminalMestreRequest(active.status)) {
    const error = new Error('MESTRE_REQUEST_BUSY');
    error.code = 'MESTRE_REQUEST_BUSY';
    error.activeRequest = active;
    throw error;
  }

  const existing = getLatestMestreRequest(sessao, requestId);
  if (!existing) {
    const error = new Error('MESTRE_REQUEST_NOT_FOUND');
    error.code = 'MESTRE_REQUEST_NOT_FOUND';
    throw error;
  }

  if (userId != null && String(existing.userId) !== String(userId)) {
    const error = new Error('MESTRE_REQUEST_FORBIDDEN');
    error.code = 'MESTRE_REQUEST_FORBIDDEN';
    throw error;
  }

  if (!['failed', 'timed_out'].includes(existing.status)) {
    const error = new Error('MESTRE_REQUEST_NOT_REGENERATABLE');
    error.code = 'MESTRE_REQUEST_NOT_REGENERATABLE';
    throw error;
  }

  archiveMestreRequest(sessao, {
    ...existing,
    status: 'superseded',
    updatedAt: nowIso(),
    errorCode: existing.errorCode,
    errorMessage: existing.errorMessage
  });

  const timestamp = nowIso();
  const regenerated = {
    ...cloneRequest(existing),
    attempt: Number(existing.attempt || 0) + 1,
    status: 'accepted',
    updatedAt: timestamp,
    lastHeartbeatAt: timestamp,
    acceptedAt: timestamp,
    errorCode: null,
    errorMessage: null
  };

  sessao.estadoJogo.mestreRequestAtiva = regenerated;
  return regenerated;
}
