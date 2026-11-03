import { useState, useEffect, useMemo } from 'react';
import { useClasseStore } from '../../../store/classe';
import { classeService } from '../../../services/index';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS das classes vive aqui.
 */
export const useClasseListaModel = () => {
  const classes = useClasseStore(s => s.classes);
  const loading = useClasseStore(s => s.loading);
  const error = useClasseStore(s => s.error);
  const carregarClasses = useClasseStore(s => s.carregarClasses);
  const recarregarClasses = useClasseStore(s => s.recarregarClasses);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Catalogo Lunaria (default): carregarClasses recarrega sozinho caso o cache
    // esteja preenchido com outro sistema (ex.: apos abrir o wizard D&D).
    carregarClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClasses = useMemo(() => {
    if (!searchTerm) return classes;
    const term = searchTerm.toLowerCase();
    return classes.filter((c) =>
      c.nome?.toLowerCase().includes(term) ||
      c.descricao?.toLowerCase().includes(term),
    );
  }, [classes, searchTerm]);

  const gratuitas = useMemo(() => (classes || []).filter((c) => c.custo === 0).length, [classes]);
  const pagas = useMemo(() => (classes || []).length - gratuitas, [classes, gratuitas]);

  const deleteClasse = async (id: number | string) => {
    try {
      await classeService.delete(Number(id));
      await recarregarClasses();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLocalError(`Erro ao remover classe: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    classes,
    filteredClasses,
    loading,
    error: localError || error,
    searchTerm,
    gratuitas,
    pagas,
    buscarClasses: setSearchTerm,
    deleteClasse,
    clearError,
  };
};
