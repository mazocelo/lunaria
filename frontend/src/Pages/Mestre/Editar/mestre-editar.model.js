import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mestreService } from '../../../services/index.js';
import { useMestreStore } from '../../../store/mestre';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../routes.jsx';

export const useMestreEditarModel = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadMestre(id);
    return () => setError(null);
  }, [id]);

  const loadMestre = async (mestreId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mestreService.getById(mestreId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setPersonalidade(data.personalidade || '');
      setModelo(data.modelo || 'openai/gpt-oss-120b');
      setTemperatura(data.temperatura ?? 0.9);
      setMaxTokens(data.max_tokens ?? 8000);
      setTomNarrativo(data.tom_narrativo || '');
      setRegrasEspeciais(data.regras_especiais || '');
      setImagem(data.imagem || '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar mestre: ${err.message}`);
    }
  };

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
    setSaving(true);
    setError(null);
    try {
      await mestreService.update(id, _buildData());
      await recarregarMestres();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar mestre: ${err.message}`);
      return { success: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await saveMestre();
    if (result.success) navigate(ROUTES.MESTRES);
  };

  const handleCancel = () => navigate(ROUTES.MESTRES);
  const clearError = () => setError(null);

  return {
    nome, descricao, personalidade, modelo, temperatura,
    max_tokens, tom_narrativo, regras_especiais, imagem,
    loading, saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
