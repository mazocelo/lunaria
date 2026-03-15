import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { temaService } from '../../../services/index.js';
import { useTemaStore } from '../../../store/tema';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../constants/routes.js';

export const useTemaNovaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name, value) => {
    const setters = { nome: setNome, descricao: setDescricao };
    setters[name]?.(value);
  };

  const criarTema = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await temaService.create({ nome, descricao: descricao || null });
      await recarregarTemas();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar tema: ${err.message}`);
      return { success: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await criarTema();
    if (result.success) navigate(ROUTES.TEMAS);
  };

  const handleCancel = () => navigate(ROUTES.TEMAS);
  const clearError = () => setError(null);

  return {
    nome, descricao, saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
