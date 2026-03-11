import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../redis/redis-config.js';

const prisma = new PrismaClient();

const LOCK_TTL_MS = 30000; // 30s max lock
const LOCK_PREFIX = 'tts_lock:';

/**
 * Gera cache key determinística: SHA256(text + voiceId + provider)
 */
function generateCacheKey(text, voiceId, provider) {
  return crypto.createHash('sha256')
    .update(`${text}|${voiceId}|${provider}`)
    .digest('hex');
}

/**
 * Busca áudio no cache do banco
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
    console.error('ttsCacheService.getFromCache error:', err.message);
    return null;
  }
}

/**
 * Salva áudio no cache do banco
 */
async function saveToCache(cacheKey, provider, voiceId, caracteres, audioBuffer) {
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
    console.error('ttsCacheService.saveToCache error:', err.message);
  }
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
    console.error('ttsCacheService.acquireLock error:', err.message);
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
    console.error('ttsCacheService.releaseLock error:', err.message);
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
  const cacheKey = generateCacheKey(text, voiceId, provider);

  // 1. Check cache
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

export default { generateCacheKey, getOrGenerate };
