import { useState, useEffect, useMemo } from 'react';
import { useMagiasTresDetStore } from '../../../store/magiasTresDet';
import { magiasTresDetService } from '../../../services/index.js';

// A coluna `escola` da API e texto livre composto (ex.: "Branca Elemental (agua)",
// "Branca ou Negra"). Uma magia pode pertencer a mais de uma escola base.
// Os parenteticos sao elementos (agua/ar/fogo/terra/espirito/todas), nao escolas.
export const ESCOLAS_BASE = ['branca', 'negra', 'elemental'];

const normalizarEscolas = (escola) => {
  if (!escola) return [];
  const semParenteses = escola.toLowerCase().replace(/\([^)]*\)/g, ' ');
  return ESCOLAS_BASE.filter(e => semParenteses.includes(e));
};

export const useMagiaTresDetListaModel = () => {
  const magiasRaw = useMagiasTresDetStore(s => s.magias);
  const loading = useMagiasTresDetStore(s => s.loading);
  const storeError = useMagiasTresDetStore(s => s.error);
  const magiasCarregadas = useMagiasTresDetStore(s => s.magiasCarregadas);
  const carregarMagias = useMagiasTresDetStore(s => s.carregarMagias);
  const recarregarMagias = useMagiasTresDetStore(s => s.recarregarMagias);
  const total = useMagiasTresDetStore(s => s.total);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEscola, setFiltroEscola] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [magiaToDelete, setMagiaToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!magiasCarregadas) carregarMagias();
  }, []);

  const magias = useMemo(
    () => (magiasRaw || []).map(m => ({
      ...m,
      escolasNormalizadas: normalizarEscolas(m.escola),
    })),
    [magiasRaw]
  );

  const filteredMagias = useMemo(() => {
    let result = magias;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.nome?.toLowerCase().includes(term) ||
        m.descricao?.toLowerCase().includes(term)
      );
    }
    if (filtroEscola) {
      result = result.filter(m => m.escolasNormalizadas.includes(filtroEscola));
    }
    if (filtroTipo) {
      result = result.filter(m => m.tipo === filtroTipo);
    }
    return result;
  }, [magias, searchTerm, filtroEscola, filtroTipo]);

  const stats = useMemo(() => {
    const escolas = {};
    const tipos = {};
    magias.forEach(m => {
      m.escolasNormalizadas.forEach(e => {
        escolas[e] = (escolas[e] || 0) + 1;
      });
      if (m.tipo) tipos[m.tipo] = (tipos[m.tipo] || 0) + 1;
    });
    return { escolas, tipos };
  }, [magias]);

  const handleDeleteClick = (row) => {
    setMagiaToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!magiaToDelete) return;
    setDeleteLoading(true);
    try {
      await magiasTresDetService.delete(magiaToDelete.id);
      await recarregarMagias();
      setShowDeleteModal(false);
      setMagiaToDelete(null);
    } catch (err) {
      setLocalError(`Erro ao deletar magia: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMagiaToDelete(null);
    setDeleteLoading(false);
  };

  const clearError = () => setLocalError(null);

  return {
    magias,
    filteredMagias,
    loading,
    error: localError || storeError,
    searchTerm,
    filtroEscola,
    filtroTipo,
    total,
    stats,
    showDeleteModal,
    magiaToDelete,
    deleteLoading,
    setSearchTerm,
    setFiltroEscola,
    setFiltroTipo,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    clearError,
  };
};
