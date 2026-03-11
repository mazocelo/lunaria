import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../services/ApiClient.js';

/**
 * Hook para gerenciar playback de TTS (Text-to-Speech)
 * Cache em memória por messageId — gera áudio uma vez, reproduz N vezes
 */
export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map()); // messageId → blobUrl

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentMessageId(null);
  }, []);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      for (const url of cacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      cacheRef.current.clear();
    };
  }, [stopAudio]);

  const playUrl = useCallback((url, messageId) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => stopAudio();
    audio.onerror = () => stopAudio();
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => stopAudio());
  }, [stopAudio]);

  const play = useCallback(async (text, voiceId, messageId, provider = 'elevenlabs') => {
    // Toggle: se já está tocando esta mensagem, parar
    if (isPlaying && currentMessageId === messageId) {
      stopAudio();
      return;
    }

    // Parar áudio anterior
    stopAudio();
    setCurrentMessageId(messageId);

    // Cache hit — reproduzir sem chamar API
    const cached = cacheRef.current.get(messageId);
    if (cached) {
      playUrl(cached, messageId);
      return;
    }

    // Cache miss — gerar via API
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
  }, [isPlaying, currentMessageId, stopAudio, playUrl]);

  return {
    play,
    stop: stopAudio,
    isPlaying,
    isLoading,
    currentMessageId
  };
};
