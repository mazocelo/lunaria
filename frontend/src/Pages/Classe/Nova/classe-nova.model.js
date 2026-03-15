import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classeService } from '../../../services/index.js';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../constants/routes.js';

export const useClasseNovaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarClasses = useClasseStore(s => s.recarregarClasses);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState(0);
  const [bonus, setBonus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name, value) => {
    const setters = { nome: setNome, descricao: setDescricao, custo: setCusto, bonus: setBonus };
    setters[name]?.(value);
  };

  const _buildData = () => {
    let bonusObj = null;
    if (bonus) {
      try { bonusObj = JSON.parse(bonus); } catch { bonusObj = bonus; }
    }
    return { nome, descricao: descricao || null, custo: parseInt(custo) || 0, bonus: bonusObj };
  };

  const criarClasse = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await classeService.create(_buildData());
      await recarregarClasses();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar classe: ${err.message}`);
      return { success: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await criarClasse();
    if (result.success) navigate(ROUTES.CLASSES);
  };

  const handleCancel = () => navigate(ROUTES.CLASSES);
  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
