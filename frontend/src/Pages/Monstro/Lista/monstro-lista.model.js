import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { monstroService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

export const useMonstroListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [monstros, setMonstros] = useState([]);
  const [allMonstros, setAllMonstros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const loadMonstros = useCallback(async (page, size) => {
    const p = page ?? currentPage;
    const s = size ?? pageSize;
    const offset = (p - 1) * s;

    setLoading(true);
    setError(null);

    try {
      const response = await monstroService.getAll({ limit: s, offset });
      const data = response.data || [];
      const total = response.pagination?.total ?? data.length;

      setMonstros(data);
      setTotalCount(total);
      setCurrentPage(p);
      setPageSize(s);
      setLoading(false);
    } catch (err) {
      setError(`Erro ao carregar monstros: ${err.message}`);
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const loadAllMonstros = useCallback(async () => {
    try {
      const response = await monstroService.getAll({});
      setAllMonstros(response.data || []);
    } catch (err) {
      console.warn('Erro ao carregar todos os monstros:', err.message);
    }
  }, []);

  useEffect(() => {
    loadMonstros();
    loadAllMonstros();
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

  const raridades = useMemo(() => {
    return (allMonstros || []).reduce((acc, m) => {
      const r = m.raridade_rel?.nome || 'Comum';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
  }, [allMonstros]);

  const handlePageChange = useCallback((newPage) => {
    loadMonstros(newPage);
  }, [loadMonstros]);

  const handlePageSizeChange = useCallback((newSize) => {
    loadMonstros(1, newSize);
  }, [loadMonstros]);

  const buscarMonstros = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    monstros,
    filteredMonstros,
    loading,
    error,
    searchTerm,
    totalCount: hasFilters ? undefined : totalCount,
    currentPage: hasFilters ? undefined : currentPage,
    pageSize: hasFilters ? undefined : pageSize,
    isLight,
    raridades,
    handlePageChange: hasFilters ? undefined : handlePageChange,
    handlePageSizeChange: hasFilters ? undefined : handlePageSizeChange,
    buscarMonstros,
    clearError,
    navigate,
    generateRoute,
  };
};
