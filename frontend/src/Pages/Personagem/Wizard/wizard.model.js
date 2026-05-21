
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useCharacterImage } from './hooks/useCharacterImage';
import { useGrimorio } from './hooks/useGrimorio';
import { useWizardInit } from './hooks/useWizardInit';
import { tierDesbloqueado } from '../../../utils/evolucaoHelper.js';

export const useWizardModel = ({ navigate }) => {
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);

  // --- Zustand store subscriptions ---
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

  // --- Sub-hooks: point system & bonus ---
  const pointSystem = usePointSystem({
    draftInicial, vantagensDisponiveis,
    vantagensStore: vantagens, desvantagensStore: desvantagens,
    racaId, classeId, racasDisponiveis, classesDisponiveis,
  });
  const bonusCalc = useBonusCalculation({
    draftInicial, racaId, classeId,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
    racasDisponiveis, classesDisponiveis, vantagensDisponiveis,
  });

  // --- Chat State ---
  const chat = useChatState();
  const { mensagens, setMensagens, inputTexto, setInputTexto,
    enviando, setEnviando, enviandoRef,
    sugestoes, setSugestoes, error, setError, chatEndRef } = chat;

  // --- estadoRef / mensagensRef (always-fresh snapshots) ---
  const estadoRef = useRef();
  const racaSelecionada = racaId ? racas.find(r => String(r.id) === String(racaId)) : null;
  const classeSelecionada = classeId ? classes.find(c => String(c.id) === String(classeId)) : null;
  estadoRef.current = {
    nome, racaId, racaNome, classeId, classeNome, background,
    vantagensIds: pointSystem.vantagensIds, vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds, desvantagensNomes: pointSystem.desvantagensNomes,
    atributosBase: bonusCalc.atributosBase, atributosFinal: bonusCalc.atributosFinal,
    vantagensDaRaca: racaSelecionada?.vantagens?.map(v => v.nome || v) || [],
    desvantagensDaRaca: racaSelecionada?.desvantagens?.map(d => d.nome || d) || [],
    vantagensDaClasse: classeSelecionada?.vantagens?.map(v => v.nome || v) || [],
    desvantagensDaClasse: classeSelecionada?.desvantagens?.map(d => d.nome || d) || [],
  };
  const mensagensRef = useRef();
  mensagensRef.current = mensagens;

  // --- getEstado / getHistorico ---
  const getEstado = useCallback(() => {
    const s = estadoRef.current;
    return {
      nome: s.nome, raca_id: s.racaId, raca_nome: s.racaNome,
      classe_id: s.classeId, classe_nome: s.classeNome, background: s.background,
      vantagens_ids: s.vantagensIds, vantagens_nomes: s.vantagensNomes,
      desvantagens_ids: s.desvantagensIds, desvantagens_nomes: s.desvantagensNomes,
      atributos: s.atributosFinal,
      vantagens_da_raca: s.vantagensDaRaca, desvantagens_da_raca: s.desvantagensDaRaca,
      vantagens_da_classe: s.vantagensDaClasse, desvantagens_da_classe: s.desvantagensDaClasse,
    };
  }, []);
  const getHistorico = useCallback(() => {
    return mensagensRef.current.filter(m => m.role !== 'sistema').map(m => ({
      role: m.role === 'mestre' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, []);

  // --- Sub-hooks: combo preview & navigation ---
  const comboPreview = useComboPreview({
    nome, racaId, classeId, background,
    bonusAplicados: bonusCalc.bonusAplicados,
    pontosCriacaoRestantes: pointSystem.pontosCriacaoRestantes,
    vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds,
    atributosBase: bonusCalc.atributosBase,
    etapaAtual: null, estadoRef,
  });
  const grimorio = useGrimorio({ racaId, racasDisponiveis });
  const navigation = useWizardNavigation(draftInicial, {
    nome, racaId, classeId, background,
    vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds,
    skipVantagens: pointSystem.skipVantagens, skipDesvantagens: pointSystem.skipDesvantagens,
    bonusAplicados: bonusCalc.bonusAplicados, comboPreviewData: comboPreview.comboPreviewData,
    grimorioSelecionado: grimorio.grimorioSelecionado,
  });

  // --- Orchestration effects ---

  // Invalidate bonusAplicados when build changes
  const buildDepsRef = useRef({ racaId, classeId,
    vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds });
  useEffect(() => {
    const prev = buildDepsRef.current;
    const changed = prev.racaId !== racaId || prev.classeId !== classeId
      || prev.vantagensIds !== pointSystem.vantagensIds
      || prev.desvantagensIds !== pointSystem.desvantagensIds;
    buildDepsRef.current = { racaId, classeId,
      vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds };
    if (!changed || navigation.etapaAtual === 'boas_vindas') return;
    if (bonusCalc.bonusAplicados) {
      bonusCalc.setBonusAplicados(false);
      if (navigation.etapaAtual === 'resumo') bonusCalc.setBonusInvalidado(true);
    }
  }, [racaId, classeId, pointSystem.vantagensIds, pointSystem.desvantagensIds,
      navigation.etapaAtual, bonusCalc.bonusAplicados]);

  // Auto-load combo preview on equipamentos stage
  useEffect(() => {
    if (navigation.etapaAtual !== 'equipamentos') return;
    if (!comboPreview.podeGerarPreview || comboPreview.comboPreviewLoading) return;
    if (comboPreview.jaCarregouBuildAtual()) return;
    comboPreview.carregarComboPreview(0, []);
  }, [navigation.etapaAtual, comboPreview.podeGerarPreview,
      comboPreview.comboPreviewLoading, comboPreview.comboPreviewData,
      comboPreview.comboPreviewBuildKey, comboPreview.carregarComboPreview,
      comboPreview.jaCarregouBuildAtual]);

  // Auto-load grimorio na etapa grimorio; auto-pula se a raca nao usa magia
  useEffect(() => {
    if (navigation.etapaAtual !== 'grimorio') return;
    if (!classeId) return;
    if (grimorio.devePularGrimorio) {
      grimorio.confirmarGrimorio();
      navigation.avancarEtapa();
      return;
    }
    grimorio.carregarGrimorio(classeId);
  }, [navigation.etapaAtual, classeId, grimorio.devePularGrimorio]);

  // Auto-pula grimorio so apos o GET /slots responder (grimorioCarregado): sem a
  // guarda, o effect rodaria no mount com slots=0 inicial e pularia indevidamente.
  // O skip depende de grimorioCarregado, nao de !grimorioSelecionado, porque
  // carregarGrimorio ja marca grimorioSelecionado quando ha 0 slots.
  useEffect(() => {
    if (navigation.etapaAtual !== 'grimorio') return;
    if (grimorio.grimorioLoading) return;
    if (!grimorio.grimorioCarregado) return;
    if (grimorio.grimorioSlots === 0) {
      grimorio.confirmarGrimorio();
      navigation.avancarEtapa();
    }
  }, [navigation.etapaAtual, grimorio.grimorioLoading, grimorio.grimorioCarregado, grimorio.grimorioSlots]);

  // Reset grimorio when class changes
  useEffect(() => {
    grimorio.resetGrimorio();
  }, [classeId]);

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
      vantagensIds: pointSystem.vantagensIds, vantagensNomes: pointSystem.vantagensNomes,
      desvantagensIds: pointSystem.desvantagensIds, desvantagensNomes: pointSystem.desvantagensNomes,
      atributosBase: bonusCalc.atributosBase, bonusAplicados: bonusCalc.bonusAplicados,
      skipVantagens: pointSystem.skipVantagens, skipDesvantagens: pointSystem.skipDesvantagens,
      etapasVisitadas: navigation.etapasVisitadas, etapasConcluidas: navigation.etapasConcluidas,
    });
  }, [navigation.etapaAtual, nome, racaId, classeId, background,
      pointSystem.vantagensIds, pointSystem.desvantagensIds,
      bonusCalc.atributosBase, bonusCalc.bonusAplicados,
      pointSystem.skipVantagens, pointSystem.skipDesvantagens,
      navigation.etapasVisitadas, navigation.etapasConcluidas]);

  // --- Sub-hooks: mestre interaction, character creation, wizard init ---
  const mestreInteraction = useMestreInteraction({
    setMensagens, setEnviando, enviandoRef, setSugestoes, setError, setInputTexto,
    navigation, nome, setNome, racaId, classeId, background, setBackground,
    setRacaId, setRacaNome, setClasseId, setClasseNome,
    pointSystem, bonusCalc, getEstado, getHistorico, estadoRef,
  });
  const characterImage = useCharacterImage();
  const characterCreation = useCharacterCreation({
    getEstado, navigate, comboPreviewData: comboPreview.comboPreviewData,
    comboPreviewLoading: comboPreview.comboPreviewLoading,
    navigation, bonusCalc, pointSystem,
    estadoRef, setError, limparDraft, recarregarPersonagens,
    imageUrl: characterImage.imageUrl,
    grimorioSelecionadas: grimorio.grimorioSelecionadas,
  });
  const { descartarDraft } = useWizardInit({
    chat, navigation, nome, racaId,
    setNome, setRacaId, setRacaNome, setClasseId, setClasseNome, setBackground,
    pointSystem, bonusCalc, creation: characterCreation,
    draftInicial, limparDraft, setDraftRestaurado,
    getEstado, comboPreview,
  });

  // Grimorio: confirmar selecao e avancar
  const confirmarEAvancarGrimorio = useCallback(() => {
    grimorio.confirmarGrimorio();
    navigation.avancarEtapa();
  }, [grimorio.confirmarGrimorio, navigation.avancarEtapa]);

  // --- Return ---
  return {
    // Navigation
    etapas: navigation.etapas, etapaAtual: navigation.etapaAtual,
    etapaIndex: navigation.etapaIndex, etapasVisitadas: navigation.etapasVisitadas,
    etapasConcluidas: navigation.etapasConcluidas,
    avancarComMestre: mestreInteraction.avancarComMestre,
    pularEtapa: mestreInteraction.pularEtapa,
    navegarParaEtapa: navigation.navegarParaEtapa,
    // Chat
    mensagens, inputTexto, setInputTexto, enviando, sugestoes, chatEndRef,
    // Atributos
    atributosBase: bonusCalc.atributosBase, atributosFinal: bonusCalc.atributosFinal,
    atributosSugeridos: bonusCalc.atributosSugeridos,
    bonusAplicados: bonusCalc.bonusAplicados, bonusDetalhes: bonusCalc.bonusDetalhes,
    bonusFontes: bonusCalc.bonusFontes, bonusInvalidado: bonusCalc.bonusInvalidado,
    pontosDistribuidos: bonusCalc.pontosDistribuidos,
    pontosRestantes: bonusCalc.pontosRestantes, pontosTotais: bonusCalc.pontosTotais,
    attrMin: bonusCalc.attrMin, attrMax: bonusCalc.attrMax,
    confirmarAtributos: bonusCalc.confirmarAtributos, setAtributo: bonusCalc.setAtributo,
    aplicarAtributosSugeridos: mestreInteraction.aplicarSugestaoAtributos,
    // Personagem
    nome, racaId, racaNome, classeId, classeNome, background,
    vantagensIds: pointSystem.vantagensIds, vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds, desvantagensNomes: pointSystem.desvantagensNomes,
    skipVantagens: pointSystem.skipVantagens, setSkipVantagens: pointSystem.setSkipVantagens,
    skipDesvantagens: pointSystem.skipDesvantagens, setSkipDesvantagens: pointSystem.setSkipDesvantagens,
    // Pontos de criação
    pontosCriacaoTotal: pointSystem.pontosCriacaoTotal,
    pontosCriacaoRestantes: pointSystem.pontosCriacaoRestantes,
    pontosGastos: pointSystem.pontosGastos, pontosVantagem: pointSystem.pontosVantagem,
    pontosDesvantagem: pointSystem.pontosDesvantagem,
    custoRaca: pointSystem.custoRaca, custoClasse: pointSystem.custoClasse,
    maxCustoDesvantagem: pointSystem.maxCustoDesvantagem,
    // Catálogos
    racasDisponiveis, classesDisponiveis, vantagensDisponiveis,
    // Actions
    enviarMensagem: mestreInteraction.enviarMensagem,
    selecionarSugestao: mestreInteraction.selecionarSugestao,
    removerSelecao: pointSystem.removerSelecao,
    salvarPersonagem: characterCreation.salvarPersonagem,
    clearError: chat.clearError,
    // Draft
    draftRestaurado, descartarDraft,
    // Async
    salvando: characterCreation.salvando, error,
    // Resolutiva / Criacao
    comboPreviewData: comboPreview.comboPreviewData,
    comboPreviewLoading: comboPreview.comboPreviewLoading,
    comboPreviewErro: comboPreview.comboPreviewErro,
    comboPreviewTentativa: comboPreview.comboPreviewTentativa,
    comboPreviewBuildKey: comboPreview.comboPreviewBuildKey,
    podeGerarPreview: comboPreview.podeGerarPreview,
    regenerarComboPreview: comboPreview.regenerarComboPreview,
    recarregarComboPreview: comboPreview.recarregarComboPreview,
    creationFlowStatus: characterCreation.creationFlowStatus,
    creationResultModalOpen: characterCreation.creationResultModalOpen,
    creationResultData: characterCreation.creationResultData,
    fecharResultadoCriacao: characterCreation.fecharResultadoCriacao,
    irParaPersonagens: characterCreation.irParaPersonagens,
    verFichaCriada: characterCreation.verFichaCriada,
    // Character image
    imageUrl: characterImage.imageUrl,
    imageLoading: characterImage.imageLoading,
    imageError: characterImage.imageError,
    gerarImagem: characterImage.gerarImagem,
    resetImage: characterImage.resetImage,
    // Grimorio
    grimorioMagias: grimorio.grimorioMagias,
    grimorioSlots: grimorio.grimorioSlots,
    grimorioSelecionadas: grimorio.grimorioSelecionadas,
    grimorioLoading: grimorio.grimorioLoading,
    grimorioError: grimorio.grimorioError,
    grimorioSelecionado: grimorio.grimorioSelecionado,
    toggleGrimorioMagia: grimorio.toggleGrimorioMagia,
    confirmarGrimorio: confirmarEAvancarGrimorio,
    navigate,
  };
};
