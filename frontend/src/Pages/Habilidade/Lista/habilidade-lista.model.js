import { useState, useEffect, useMemo } from 'react';
import { useHabilidadeStore } from '../../../store/habilidade';
import { habilidadeService } from '../../../services/index.js';

export const useHabilidadeListaModel = () => {

  const habilidades = useHabilidadeStore(s => s.habilidades);
  const loading = useHabilidadeStore(s => s.loading);
  const error = useHabilidadeStore(s => s.error);
  const habilidadesCarregadas = useHabilidadeStore(s => s.habilidadesCarregadas);
  const carregarHabilidades = useHabilidadeStore(s => s.carregarHabilidades);
  const total = useHabilidadeStore(s => s.total);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroElemento, setFiltroElemento] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!habilidadesCarregadas) carregarHabilidades({ limit: 500 });
  }, []);

  const filteredHabilidades = useMemo(() => {
    let result = habilidades;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(h =>
        h.nome?.toLowerCase().includes(term) ||
        h.descricao?.toLowerCase().includes(term)
      );
    }
    if (filtroCategoria) {
      result = result.filter(h => h.categoria === filtroCategoria);
    }
    if (filtroElemento) {
      result = result.filter(h => h.elemento === filtroElemento);
    }
    return result;
  }, [habilidades, searchTerm, filtroCategoria, filtroElemento]);

  const stats = useMemo(() => {
    const categorias = {};
    const elementos = {};
    (habilidades || []).forEach(h => {
      if (h.categoria) categorias[h.categoria] = (categorias[h.categoria] || 0) + 1;
      if (h.elemento) elementos[h.elemento] = (elementos[h.elemento] || 0) + 1;
    });
    return { categorias, elementos };
  }, [habilidades]);

  const deleteHabilidade = async (id) => {
    try {
      await habilidadeService.delete(id);
      await carregarHabilidades({ limit: 500 }, true);
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao remover habilidade: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    habilidades,
    filteredHabilidades,
    loading,
    error: localError || error,
    searchTerm,
    filtroCategoria,
    filtroElemento,
    total,
    stats,
    buscarHabilidades: setSearchTerm,
    setFiltroCategoria,
    setFiltroElemento,
    deleteHabilidade,
    clearError,
  };
};
