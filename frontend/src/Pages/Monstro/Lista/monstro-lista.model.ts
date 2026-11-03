import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMonstroStore } from '../../../store/monstro/index';
import type { Monstro } from '../../../types/api';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS dos monstros vive aqui.
 */
export const useMonstroListaModel = () => {
  const allMonstros = useMonstroStore(s => s.monstros);
  const storeLoading = useMonstroStore(s => s.loading);
  const storeError = useMonstroStore(s => s.error);
  const carregarMonstros = useMonstroStore(s => s.carregarMonstros);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    carregarMonstros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilters = !!searchTerm;

  const filteredMonstros = useMemo<Monstro[]>(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return allMonstros.filter(m =>
      m.nome?.toLowerCase().includes(term) ||
      m.descricao?.toLowerCase().includes(term) ||
      m.raridade_rel?.nome?.toLowerCase().includes(term) ||
      m.categoria_rel?.nome?.toLowerCase().includes(term)
    );
  }, [allMonstros, searchTerm]);

  const paginatedMonstros = useMemo<Monstro[]>(() => {
    if (hasFilters) return filteredMonstros;
    const start = (currentPage - 1) * pageSize;
    return allMonstros.slice(start, start + pageSize);
  }, [allMonstros, filteredMonstros, hasFilters, currentPage, pageSize]);

  const totalCount = allMonstros.length;

  const raridades = useMemo<Record<string, number>>(() => {
    return (allMonstros || []).reduce((acc, m) => {
      const r = m.raridade_rel?.nome || 'Comum';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allMonstros]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const buscarMonstros = useCallback((term: string) => {
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
