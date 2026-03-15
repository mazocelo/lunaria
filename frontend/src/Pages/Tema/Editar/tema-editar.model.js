import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { temaService } from '../../../services/index.js';
import { useTemaStore } from '../../../store/tema';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../constants/routes.js';

export const useTemaEditarModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadTema(id);
    return () => setError(null);
  }, [id]);

  const loadTema = async (temaId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await temaService.getById(temaId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar tema: ${err.message}`);
    }
  };

  const setField = (name, value) => {
    const setters = { nome: setNome, descricao: setDescricao };
    setters[name]?.(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome e obrigatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      await temaService.update(id, { nome, descricao: descricao || null });
      await recarregarTemas();
      setSaving(false);
      navigate(ROUTES.TEMAS);
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar tema: ${err.message}`);
    }
  };

  const handleCancel = () => navigate(ROUTES.TEMAS);
  const clearError = () => setError(null);

  return {
    nome, descricao, loading, saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
