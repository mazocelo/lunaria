import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { mestreService } from '../../../services/index';
import { useMestreStore } from '../../../store/mestre';
import { apiClient } from '../../../services/ApiClient';

type MestreField =
  | 'nome' | 'descricao' | 'personalidade' | 'modelo' | 'temperatura'
  | 'tom_narrativo' | 'regras_especiais' | 'tags_input' | 'imagem'
  | 'voice_id' | 'voice_provider';

export interface VoiceOption {
  voice_id: string;
  name: string;
  category?: string;
}

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

export const useMestreEditarModel = () => {
  const { id } = useParams<{ id: string }>();
  const recarregarMestres = useMestreStore(s => s.recarregarMestres);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [personalidade, setPersonalidade] = useState('');
  const [modelo, setModelo] = useState('gemini-2.5-flash');
  const [temperatura, setTemperatura] = useState<number | string>(0.9);
  const max_tokens = 32000;
  const [tom_narrativo, setTomNarrativo] = useState('');
  const [regras_especiais, setRegrasEspeciais] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imagem, setImagem] = useState('');
  const [voice_id, setVoiceId] = useState('');
  const [voice_provider, setVoiceProvider] = useState(DEFAULT_TTS_PROVIDER);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialProviderLoaded, setInitialProviderLoaded] = useState(false);

  const carregarProviders = useCallback(async () => {
    try {
      const res = await apiClient.get('/tts/providers') as { success?: boolean; data?: string[] };
      if (res.success) setProviders(res.data || []);
    } catch { /* TTS nao disponivel */ }
  }, []);

  const carregarVozes = useCallback(async (provider: string) => {
    setLoadingVoices(true);
    try {
      const res = await apiClient.get(`/tts/voices?provider=${provider}`) as { success?: boolean; data?: VoiceOption[] };
      if (res.success) {
        setVoices(res.data || []);
      }
    } catch { /* TTS nao disponivel */ }
    setLoadingVoices(false);
  }, []);

  useEffect(() => {
    if (id) loadMestre(id);
    carregarProviders();
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (initialProviderLoaded) {
      carregarVozes(voice_provider);
    }
  }, [voice_provider, initialProviderLoaded, carregarVozes]);

  const loadMestre = async (mestreId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mestreService.getById(Number(mestreId));
      const m = data as Record<string, unknown>;
      setNome((m.nome as string) || '');
      setDescricao((m.descricao as string) || '');
      setPersonalidade((m.personalidade as string) || '');
      setModelo((m.modelo as string) || 'openai/gpt-oss-120b');
      setTemperatura((m.temperatura as number) ?? 0.9);
      setTomNarrativo((m.tom_narrativo as string) || '');
      setRegrasEspeciais((m.regras_especiais as string) || '');
      setTagsInput(Array.isArray(m.tags) ? (m.tags as string[]).join(', ') : '');
      setImagem((m.imagem as string) || '');
      setVoiceId((m.voice_id as string) || '');
      const mestreProvider = (m.voice_provider as string) || DEFAULT_TTS_PROVIDER;
      setVoiceProvider(mestreProvider);
      setInitialProviderLoaded(true);
      await carregarVozes(mestreProvider);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar mestre: ${message}`);
    }
  };

  const setField = (name: MestreField, value: string | number) => {
    const setters: Record<MestreField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      personalidade: setPersonalidade as (v: never) => void,
      modelo: setModelo as (v: never) => void,
      temperatura: setTemperatura as (v: never) => void,
      tom_narrativo: setTomNarrativo as (v: never) => void,
      regras_especiais: setRegrasEspeciais as (v: never) => void,
      tags_input: setTagsInput as (v: never) => void,
      imagem: setImagem as (v: never) => void,
      voice_id: setVoiceId as (v: never) => void,
      voice_provider: setVoiceProvider as (v: never) => void,
    };
    setters[name]?.(value as never);
  };

  const _buildData = () => {
    const temp = parseFloat(String(temperatura));
    const tags = Array.from(new Set(
      (tagsInput || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length >= 2 && t.length <= 30)
    )).slice(0, 6);
    return {
      nome,
      descricao: descricao || null,
      personalidade: personalidade || null,
      tags,
      modelo: modelo || null,
      temperatura: isNaN(temp) ? 0.9 : temp,
      max_tokens: 32000,
      tom_narrativo: tom_narrativo || null,
      regras_especiais: regras_especiais || null,
      imagem: imagem || null,
      voice_id: voice_id || null,
      voice_provider: voice_id ? (voice_provider || DEFAULT_TTS_PROVIDER) : null,
    };
  };

  const saveMestre = async () => {
    if (!nome.trim()) {
      setError('Nome e obrigatorio');
      return { success: false };
    }
    if (nome.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return { success: false };
    }
    const tags = _buildData().tags || [];
    if (tags.length < 2 || tags.length > 6) {
      setError('Informe entre 2 e 6 etiquetas (separadas por virgula)');
      return { success: false };
    }
    if (!id) {
      setError('ID nao informado');
      return { success: false };
    }
    setSaving(true);
    setError(null);
    try {
      await mestreService.update(Number(id), _buildData());
      await recarregarMestres();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar mestre: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, personalidade, modelo, temperatura,
    max_tokens, tom_narrativo, regras_especiais, tagsInput, imagem,
    voice_id, voice_provider, voices, providers, loadingVoices,
    loading, saving, error,
    setField, saveMestre, clearError,
  };
};
