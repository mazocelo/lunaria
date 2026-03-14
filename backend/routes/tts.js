import express from 'express';
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'tts' });
import { getDefaultProviderName, getProvider, getConfiguredProviders } from '../services/ttsService.js';
import usageService from '../services/usageService.js';
import ttsCacheService from '../services/ttsCacheService.js';
import r2StorageService from '../services/r2StorageService.js';
import ttsLocalService from '../services/ttsLocalService.js';

// Agenda limpeza de arquivos locais de staging (roda 1x/dia)
ttsLocalService.scheduleCleanup();

function getProviderContentType(provider) {
  return typeof provider.getContentType === 'function'
    ? provider.getContentType()
    : 'audio/mpeg';
}

function resolveVoiceId(provider, requestedVoiceId) {
  if (requestedVoiceId) return requestedVoiceId;
  return typeof provider.getDefaultVoiceId === 'function'
    ? provider.getDefaultVoiceId()
    : null;
}

const router = express.Router();
const DEFAULT_PROVIDER = getDefaultProviderName();

const MAX_TEXT_LENGTH = 5000;
const PREVIEW_TEXT_PTBR = 'Olá aventureiros! Eu serei o mestre desta jornada épica. Preparem-se para uma aventura inesquecível!';

/**
 * GET /tts/providers
 * Lista providers de TTS configurados
 */
router.get('/providers', (req, res) => {
  const configured = getConfiguredProviders();
  res.json({ success: true, data: configured });
});

/**
 * GET /tts/voices?provider=elevenlabs|cartesia|opensource
 * Lista vozes disponíveis no provider
 */
router.get('/voices', async (req, res) => {
  try {
    const providerName = req.query.provider || DEFAULT_PROVIDER;
    const provider = getProvider(providerName);

    if (!provider.isConfigured()) {
      return res.status(503).json({ success: false, error: `Provider ${providerName} não configurado` });
    }

    const voices = await provider.listVoices();
    res.json({ success: true, data: voices, provider: providerName });
  } catch (error) {
    log.error({ err: error }, 'TTS voices error');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /tts/generate
 * Gera áudio a partir de texto.
 *
 * Fluxo para provider "opensource":
 *   1. Checa cache → se tiver audio_url (R2), faz proxy do binário
 *   2. Gera áudio → envia ao frontend imediatamente
 *   3. Background: salva local → upload R2 → salva URL no cache → limpa local
 *
 * Fluxo para outros providers (elevenlabs, cartesia):
 *   Cache binário em PostgreSQL (comportamento original)
 */
router.post('/generate', async (req, res) => {
  try {
    const { text, voiceId, provider: providerName = DEFAULT_PROVIDER, emotion } = req.body;
    const provider = getProvider(providerName);
    const resolvedVoiceId = resolveVoiceId(provider, voiceId);

    if (!provider.isConfigured()) {
      return res.status(503).json({ success: false, error: `Provider ${providerName} não configurado` });
    }

    if (!text || !resolvedVoiceId) {
      return res.status(400).json({ success: false, error: 'text e voiceId são obrigatórios' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ success: false, error: `Texto excede limite de ${MAX_TEXT_LENGTH} caracteres` });
    }

    const options = {};
    if (emotion) options.emotion = emotion;

    // ── Fluxo opensource: R2 como cache persistente ──────────────────────────
    if (providerName === 'opensource' && r2StorageService.isConfigured()) {
      const cacheKey = ttsCacheService.generateCacheKey(text, resolvedVoiceId, providerName);
      const contentType = getProviderContentType(provider);

      // 1. Checa cache → proxy do R2
      const cachedUrl = await ttsCacheService.getUrlFromCache(cacheKey);
      if (cachedUrl) {
        try {
          const r2Buffer = await r2StorageService.fetchAudio(cachedUrl);
          res.set({
            'Content-Type': contentType,
            'Content-Length': r2Buffer.length,
            'Cache-Control': 'public, max-age=86400',
            'X-Cache': 'HIT-R2',
            'X-Audio-Cache-Key': cacheKey,
          });
          return res.send(r2Buffer);
        } catch (fetchErr) {
          log.warn({ err: fetchErr }, '[tts-r2] falha ao buscar do R2, regera');
          // Continua para regenerar
        }
      }

      // 2. Gera áudio
      const tTTS = Date.now();
      const audioBuffer = await provider.generateSpeech(text, resolvedVoiceId, options);

      if (req.user?.id) {
        usageService.track({ userId: req.user.id, provider: providerName, tipo: 'tts', caracteres: text.length, duracao_ms: Date.now() - tTTS });
      }

      // 3. Envia ao frontend imediatamente
      res.set({
        'Content-Type': contentType,
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'no-cache',
        'X-Cache': 'MISS',
        'X-Audio-Cache-Key': cacheKey,
      });
      res.send(audioBuffer);

      // 4. Background: local → R2 → cache URL → limpa local
      setImmediate(async () => {
        const ext = contentType === 'audio/wav' ? 'wav' : 'mp3';
        const r2Key = `${cacheKey}.${ext}`;
        let localPath = null;
        try {
          localPath = await ttsLocalService.save(cacheKey, audioBuffer, ext);
          const url = await r2StorageService.upload(r2Key, audioBuffer, contentType);
          await ttsCacheService.saveUrlToCache(cacheKey, providerName, resolvedVoiceId, text.length, audioBuffer.length, url);
          await ttsLocalService.remove(localPath);
          log.info({ r2Key }, '[tts-r2] cached');
        } catch (err) {
          log.error({ err, r2Key }, '[tts-r2] upload falhou');
          // Local fica para cleanup de 24h
        }
      });

      return;
    }

    // ── Fluxo padrão: cache binário em PostgreSQL ────────────────────────────
    const cacheKey = ttsCacheService.generateCacheKey(text, resolvedVoiceId, providerName);
    const tTTS = Date.now();
    const { audioBuffer, fromCache } = await ttsCacheService.getOrGenerate(
      text, resolvedVoiceId, providerName,
      () => provider.generateSpeech(text, resolvedVoiceId, options)
    );

    if (!fromCache && req.user?.id) {
      usageService.track({ userId: req.user.id, provider: providerName, tipo: 'tts', caracteres: text.length, duracao_ms: Date.now() - tTTS });
    }

    res.set({
      'Content-Type': getProviderContentType(provider),
      'Content-Length': audioBuffer.length,
      'Cache-Control': fromCache ? 'public, max-age=86400' : 'no-cache',
      'X-Audio-Cache-Key': cacheKey,
    });
    res.send(audioBuffer);
  } catch (error) {
    log.error({ err: error }, 'TTS generate error');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /tts/preview
 * Gera preview de voz em PT-BR
 */
router.post('/preview', async (req, res) => {
  try {
    const { voiceId, provider: providerName = DEFAULT_PROVIDER, emotion } = req.body;
    const provider = getProvider(providerName);
    const resolvedVoiceId = resolveVoiceId(provider, voiceId);

    if (!provider.isConfigured()) {
      return res.status(503).json({ success: false, error: `Provider ${providerName} não configurado` });
    }

    if (!resolvedVoiceId) {
      return res.status(400).json({ success: false, error: 'voiceId é obrigatório' });
    }

    const options = {};
    if (emotion) options.emotion = emotion;

    const cacheKey = ttsCacheService.generateCacheKey(PREVIEW_TEXT_PTBR, resolvedVoiceId, providerName);
    const tPrev = Date.now();
    const audioBuffer = await provider.generateSpeech(PREVIEW_TEXT_PTBR, resolvedVoiceId, options);

    if (req.user?.id) usageService.track({ userId: req.user.id, provider: providerName, tipo: 'tts', caracteres: PREVIEW_TEXT_PTBR.length, duracao_ms: Date.now() - tPrev, metadata: { preview: true } });

    res.set({
      'Content-Type': getProviderContentType(provider),
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache',
      'X-Audio-Cache-Key': cacheKey,
    });
    res.send(audioBuffer);
  } catch (error) {
    log.error({ err: error }, 'TTS preview error');
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
