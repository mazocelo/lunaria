import { buildTtsItemKey, resolveTtsEmotion } from '../../utils/ttsKeys.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export function createAudioTrackRef(input = {}) {
  const track = {
    trackId: String(input.trackId || input.itemKey || input.id || ''),
    sourceType: input.sourceType || 'tts',
    ownerType: input.ownerType || 'message',
    ownerId: input.ownerId == null ? null : String(input.ownerId),
    messageId: input.messageId == null ? null : String(input.messageId),
    segmentId: input.segmentId == null || input.segmentId === '' ? null : String(input.segmentId),
    playlistId: input.playlistId == null ? null : String(input.playlistId),
    text: String(input.text || '').trim(),
    speakerLabel: input.speakerLabel || input.speaker || null,
    voiceId: input.voiceId || null,
    provider: input.provider || DEFAULT_TTS_PROVIDER,
    emotion: resolveTtsEmotion(input.provider || DEFAULT_TTS_PROVIDER, input.emotion || null),
    audioCacheKey: input.audioCacheKey || input.audio_cache_key || null,
    audioUrl: input.audioUrl || input.audio_url || null,
    hasPersistedAudio: Boolean(input.hasPersistedAudio || input.audioCacheKey || input.audio_cache_key || input.audioUrl || input.audio_url),
    kind: input.kind || input.tipo || 'narration',
    order: Number.isFinite(input.order) ? input.order : 0,
    meta: {
      sequenceKey: input.sequenceKey || null,
      source: input.source || null,
      label: input.label || null,
      title: input.title || null,
    },
  };

  if (!track.trackId && track.messageId) {
    track.trackId = buildTtsItemKey(track.messageId, track.segmentId, track.voiceId, track.provider, track.emotion);
  }

  track.itemKey = track.trackId;
  return track;
}

export function createNarrationTrackRef(input = {}) {
  const provider = input.provider || DEFAULT_TTS_PROVIDER;
  const emotion = resolveTtsEmotion(provider, input.emotion || null);

  return createAudioTrackRef({
    ...input,
    sourceType: 'tts',
    ownerType: input.ownerType || (input.segmentId ? 'segment' : 'message'),
    trackId: input.trackId || buildTtsItemKey(
      input.messageId ?? input.ownerId ?? input.itemId ?? 'track',
      input.segmentId || null,
      input.voiceId || null,
      provider,
      emotion
    ),
    provider,
    emotion,
  });
}

export function normalizeLegacyNarrationItem(item = {}, fallback = {}) {
  return createNarrationTrackRef({
    trackId: item.trackId || item.itemKey,
    ownerId: item.ownerId ?? fallback.ownerId ?? item.messageId,
    ownerType: item.ownerType || fallback.ownerType || (item.segmentId ? 'segment' : 'message'),
    messageId: item.messageId ?? fallback.messageId ?? fallback.ownerId,
    segmentId: item.segmentId || null,
    text: item.text || '',
    speakerLabel: item.speakerLabel || item.speaker_label || null,
    voiceId: item.voiceId || fallback.voiceId || null,
    provider: item.provider || item.voiceProvider || fallback.provider || fallback.voiceProvider || DEFAULT_TTS_PROVIDER,
    emotion: item.emotion || fallback.emotion || null,
    audioCacheKey: item.audioCacheKey || item.audio_cache_key || null,
    audioUrl: item.audioUrl || item.audio_url || null,
    hasPersistedAudio: item.hasPersistedAudio,
    kind: item.kind || item.tipo || fallback.kind || 'narration',
    order: item.order ?? fallback.order ?? 0,
    sequenceKey: item.sequenceKey || fallback.sequenceKey || null,
    source: item.source || fallback.source || null,
    label: item.label || fallback.label || null,
    title: item.title || fallback.title || null,
  });
}

export function getTrackDisplayLabel(track) {
  if (!track) return 'Faixa de audio';
  if (track.speakerLabel && track.text) return `${track.speakerLabel}: ${track.text}`;
  if (track.speakerLabel) return track.speakerLabel;
  if (track.text) return track.text;
  return 'Faixa de audio';
}
