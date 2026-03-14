import { Worker } from 'bullmq';
import db from '../Model/index.js';
import r2StorageService from '../services/r2StorageService.js';
import { AI_JOB_STATUS } from './aiJobs.js';
import { createBullmqConnection, getBullmqPrefix } from './connection.js';
import { QUEUE_NAMES } from './queueNames.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'processAudioJob' });

const TTS_BASE_URL = process.env.LUNARIA_TTS_URL || 'http://localhost:5050';

async function synthesizeSpeech(text, voiceId, provider = 'openai') {
  const response = await fetch(`${TTS_BASE_URL}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: voiceId, provider })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS error ${response.status}: ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function processAudioJob(job) {
  const aiJobId = job?.data?.aiJobId || String(job.id);
  const { text, voiceId, provider, entityType, entityId } = job.data;
  const attemptsMade = (job.attemptsMade || 0) + 1;
  const attemptsTotal = Number.parseInt(job.opts?.attempts, 10) || 2;
  const bullmqJobId = String(job.id || aiJobId);

  if (!aiJobId || !text) {
    throw new Error('Payload de job de audio invalido');
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

    if (!r2StorageService.isConfigured()) {
      throw new Error('R2 nao configurado — audio nao pode ser armazenado');
    }

    log.info({ aiJobId, entityType, voiceId }, 'Sintetizando audio');
    const audioBuffer = await synthesizeSpeech(text, voiceId, provider || 'openai');

    const key = `audio/${entityType || 'narration'}/${entityId || aiJobId}-${Date.now()}.wav`;
    const finalUrl = await r2StorageService.upload(key, audioBuffer, 'audio/wav');
    log.info({ aiJobId, key }, 'Audio salvo no R2');

    await db.prisma.ai_jobs.update({
      where: { id: aiJobId },
      data: {
        status: AI_JOB_STATUS.COMPLETED,
        bullmq_job_id: bullmqJobId,
        attempts_made: attemptsMade,
        last_error: null,
        finished_at: new Date(),
        response_text: finalUrl,
        request_prompt: text.slice(0, 4000)
      }
    });

    log.info({ aiJobId, entityType }, 'Audio gerado com sucesso');
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

export function createAudioWorker() {
  return new Worker(QUEUE_NAMES.AUDIO, processAudioJob, {
    connection: createBullmqConnection(),
    prefix: getBullmqPrefix(),
    concurrency: 2,
    lockDuration: 120_000,
    stalledInterval: 30_000,
    maxStalledCount: 2
  });
}

export default { createAudioWorker, processAudioJob };
