import { useState, useEffect, useMemo } from 'react';
import { useRacaStore } from '../../../store/raca';
import { racaService } from '../../../services/index.js';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS das racas vive aqui.
 */
export const useRacaListaModel = () => {
  const racas = useRacaStore(s => s.racas);
  const loading = useRacaStore(s => s.loading);
  const error = useRacaStore(s => s.error);
  const carregarRacas = useRacaStore(s => s.carregarRacas);
  const recarregarRacas = useRacaStore(s => s.recarregarRacas);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    // Catalogo Lunaria (default): carregarRacas recarrega sozinho caso o cache
    // esteja preenchido com outro sistema (ex.: apos abrir o wizard D&D).
    carregarRacas();
  }, []);

  const filteredRacas = useMemo(() => {
    if (!searchTerm) return racas;
    const term = searchTerm.toLowerCase();
    return racas.filter(r =>
      r.nome?.toLowerCase().includes(term) ||
      r.descricao?.toLowerCase().includes(term)
    );
  }, [racas, searchTerm]);

  const gratuitas = useMemo(() => (racas || []).filter(r => r.custo === 0).length, [racas]);
  const pagas = useMemo(() => (racas || []).length - gratuitas, [racas, gratuitas]);

  const deleteRaca = async (id) => {
    try {
      await racaService.delete(id);
      await recarregarRacas();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao remover raca: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    racas,
    filteredRacas,
    loading,
    error: localError || error,
    searchTerm,
    gratuitas,
    pagas,
    buscarRacas: setSearchTerm,
    deleteRaca,
    clearError,
  };
};
