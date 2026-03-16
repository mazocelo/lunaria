const TERMINAL_REQUEST_STATUSES = new Set([
  'completed',
  'failed',
  'timed_out',
  'superseded'
]);

const MAX_REQUEST_HISTORY = 20;
const REQUEST_TIMEOUT_GRACE_MS = 3000;
const DEFAULT_TIMEOUT_MS_BY_KIND = {
  player_action: 10000,
  turn_start: 18000
};

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
  if (sessao.estadoJogo.lastRegenerableMestreRequest === undefined) {
    sessao.estadoJogo.lastRegenerableMestreRequest = null;
  }
}

function computeElapsedMs(request, updatedAt = null) {
  const acceptedAt = request?.acceptedAt ? Date.parse(request.acceptedAt) : Date.now();
  const current = updatedAt ? Date.parse(updatedAt) : Date.now();
  return Math.max(0, current - acceptedAt);
}

function computeExpiresAt(acceptedAt, timeoutMs) {
  const baseTime = acceptedAt ? Date.parse(acceptedAt) : Date.now();
  return new Date(baseTime + Number(timeoutMs || 0) + REQUEST_TIMEOUT_GRACE_MS).toISOString();
}

function normalizeRequestTimeoutMs(kind, timeoutMs) {
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return Number(timeoutMs);
  }
  return DEFAULT_TIMEOUT_MS_BY_KIND[kind] || DEFAULT_TIMEOUT_MS_BY_KIND.player_action;
}

function buildTimeoutExpiredPatch(request) {
  const timestamp = nowIso();
  return {
    ...request,
    status: 'timed_out',
    updatedAt: timestamp,
    lastHeartbeatAt: timestamp,
    errorCode: request?.errorCode || 'AI_TIMEOUT',
    errorMessage: request?.errorMessage || 'A resposta do Mestre expirou antes de concluir.'
  };
}

export function getDefaultMestreRequestTimeoutMs(kind = 'player_action') {
  return normalizeRequestTimeoutMs(kind, null);
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

export function getLastRegenerableMestreRequest(sessao, userId = null) {
  ensureRequestState(sessao);
  const request = sessao.estadoJogo.lastRegenerableMestreRequest || null;
  if (!request) return null;
  if (userId != null && String(request.userId) !== String(userId)) {
    return null;
  }
  return request;
}

export function setLastRegenerableMestreRequest(sessao, request) {
  ensureRequestState(sessao);
  sessao.estadoJogo.lastRegenerableMestreRequest = request ? cloneRequest(request) : null;
  return sessao.estadoJogo.lastRegenerableMestreRequest;
}

export function clearLastRegenerableMestreRequest(sessao, requestId = null) {
  ensureRequestState(sessao);
  if (!requestId) {
    sessao.estadoJogo.lastRegenerableMestreRequest = null;
    return;
  }

  const current = sessao.estadoJogo.lastRegenerableMestreRequest;
  if (current?.requestId === requestId) {
    sessao.estadoJogo.lastRegenerableMestreRequest = null;
  }
}

export function getLatestMestreRequest(sessao, requestId) {
  ensureRequestState(sessao);

  const ativa = getActiveMestreRequest(sessao);
  if (ativa?.requestId === requestId) return ativa;

  const regenerable = getLastRegenerableMestreRequest(sessao);
  if (regenerable?.requestId === requestId) return regenerable;

  const historico = getMestreRequestHistory(sessao)
    .filter((request) => request?.requestId === requestId)
    .sort((a, b) => (b.attempt || 0) - (a.attempt || 0));

  return historico[0] || null;
}

export function isExpiredMestreRequest(request, now = Date.now()) {
  if (!request || isTerminalMestreRequest(request.status)) return false;
  if (!request.expiresAt) return false;
  return now > Date.parse(request.expiresAt);
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

export function normalizeExpiredActiveMestreRequest(sessao) {
  ensureRequestState(sessao);
  const active = getActiveMestreRequest(sessao);
  if (!active || !isExpiredMestreRequest(active)) {
    return null;
  }

  const expiredRequest = buildTimeoutExpiredPatch(active);
  archiveMestreRequest(sessao, expiredRequest);
  setLastRegenerableMestreRequest(sessao, expiredRequest);
  clearActiveMestreRequest(sessao);
  return expiredRequest;
}

export function acceptMestreRequest(sessao, payload) {
  ensureRequestState(sessao);
  normalizeExpiredActiveMestreRequest(sessao);

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
  const timeoutMs = normalizeRequestTimeoutMs(payload.kind || 'player_action', payload.timeoutMs);
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
    timeoutMs,
    expiresAt: computeExpiresAt(timestamp, timeoutMs),
    errorCode: null,
    errorMessage: null
  };

  clearLastRegenerableMestreRequest(sessao, request.requestId);
  sessao.estadoJogo.mestreRequestAtiva = request;
  return { request, duplicate: false };
}

export function markMestreRequestStatus(sessao, requestId, patch = {}) {
  ensureRequestState(sessao);
  const active = getActiveMestreRequest(sessao);
  if (!active || active.requestId !== requestId) return null;

  const timestamp = nowIso();
  const updatedAt = patch.updatedAt || timestamp;
  Object.assign(active, patch, {
    updatedAt,
    lastHeartbeatAt: patch.lastHeartbeatAt || updatedAt
  });

  if (patch.timeoutMs || patch.acceptedAt) {
    active.timeoutMs = normalizeRequestTimeoutMs(active.kind, patch.timeoutMs || active.timeoutMs);
    active.expiresAt = patch.expiresAt || computeExpiresAt(patch.acceptedAt || active.acceptedAt, active.timeoutMs);
  } else if (!active.timeoutMs) {
    active.timeoutMs = normalizeRequestTimeoutMs(active.kind, null);
    active.expiresAt = active.expiresAt || computeExpiresAt(active.acceptedAt, active.timeoutMs);
  }

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
  clearLastRegenerableMestreRequest(sessao, requestId);
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
  if (status === 'failed' || status === 'timed_out') {
    setLastRegenerableMestreRequest(sessao, request);
  }
  return request;
}

export function beginRegenerateMestreRequest(sessao, requestId, userId = null) {
  ensureRequestState(sessao);
  normalizeExpiredActiveMestreRequest(sessao);

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

  clearLastRegenerableMestreRequest(sessao, requestId);

  const timestamp = nowIso();
  const timeoutMs = normalizeRequestTimeoutMs(existing.kind, existing.timeoutMs);
  const regenerated = {
    ...cloneRequest(existing),
    attempt: Number(existing.attempt || 0) + 1,
    status: 'accepted',
    updatedAt: timestamp,
    lastHeartbeatAt: timestamp,
    acceptedAt: timestamp,
    timeoutMs,
    expiresAt: computeExpiresAt(timestamp, timeoutMs),
    errorCode: null,
    errorMessage: null
  };

  sessao.estadoJogo.mestreRequestAtiva = regenerated;
  return regenerated;
}
