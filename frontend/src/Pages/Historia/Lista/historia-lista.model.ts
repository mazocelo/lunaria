import { useState, useEffect, useMemo, useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index';
import { useHistoriaStore } from '../../../store/historia/index';
import { useAuth } from '../../../contexts/AuthContext';
import { historiaService } from '../../../services/index';
import { generateRoute } from '../../../constants/routes';
import type { Historia } from '../../../types/api';

export interface HistoriaComTemas extends Historia {
  temasNomes: unknown[];
}

interface UseHistoriaListaModelArgs {
  navigate: NavigateFunction;
}

export const useHistoriaListaModel = ({ navigate }: UseHistoriaListaModelArgs) => {
  const { user } = useAuth();

  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const mapearTemasDeHistoria = useTemaStore(s => s.mapearTemasDeHistoria);

  const historias = useHistoriaStore(s => s.historias);
  const loading = useHistoriaStore(s => s.loading);
  const storeError = useHistoriaStore(s => s.error);
  const recarregarHistorias = useHistoriaStore(s => s.recarregarHistorias);

  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<{
    tema: number | null;
    participantes: number | null;
    busca: string;
  }>({
    tema: null,
    participantes: null,
    busca: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [historiaToDelete, setHistoriaToDelete] = useState<Historia | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showConviteModal, setShowConviteModal] = useState(false);
  const [historiaParaConvite, setHistoriaParaConvite] = useState<Historia | null>(null);
  const [conviteLoading, setConviteLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [historiaToReset, setHistoriaToReset] = useState<Historia | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const [showEncerrarModal, setShowEncerrarModal] = useState(false);
  const [historiaToEncerrar, setHistoriaToEncerrar] = useState<Historia | null>(null);
  const [encerrarLoading, setEncerrarLoading] = useState(false);

  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<Array<number | string>>([]);
  const [bulkDeleteIgnoredCount, setBulkDeleteIgnoredCount] = useState(0);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    carregarTemas();
    recarregarHistorias();
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const historiasComTemas = useMemo<HistoriaComTemas[]>(() => {
    return historias.map(historia => ({
      ...historia,
      temasNomes: mapearTemasDeHistoria(historia)
    }));
  }, [historias, mapearTemasDeHistoria]);

  const estatisticas = useMemo(() => {
    const total = historias.length;
    const comTemas = historias.filter(h => h.temas && h.temas.length > 0).length;
    const totalParticipantes = historias.reduce((acc, h) => acc + (h.maximo_de_participantes || 0), 0);
    return {
      total,
      comTemas,
      totalParticipantes,
      mediaParticipantes: total > 0 ? Math.round(totalParticipantes / total) : 0
    };
  }, [historias]);

  const historiasFiltradasComTemas = useMemo(() => {
    let resultado = historiasComTemas;

    if (filtros.tema) {
      const temaFiltro = Number(filtros.tema);
      resultado = resultado.filter(h => Array.isArray(h.temas) && h.temas.includes(temaFiltro));
    }
    if (filtros.participantes) {
      resultado = resultado.filter(h => (h.maximo_de_participantes ?? 0) >= (filtros.participantes ?? 0));
    }
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(h =>
        h.nome.toLowerCase().includes(termo) ||
        (Array.isArray(h.temasNomes) && h.temasNomes.some(t => typeof t === 'string' && t.toLowerCase().includes(termo)))
      );
    }
    return resultado;
  }, [historiasComTemas, filtros]);

  const aplicarFiltros = useCallback((novosFiltros: Partial<typeof filtros>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  }, []);

  const getNomesTemas = useCallback((historia: Historia | null | undefined) => {
    if (!historia) return [];
    return mapearTemasDeHistoria(historia);
  }, [mapearTemasDeHistoria]);

  const isOwner = useCallback((historia: Historia | null | undefined) => {
    if (user && historia) {
      return String(historia.id_usuario) === String(user.id) || user.role === 'superadmin';
    }
    return false;
  }, [user]);

  const deleteHistoria = useCallback(async (id: number | string) => {
    await historiaService.delete(Number(id));
    await recarregarHistorias();
  }, [recarregarHistorias]);

  const handleDeleteClick = useCallback((historia: Historia) => {
    setHistoriaToDelete(historia);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!historiaToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteHistoria(historiaToDelete.id);
      setShowDeleteModal(false);
      setHistoriaToDelete(null);
    } catch (err) {
      console.error('Erro ao deletar historia:', err);
      const message = err instanceof Error ? err.message : 'Erro ao deletar história';
      setError(message);
    } finally {
      setDeleteLoading(false);
    }
  }, [historiaToDelete, deleteHistoria]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setHistoriaToDelete(null);
    setDeleteLoading(false);
  }, []);

  const handleViewHistoria = useCallback((historia: Historia) => {
    navigate(generateRoute.verHistoria(historia.id));
  }, [navigate]);

  const handlePlayHistoria = useCallback((historia: Historia) => {
    navigate(generateRoute.jogoSelecaoPersonagem(historia.id));
  }, [navigate]);

  const handleEntrarPartida = useCallback((historia: Historia) => {
    navigate(generateRoute.jogoSelecaoPersonagem(historia.id));
  }, [navigate]);

  const handleConviteClick = useCallback((historia: Historia) => {
    setHistoriaParaConvite(historia);
    setShowConviteModal(true);
  }, []);

  const handleEnviarConvite = useCallback(async (email: string) => {
    if (!historiaParaConvite) return;
    setConviteLoading(true);
    try {
      await historiaService.enviarConvite(historiaParaConvite.id, email);
      setShowConviteModal(false);
      setHistoriaParaConvite(null);
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      const message = err instanceof Error ? err.message : 'Erro ao enviar convite';
      setError(message);
    } finally {
      setConviteLoading(false);
    }
  }, [historiaParaConvite]);

  const handleCancelConvite = useCallback(() => {
    setShowConviteModal(false);
    setHistoriaParaConvite(null);
    setConviteLoading(false);
  }, []);

  const handleResetarSessao = useCallback((historia: Historia) => {
    setHistoriaToReset(historia);
    setShowResetModal(true);
  }, []);

  const handleConfirmReset = useCallback(async () => {
    if (!historiaToReset) return;
    setResetLoading(true);
    try {
      const response = await historiaService.resetarSessao(historiaToReset.id) as { success?: boolean; message?: string } | undefined;
      if (response && response.success) {
        await recarregarHistorias();
        setShowResetModal(false);
        setHistoriaToReset(null);
      } else {
        setError(response?.message || 'Erro ao resetar sessão');
        setShowResetModal(false);
        setHistoriaToReset(null);
      }
    } catch (err) {
      console.error('Erro ao resetar sessao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao resetar sessão';
      setError(message);
    } finally {
      setResetLoading(false);
    }
  }, [historiaToReset, recarregarHistorias]);

  const handleCancelReset = useCallback(() => {
    setShowResetModal(false);
    setHistoriaToReset(null);
    setResetLoading(false);
  }, []);

  const handleEncerrarSessao = useCallback((historia: Historia) => {
    setHistoriaToEncerrar(historia);
    setShowEncerrarModal(true);
  }, []);

  const handleConfirmEncerrar = useCallback(async () => {
    if (!historiaToEncerrar) return;
    setEncerrarLoading(true);
    try {
      const response = await historiaService.encerrarSessao(historiaToEncerrar.id) as { success?: boolean; message?: string } | undefined;
      if (response && response.success) {
        await recarregarHistorias();
        setShowEncerrarModal(false);
        setHistoriaToEncerrar(null);
      } else {
        setError(response?.message || 'Erro ao encerrar sessão');
        setShowEncerrarModal(false);
        setHistoriaToEncerrar(null);
      }
    } catch (err) {
      console.error('Erro ao encerrar sessao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao encerrar sessão';
      setError(message);
    } finally {
      setEncerrarLoading(false);
    }
  }, [historiaToEncerrar, recarregarHistorias]);

  const handleCancelEncerrar = useCallback(() => {
    setShowEncerrarModal(false);
    setHistoriaToEncerrar(null);
    setEncerrarLoading(false);
  }, []);

  const handleBulkDeleteClick = useCallback((ids: Array<number | string>) => {
    const idsDeletaveis = ids.filter((selectedId) => {
      const historia = historiasComTemas.find((item) => String(item.id) === String(selectedId));
      return historia ? isOwner(historia) : false;
    });
    const ignorados = ids.length - idsDeletaveis.length;

    if (idsDeletaveis.length === 0) {
      setError('Nenhuma das historias selecionadas pode ser deletada por voce.');
      return;
    }

    if (ignorados > 0) {
      setError(`${ignorados} historia(s) selecionada(s) foram ignoradas por falta de permissao.`);
    }

    setBulkDeleteIds(idsDeletaveis);
    setBulkDeleteIgnoredCount(ignorados);
    setShowBulkDeleteModal(true);
  }, [historiasComTemas, isOwner]);

  const handleConfirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const id of bulkDeleteIds) {
        await historiaService.delete(Number(id));
      }
      await recarregarHistorias();
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
      setBulkDeleteIgnoredCount(0);
    } catch (err) {
      console.error('Erro ao deletar historias em lote:', err);
      const message = err instanceof Error ? err.message : 'Erro ao deletar histórias em lote';
      setError(message);
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
      setBulkDeleteIgnoredCount(0);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [bulkDeleteIds, recarregarHistorias]);

  const handleCancelBulkDelete = useCallback(() => {
    setShowBulkDeleteModal(false);
    setBulkDeleteIds([]);
    setBulkDeleteIgnoredCount(0);
    setBulkDeleteLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    historias: historiasComTemas,
    historiasFiltradasComTemas,
    estatisticas,
    loading,
    error: error || storeError,

    aplicarFiltros,
    getNomesTemas,
    isOwner,

    showDeleteModal,
    historiaToDelete,
    deleteLoading,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,

    showConviteModal,
    historiaParaConvite,
    conviteLoading,
    handleConviteClick,
    handleEnviarConvite,
    handleCancelConvite,

    showResetModal,
    historiaToReset,
    resetLoading,
    handleResetarSessao,
    handleConfirmReset,
    handleCancelReset,

    showEncerrarModal,
    historiaToEncerrar,
    encerrarLoading,
    handleEncerrarSessao,
    handleConfirmEncerrar,
    handleCancelEncerrar,

    showBulkDeleteModal,
    bulkDeleteIds,
    bulkDeleteIgnoredCount,
    bulkDeleteLoading,
    handleBulkDeleteClick,
    handleConfirmBulkDelete,
    handleCancelBulkDelete,

    handleViewHistoria,
    handlePlayHistoria,
    handleEntrarPartida,

    clearError,
  };
};
