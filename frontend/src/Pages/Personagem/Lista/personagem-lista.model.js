import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonagemStore } from '../../../store/personagem/index.js';
import { personagemService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../constants/routes.js';

export const usePersonagemListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Personagem store
  const personagens = usePersonagemStore(s => s.personagens);
  const loading = usePersonagemStore(s => s.loading);
  const storeError = usePersonagemStore(s => s.error);
  const carregarPersonagens = usePersonagemStore(s => s.carregarPersonagens);
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);

  // Local state
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para delete individual
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personagemToDelete, setPersonagemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estado para bulk delete
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    carregarPersonagens();
  }, []);

  const filteredPersonagens = useMemo(() => {
    if (!searchTerm) return personagens;
    const term = searchTerm.toLowerCase();
    return personagens.filter(p =>
      p.nome?.toLowerCase().includes(term)
    );
  }, [personagens, searchTerm]);

  const estatisticas = useMemo(() => {
    const total = personagens.length;
    const guerreiros = personagens.filter(p => p.classe === 'Guerreiro').length;
    const magos = personagens.filter(p => p.classe === 'Mago').length;
    return { total, guerreiros, magos };
  }, [personagens]);

  const deletePersonagem = useCallback(async (id) => {
    await personagemService.delete(id);
    await recarregarPersonagens();
  }, [recarregarPersonagens]);

  // Handlers de delete individual
  const handleDeleteClick = useCallback((row) => {
    setPersonagemToDelete(row);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!personagemToDelete) return;
    setDeleteLoading(true);
    try {
      await deletePersonagem(personagemToDelete.id);
      setShowDeleteModal(false);
      setPersonagemToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar personagem:", err);
      setError(err.message || 'Erro ao deletar personagem');
    } finally {
      setDeleteLoading(false);
    }
  }, [personagemToDelete, deletePersonagem]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setPersonagemToDelete(null);
    setDeleteLoading(false);
  }, []);

  // Handlers de bulk delete
  const handleBulkDeleteClick = useCallback((ids) => {
    setBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const id of bulkDeleteIds) {
        await personagemService.delete(id);
      }
      await recarregarPersonagens();
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
    } catch (err) {
      console.error('Erro ao deletar personagens em lote:', err);
      setError(err.message || 'Erro ao deletar personagens em lote');
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [bulkDeleteIds, recarregarPersonagens]);

  const handleCancelBulkDelete = useCallback(() => {
    setShowBulkDeleteModal(false);
    setBulkDeleteIds([]);
    setBulkDeleteLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    personagens: filteredPersonagens,
    allPersonagens: personagens,
    loading,
    error: error || storeError,
    isLight,
    estatisticas,
    buscarPersonagens: setSearchTerm,
    clearError,
    navigate,
    generateRoute,
    // Delete individual
    showDeleteModal,
    personagemToDelete,
    deleteLoading,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    // Bulk delete
    showBulkDeleteModal,
    bulkDeleteIds,
    bulkDeleteLoading,
    handleBulkDeleteClick,
    handleConfirmBulkDelete,
    handleCancelBulkDelete,
  };
};
