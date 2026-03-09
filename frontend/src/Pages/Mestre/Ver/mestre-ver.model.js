import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mestreService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

export const useMestreVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [personalidade, setPersonalidade] = useState('');
  const [modelo, setModelo] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [max_tokens, setMaxTokens] = useState('');
  const [tom_narrativo, setTomNarrativo] = useState('');
  const [regras_especiais, setRegrasEspeciais] = useState('');
  const [imagem, setImagem] = useState('');
  const [loading, setLoading] = useState(false);
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

  const clearError = () => setError(null);

  return {
    id, nome, descricao, personalidade, modelo, temperatura,
    max_tokens, tom_narrativo, regras_especiais, imagem,
    loading, error, isLight,
    clearError, navigate, generateRoute,
  };
};
