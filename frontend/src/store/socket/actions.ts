/**
 * SOCKET ACTIONS - Orquestrador que combina todos os modulos de acoes
 *
 * Modulos:
 * - utils.ts: logs, listeners, validacao, emit seguro, normalizacao
 * - listeners.ts: setupInternalListeners (todos os socket.on)
 * - connection.ts: connect, authenticate, disconnect, token
 * - rooms.ts: joinRoom, leaveRoom
 * - send.ts: mensagens, acoes, dados, sessao, turnos
 */
import { createUtilActions, type SocketUtilActions } from './utils';
import { createListenerActions, type SocketListenerActions } from './listeners';
import { createConnectionActions, type SocketConnectionActions } from './connection';
import { createRoomActions, type SocketRoomActions } from './rooms';
import { createSendActions, type SocketSendActions } from './send';
import type { SocketGetState, SocketSetState } from './types';

export type SocketActions =
  & SocketUtilActions
  & SocketListenerActions
  & SocketConnectionActions
  & SocketRoomActions
  & SocketSendActions;

export const createSocketActions = (set: SocketSetState, get: SocketGetState): SocketActions => ({
  ...createUtilActions(set, get),
  ...createListenerActions(set, get),
  ...createConnectionActions(set, get),
  ...createRoomActions(set, get),
  ...createSendActions(set, get),
});
