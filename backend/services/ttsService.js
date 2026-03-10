/**
 * TTS Service - ElevenLabs Text-to-Speech
 * Gera áudio a partir de texto usando a API da ElevenLabs
 */

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

class TTSService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || null;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Gera áudio a partir de texto
   * @param {string} text - Texto para converter em fala
   * @param {string} voiceId - ID da voz na ElevenLabs
   * @returns {Promise<Buffer>} Buffer do áudio MP3
   */
  async generateSpeech(text, voiceId) {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key não configurada');
    }

    if (!text || !voiceId) {
      throw new Error('text e voiceId são obrigatórios');
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: DEFAULT_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Lista vozes disponíveis na conta
   * @returns {Promise<Array>} Lista de vozes
   */
  async listVoices() {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key não configurada');
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error (${response.status})`);
    }

    const data = await response.json();
    return (data.voices || [])
      .filter(v => (v.high_quality_base_model_ids || []).includes(DEFAULT_MODEL))
      .map(v => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels || {}
      }));
  }
}

export default new TTSService();
