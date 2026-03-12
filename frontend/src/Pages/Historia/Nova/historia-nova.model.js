import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemaStore } from '../../../store/tema/index.js';
import { useMestreStore } from '../../../store/mestre/index.js';
import { useHistoriaStore } from '../../../store/historia/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { historiaService } from '../../../services/index.js';
import { Historia } from '../../../models/Historia.js';

export const useHistoriaNovaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
        publica,
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
  }, [nome, temasSelecionados, maximo_de_participantes, descricao, mestreSelecionado, publica, recarregarHistorias, navigate]);

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
    isLight,

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
    criarHistoria,
    handleCancelar,
    clearError,
    publica,
    setPublica,
  };
};
