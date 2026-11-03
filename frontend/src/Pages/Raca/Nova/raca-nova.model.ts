import { useState, useEffect } from 'react';
import { racaService } from '../../../services/index';
import { useRacaStore } from '../../../store/raca';

type RacaField = 'nome' | 'descricao' | 'custo' | 'bonus';

export const useRacaNovaModel = () => {
  const recarregarRacas = useRacaStore(s => s.recarregarRacas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [bonus, setBonus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name: RacaField, value: string | number) => {
    const setters: Record<RacaField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      custo: setCusto as (v: never) => void,
      bonus: setBonus as (v: never) => void,
    };
    setters[name]?.(value as never);
  };

  const _buildData = () => {
    let bonusObj: unknown = null;
    if (bonus) {
      try { bonusObj = JSON.parse(bonus); } catch { bonusObj = bonus; }
    }
    return { nome, descricao: descricao || null, custo: parseInt(String(custo)) || 0, bonus: bonusObj };
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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar raca: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, saving, error,
    setField, criarRaca, clearError,
  };
};
