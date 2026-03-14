/**
 * Socket Store - Gerenciamento de Salas: joinRoom, leaveRoom
 */

export const createRoomActions = (set, get) => ({
  // ===== GERENCIAMENTO DE SALAS =====
  joinRoom: async (roomData) => {
    const { socket, isConnected, isAuthenticated, configs, log, prepareRoomData } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket nao conectado'));
      }

      if (!isAuthenticated) {
        return reject(new Error('Usuario nao autenticado'));
      }

      const sessionId = Date.now().toString();
      const joinData = prepareRoomData(roomData, sessionId);

      log('Joining room', { roomId: joinData.roomId, username: joinData.username });

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao entrar na sala apos ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room_joined', onJoined);
        socket.off('error', onGenericError);
      };

      const onJoined = (data) => {
        cleanup();
        log('Room joined', { roomId: data.roomId, users: data.users?.length, success: true });

        if (data.sessao?.jogadoresConectados) {
          const participantesFormatados = data.sessao.jogadoresConectados.map((j) => ({
            userId: j.userId,
            username: j.username,
            personagemId: j.personagemId,
            personagemNome: j.personagemNome,
            status: j.status || 'selecionando'
          }));

          set({ participantes: participantesFormatados });
        }

        resolve(data);
      };

      const onGenericError = (error) => {
        cleanup();
        log('Join room error', { error: error.message || error }, 'error');
        reject(new Error(error.message || 'Erro ao entrar na sala'));
      };

      socket.once('room_joined', onJoined);
      socket.once('error', onGenericError);

      log('Emitting join_room', {
        roomId: joinData.roomId,
        userId: joinData.userId,
        username: joinData.username,
        historiaId: joinData.historiaId,
        personagemId: joinData.personagemId
      });

      socket.emit('join_room', joinData);
    });
  },

  leaveRoom: async () => {
    const { socket, isConnected, configs, log, roomId, currentUser } = get();

    return new Promise((resolve, reject) => {
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

      const onLeft = (result) => {
        cleanup();
        set({
          inRoom: false,
          roomId: null,
          session: null,
          roomUsers: []
        });
        log('Room left', { success: true });
        resolve(result);
      };

      const onGenericError = (error) => {
        cleanup();
        log('Leave room error', { error: error.message || error }, 'error');
        reject(new Error(error.message || 'Erro ao sair da sala'));
      };

      socket.once('room_left', onLeft);
      socket.once('error', onGenericError);
      socket.emit('leave_room', {
        roomId,
        userId: currentUser.id,
        username: currentUser.username || currentUser.nome
      });
    });
  },
});
