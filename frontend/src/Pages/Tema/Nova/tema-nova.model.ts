import { useState, useEffect } from 'react';
import { temaService } from '../../../services/index';
import { useTemaStore } from '../../../store/tema';

type TemaField = 'nome' | 'descricao';

export const useTemaNovaModel = () => {
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name: TemaField, value: string) => {
    const setters: Record<TemaField, (value: string) => void> = {
      nome: setNome,
      descricao: setDescricao,
    };
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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar tema: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, saving, error,
    setField, criarTema, clearError,
  };
};
