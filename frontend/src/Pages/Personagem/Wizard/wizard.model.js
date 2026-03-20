
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { mestreCriadorService } from '../../../services/index.js';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useDraftPersistence } from './hooks/useDraftPersistence';
import { useWizardNavigation } from './hooks/useWizardNavigation';
import { useBonusCalculation } from './hooks/useBonusCalculation';
import { usePointSystem } from './hooks/usePointSystem';
import { useChatState } from './hooks/useChatState';
import { useComboPreview } from './hooks/useComboPreview';
import { useMestreInteraction } from './hooks/useMestreInteraction';
import { useCharacterCreation } from './hooks/useCharacterCreation';
import { tierDesbloqueado } from '../../../utils/evolucaoHelper.js';

export const useWizardModel = ({ navigate }) => {
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);
  const wizardInitRef = useRef(false);

  // Zustand stores
  const racas = useRacaStore(s => s.racas);
  const racasCarregadas = useRacaStore(s => s.racasCarregadas);
  const carregarRacas = useRacaStore(s => s.carregarRacas);

  const classes = useClasseStore(s => s.classes);
  const classesCarregadas = useClasseStore(s => s.classesCarregadas);
  const carregarClasses = useClasseStore(s => s.carregarClasses);

  const vantagens = useVantagemStore(s => s.vantagens);
  const vantagensCarregadas = useVantagemStore(s => s.vantagensCarregadas);
  const carregarVantagens = useVantagemStore(s => s.carregarVantagens);

  const desvantagens = useDesvantagemStore(s => s.desvantagens);
  const desvantagensCarregadas = useDesvantagemStore(s => s.desvantagensCarregadas);
  const carregarDesvantagens = useDesvantagemStore(s => s.carregarDesvantagens);

  // Catálogos combinados
  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];
  const tierCriacao = tierDesbloqueado(1);
  const vantagensDisponiveis = useMemo(() => {
    const todas = [...(vantagens || []), ...(desvantagens || [])];
    return todas.filter(item => (item.nivel || 1) <= tierCriacao);
  }, [vantagens, desvantagens]);

  // --- Draft ---
  const { draftInicial, draftRestaurado, setDraftRestaurado, salvarDraft, limparDraft } = useDraftPersistence();

  // --- Personagem state ---
  const [nome, setNome] = useState(draftInicial?.nome || '');
  const [racaId, setRacaId] = useState(draftInicial?.racaId || null);
  const [racaNome, setRacaNome] = useState(draftInicial?.racaNome || '');
  const [classeId, setClasseId] = useState(draftInicial?.classeId || null);
  const [classeNome, setClasseNome] = useState(draftInicial?.classeNome || '');
  const [background, setBackground] = useState(draftInicial?.background || '');

  // --- Point System ---
  const pointSystem = usePointSystem({
    draftInicial,
    vantagensDisponiveis,
    vantagensStore: vantagens,
    desvantagensStore: desvantagens,
    racaId,
    classeId,
    racasDisponiveis,
    classesDisponiveis,
  });

  // --- Bonus Calculation ---
  const bonusCalc = useBonusCalculation({
    draftInicial,
    racaId, classeId,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
    racasDisponiveis, classesDisponiveis, vantagensDisponiveis,
  });

  // --- Chat State ---
  const chat = useChatState();
  const {
    mensagens, setMensagens,
    inputTexto, setInputTexto,
    enviando, setEnviando, enviandoRef,
    sugestoes, setSugestoes,
    error, setError,
    chatEndRef,
  } = chat;

  /** Refs para evitar stale closures em getEstado/getHistorico */
  const estadoRef = useRef();

  // Extrair vantagens/desvantagens concedidas pela raça e classe selecionadas
  const racaSelecionada = racaId ? racas.find(r => String(r.id) === String(racaId)) : null;
  const classeSelecionada = classeId ? classes.find(c => String(c.id) === String(classeId)) : null;

  estadoRef.current = {
    nome, racaId, racaNome, classeId, classeNome, background,
    vantagensIds: pointSystem.vantagensIds,
    vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds,
    desvantagensNomes: pointSystem.desvantagensNomes,
    atributosBase: bonusCalc.atributosBase,
    atributosFinal: bonusCalc.atributosFinal,
    // Vantagens/desvantagens concedidas por raça/classe (para excluir das sugestões)
    vantagensDaRaca: racaSelecionada?.vantagens?.map(v => v.nome || v) || [],
    desvantagensDaRaca: racaSelecionada?.desvantagens?.map(d => d.nome || d) || [],
    vantagensDaClasse: classeSelecionada?.vantagens?.map(v => v.nome || v) || [],
    desvantagensDaClasse: classeSelecionada?.desvantagens?.map(d => d.nome || d) || [],
  };

  // --- Combo Preview ---
  const comboPreview = useComboPreview({
    nome, racaId, classeId, background,
    bonusAplicados: bonusCalc.bonusAplicados,
    pontosCriacaoRestantes: pointSystem.pontosCriacaoRestantes,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
    atributosBase: bonusCalc.atributosBase,
    etapaAtual: null, // set via ref below, auto-load uses etapaAtualRef
    estadoRef,
  });

  const {
    comboPreviewData, comboPreviewLoading, comboPreviewErro,
    comboPreviewTentativa, comboPreviewBuildKey,
    podeGerarPreview, carregarComboPreview,
    regenerarComboPreview, recarregarComboPreview,
    resetComboPreview, jaCarregouBuildAtual,
  } = comboPreview;

  // --- Navigation ---
  const navigation = useWizardNavigation(draftInicial, {
    nome, racaId, classeId, background,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
    skipVantagens: pointSystem.skipVantagens,
    skipDesvantagens: pointSystem.skipDesvantagens,
    bonusAplicados: bonusCalc.bonusAplicados,
    comboPreviewData,
  });

  // Invalidar bonusAplicados quando build muda (precisa de etapaAtual de navigation)
  const buildDepsRef = useRef({
    racaId, classeId,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
  });
  useEffect(() => {
    const prev = buildDepsRef.current;
    const changed = prev.racaId !== racaId
      || prev.classeId !== classeId
      || prev.vantagensIds !== pointSystem.vantagensIds
      || prev.desvantagensIds !== pointSystem.desvantagensIds;
    buildDepsRef.current = {
      racaId, classeId,
      vantagensIds: pointSystem.vantagensIds,
      desvantagensIds: pointSystem.desvantagensIds,
    };

    if (!changed) return;
    if (navigation.etapaAtual === 'boas_vindas') return;

    if (bonusCalc.bonusAplicados) {
      bonusCalc.setBonusAplicados(false);
      if (navigation.etapaAtual === 'resumo') {
        bonusCalc.setBonusInvalidado(true);
      }
    }
  }, [racaId, classeId, pointSystem.vantagensIds, pointSystem.desvantagensIds,
      navigation.etapaAtual, bonusCalc.bonusAplicados]);

  // Auto-load combo preview when on equipamentos stage and ready
  useEffect(() => {
    if (navigation.etapaAtual !== 'equipamentos') return;
    if (!podeGerarPreview) return;
    if (comboPreviewLoading) return;
    if (jaCarregouBuildAtual()) return;

    carregarComboPreview(0, []);
  }, [
    navigation.etapaAtual,
    podeGerarPreview,
    comboPreviewLoading,
    comboPreviewData,
    comboPreviewBuildKey,
    carregarComboPreview,
    jaCarregouBuildAtual,
  ]);

  // Aviso ao fechar aba
  useEffect(() => {
    const handler = (e) => {
      if (nome || racaId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [nome, racaId]);

  // Load catalogs on mount
  useEffect(() => {
    const loadAll = async () => {
      const promises = [];
      if (!racasCarregadas) promises.push(carregarRacas());
      if (!classesCarregadas) promises.push(carregarClasses());
      if (!vantagensCarregadas) promises.push(carregarVantagens());
      if (!desvantagensCarregadas) promises.push(carregarDesvantagens());
      if (promises.length > 0) await Promise.all(promises);
    };
    loadAll();
  }, []);

  // Draft save
  useEffect(() => {
    salvarDraft({
      etapaAtual: navigation.etapaAtual,
      nome, racaId, racaNome, classeId, classeNome, background,
      vantagensIds: pointSystem.vantagensIds,
      vantagensNomes: pointSystem.vantagensNomes,
      desvantagensIds: pointSystem.desvantagensIds,
      desvantagensNomes: pointSystem.desvantagensNomes,
      atributosBase: bonusCalc.atributosBase,
      bonusAplicados: bonusCalc.bonusAplicados,
      skipVantagens: pointSystem.skipVantagens,
      skipDesvantagens: pointSystem.skipDesvantagens,
      etapasVisitadas: navigation.etapasVisitadas,
      etapasConcluidas: navigation.etapasConcluidas,
    });
  }, [navigation.etapaAtual, nome, racaId, classeId, background,
      pointSystem.vantagensIds, pointSystem.desvantagensIds,
      bonusCalc.atributosBase, bonusCalc.bonusAplicados,
      pointSystem.skipVantagens, pointSystem.skipDesvantagens,
      navigation.etapasVisitadas, navigation.etapasConcluidas]);

  // Init wizard or restore draft
  const iniciarWizard = useCallback(async () => {
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: 'boas_vindas',
        estado: {},
        mensagemJogador: 'Olá, estou pronto para criar meu personagem!',
        historico: [],
        actionMode: 'enter_stage',
      });
      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        etapa: 'boas_vindas',
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);
      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
    } catch (err) {
      setError(err.message);
      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: '**Bem-vindo, aventureiro!** Você chega a uma taverna antiga onde pergaminhos e mapas cobrem as paredes. Um sábio ancião sorri ao vê-lo.\n\n*"Ah, mais um herói em busca de destino! Diga-me, como deseja ser chamado neste mundo?"*',
        etapa: 'boas_vindas',
        sugestoes: [],
        timestamp: new Date(),
      }]);
    } finally {
      setEnviando(false);
    }
  }, []);

  const mensagensRef = useRef();
  mensagensRef.current = mensagens;

  /** Monta o estado completo para enviar ao backend — lê sempre do ref (never stale) */
  const getEstado = useCallback(() => {
    const s = estadoRef.current;
    return {
      nome: s.nome,
      raca_id: s.racaId,
      raca_nome: s.racaNome,
      classe_id: s.classeId,
      classe_nome: s.classeNome,
      background: s.background,
      vantagens_ids: s.vantagensIds,
      vantagens_nomes: s.vantagensNomes,
      desvantagens_ids: s.desvantagensIds,
      desvantagens_nomes: s.desvantagensNomes,
      atributos: s.atributosFinal,
      // Vantagens/desvantagens concedidas por raça/classe
      vantagens_da_raca: s.vantagensDaRaca,
      desvantagens_da_raca: s.desvantagensDaRaca,
      vantagens_da_classe: s.vantagensDaClasse,
      desvantagens_da_classe: s.desvantagensDaClasse,
    };
  }, []);

  /** Histórico de chat para backend — lê sempre do ref (never stale) */
  const getHistorico = useCallback(() => {
    return mensagensRef.current.filter(m => m.role !== 'sistema').map(m => ({
      role: m.role === 'mestre' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, []);

  const rehidratarEtapaAtual = useCallback(async () => {
    const etapa = navigation.etapaAtual;
    if (!etapa || etapa === 'boas_vindas' || enviandoRef.current) return;

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa,
        estado: getEstado(),
        mensagemJogador: '',
        historico: [],
        actionMode: 'enter_stage',
      });

      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        etapa,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      setSugestoes(resultado.sugestoes || []);
      if (resultado.atributos_sugeridos) {
        bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);
      }
    } catch (err) {
      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'sistema',
        content: 'Nao foi possivel reabrir a fala do Mestre para esta etapa. Voce ainda pode seguir normalmente pelo painel da etapa.',
        etapa,
        timestamp: new Date(),
      }]);
      setSugestoes([]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [navigation.etapaAtual, getEstado, bonusCalc.setAtributosSugeridos]);

  useEffect(() => {
    if (wizardInitRef.current) return;
    wizardInitRef.current = true;

    if (draftInicial) {
      setDraftRestaurado(true);
      setMensagens([{
        id: Date.now(),
        role: 'sistema',
        content: '**Rascunho restaurado.** Seu progresso anterior foi recuperado. Voce pode continuar de onde parou ou descartar o rascunho para recomecar.',
        etapa: draftInicial.etapaAtual || 'boas_vindas',
        timestamp: new Date(),
      }]);
      if (draftInicial.etapaAtual && draftInicial.etapaAtual !== 'boas_vindas') {
        rehidratarEtapaAtual();
      }
      return;
    }

    iniciarWizard();
  }, [draftInicial, iniciarWizard, rehidratarEtapaAtual]);

  // --- Mestre Interaction ---
  const mestreInteraction = useMestreInteraction({
    setMensagens, setEnviando, enviandoRef, setSugestoes, setError,
    setInputTexto,
    navigation,
    nome, setNome, racaId, classeId, background, setBackground,
    setRacaId, setRacaNome, setClasseId, setClasseNome,
    pointSystem,
    bonusCalc,
    getEstado, getHistorico,
    estadoRef,
  });

  const {
    enviarMensagem, aplicarSugestaoAtributos, selecionarSugestao,
    avancarComMestre, pularEtapa,
  } = mestreInteraction;

  // --- Character Creation ---
  const characterCreation = useCharacterCreation({
    getEstado, navigate, comboPreviewData, comboPreviewLoading,
    navigation, bonusCalc, pointSystem,
    estadoRef, setError, limparDraft, recarregarPersonagens,
  });

  const {
    salvando, creationFlowStatus,
    creationResultModalOpen, creationResultData,
    salvarPersonagem, fecharResultadoCriacao,
    irParaPersonagens, verFichaCriada,
    setCreationFlowStatus, setCreationResultModalOpen, setCreationResultData,
  } = characterCreation;

  /** Descarta draft e reseta todo estado */
  const descartarDraft = useCallback(() => {
    limparDraft();
    navigation.resetarNavegacao();
    setNome('');
    setRacaId(null);
    setRacaNome('');
    setClasseId(null);
    setClasseNome('');
    setBackground('');
    pointSystem.resetarSelecoes();
    bonusCalc.resetarAtributos();
    setSugestoes([]);
    setDraftRestaurado(false);
    setMensagens([]);
    setError(null);
    resetComboPreview();
    setCreationFlowStatus('idle');
    setCreationResultModalOpen(false);
    setCreationResultData(null);
    iniciarWizard();
  }, [iniciarWizard, limparDraft, navigation.resetarNavegacao, pointSystem.resetarSelecoes, bonusCalc.resetarAtributos, resetComboPreview]);

  return {
    // Wizard / Navigation
    etapas: navigation.etapas,
    etapaAtual: navigation.etapaAtual,
    etapaIndex: navigation.etapaIndex,
    etapasVisitadas: navigation.etapasVisitadas,
    etapasConcluidas: navigation.etapasConcluidas,
    avancarComMestre,
    pularEtapa,
    navegarParaEtapa: navigation.navegarParaEtapa,

    // Chat
    mensagens,
    inputTexto,
    setInputTexto,
    enviando,
    sugestoes,
    chatEndRef,

    // Atributos
    atributosBase: bonusCalc.atributosBase,
    atributosFinal: bonusCalc.atributosFinal,
    atributosSugeridos: bonusCalc.atributosSugeridos,
    bonusAplicados: bonusCalc.bonusAplicados,
    bonusDetalhes: bonusCalc.bonusDetalhes,
    bonusFontes: bonusCalc.bonusFontes,
    bonusInvalidado: bonusCalc.bonusInvalidado,
    pontosDistribuidos: bonusCalc.pontosDistribuidos,
    pontosRestantes: bonusCalc.pontosRestantes,
    pontosTotais: bonusCalc.pontosTotais,
    attrMin: bonusCalc.attrMin,
    attrMax: bonusCalc.attrMax,
    confirmarAtributos: bonusCalc.confirmarAtributos,
    setAtributo: bonusCalc.setAtributo,
    aplicarAtributosSugeridos: aplicarSugestaoAtributos,

    // Personagem
    nome,
    racaId,
    racaNome,
    classeId,
    classeNome,
    background,
    vantagensIds: pointSystem.vantagensIds,
    vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds,
    desvantagensNomes: pointSystem.desvantagensNomes,
    skipVantagens: pointSystem.skipVantagens,
    setSkipVantagens: pointSystem.setSkipVantagens,
    skipDesvantagens: pointSystem.skipDesvantagens,
    setSkipDesvantagens: pointSystem.setSkipDesvantagens,

    // Pontos de criação
    pontosCriacaoTotal: pointSystem.pontosCriacaoTotal,
    pontosCriacaoRestantes: pointSystem.pontosCriacaoRestantes,
    pontosGastos: pointSystem.pontosGastos,
    pontosVantagem: pointSystem.pontosVantagem,
    pontosDesvantagem: pointSystem.pontosDesvantagem,
    custoRaca: pointSystem.custoRaca,
    custoClasse: pointSystem.custoClasse,
    maxCustoDesvantagem: pointSystem.maxCustoDesvantagem,

    // Catálogos
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,

    // Actions
    enviarMensagem,
    selecionarSugestao,
    removerSelecao: pointSystem.removerSelecao,
    salvarPersonagem,
    clearError: chat.clearError,

    // Draft
    draftRestaurado,
    descartarDraft,

    // Async
    salvando,
    error,

    // Resolutiva / Criacao
    comboPreviewData,
    comboPreviewLoading,
    comboPreviewErro,
    comboPreviewTentativa,
    comboPreviewBuildKey,
    podeGerarPreview,
    regenerarComboPreview,
    recarregarComboPreview,
    creationFlowStatus,
    creationResultModalOpen,
    creationResultData,
    fecharResultadoCriacao,
    irParaPersonagens,
    verFichaCriada,

    navigate,
  };
};
