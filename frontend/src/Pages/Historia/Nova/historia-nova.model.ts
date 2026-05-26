import { useState, useEffect, useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index';
import { useMestreStore } from '../../../store/mestre/index';
import { useHistoriaStore } from '../../../store/historia/index';
import { historiaService } from '../../../services/index';
import { Historia } from '../../../models/Historia';
import { DEFAULT_HISTORIA_CONFIG } from '../../../utils/historiaConfig';

interface UseHistoriaNovaModelArgs {
  navigate: NavigateFunction;
}

export const useHistoriaNovaModel = ({ navigate }: UseHistoriaNovaModelArgs) => {
  const temasLoading = useTemaStore(s => s.loading);
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const getTemasParaSelecao = useTemaStore(s => s.getTemasParaSelecao);

  const mestresAtivos = useMestreStore(s => s.mestresAtivos);
  const carregarMestres = useMestreStore(s => s.carregarMestres);

  const recarregarHistorias = useHistoriaStore(s => s.recarregarHistorias);

  const [nome, setNome] = useState('');
  const [temasSelecionados, setTemasSelecionados] = useState<number[]>([]);
  const [maximo_de_participantes, setMaximoDeParticipantes] = useState(4);
  const [descricao, setDescricao] = useState('');
  const [mestreSelecionado, setMestreSelecionado] = useState<number | null>(null);
  const [nomeError, setNomeError] = useState('');
  const [publica, setPublica] = useState(false);
  const [mestreTier, setMestreTier] = useState('poeta');
  const [velocidadeNarrativa, setVelocidadeNarrativa] = useState<string>(DEFAULT_HISTORIA_CONFIG.ritmo.velocidade);
  const [orcamentoDeBeats, setOrcamentoDeBeats] = useState<number>(DEFAULT_HISTORIA_CONFIG.ritmo.orcamento_de_beats);
  const [maxAcoesPorTurno, setMaxAcoesPorTurno] = useState<number>(DEFAULT_HISTORIA_CONFIG.regras_de_turno.max_acoes_por_turno);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const temasParaSelecao = getTemasParaSelecao();
  const mestres = mestresAtivos || [];

  useEffect(() => {
    carregarTemas();
    carregarMestres();
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNomeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNome(e.target.value);
    if (nomeError) setNomeError('');
  }, [nomeError]);

  const handleNomeBlur = useCallback(() => {
    if (nome && nome.trim().length < 2) {
      setNomeError('Nome deve ter pelo menos 2 caracteres');
    }
  }, [nome]);

  const handleTemasChange = useCallback((selected: number[]) => {
    setTemasSelecionados(selected);
  }, []);

  const handleMaxParticipantesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaximoDeParticipantes(Number(e.target.value));
  }, []);

  const handleDescricaoChange = useCallback((e: { target: { value: string } }) => {
    setDescricao(e.target.value);
  }, []);

  const handleMestreChange = useCallback((id: number | null) => {
    setMestreSelecionado(id);
  }, []);

  const handleVelocidadeNarrativaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setVelocidadeNarrativa(e.target.value);
  }, []);

  const handleOrcamentoDeBeatsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrcamentoDeBeats(Number(e.target.value));
  }, []);

  const handleMaxAcoesPorTurnoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMaxAcoesPorTurno(Number(e.target.value));
  }, []);

  const criarHistoria = useCallback(async (e: React.FormEvent) => {
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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    nome,
    temasSelecionados,
    maximo_de_participantes,
    descricao,
    mestreSelecionado,
    mestreTier,
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

    temas: temasParaSelecao,
    mestres,
    temasLoading,

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
