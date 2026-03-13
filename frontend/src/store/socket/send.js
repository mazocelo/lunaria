/**
 * Socket Store - Metodos de envio: mensagens, acoes, dados, sessao e turnos
 */

export const createSendActions = (set, get) => ({
  // ===== METODOS DE ENVIO =====
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

  startSession: async () => {
    const { log } = get();
    const message = 'start_session nao faz parte do contrato websocket atual. Use join_room para entrar na sessao da historia.';
    log('Start session is not supported by current websocket contract', { error: message }, 'error');
    return Promise.reject(new Error(message));
  },

  // ===== ACOES DO SISTEMA DE TURNOS =====
  rolarDadoInicial: () => {
    const { socket, isConnected, roomId, currentUser, safeEmit, log } = get();

    if (!socket || !isConnected) {
      log('Nao conectado para rolar dado', {}, 'error');
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
      log('Nao conectado para iniciar turno', {}, 'error');
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
