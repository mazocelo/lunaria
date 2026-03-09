import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index.js';
import { useMestreStore } from '../../../store/mestre/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { historiaService } from '../../../services/index.js';
import { sessaoService } from '../../../services/index.js';

export const useHistoriaVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Tema store
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const mapearTemasDeHistoria = useTemaStore(s => s.mapearTemasDeHistoria);

  // Mestre store
  const mestresAtivos = useMestreStore(s => s.mestresAtivos);
  const carregarMestres = useMestreStore(s => s.carregarMestres);

  // State
  const [historiaAtual, setHistoriaAtual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mestre editing
  const [editandoMestre, setEditandoMestre] = useState(false);
  const [mestreSelecionadoId, setMestreSelecionadoId] = useState(null);
  const [salvandoMestre, setSalvandoMestre] = useState(false);

  // Sessoes anteriores
  const [sessoes, setSessoes] = useState([]);
  const [loadingSessoes, setLoadingSessoes] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Carregar historia
  const loadHistoria = useCallback(async (historiaId) => {
    setLoading(true);
    setError(null);
    try {
      await carregarTemas();
      await carregarMestres();
      const historia = await historiaService.getById(historiaId);
      setHistoriaAtual(historia);
    } catch (err) {
      console.error('Erro ao carregar historia:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [carregarTemas, carregarMestres]);

  useEffect(() => {
    if (id) {
      loadHistoria(parseInt(id));
      // Carregar sessoes anteriores
      setLoadingSessoes(true);
      sessaoService.getSessoesByHistoria(id)
        .then(data => setSessoes(data || []))
        .catch(() => setSessoes([]))
        .finally(() => setLoadingSessoes(false));
    }
    return () => setError(null);
  }, [id]);

  // Obter nomes dos temas
  const getNomesTemas = useCallback((historia) => {
    if (!historia) return [];
    return mapearTemasDeHistoria(historia);
  }, [mapearTemasDeHistoria]);

  const nomesTemas = historiaAtual ? getNomesTemas(historiaAtual) : [];

  // Obter nome do mestre
  const getMestreNome = useCallback((historia) => {
    if (!historia) return 'Mestre Padrao';
    if (historia.mestre?.nome) return historia.mestre.nome;
    if (historia.mestres?.nome) return historia.mestres.nome;
    return 'Mestre Padrao';
  }, []);

  // Atualizar mestre
  const handleSalvarMestre = useCallback(async () => {
    if (!historiaAtual) return;
    setSalvandoMestre(true);
    try {
      await historiaService.update(historiaAtual.id, { mestre_id: mestreSelecionadoId });
      await loadHistoria(historiaAtual.id);
      setEditandoMestre(false);
    } catch (_) {
      // Error handled silently
    }
    setSalvandoMestre(false);
  }, [historiaAtual, mestreSelecionadoId, loadHistoria]);

  const handleEditarMestre = useCallback(() => {
    if (historiaAtual) {
      setMestreSelecionadoId(historiaAtual.mestre_id || historiaAtual.mestres?.id || null);
      setEditandoMestre(true);
    }
  }, [historiaAtual]);

  const handleCancelarEditarMestre = useCallback(() => {
    setEditandoMestre(false);
  }, []);

  const handleMestreSelecionadoChange = useCallback((e) => {
    setMestreSelecionadoId(e.target.value ? parseInt(e.target.value) : null);
  }, []);

  // Abrir historico de sessao
  const abrirHistorico = useCallback(async (sessao) => {
    setLoadingHistorico(true);
    try {
      const completa = await sessaoService.getSessaoHistorico(sessao.id);
      setSessaoSelecionada(completa);
    } catch (err) {
      console.error('Erro ao carregar historico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  const fecharHistorico = useCallback(() => {
    setSessaoSelecionada(null);
  }, []);

  // Formatar data de sessao
  const formatSessaoDate = useCallback((dateStr) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }, []);

  // Navegacao
  const handleIniciarSessao = useCallback(() => {
    if (historiaAtual) {
      navigate(`/jogo/${historiaAtual.id}/selecao-personagem`);
    }
  }, [historiaAtual, navigate]);

  const handleVoltar = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return {
    // Data
    historiaAtual,
    loading,
    error,
    isLight,
    nomesTemas,

    // Mestre
    mestresAtivos,
    editandoMestre,
    mestreSelecionadoId,
    salvandoMestre,
    getMestreNome,
    handleSalvarMestre,
    handleEditarMestre,
    handleCancelarEditarMestre,
    handleMestreSelecionadoChange,

    // Sessoes
    sessoes,
    loadingSessoes,
    sessaoSelecionada,
    loadingHistorico,
    abrirHistorico,
    fecharHistorico,
    formatSessaoDate,

    // Navegacao
    handleIniciarSessao,
    handleVoltar,

    // Utils
    clearError,
  };
};
