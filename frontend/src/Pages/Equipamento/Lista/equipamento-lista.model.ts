import { useState, useEffect, useMemo } from 'react';
import { useEquipamentoStore } from '../../../store/equipamento/index';
import { equipamentoService, catalogoService } from '../../../services/index';
import type { VantagemDesvantagem } from '../../../types/api';

export interface EquipamentoRel { id: number; nome: string }

export interface Equipamento extends VantagemDesvantagem {
  raridade_rel?: EquipamentoRel | null;
  categoria_rel?: EquipamentoRel | null;
  raridade_id?: number | null;
  categoria_id?: number | null;
  origem_lore?: string | null;
  vinculo?: {
    requer?: boolean;
    restricao_tipo?: string | null;
    restricao?: string[] | null;
    descricao?: string | null;
  } | null;
  propriedades?: string[] | null;
  cargas?: number | null;
  usos_por_dia?: number | null;
  numero?: number | null;
  peso?: number | null;
  preco_sugerido?: string | null;
}

export const useEquipamentoListaModel = () => {
  const allEquipamentos = useEquipamentoStore(s => s.equipamentos) as Equipamento[];
  const storeLoading = useEquipamentoStore(s => s.loading);
  const storeError = useEquipamentoStore(s => s.error);
  const carregarEquipamentos = useEquipamentoStore(s => s.carregarEquipamentos);
  const recarregarEquipamentos = useEquipamentoStore(s => s.recarregarEquipamentos);

  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [raridadeFilter, setRaridadeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [raridades, setRaridades] = useState<EquipamentoRel[]>([]);
  const [categorias, setCategorias] = useState<EquipamentoRel[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipToDelete, setEquipToDelete] = useState<Equipamento | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    carregarEquipamentos();
    catalogoService.getRaridades()
      .then((r) => setRaridades(((r as { data?: EquipamentoRel[] }).data) || []))
      .catch(() => {});
    catalogoService.getCategoriasEquipamento()
      .then((r) => setCategorias(((r as { data?: EquipamentoRel[] }).data) || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const paginatedEquipamentos = useMemo(() => {
    if (hasFilters) return filteredEquipamentos;
    const start = (currentPage - 1) * pageSize;
    return allEquipamentos.slice(start, start + pageSize);
  }, [allEquipamentos, filteredEquipamentos, hasFilters, currentPage, pageSize]);

  const totalCount = hasFilters ? filteredEquipamentos.length : allEquipamentos.length;

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleDeleteClick = (row: Equipamento) => {
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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setDeleteError(`Erro ao deletar equipamento: ${message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setEquipToDelete(null);
    setDeleteLoading(false);
  };

  const countByRaridade = (nome: string) =>
    (allEquipamentos || []).filter(e => e.raridade_rel?.nome === nome).length;

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
