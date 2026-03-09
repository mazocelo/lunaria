/**
 * Socket Store - Utilidades: logs, listeners, validação, emit seguro
 */

export const createUtilActions = (set, get) => ({
  // ===== SISTEMA DE LOGS =====
  log: (event, data = {}, level = 'info') => {
    const { logLevel } = get();
    if (logLevel === 'error' && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : data.success ? '✅' : data.warning ? '⚠️' : '📡';

    if (level === 'error' || data.error) {
      console.error(`${prefix} ${timestamp} [Socket] ${event}`, data);
    }
  },

  // ===== SISTEMA DE LISTENERS =====
  on: (event, callback) => {
    const { socket, listeners } = get();

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);

    if (socket) {
      socket.on(event, callback);
    }

    set({ listeners: new Map(listeners) });
  },

  off: (event, callback) => {
    const { socket, listeners } = get();

    if (listeners.has(event)) {
      listeners.get(event).delete(callback);
    }

    if (socket) {
      socket.off(event, callback);
    }

    set({ listeners: new Map(listeners) });
  },

  once: (event, callback) => {
    const { socket } = get();
    if (socket) {
      socket.once(event, callback);
    }
  },

  // ===== VALIDAÇÃO DE TOKEN =====
  validateToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch (e) {
      return false;
    }
  },

  // ===== EMIT SEGURO =====
  safeEmit: (event, data) => {
    const { socket, isConnected, log } = get();
    if (!socket || !isConnected) {
      log('Cannot emit - not connected', { event }, 'error');
      return false;
    }

    try {
      socket.emit(event, data);
      log('Event emitted', { event, hasData: !!data });
      return true;
    } catch (error) {
      log('Emit failed', { event, error: error.message }, 'error');
      return false;
    }
  },

  // ===== NORMALIZAÇÃO =====
  normalizarDadosUsuario: (userData) => {
    if (!userData) {
      throw new Error('Dados do usuário são obrigatórios');
    }

    const normalized = {
      id: userData.userId || userData.id,
      name: userData.username || userData.nome || userData.name,
      email: userData.email || '',
      role: userData.role || userData.tipo || 'jogador'
    };

    if (!normalized.id) {
      throw new Error('ID do usuário é obrigatório');
    }
    if (!normalized.name) {
      throw new Error('Nome do usuário é obrigatório');
    }

    return normalized;
  },

  normalizarDadosHistoria: (historiaData) => {
    if (!historiaData) {
      throw new Error('Dados da história são obrigatórios');
    }

    const normalized = {
      id: historiaData.historiaId || historiaData.id,
      titulo: historiaData.titulo || historiaData.nome,
      nome: historiaData.nome || historiaData.titulo,
      userId: historiaData.userId,
      criador: historiaData.criador || 'Criador desconhecido',
      descricao: historiaData.descricao || '',
      tema: historiaData.tema || '',
      status: historiaData.status || 'ativa'
    };

    if (!normalized.id) {
      throw new Error('ID da história é obrigatório');
    }

    return normalized;
  },

  prepareRoomData: (roomData, sessionId) => {
    const { normalizarDadosUsuario, normalizarDadosHistoria } = get();
    const userData = normalizarDadosUsuario(roomData);
    const historiaData = normalizarDadosHistoria(roomData);

    return {
      roomId: `historia_${historiaData.id}`,
      userId: userData.id,
      username: userData.name,
      historiaId: historiaData.id,
      historiaData,
      personagemId: roomData.personagemId,
      personagemNome: roomData.personagemNome,
      sessionId
    };
  },
});
