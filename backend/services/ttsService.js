/**
 * TTS Service - Multi-provider Text-to-Speech
 * Suporta ElevenLabs e Cartesia Sonic-3
 */

import ElevenLabsProvider from './tts/elevenLabsProvider.js';
import CartesiaProvider from './tts/cartesiaProvider.js';

const providers = {
  elevenlabs: new ElevenLabsProvider(),
  cartesia: new CartesiaProvider(),
};

export function getProvider(name) {
  return providers[name] || providers.elevenlabs;
}

export function getConfiguredProviders() {
  return Object.entries(providers)
    .filter(([_, p]) => p.isConfigured())
    .map(([name]) => name);
}

// Backward compatibility: default export as ElevenLabs instance
export default providers.elevenlabs;
