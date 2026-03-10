import express from 'express';
import ttsService from '../services/ttsService.js';

const router = express.Router();

const MAX_TEXT_LENGTH = 5000;

/**
 * POST /tts/generate
 * Gera áudio a partir de texto usando ElevenLabs
 */
router.post('/generate', async (req, res) => {
  try {
    if (!ttsService.isConfigured()) {
      return res.status(503).json({ success: false, error: 'TTS não configurado' });
    }

    const { text, voiceId } = req.body;

    if (!text || !voiceId) {
      return res.status(400).json({ success: false, error: 'text e voiceId são obrigatórios' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ success: false, error: `Texto excede limite de ${MAX_TEXT_LENGTH} caracteres` });
    }

    const audioBuffer = await ttsService.generateSpeech(text, voiceId);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS generate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /tts/voices
 * Lista vozes disponíveis na ElevenLabs
 */
router.get('/voices', async (req, res) => {
  try {
    if (!ttsService.isConfigured()) {
      return res.status(503).json({ success: false, error: 'TTS não configurado' });
    }

    const voices = await ttsService.listVoices();
    res.json({ success: true, data: voices });
  } catch (error) {
    console.error('TTS voices error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PREVIEW_TEXT_PTBR = 'Olá aventureiros! Eu serei o mestre desta jornada épica. Preparem-se para uma aventura inesquecível!';

/**
 * POST /tts/preview
 * Gera preview de voz em PT-BR
 */
router.post('/preview', async (req, res) => {
  try {
    if (!ttsService.isConfigured()) {
      return res.status(503).json({ success: false, error: 'TTS não configurado' });
    }

    const { voiceId } = req.body;

    if (!voiceId) {
      return res.status(400).json({ success: false, error: 'voiceId é obrigatório' });
    }

    const audioBuffer = await ttsService.generateSpeech(PREVIEW_TEXT_PTBR, voiceId);

    res.set({
      'Content-Type': 'audio/mpeg',
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
