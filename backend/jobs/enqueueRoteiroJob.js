import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import { AI_JOB_STATUS, findOpenRoteiroJobForHistoria } from './aiJobs.js';
import { QUEUE_NAMES } from './queueNames.js';
import { getRoteiroQueue } from './roteiroQueue.js';

const LOCK_PREFIX = 'lock:roteiro:historia:';
const LOCK_TTL_MS = 10000;

function parseUserId(userId) {
  const parsed = Number.parseInt(userId, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveMode(historia) {
  return historia?.roteiro ? 'regenerate' : 'initial';
}

function resolveRoteiroStatusFromJob(jobStatus) {
  return jobStatus === AI_JOB_STATUS.ACTIVE ? 'generating' : 'queued';
}

async function acquireRoteiroLock(historiaId) {
  await gerenciadorSessoes.initialize();
  const redis = gerenciadorSessoes.client;
  const token = `${process.pid}:${Date.now()}:${Math.random()}`;
  const key = `${LOCK_PREFIX}${historiaId}`;
  const locked = await redis.set(key, token, { NX: true, PX: LOCK_TTL_MS });

  if (locked !== 'OK') {
    return null;
  }

  return { key, token };
}

async function releaseRoteiroLock(lock) {
  if (!lock) return;

  try {
    await gerenciadorSessoes.initialize();
    const redis = gerenciadorSessoes.client;
    const current = await redis.get(lock.key);

    if (current === lock.token) {
      await redis.del(lock.key);
    }
  } catch (error) {
    console.warn(`Erro ao liberar lock de roteiro ${lock.key}:`, error.message);
  }
}

export async function enqueueRoteiroJob({ historia, userId, ensureQuota = null }) {
  const historiaId = parseInt(historia?.id, 10);
  if (Number.isNaN(historiaId)) {
    throw Object.assign(new Error('Historia invalida para enfileirar roteiro'), { statusCode: 400 });
  }

  let lock = await acquireRoteiroLock(historiaId);
  if (!lock) {
    const existingWhileLocked = await findOpenRoteiroJobForHistoria(historiaId);
    if (existingWhileLocked) {
      return { job: existingWhileLocked, existing: true };
    }

    throw Object.assign(new Error('Geracao de roteiro em andamento. Tente novamente.'), {
      statusCode: 409,
      code: 'ROTEIRO_LOCKED'
    });
  }

  try {
    const historiaAtual = await db.Historia.findById(historiaId);
    if (!historiaAtual) {
      throw Object.assign(new Error('Historia nao encontrada'), { statusCode: 404 });
    }

    const existingJob = await findOpenRoteiroJobForHistoria(historiaId);
    if (existingJob) {
      const desiredStatus = resolveRoteiroStatusFromJob(existingJob.status);
      if (historiaAtual.roteiro_status !== desiredStatus) {
        await db.Historia.updateHistoria(historiaId, { roteiro_status: desiredStatus });
      }

      return { job: existingJob, existing: true };
    }

    if (typeof ensureQuota === 'function') {
      await ensureQuota();
    }

    const requestPayload = {
      historiaId,
      userId: parseUserId(userId),
      mode: resolveMode(historiaAtual)
    };

    const aiJob = await db.prisma.$transaction(async (tx) => {
      const created = await tx.ai_jobs.create({
        data: {
          queue: QUEUE_NAMES.ROTEIRO,
          entity_type: 'historia',
          entity_id: String(historiaId),
          owner_user_id: parseUserId(userId),
          status: AI_JOB_STATUS.QUEUED,
          request_payload: requestPayload,
          attempts_total: 2,
          attempts_made: 0
        }
      });

      await tx.historias.update({
        where: { id: historiaId },
        data: { roteiro_status: 'queued' }
      });

      return created;
    });

    try {
      const queue = getRoteiroQueue();
      await queue.add('generate', {
        aiJobId: aiJob.id,
        historiaId,
        userId: parseUserId(userId),
        mode: requestPayload.mode
      }, {
        jobId: aiJob.id
      });

      const updatedJob = await db.prisma.ai_jobs.update({
        where: { id: aiJob.id },
        data: { bullmq_job_id: aiJob.id }
      });

      return { job: updatedJob, existing: false };
    } catch (error) {
      await db.prisma.$transaction([
        db.prisma.ai_jobs.update({
          where: { id: aiJob.id },
          data: {
            status: AI_JOB_STATUS.FAILED,
            last_error: error.message,
            finished_at: new Date()
          }
        }),
        db.prisma.historias.update({
          where: { id: historiaId },
          data: { roteiro_status: 'error' }
        })
      ]);

      throw error;
    }
  } finally {
    await releaseRoteiroLock(lock);
  }
}

export default enqueueRoteiroJob;
