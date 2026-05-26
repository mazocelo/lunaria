import { useMemo, useSyncExternalStore } from 'react';
import { audioController, type AudioControllerState } from '../services/audioController';

export interface UseAudioControllerResult extends AudioControllerState {
  playTrack: typeof audioController.playTrack;
  playPlaylist: typeof audioController.playPlaylist;
  generateTrack: typeof audioController.generateTrack;
  generatePlaylist: typeof audioController.generatePlaylist;
  togglePause: typeof audioController.togglePause;
  stop: typeof audioController.stop;
  seekTo: typeof audioController.seekTo;
  cyclePlaybackRate: typeof audioController.cyclePlaybackRate;
  next: typeof audioController.next;
  previous: typeof audioController.previous;
  setQueueOpen: typeof audioController.setQueueOpen;
  toggleQueue: typeof audioController.toggleQueue;
  clearError: typeof audioController.clearError;
  hasAudioForItem: typeof audioController.hasAudioForItem;
  hasAudioForMessage: typeof audioController.hasAudioForMessage;
  getTrack: typeof audioController.getTrack;
  getPlaylist: typeof audioController.getPlaylist;
}

export function useAudioController(): UseAudioControllerResult {
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
