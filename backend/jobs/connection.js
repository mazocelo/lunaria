import dotenv from 'dotenv';
import IORedis from 'ioredis';

dotenv.config();

function getRedisUrl() {
  const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL ou UPSTASH_REDIS_URL eh obrigatoria para BullMQ');
  }
  return redisUrl;
}

function getPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getBullmqPrefix() {
  return process.env.BULLMQ_PREFIX || 'rolechat';
}

export function getRoteiroWorkerConcurrency() {
  return getPositiveInteger(process.env.BULLMQ_ROTEIRO_CONCURRENCY, 2);
}

export function createBullmqConnection() {
  return new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

export default {
  createBullmqConnection,
  getBullmqPrefix,
  getRoteiroWorkerConcurrency
};
