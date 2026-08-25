import { InferenceClient } from '@huggingface/inference';

/**
 * TTS via Kokoro-82M, servido pelos Inference Providers da HuggingFace.
 *
 * Entra como alternativa barata ao ElevenLabs: Kokoro e um modelo aberto e
 * pequeno (82M parametros), com custo por caractere muito menor. A qualidade
 * nao empata com a do ElevenLabs, entao a ideia e escolher por contexto — vozes
 * de NPC secundario e narracao longa aqui, o Mestre no provider caro.
 *
 * Implementa o mesmo contrato dos demais providers (`isConfigured`,
 * `getDefaultVoiceId`, `getContentType`, `generateSpeech`, `listVoices`), entao
 * `ttsService` o trata como qualquer outro e o cache/fila existentes valem sem
 * mudanca.
 */

const MODELO = process.env.KOKORO_MODEL || 'hexgrad/Kokoro-82M';
const PROVEDOR_HF = process.env.KOKORO_HF_PROVIDER || 'fal-ai';
const TIMEOUT_MS = Number(process.env.KOKORO_TIMEOUT_MS || 30_000);

/**
 * Vozes do Kokoro-82M. O modelo nao expoe endpoint de catalogo, entao a lista e
 * estatica — vem da nomenclatura oficial: primeira letra e o idioma (a=en-US,
 * b=en-GB, p=pt-BR), segunda o genero (f/m).
 *
 * Portugues vem primeiro porque o jogo e em portugues; as vozes em ingles ficam
 * disponiveis para quem quiser sotaque estrangeiro num NPC.
 */
const VOZES = [
  { voice_id: 'pf_dora', name: 'Dora (pt-BR)', category: 'feminina', labels: { idioma: 'pt-BR' } },
  { voice_id: 'pm_alex', name: 'Alex (pt-BR)', category: 'masculina', labels: { idioma: 'pt-BR' } },
  { voice_id: 'pm_santa', name: 'Santa (pt-BR)', category: 'masculina', labels: { idioma: 'pt-BR' } },
  { voice_id: 'af_heart', name: 'Heart (en-US)', category: 'feminina', labels: { idioma: 'en-US' } },
  { voice_id: 'af_bella', name: 'Bella (en-US)', category: 'feminina', labels: { idioma: 'en-US' } },
  { voice_id: 'am_michael', name: 'Michael (en-US)', category: 'masculina', labels: { idioma: 'en-US' } },
  { voice_id: 'bf_emma', name: 'Emma (en-GB)', category: 'feminina', labels: { idioma: 'en-GB' } },
  { voice_id: 'bm_george', name: 'George (en-GB)', category: 'masculina', labels: { idioma: 'en-GB' } },
];

const VOZES_VALIDAS = new Set(VOZES.map((v) => v.voice_id));

class KokoroProvider {
  constructor() {
    this.apiKey = process.env.HF_TOKEN || null;
    this.defaultVoiceId = process.env.KOKORO_DEFAULT_VOICE_ID || 'pf_dora';
    // Kokoro devolve WAV pelo fal-ai; declarado aqui porque o controller usa
    // isto no Content-Type da resposta e o cache usa na extensao do arquivo.
    this.contentType = 'audio/wav';
    this.client = null;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  getDefaultVoiceId() {
    return this.defaultVoiceId;
  }

  getContentType() {
    return this.contentType;
  }

  /** Cliente criado sob demanda: sem token, o provider nem aparece como configurado. */
  _getClient() {
    if (!this.client) this.client = new InferenceClient(this.apiKey);
    return this.client;
  }

  async generateSpeech(text, voiceId, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('HF_TOKEN nao configurado — Kokoro indisponivel');
    }
    const texto = String(text || '').trim();
    if (!texto) throw new Error('Texto vazio para sintese');

    // Voz desconhecida vira o default em vez de erro: o catalogo e estatico e
    // uma voz salva no perfil pode nao existir mais.
    const voz = VOZES_VALIDAS.has(voiceId) ? voiceId : this.defaultVoiceId;

    const audio = await Promise.race([
      this._getClient().textToSpeech({
        provider: PROVEDOR_HF,
        model: MODELO,
        inputs: texto,
        parameters: { voice: voz, ...(options.parameters || {}) },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('KOKORO_TIMEOUT')), TIMEOUT_MS),
      ),
    ]);

    // O SDK devolve Blob; o resto do pipeline (cache, controller) trabalha com
    // Buffer, entao a conversao acontece aqui e nao vaza para os chamadores.
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) throw new Error('Kokoro devolveu audio vazio');
    return buffer;
  }

  /** Catalogo estatico: Kokoro nao expoe endpoint de vozes. */
  async listVoices() {
    return VOZES.map((v) => ({ ...v, labels: { ...v.labels } }));
  }
}

export default KokoroProvider;
export const _vozes = VOZES;
