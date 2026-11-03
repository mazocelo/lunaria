import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../redis/redis-config.js';
import r2StorageService from './r2StorageService.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'ttsCacheService' });

const prisma = new PrismaClient();

const LOCK_TTL_MS = 30000; // 30s max lock
const LOCK_PREFIX = 'tts_lock:';
const CACHE_ENABLED = true;
const CACHE_MAX_AUDIO_BYTES = Number.parseInt(process.env.TTS_CACHE_MAX_AUDIO_BYTES || `${2 * 1024 * 1024}`, 10);
const CACHE_TTL_DAYS = Number.parseInt(process.env.TTS_CACHE_TTL_DAYS || '7', 10);
const CACHE_CLEANUP_INTERVAL_MS = Number.parseInt(process.env.TTS_CACHE_CLEANUP_INTERVAL_MS || `${60 * 60 * 1000}`, 10);
const CACHE_SKIPPED_PROVIDERS = new Set(
  String(process.env.TTS_CACHE_SKIPPED_PROVIDERS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

let cleanupPromise = null;
let nextCleanupAt = 0;

/**
 * Gera cache key determinística: SHA256(text + voiceId + provider)
 */
function generateCacheKey(text, voiceId, provider) {
  return crypto.createHash('sha256')
    .update(`${text}|${voiceId || '__default__'}|${provider}`)
    .digest('hex');
}

function shouldUseCache(provider) {
  if (!CACHE_ENABLED) return false;
  return !CACHE_SKIPPED_PROVIDERS.has(String(provider || '').toLowerCase());
}

function shouldPersistAudio(provider, audioBuffer) {
  if (!shouldUseCache(provider)) return false;
  if (!Number.isFinite(CACHE_MAX_AUDIO_BYTES) || CACHE_MAX_AUDIO_BYTES <= 0) return true;
  return audioBuffer.length <= CACHE_MAX_AUDIO_BYTES;
}

/**
 * Busca áudio binário no cache do banco
 * @returns {Buffer|null}
 */
async function getFromCache(cacheKey) {
  try {
    const cached = await prisma.tts_cache.findUnique({
      where: { cache_key: cacheKey },
      select: { audio_data: true },
    });
    return cached?.audio_data || null;
  } catch (err) {
    log.error({ err }, 'getFromCache error');
    return null;
  }
}

/**
 * Busca URL de áudio no cache do banco (usado para opensource → R2)
 * @returns {string|null}
 */
async function getUrlFromCache(cacheKey) {
  try {
    const cached = await prisma.tts_cache.findUnique({
      where: { cache_key: cacheKey },
      select: { audio_url: true },
    });
    return cached?.audio_url || null;
  } catch (err) {
    log.error({ err }, 'getUrlFromCache error');
    return null;
  }
}

/**
 * Salva URL de áudio no cache (opensource → R2). Sem binary.
 */
async function saveUrlToCache(cacheKey, provider, voiceId, caracteres, tamanhoBytes, audioUrl) {
  try {
    await prisma.tts_cache.upsert({
      where: { cache_key: cacheKey },
      create: {
        cache_key: cacheKey,
        provider,
        voice_id: voiceId,
        caracteres,
        audio_url: audioUrl,
        tamanho_bytes: tamanhoBytes,
      },
      update: { audio_url: audioUrl },
    });
  } catch (err) {
    log.error({ err }, 'saveUrlToCache error');
  }
}

/**
 * Salva áudio binário no cache do banco
 */
async function saveToCache(cacheKey, provider, voiceId, caracteres, audioBuffer) {
  if (!shouldPersistAudio(provider, audioBuffer)) return;

  try {
    await prisma.tts_cache.create({
      data: {
        cache_key: cacheKey,
        provider,
        voice_id: voiceId,
        caracteres,
        audio_data: audioBuffer,
        tamanho_bytes: audioBuffer.length,
      },
    });
  } catch (err) {
    // Unique constraint = outro processo salvou primeiro — OK
    if (err.code === 'P2002') return;
    log.error({ err }, 'saveToCache error');
  }
}

async function pruneExpiredEntries({ force = false } = {}) {
  if (!Number.isFinite(CACHE_TTL_DAYS) || CACHE_TTL_DAYS <= 0) {
    return { count: 0 };
  }

  if (!force && Date.now() < nextCleanupAt) {
    return { count: 0 };
  }

  if (cleanupPromise) {
    return cleanupPromise;
  }

  nextCleanupAt = Date.now() + CACHE_CLEANUP_INTERVAL_MS;
  const cutoff = new Date(Date.now() - (CACHE_TTL_DAYS * 24 * 60 * 60 * 1000));

  cleanupPromise = prisma.tts_cache.deleteMany({
    where: {
      criado_em: {
        lt: cutoff
      }
    }
  }).catch((err) => {
    log.error({ err }, 'pruneExpiredEntries error');
    return { count: 0 };
  }).finally(() => {
    cleanupPromise = null;
  });

  return cleanupPromise;
}

/**
 * Tenta adquirir lock distribuído via Redis SETNX
 * @returns {boolean} true se adquiriu
 */
async function acquireLock(cacheKey) {
  try {
    if (!redisClient.isOpen) return true; // sem Redis, prossegue sem lock
    const key = LOCK_PREFIX + cacheKey;
    const result = await redisClient.set(key, '1', { NX: true, PX: LOCK_TTL_MS });
    return result === 'OK';
  } catch (err) {
    log.error({ err }, 'acquireLock error');
    return true; // falha no Redis → prossegue sem lock
  }
}

/**
 * Libera lock distribuído
 */
async function releaseLock(cacheKey) {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(LOCK_PREFIX + cacheKey);
  } catch (err) {
    log.error({ err }, 'releaseLock error');
  }
}

/**
 * Aguarda lock ser liberado, re-checando cache periodicamente
 * @returns {Buffer|null} áudio do cache se encontrado enquanto esperava
 */
async function waitForLock(cacheKey, maxWaitMs = LOCK_TTL_MS) {
  const start = Date.now();
  const interval = 500;
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, interval));
    // Checa se o outro processo já salvou no cache
    const cached = await getFromCache(cacheKey);
    if (cached) return cached;
    // Checa se lock foi liberado
    const locked = await acquireLock(cacheKey);
    if (locked) return null; // adquiriu lock — caller deve gerar
  }
  return null;
}

/**
 * Fluxo principal: busca cache → lock → gera → salva
 * @param {string} text
 * @param {string} voiceId
 * @param {string} provider
 * @param {Function} generateFn - async () => Buffer (chama o TTS provider)
 * @returns {{ audioBuffer: Buffer, fromCache: boolean }}
 */
async function getOrGenerate(text, voiceId, provider, generateFn) {
  pruneExpiredEntries().catch(() => {});

  if (!shouldUseCache(provider)) {
    const audioBuffer = await generateFn();
    return { audioBuffer, fromCache: false };
  }

  const cacheKey = generateCacheKey(text, voiceId, provider);

  // 1. Check R2 URL cache first (entradas com audio_url)
  const urlCached = await getUrlFromCache(cacheKey);
  if (urlCached) {
    try {
      const r2Buffer = await r2StorageService.fetchAudio(urlCached);
      return { audioBuffer: r2Buffer, fromCache: true };
    } catch (err) {
      log.warn({ err, cacheKey }, 'R2 fetch failed, falling back to audio_data');
    }
  }

  // 2. Check binary cache (entradas legacy com audio_data)
  const cached = await getFromCache(cacheKey);
  if (cached) return { audioBuffer: Buffer.from(cached), fromCache: true };

  // 2. Try to acquire lock
  const gotLock = await acquireLock(cacheKey);
  if (!gotLock) {
    // Outro processo está gerando — espera e retorna do cache
    const waitResult = await waitForLock(cacheKey);
    if (waitResult) return { audioBuffer: Buffer.from(waitResult), fromCache: true };
    // Timeout — gera mesmo assim como fallback
  }

  // 3. Generate audio
  try {
    const audioBuffer = await generateFn();

    // 4. Save to cache (fire-and-forget)
    saveToCache(cacheKey, provider, voiceId, text.length, audioBuffer);

    return { audioBuffer, fromCache: false };
  } finally {
    releaseLock(cacheKey);
  }
}

export default { generateCacheKey, getOrGenerate, getUrlFromCache, saveUrlToCache, pruneExpiredEntries };
