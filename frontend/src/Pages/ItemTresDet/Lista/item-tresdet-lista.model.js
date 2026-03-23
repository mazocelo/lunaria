import { useState, useEffect, useMemo } from 'react';
import { useItemTresDetStore } from '../../../store/itemTresDet/index.js';
import { itemTresDetService } from '../../../services/index.js';

const TIPOS_OPTIONS = [
  { value: 'arma', label: 'Arma' },
  { value: 'armadura', label: 'Armadura' },
  { value: 'acessorio', label: 'Acessorio' },
  { value: 'consumivel', label: 'Consumivel' },
  { value: 'pergaminho', label: 'Pergaminho' },
  { value: 'mecha', label: 'Mecha' },
];

const RARIDADE_OPTIONS = [
  { value: 'comum', label: 'Comum' },
  { value: 'incomum', label: 'Incomum' },
  { value: 'raro', label: 'Raro' },
  { value: 'lendario', label: 'Lendario' },
  { value: 'variavel', label: 'Variavel' },
];

export const useItemTresDetListaModel = () => {
  const allItens = useItemTresDetStore(s => s.itens);
  const storeLoading = useItemTresDetStore(s => s.loading);
  const storeError = useItemTresDetStore(s => s.error);
  const carregarItens = useItemTresDetStore(s => s.carregarItens);
  const recarregarItens = useItemTresDetStore(s => s.recarregarItens);

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [raridadeFilter, setRaridadeFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    carregarItens();
  }, []);

  const filteredItens = useMemo(() => {
    let filtered = [...allItens];

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.nome?.toLowerCase().includes(termLower) ||
        item.descricao?.toLowerCase().includes(termLower)
      );
    }

    if (tipoFilter) {
      filtered = filtered.filter(item => item.tipo === tipoFilter);
    }

    if (raridadeFilter) {
      filtered = filtered.filter(item => item.raridade === raridadeFilter);
    }

    return filtered;
  }, [allItens, searchTerm, tipoFilter, raridadeFilter]);

  const handleDeleteClick = (row) => {
    setItemToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await itemTresDetService.delete(itemToDelete.id);
      await recarregarItens();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      setDeleteError(`Erro ao deletar item: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteLoading(false);
  };

  const countByTipo = (tipo) => (allItens || []).filter(i => i.tipo === tipo).length;

  const clearError = () => setDeleteError(null);

  return {
    itens: allItens,
    displayItens: filteredItens,
    loading: storeLoading,
    error: deleteError || storeError,
    searchTerm,
    tipoFilter,
    raridadeFilter,
    tiposOptions: TIPOS_OPTIONS,
    raridadeOptions: RARIDADE_OPTIONS,
    showDeleteModal,
    itemToDelete,
    deleteLoading,
    setSearchTerm,
    setTipoFilter,
    setRaridadeFilter,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    countByTipo,
    clearError,
  };
};
