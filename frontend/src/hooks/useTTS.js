import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Hook para gerenciar playback de TTS (Text-to-Speech)
 * Chama o backend que gera áudio via ElevenLabs
 */
export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentMessageId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const play = useCallback(async (text, voiceId, messageId) => {
    // Se já está tocando a mesma mensagem, parar
    if (isPlaying && currentMessageId === messageId) {
      stop();
      return;
    }

    // Parar áudio anterior
    cleanup();

    setIsLoading(true);
    setCurrentMessageId(messageId);

    try {
      const response = await fetch(`${API_URL}/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, voiceId })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar áudio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = () => {
        cleanup();
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('TTS error:', error.message);
      cleanup();
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, currentMessageId, stop, cleanup]);

  return {
    play,
    stop,
    isPlaying,
    isLoading,
    currentMessageId
  };
};
