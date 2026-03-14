import crypto from 'crypto';
import db from '../Model/index.js';
import r2StorageService from '../services/r2StorageService.js';
import logger from '../helpers/logger.js';
import { AI_JOB_STATUS } from './aiJobs.js';
import { QUEUE_NAMES } from './queueNames.js';
import { getAudioQueue } from './audioQueue.js';

const log = logger.child({ module: 'enqueueAudioJob' });

export async function enqueueAudioJob({ text, voiceId, provider, entityType, entityId, userId }) {
  if (!text) {
    throw Object.assign(new Error('text e obrigatorio para job de audio'), { statusCode: 400 });
  }

  if (!r2StorageService.isConfigured()) {
    throw Object.assign(
      new Error('R2 nao configurado — jobs de audio requerem storage'),
      { statusCode: 503 }
    );
  }

  const fingerprint = crypto.createHash('sha256')
    .update(`${text.slice(0, 4000)}|${voiceId || ''}|${provider || 'openai'}`)
    .digest('hex')
    .slice(0, 16);
  const dedupEntityId = entityId ? String(entityId) : `batch:${fingerprint}`;

  const existing = await db.prisma.ai_jobs.findFirst({
    where: {
      queue: QUEUE_NAMES.AUDIO,
      entity_type: entityType || 'narration',
      entity_id: dedupEntityId,
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
      queue: QUEUE_NAMES.AUDIO,
      entity_type: entityType || 'narration',
      entity_id: dedupEntityId,
      owner_user_id: Number.isNaN(parsedUserId) ? null : parsedUserId,
      status: AI_JOB_STATUS.QUEUED,
      request_payload: { text: text.slice(0, 4000), voiceId, provider, entityType, entityId },
      attempts_total: 2,
      attempts_made: 0
    }
  });

  try {
    const queue = getAudioQueue();
    await queue.add('synthesize-audio', {
      aiJobId: aiJob.id,
      text,
      voiceId,
      provider,
      entityType,
      entityId: dedupEntityId
    }, { jobId: aiJob.id });

    const updatedJob = await db.prisma.ai_jobs.update({
      where: { id: aiJob.id },
      data: { bullmq_job_id: aiJob.id }
    });

    log.info({ aiJobId: aiJob.id, entityType, voiceId }, 'Job de audio enfileirado');
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

export default enqueueAudioJob;
