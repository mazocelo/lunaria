import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mestreCriadorService, personagemService } from '../../../services/index.js';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';
import { Personagem } from '../../../models/Personagem';
import { useDraftPersistence } from './hooks/useDraftPersistence';
import { useWizardNavigation } from './hooks/useWizardNavigation';
import { useBonusCalculation } from './hooks/useBonusCalculation';
import { usePointSystem } from './hooks/usePointSystem';

export const useWizardModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);
  const chatEndRef = useRef(null);

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
  const vantagensDisponiveis = useMemo(() => {
    return [...(vantagens || []), ...(desvantagens || [])];
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

  // --- Navigation ---
  const navigation = useWizardNavigation(draftInicial, {
    nome, racaId, classeId, background,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
    skipVantagens: pointSystem.skipVantagens,
    skipDesvantagens: pointSystem.skipDesvantagens,
    bonusAplicados: bonusCalc.bonusAplicados,
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
      if (navigation.etapaAtual === 'resumo' || navigation.etapaAtual === 'refinamento') {
        bonusCalc.setBonusInvalidado(true);
      }
    }
  }, [racaId, classeId, pointSystem.vantagensIds, pointSystem.desvantagensIds,
      navigation.etapaAtual, bonusCalc.bonusAplicados]);

  // Chat state
  const [mensagens, setMensagens] = useState([]);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [gerandoBackground, setGerandoBackground] = useState(false);

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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

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
      });
      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
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
        sugestoes: [],
        timestamp: new Date(),
      }]);
    } finally {
      setEnviando(false);
    }
  }, []);

  useEffect(() => {
    if (draftInicial) {
      setDraftRestaurado(true);
      setMensagens([{
        id: Date.now(),
        role: 'sistema',
        content: '**Rascunho restaurado.** Seu progresso anterior foi recuperado. Você pode continuar de onde parou ou descartar o rascunho para recomeçar.',
        timestamp: new Date(),
      }]);
    } else {
      iniciarWizard();
    }
  }, []);

  /** Monta o estado completo para enviar ao backend */
  const getEstado = useCallback(() => ({
    nome,
    raca_id: racaId,
    raca_nome: racaNome,
    classe_id: classeId,
    classe_nome: classeNome,
    background,
    vantagens_ids: pointSystem.vantagensIds,
    vantagens_nomes: pointSystem.vantagensNomes,
    desvantagens_ids: pointSystem.desvantagensIds,
    desvantagens_nomes: pointSystem.desvantagensNomes,
    atributos: bonusCalc.atributosFinal,
  }), [nome, racaId, racaNome, classeId, classeNome, background,
       pointSystem.vantagensIds, pointSystem.vantagensNomes,
       pointSystem.desvantagensIds, pointSystem.desvantagensNomes,
       bonusCalc.atributosFinal]);

  /** Histórico de chat para backend */
  const getHistorico = useCallback(() => {
    return mensagens.filter(m => m.role !== 'sistema').map(m => ({
      role: m.role === 'mestre' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, [mensagens]);

  /** Envia mensagem textual do jogador */
  const enviarMensagem = useCallback(async (texto) => {
    if (!texto?.trim() || enviando) return;
    const mensagemJogador = texto.trim();

    if (navigation.etapaAtual === 'boas_vindas' && !nome) {
      setNome(mensagemJogador);
    } else if (navigation.etapaAtual === 'background') {
      setBackground(prev => prev ? `${prev}\n${mensagemJogador}` : mensagemJogador);
    }

    setMensagens(prev => [...prev, {
      id: Date.now(),
      role: 'jogador',
      content: mensagemJogador,
      timestamp: new Date(),
    }]);
    setInputTexto('');
    setEnviando(true);
    setError(null);

    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: navigation.etapaAtual,
        estado: { ...getEstado(), nome: navigation.etapaAtual === 'boas_vindas' ? mensagemJogador : nome },
        mensagemJogador,
        historico: getHistorico(),
      });

      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
      else setSugestoes([]);

      if (resultado.atributos_sugeridos) bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);

      if (resultado.etapa_proxima && resultado.etapa_proxima !== navigation.etapaAtual) {
        navigation.registrarVisita(resultado.etapa_proxima);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }, [navigation.etapaAtual, nome, enviando, getEstado, getHistorico]);

  /** Seleciona sugestão silenciosamente (T1) */
  const selecionarSugestao = useCallback((sugestao) => {
    const { tipo, id, nome: sugestaoNome, custo } = sugestao;

    switch (tipo) {
      case 'raca':
        setRacaId(id);
        setRacaNome(sugestaoNome);
        break;
      case 'classe':
        setClasseId(id);
        setClasseNome(sugestaoNome);
        break;
      case 'vantagem': {
        const erro = pointSystem.selecionarVantagemDesvantagem(tipo, id, sugestaoNome, custo);
        if (erro) { setError(erro); return; }
        // P2: reset skip ao selecionar manualmente
        pointSystem.setSkipVantagens(false);
        break;
      }
      case 'desvantagem': {
        const erro = pointSystem.selecionarVantagemDesvantagem(tipo, id, sugestaoNome, custo);
        if (erro) { setError(erro); return; }
        // P2: reset skip ao selecionar manualmente
        pointSystem.setSkipDesvantagens(false);
        break;
      }
    }
  }, [pointSystem.selecionarVantagemDesvantagem, pointSystem.setSkipVantagens, pointSystem.setSkipDesvantagens]);

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
    iniciarWizard();
  }, [iniciarWizard, limparDraft, navigation.resetarNavegacao, pointSystem.resetarSelecoes, bonusCalc.resetarAtributos]);

  /** P3: Avança etapa + dispara resposta do Mestre na primeira visita.
   *  @param {Object} [estadoOverride] - se fornecido, sobrescreve campos em getEstado() (ex: skip limpa seleções) */
  const avancarComMestre = useCallback(async (estadoOverride) => {
    if (enviando) return;
    const result = navigation.avancarEtapa();
    if (!result) return;

    const { etapa, primeiraVisita } = result;
    if (!primeiraVisita) return;

    // Primeira visita — buscar resposta do Mestre
    setEnviando(true);
    try {
      const estado = estadoOverride ? { ...getEstado(), ...estadoOverride } : getEstado();
      const resultado = await mestreCriadorService.interagir({
        etapa,
        estado,
        mensagemJogador: '',
        historico: getHistorico(),
      });

      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
      else setSugestoes([]);

      if (resultado.atributos_sugeridos) bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);
    } catch {
      // Graceful degradation — não faz rollback, insere mensagem de sistema
      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'sistema',
        content: 'Não foi possível contatar o Mestre Criador. Continue normalmente ou envie uma mensagem.',
        timestamp: new Date(),
      }]);
    } finally {
      setEnviando(false);
    }
  }, [enviando, navigation.avancarEtapa, getEstado, getHistorico]);

  /** Pular etapa de vantagens ou desvantagens — limpa seleções + avança com estado correto */
  const pularEtapa = useCallback((tipo) => {
    const override = {};
    if (tipo === 'vantagens') {
      pointSystem.vantagensIds.forEach(id => pointSystem.removerSelecao('vantagem', id));
      pointSystem.setSkipVantagens(true);
      override.vantagens_ids = [];
      override.vantagens_nomes = [];
    } else {
      pointSystem.desvantagensIds.forEach(id => pointSystem.removerSelecao('desvantagem', id));
      pointSystem.setSkipDesvantagens(true);
      override.desvantagens_ids = [];
      override.desvantagens_nomes = [];
    }
    avancarComMestre(override);
  }, [avancarComMestre, pointSystem]);

  /** Salva o personagem */
  const salvarPersonagem = useCallback(async () => {
    if (!nome.trim()) { setError('Nome do personagem é obrigatório'); return; }
    if (!racaId) { setError('Selecione uma raça antes de salvar'); return; }
    if (!classeId) { setError('Selecione uma classe antes de salvar'); return; }
    if (!background.trim()) { setError('Preencha o background antes de salvar'); return; }
    if (!bonusCalc.bonusAplicados) {
      setError('Confirme seus atributos antes de salvar (aplique os bônus de raça/classe)');
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      const dados = {
        nome,
        raca_id: racaId || undefined,
        classe_id: classeId || undefined,
        sugestao_background: 'guiado',
        background,
        historias: [],
        forca: bonusCalc.atributosFinal.forca,
        destreza: bonusCalc.atributosFinal.destreza,
        constituicao: bonusCalc.atributosFinal.constituicao,
        inteligencia: bonusCalc.atributosFinal.inteligencia,
        agilidade: bonusCalc.atributosFinal.agilidade,
        carisma: bonusCalc.atributosFinal.carisma,
        vantagens: pointSystem.vantagensIds,
        desvantagens: pointSystem.desvantagensIds,
        nivel: 1,
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem);

      if (criado?.id && background) {
        try {
          setGerandoBackground(true);
          await personagemService.gerarBackground(criado.id, background);
        } catch (bgError) {
          console.warn('Background IA não gerado:', bgError.message);
        } finally {
          setGerandoBackground(false);
        }
      }

      limparDraft();
      await recarregarPersonagens();
      navigate('/personagens');
    } catch (err) {
      setError(err.message || 'Erro ao criar personagem');
    } finally {
      setSalvando(false);
    }
  }, [nome, racaId, classeId, background, bonusCalc.atributosFinal, bonusCalc.bonusAplicados,
      pointSystem.vantagensIds, pointSystem.desvantagensIds, navigate, recarregarPersonagens, limparDraft]);

  const clearError = useCallback(() => setError(null), []);

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
    bonusInvalidado: bonusCalc.bonusInvalidado,
    pontosDistribuidos: bonusCalc.pontosDistribuidos,
    pontosRestantes: bonusCalc.pontosRestantes,
    pontosTotais: bonusCalc.pontosTotais,
    attrMin: bonusCalc.attrMin,
    attrMax: bonusCalc.attrMax,
    confirmarAtributos: bonusCalc.confirmarAtributos,
    setAtributo: bonusCalc.setAtributo,
    aplicarAtributosSugeridos: bonusCalc.aplicarAtributosSugeridos,

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
    maxDesvantagens: pointSystem.maxDesvantagens,

    // Catálogos
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,

    // Actions
    enviarMensagem,
    selecionarSugestao,
    removerSelecao: pointSystem.removerSelecao,
    salvarPersonagem,
    clearError,

    // Draft
    draftRestaurado,
    descartarDraft,

    // Async
    salvando,
    gerandoBackground,
    error,

    // Theme
    isLight,
    navigate,
  };
};
