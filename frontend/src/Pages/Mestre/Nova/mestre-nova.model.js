import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mestreService } from '../../../services/index.js';
import { useMestreStore } from '../../../store/mestre';
import { useTheme } from '../../../contexts/theme.jsx';

import { apiClient } from '../../../services/ApiClient.js';
import { ROUTES } from '../../../routes.jsx';

export const useMestreNovaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarMestres = useMestreStore(s => s.recarregarMestres);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [personalidade, setPersonalidade] = useState('');
  const [modelo, setModelo] = useState('openai/gpt-oss-120b');
  const [temperatura, setTemperatura] = useState(0.9);
  const [max_tokens, setMaxTokens] = useState(8000);
  const [tom_narrativo, setTomNarrativo] = useState('');
  const [regras_especiais, setRegrasEspeciais] = useState('');
  const [imagem, setImagem] = useState('');
  const [voice_id, setVoiceId] = useState('');
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const carregarVozes = useCallback(async () => {
    setLoadingVoices(true);
    try {
      const res = await apiClient.get('/tts/voices');
      if (res.success) {
        setVoices(res.data || []);
      }
    } catch { /* TTS não disponível */ }
    setLoadingVoices(false);
  }, []);

  useEffect(() => {
    carregarVozes();
    return () => setError(null);
  }, [carregarVozes]);

  const setField = (name, value) => {
    const setters = {
      nome: setNome,
      descricao: setDescricao,
      personalidade: setPersonalidade,
      modelo: setModelo,
      temperatura: setTemperatura,
      max_tokens: setMaxTokens,
      tom_narrativo: setTomNarrativo,
      regras_especiais: setRegrasEspeciais,
      imagem: setImagem,
      voice_id: setVoiceId,
    };
    setters[name]?.(value);
  };

  const _buildData = () => {
    const temp = parseFloat(temperatura);
    const tokens = parseInt(max_tokens);
    return {
      nome,
      descricao: descricao || null,
      personalidade: personalidade || null,
      modelo: modelo || null,
      temperatura: isNaN(temp) ? 0.9 : temp,
      max_tokens: isNaN(tokens) ? 8000 : tokens,
      tom_narrativo: tom_narrativo || null,
      regras_especiais: regras_especiais || null,
      imagem: imagem || null,
      voice_id: voice_id || null,
    };
  };

  const criarMestre = async () => {
    if (!nome.trim()) {
      setError('Nome e obrigatorio');
      return { success: false };
    }
    if (nome.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return { success: false };
    }
    setSaving(true);
    setError(null);
    try {
      await mestreService.create(_buildData());
      await recarregarMestres();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar mestre: ${err.message}`);
      return { success: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await criarMestre();
    if (result.success) navigate(ROUTES.MESTRES);
  };

  const handleCancel = () => navigate(ROUTES.MESTRES);
  const clearError = () => setError(null);

  return {
    nome, descricao, personalidade, modelo, temperatura,
    max_tokens, tom_narrativo, regras_especiais, imagem,
    voice_id, voices, loadingVoices,
    saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
