import { Queue } from 'bullmq';
import { createBullmqConnection, getBullmqPrefix } from './connection.js';
import { QUEUE_NAMES } from './queueNames.js';

let imageQueue = null;

export function getImageQueue() {
  if (!imageQueue) {
    imageQueue = new Queue(QUEUE_NAMES.IMAGE, {
      connection: createBullmqConnection(),
      prefix: getBullmqPrefix(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000
        },
        removeOnComplete: 100,
        removeOnFail: 100
      }
    });
  }

  return imageQueue;
}

export async function closeImageQueue() {
  if (!imageQueue) return;
  await imageQueue.close();
  imageQueue = null;
}

export default { getImageQueue, closeImageQueue };
