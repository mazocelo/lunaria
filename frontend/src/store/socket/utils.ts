/**
 * Socket Store - Utilidades: logs, listeners, validacao, emit seguro
 */
import type { SocketListenerCallback, SocketUser } from './states';
import type { SocketGetState, SocketSetState } from './types';

type LogData = Record<string, unknown>;

export type SocketUtilActions = {
  log: (event: string, data?: LogData, level?: string) => void;
  on: (event: string, callback: SocketListenerCallback) => void;
  off: (event: string, callback: SocketListenerCallback) => void;
  once: (event: string, callback: SocketListenerCallback) => void;
  validateToken: (token: string) => boolean;
  safeEmit: (event: string, data?: unknown) => boolean;
  normalizarDadosUsuario: (userData: Record<string, unknown> | null | undefined) => {
    id: number | string;
    name: string;
    email: string;
    role: string;
  };
  normalizarDadosHistoria: (historiaData: Record<string, unknown> | null | undefined) => Record<string, unknown>;
  prepareRoomData: (roomData: Record<string, unknown>, sessionId: string) => Record<string, unknown>;
};

export const createUtilActions = (set: SocketSetState, get: SocketGetState): SocketUtilActions => ({
  log: (event, data = {}, level = 'info') => {
    const { logLevel } = get();
    if (logLevel === 'error' && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '[ERR]' : data.success ? '[OK]' : data.warning ? '[WARN]' : '[net]';

    if (level === 'error' || data.error) {
      console.error(`${prefix} ${timestamp} [Socket] ${event}`, data);
    }
  },

  on: (event, callback) => {
    const { socket, listeners } = get();

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(callback);

    if (socket) {
      socket.on(event, callback);
    }

    set({ listeners: new Map(listeners) });
  },

  off: (event, callback) => {
    const { socket, listeners } = get();

    if (listeners.has(event)) {
      listeners.get(event)!.delete(callback);
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

  validateToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      const currentTime = Math.floor(Date.now() / 1000);
      return !!payload.exp && payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  safeEmit: (event, data) => {
    const { socket, isConnected, log } = get() as unknown as { socket: unknown; isConnected: boolean; log: SocketUtilActions['log'] };
    if (!socket || !isConnected) {
      log('Cannot emit - not connected', { event }, 'error');
      return false;
    }

    try {
      (socket as { emit: (e: string, d?: unknown) => void }).emit(event, data);
      log('Event emitted', { event, hasData: !!data });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log('Emit failed', { event, error: message }, 'error');
      return false;
    }
  },

  normalizarDadosUsuario: (userData) => {
    if (!userData) {
      throw new Error('Dados do usuario sao obrigatorios');
    }

    const u = userData as SocketUser;
    const id = u.userId ?? u.id;
    const name = u.username ?? u.nome ?? u.name;

    if (id == null || id === '') {
      throw new Error('ID do usuario e obrigatorio');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Nome do usuario e obrigatorio');
    }

    return {
      id: id as number | string,
      name,
      email: typeof u.email === 'string' ? u.email : '',
      role: typeof u.role === 'string' ? u.role : (typeof u.tipo === 'string' ? u.tipo : 'jogador'),
    };
  },

  normalizarDadosHistoria: (historiaData) => {
    if (!historiaData) {
      throw new Error('Dados da historia sao obrigatorios');
    }

    const h = historiaData as Record<string, unknown>;
    const id = h.historiaId ?? h.id;

    if (id == null || id === '') {
      throw new Error('ID da historia e obrigatorio');
    }

    return {
      id,
      titulo: h.titulo ?? h.nome,
      nome: h.nome ?? h.titulo,
      userId: h.userId,
      criador: h.criador ?? 'Criador desconhecido',
      descricao: h.descricao ?? '',
      tema: h.tema ?? '',
      status: h.status ?? 'ativa',
    };
  },

  prepareRoomData: (roomData, sessionId) => {
    const { normalizarDadosUsuario, normalizarDadosHistoria } = get() as unknown as { normalizarDadosUsuario: SocketUtilActions['normalizarDadosUsuario']; normalizarDadosHistoria: SocketUtilActions['normalizarDadosHistoria'] };
    const userData = normalizarDadosUsuario(roomData);
    const historiaData = normalizarDadosHistoria(roomData);

    return {
      roomId: `historia_${historiaData.id as string | number}`,
      userId: userData.id,
      username: userData.name,
      historiaId: historiaData.id,
      historiaData,
      personagemId: roomData.personagemId,
      personagemNome: roomData.personagemNome,
      sessionId,
    };
  },
});
