import { useMemo } from 'react';
// Contrato explicito do useTTS para os consumidores (ChatArea, EtapaJogoRPG,
// SessaoHistoricoModal, historia-ver).
import useAudioController from '../audio/hooks/useAudioController';
import { createNarrationTrackRef, normalizeLegacyNarrationItem } from '../audio/domain/trackRef';

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export type TTSItemOwnerType = 'message' | 'segment' | 'playlist';

export interface TTSPlayOptions {
  segmentId?: string | number | null;
  speechText?: string | null;
  speech_text?: string | null;
  emotion?: string | null;
  hasPersistedAudio?: boolean;
  kind?: string;
  speakerLabel?: string | null;
  allowGenerate?: boolean;
  forceRegenerate?: boolean;
  playlistId?: string | null;
  title?: string | null;
  source?: string | null;
  contextLabel?: string | null;
}

export interface TTSSequenceItem {
  segmentId?: string | number | null;
  text?: string;
  speechText?: string | null;
  speech_text?: string | null;
  voiceId?: string | null;
  provider?: string;
  emotion?: string | null;
  hasPersistedAudio?: boolean;
  audioCacheKey?: string | null;
  audio_cache_key?: string | null;
  audioUrl?: string | null;
  audio_url?: string | null;
  kind?: string;
  [key: string]: unknown;
}

export interface TTSSequenceOptions {
  sequenceKey?: string | null;
  title?: string | null;
  source?: string | null;
  contextLabel?: string | null;
  [key: string]: unknown;
}

export interface TTSGenerateOptions {
  segmentId?: string | number | null;
  speechText?: string | null;
  speech_text?: string | null;
  emotion?: string | null;
  hasPersistedAudio?: boolean;
  kind?: string;
  [key: string]: unknown;
}

/**
 * Contrato do hook. Os fields de estado vem direto do `useAudioController` e
 * permanecem com `unknown`/tipos permissivos enquanto o controller for JS — o
 * narrowing real e feito nos componentes que consomem cada campo.
 */
export interface UseTTSResult {
  play: (
    text: string,
    voiceId: string | null,
    messageId: string | number,
    provider?: string,
    options?: TTSPlayOptions
  ) => Promise<unknown>;
  playSequence: (
    items: TTSSequenceItem[],
    messageId: string | number,
    options?: TTSSequenceOptions
  ) => Promise<unknown>;
  generate: (
    text: string,
    voiceId: string | null,
    messageId: string | number,
    provider?: string,
    options?: TTSGenerateOptions
  ) => Promise<unknown>;
  generateSequence: (
    items: TTSSequenceItem[],
    messageId: string | number,
    options?: TTSSequenceOptions
  ) => Promise<unknown>;
  stop: () => void;
  togglePause: () => void;
  seekTo: (time: number) => void;
  cyclePlaybackRate: () => void;
  next: () => void;
  previous: () => void;
  setQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  hasAudioForMessage: (messageId: string | number) => boolean;
  hasAudioForItem: (itemKey: string) => boolean;
  isPlaying: boolean;
  isLoading: boolean;
  currentMessageId: string | number | null;
  currentSegmentId: string | number | null;
  currentTrackId: string | null;
  currentPlaylistId: string | null;
  currentSequenceKey: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  queueIndex: number;
  isSequence: boolean;
  generatingMessageId: string | number | null;
  loadingTargetId: string | number | null;
  loadingSegmentId: string | number | null;
  loadingSequenceKey: string | null;
  preparingOwnerId: string | number | null;
  waitingForNext: boolean;
  canTogglePlayback: boolean;
  lastError: unknown;
  errorMessageId: string | number | null;
  queueItems: unknown[];
  queueOpen: boolean;
  currentTrack: unknown;
  currentPlaylist: unknown;
  clearError: () => void;
}

export const useTTS = (): UseTTSResult => {
  const audio = useAudioController();

  return useMemo<UseTTSResult>(
    () => ({
      play: async (text, voiceId, messageId, provider = DEFAULT_TTS_PROVIDER, options = {}) =>
        audio.playTrack(
          createNarrationTrackRef({
            messageId,
            segmentId: options.segmentId || null,
            ownerId: messageId,
            ownerType: options.segmentId ? 'segment' : 'message',
            text,
            speechText: options.speechText ?? options.speech_text ?? text,
            voiceId,
            provider,
            emotion: options.emotion || null,
            hasPersistedAudio: options.hasPersistedAudio || false,
            kind: options.kind || 'narration',
            speakerLabel: options.speakerLabel || null,
          }),
          {
            allowGenerate: options.allowGenerate ?? true,
            forceRegenerate: options.forceRegenerate ?? false,
            playlistId: options.playlistId,
            title: options.title,
            source: options.source || 'single_track',
            contextLabel: options.contextLabel || 'Trecho',
          }
        ),
      playSequence: async (items = [], messageId, options = {}) =>
        audio.playPlaylist(
          {
            playlistId: options.sequenceKey || `sequence:${messageId}`,
            ownerId: messageId,
            ownerType: 'playlist',
            title: options.title || 'Narracao',
            source: options.source || 'sequence',
            contextLabel: options.contextLabel || options.title || 'Narracao',
          },
          (Array.isArray(items) ? items : []).map((item, index) =>
            normalizeLegacyNarrationItem(item, {
              ownerId: messageId,
              ownerType: item?.segmentId ? 'segment' : 'message',
              order: index,
            })
          ),
          options
        ),
      generate: async (text, voiceId, messageId, provider = DEFAULT_TTS_PROVIDER, options = {}) =>
        audio.generateTrack(
          createNarrationTrackRef({
            messageId,
            segmentId: options.segmentId || null,
            ownerId: messageId,
            ownerType: options.segmentId ? 'segment' : 'message',
            text,
            speechText: options.speechText ?? options.speech_text ?? text,
            voiceId,
            provider,
            emotion: options.emotion || null,
            hasPersistedAudio: options.hasPersistedAudio || false,
            kind: options.kind || 'narration',
          }),
          options
        ),
      generateSequence: async (items = [], messageId, options = {}) =>
        audio.generatePlaylist(
          (Array.isArray(items) ? items : []).map((item, index) =>
            normalizeLegacyNarrationItem(item, {
              ownerId: messageId,
              ownerType: item?.segmentId ? 'segment' : 'message',
              order: index,
            })
          ),
          messageId,
          options
        ),
      stop: audio.stop,
      togglePause: audio.togglePause,
      seekTo: audio.seekTo,
      cyclePlaybackRate: audio.cyclePlaybackRate,
      next: audio.next,
      previous: audio.previous,
      setQueueOpen: audio.setQueueOpen,
      toggleQueue: audio.toggleQueue,
      hasAudioForMessage: audio.hasAudioForMessage,
      hasAudioForItem: audio.hasAudioForItem,
      isPlaying: audio.isPlaying,
      isLoading: audio.isLoading,
      currentMessageId: audio.currentMessageId,
      currentSegmentId: audio.currentSegmentId,
      currentTrackId: audio.currentTrackId,
      currentPlaylistId: audio.currentPlaylistId,
      currentSequenceKey: audio.currentSequenceKey,
      currentTime: audio.currentTime,
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      queueIndex: audio.queueIndex,
      isSequence: audio.isSequence,
      generatingMessageId: audio.generatingMessageId,
      loadingTargetId: audio.loadingTargetId,
      loadingSegmentId: audio.loadingSegmentId,
      loadingSequenceKey: audio.loadingSequenceKey,
      preparingOwnerId: audio.preparingOwnerId,
      waitingForNext: audio.waitingForNext,
      canTogglePlayback: audio.canTogglePlayback,
      lastError: audio.lastError,
      errorMessageId: audio.errorMessageId,
      queueItems: audio.queueItems,
      queueOpen: audio.queueOpen,
      currentTrack: audio.currentTrack,
      currentPlaylist: audio.currentPlaylist,
      clearError: audio.clearError,
    }),
    [audio]
  );
};

export default useTTS;
