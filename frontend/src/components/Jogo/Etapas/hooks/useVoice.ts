import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../../../services';
import { useSocketStore } from '../../../../store/index';

interface VoiceConfig {
  voice_id?: string | null;
  voice_provider?: string | null;
}

interface HistoriaComMestre {
  mestre?: VoiceConfig;
  mestres?: VoiceConfig;
  [key: string]: unknown;
}

interface MensagemComVoz {
  tipo?: string;
  type?: string;
  voice_id?: string | null;
  voice_provider?: string | null;
  [key: string]: unknown;
}

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const useVoice = (historia: HistoriaComMestre | null | undefined, mensagens: MensagemComVoz[] | null | undefined) => {
  const socketSession = useSocketStore(s => s.session) as { mestreConfig?: VoiceConfig } | null | undefined;

  const fallbackMensagemMestreComVoz = useMemo<MensagemComVoz | null>(() => (
    (mensagens || []).find((mensagem) => {
      const tipoMensagem = mensagem?.tipo || mensagem?.type;
      return tipoMensagem === 'mestre' && (mensagem?.voice_id || mensagem?.voice_provider);
    }) || null
  ), [mensagens]);

  const baseVoiceId = useMemo(() => (
    historia?.mestre?.voice_id
    || historia?.mestres?.voice_id
    || socketSession?.mestreConfig?.voice_id
    || fallbackMensagemMestreComVoz?.voice_id
    || null
  ), [
    fallbackMensagemMestreComVoz?.voice_id,
    historia?.mestre?.voice_id,
    historia?.mestres?.voice_id,
    socketSession?.mestreConfig?.voice_id
  ]);

  const baseVoiceProvider = useMemo(() => (
    historia?.mestre?.voice_provider
    || historia?.mestres?.voice_provider
    || socketSession?.mestreConfig?.voice_provider
    || fallbackMensagemMestreComVoz?.voice_provider
    || null
  ), [
    fallbackMensagemMestreComVoz?.voice_provider,
    historia?.mestre?.voice_provider,
    historia?.mestres?.voice_provider,
    socketSession?.mestreConfig?.voice_provider
  ]);

  const [defaultNarrationVoice, setDefaultNarrationVoice] = useState<{ voiceId: string | null; provider: string | null }>({ voiceId: null, provider: null });

  useEffect(() => {
    let active = true;

    if (baseVoiceId) {
      setDefaultNarrationVoice((prev) => (
        prev.voiceId || prev.provider
          ? { voiceId: null, provider: null }
          : prev
      ));
      return undefined;
    }

    const carregarVoicePadrao = async () => {
      try {
        const query = baseVoiceProvider ? `?provider=${encodeURIComponent(baseVoiceProvider)}` : '';
        const response = await apiClient.get(`/tts/voices${query}`) as { data?: Array<{ voice_id?: string }>; provider?: string } | null;
        const voices = Array.isArray(response?.data) ? response.data : [];
        const firstVoice = voices[0];

        if (!active || !firstVoice?.voice_id) return;

        setDefaultNarrationVoice({
          voiceId: firstVoice.voice_id,
          provider: response?.provider || baseVoiceProvider || null,
        });
      } catch {
        if (!active) return;
        setDefaultNarrationVoice({ voiceId: null, provider: null });
      }
    };

    carregarVoicePadrao();

    return () => {
      active = false;
    };
  }, [baseVoiceId, baseVoiceProvider]);

  const effectiveVoiceId = baseVoiceId || defaultNarrationVoice.voiceId || null;
  const effectiveVoiceProvider = baseVoiceProvider || defaultNarrationVoice.provider || DEFAULT_TTS_PROVIDER;

  return { effectiveVoiceId, effectiveVoiceProvider };
};
