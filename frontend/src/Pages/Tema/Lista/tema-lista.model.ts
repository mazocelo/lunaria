import { useState, useEffect } from 'react';
import { useTemaStore } from '../../../store/tema';
import { temaService } from '../../../services/index';
import type { Tema } from '../../../store/tema/states';

export const useTemaListaModel = () => {
  const temas = useTemaStore(s => s.temas);
  const loading = useTemaStore(s => s.loading);
  const error = useTemaStore(s => s.error);
  const temasCarregados = useTemaStore(s => s.temasCarregados);
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [temaToDelete, setTemaToDelete] = useState<Tema | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!temasCarregados) carregarTemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = (row: Tema) => {
    setTemaToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!temaToDelete) return;
    setDeleteLoading(true);
    try {
      await temaService.delete(temaToDelete.id);
      await recarregarTemas();
      setShowDeleteModal(false);
      setTemaToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLocalError(`Erro ao deletar tema: ${message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTemaToDelete(null);
    setDeleteLoading(false);
  };

  const clearError = () => setLocalError(null);

  return {
    temas,
    loading,
    error: localError || error,
    showDeleteModal,
    temaToDelete,
    deleteLoading,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    clearError,
  };
};
