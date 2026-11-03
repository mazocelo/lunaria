import { Worker } from 'bullmq';
import db from '../Model/index.js';
import { generateImage } from '../services/imageGenerationService.js';
import { generateImagePrompt } from '../services/imagePromptService.js';
import r2StorageService from '../services/r2StorageService.js';
import { AI_JOB_STATUS } from './aiJobs.js';
import { createBullmqConnection, getBullmqPrefix } from './connection.js';
import { QUEUE_NAMES } from './queueNames.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'processImageJob' });

export async function processImageJob(job) {
  const aiJobId = job?.data?.aiJobId || String(job.id);
  const { entityType, entityId, entityData, prompt: rawPrompt } = job.data;
  const attemptsMade = (job.attemptsMade || 0) + 1;
  const attemptsTotal = Number.parseInt(job.opts?.attempts, 10) || 2;
  const bullmqJobId = String(job.id || aiJobId);

  if (!aiJobId || !entityType) {
    throw new Error('Payload de job de imagem invalido');
  }

  try {
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

    const prompt = rawPrompt || await generateImagePrompt(entityType, entityData || {});
    log.info({ aiJobId, entityType, entityId }, 'Gerando imagem');

    const imageUrl = await generateImage(prompt, {
      estilo_imagem: entityData?.estilo_imagem || 'fantasy_painting'
    });

    // Se R2 estiver configurado, re-upload para storage próprio
    let finalUrl = imageUrl;
    if (r2StorageService.isConfigured()) {
      try {
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const key = `images/${entityType}/${entityId || aiJobId}-${Date.now()}.png`;
        finalUrl = await r2StorageService.upload(key, buffer, 'image/png');
        log.info({ aiJobId, key }, 'Imagem salva no R2');
      } catch (r2Err) {
        log.warn({ aiJobId, err: r2Err }, 'Falha ao salvar no R2, usando URL original');
      }
    }

    await db.prisma.ai_jobs.update({
      where: { id: aiJobId },
      data: {
        status: AI_JOB_STATUS.COMPLETED,
        bullmq_job_id: bullmqJobId,
        attempts_made: attemptsMade,
        last_error: null,
        finished_at: new Date(),
        response_text: finalUrl,
        request_prompt: prompt.slice(0, 4000)
      }
    });

    log.info({ aiJobId, entityType, entityId }, 'Imagem gerada com sucesso');
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
    } catch (_) { /* melhor esforco */ }

    throw error;
  }
}

export function createImageWorker() {
  return new Worker(QUEUE_NAMES.IMAGE, processImageJob, {
    connection: createBullmqConnection(),
    prefix: getBullmqPrefix(),
    concurrency: 1,
    lockDuration: 180_000,
    stalledInterval: 60_000,
    maxStalledCount: 2
  });
}

export default { createImageWorker, processImageJob };
