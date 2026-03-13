import db from '../Model/index.js';
import { QUEUE_NAMES } from './queueNames.js';

export const AI_JOB_STATUS = Object.freeze({
  QUEUED: 'queued',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
});

function buildRoteiroHistoriaWhere(historiaId) {
  return {
    queue: QUEUE_NAMES.ROTEIRO,
    entity_type: 'historia',
    entity_id: String(historiaId)
  };
}

export async function findOpenRoteiroJobForHistoria(historiaId) {
  return db.prisma.ai_jobs.findFirst({
    where: {
      ...buildRoteiroHistoriaWhere(historiaId),
      status: {
        in: [AI_JOB_STATUS.QUEUED, AI_JOB_STATUS.ACTIVE]
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });
}

export async function findLatestRoteiroJobForHistoria(historiaId) {
  return db.prisma.ai_jobs.findFirst({
    where: buildRoteiroHistoriaWhere(historiaId),
    orderBy: {
      created_at: 'desc'
    }
  });
}

export function serializeAiJob(job) {
  if (!job) return null;

  return {
    id: job.id,
    status: job.status,
    attempts_made: job.attempts_made,
    attempts_total: job.attempts_total,
    last_error: job.last_error,
    queued_at: job.queued_at,
    started_at: job.started_at,
    finished_at: job.finished_at
  };
}

export default {
  AI_JOB_STATUS,
  findOpenRoteiroJobForHistoria,
  findLatestRoteiroJobForHistoria,
  serializeAiJob
};
