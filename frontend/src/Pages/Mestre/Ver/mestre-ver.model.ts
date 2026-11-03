import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { mestreService } from '../../../services/index';
import { apiClient } from '../../../services/ApiClient';

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

interface VoiceListItem {
  voice_id: string;
  name: string;
}

export interface MestreNormalizado {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  personalidade: string | null;
  regrasEspeciais: string | null;
  tags: string[];
  modelo: string | null;
  temperatura: number | null;
  maxTokens: number | null;
  tomNarrativo: string | null;
  voiceId: string | null;
  voiceProvider: string | null;
}

interface RawMestre {
  id: number;
  nome?: string;
  descricao?: string | null;
  imagem?: string | null;
  personalidade?: string | null;
  regras_especiais?: string | null;
  tags?: unknown;
  modelo?: string | null;
  temperatura?: number | null;
  max_tokens?: number | null;
  tom_narrativo?: string | null;
  voice_id?: string | null;
  voice_provider?: string | null;
}

export const useMestreVerModel = () => {
  const { id } = useParams<{ id: string }>();
  const [raw, setRaw] = useState<RawMestre | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string | null>(null);

  const resolveVoiceName = useCallback(async (voiceId: string, provider: string | null | undefined) => {
    if (!voiceId) return;
    try {
      const res = await apiClient.get(`/tts/voices?provider=${provider || DEFAULT_TTS_PROVIDER}`) as { success?: boolean; data?: VoiceListItem[] };
      if (res.success) {
        const match = (res.data || []).find(v => v.voice_id === voiceId);
        if (match) setVoiceName(match.name);
      }
    } catch { /* TTS nao disponivel */ }
  }, []);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    mestreService.getById(Number(id))
      .then(res => {
        const data = res.data as RawMestre;
        setRaw(data);
        if (data.voice_id) resolveVoiceName(data.voice_id, data.voice_provider);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'))
      .finally(() => setLoading(false));
  }, [id, resolveVoiceName]);

  useEffect(() => { carregar(); }, [carregar]);

  const mestre: MestreNormalizado | null = raw ? normalizarMestre(raw) : null;

  return { id, mestre, loading, error, setError, voiceName, recarregar: carregar };
};

function normalizarMestre(m: RawMestre): MestreNormalizado {
  return {
    id: m.id,
    nome: m.nome ?? '',
    descricao: m.descricao ?? null,
    imagem: m.imagem ?? null,
    personalidade: m.personalidade ?? null,
    regrasEspeciais: m.regras_especiais ?? null,
    tags: Array.isArray(m.tags) ? (m.tags as string[]) : [],
    modelo: m.modelo ?? null,
    temperatura: m.temperatura ?? null,
    maxTokens: m.max_tokens ?? null,
    tomNarrativo: m.tom_narrativo ?? null,
    voiceId: m.voice_id ?? null,
    voiceProvider: m.voice_provider ?? null,
  };
}
