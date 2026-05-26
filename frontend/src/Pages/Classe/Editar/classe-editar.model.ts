import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { classeService } from '../../../services/index';
import { useClasseStore } from '../../../store/classe';

type ClasseField = 'nome' | 'descricao' | 'custo' | 'bonus';

export const useClasseEditarModel = () => {
  const { id } = useParams<{ id: string }>();
  const recarregarClasses = useClasseStore(s => s.recarregarClasses);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [bonus, setBonus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadClasse(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadClasse = async (classeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await classeService.getById(Number(classeId));
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
      setError(`Erro ao carregar classe: ${message}`);
    }
  };

  const setField = (name: ClasseField, value: string | number) => {
    const setters: Record<ClasseField, (value: never) => void> = {
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
    return {
      nome,
      descricao: descricao || null,
      custo: parseInt(String(custo)) || 0,
      bonus: bonusObj,
    };
  };

  const saveClasse = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await classeService.update(Number(id), _buildData());
      await recarregarClasses();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar classe: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, loading, saving, error,
    setField, saveClasse, clearError,
  };
};
