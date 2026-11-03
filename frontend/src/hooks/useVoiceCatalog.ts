import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../services/ApiClient';

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

/**
 * Voz disponivel num provider TTS. Shape solto porque o catalogo difere por
 * provider (ElevenLabs traz `labels`, Cartesia traz `language`, etc.) — o front
 * trata como item generico de combobox.
 */
export interface VoiceEntry {
  id?: string;
  voice_id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface UseVoiceCatalogResult {
  providers: string[];
  voicesByProvider: Record<string, VoiceEntry[]>;
  loadingProviders: boolean;
  loadingVoicesByProvider: Record<string, boolean>;
  ensureProviders: () => Promise<string[]>;
  ensureVoices: (provider?: string) => Promise<VoiceEntry[]>;
  getVoices: (provider?: string) => VoiceEntry[];
  isLoadingVoices: (provider?: string) => boolean;
  defaultProvider: string;
}

export const useVoiceCatalog = (): UseVoiceCatalogResult => {
  const [providers, setProviders] = useState<string[]>([]);
  const [voicesByProvider, setVoicesByProvider] = useState<Record<string, VoiceEntry[]>>({});
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingVoicesByProvider, setLoadingVoicesByProvider] = useState<Record<string, boolean>>({});

  const providersRef = useRef<string[]>([]);
  const voicesRef = useRef<Record<string, VoiceEntry[]>>({});

  const ensureProviders = useCallback(async (): Promise<string[]> => {
    if (providersRef.current.length > 0) return providersRef.current;

    setLoadingProviders(true);
    try {
      const response = (await apiClient.get('/tts/providers')) as { data?: unknown } | null;
      const data = response?.data;
      const nextProviders =
        Array.isArray(data) && data.length > 0 ? (data as string[]) : [DEFAULT_TTS_PROVIDER];
      providersRef.current = nextProviders;
      setProviders(nextProviders);
      return nextProviders;
    } catch {
      const fallbackProviders = [DEFAULT_TTS_PROVIDER];
      providersRef.current = fallbackProviders;
      setProviders(fallbackProviders);
      return fallbackProviders;
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  const ensureVoices = useCallback(
    async (provider: string = DEFAULT_TTS_PROVIDER): Promise<VoiceEntry[]> => {
      if (!provider) return [];
      if (Array.isArray(voicesRef.current[provider])) return voicesRef.current[provider];

      setLoadingVoicesByProvider((prev) => ({ ...prev, [provider]: true }));
      try {
        const response = (await apiClient.get(`/tts/voices?provider=${provider}`)) as {
          data?: unknown;
        } | null;
        const data = response?.data;
        const nextVoices = Array.isArray(data) ? (data as VoiceEntry[]) : [];
        voicesRef.current = { ...voicesRef.current, [provider]: nextVoices };
        setVoicesByProvider((prev) => ({ ...prev, [provider]: nextVoices }));
        return nextVoices;
      } catch {
        voicesRef.current = { ...voicesRef.current, [provider]: [] };
        setVoicesByProvider((prev) => ({ ...prev, [provider]: [] }));
        return [];
      } finally {
        setLoadingVoicesByProvider((prev) => ({ ...prev, [provider]: false }));
      }
    },
    []
  );

  useEffect(() => {
    const bootstrap = async () => {
      const nextProviders = await ensureProviders();
      if (nextProviders.length === 0) return;
      await Promise.all(nextProviders.map((p) => ensureVoices(p)));
    };
    bootstrap();
  }, [ensureProviders, ensureVoices]);

  const getVoices = useCallback(
    (provider: string = DEFAULT_TTS_PROVIDER): VoiceEntry[] =>
      Array.isArray(voicesByProvider[provider]) ? voicesByProvider[provider] : [],
    [voicesByProvider]
  );

  const isLoadingVoices = useCallback(
    (provider: string = DEFAULT_TTS_PROVIDER): boolean =>
      Boolean(loadingVoicesByProvider[provider]),
    [loadingVoicesByProvider]
  );

  return useMemo<UseVoiceCatalogResult>(
    () => ({
      providers,
      voicesByProvider,
      loadingProviders,
      loadingVoicesByProvider,
      ensureProviders,
      ensureVoices,
      getVoices,
      isLoadingVoices,
      defaultProvider: providers[0] || DEFAULT_TTS_PROVIDER,
    }),
    [
      providers,
      voicesByProvider,
      loadingProviders,
      loadingVoicesByProvider,
      ensureProviders,
      ensureVoices,
      getVoices,
      isLoadingVoices,
    ]
  );
};

export default useVoiceCatalog;
