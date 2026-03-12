import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../services/ApiClient.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];

/**
 * Hook para playback de TTS com cache por mensagem.
 */
export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());

  const detachAudioHandlers = useCallback((audio) => {
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.onpause = null;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      detachAudioHandlers(audioRef.current);
      audioRef.current = null;
    }

    setIsPlaying(false);
    setCurrentMessageId(null);
    setCurrentTime(0);
    setDuration(0);
  }, [detachAudioHandlers]);

  useEffect(() => {
    return () => {
      stopAudio();
      for (const url of cacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      cacheRef.current.clear();
    };
  }, [stopAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    // Mantem timbre natural ao acelerar (sem "voz fina")
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.mozPreservesPitch = true;
  }, [playbackRate]);

  const playUrl = useCallback((url, messageId) => {
    if (audioRef.current) {
      audioRef.current.pause();
      detachAudioHandlers(audioRef.current);
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.playbackRate = playbackRate;
    // Mantem timbre natural ao acelerar (sem "voz fina")
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.mozPreservesPitch = true;

    setCurrentMessageId(messageId);
    setCurrentTime(0);
    setDuration(0);

    audio.onended = () => stopAudio();
    audio.onerror = () => stopAudio();
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
    audio.onloadedmetadata = () => {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(d);
    };

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => stopAudio());
  }, [detachAudioHandlers, playbackRate, stopAudio]);

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => stopAudio());
      return;
    }

    audio.pause();
  }, [stopAudio]);

  const seekTo = useCallback((value) => {
    const audio = audioRef.current;
    if (!audio) return;

    const next = Number(value);
    if (!Number.isFinite(next)) return;

    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const hasAudioForMessage = useCallback((messageId) => {
    if (messageId == null) return false;
    return cacheRef.current.has(messageId) || String(currentMessageId) === String(messageId);
  }, [currentMessageId]);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((prev) => {
      const currentIndex = SPEED_STEPS.indexOf(prev);
      if (currentIndex === -1 || currentIndex === SPEED_STEPS.length - 1) return SPEED_STEPS[0];
      return SPEED_STEPS[currentIndex + 1];
    });
  }, []);

  const play = useCallback(async (text, voiceId, messageId, provider = DEFAULT_TTS_PROVIDER) => {
    if (String(currentMessageId) === String(messageId) && audioRef.current) {
      togglePause();
      return;
    }

    stopAudio();

    const cached = cacheRef.current.get(messageId);
    if (cached) {
      playUrl(cached, messageId);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/tts/generate', { text, voiceId, provider }, {
        responseType: 'blob'
      });

      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      cacheRef.current.set(messageId, url);

      playUrl(url, messageId);
    } catch (error) {
      console.error('TTS error:', error.message);
      stopAudio();
    } finally {
      setIsLoading(false);
    }
  }, [currentMessageId, playUrl, stopAudio, togglePause]);

  return {
    play,
    stop: stopAudio,
    togglePause,
    seekTo,
    cyclePlaybackRate,
    hasAudioForMessage,
    isPlaying,
    isLoading,
    currentMessageId,
    currentTime,
    duration,
    playbackRate
  };
};

