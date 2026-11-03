import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { temaService } from '../../../services/index';
import { useTemaStore } from '../../../store/tema';

type TemaField = 'nome' | 'descricao';

export const useTemaEditarModel = () => {
  const { id } = useParams<{ id: string }>();
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadTema(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTema = async (temaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await temaService.getById(Number(temaId));
      const tema = data as { nome?: string; descricao?: string | null };
      setNome(tema.nome || '');
      setDescricao(tema.descricao || '');
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar tema: ${message}`);
    }
  };

  const setField = (name: TemaField, value: string) => {
    const setters: Record<TemaField, (value: string) => void> = {
      nome: setNome,
      descricao: setDescricao,
    };
    setters[name]?.(value);
  };

  const saveTema = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await temaService.update(Number(id), { nome, descricao: descricao || null });
      await recarregarTemas();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar tema: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, loading, saving, error,
    setField, saveTema, clearError,
  };
};
