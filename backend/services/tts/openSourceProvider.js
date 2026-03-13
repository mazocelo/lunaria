class OpenSourceProvider {
  constructor() {
    this.baseUrl = process.env.OPEN_SOURCE_TTS_URL || null;
    this.defaultVoiceId = process.env.OPEN_SOURCE_TTS_DEFAULT_VOICE_ID || null;
    this.contentType = 'audio/wav';
  }

  isConfigured() {
    return Boolean(this.baseUrl);
  }

  getDefaultVoiceId() {
    return this.defaultVoiceId;
  }

  getContentType() {
    return this.contentType;
  }

  async generateSpeech(text, voiceId, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Open source TTS URL nao configurada');
    }

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': this.contentType,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId || this.defaultVoiceId,
        ...options,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Open source TTS error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async listVoices() {
    if (!this.isConfigured()) {
      throw new Error('Open source TTS URL nao configurada');
    }

    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Open source TTS error (${response.status})`);
    }

    const data = await response.json();
    return (data.data || []).map((voice) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: 'open-source',
      labels: {
        language: voice.language,
        provider: voice.provider || 'piper',
      },
    }));
  }
}

export default OpenSourceProvider;
