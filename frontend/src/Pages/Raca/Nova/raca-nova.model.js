import { useState, useEffect } from 'react';
import { racaService } from '../../../services/index.js';
import { useRacaStore } from '../../../store/raca';

export const useRacaNovaModel = () => {
  const recarregarRacas = useRacaStore(s => s.recarregarRacas);

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

  const criarRaca = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await racaService.create(_buildData());
      await recarregarRacas();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar raca: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, saving, error,
    setField, criarRaca, clearError,
  };
};
