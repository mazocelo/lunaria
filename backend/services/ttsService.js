/**
 * TTS Service - Multi-provider Text-to-Speech
 * Suporta ElevenLabs, Cartesia Sonic-3, Kokoro-82M (HuggingFace) e um endpoint
 * open source generico.
 */

import ElevenLabsProvider from './tts/elevenLabsProvider.js';
import CartesiaProvider from './tts/cartesiaProvider.js';
import OpenSourceProvider from './tts/openSourceProvider.js';
import KokoroProvider from './tts/kokoroProvider.js';

const defaultProviderName = process.env.DEFAULT_TTS_PROVIDER || 'elevenlabs';

const providers = {
  elevenlabs: new ElevenLabsProvider(),
  cartesia: new CartesiaProvider(),
  opensource: new OpenSourceProvider(),
  // Sem HF_TOKEN, `isConfigured()` devolve false e ele nao aparece em
  // getConfiguredProviders() — registrar aqui nao ativa nada sozinho.
  kokoro: new KokoroProvider(),
};

export function getProvider(name) {
  return providers[name] || providers[defaultProviderName] || providers.elevenlabs;
}

export function getDefaultProviderName() {
  return defaultProviderName;
}

export function getConfiguredProviders() {
  return Object.entries(providers)
    .filter(([_, p]) => p.isConfigured())
    .map(([name]) => name);
}

// Backward compatibility: default export as ElevenLabs instance
export default providers[defaultProviderName] || providers.elevenlabs;
