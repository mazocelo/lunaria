import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Play, Volume2 } from 'lucide-react';
import { apiClient } from '../../services/ApiClient.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const PROVIDER_LABELS = {
  elevenlabs: 'ElevenLabs',
  cartesia: 'Cartesia',
  opensource: 'Open Source'
};

const VoicePicker = ({
  label = 'Voz',
  voiceId = '',
  voiceProvider = DEFAULT_TTS_PROVIDER,
  providers = [],
  voices = [],
  loadingVoices = false,
  ensureVoices = null,
  onChange,
  isLight = false,
  compact = false,
  helperText = ''
}) => {
  const previewAudioRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!voiceProvider || typeof ensureVoices !== 'function') return;
    ensureVoices(voiceProvider);
  }, [voiceProvider, ensureVoices]);

  useEffect(() => () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const effectiveVoices = useMemo(() => {
    const currentVoices = Array.isArray(voices) ? voices : [];
    const hasSelectedVoice = currentVoices.some((voice) => voice.voice_id === voiceId);
    if (!voiceId || hasSelectedVoice) return currentVoices;
    return [
      { voice_id: voiceId, name: 'Voz salva indisponivel', category: 'persistida' },
      ...currentVoices
    ];
  }, [voiceId, voices]);

  const selectedVoice = effectiveVoices.find((voice) => voice.voice_id === voiceId) || null;

  const selectClass = compact
    ? `w-full px-2 py-1.5 rounded text-xs transition-all ${
        isLight
          ? 'bg-slate-100 border border-slate-300 text-slate-800'
          : 'bg-slate-900/50 border border-slate-700 text-slate-100'
      }`
    : `w-full px-3 py-2 rounded-lg text-sm transition-all ${
        isLight
          ? 'bg-slate-100 border border-slate-300 text-slate-800'
          : 'bg-slate-900/50 border border-slate-700 text-slate-100'
      }`;

  const buttonClass = compact
    ? `px-2 py-1 rounded text-[11px] transition-all ${
        isLight
          ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
      }`
    : `px-3 py-2 rounded-lg text-sm transition-all ${
        isLight
          ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
      }`;

  const handleProviderChange = (provider) => {
    onChange?.({
      voice_id: '',
      voice_provider: provider || DEFAULT_TTS_PROVIDER
    });
  };

  const handleVoiceChange = (value) => {
    onChange?.({
      voice_id: value || null,
      voice_provider: value ? (voiceProvider || DEFAULT_TTS_PROVIDER) : null
    });
  };

  const handlePreview = async () => {
    if (!voiceId || loadingPreview) return;

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setLoadingPreview(true);
    try {
      const response = await apiClient.post('/tts/preview', {
        voiceId,
        provider: voiceProvider || DEFAULT_TTS_PROVIDER
      }, { responseType: 'blob' });

      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      previewUrlRef.current = url;
      previewAudioRef.current = audio;
      audio.onended = () => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      };

      await audio.play();
    } catch (_) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      previewAudioRef.current = null;
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`font-medium ${compact ? 'text-[11px]' : 'text-xs uppercase tracking-wide'} ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {label}
        </span>
        {selectedVoice && (
          <button
            type="button"
            onClick={handlePreview}
            disabled={loadingPreview}
            className={buttonClass}
            title="Ouvir preview"
          >
            {loadingPreview ? <Loader2 size={compact ? 12 : 14} className="animate-spin" /> : <Play size={compact ? 12 : 14} />}
          </button>
        )}
      </div>

      {providers.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleProviderChange(provider)}
              className={`${compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-md border transition-all ${
                voiceProvider === provider
                  ? 'bg-purple-500 text-white border-purple-400'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    : 'bg-slate-900/50 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {PROVIDER_LABELS[provider] || provider}
            </button>
          ))}
        </div>
      )}

      {loadingVoices ? (
        <div className={`flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'} ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <Loader2 size={compact ? 12 : 14} className="animate-spin" />
          <span>Carregando vozes...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Volume2 size={compact ? 12 : 14} className={`absolute left-2 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <select
              value={voiceId || ''}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className={`${selectClass} pl-7`}
            >
              <option value="">Sem voz</option>
              {effectiveVoices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}{voice.category ? ` (${voice.category})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {(helperText || voiceId) && (
        <p className={`${compact ? 'text-[11px]' : 'text-xs'} ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          {helperText || (
            selectedVoice
              ? 'Esta voz sera usada nas falas do NPC.'
              : 'A voz esta salva, mas nao veio na lista atual do provider.'
          )}
        </p>
      )}
    </div>
  );
};

export default VoicePicker;
