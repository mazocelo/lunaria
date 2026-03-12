import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../services/ApiClient.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];
const TTS_LAST_MESSAGE_KEY = 'tts_last_message_id';

/**
 * Hook para playback de TTS com cache por mensagem.
 */
export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(() => {
    try {
      return localStorage.getItem(TTS_LAST_MESSAGE_KEY);
    } catch (_) {
      return null;
    }
  });
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

  const clearPlayback = useCallback((clearMessage = true) => {
    if (audioRef.current) {
      audioRef.current.pause();
      detachAudioHandlers(audioRef.current);
      audioRef.current = null;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (clearMessage) setCurrentMessageId(null);
  }, [detachAudioHandlers]);

  // Stop do player: para e volta ao inicio, mantendo a mensagem selecionada
  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      clearPlayback(true);
      for (const url of cacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      cacheRef.current.clear();
    };
  }, [clearPlayback]);

  useEffect(() => {
    try {
      if (currentMessageId == null) {
        localStorage.removeItem(TTS_LAST_MESSAGE_KEY);
      } else {
        localStorage.setItem(TTS_LAST_MESSAGE_KEY, String(currentMessageId));
      }
    } catch (_) {
      // no-op
    }
  }, [currentMessageId]);

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

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      try { audio.currentTime = 0; } catch (_) {}
    };
    audio.onerror = () => clearPlayback(true);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
    audio.onloadedmetadata = () => {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(d);
    };

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => clearPlayback(true));
  }, [clearPlayback, detachAudioHandlers, playbackRate]);

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => clearPlayback(true));
      return;
    }

    audio.pause();
  }, [clearPlayback]);

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

  const play = useCallback(async (
    text,
    voiceId,
    messageId,
    provider = DEFAULT_TTS_PROVIDER,
    options = {}
  ) => {
    const { allowGenerate = true, forceRegenerate = false } = options;
    const isSameMessage = String(currentMessageId) === String(messageId);

    if (forceRegenerate) {
      const previous = cacheRef.current.get(messageId);
      if (previous) {
        URL.revokeObjectURL(previous);
        cacheRef.current.delete(messageId);
      }
      clearPlayback(isSameMessage ? false : true);
      setCurrentMessageId(messageId);
    }

    if (!forceRegenerate && isSameMessage) {
      if (audioRef.current) {
        togglePause();
        return true;
      }

      const cachedCurrent = cacheRef.current.get(messageId);
      if (cachedCurrent) {
        playUrl(cachedCurrent, messageId);
        return true;
      }
    }

    if (!forceRegenerate && !isSameMessage) {
      const cached = cacheRef.current.get(messageId);
      if (cached) {
        clearPlayback(true);
        setCurrentMessageId(messageId);
        playUrl(cached, messageId);
        return true;
      }
    }

    if (!allowGenerate) {
      setCurrentMessageId(messageId);
      return false;
    }

    if (!isSameMessage || forceRegenerate) {
      clearPlayback(true);
      setCurrentMessageId(messageId);
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/tts/generate', { text, voiceId, provider }, {
        responseType: 'blob'
      });

      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const oldCached = cacheRef.current.get(messageId);
      if (oldCached) URL.revokeObjectURL(oldCached);
      cacheRef.current.set(messageId, url);

      playUrl(url, messageId);
      return true;
    } catch (error) {
      console.error('TTS error:', error.message);
      clearPlayback(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearPlayback, currentMessageId, playUrl, togglePause]);

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

