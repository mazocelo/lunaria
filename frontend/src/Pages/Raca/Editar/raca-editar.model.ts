import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { racaService } from '../../../services/index';
import { useRacaStore } from '../../../store/raca';

type RacaField = 'nome' | 'descricao' | 'custo' | 'bonus';

export const useRacaEditarModel = () => {
  const { id } = useParams<{ id: string }>();
  const recarregarRacas = useRacaStore(s => s.recarregarRacas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [bonus, setBonus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadRaca(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadRaca = async (racaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await racaService.getById(Number(racaId));
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCusto(data.custo ?? 0);
      setBonus(
        data.bonus
          ? (typeof data.bonus === 'string' ? data.bonus : JSON.stringify(data.bonus, null, 2))
          : ''
      );
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar raca: ${message}`);
    }
  };

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

  const saveRaca = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await racaService.update(Number(id), _buildData());
      await recarregarRacas();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar raca: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, loading, saving, error,
    setField, saveRaca, clearError,
  };
};
