import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { racaService } from '../../../services/index.js';
import { useRacaStore } from '../../../store/raca';

export const useRacaEditarModel = () => {
  const { id } = useParams();
  const recarregarRacas = useRacaStore(s => s.recarregarRacas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState(0);
  const [bonus, setBonus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadRaca(id);
    return () => setError(null);
  }, [id]);

  const loadRaca = async (racaId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await racaService.getById(racaId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCusto(data.custo ?? 0);
      setBonus(data.bonus ? (typeof data.bonus === 'string' ? data.bonus : JSON.stringify(data.bonus, null, 2)) : '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar raca: ${err.message}`);
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

  const saveRaca = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await racaService.update(id, _buildData());
      await recarregarRacas();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar raca: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, loading, saving, error,
    setField, saveRaca, clearError,
  };
};
