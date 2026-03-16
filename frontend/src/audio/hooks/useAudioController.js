import { useMemo, useSyncExternalStore } from 'react';
import { audioController } from '../services/audioController.js';

export function useAudioController() {
  const state = useSyncExternalStore(
    audioController.subscribe,
    audioController.getState,
    audioController.getState
  );

  return useMemo(() => ({
    ...state,
    playTrack: audioController.playTrack,
    playPlaylist: audioController.playPlaylist,
    generateTrack: audioController.generateTrack,
    generatePlaylist: audioController.generatePlaylist,
    togglePause: audioController.togglePause,
    stop: audioController.stop,
    seekTo: audioController.seekTo,
    cyclePlaybackRate: audioController.cyclePlaybackRate,
    next: audioController.next,
    previous: audioController.previous,
    setQueueOpen: audioController.setQueueOpen,
    toggleQueue: audioController.toggleQueue,
    clearError: audioController.clearError,
    hasAudioForItem: audioController.hasAudioForItem,
    hasAudioForMessage: audioController.hasAudioForMessage,
    getTrack: audioController.getTrack,
    getPlaylist: audioController.getPlaylist,
  }), [state]);
}

export default useAudioController;
