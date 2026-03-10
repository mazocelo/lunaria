const CARTESIA_BASE_URL = 'https://api.cartesia.ai';
const DEFAULT_MODEL = 'sonic-3';

class CartesiaProvider {
  constructor() {
    this.apiKey = process.env.CARTESIA_API_KEY || null;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async generateSpeech(text, voiceId, options = {}) {
    if (!this.isConfigured()) throw new Error('Cartesia API key não configurada');
    if (!text || !voiceId) throw new Error('text e voiceId são obrigatórios');

    const voice = { mode: 'id', id: voiceId };

    if (options.emotion) {
      voice.__experimental_controls = {
        emotion: Array.isArray(options.emotion) ? options.emotion : [options.emotion]
      };
    }

    const response = await fetch(`${CARTESIA_BASE_URL}/tts/bytes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-11-13'
      },
      body: JSON.stringify({
        model_id: DEFAULT_MODEL,
        transcript: text,
        voice,
        output_format: {
          container: 'mp3',
          bit_rate: 128000,
          sample_rate: 44100
        },
        language: 'pt'
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Cartesia API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async listVoices() {
    if (!this.isConfigured()) throw new Error('Cartesia API key não configurada');

    const response = await fetch(`${CARTESIA_BASE_URL}/voices`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Cartesia-Version': '2024-11-13'
      }
    });

    if (!response.ok) throw new Error(`Cartesia API error (${response.status})`);

    const voices = await response.json();
    return (Array.isArray(voices) ? voices : [])
      .filter(v => v.language === 'pt')
      .map(v => ({
        voice_id: v.id,
        name: v.name,
        category: v.is_public ? 'public' : 'custom',
        labels: v.description ? { description: v.description } : {}
      }));
  }
}

export default CartesiaProvider;
