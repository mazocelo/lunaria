/**
 * Tipos compartilhados entre os modulos de actions do socket store.
 *
 * Os shapes de payload de eventos socket.io ficam soltos como
 * `Record<string, unknown>` ate o backend ter contratos formais — o
 * boundary fica nos normalizers de `dtos.ts`.
 */

import type { SocketState } from './states';

export type SocketSetState = {
  (partial: Partial<SocketState>): void;
  (updater: (state: SocketState) => Partial<SocketState>): void;
};

/**
 * `get()` no combine puro retorna apenas `SocketState`, mas as actions sao
 * encadeadas (uma chama outra via `get().outraAction()`). Em vez de
 * espalhar a uniao `SocketState & Actions` por todo arquivo, usamos esse
 * shape laxo: as actions sao acessadas via index (`unknown`) e cada modulo
 * faz cast inline para a propria assinatura quando le do `get()`.
 */
export type SocketGetState = () => SocketState & Record<string, unknown>;
