import express from 'express';
import { getProvider, getConfiguredProviders } from '../services/ttsService.js';
import usageService from '../services/usageService.js';
import ttsCacheService from '../services/ttsCacheService.js';

function getProviderContentType(provider) {
  return typeof provider.getContentType === 'function'
    ? provider.getContentType()
    : 'audio/mpeg';
}

const router = express.Router();
const DEFAULT_PROVIDER = process.env.DEFAULT_TTS_PROVIDER || 'elevenlabs';

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
 * GET /tts/voices?provider=elevenlabs|cartesia
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
    console.error('TTS voices error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /tts/generate
 * Gera áudio a partir de texto
 */
router.post('/generate', async (req, res) => {
  try {
    const { text, voiceId, provider: providerName = DEFAULT_PROVIDER, emotion } = req.body;
    const provider = getProvider(providerName);

    if (!provider.isConfigured()) {
      return res.status(503).json({ success: false, error: `Provider ${providerName} não configurado` });
    }

    if (!text || !voiceId) {
      return res.status(400).json({ success: false, error: 'text e voiceId são obrigatórios' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ success: false, error: `Texto excede limite de ${MAX_TEXT_LENGTH} caracteres` });
    }

    const options = {};
    if (emotion) options.emotion = emotion;

    const tTTS = Date.now();
    const { audioBuffer, fromCache } = await ttsCacheService.getOrGenerate(
      text, voiceId, providerName,
      () => provider.generateSpeech(text, voiceId, options)
    );

    // Só trackeia billing quando gerou de verdade (não cache hit)
    if (!fromCache && req.user?.id) {
      usageService.track({ userId: req.user.id, provider: providerName, tipo: 'tts', caracteres: text.length, duracao_ms: Date.now() - tTTS });
    }

    res.set({
      'Content-Type': getProviderContentType(provider),
      'Content-Length': audioBuffer.length,
      'Cache-Control': fromCache ? 'public, max-age=86400' : 'no-cache'
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS generate error:', error.message);
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

    if (!provider.isConfigured()) {
      return res.status(503).json({ success: false, error: `Provider ${providerName} não configurado` });
    }

    if (!voiceId) {
      return res.status(400).json({ success: false, error: 'voiceId é obrigatório' });
    }

    const options = {};
    if (emotion) options.emotion = emotion;

    const tPrev = Date.now();
    const audioBuffer = await provider.generateSpeech(PREVIEW_TEXT_PTBR, voiceId, options);

    if (req.user?.id) usageService.track({ userId: req.user.id, provider: providerName, tipo: 'tts', caracteres: PREVIEW_TEXT_PTBR.length, duracao_ms: Date.now() - tPrev, metadata: { preview: true } });

    res.set({
      'Content-Type': getProviderContentType(provider),
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS preview error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
