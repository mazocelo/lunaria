import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEquipamentoStore } from '../../../store/equipamento/index.js';
import { equipamentoService, catalogoService } from '../../../services/index.js';

export const useEquipamentoListaModel = () => {

  // Equipamento store
  const allEquipamentos = useEquipamentoStore(s => s.equipamentos);
  const storeLoading = useEquipamentoStore(s => s.loading);
  const storeError = useEquipamentoStore(s => s.error);
  const carregarEquipamentos = useEquipamentoStore(s => s.carregarEquipamentos);
  const recarregarEquipamentos = useEquipamentoStore(s => s.recarregarEquipamentos);

  // Local state
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [raridadeFilter, setRaridadeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [raridades, setRaridades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipToDelete, setEquipToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    carregarEquipamentos();
    catalogoService.getRaridades().then(r => setRaridades(r.data || [])).catch(() => {});
    catalogoService.getCategoriasEquipamento().then(r => setCategorias(r.data || [])).catch(() => {});
  }, []);

  const hasFilters = !!(searchTerm || categoriaFilter || raridadeFilter);

  const filteredEquipamentos = useMemo(() => {
    let filtered = [...allEquipamentos];

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
  }, [allEquipamentos, searchTerm, categoriaFilter, raridadeFilter]);

  // Paginated view of data
  const paginatedEquipamentos = useMemo(() => {
    if (hasFilters) return filteredEquipamentos;
    const start = (currentPage - 1) * pageSize;
    return allEquipamentos.slice(start, start + pageSize);
  }, [allEquipamentos, filteredEquipamentos, hasFilters, currentPage, pageSize]);

  const totalCount = hasFilters ? filteredEquipamentos.length : allEquipamentos.length;

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
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
      await recarregarEquipamentos();
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

  const countByRaridade = (nome) => (allEquipamentos || []).filter(e => e.raridade_rel?.nome === nome).length;

  const clearError = () => {
    setError(null);
    setDeleteError(null);
  };

  return {
    equipamentos: allEquipamentos,
    displayEquipamentos: paginatedEquipamentos,
    loading: storeLoading,
    error: error || deleteError || storeError,
    searchTerm,
    categoriaFilter,
    raridadeFilter,
    currentPage: hasFilters ? undefined : currentPage,
    pageSize: hasFilters ? undefined : pageSize,
    totalCount: hasFilters ? undefined : totalCount,
    raridades,
    categorias,
    showDeleteModal,
    equipToDelete,
    deleteLoading,
    setSearchTerm,
    setCategoriaFilter,
    setRaridadeFilter,
    handlePageChange: hasFilters ? undefined : handlePageChange,
    handlePageSizeChange: hasFilters ? undefined : handlePageSizeChange,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    countByRaridade,
    clearError,
  };
};
