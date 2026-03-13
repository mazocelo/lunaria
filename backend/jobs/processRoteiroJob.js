import { Worker } from 'bullmq';
import db from '../Model/index.js';
import { processarGeracaoRoteiro } from '../services/roteiroGenerationService.js';
import { AI_JOB_STATUS } from './aiJobs.js';
import { createBullmqConnection, getBullmqPrefix, getRoteiroWorkerConcurrency } from './connection.js';
import { QUEUE_NAMES } from './queueNames.js';

export async function processRoteiroJob(job) {
  const aiJobId = job?.data?.aiJobId || String(job.id);
  const historiaId = Number.parseInt(job?.data?.historiaId, 10);
  const userId = job?.data?.userId ?? null;
  const attemptsMade = (job.attemptsMade || 0) + 1;
  const attemptsTotal = Number.parseInt(job.opts?.attempts, 10) || 2;
  const bullmqJobId = String(job.id || aiJobId);

  if (!aiJobId || Number.isNaN(historiaId)) {
    throw new Error('Payload de job de roteiro invalido');
  }

  try {
    const historia = await db.Historia.findById(historiaId);
    if (!historia) {
      throw new Error(`Historia ${historiaId} nao encontrada`);
    }

    await db.prisma.ai_jobs.update({
      where: { id: aiJobId },
      data: {
        status: AI_JOB_STATUS.ACTIVE,
        bullmq_job_id: bullmqJobId,
        started_at: new Date(),
        finished_at: null,
        attempts_made: attemptsMade,
        last_error: null
      }
    });

    await db.Historia.updateHistoria(historiaId, { roteiro_status: 'generating' });

    await processarGeracaoRoteiro(historia, userId, {
      mode: job?.data?.mode,
      markErrorStatus: false
    });

    await db.prisma.ai_jobs.update({
      where: { id: aiJobId },
      data: {
        status: AI_JOB_STATUS.COMPLETED,
        bullmq_job_id: bullmqJobId,
        attempts_made: attemptsMade,
        last_error: null,
        finished_at: new Date()
      }
    });
  } catch (error) {
    const hasRetryRemaining = attemptsMade < attemptsTotal;

    try {
      await db.prisma.ai_jobs.update({
        where: { id: aiJobId },
        data: {
          status: hasRetryRemaining ? AI_JOB_STATUS.QUEUED : AI_JOB_STATUS.FAILED,
          bullmq_job_id: bullmqJobId,
          attempts_made: attemptsMade,
          last_error: error.message,
          finished_at: hasRetryRemaining ? null : new Date()
        }
      });
    } catch (_) {
      // melhor esforco
    }

    try {
      const historia = await db.Historia.findById(historiaId);
      if (historia) {
        await db.Historia.updateHistoria(historiaId, {
          roteiro_status: hasRetryRemaining ? 'queued' : 'error'
        });
      }
    } catch (_) {
      // melhor esforco
    }

    throw error;
  }
}

export function createRoteiroWorker() {
  return new Worker(QUEUE_NAMES.ROTEIRO, processRoteiroJob, {
    connection: createBullmqConnection(),
    prefix: getBullmqPrefix(),
    concurrency: getRoteiroWorkerConcurrency()
  });
}

export default {
  createRoteiroWorker,
  processRoteiroJob
};
