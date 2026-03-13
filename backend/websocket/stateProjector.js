import { buildTurnEventPayload } from './utils/turnStateMachine.js';

export function buildTurnStateProjection(roomId, sessao) {
  return {
    roomId,
    ...buildTurnEventPayload(sessao),
    timestamp: Date.now()
  };
}
