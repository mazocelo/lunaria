/**
 * Socket Store - Metodos de envio: mensagens, acoes, dados, sessao e turnos
 */

export const createSendActions = (set, get) => ({
  // ===== METODOS DE ENVIO =====
  rollDice: (diceData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('dice_roll', diceData);
    }
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
    const {
      socket, isConnected, roomId, currentUser, safeEmit, log,
      pendingMestreRequestId, activeMestreRequestStatus
    } = get();

    if (!socket || !isConnected) {
      log('Nao conectado para iniciar turno', {}, 'error');
      return false;
    }

    if (!roomId || !currentUser) {
      log('Faltam dados para iniciar turno', { roomId: !!roomId, user: !!currentUser }, 'error');
      return false;
    }

    if (pendingMestreRequestId || (activeMestreRequestStatus && !['completed', 'failed', 'timed_out', 'superseded'].includes(activeMestreRequestStatus))) {
      log('Ja existe request do Mestre em andamento para iniciar turno', {
        pendingMestreRequestId,
        activeMestreRequestStatus
      }, 'warn');
      return false;
    }

    const turnoData = {
      roomId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.nome,
      requestId: crypto.randomUUID()
    };

    log('Iniciando turno', { userId: currentUser.id });
    const enviado = safeEmit('iniciar_turno', turnoData);
    if (enviado) {
      set({
        mestreTimedOut: false,
        mestreStale: false,
        pendingMestreRequestId: turnoData.requestId,
        pendingMestreRequestKind: 'turn_start',
        pendingMestreSentAt: new Date().toISOString()
      });
    }
    return enviado;
  },
});
