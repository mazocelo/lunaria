export const ROOM_LOCK_BUSY_ERROR_CODE = 'ROOM_LOCK_BUSY';

const ROOM_LOCK_BUSY_ERROR_MESSAGE = 'Operacao em andamento na sala. Tente novamente em alguns segundos.';

export function createRoomLockBusyError() {
  const error = new Error(ROOM_LOCK_BUSY_ERROR_MESSAGE);
  error.code = ROOM_LOCK_BUSY_ERROR_CODE;
  return error;
}

export function isRoomLockBusyError(error) {
  if (!error) return false;
  if (error.code === ROOM_LOCK_BUSY_ERROR_CODE) return true;

  const message = String(error.message || '');
  return message.includes('Opera') && message.includes('andamento');
}
