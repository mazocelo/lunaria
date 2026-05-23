/**
 * 🌐 SOCKET ACTIONS - Orquestrador que combina todos os módulos de ações
 *
 * Módulos:
 * - utils.js: logs, listeners, validação, emit seguro, normalização
 * - listeners.js: setupInternalListeners (todos os socket.on)
 * - connection.js: connect, authenticate, monitor, disconnect, token
 * - rooms.js: joinRoom, leaveRoom
 * - send.js: mensagens, ações, dados, sessão, turnos
 */
import { createUtilActions } from './utils.js';
import { createListenerActions } from './listeners.js';
import { createConnectionActions } from './connection.js';
import { createRoomActions } from './rooms.js';
import { createSendActions } from './send.js';

export const createSocketActions = (set, get) => ({
  ...createUtilActions(set, get),
  ...createListenerActions(set, get),
  ...createConnectionActions(set, get),
  ...createRoomActions(set, get),
  ...createSendActions(set, get),
});
