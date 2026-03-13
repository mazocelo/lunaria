/**
 * Socket Store - Métodos de envio: mensagens, ações, dados, sessão, turnos
 */

export const createSendActions = (set, get) => ({
  // ===== MÉTODOS DE ENVIO =====
  playerAction: (actionData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('rpg_action', actionData);
    }
  },

  rollDice: (diceData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('dice_roll', diceData);
    }
  },

  updateStatus: (statusData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('status_update', statusData);
    }
  },

  startSession: async (sessionData) => {
    const { socket, isConnected, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao iniciar sessão após ${configs.SESSION_TIMEOUT}ms`));
      }, configs.SESSION_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('session_started', onStarted);
        socket.off('start_session_error', onError);
      };

      const onStarted = (result) => {
        cleanup();
        set({ session: result.session });
        log('Session started', { sessionId: result.session?.id, success: true });
        resolve(result);
      };

      const onError = (error) => {
        cleanup();
        log('Start session error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      socket.once('session_started', onStarted);
      socket.once('start_session_error', onError);
      socket.emit('start_session', sessionData);
    });
  },

  // ===== AÇÕES DO SISTEMA DE TURNOS =====
  rolarDadoInicial: () => {
    const { socket, isConnected, roomId, currentUser, safeEmit, log } = get();

    if (!socket || !isConnected) {
      log('Não conectado para rolar dado', {}, 'error');
      return false;
    }

    if (!roomId || !currentUser) {
      log('Faltam dados para rolar dado', { roomId: !!roomId, user: !!currentUser }, 'error');
      return false;
    }

    const dadoData = {
      roomId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.nome
    };

    log('Rolando dado inicial', { userId: currentUser.id });
    return safeEmit('rolar_dado_inicial', dadoData);
  },

  iniciarTurno: () => {
    const { socket, isConnected, roomId, currentUser, safeEmit, log } = get();

    if (!socket || !isConnected) {
      log('Não conectado para iniciar turno', {}, 'error');
      return false;
    }

    if (!roomId || !currentUser) {
      log('Faltam dados para iniciar turno', { roomId: !!roomId, user: !!currentUser }, 'error');
      return false;
    }

    const turnoData = {
      roomId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.nome
    };

    log('Iniciando turno', { userId: currentUser.id });
    return safeEmit('iniciar_turno', turnoData);
  },
});
