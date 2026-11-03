import { Loader2, Pause, Volume2 } from 'lucide-react';

const DEFAULT_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

/**
 * Contrato minimo do controlador de TTS consumido pelo botao. O objeto real e
 * exportado por `src/audio/` mas mantemos o tipo aqui para evitar acoplamento
 * forte durante a migracao para TS.
 */
export interface NarrationTtsController {
  currentMessageId?: string | number | null;
  loadingTargetId?: string | number | null;
  isPlaying?: boolean;
  hasAudioForMessage?: (itemId: string | number) => boolean;
  play: (
    text: string,
    voiceId: string,
    itemId: string | number,
    voiceProvider: string,
    options?: { allowGenerate?: boolean; speechText?: string | null },
  ) => Promise<void> | void;
}

interface NarrationAudioButtonProps {
  tts?: NarrationTtsController | null;
  text?: string | null;
  speechText?: string | null;
  itemId?: string | number | null;
  voiceId?: string | null;
  voiceProvider?: string;
  isLight?: boolean;
  className?: string;
}

const NarrationAudioButton = ({
  tts,
  text,
  speechText = null,
  itemId,
  voiceId,
  voiceProvider = DEFAULT_PROVIDER,
  isLight = false,
  className = '',
}: NarrationAudioButtonProps) => {
  const normalizedText = typeof text === 'string' ? text.trim() : '';

  if (!tts || !voiceId || !normalizedText || !itemId) return null;

  const isCurrent = String(tts.currentMessageId) === String(itemId);
  const isLoading = Boolean(String(tts.loadingTargetId || '') === String(itemId));
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
    await tts.play(normalizedText, voiceId, itemId, voiceProvider, {
      allowGenerate: true,
      speechText: speechText || normalizedText,
    });
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
