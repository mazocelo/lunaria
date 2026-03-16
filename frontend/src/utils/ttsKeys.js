const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const ROOT_SEGMENT_ID = '__root__';
const EMPTY_PART = '__none__';

export function resolveTtsEmotion(provider = DEFAULT_TTS_PROVIDER, emotion = null) {
  if (provider !== 'cartesia') return null;
  const normalizedEmotion = String(emotion || '').trim();
  return normalizedEmotion || null;
}

export function buildTtsVoiceSignature(
  voiceId = null,
  provider = DEFAULT_TTS_PROVIDER,
  emotion = null
) {
  const normalizedProvider = String(provider || DEFAULT_TTS_PROVIDER).trim() || DEFAULT_TTS_PROVIDER;
  const normalizedVoiceId = String(voiceId || '').trim() || EMPTY_PART;
  const normalizedEmotion = resolveTtsEmotion(normalizedProvider, emotion) || EMPTY_PART;

  return `${normalizedProvider}::${normalizedVoiceId}::${normalizedEmotion}`;
}

export function buildTtsItemKey(
  messageId,
  segmentId = null,
  voiceId = null,
  provider = DEFAULT_TTS_PROVIDER,
  emotion = null
) {
  const normalizedMessageId = String(messageId);
  const normalizedSegmentId = segmentId == null || segmentId === '' ? ROOT_SEGMENT_ID : String(segmentId);
  const voiceSignature = buildTtsVoiceSignature(voiceId, provider, emotion);

  return `${normalizedMessageId}::${normalizedSegmentId}::${voiceSignature}`;
}
