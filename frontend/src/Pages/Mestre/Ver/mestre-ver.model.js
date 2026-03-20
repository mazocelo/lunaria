import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { mestreService } from '../../../services/index.js';
import { apiClient } from '../../../services/ApiClient.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS do mestre vive aqui.
 */
export const useMestreVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voiceName, setVoiceName] = useState(null);

  // --- Voice name resolution ---
  const resolveVoiceName = useCallback(async (voiceId, provider) => {
    if (!voiceId) return;
    try {
      const res = await apiClient.get(`/tts/voices?provider=${provider || DEFAULT_TTS_PROVIDER}`);
      if (res.success) {
        const match = (res.data || []).find(v => v.voice_id === voiceId);
        if (match) setVoiceName(match.name);
      }
    } catch { /* TTS nao disponivel */ }
  }, []);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    mestreService.getById(id)
      .then(res => {
        setRaw(res.data);
        if (res.data.voice_id) resolveVoiceName(res.data.voice_id, res.data.voice_provider);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, resolveVoiceName]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const mestre = raw ? normalizarMestre(raw) : null;

  return { id, mestre, loading, error, setError, voiceName, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve relacoes, converte snake_case, trata arrays e JSON.
 */
function normalizarMestre(m) {
  return {
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,
    imagem: m.imagem,
    personalidade: m.personalidade,
    regrasEspeciais: m.regras_especiais,

    // Arrays normalizados (nunca undefined)
    tags: Array.isArray(m.tags) ? m.tags : [],

    // Configuracoes IA
    modelo: m.modelo,
    temperatura: m.temperatura,
    maxTokens: m.max_tokens,
    tomNarrativo: m.tom_narrativo,

    // TTS
    voiceId: m.voice_id,
    voiceProvider: m.voice_provider,
  };
}
