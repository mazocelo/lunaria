import { useState, useEffect, useCallback } from 'react';
import { useTemaStore } from '../../../store/tema/index.js';
import { useMestreStore } from '../../../store/mestre/index.js';
import { useHistoriaStore } from '../../../store/historia/index.js';
import { historiaService } from '../../../services/index.js';
import { Historia } from '../../../models/Historia.js';
import { DEFAULT_HISTORIA_CONFIG } from '../../../utils/historiaConfig.js';

export const useHistoriaNovaModel = ({ navigate } = {}) => {

  // Tema store
  const temas = useTemaStore(s => s.temasAtivos);
  const temasLoading = useTemaStore(s => s.loading);
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const getTemasParaSelecao = useTemaStore(s => s.getTemasParaSelecao);

  // Mestre store
  const mestresAtivos = useMestreStore(s => s.mestresAtivos);
  const carregarMestres = useMestreStore(s => s.carregarMestres);

  // Historia store
  const recarregarHistorias = useHistoriaStore(s => s.recarregarHistorias);

  // Form state
  const [nome, setNome] = useState('');
  const [temasSelecionados, setTemasSelecionados] = useState([]);
  const [maximo_de_participantes, setMaximoDeParticipantes] = useState(4);
  const [descricao, setDescricao] = useState('');
  const [mestreSelecionado, setMestreSelecionado] = useState(null);
  const [nomeError, setNomeError] = useState('');
  const [publica, setPublica] = useState(false);
  const [mestreTier, setMestreTier] = useState('poeta');
  const [velocidadeNarrativa, setVelocidadeNarrativa] = useState(DEFAULT_HISTORIA_CONFIG.ritmo.velocidade);
  const [orcamentoDeBeats, setOrcamentoDeBeats] = useState(DEFAULT_HISTORIA_CONFIG.ritmo.orcamento_de_beats);
  const [maxAcoesPorTurno, setMaxAcoesPorTurno] = useState(DEFAULT_HISTORIA_CONFIG.regras_de_turno.max_acoes_por_turno);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Temas para selecao (formatados)
  const temasParaSelecao = getTemasParaSelecao();
  const mestres = mestresAtivos || [];

  useEffect(() => {
    carregarTemas();
    carregarMestres();
    return () => setError(null);
  }, []);

  const handleNomeChange = useCallback((e) => {
    setNome(e.target.value);
    if (nomeError) setNomeError('');
  }, [nomeError]);

  const handleNomeBlur = useCallback(() => {
    if (nome && nome.trim().length < 2) {
      setNomeError('Nome deve ter pelo menos 2 caracteres');
    }
  }, [nome]);

  const handleTemasChange = useCallback((selected) => {
    setTemasSelecionados(selected);
  }, []);

  const handleMaxParticipantesChange = useCallback((e) => {
    setMaximoDeParticipantes(Number(e.target.value));
  }, []);

  const handleDescricaoChange = useCallback((e) => {
    setDescricao(e.target.value);
  }, []);

  const handleMestreChange = useCallback((id) => {
    setMestreSelecionado(id);
  }, []);

  const handleVelocidadeNarrativaChange = useCallback((e) => {
    setVelocidadeNarrativa(e.target.value);
  }, []);

  const handleOrcamentoDeBeatsChange = useCallback((e) => {
    setOrcamentoDeBeats(Number(e.target.value));
  }, []);

  const handleMaxAcoesPorTurnoChange = useCallback((e) => {
    setMaxAcoesPorTurno(Number(e.target.value));
  }, []);

  const criarHistoria = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const historiaData = {
        nome,
        temas: temasSelecionados,
        maximo_de_participantes,
        descricao,
        mestre_id: mestreSelecionado,
        mestre_tier: mestreTier,
        publica,
        config: {
          ritmo: {
            velocidade: velocidadeNarrativa,
            orcamento_de_beats: orcamentoDeBeats,
          },
          regras_de_turno: {
            max_acoes_por_turno: maxAcoesPorTurno,
          },
        },
      };

      const historia = new Historia(historiaData);
      await historiaService.create(historia);
      await recarregarHistorias();
      navigate('/historias');
    } catch (err) {
      console.error('Erro ao criar historia:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    nome,
    temasSelecionados,
    maximo_de_participantes,
    descricao,
    mestreSelecionado,
    publica,
    velocidadeNarrativa,
    orcamentoDeBeats,
    maxAcoesPorTurno,
    recarregarHistorias,
    navigate
  ]);

  const handleCancelar = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return {
    // Form data
    nome,
    temasSelecionados,
    maximo_de_participantes,
    descricao,
    mestreSelecionado,
    nomeError,
    loading,
    error,
    velocidadeNarrativa,
    orcamentoDeBeats,
    maxAcoesPorTurno,

    // Options
    temas: temasParaSelecao,
    mestres,
    temasLoading,

    // Handlers
    handleNomeChange,
    handleNomeBlur,
    handleTemasChange,
    handleMaxParticipantesChange,
    handleDescricaoChange,
    handleMestreChange,
    handleVelocidadeNarrativaChange,
    handleOrcamentoDeBeatsChange,
    handleMaxAcoesPorTurnoChange,
    criarHistoria,
    handleCancelar,
    clearError,
    publica,
    setPublica,
    mestreTier,
    setMestreTier,
  };
};
