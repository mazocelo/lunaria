import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import logger from '../helpers/logger.js';
import { AI_JOB_STATUS } from './aiJobs.js';
import { QUEUE_NAMES } from './queueNames.js';
import { getImageQueue } from './imageQueue.js';

const log = logger.child({ module: 'enqueueImageJob' });

const IMAGE_LOCK_PREFIX = 'lock:image:';
const IMAGE_LOCK_TTL_MS = 10000;

async function acquireImageLock(entityType, entityId) {
  await gerenciadorSessoes.initialize();
  const redis = gerenciadorSessoes.client;
  const token = `${process.pid}:${Date.now()}:${Math.random()}`;
  const key = `${IMAGE_LOCK_PREFIX}${entityType}:${entityId}`;
  const locked = await redis.set(key, token, { NX: true, PX: IMAGE_LOCK_TTL_MS });
  if (locked !== 'OK') return null;
  return { key, token };
}

async function releaseImageLock(lock) {
  if (!lock) return;
  try {
    await gerenciadorSessoes.initialize();
    const redis = gerenciadorSessoes.client;
    const current = await redis.get(lock.key);
    if (current === lock.token) {
      await redis.del(lock.key);
    }
  } catch (error) {
    log.warn({ err: error, key: lock.key }, 'Erro ao liberar lock de imagem');
  }
}

export async function enqueueImageJob({ entityType, entityId, entityData, prompt, userId }) {
  if (!entityType || !entityId) {
    throw Object.assign(new Error('entityType e entityId sao obrigatorios'), { statusCode: 400 });
  }

  const lock = await acquireImageLock(entityType, entityId);
  if (!lock) {
    const existingWhileLocked = await db.prisma.ai_jobs.findFirst({
      where: {
        queue: QUEUE_NAMES.IMAGE,
        entity_type: entityType,
        entity_id: String(entityId),
        status: { in: [AI_JOB_STATUS.QUEUED, AI_JOB_STATUS.ACTIVE] }
      },
      orderBy: { created_at: 'desc' }
    });
    if (existingWhileLocked) {
      return { job: existingWhileLocked, existing: true };
    }
    throw Object.assign(new Error('Geracao de imagem em andamento. Tente novamente.'), {
      statusCode: 409,
      code: 'IMAGE_LOCKED'
    });
  }

  try {
    const existing = await db.prisma.ai_jobs.findFirst({
      where: {
        queue: QUEUE_NAMES.IMAGE,
        entity_type: entityType,
        entity_id: String(entityId),
        status: { in: [AI_JOB_STATUS.QUEUED, AI_JOB_STATUS.ACTIVE] }
      },
      orderBy: { created_at: 'desc' }
    });

    if (existing) {
      return { job: existing, existing: true };
    }

    const parsedUserId = userId ? Number.parseInt(userId, 10) : null;

    const aiJob = await db.prisma.ai_jobs.create({
      data: {
        queue: QUEUE_NAMES.IMAGE,
        entity_type: entityType,
        entity_id: String(entityId),
        owner_user_id: Number.isNaN(parsedUserId) ? null : parsedUserId,
        status: AI_JOB_STATUS.QUEUED,
        request_payload: { entityType, entityId, entityData, prompt },
        attempts_total: 2,
        attempts_made: 0
      }
    });

    try {
      const queue = getImageQueue();
      await queue.add('generate-image', {
        aiJobId: aiJob.id,
        entityType,
        entityId: String(entityId),
        entityData,
        prompt
      }, { jobId: aiJob.id });

      const updatedJob = await db.prisma.ai_jobs.update({
        where: { id: aiJob.id },
        data: { bullmq_job_id: aiJob.id }
      });

      log.info({ aiJobId: aiJob.id, entityType, entityId }, 'Job de imagem enfileirado');
      return { job: updatedJob, existing: false };
    } catch (error) {
      await db.prisma.ai_jobs.update({
        where: { id: aiJob.id },
        data: {
          status: AI_JOB_STATUS.FAILED,
          last_error: error.message,
          finished_at: new Date()
        }
      });
      throw error;
    }
  } finally {
    await releaseImageLock(lock);
  }
}

export default enqueueImageJob;
