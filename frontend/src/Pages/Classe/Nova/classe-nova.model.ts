import { useState, useEffect } from 'react';
import { classeService } from '../../../services/index';
import { useClasseStore } from '../../../store/classe';

type ClasseField = 'nome' | 'descricao' | 'custo' | 'bonus';

export const useClasseNovaModel = () => {
  const recarregarClasses = useClasseStore(s => s.recarregarClasses);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [bonus, setBonus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar classe: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, bonus, saving, error,
    setField, criarClasse, clearError,
  };
};
