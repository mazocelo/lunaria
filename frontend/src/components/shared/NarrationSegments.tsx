import { useMemo, type ReactNode } from 'react';
import { Loader2, Square, Volume2 } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { createNarrationTrackRef } from '../../audio/domain/trackRef';

const DEFAULT_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

interface RawNarrationSegment {
  id?: string | number;
  text?: string;
  message?: string;
  mensagem?: string;
  speech_text?: string | null;
  voice_id?: string | null;
  voice_provider?: string | null;
  speaker_label?: string | null;
  tipo?: string;
  narracao?: { emocao?: string | null } | null;
  audio_cache_key?: string | null;
  audio_url?: string | null;
  audioUrl?: string | null;
}

/**
 * Item de track usado pela narrativa em segmentos. Espelha o subset dos campos
 * que o ChatArea/renderers consomem do AudioTrackRef + campo legacy `tipo`.
 */
export interface NarrationTrackItem {
  trackId: string;
  itemKey: string;
  messageId: string | null;
  segmentId: string | null;
  text: string;
  speechText: string;
  voiceId: string | null;
  provider: string;
  emotion: string | null;
  speakerLabel: string | null;
  kind: string;
  hasPersistedAudio: boolean;
  tipo: string;
}

export const buildNarrationSequenceItems = (
  segments: RawNarrationSegment[] = [],
  messageId: string | number,
  defaultVoiceId: string | null = null,
  defaultVoiceProvider: string = DEFAULT_PROVIDER,
): NarrationTrackItem[] => {
  const usedIds = new Set<string>();

  return (Array.isArray(segments) ? segments : [])
    .map((segment, index): NarrationTrackItem | null => {
      const text = String(segment?.text || segment?.message || segment?.mensagem || '').trim();
      if (!text) return null;

      const baseSegmentId = segment?.id ?? `seg_${index + 1}`;
      let segmentId: string | number = baseSegmentId;
      let suffix = 2;

      while (usedIds.has(String(segmentId))) {
        segmentId = `${baseSegmentId}_${suffix}`;
        suffix += 1;
      }
      usedIds.add(String(segmentId));

      const voiceId = segment?.voice_id || defaultVoiceId || null;
      const provider = segment?.voice_provider || defaultVoiceProvider || DEFAULT_PROVIDER;
      const tipo = segment?.tipo || 'narracao';

      const ref = createNarrationTrackRef({
        messageId,
        segmentId,
        text,
        speech_text: segment?.speech_text || null,
        voiceId,
        provider,
        emotion: segment?.narracao?.emocao || null,
        speakerLabel: segment?.speaker_label || (segment?.tipo === 'fala_npc' ? 'NPC' : 'Mestre'),
        ownerId: messageId,
        ownerType: 'segment',
        kind: tipo,
        hasPersistedAudio: Boolean(segment?.audio_cache_key || segment?.audio_url || segment?.audioUrl),
      });

      // tipo nao e produzido por createNarrationTrackRef; preservar para consumers
      const item: NarrationTrackItem = {
        trackId: ref.trackId,
        itemKey: ref.itemKey,
        messageId: ref.messageId,
        segmentId: ref.segmentId,
        text: ref.text,
        speechText: ref.speechText,
        voiceId: ref.voiceId,
        provider: ref.provider,
        emotion: ref.emotion,
        speakerLabel: ref.speakerLabel,
        kind: ref.kind,
        hasPersistedAudio: ref.hasPersistedAudio,
        tipo,
      };
      return item;
    })
    .filter((item): item is NarrationTrackItem => Boolean(item));
};

export interface NarrationSegmentsTtsController {
  currentTrackId?: string | null;
  loadingTargetId?: string | number | null;
  loadingSegmentId?: string | number | null;
  isPlaying?: boolean;
  hasAudioForItem?: (itemKey: string) => boolean;
  play: (
    text: string,
    voiceId: string,
    messageId: string | number,
    provider: string,
    options?: {
      allowGenerate?: boolean;
      segmentId?: string | number | null;
      speechText?: string | null;
      emotion?: string | null;
      speakerLabel?: string | null;
      kind?: string;
      source?: string;
      contextLabel?: ReactNode;
    },
  ) => Promise<void> | void;
}

interface NarrationSegmentsProps {
  segments?: RawNarrationSegment[];
  messageId: string | number;
  tts?: NarrationSegmentsTtsController | null;
  defaultVoiceId?: string | null;
  defaultVoiceProvider?: string;
  compact?: boolean;
  isLight?: boolean;
  variant?: 'default' | 'game';
  className?: string;
}

const NarrationSegments = ({
  segments = [],
  messageId,
  tts,
  defaultVoiceId = null,
  defaultVoiceProvider = DEFAULT_PROVIDER,
  compact = false,
  isLight = false,
  variant = 'default',
  className = '',
}: NarrationSegmentsProps) => {
  const sequenceItems = useMemo(
    () => buildNarrationSequenceItems(segments, messageId, defaultVoiceId, defaultVoiceProvider),
    [segments, messageId, defaultVoiceId, defaultVoiceProvider],
  );
  const useGameVariant = variant === 'game';

  if (sequenceItems.length === 0) return null;

  const renderSegmentButton = (segmentItem: NarrationTrackItem) => {
    if (!tts || !segmentItem.voiceId) return null;

    const isCurrent = String(tts.currentTrackId || '') === String(segmentItem.trackId || segmentItem.itemKey || '');
    const isLoading = Boolean(
      String(tts.loadingTargetId || '') === String(messageId)
      && String(tts.loadingSegmentId || '') === String(segmentItem.segmentId || ''),
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
      await tts.play(segmentItem.text, segmentItem.voiceId as string, messageId, segmentItem.provider, {
        allowGenerate: true,
        segmentId: segmentItem.segmentId,
        speechText: segmentItem.speechText,
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
      {sequenceItems.map((segmentItem) => {
        const isNpc = segmentItem.tipo === 'fala_npc';

        return (
          <div
            key={segmentItem.itemKey}
            className={`${compact ? 'p-2' : 'p-3'} rounded-lg ${
              useGameVariant
                ? isNpc
                  ? 'border-l-[3px] border-l-emerald-400 border border-emerald-500/40 bg-emerald-900/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.08)]'
                  : 'game-glass-subtle border border-white/[0.08]'
                : isNpc
                  ? isLight
                    ? 'border-l-[3px] border-l-emerald-500 border border-emerald-300 bg-emerald-50'
                    : 'border-l-[3px] border-l-emerald-400 border border-emerald-500/40 bg-emerald-900/50'
                  : isLight
                    ? 'border border-slate-200 bg-white/80'
                    : 'border border-white/10 bg-black/10'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${compact ? 'text-[11px]' : 'text-xs uppercase tracking-wide'} ${
                    isNpc
                      ? isLight ? 'text-emerald-700' : 'text-emerald-300'
                      : isLight ? 'text-slate-500' : 'text-purple-300'
                  }`}>
                    {segmentItem.speakerLabel}
                  </span>
                </div>
                <MarkdownRenderer className={`${compact ? 'text-sm' : 'text-base'} ${
                  isNpc
                    ? isLight ? 'text-emerald-900' : 'text-emerald-50'
                    : isLight ? 'text-slate-700' : 'text-white'
                } leading-relaxed`}>
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
