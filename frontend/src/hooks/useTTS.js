import { useMemo } from 'react';
import useAudioController from '../audio/hooks/useAudioController.js';
import { createNarrationTrackRef, normalizeLegacyNarrationItem } from '../audio/domain/trackRef.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const useTTS = () => {
  const audio = useAudioController();

  return useMemo(() => ({
    play: async (
      text,
      voiceId,
      messageId,
      provider = DEFAULT_TTS_PROVIDER,
      options = {}
    ) => {
      return audio.playTrack(createNarrationTrackRef({
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
      }), {
        allowGenerate: options.allowGenerate ?? true,
        forceRegenerate: options.forceRegenerate ?? false,
        playlistId: options.playlistId,
        title: options.title,
        source: options.source || 'single_track',
        contextLabel: options.contextLabel || 'Trecho',
      });
    },
    playSequence: async (items = [], messageId, options = {}) => {
      return audio.playPlaylist(
        {
          playlistId: options.sequenceKey || `sequence:${messageId}`,
          ownerId: messageId,
          ownerType: 'playlist',
          title: options.title || 'Narracao',
          source: options.source || 'sequence',
          contextLabel: options.contextLabel || options.title || 'Narracao',
        },
        (Array.isArray(items) ? items : []).map((item, index) => normalizeLegacyNarrationItem(item, {
          ownerId: messageId,
          ownerType: item?.segmentId ? 'segment' : 'message',
          order: index,
        })),
        options
      );
    },
    generate: async (
      text,
      voiceId,
      messageId,
      provider = DEFAULT_TTS_PROVIDER,
      options = {}
    ) => {
      return audio.generateTrack(createNarrationTrackRef({
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
      }), options);
    },
    generateSequence: async (items = [], messageId, options = {}) => {
      return audio.generatePlaylist(
        (Array.isArray(items) ? items : []).map((item, index) => normalizeLegacyNarrationItem(item, {
          ownerId: messageId,
          ownerType: item?.segmentId ? 'segment' : 'message',
          order: index,
        })),
        messageId,
        options
      );
    },
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
  }), [audio]);
};

export default useTTS;
