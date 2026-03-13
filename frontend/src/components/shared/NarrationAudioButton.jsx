import React from 'react';
import { Loader2, Pause, Volume2 } from 'lucide-react';

const DEFAULT_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

const NarrationAudioButton = ({
  tts,
  text,
  itemId,
  voiceId,
  voiceProvider = DEFAULT_PROVIDER,
  isLight = false,
  className = '',
}) => {
  const normalizedText = typeof text === 'string' ? text.trim() : '';

  if (!tts || !voiceId || !normalizedText || !itemId) return null;

  const isCurrent = String(tts.currentMessageId) === String(itemId);
  const isLoading = Boolean(tts.isLoading && isCurrent);
  const isPlaying = Boolean(tts.isPlaying && isCurrent);
  const hasCachedAudio = Boolean(tts.hasAudioForMessage?.(itemId));

  const label = isLoading
    ? 'Gerando audio...'
    : isPlaying
      ? 'Pausar audio'
      : hasCachedAudio
        ? 'Ouvir audio'
        : 'Gerar audio';

  const handleClick = async () => {
    await tts.play(normalizedText, voiceId, itemId, voiceProvider, { allowGenerate: true });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`mt-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        isLight
          ? 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700 border border-cyan-200'
          : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/20'
      } ${className}`}
      title={label}
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={12} />
      ) : (
        <Volume2 size={12} />
      )}
      <span>{label}</span>
    </button>
  );
};

export default NarrationAudioButton;
