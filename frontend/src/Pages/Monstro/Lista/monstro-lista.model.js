import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMonstroStore } from '../../../store/monstro/index.js';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS dos monstros vive aqui.
 */
export const useMonstroListaModel = () => {
  // Monstro store
  const allMonstros = useMonstroStore(s => s.monstros);
  const storeLoading = useMonstroStore(s => s.loading);
  const storeError = useMonstroStore(s => s.error);
  const carregarMonstros = useMonstroStore(s => s.carregarMonstros);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    carregarMonstros();
  }, []);

  const hasFilters = !!searchTerm;

  const filteredMonstros = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return allMonstros.filter(m =>
      m.nome?.toLowerCase().includes(term) ||
      m.descricao?.toLowerCase().includes(term) ||
      m.raridade_rel?.nome?.toLowerCase().includes(term) ||
      m.categoria_rel?.nome?.toLowerCase().includes(term)
    );
  }, [allMonstros, searchTerm]);

  // Paginated view
  const paginatedMonstros = useMemo(() => {
    if (hasFilters) return filteredMonstros;
    const start = (currentPage - 1) * pageSize;
    return allMonstros.slice(start, start + pageSize);
  }, [allMonstros, filteredMonstros, hasFilters, currentPage, pageSize]);

  const totalCount = allMonstros.length;

  const raridades = useMemo(() => {
    return (allMonstros || []).reduce((acc, m) => {
      const r = m.raridade_rel?.nome || 'Comum';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
  }, [allMonstros]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const buscarMonstros = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearError = useCallback(() => {}, []);

  return {
    monstros: paginatedMonstros,
    filteredMonstros,
    loading: storeLoading,
    error: storeError,
    searchTerm,
    totalCount: hasFilters ? undefined : totalCount,
    currentPage: hasFilters ? undefined : currentPage,
    pageSize: hasFilters ? undefined : pageSize,
    raridades,
    handlePageChange: hasFilters ? undefined : handlePageChange,
    handlePageSizeChange: hasFilters ? undefined : handlePageSizeChange,
    buscarMonstros,
    clearError,
  };
};
