import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index.js';
import { useMestreStore } from '../../../store/mestre/index.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { historiaService } from '../../../services/index.js';
import { sessaoService } from '../../../services/index.js';
import { apiClient } from '../../../services/ApiClient.js';
import { useTTS } from '../../../hooks/useTTS.js';
import { mergeHistoriaConfig, resolveHistoriaConfig } from '../../../utils/historiaConfig.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

const PROVIDER_LABELS = {
  elevenlabs: 'ElevenLabs',
  cartesia: 'Cartesia',
  opensource: 'Open Source',
};

export const ESTILOS_IMAGEM = [
  { value: 'fantasy_painting', label: 'Fantasy Painting' },
  { value: 'anime', label: 'Anime / Manga' },
  { value: 'realistic', label: 'Realista' },
  { value: 'dark_gothic', label: 'Dark / Gótico' },
  { value: 'watercolor', label: 'Aquarela' },
  { value: 'pixel_art', label: 'Pixel Art' },
  { value: 'comic_book', label: 'Comic Book' },
];

export const MODOS_ABERTURA = [
  { value: 'direto', label: 'Direto', desc: 'Entra na cena principal imediatamente' },
  { value: 'transicao_personalizada', label: 'Transição personalizada', desc: 'Faz uma costura breve explicando como o personagem chegou até a cena' },
];

export const MODOS_ROTEIRO = [
  { value: 'darker', label: 'Sombrio', desc: 'Moral ambígua, tragédia' },
  { value: 'exploration', label: 'Exploração', desc: 'Segredos, dungeons, puzzles' },
  { value: 'intrigue', label: 'Intriga', desc: 'Traição, espionagem' },
  { value: 'political', label: 'Político', desc: 'Facções, poder, diplomacia' },
];

export const useHistoriaVerModel = ({ navigate } = {}) => {
  const { id } = useParams();
  const { user } = useAuth();
  const tts = useTTS();

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

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Mestre editing
  const [editandoMestre, setEditandoMestre] = useState(false);
  const [mestreSelecionadoId, setMestreSelecionadoId] = useState(null);
  const [salvandoMestre, setSalvandoMestre] = useState(false);

  // Voice preview
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [playingMestreId, setPlayingMestreId] = useState(null);
  const previewAudioRef = useRef(null);
  const previewUrlRef = useRef(null);

  // Sessoes anteriores
  const [sessoes, setSessoes] = useState([]);
  const [loadingSessoes, setLoadingSessoes] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Roteiro (Story Blueprint)
  const [roteiro, setRoteiro] = useState(null);
  const [roteiroStatus, setRoteiroStatus] = useState(null);
  const [roteiroLoading, setRoteiroLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [versoes, setVersoes] = useState([]);
  const [versoesOpen, setVersoesOpen] = useState(false);
  const [versoesLoading, setVersoesLoading] = useState(false);
  const roteiroPollRef = useRef(null);
  const roteiroTimeoutRef = useRef(null);

  // Comparacao de versoes
  const [versaoComparacao, setVersaoComparacao] = useState(null);
  const [metadadosComparacao, setMetadadosComparacao] = useState(null);
  const [loadingComparacao, setLoadingComparacao] = useState(false);
  const [comparacaoOpen, setComparacaoOpen] = useState(false);

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
      loadRoteiro(parseInt(id));
      // Carregar sessoes anteriores
      setLoadingSessoes(true);
      sessaoService.getSessoesByHistoria(id)
        .then(data => setSessoes(data || []))
        .catch(() => setSessoes([]))
        .finally(() => setLoadingSessoes(false));
    }
    return () => { setError(null); stopRoteiroPoll(); };
  }, [id]);

  // Obter nomes dos temas
  const getNomesTemas = useCallback((historia) => {
    if (!historia) return [];
    return mapearTemasDeHistoria(historia);
  }, [mapearTemasDeHistoria]);

  const nomesTemas = historiaAtual ? getNomesTemas(historiaAtual) : [];
  const canMutateHistoria = Boolean(
    user &&
    historiaAtual &&
    (
      String(historiaAtual.id_usuario) === String(user.id) ||
      user.role === 'superadmin'
    )
  );

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
    } catch (err) {
      console.error('Erro ao salvar mestre:', err);
      setError(err.message || 'Erro ao salvar mestre');
    } finally {
      setSalvandoMestre(false);
    }
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
      setError(err.message || 'Erro ao carregar histórico da sessão');
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

  // Helpers de polling (sem useCallback para evitar dependência circular)
  function stopRoteiroPoll() {
    if (roteiroPollRef.current) { clearInterval(roteiroPollRef.current); roteiroPollRef.current = null; }
    if (roteiroTimeoutRef.current) { clearTimeout(roteiroTimeoutRef.current); roteiroTimeoutRef.current = null; }
  }

  function startRoteiroPoll(historiaId) {
    stopRoteiroPoll();
    setRoteiroLoading(true);
    roteiroPollRef.current = setInterval(async () => {
      try {
        const updated = await historiaService.getRoteiro(historiaId);
        if (!['queued', 'generating'].includes(updated.roteiro_status)) {
          stopRoteiroPoll();
          setRoteiro(updated.roteiro || null);
          setRoteiroStatus(updated.roteiro_status);
          setRoteiroLoading(false);
        }
      } catch (err) {
        console.error('Erro transitório no polling do roteiro:', err);
      }
    }, 5000);
    roteiroTimeoutRef.current = setTimeout(() => { stopRoteiroPoll(); setRoteiroLoading(false); }, 200000);
  }

  // Roteiro handlers
  const loadRoteiro = useCallback(async (historiaId) => {
    try {
      const data = await historiaService.getRoteiro(historiaId);
      setRoteiro(data.roteiro || null);
      setRoteiroStatus(data.roteiro_status || null);
      if (['queued', 'generating'].includes(data.roteiro_status)) {
        startRoteiroPoll(historiaId);
      }
    } catch (err) {
      console.error('Erro ao carregar roteiro:', err);
    }
  }, []);

  const handleGerarRoteiro = useCallback(async () => {
    if (!historiaAtual) return;
    setRoteiroLoading(true);
    setRoteiroStatus('generating');
    try {
      const mode = selectedMode || (roteiro ? 'regenerate' : 'initial');
      await historiaService.gerarRoteiro(historiaAtual.id, mode);
      setSelectedMode(null);
      startRoteiroPoll(historiaAtual.id);
    } catch (err) {
      console.error('Erro ao gerar roteiro:', err);
      setError(err.message || 'Erro ao gerar roteiro');
      setRoteiroStatus('error');
      setRoteiroLoading(false);
    }
  }, [historiaAtual]);

  const handleRoteiroUpdate = useCallback(async (updatedRoteiro) => {
    if (!historiaAtual) return;
    setRoteiro(updatedRoteiro);
    try {
      await historiaService.atualizarRoteiro(historiaAtual.id, updatedRoteiro);
    } catch (err) {
      console.error('Erro ao salvar roteiro:', err);
    }
  }, [historiaAtual]);

  const loadVersoes = useCallback(async () => {
    if (!historiaAtual) return;
    setVersoesLoading(true);
    try {
      const data = await historiaService.listarVersoesRoteiro(historiaAtual.id);
      setVersoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar versões:', err);
    } finally {
      setVersoesLoading(false);
    }
  }, [historiaAtual]);

  const handleToggleVersoes = useCallback(() => {
    const next = !versoesOpen;
    setVersoesOpen(next);
    if (next) loadVersoes();
  }, [versoesOpen, loadVersoes]);

  const handleAtivarVersao = useCallback(async (versaoId) => {
    if (!historiaAtual) return;
    try {
      const response = await historiaService.ativarVersaoRoteiro(historiaAtual.id, versaoId);
      if (response?.data?.roteiro) {
        setRoteiro(response.data.roteiro);
      }
      await loadVersoes();
    } catch (err) {
      console.error('Erro ao ativar versão:', err);
    }
  }, [historiaAtual, loadVersoes]);

  // Comparacao handlers
  const handleCompararVersao = useCallback(async (versao) => {
    if (!historiaAtual) return;
    setLoadingComparacao(true);
    try {
      const data = await historiaService.obterVersaoRoteiro(historiaAtual.id, versao.id);
      setVersaoComparacao(data?.roteiro || null);
      setMetadadosComparacao({ modo: versao.modo, temperatura: versao.temperatura, modelo: versao.modelo, criado_em: versao.criado_em, versao: versao.versao });
      setComparacaoOpen(true);
    } catch (err) {
      console.error('Erro ao carregar versão para comparação:', err);
    } finally {
      setLoadingComparacao(false);
    }
  }, [historiaAtual]);

  const handleFecharComparacao = useCallback(() => {
    setComparacaoOpen(false);
    setVersaoComparacao(null);
    setMetadadosComparacao(null);
  }, []);

  // Imagem handlers
  const handleCapaGenerated = useCallback(async (url) => {
    if (!historiaAtual) return;
    try {
      await historiaService.update(historiaAtual.id, { imagem: url });
      setHistoriaAtual(prev => ({ ...prev, imagem: url }));
    } catch (err) {
      setError(err.message || 'Erro ao salvar capa');
    }
  }, [historiaAtual]);

  const handleMapaGenerated = useCallback(async (url) => {
    if (!historiaAtual) return;
    const novoMapa = { url, nome: `Mapa ${(historiaAtual.mapas?.length || 0) + 1}` };
    const novosMapas = [...(historiaAtual.mapas || []), novoMapa];
    try {
      await historiaService.update(historiaAtual.id, { mapas: novosMapas });
      setHistoriaAtual(prev => ({ ...prev, mapas: novosMapas }));
    } catch (err) {
      setError(err.message || 'Erro ao salvar mapa');
    }
  }, [historiaAtual]);

  const handleRemoveMapa = useCallback(async (index) => {
    if (!historiaAtual) return;
    const novosMapas = (historiaAtual.mapas || []).filter((_, i) => i !== index);
    try {
      await historiaService.update(historiaAtual.id, { mapas: novosMapas });
      setHistoriaAtual(prev => ({ ...prev, mapas: novosMapas }));
    } catch (err) {
      setError(err.message || 'Erro ao remover mapa');
    }
  }, [historiaAtual]);

  // Navegacao
  const handleIniciarSessao = useCallback(() => {
    if (historiaAtual) {
      navigate(`/jogo/${historiaAtual.id}/selecao-personagem`);
    }
  }, [historiaAtual, navigate]);

  const handleVoltar = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  const handleEstiloImagemChange = useCallback(async (estilo) => {
    if (!historiaAtual) return;
    setHistoriaAtual(prev => ({ ...prev, estilo_imagem: estilo }));
    try {
      await historiaService.update(historiaAtual.id, { estilo_imagem: estilo });
    } catch (err) {
      setHistoriaAtual(prev => ({ ...prev, estilo_imagem: historiaAtual.estilo_imagem }));
      setError(err.message || 'Erro ao salvar estilo');
    }
  }, [historiaAtual]);

  const clearError = useCallback(() => setError(null), []);

  // Lightbox handlers
  const handleOpenLightbox = useCallback((src) => setLightboxSrc(src), []);
  const handleCloseLightbox = useCallback(() => setLightboxSrc(null), []);

  // Selected mestre (derived)
  const selectedMestre = useMemo(() => {
    if (!mestreSelecionadoId) return null;
    return (mestresAtivos || []).find((m) => String(m.id) === String(mestreSelecionadoId)) || null;
  }, [mestresAtivos, mestreSelecionadoId]);

  // Effective voice (for narration buttons)
  const effectiveMestreVoiceId = selectedMestre?.voice_id || historiaAtual?.mestre?.voice_id || historiaAtual?.mestres?.voice_id || null;
  const effectiveMestreVoiceProvider = selectedMestre?.voice_provider || historiaAtual?.mestre?.voice_provider || historiaAtual?.mestres?.voice_provider || DEFAULT_TTS_PROVIDER;

  // Provider label for display
  const mestreProviderLabel = PROVIDER_LABELS[effectiveMestreVoiceProvider] || effectiveMestreVoiceProvider;

  // Estilo imagem atual
  const estiloAtual = historiaAtual?.estilo_imagem || 'fantasy_painting';

  // Modo de abertura de sessao
  const configHistoriaAtual = resolveHistoriaConfig(historiaAtual?.config);
  const modoAberturaAtual = configHistoriaAtual.session_opening_mode ?? 'direto';
  const velocidadeNarrativaAtual = configHistoriaAtual.ritmo.velocidade;
  const orcamentoDeBeatsAtual = configHistoriaAtual.ritmo.orcamento_de_beats;
  const maxAcoesPorTurnoAtual = configHistoriaAtual.regras_de_turno.max_acoes_por_turno;
  const [salvandoAbertura, setSalvandoAbertura] = useState(false);
  const [salvandoConfiguracaoNarrativa, setSalvandoConfiguracaoNarrativa] = useState(false);

  const salvarConfigHistoria = useCallback(async (configPatch, errorMessage) => {
    if (!historiaAtual || salvandoConfiguracaoNarrativa) return;

    const configAnterior = historiaAtual.config;
    const proximoConfig = mergeHistoriaConfig(historiaAtual.config, configPatch);

    setSalvandoConfiguracaoNarrativa(true);
    setHistoriaAtual(prev => ({ ...prev, config: proximoConfig }));
    try {
      await historiaService.update(historiaAtual.id, { config: configPatch });
    } catch (err) {
      setHistoriaAtual(prev => ({ ...prev, config: configAnterior }));
      setError(err.message || errorMessage);
    } finally {
      setSalvandoConfiguracaoNarrativa(false);
    }
  }, [historiaAtual, salvandoConfiguracaoNarrativa]);

  const handleModoAberturaChange = useCallback(async (modo) => {
    if (!historiaAtual || salvandoAbertura) return;
    setSalvandoAbertura(true);
    const configAnterior = historiaAtual.config;
    setHistoriaAtual(prev => ({ ...prev, config: mergeHistoriaConfig(prev?.config, { session_opening_mode: modo }) }));
    try {
      await historiaService.update(historiaAtual.id, { config: { session_opening_mode: modo } });
    } catch (err) {
      setHistoriaAtual(prev => ({ ...prev, config: configAnterior }));
      setError(err.message || 'Erro ao salvar modo de abertura');
    } finally {
      setSalvandoAbertura(false);
    }
  }, [historiaAtual, salvandoAbertura]);

  const handleVelocidadeNarrativaChange = useCallback(async (velocidade) => {
    await salvarConfigHistoria({
      ritmo: {
        velocidade
      }
    }, 'Erro ao salvar velocidade narrativa');
  }, [salvarConfigHistoria]);

  const handleOrcamentoDeBeatsChange = useCallback(async (value) => {
    await salvarConfigHistoria({
      ritmo: {
        orcamento_de_beats: Number(value)
      }
    }, 'Erro ao salvar orcamento de beats');
  }, [salvarConfigHistoria]);

  const handleMaxAcoesPorTurnoChange = useCallback(async (value) => {
    await salvarConfigHistoria({
      regras_de_turno: {
        max_acoes_por_turno: Number(value)
      }
    }, 'Erro ao salvar regra de turno');
  }, [salvarConfigHistoria]);

  // Voice preview
  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPlayingMestreId(null);
  }, []);

  const handlePreviewMestre = useCallback(async () => {
    if (!selectedMestre?.voice_id || loadingPreview) return;

    if (playingMestreId && String(playingMestreId) === String(selectedMestre.id)) {
      stopPreview();
      return;
    }

    stopPreview();
    setLoadingPreview(true);
    try {
      const body = {
        voiceId: selectedMestre.voice_id,
        provider: selectedMestre.voice_provider || DEFAULT_TTS_PROVIDER,
      };
      const response = await apiClient.post('/tts/preview', body, { responseType: 'blob' });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewUrlRef.current = url;
      previewAudioRef.current = audio;
      audio.onended = () => stopPreview();
      audio.onpause = () => setPlayingMestreId(null);
      await audio.play();
      setPlayingMestreId(selectedMestre.id);
    } catch (err) {
      stopPreview();
      setError(err.message || 'Erro ao gerar preview de voz');
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedMestre, loadingPreview, playingMestreId, stopPreview]);

  // Cleanup preview on unmount
  useEffect(() => {
    return () => stopPreview();
  }, [stopPreview]);

  return {
    // Data
    historiaAtual,
    loading,
    error,
    nomesTemas,
    canMutateHistoria,

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
    selectedMestre,
    mestreProviderLabel,

    // Voice preview
    loadingPreview,
    playingMestreId,
    handlePreviewMestre,

    // TTS
    tts,
    effectiveMestreVoiceId,
    effectiveMestreVoiceProvider,

    // Lightbox
    lightboxSrc,
    handleOpenLightbox,
    handleCloseLightbox,

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

    // Roteiro
    roteiro,
    roteiroStatus,
    roteiroLoading,
    selectedMode,
    setSelectedMode,
    versoes,
    versoesOpen,
    versoesLoading,
    handleGerarRoteiro,
    handleRoteiroUpdate,
    handleToggleVersoes,
    handleAtivarVersao,
    handleCompararVersao,
    handleFecharComparacao,
    versaoComparacao,
    metadadosComparacao,
    loadingComparacao,
    comparacaoOpen,

    // Imagens
    estiloAtual,
    handleCapaGenerated,
    handleMapaGenerated,
    handleRemoveMapa,
    handleEstiloImagemChange,

    // Abertura de sessao
    modoAberturaAtual,
    velocidadeNarrativaAtual,
    orcamentoDeBeatsAtual,
    maxAcoesPorTurnoAtual,
    salvandoAbertura,
    salvandoConfiguracaoNarrativa,
    handleModoAberturaChange,
    handleVelocidadeNarrativaChange,
    handleOrcamentoDeBeatsChange,
    handleMaxAcoesPorTurnoChange,

    // Utils
    clearError,
  };
};
