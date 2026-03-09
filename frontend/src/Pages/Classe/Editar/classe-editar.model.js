import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classeService } from '../../../services/index.js';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../routes.jsx';

export const useClasseEditarModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarClasses = useClasseStore(s => s.recarregarClasses);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState(0);
  const [bonus, setBonus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadClasse(id);
    return () => setError(null);
  }, [id]);

  const loadClasse = async (classeId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await classeService.getById(classeId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCusto(data.custo ?? 0);
      setBonus(data.bonus ? (typeof data.bonus === 'string' ? data.bonus : JSON.stringify(data.bonus, null, 2)) : '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar classe: ${err.message}`);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome e obrigatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      await classeService.update(id, _buildData());
      await recarregarClasses();
      setSaving(false);
      navigate(ROUTES.CLASSES);
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar classe: ${err.message}`);
    }
  };

  const handleCancel = () => navigate(ROUTES.CLASSES);
  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, loading, saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
