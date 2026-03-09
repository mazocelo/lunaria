import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { personagemService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

export const usePersonagemListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [personagens, setPersonagens] = useState([]);
  const [loading, setLoading] = useState(false);
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
    loadPersonagens();
  }, []);

  const loadPersonagens = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await personagemService.getAll();
      setPersonagens(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const deletePersonagem = async (id) => {
    setLoading(true);
    try {
      await personagemService.delete(id);
      setPersonagens(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
  }, [personagemToDelete]);

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
        await deletePersonagem(id);
      }
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
    } catch (err) {
      console.error('Erro ao deletar personagens em lote:', err);
      setError(err.message || 'Erro ao deletar personagens em lote');
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [bulkDeleteIds]);

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
    error,
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
