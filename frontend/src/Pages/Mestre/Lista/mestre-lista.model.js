import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMestreStore } from '../../../store/mestre';
import { mestreService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

export const useMestreListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const mestres = useMestreStore(s => s.mestresAtivos);
  const loading = useMestreStore(s => s.loading);
  const error = useMestreStore(s => s.error);
  const mestresCarregados = useMestreStore(s => s.mestresCarregados);
  const carregarMestres = useMestreStore(s => s.carregarMestres);
  const recarregarMestres = useMestreStore(s => s.recarregarMestres);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mestreToDelete, setMestreToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!mestresCarregados) carregarMestres();
  }, []);

  const filteredMestres = useMemo(() => {
    if (!searchTerm) return mestres;
    const term = searchTerm.toLowerCase();
    return mestres.filter(m =>
      m.nome?.toLowerCase().includes(term) ||
      m.modelo?.toLowerCase().includes(term) ||
      m.tom_narrativo?.toLowerCase().includes(term)
    );
  }, [mestres, searchTerm]);

  const deleteMestre = async (id) => {
    try {
      await mestreService.delete(id);
      await recarregarMestres();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao deletar mestre: ${err.message}`);
      return { success: false };
    }
  };

  const handleDeleteClick = (mestre) => {
    setMestreToDelete(mestre);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!mestreToDelete) return;
    setDeleteLoading(true);
    const result = await deleteMestre(mestreToDelete.id);
    if (result.success) {
      setShowDeleteModal(false);
      setMestreToDelete(null);
    }
    setDeleteLoading(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMestreToDelete(null);
    setDeleteLoading(false);
  };

  const clearError = () => {
    setLocalError(null);
    useMestreStore.setState({ error: null });
  };

  return {
    mestres,
    filteredMestres,
    loading,
    error: localError || error,
    isLight,
    showDeleteModal,
    mestreToDelete,
    deleteLoading,
    buscarMestres: setSearchTerm,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    clearError,
    navigate,
    generateRoute,
  };
};
