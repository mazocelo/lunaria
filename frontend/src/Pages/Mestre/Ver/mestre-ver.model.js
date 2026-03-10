import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mestreService } from '../../../services/index.js';
import { apiClient } from '../../../services/ApiClient.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

export const useMestreVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [mestre, setMestre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voiceName, setVoiceName] = useState(null);

  const resolveVoiceName = useCallback(async (voiceId) => {
    if (!voiceId) return;
    try {
      const res = await apiClient.get('/tts/voices');
      if (res.success) {
        const match = (res.data || []).find(v => v.voice_id === voiceId);
        if (match) setVoiceName(match.name);
      }
    } catch { /* TTS nao disponivel */ }
  }, []);

  useEffect(() => {
    if (id) loadMestre(id);
    return () => setError(null);
  }, [id]);

  const loadMestre = async (mestreId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mestreService.getById(mestreId);
      setMestre(data);
      if (data.voice_id) resolveVoiceName(data.voice_id);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar mestre: ${err.message}`);
    }
  };

  const clearError = () => setError(null);

  return {
    id, mestre, loading, error, isLight, voiceName,
    clearError, navigate, generateRoute,
  };
};
