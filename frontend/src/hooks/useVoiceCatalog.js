import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../services/ApiClient.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const useVoiceCatalog = () => {
  const [providers, setProviders] = useState([]);
  const [voicesByProvider, setVoicesByProvider] = useState({});
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingVoicesByProvider, setLoadingVoicesByProvider] = useState({});

  const providersRef = useRef([]);
  const voicesRef = useRef({});

  const ensureProviders = useCallback(async () => {
    if (providersRef.current.length > 0) return providersRef.current;

    setLoadingProviders(true);
    try {
      const response = await apiClient.get('/tts/providers');
      const nextProviders = Array.isArray(response?.data) && response.data.length > 0
        ? response.data
        : [DEFAULT_TTS_PROVIDER];
      providersRef.current = nextProviders;
      setProviders(nextProviders);
      return nextProviders;
    } catch (_) {
      const fallbackProviders = [DEFAULT_TTS_PROVIDER];
      providersRef.current = fallbackProviders;
      setProviders(fallbackProviders);
      return fallbackProviders;
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  const ensureVoices = useCallback(async (provider = DEFAULT_TTS_PROVIDER) => {
    if (!provider) return [];
    if (Array.isArray(voicesRef.current[provider])) return voicesRef.current[provider];

    setLoadingVoicesByProvider((prev) => ({ ...prev, [provider]: true }));
    try {
      const response = await apiClient.get(`/tts/voices?provider=${provider}`);
      const nextVoices = Array.isArray(response?.data) ? response.data : [];
      voicesRef.current = { ...voicesRef.current, [provider]: nextVoices };
      setVoicesByProvider((prev) => ({ ...prev, [provider]: nextVoices }));
      return nextVoices;
    } catch (_) {
      voicesRef.current = { ...voicesRef.current, [provider]: [] };
      setVoicesByProvider((prev) => ({ ...prev, [provider]: [] }));
      return [];
    } finally {
      setLoadingVoicesByProvider((prev) => ({ ...prev, [provider]: false }));
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const nextProviders = await ensureProviders();
      if (nextProviders.length === 0) return;
      await Promise.all(nextProviders.map((p) => ensureVoices(p)));
    };
    bootstrap();
  }, [ensureProviders, ensureVoices]);

  const getVoices = useCallback((provider = DEFAULT_TTS_PROVIDER) => (
    Array.isArray(voicesByProvider[provider]) ? voicesByProvider[provider] : []
  ), [voicesByProvider]);

  const isLoadingVoices = useCallback((provider = DEFAULT_TTS_PROVIDER) => (
    Boolean(loadingVoicesByProvider[provider])
  ), [loadingVoicesByProvider]);

  return useMemo(() => ({
    providers,
    voicesByProvider,
    loadingProviders,
    loadingVoicesByProvider,
    ensureProviders,
    ensureVoices,
    getVoices,
    isLoadingVoices,
    defaultProvider: providers[0] || DEFAULT_TTS_PROVIDER
  }), [
    providers,
    voicesByProvider,
    loadingProviders,
    loadingVoicesByProvider,
    ensureProviders,
    ensureVoices,
    getVoices,
    isLoadingVoices
  ]);
};

export default useVoiceCatalog;
