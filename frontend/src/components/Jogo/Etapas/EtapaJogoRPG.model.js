import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiClient, personagemService } from '../../../services';
import { useSocketStore, useGameStore } from '../../../store/index.js';
import { TIMEOUTS, PARTICLES } from '../../../constants/game';
import { calcularMana } from '../../../utils/rpgHelpers';
import { formatarInformacoesPersonagem, formatarParticipantes } from './EtapaJogoRPG.utils.js';

import { useVoice } from './hooks/useVoice.js';
import { useSocketMirror } from './hooks/useSocketMirror.js';
import { useMessageInput } from './hooks/useMessageInput.js';
import { useDiceAndTurns } from './hooks/useDiceAndTurns.js';
import { useFichaModal } from './hooks/useFichaModal.js';

export const useEtapaJogoRPGModel = ({
  historia,
  personagemSelecionado,
  participantes,
  mensagens,
  user,
  onAdicionarMensagem,
  onSair
}) => {
  // Ref para evitar stale closure no onAdicionarMensagem
  const onAdicionarMensagemRef = useRef(onAdicionarMensagem);
  useEffect(() => {
    onAdicionarMensagemRef.current = onAdicionarMensagem;
  }, [onAdicionarMensagem]);

  // === Sub-hooks ===
  const { effectiveVoiceId, effectiveVoiceProvider } = useVoice(historia, mensagens);

  const socketMirror = useSocketMirror(user, onAdicionarMensagemRef);
  const {
    faseJogo, rodadaAtual, turnoAtual, jogadorAtual,
    ordemJogadores, ordemDefinida, resultadosDados,
    ehMeuTurno, turnoIniciado, turnoStatus,
    testePendente, testesPendentes,
    cooldownRoleplay, combateAtivo, combateMonstros,
    combateJogadores, combateRodada, combateResultado,
    combateLog, combateXpGanho, sessionRecap,
    levelUpData, setLevelUpData,
    gameStoreAtualizarMensagem,
  } = socketMirror;
  const inRoom = useSocketStore(s => s.inRoom);
  const sessionRecapVisivel = inRoom ? sessionRecap : null;

  const clearSessionRecap = useCallback(() => {
    useSocketStore.setState({ sessionRecap: null });
  }, []);

  // Domain G: Cooldown roleplay local timer
  const [cooldownLocal, setCooldownLocal] = useState(0);
  const cooldownIntervalRef = useRef(null);

  useEffect(() => {
    if (cooldownLocal > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownLocal(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, TIMEOUTS.COOLDOWN_TICK);
    }
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [cooldownLocal]);

  const messageInput = useMessageInput(
    historia, personagemSelecionado, user, onAdicionarMensagem,
    faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal
  );

  const diceAndTurns = useDiceAndTurns(historia, personagemSelecionado, user, onAdicionarMensagem);

  const fichaModal = useFichaModal(personagemSelecionado, user);

  // Domain K: Habilidades e Magias (hidratação do personagem completo)
  useEffect(() => {
    if (!personagemSelecionado?.id) return;
    if (personagemSelecionado.habilidadesClasse) return; // já hidratado
    personagemService.getById(personagemSelecionado.id).then(res => {
      const data = res.data?.data || res.data;
      if (data) {
        useGameStore.setState({
          personagemSelecionado: {
            ...personagemSelecionado,
            habilidadesClasse: data.habilidadesClasse || [],
            magias: data.magias || [],
          }
        });
      }
    }).catch(() => {});
  }, [personagemSelecionado?.id]);

  const habilidadesPersonagem = personagemSelecionado?.habilidadesClasse || [];
  const magiasPersonagem = personagemSelecionado?.magias || [];

  // Cooldowns e concentração do combate
  const combateStats = combateJogadores?.[user?.id] || {};
  const cooldownsHabilidades = combateStats.cooldowns || {};
  const concentracaoAtiva = combateStats.concentracao || null;

  // Domain L: UI Layout
  const [mobileDrawer, setMobileDrawer] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [showRodadaInfo, setShowRodadaInfo] = useState(false);
  const rodadaDropdownRef = useRef(null);
  const [inventarioAberto, setInventarioAberto] = useState(false);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rodadaDropdownRef.current && !rodadaDropdownRef.current.contains(event.target)) {
        setShowRodadaInfo(false);
      }
    };
    if (showRodadaInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRodadaInfo]);

  const toggleActions = useCallback(() => {
    setShowActions(prev => !prev);
    setRightPanelExpanded(true);
  }, []);

  // Domain M: Image context
  const entidadesComImagem = useMemo(() => {
    const roteiro = historia?.roteiro;
    if (!roteiro) return [];
    const itens = [];
    (roteiro.npcs || []).forEach(npc => {
      if (npc.imagem) {
        itens.push({
          nome: npc.nome, imagem: npc.imagem, tipo: 'npc',
          descricao: npc.descricao || '', papel: npc.papel || '',
          local: npc.local || '', motivacao: npc.motivacao || '',
          segredo: npc.segredo || ''
        });
      }
    });
    (roteiro.locais || []).forEach(local => {
      if (local.imagem) {
        itens.push({
          nome: local.nome, imagem: local.imagem, tipo: 'local',
          descricao: local.descricao || '', categoria: local.tipo || '',
          perigo: local.perigo || ''
        });
      }
    });
    return itens;
  }, [historia?.roteiro]);

  const contextoImagemCena = useMemo(() => {
    const temasRaw = historia?.temas;
    const temas = Array.isArray(temasRaw)
      ? temasRaw.map((t) => {
          if (typeof t === 'string' || typeof t === 'number') return String(t);
          return t?.nome || t?.name || t?.label || '';
        }).filter(Boolean)
      : [];

    return {
      temas,
      historiaNome: historia?.nome || '',
      historiaDescricao: historia?.descricao || '',
      historiaPrologo: historia?.prologo || ''
    };
  }, [historia?.temas, historia?.nome, historia?.descricao, historia?.prologo]);

  const handleSceneImageGenerated = useCallback(async (mensagemId, url) => {
    const salaId = `historia_${historia?.id}`;
    gameStoreAtualizarMensagem(mensagemId, { scene_image: url });
    try {
      const { apiClient: api } = await import('../../../services');
      await api.patch(`/sessoes/${salaId}/mensagem/${mensagemId}`, { campos: { scene_image: url } });
    } catch (_) { /* silent */ }
  }, [historia?.id, gameStoreAtualizarMensagem]);

  // Domain N: Participants display
  const infoPersonagem = formatarInformacoesPersonagem(personagemSelecionado);
  const participantesFormatados = formatarParticipantes(participantes, user);

  // Derived state
  const testesPendentesAtivos = Array.isArray(testesPendentes)
    ? testesPendentes.filter((teste) => teste?.status !== 'resolved' && teste?.status !== 'cancelled')
    : [];
  const meuTestePendente = testesPendentesAtivos.find(
    (teste) => String(teste.jogadorAlvo) === String(user?.id)
  ) || (
    testePendente && String(testePendente.jogadorAlvo) === String(user?.id)
      ? testePendente
      : null
  );
  const dadosSolicitados = !!meuTestePendente;
  const dadoSolicitadoInfo = meuTestePendente
    ? {
        testeId: meuTestePendente.id || null,
        groupId: meuTestePendente.groupId || null,
        tipoDado: meuTestePendente.tipoDado || 'd20',
        teste: meuTestePendente.teste || '',
        dificuldade: meuTestePendente.metadata?.dificuldadeLabel || meuTestePendente.dificuldade || 'Media',
        atributo: meuTestePendente.atributo || null,
        contexto: meuTestePendente.contexto || null,
        modificador: meuTestePendente.modificador ?? null
      }
    : null;
  const aguardandoRespostaMestre = useSocketStore(s => s.aguardandoRespostaMestre);
  const mestrePensando = useSocketStore(s => s.mestrePensando);
  const mestreTimedOut = useSocketStore(s => s.mestreTimedOut);
  const mestreStale = useSocketStore(s => s.mestreStale);
  const pendingMestreRequestId = useSocketStore(s => s.pendingMestreRequestId);
  const pendingMestreRequestKind = useSocketStore(s => s.pendingMestreRequestKind);
  const activeMestreRequestId = useSocketStore(s => s.activeMestreRequestId);
  const activeMestreRequestStatus = useSocketStore(s => s.activeMestreRequestStatus);
  const activeMestreRequestUserId = useSocketStore(s => s.activeMestreRequestUserId);
  const lastRegenerableMestreRequest = useSocketStore(s => s.lastRegenerableMestreRequest);
  const mestreRequestIsMine = !!activeMestreRequestUserId && String(activeMestreRequestUserId) === String(user?.id);
  const aguardandoMestre = turnoStatus === 'resolving_roll'
    || !!pendingMestreRequestId
    || (!!activeMestreRequestId && ['accepted', 'processing', 'streaming', 'reviewing'].includes(activeMestreRequestStatus))
    || aguardandoRespostaMestre;
  const jaRolouDadoInicial = !!resultadosDados[user?.id];
  const socketStoreSafeEmit = useSocketStore(s => s.safeEmit);

  const handleMestreBannerAction = useCallback(() => {
    if (!activeMestreRequestId || !mestreRequestIsMine) return;
    const roomId = `historia_${historia?.id}`;

    if (mestreStale) {
      socketStoreSafeEmit('consultar_mestre_request', {
        roomId,
        userId: String(user?.id),
        requestId: activeMestreRequestId
      });
      return;
    }

    if (['failed', 'timed_out'].includes(activeMestreRequestStatus)) {
      useSocketStore.setState({
        mestreTimedOut: false,
        mestreStale: false,
        pendingMestreRequestId: activeMestreRequestId,
        pendingMestreRequestKind: lastRegenerableMestreRequest?.kind || pendingMestreRequestKind || 'player_action',
        pendingMestreSentAt: new Date().toISOString()
      });
      socketStoreSafeEmit('regenerar_resposta_mestre', {
        roomId,
        userId: String(user?.id),
        requestId: activeMestreRequestId
      });
    }
  }, [activeMestreRequestId, activeMestreRequestStatus, historia?.id, lastRegenerableMestreRequest?.kind, mestreRequestIsMine, mestreStale, pendingMestreRequestKind, socketStoreSafeEmit, user?.id]);

  const jogadoresExibir = participantesFormatados.length > 0
    ? participantesFormatados
    : ordemJogadores.map(j => ({
        userId: j.userId,
        username: j.username,
        personagem: j.personagemNome,
        personagemNome: j.personagemNome,
        valorDado: j.valorDado,
        isCurrentUser: String(j.userId) === String(user?.id),
        status: j.status || 'online'
      }));

  return {
    // Props passthrough
    historia, personagemSelecionado, participantes, mensagens, user, onSair,

    // Voice
    effectiveVoiceId, effectiveVoiceProvider,

    // Socket/game state
    faseJogo, rodadaAtual, turnoAtual, jogadorAtual,
    ordemJogadores, ordemDefinida, resultadosDados,
    ehMeuTurno, turnoIniciado, turnoStatus,
    combateAtivo, combateMonstros, combateJogadores,
    combateRodada, combateResultado, combateLog, combateXpGanho,
    sessionRecap: sessionRecapVisivel, clearSessionRecap,
    levelUpData, setLevelUpData,

    // Message input
    ...messageInput,

    // Dice & turns
    ...diceAndTurns,

    // Ficha modal
    ...fichaModal,

    // UI layout
    mobileDrawer, setMobileDrawer,
    showActions, toggleActions,
    rightPanelExpanded, setRightPanelExpanded,
    showRodadaInfo, setShowRodadaInfo,
    rodadaDropdownRef,
    inventarioAberto, setInventarioAberto,

    // Habilidades e Magias
    habilidadesPersonagem,
    magiasPersonagem,
    cooldownsHabilidades,
    concentracaoAtiva,

    // Derived
    infoPersonagem, participantesFormatados, jogadoresExibir,
    dadosSolicitados, dadoSolicitadoInfo, aguardandoMestre, mestrePensando,
    mestreTimedOut, mestreStale, activeMestreRequestStatus, mestreRequestIsMine, handleMestreBannerAction,
    jaRolouDadoInicial, cooldownLocal,
    entidadesComImagem, contextoImagemCena, handleSceneImageGenerated,

    // Mana (computed)
    manaAtual: combateJogadores?.[user?.id]?.mana_atual ?? calcularMana(personagemSelecionado),
    manaMax: combateJogadores?.[user?.id]?.mana_max ?? calcularMana(personagemSelecionado),
  };
};
