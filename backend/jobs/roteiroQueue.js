import { Queue } from 'bullmq';
import { createBullmqConnection, getBullmqPrefix } from './connection.js';
import { QUEUE_NAMES } from './queueNames.js';

let roteiroQueue = null;

export function getRoteiroQueue() {
  if (!roteiroQueue) {
    roteiroQueue = new Queue(QUEUE_NAMES.ROTEIRO, {
      connection: createBullmqConnection(),
      prefix: getBullmqPrefix(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 100
      }
    });
  }

  return roteiroQueue;
}

export async function closeRoteiroQueue() {
  if (!roteiroQueue) return;
  await roteiroQueue.close();
  roteiroQueue = null;
}

export default {
  getRoteiroQueue,
  closeRoteiroQueue
};
