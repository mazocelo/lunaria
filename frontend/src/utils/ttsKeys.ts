const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const ROOT_SEGMENT_ID = '__root__';
const EMPTY_PART = '__none__';
const EMPTY_SPEECH_FINGERPRINT = '__speech__';

function normalizeSpeechText(value: string | null | undefined = ''): string {
  return String(value || '').trim();
}

export function buildSpeechFingerprint(speechText: string | null | undefined = ''): string {
  const normalized = normalizeSpeechText(speechText);
  if (!normalized) return EMPTY_SPEECH_FINGERPRINT;

  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `sp_${(hash >>> 0).toString(36)}`;
}

export function resolveTtsEmotion(
  provider: string = DEFAULT_TTS_PROVIDER,
  emotion: string | null = null
): string | null {
  if (provider !== 'cartesia') return null;
  const normalizedEmotion = String(emotion || '').trim();
  return normalizedEmotion || null;
}

export function buildTtsVoiceSignature(
  voiceId: string | null = null,
  provider: string = DEFAULT_TTS_PROVIDER,
  emotion: string | null = null
): string {
  const normalizedProvider = String(provider || DEFAULT_TTS_PROVIDER).trim() || DEFAULT_TTS_PROVIDER;
  const normalizedVoiceId = String(voiceId || '').trim() || EMPTY_PART;
  const normalizedEmotion = resolveTtsEmotion(normalizedProvider, emotion) || EMPTY_PART;

  return `${normalizedProvider}::${normalizedVoiceId}::${normalizedEmotion}`;
}

export function buildTtsItemKey(
  messageId: string | number,
  segmentId: string | number | null = null,
  voiceId: string | null = null,
  provider: string = DEFAULT_TTS_PROVIDER,
  emotion: string | null = null,
  speechText: string | null = null
): string {
  const normalizedMessageId = String(messageId);
  const normalizedSegmentId =
    segmentId == null || segmentId === '' ? ROOT_SEGMENT_ID : String(segmentId);
  const voiceSignature = buildTtsVoiceSignature(voiceId, provider, emotion);
  const speechFingerprint = buildSpeechFingerprint(speechText);

  return `${normalizedMessageId}::${normalizedSegmentId}::${voiceSignature}::${speechFingerprint}`;
}
