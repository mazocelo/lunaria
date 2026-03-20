import { useState, useEffect } from 'react';
import { useTemaStore } from '../../../store/tema';
import { temaService } from '../../../services/index.js';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS dos temas vive aqui.
 */
export const useTemaListaModel = () => {
  const temas = useTemaStore(s => s.temas);
  const loading = useTemaStore(s => s.loading);
  const error = useTemaStore(s => s.error);
  const temasCarregados = useTemaStore(s => s.temasCarregados);
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const recarregarTemas = useTemaStore(s => s.recarregarTemas);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [temaToDelete, setTemaToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!temasCarregados) carregarTemas();
  }, []);

  const handleDeleteClick = (row) => {
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
      setLocalError(`Erro ao deletar tema: ${err.message}`);
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
