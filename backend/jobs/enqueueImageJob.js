import db from '../Model/index.js';
import logger from '../helpers/logger.js';
import { AI_JOB_STATUS } from './aiJobs.js';
import { QUEUE_NAMES } from './queueNames.js';
import { getImageQueue } from './imageQueue.js';

const log = logger.child({ module: 'enqueueImageJob' });

export async function enqueueImageJob({ entityType, entityId, entityData, prompt, userId }) {
  if (!entityType || !entityId) {
    throw Object.assign(new Error('entityType e entityId sao obrigatorios'), { statusCode: 400 });
  }

  // Verificar se já existe job ativo para esta entidade
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
}

export default enqueueImageJob;
