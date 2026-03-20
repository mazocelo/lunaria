import { useState, useEffect } from 'react';
import { temaService } from '../../../services/index.js';
import { useTemaStore } from '../../../store/tema';

export const useTemaNovaModel = () => {
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name, value) => {
    const setters = { nome: setNome, descricao: setDescricao };
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
      setSaving(false);
      setError(`Erro ao criar tema: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, saving, error,
    setField, criarTema, clearError,
  };
};
