import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipamentoService, catalogoService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

export const useEquipamentoListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [raridadeFilter, setRaridadeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [raridades, setRaridades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipToDelete, setEquipToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadEquipamentos = useCallback(async (page, size) => {
    const p = page ?? currentPage;
    const s = size ?? pageSize;
    const offset = (p - 1) * s;

    setLoading(true);
    setError(null);
    try {
      const response = await equipamentoService.getAll({ limit: s, offset });
      const data = response.data || [];
      const total = response.pagination?.total ?? data.length;
      setEquipamentos(data);
      setTotalCount(total);
      setCurrentPage(p);
      setPageSize(s);
      setLoading(false);
    } catch (err) {
      setError(`Erro ao carregar equipamentos: ${err.message}`);
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadEquipamentos();
    catalogoService.getRaridades().then(r => setRaridades(r.data || [])).catch(() => {});
    catalogoService.getCategoriasEquipamento().then(r => setCategorias(r.data || [])).catch(() => {});
  }, []);

  const filteredEquipamentos = useMemo(() => {
    let filtered = [...equipamentos];

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      filtered = filtered.filter(eq =>
        eq.nome?.toLowerCase().includes(termLower) ||
        eq.descricao?.toLowerCase().includes(termLower)
      );
    }

    if (categoriaFilter) {
      filtered = filtered.filter(eq => eq.categoria_rel?.nome === categoriaFilter);
    }

    if (raridadeFilter) {
      filtered = filtered.filter(eq => eq.raridade_rel?.nome === raridadeFilter);
    }

    return filtered;
  }, [equipamentos, searchTerm, categoriaFilter, raridadeFilter]);

  const handlePageChange = (newPage) => {
    loadEquipamentos(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    loadEquipamentos(1, newSize);
  };

  const handleDeleteClick = (row) => {
    setEquipToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipToDelete) return;
    setDeleteLoading(true);
    try {
      await equipamentoService.delete(equipToDelete.id);
      await loadEquipamentos();
      setShowDeleteModal(false);
      setEquipToDelete(null);
    } catch (err) {
      setDeleteError(`Erro ao deletar equipamento: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setEquipToDelete(null);
    setDeleteLoading(false);
  };

  const countByRaridade = (nome) => (equipamentos || []).filter(e => e.raridade_rel?.nome === nome).length;

  const displayEquipamentos = (filteredEquipamentos.length > 0 || searchTerm || categoriaFilter || raridadeFilter)
    ? filteredEquipamentos
    : equipamentos;

  const clearError = () => {
    setError(null);
    setDeleteError(null);
  };

  return {
    equipamentos,
    displayEquipamentos,
    loading,
    error: error || deleteError,
    searchTerm,
    categoriaFilter,
    raridadeFilter,
    currentPage,
    pageSize,
    totalCount,
    raridades,
    categorias,
    showDeleteModal,
    equipToDelete,
    deleteLoading,
    isLight,
    setSearchTerm,
    setCategoriaFilter,
    setRaridadeFilter,
    handlePageChange,
    handlePageSizeChange,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    countByRaridade,
    clearError,
    navigate,
    generateRoute,
  };
};
