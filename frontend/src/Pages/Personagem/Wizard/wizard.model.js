
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
import { tierDesbloqueado } from '../../../utils/evolucaoHelper.js';

export const useWizardModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);
  const chatEndRef = useRef(null);
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
  const enviandoRef = useRef(false);
  const [error, setError] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [finalizacaoData, setFinalizacaoData] = useState(null);
  const [finalizacaoLoading, setFinalizacaoLoading] = useState(false);

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

  /** Refs para evitar stale closures em getEstado/getHistorico */
  const estadoRef = useRef();
  estadoRef.current = {
    nome, racaId, racaNome, classeId, classeNome, background,
    vantagensIds: pointSystem.vantagensIds,
    vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds,
    desvantagensNomes: pointSystem.desvantagensNomes,
    atributosBase: bonusCalc.atributosBase,
    atributosFinal: bonusCalc.atributosFinal,
  };

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

  /** Envia mensagem textual do jogador */
  const enviarMensagem = useCallback(async (texto, options = {}) => {
    if (!texto?.trim() || enviandoRef.current) return;
    const mensagemJogador = texto.trim();
    const manterEtapa = options?.manterEtapa === true;
    const estadoOverride = {};

    if (navigation.etapaAtual === 'boas_vindas' && !estadoRef.current.nome) {
      setNome(mensagemJogador);
      estadoOverride.nome = mensagemJogador;
    } else if (navigation.etapaAtual === 'background') {
      const backgroundAtualizado = [estadoRef.current.background, mensagemJogador]
        .filter(Boolean)
        .join('\n')
        .slice(0, 2000);
      setBackground(backgroundAtualizado);
      estadoOverride.background = backgroundAtualizado;
    }

    setMensagens(prev => [...prev, {
      id: Date.now(),
      role: 'jogador',
      content: mensagemJogador,
      etapa: navigation.etapaAtual,
      timestamp: new Date(),
    }]);
    setInputTexto('');
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);

    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: navigation.etapaAtual,
        estado: { ...getEstado(), ...estadoOverride },
        mensagemJogador,
        historico: getHistorico(),
        actionMode: manterEtapa ? 'refresh_options' : 'reply',
      });

      const etapaMensagem = manterEtapa
        ? navigation.etapaAtual
        : (resultado.etapa_proxima || navigation.etapaAtual);

      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        etapa: etapaMensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      setSugestoes(resultado.sugestoes || []);
      if (resultado.atributos_sugeridos) bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);

      if (!manterEtapa && resultado.etapa_proxima && resultado.etapa_proxima !== navigation.etapaAtual) {
        navigation.registrarVisita(resultado.etapa_proxima);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [navigation.etapaAtual, getEstado, getHistorico, bonusCalc.setAtributosSugeridos, navigation.registrarVisita]);

  const aplicarSugestaoAtributos = useCallback(() => {
    const resultado = bonusCalc.aplicarAtributosSugeridos();
    if (!resultado?.applied) {
      setError(resultado?.reason || 'A sugestao de atributos do Mestre veio invalida e nao foi aplicada.');
      return resultado;
    }
    setError(null);
    return resultado;
  }, [bonusCalc.aplicarAtributosSugeridos]);


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

  /** P3: Chama backend com continue_stage e avanca somente apos resposta.
   *  Se backend rejeitar avanco (etapa_proxima === etapa_atual), permanece.
   *  Se backend falhar, avanca localmente como fallback.
   *  @param {Object} [estadoOverride] - sobrescreve campos em getEstado() (ex: skip limpa selecoes) */
  const avancarComMestre = useCallback(async (estadoOverride) => {
    if (enviandoRef.current) return;

    // Calcular destino esperado (read-only) para fallback e deteccao de revisit
    const info = navigation.getProximaEtapa();
    if (!info) return;

    const etapaAtual = navigation.etapaAtual;
    const estado = estadoOverride ? { ...getEstado(), ...estadoOverride } : getEstado();

    // Revisit: se a proxima etapa ja foi visitada, navegar sem chamar backend
    if (!info.primeiraVisita) {
      navigation.registrarVisita(info.etapa);
      setSugestoes([]);
      if (info.etapa !== 'atributos') {
        bonusCalc.setAtributosSugeridos(null);
      }
      return;
    }

    // Primeira visita: chamar backend ANTES de avancar
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: etapaAtual,
        estado,
        mensagemJogador: '',
        historico: getHistorico(),
        actionMode: 'continue_stage',
      });

      // Consumir etapa_proxima do backend como fonte de verdade
      const destino = resultado.etapa_proxima || info.etapa;

      if (destino !== etapaAtual) {
        navigation.registrarVisita(destino);
      }

      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        etapa: destino,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      setSugestoes(resultado.sugestoes || []);
      if (resultado.atributos_sugeridos) bonusCalc.setAtributosSugeridos(resultado.atributos_sugeridos);
    } catch (err) {
      // Fallback: avancar localmente se backend falhar
      navigation.avancarEtapa();
      setMensagens(prev => [...prev, {
        id: Date.now(),
        role: 'sistema',
        content: 'Nao foi possivel contatar o Mestre Criador. Continue normalmente ou envie uma mensagem.',
        etapa: info.etapa,
        timestamp: new Date(),
      }]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [navigation.getProximaEtapa, navigation.etapaAtual, navigation.registrarVisita, navigation.avancarEtapa, getEstado, getHistorico, bonusCalc.setAtributosSugeridos]);
  /** Pular etapa de vantagens ou desvantagens — limpa seleções + avança com estado correto */
  const pularEtapa = useCallback((tipo) => {
    if (tipo !== 'vantagens' && tipo !== 'desvantagens') return;
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

  /** Salva o personagem — lê do estadoRef para evitar stale closures */
  const salvarPersonagem = useCallback(async () => {
    const s = estadoRef.current;
    if (!s.nome?.trim()) { setError('Nome do personagem é obrigatório'); return; }
    if (!s.racaId) { setError('Selecione uma raça antes de salvar'); return; }
    if (!s.classeId) { setError('Selecione uma classe antes de salvar'); return; }
    if (!s.background?.trim()) { setError('Descreva a origem do personagem antes de salvar'); return; }
    if (!bonusCalc.bonusAplicados) {
      setError('Confirme seus atributos antes de salvar (aplique os bonus de raca/classe)');
      return;
    }
    if (pointSystem.pontosCriacaoRestantes < 0) {
      setError('A ficha excede o orcamento de criacao. Revise vantagens, desvantagens, linhagem ou vocacao antes de salvar.');
      return;
    }
    setSalvando(true);
    setError(null);

    try {
      const base = s.atributosBase;
      const dados = {
        nome: s.nome,
        raca_id: s.racaId,
        classe_id: s.classeId,
        sugestao_background: 'guiado',
        background: s.background,
        forca: base.forca,
        destreza: base.destreza,
        constituicao: base.constituicao,
        inteligencia: base.inteligencia,
        agilidade: base.agilidade,
        carisma: base.carisma,
        vantagens: s.vantagensIds,
        desvantagens: s.desvantagensIds,
        nivel: 1,
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem, { context: 'criacao' });

      // Background IA (fire-and-forget)
      if (criado?.id && s.background) {
        personagemService.gerarBackground(criado.id, s.background).catch(bgError => {
          console.warn('Background IA não gerado:', bgError.message);
        });
      }

      limparDraft();
      await recarregarPersonagens();

      // Tentar finalizacao inicial — se falhar, navegar normalmente
      if (criado?.id) {
        try {
          setFinalizacaoLoading(true);
          const finData = await personagemService.gerarFinalizacaoInicial(criado.id);
          setFinalizacaoData(finData);
        } catch (finError) {
          console.warn('Finalizacao inicial não disponivel:', finError.message);
          navigate('/personagens');
        } finally {
          setFinalizacaoLoading(false);
        }
      } else {
        navigate('/personagens');
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar personagem');
    } finally {
      setSalvando(false);
    }
  }, [bonusCalc.bonusAplicados, pointSystem.pontosCriacaoRestantes, navigate, recarregarPersonagens, limparDraft]);

  const clearError = useCallback(() => setError(null), []);

  const fecharFinalizacao = useCallback(() => {
    setFinalizacaoData(null);
    navigate('/personagens');
  }, [navigate]);

  const atualizarFinalizacaoData = useCallback((updater) => {
    setFinalizacaoData(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

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
    clearError,

    // Draft
    draftRestaurado,
    descartarDraft,

    // Async
    salvando,
    error,

    // Finalizacao
    finalizacaoData,
    finalizacaoLoading,
    fecharFinalizacao,
    atualizarFinalizacaoData,

    // Theme
    isLight,
    navigate,
  };
};




