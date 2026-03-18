import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index.js';
import { useHistoriaStore } from '../../../store/historia/index.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useTheme } from '../../../contexts/theme.jsx';
import { historiaService } from '../../../services/index.js';
import { ROUTES, generateRoute } from '../../../constants/routes.js';

export const useHistoriaListaModel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Tema store
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const mapearTemasDeHistoria = useTemaStore(s => s.mapearTemasDeHistoria);

  // Historia store
  const historias = useHistoriaStore(s => s.historias);
  const loading = useHistoriaStore(s => s.loading);
  const storeError = useHistoriaStore(s => s.error);
  const carregarHistorias = useHistoriaStore(s => s.carregarHistorias);
  const recarregarHistorias = useHistoriaStore(s => s.recarregarHistorias);

  // Local state
  const [error, setError] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    tema: null,
    participantes: null,
    busca: ''
  });

  // Modal de delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [historiaToDelete, setHistoriaToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal de convite
  const [showConviteModal, setShowConviteModal] = useState(false);
  const [historiaParaConvite, setHistoriaParaConvite] = useState(null);
  const [conviteLoading, setConviteLoading] = useState(false);

  // Modal de reset de sessao
  const [showResetModal, setShowResetModal] = useState(false);
  const [historiaToReset, setHistoriaToReset] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Modal de encerrar sessao
  const [showEncerrarModal, setShowEncerrarModal] = useState(false);
  const [historiaToEncerrar, setHistoriaToEncerrar] = useState(null);
  const [encerrarLoading, setEncerrarLoading] = useState(false);

  // Bulk delete
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
  const [bulkDeleteIgnoredCount, setBulkDeleteIgnoredCount] = useState(0);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Carregar historias do store (forceReload para refletir mudanças de sessão)
  useEffect(() => {
    carregarTemas();
    recarregarHistorias();
    return () => setError(null);
  }, []);

  // Historias com temas mapeados
  const historiasComTemas = useMemo(() => {
    return historias.map(historia => ({
      ...historia,
      temasNomes: mapearTemasDeHistoria(historia)
    }));
  }, [historias, mapearTemasDeHistoria]);

  // Estatisticas
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

  // Historias filtradas
  const historiasFiltradasComTemas = useMemo(() => {
    let resultado = historiasComTemas;

    if (filtros.tema) {
      const temaFiltro = Number(filtros.tema);
      resultado = resultado.filter(h => Array.isArray(h.temas) && h.temas.includes(temaFiltro));
    }
    if (filtros.participantes) {
      resultado = resultado.filter(h => h.maximo_de_participantes >= filtros.participantes);
    }
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(h =>
        h.nome.toLowerCase().includes(termo) ||
        (h.temasNomes && h.temasNomes.some(t => t.toLowerCase().includes(termo)))
      );
    }
    return resultado;
  }, [historiasComTemas, filtros]);

  // Aplicar filtros
  const aplicarFiltros = useCallback((novosFiltros) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  }, []);

  // Obter nomes dos temas de uma historia
  const getNomesTemas = useCallback((historia) => {
    if (!historia) return [];
    return mapearTemasDeHistoria(historia);
  }, [mapearTemasDeHistoria]);

  // Verificar se usuario e dono da historia
  const isOwner = useCallback((historia) => {
    if (user && historia) {
      return String(historia.id_usuario) === String(user.id) || user.role === 'superadmin';
    }
    return false;
  }, [user]);

  // Delete
  const deleteHistoria = useCallback(async (id) => {
    await historiaService.delete(id);
    await recarregarHistorias();
  }, [recarregarHistorias]);

  const handleDeleteClick = useCallback((historia) => {
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
      setError(err.message || 'Erro ao deletar história');
    } finally {
      setDeleteLoading(false);
    }
  }, [historiaToDelete, deleteHistoria]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setHistoriaToDelete(null);
    setDeleteLoading(false);
  }, []);

  // Navegacao
  const handleViewHistoria = useCallback((historia) => {
    navigate(generateRoute.verHistoria(historia.id));
  }, [navigate]);

  const handlePlayHistoria = useCallback((historia) => {
    navigate(generateRoute.jogoSelecaoPersonagem(historia.id));
  }, [navigate]);

  const handleEntrarPartida = useCallback((historia) => {
    navigate(generateRoute.jogoSelecaoPersonagem(historia.id));
  }, [navigate]);

  // Convite
  const handleConviteClick = useCallback((historia) => {
    setHistoriaParaConvite(historia);
    setShowConviteModal(true);
  }, []);

  const handleEnviarConvite = useCallback(async (email) => {
    if (!historiaParaConvite) return;
    setConviteLoading(true);
    try {
      await historiaService.enviarConvite(historiaParaConvite.id, email);
      setShowConviteModal(false);
      setHistoriaParaConvite(null);
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      setError(err.message || 'Erro ao enviar convite');
    } finally {
      setConviteLoading(false);
    }
  }, [historiaParaConvite]);

  const handleCancelConvite = useCallback(() => {
    setShowConviteModal(false);
    setHistoriaParaConvite(null);
    setConviteLoading(false);
  }, []);

  // Reset sessao
  const handleResetarSessao = useCallback((historia) => {
    setHistoriaToReset(historia);
    setShowResetModal(true);
  }, []);

  const handleConfirmReset = useCallback(async () => {
    if (!historiaToReset) return;
    setResetLoading(true);
    try {
      const response = await historiaService.resetarSessao(historiaToReset.id);
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
      setError(err.message || 'Erro ao resetar sessão');
    } finally {
      setResetLoading(false);
    }
  }, [historiaToReset, recarregarHistorias]);

  const handleCancelReset = useCallback(() => {
    setShowResetModal(false);
    setHistoriaToReset(null);
    setResetLoading(false);
  }, []);

  // Encerrar sessao
  const handleEncerrarSessao = useCallback((historia) => {
    setHistoriaToEncerrar(historia);
    setShowEncerrarModal(true);
  }, []);

  const handleConfirmEncerrar = useCallback(async () => {
    if (!historiaToEncerrar) return;
    setEncerrarLoading(true);
    try {
      const response = await historiaService.encerrarSessao(historiaToEncerrar.id);
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
      setError(err.message || 'Erro ao encerrar sessão');
    } finally {
      setEncerrarLoading(false);
    }
  }, [historiaToEncerrar, recarregarHistorias]);

  const handleCancelEncerrar = useCallback(() => {
    setShowEncerrarModal(false);
    setHistoriaToEncerrar(null);
    setEncerrarLoading(false);
  }, []);

  // Bulk delete
  const handleBulkDeleteClick = useCallback((ids) => {
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
        await historiaService.delete(id);
      }
      await recarregarHistorias();
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
      setBulkDeleteIgnoredCount(0);
    } catch (err) {
      console.error('Erro ao deletar historias em lote:', err);
      setError(err.message || 'Erro ao deletar histórias em lote');
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
    // Data
    historias: historiasComTemas,
    historiasFiltradasComTemas,
    estatisticas,
    loading,
    error: error || storeError,
    isLight,

    // Filtros
    aplicarFiltros,
    getNomesTemas,
    isOwner,

    // Delete
    showDeleteModal,
    historiaToDelete,
    deleteLoading,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,

    // Convite
    showConviteModal,
    historiaParaConvite,
    conviteLoading,
    handleConviteClick,
    handleEnviarConvite,
    handleCancelConvite,

    // Reset sessao
    showResetModal,
    historiaToReset,
    resetLoading,
    handleResetarSessao,
    handleConfirmReset,
    handleCancelReset,

    // Encerrar sessao
    showEncerrarModal,
    historiaToEncerrar,
    encerrarLoading,
    handleEncerrarSessao,
    handleConfirmEncerrar,
    handleCancelEncerrar,

    // Bulk delete
    showBulkDeleteModal,
    bulkDeleteIds,
    bulkDeleteIgnoredCount,
    bulkDeleteLoading,
    handleBulkDeleteClick,
    handleConfirmBulkDelete,
    handleCancelBulkDelete,

    // Navegacao
    handleViewHistoria,
    handlePlayHistoria,
    handleEntrarPartida,

    // Utils
    clearError,
    ROUTES,
  };
};
