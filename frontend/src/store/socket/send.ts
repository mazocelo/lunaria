/**
 * Socket Store - Metodos de envio: mensagens, acoes, dados, sessao e turnos
 */
import type { SocketGetState, SocketSetState } from './types';

type AnyObj = Record<string, unknown>;

export type SocketSendActions = {
  rollDice: (diceData: unknown) => void;
  rolarDadoInicial: () => boolean;
  rolarIniciativaCombate: () => boolean;
  iniciarTurno: () => boolean;
};

export const createSendActions = (set: SocketSetState, get: SocketGetState): SocketSendActions => ({
  rollDice: (diceData) => {
    const state = get();
    const { socket, isConnected } = state;
    const safeEmit = state.safeEmit as (event: string, data?: unknown) => boolean;
    if (socket && isConnected) {
      safeEmit('dice_roll', diceData);
    }
  },

  rolarDadoInicial: () => {
    const state = get();
    const { socket, isConnected, roomId, currentUser } = state;
    const safeEmit = state.safeEmit as (event: string, data?: unknown) => boolean;
    const log = state.log as (event: string, data?: AnyObj, level?: string) => void;

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
      username: currentUser.username || currentUser.nome,
    };

    log('Rolando dado inicial', { userId: currentUser.id });
    return safeEmit('rolar_dado_inicial', dadoData);
  },

  rolarIniciativaCombate: () => {
    const state = get();
    const { socket, isConnected, roomId, currentUser } = state;
    const safeEmit = state.safeEmit as (event: string, data?: unknown) => boolean;
    const log = state.log as (event: string, data?: AnyObj, level?: string) => void;

    if (!socket || !isConnected || !roomId || !currentUser) {
      log('Nao conectado para rolar iniciativa', {}, 'error');
      return false;
    }
    log('Rolando iniciativa de combate', { userId: currentUser.id });
    set({ combateIniciativaPendente: false });
    return safeEmit('rolar_iniciativa_combate', {
      roomId,
      userId: currentUser.id,
    });
  },

  iniciarTurno: () => {
    const state = get();
    const {
      socket, isConnected, roomId, currentUser,
      pendingMestreRequestId, activeMestreRequestStatus,
    } = state;
    const safeEmit = state.safeEmit as (event: string, data?: unknown) => boolean;
    const log = state.log as (event: string, data?: AnyObj, level?: string) => void;

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
        activeMestreRequestStatus,
      }, 'warn');
      return false;
    }

    const turnoData = {
      roomId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.nome,
      requestId: crypto.randomUUID(),
    };

    log('Iniciando turno', { userId: currentUser.id });
    const enviado = safeEmit('iniciar_turno', turnoData);
    if (enviado) {
      set({
        mestreTimedOut: false,
        mestreStale: false,
        pendingMestreRequestId: turnoData.requestId,
        pendingMestreRequestKind: 'turn_start',
        pendingMestreSentAt: new Date().toISOString(),
      });
    }
    return enviado;
  },
});
