import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersonagemStore } from '../../../store/personagem/index';
import { personagemService } from '../../../services/index';
import type { Personagem } from '../../../models/Personagem';

interface UsePersonagemListaModelParams {
  navigate?: (path: string) => void;
}

export const usePersonagemListaModel = ({ navigate }: UsePersonagemListaModelParams = {}) => {

  // Personagem store
  const personagens = usePersonagemStore(s => s.personagens);
  const loading = usePersonagemStore(s => s.loading);
  const storeError = usePersonagemStore(s => s.error);
  const carregarPersonagens = usePersonagemStore(s => s.carregarPersonagens);
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);

  // Local state
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para delete individual
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personagemToDelete, setPersonagemToDelete] = useState<Personagem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estado para bulk delete
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<Array<number | string>>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    carregarPersonagens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const deletePersonagem = useCallback(async (id: number | string) => {
    await personagemService.delete(Number(id));
    await recarregarPersonagens();
  }, [recarregarPersonagens]);

  // Handlers de delete individual
  const handleDeleteClick = useCallback((row: Personagem) => {
    setPersonagemToDelete(row);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!personagemToDelete || personagemToDelete.id == null) return;
    setDeleteLoading(true);
    try {
      await deletePersonagem(personagemToDelete.id);
      setShowDeleteModal(false);
      setPersonagemToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar personagem:", err);
      const message = err instanceof Error ? err.message : 'Erro ao deletar personagem';
      setError(message);
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
  const handleBulkDeleteClick = useCallback((ids: Array<number | string>) => {
    setBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const id of bulkDeleteIds) {
        await personagemService.delete(Number(id));
      }
      await recarregarPersonagens();
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
    } catch (err) {
      console.error('Erro ao deletar personagens em lote:', err);
      const message = err instanceof Error ? err.message : 'Erro ao deletar personagens em lote';
      setError(message);
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
    estatisticas,
    buscarPersonagens: setSearchTerm,
    clearError,
    navigate,
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

export type PersonagemListaModel = ReturnType<typeof usePersonagemListaModel>;
