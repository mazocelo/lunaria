import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index';
import { useMestreStore } from '../../../store/mestre/index';
import { useAuth } from '../../../contexts/AuthContext';
import { historiaService } from '../../../services/index';
import { sessaoService } from '../../../services/index';
import { apiClient } from '../../../services/ApiClient';
import { useTTS, type UseTTSResult } from '../../../hooks/useTTS';
import { mergeHistoriaConfig, resolveHistoriaConfig } from '../../../utils/historiaConfig';
import type { Historia } from '../../../types/api';
import { ROTEIRO_STATUS_EM_PROGRESSO } from '../../../types/api';
import type { MestreItem } from '../../../store/mestre/states';

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

const PROVIDER_LABELS: Record<string, string> = {
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

export interface HistoriaExtendida extends Historia {
  mestre?: MestreItem | null;
  mestres?: MestreItem | null;
  usuarios?: { id?: number; nome?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SessaoItem {
  id: number;
  iniciada_em?: string;
  status?: string;
  totalMensagens?: number;
  rodada_atual?: number;
  jogadores?: Record<string, { personagemNome?: string; username?: string }>;
}

export interface VersaoRoteiro {
  id: number;
  versao: number;
  modo?: string;
  temperatura?: number;
  modelo?: string;
  criado_em?: string;
  ativa?: boolean;
}

interface UseHistoriaVerModelArgs {
  navigate: NavigateFunction;
}

export const useHistoriaVerModel = ({ navigate }: UseHistoriaVerModelArgs) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const tts: UseTTSResult = useTTS();

  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const mapearTemasDeHistoria = useTemaStore(s => s.mapearTemasDeHistoria);

  const mestresAtivos = useMestreStore(s => s.mestresAtivos);
  const carregarMestres = useMestreStore(s => s.carregarMestres);

  const [historiaAtual, setHistoriaAtual] = useState<HistoriaExtendida | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [editandoMestre, setEditandoMestre] = useState(false);
  const [mestreSelecionadoId, setMestreSelecionadoId] = useState<number | null>(null);
  const [mestreTierSelecionado, setMestreTierSelecionado] = useState<string | null>(null);
  const [salvandoMestre, setSalvandoMestre] = useState(false);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [playingMestreId, setPlayingMestreId] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [sessoes, setSessoes] = useState<SessaoItem[]>([]);
  const [loadingSessoes, setLoadingSessoes] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<unknown>(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [roteiro, setRoteiro] = useState<Record<string, unknown> | null>(null);
  const [roteiroStatus, setRoteiroStatus] = useState<string | null>(null);
  const [roteiroLoading, setRoteiroLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [versoes, setVersoes] = useState<VersaoRoteiro[]>([]);
  const [versoesOpen, setVersoesOpen] = useState(false);
  const [versoesLoading, setVersoesLoading] = useState(false);
  const roteiroPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roteiroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [versaoComparacao, setVersaoComparacao] = useState<Record<string, unknown> | null>(null);
  const [metadadosComparacao, setMetadadosComparacao] = useState<Record<string, unknown> | null>(null);
  const [loadingComparacao, setLoadingComparacao] = useState(false);
  const [comparacaoOpen, setComparacaoOpen] = useState(false);

  const loadHistoria = useCallback(async (historiaId: number) => {
    setLoading(true);
    setError(null);
    try {
      await carregarTemas();
      await carregarMestres();
      const historia = (await historiaService.getById(historiaId)) as unknown as HistoriaExtendida;
      setHistoriaAtual(historia);
    } catch (err) {
      console.error('Erro ao carregar historia:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [carregarTemas, carregarMestres]);

  useEffect(() => {
    if (id) {
      loadHistoria(parseInt(id));
      loadRoteiro(parseInt(id));
      setLoadingSessoes(true);
      sessaoService.getSessoesByHistoria(Number(id))
        .then(data => setSessoes((data as SessaoItem[]) || []))
        .catch(() => setSessoes([]))
        .finally(() => setLoadingSessoes(false));
    }
    return () => { setError(null); stopRoteiroPoll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getNomesTemas = useCallback((historia: Historia | null | undefined) => {
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

  const getMestreNome = useCallback((historia: HistoriaExtendida | null): string => {
    if (!historia) return 'Mestre Padrao';
    if (historia.mestre?.nome) return historia.mestre.nome;
    if (historia.mestres?.nome) return historia.mestres.nome;
    return 'Mestre Padrao';
  }, []);

  const handleSalvarMestre = useCallback(async () => {
    if (!historiaAtual) return;
    setSalvandoMestre(true);
    try {
      const updateData: Record<string, unknown> = { mestre_id: mestreSelecionadoId };
      if (mestreTierSelecionado) updateData.mestre_tier = mestreTierSelecionado;
      await historiaService.update(historiaAtual.id, updateData);
      await loadHistoria(historiaAtual.id);
      setEditandoMestre(false);
    } catch (err) {
      console.error('Erro ao salvar mestre:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar mestre';
      setError(message);
    } finally {
      setSalvandoMestre(false);
    }
  }, [historiaAtual, mestreSelecionadoId, mestreTierSelecionado, loadHistoria]);

  const handleEditarMestre = useCallback(() => {
    if (historiaAtual) {
      setMestreSelecionadoId(historiaAtual.mestre_id || historiaAtual.mestres?.id || null);
      setMestreTierSelecionado(historiaAtual.mestre_tier || 'poeta');
      setEditandoMestre(true);
    }
  }, [historiaAtual]);

  const handleCancelarEditarMestre = useCallback(() => {
    setEditandoMestre(false);
  }, []);

  const handleMestreSelecionadoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMestreSelecionadoId(e.target.value ? parseInt(e.target.value) : null);
  }, []);

  const abrirHistorico = useCallback(async (sessao: SessaoItem) => {
    setLoadingHistorico(true);
    try {
      const completa = await sessaoService.getSessaoHistorico(sessao.id);
      setSessaoSelecionada(completa);
    } catch (err) {
      console.error('Erro ao carregar historico:', err);
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico da sessão';
      setError(message);
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  const fecharHistorico = useCallback(() => {
    setSessaoSelecionada(null);
  }, []);

  const formatSessaoDate = useCallback((dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }, []);

  function stopRoteiroPoll() {
    if (roteiroPollRef.current) { clearInterval(roteiroPollRef.current); roteiroPollRef.current = null; }
    if (roteiroTimeoutRef.current) { clearTimeout(roteiroTimeoutRef.current); roteiroTimeoutRef.current = null; }
  }

  function startRoteiroPoll(historiaId: number) {
    stopRoteiroPoll();
    setRoteiroLoading(true);
    roteiroPollRef.current = setInterval(async () => {
      try {
        const updated = await historiaService.getRoteiro(historiaId) as { roteiro?: Record<string, unknown>; roteiro_status?: string };
        if (!ROTEIRO_STATUS_EM_PROGRESSO.includes(updated.roteiro_status || '')) {
          stopRoteiroPoll();
          setRoteiro(updated.roteiro || null);
          setRoteiroStatus(updated.roteiro_status || null);
          setRoteiroLoading(false);
        }
      } catch (err) {
        console.error('Erro transitório no polling do roteiro:', err);
      }
    }, 5000);
    roteiroTimeoutRef.current = setTimeout(() => { stopRoteiroPoll(); setRoteiroLoading(false); }, 200000);
  }

  const loadRoteiro = useCallback(async (historiaId: number) => {
    try {
      const data = await historiaService.getRoteiro(historiaId) as { roteiro?: Record<string, unknown>; roteiro_status?: string };
      setRoteiro(data.roteiro || null);
      setRoteiroStatus(data.roteiro_status || null);
      if (ROTEIRO_STATUS_EM_PROGRESSO.includes(data.roteiro_status || '')) {
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
      const message = err instanceof Error ? err.message : 'Erro ao gerar roteiro';
      setError(message);
      setRoteiroStatus('error');
      setRoteiroLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historiaAtual, selectedMode, roteiro]);

  const handleRoteiroUpdate = useCallback(async (updatedRoteiro: Record<string, unknown>) => {
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
      const data = await historiaService.listarVersoesRoteiro(historiaAtual.id) as VersaoRoteiro[] | undefined;
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

  const handleAtivarVersao = useCallback(async (versaoId: number) => {
    if (!historiaAtual) return;
    try {
      const response = await historiaService.ativarVersaoRoteiro(historiaAtual.id, versaoId) as { data?: { roteiro?: Record<string, unknown> } } | undefined;
      if (response?.data?.roteiro) {
        setRoteiro(response.data.roteiro);
      }
      await loadVersoes();
    } catch (err) {
      console.error('Erro ao ativar versão:', err);
    }
  }, [historiaAtual, loadVersoes]);

  const handleCompararVersao = useCallback(async (versao: VersaoRoteiro) => {
    if (!historiaAtual) return;
    setLoadingComparacao(true);
    try {
      const data = await historiaService.obterVersaoRoteiro(historiaAtual.id, versao.id) as { roteiro?: Record<string, unknown> } | undefined;
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

  const handleCapaGenerated = useCallback(async (url: string) => {
    if (!historiaAtual) return;
    try {
      await historiaService.update(historiaAtual.id, { imagem: url });
      setHistoriaAtual(prev => prev ? { ...prev, imagem: url } : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar capa';
      setError(message);
    }
  }, [historiaAtual]);

  const handleMapaGenerated = useCallback(async (url: string) => {
    if (!historiaAtual) return;
    const mapasAtuais = Array.isArray(historiaAtual.mapas) ? (historiaAtual.mapas as Array<{ url: string; nome: string }>) : [];
    const novoMapa = { url, nome: `Mapa ${mapasAtuais.length + 1}` };
    const novosMapas = [...mapasAtuais, novoMapa];
    try {
      await historiaService.update(historiaAtual.id, { mapas: novosMapas });
      setHistoriaAtual(prev => prev ? { ...prev, mapas: novosMapas } : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar mapa';
      setError(message);
    }
  }, [historiaAtual]);

  const handleRemoveMapa = useCallback(async (index: number) => {
    if (!historiaAtual) return;
    const mapasAtuais = Array.isArray(historiaAtual.mapas) ? (historiaAtual.mapas as Array<{ url: string; nome: string }>) : [];
    const novosMapas = mapasAtuais.filter((_, i) => i !== index);
    try {
      await historiaService.update(historiaAtual.id, { mapas: novosMapas });
      setHistoriaAtual(prev => prev ? { ...prev, mapas: novosMapas } : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover mapa';
      setError(message);
    }
  }, [historiaAtual]);

  const handleIniciarSessao = useCallback(() => {
    if (historiaAtual) {
      navigate(`/jogo/${historiaAtual.id}/selecao-personagem`);
    }
  }, [historiaAtual, navigate]);

  const handleVoltar = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  const handleEstiloImagemChange = useCallback(async (estilo: string) => {
    if (!historiaAtual) return;
    const estiloAnterior = historiaAtual.estilo_imagem;
    setHistoriaAtual(prev => prev ? { ...prev, estilo_imagem: estilo } : prev);
    try {
      await historiaService.update(historiaAtual.id, { estilo_imagem: estilo });
    } catch (err) {
      setHistoriaAtual(prev => prev ? { ...prev, estilo_imagem: estiloAnterior } : prev);
      const message = err instanceof Error ? err.message : 'Erro ao salvar estilo';
      setError(message);
    }
  }, [historiaAtual]);

  const clearError = useCallback(() => setError(null), []);

  const handleOpenLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const handleCloseLightbox = useCallback(() => setLightboxSrc(null), []);

  const selectedMestre = useMemo<MestreItem | null>(() => {
    if (!mestreSelecionadoId) return null;
    return (mestresAtivos || []).find((m) => String(m.id) === String(mestreSelecionadoId)) || null;
  }, [mestresAtivos, mestreSelecionadoId]);

  const effectiveMestreVoiceId = (selectedMestre?.voice_id as string | null)
    || (historiaAtual?.mestre?.voice_id as string | null)
    || (historiaAtual?.mestres?.voice_id as string | null)
    || null;
  const effectiveMestreVoiceProvider = (selectedMestre?.voice_provider as string | null)
    || (historiaAtual?.mestre?.voice_provider as string | null)
    || (historiaAtual?.mestres?.voice_provider as string | null)
    || DEFAULT_TTS_PROVIDER;

  const mestreProviderLabel = PROVIDER_LABELS[effectiveMestreVoiceProvider] || effectiveMestreVoiceProvider;

  const estiloAtual = historiaAtual?.estilo_imagem || 'fantasy_painting';

  const configHistoriaAtual = resolveHistoriaConfig(historiaAtual?.config);
  const modoAberturaAtual = (configHistoriaAtual.session_opening_mode as string | undefined) ?? 'direto';
  const velocidadeNarrativaAtual = configHistoriaAtual.ritmo.velocidade;
  const orcamentoDeBeatsAtual = configHistoriaAtual.ritmo.orcamento_de_beats;
  const maxAcoesPorTurnoAtual = configHistoriaAtual.regras_de_turno.max_acoes_por_turno;
  const [salvandoAbertura, setSalvandoAbertura] = useState(false);
  const [salvandoConfiguracaoNarrativa, setSalvandoConfiguracaoNarrativa] = useState(false);

  const salvarConfigHistoria = useCallback(async (configPatch: Record<string, unknown>, errorMessage: string) => {
    if (!historiaAtual || salvandoConfiguracaoNarrativa) return;

    const configAnterior = historiaAtual.config;
    const proximoConfig = mergeHistoriaConfig(historiaAtual.config, configPatch);

    setSalvandoConfiguracaoNarrativa(true);
    setHistoriaAtual(prev => prev ? { ...prev, config: proximoConfig } : prev);
    try {
      await historiaService.update(historiaAtual.id, { config: configPatch });
    } catch (err) {
      setHistoriaAtual(prev => prev ? { ...prev, config: configAnterior } : prev);
      const message = err instanceof Error ? err.message : errorMessage;
      setError(message);
    } finally {
      setSalvandoConfiguracaoNarrativa(false);
    }
  }, [historiaAtual, salvandoConfiguracaoNarrativa]);

  const handleModoAberturaChange = useCallback(async (modo: string) => {
    if (!historiaAtual || salvandoAbertura) return;
    setSalvandoAbertura(true);
    const configAnterior = historiaAtual.config;
    setHistoriaAtual(prev => prev ? { ...prev, config: mergeHistoriaConfig(prev?.config, { session_opening_mode: modo }) } : prev);
    try {
      await historiaService.update(historiaAtual.id, { config: { session_opening_mode: modo } });
    } catch (err) {
      setHistoriaAtual(prev => prev ? { ...prev, config: configAnterior } : prev);
      const message = err instanceof Error ? err.message : 'Erro ao salvar modo de abertura';
      setError(message);
    } finally {
      setSalvandoAbertura(false);
    }
  }, [historiaAtual, salvandoAbertura]);

  const handleVelocidadeNarrativaChange = useCallback(async (velocidade: string) => {
    await salvarConfigHistoria({
      ritmo: { velocidade }
    }, 'Erro ao salvar velocidade narrativa');
  }, [salvarConfigHistoria]);

  const handleOrcamentoDeBeatsChange = useCallback(async (value: number | string) => {
    await salvarConfigHistoria({
      ritmo: { orcamento_de_beats: Number(value) }
    }, 'Erro ao salvar orcamento de beats');
  }, [salvarConfigHistoria]);

  const handleMaxAcoesPorTurnoChange = useCallback(async (value: number | string) => {
    await salvarConfigHistoria({
      regras_de_turno: { max_acoes_por_turno: Number(value) }
    }, 'Erro ao salvar regra de turno');
  }, [salvarConfigHistoria]);

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
      const blob = response instanceof Blob ? response : new Blob([response as BlobPart], { type: 'audio/mpeg' });
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
      const message = err instanceof Error ? err.message : 'Erro ao gerar preview de voz';
      setError(message);
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedMestre, loadingPreview, playingMestreId, stopPreview]);

  useEffect(() => {
    return () => stopPreview();
  }, [stopPreview]);

  return {
    historiaAtual,
    loading,
    error,
    nomesTemas,
    canMutateHistoria,

    mestresAtivos,
    editandoMestre,
    mestreSelecionadoId,
    mestreTierSelecionado,
    setMestreTierSelecionado,
    salvandoMestre,
    getMestreNome,
    handleSalvarMestre,
    handleEditarMestre,
    handleCancelarEditarMestre,
    handleMestreSelecionadoChange,
    selectedMestre,
    mestreProviderLabel,

    loadingPreview,
    playingMestreId,
    handlePreviewMestre,

    tts,
    effectiveMestreVoiceId,
    effectiveMestreVoiceProvider,

    lightboxSrc,
    handleOpenLightbox,
    handleCloseLightbox,

    sessoes,
    loadingSessoes,
    sessaoSelecionada,
    loadingHistorico,
    abrirHistorico,
    fecharHistorico,
    formatSessaoDate,

    handleIniciarSessao,
    handleVoltar,

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

    estiloAtual,
    handleCapaGenerated,
    handleMapaGenerated,
    handleRemoveMapa,
    handleEstiloImagemChange,

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

    clearError,
  };
};
