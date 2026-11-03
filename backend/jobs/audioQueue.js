import { Queue } from 'bullmq';
import { createBullmqConnection, getBullmqPrefix } from './connection.js';
import { QUEUE_NAMES } from './queueNames.js';

let audioQueue = null;

export function getAudioQueue() {
  if (!audioQueue) {
    audioQueue = new Queue(QUEUE_NAMES.AUDIO, {
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

  return audioQueue;
}

export async function closeAudioQueue() {
  if (!audioQueue) return;
  await audioQueue.close();
  audioQueue = null;
}

export default { getAudioQueue, closeAudioQueue };
