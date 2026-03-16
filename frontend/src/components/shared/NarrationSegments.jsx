import React, { useMemo } from 'react';
import { Loader2, Square, Volume2 } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer.jsx';
import { createNarrationTrackRef } from '../../audio/domain/trackRef.js';

const DEFAULT_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const buildNarrationSequenceItems = (segments = [], messageId, defaultVoiceId = null, defaultVoiceProvider = DEFAULT_PROVIDER) => {
  const usedIds = new Set();

  return (Array.isArray(segments) ? segments : [])
    .map((segment, index) => {
      const text = String(segment?.text || segment?.message || segment?.mensagem || '').trim();
      if (!text) return null;

      const baseSegmentId = segment?.id || `seg_${index + 1}`;
      let segmentId = baseSegmentId;
      let suffix = 2;

      while (usedIds.has(String(segmentId))) {
        segmentId = `${baseSegmentId}_${suffix}`;
        suffix += 1;
      }
      usedIds.add(String(segmentId));

      const voiceId = segment?.voice_id || defaultVoiceId || null;
      const provider = segment?.voice_provider || defaultVoiceProvider || DEFAULT_PROVIDER;

      return createNarrationTrackRef({
        messageId,
        segmentId,
        text,
        voiceId,
        provider,
        emotion: segment?.narracao?.emocao || null,
        speakerLabel: segment?.speaker_label || (segment?.tipo === 'fala_npc' ? 'NPC' : 'Mestre'),
        ownerId: messageId,
        ownerType: 'segment',
        tipo: segment?.tipo || 'narracao',
        hasPersistedAudio: Boolean(segment?.audio_cache_key || segment?.audio_url || segment?.audioUrl)
      });
    })
    .filter(Boolean);
};

const NarrationSegments = ({
  segments = [],
  messageId,
  tts,
  defaultVoiceId = null,
  defaultVoiceProvider = DEFAULT_PROVIDER,
  compact = false,
  isLight = false,
  variant = 'default',
  className = ''
}) => {
  const sequenceItems = useMemo(
    () => buildNarrationSequenceItems(segments, messageId, defaultVoiceId, defaultVoiceProvider),
    [segments, messageId, defaultVoiceId, defaultVoiceProvider]
  );
  const useGameVariant = variant === 'game';

  if (sequenceItems.length === 0) return null;

  const renderSegmentButton = (segmentItem) => {
    if (!tts || !segmentItem.voiceId) return null;

    const isCurrent = String(tts.currentTrackId || '') === String(segmentItem.trackId || segmentItem.itemKey || '');
    const isLoading = Boolean(
      String(tts.loadingTargetId || '') === String(messageId)
      && String(tts.loadingSegmentId || '') === String(segmentItem.segmentId || '')
    );
    const isPlaying = Boolean(tts.isPlaying && isCurrent);
    const hasCachedAudio = Boolean(tts.hasAudioForItem?.(segmentItem.itemKey));
    const hasAnyAudio = hasCachedAudio || segmentItem.hasPersistedAudio;
    const buttonClassName = useGameVariant
      ? !hasAnyAudio
        ? 'game-glass-subtle border-amber-400/25 text-amber-200 hover:border-amber-300/40 hover:bg-amber-500/10'
        : 'game-glass-subtle border-cyan-400/25 text-cyan-200 hover:border-cyan-300/40 hover:bg-cyan-500/10'
      : !hasAnyAudio
        ? isLight
          ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
          : 'border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
        : isLight
          ? 'border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
          : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20';

    const handlePlay = async () => {
      await tts.play(segmentItem.text, segmentItem.voiceId, messageId, segmentItem.provider, {
        allowGenerate: true,
        segmentId: segmentItem.segmentId,
        emotion: segmentItem.emotion,
        speakerLabel: segmentItem.speakerLabel,
        kind: segmentItem.tipo || 'narration',
        source: useGameVariant ? 'game_segment' : 'single_track',
        contextLabel: useGameVariant ? 'Trecho da cena' : 'Trecho',
      });
    };

    return (
      <button
        type="button"
        onClick={handlePlay}
        disabled={isLoading}
        className={`shrink-0 rounded-full border transition-all ${
          compact ? 'p-1' : 'p-1.5'
        } ${buttonClassName}`}
        title={isPlaying ? 'Pausar trecho' : hasAnyAudio ? 'Ouvir trecho' : 'Gerar e ouvir trecho'}
        aria-label={isPlaying ? 'Pausar trecho' : hasAnyAudio ? 'Ouvir trecho' : 'Gerar e ouvir trecho'}
      >
        {isLoading ? <Loader2 size={compact ? 12 : 14} className="animate-spin" /> : isPlaying ? <Square size={compact ? 12 : 14} /> : <Volume2 size={compact ? 12 : 14} />}
      </button>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {sequenceItems.map((segmentItem, index) => {
        const segment = segments[index] || {};
        const isNpc = segmentItem.tipo === 'fala_npc';

        return (
          <div
            key={segmentItem.itemKey}
            className={`${compact ? 'p-2' : 'p-3'} rounded-lg border ${
              useGameVariant
                ? isNpc
                  ? 'game-glass-subtle border-cyan-400/20'
                  : 'game-glass-subtle border-white/[0.08]'
                : isNpc
                  ? isLight
                    ? 'border-cyan-200 bg-cyan-50/80'
                    : 'border-cyan-400/20 bg-cyan-500/10'
                  : isLight
                    ? 'border-slate-200 bg-white/80'
                    : 'border-white/10 bg-black/10'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${compact ? 'text-[11px]' : 'text-xs uppercase tracking-wide'} ${
                    isNpc
                      ? isLight ? 'text-cyan-700' : 'text-cyan-300'
                      : isLight ? 'text-slate-500' : 'text-purple-300'
                  }`}>
                    {segmentItem.speakerLabel}
                  </span>
                </div>
                <MarkdownRenderer className={`${compact ? 'text-sm' : 'text-base'} ${isLight ? 'text-slate-700' : 'text-white'} leading-relaxed`}>
                  {segmentItem.text}
                </MarkdownRenderer>
              </div>
              {renderSegmentButton(segmentItem)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NarrationSegments;
