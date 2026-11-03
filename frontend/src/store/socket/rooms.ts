/**
 * Socket Store - Gerenciamento de Salas: joinRoom, leaveRoom
 */
import type { SocketGetState, SocketSetState } from './types';

type AnyObj = Record<string, unknown>;

export type SocketRoomActions = {
  joinRoom: (roomData: AnyObj) => Promise<unknown>;
  leaveRoom: () => Promise<unknown>;
};

export const createRoomActions = (set: SocketSetState, get: SocketGetState): SocketRoomActions => ({
  joinRoom: async (roomData) => {
    const state = get();
    const { socket, isConnected, isAuthenticated, configs } = state;
    const log = state.log as (event: string, data?: AnyObj, level?: string) => void;
    const prepareRoomData = state.prepareRoomData as (data: AnyObj, sessionId: string) => AnyObj;

    return new Promise<unknown>((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket nao conectado'));
      }

      if (!isAuthenticated) {
        return reject(new Error('Usuario nao autenticado'));
      }

      const sessionId = Date.now().toString();
      const joinData = prepareRoomData(roomData, sessionId);

      log('Joining room', { roomId: joinData.roomId, username: joinData.username });

      set({ joiningRoomId: joinData.roomId as string, sessionRecap: null });

      const timeout = setTimeout(() => {
        set({ joiningRoomId: null });
        reject(new Error(`Timeout ao entrar na sala apos ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        set({ joiningRoomId: null });
        socket.off('room_joined', onJoined);
        socket.off('error', onGenericError);
      };

      const onJoined = (data: unknown) => {
        cleanup();
        const d = data as AnyObj;
        const users = Array.isArray(d.users) ? d.users : [];
        log('Room joined', { roomId: d.roomId, users: users.length, success: true });

        const sessao = d.sessao as AnyObj | undefined;
        const jogadores = sessao?.jogadoresConectados;
        if (Array.isArray(jogadores)) {
          const participantesFormatados = jogadores.map((j) => {
            const ji = j as AnyObj;
            return {
              userId: ji.userId,
              username: ji.username,
              personagemId: ji.personagemId,
              personagemNome: ji.personagemNome,
              status: ji.status ?? 'selecionando',
            };
          });

          set({ participantes: participantesFormatados });
        }

        resolve(data);
      };

      const onGenericError = (error: unknown) => {
        cleanup();
        const message = (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string')
          ? (error as { message: string }).message
          : 'Erro ao entrar na sala';
        log('Join room error', { error: message }, 'error');
        reject(new Error(message));
      };

      socket.once('room_joined', onJoined);
      socket.once('error', onGenericError);

      log('Emitting join_room', {
        roomId: joinData.roomId,
        userId: joinData.userId,
        username: joinData.username,
        historiaId: joinData.historiaId,
        personagemId: joinData.personagemId,
      });

      socket.emit('join_room', joinData);
    });
  },

  leaveRoom: async () => {
    const state = get();
    const { socket, isConnected, configs, roomId, currentUser } = state;
    const log = state.log as (event: string, data?: AnyObj, level?: string) => void;

    return new Promise<unknown>((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket nao conectado'));
      }

      if (!roomId || !currentUser?.id) {
        return reject(new Error('Room atual ou usuario autenticado ausente'));
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao sair da sala apos ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room_left', onLeft);
        socket.off('error', onGenericError);
      };

      const onLeft = (result: unknown) => {
        cleanup();
        set({
          inRoom: false,
          joiningRoomId: null,
          roomId: null,
          session: null,
          roomUsers: [],
        });
        log('Room left', { success: true });
        resolve(result);
      };

      const onGenericError = (error: unknown) => {
        cleanup();
        const message = (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string')
          ? (error as { message: string }).message
          : 'Erro ao sair da sala';
        log('Leave room error', { error: message }, 'error');
        reject(new Error(message));
      };

      socket.once('room_left', onLeft);
      socket.once('error', onGenericError);
      socket.emit('leave_room', {
        roomId,
        userId: currentUser.id,
        username: currentUser.username || currentUser.nome,
      });
    });
  },
});
