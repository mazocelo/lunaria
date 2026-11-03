import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { personagemService } from '../../../services';
import { useSocketStore, useGameStore } from '../../../store/index';
import { TIMEOUTS } from '../../../constants/game';
import { calcularMana } from '../../../utils/rpgHelpers';
import { getOwnedCombatActions } from '../../../utils/characterOwnedActions';
import { formatarInformacoesPersonagem, formatarParticipantes } from './EtapaJogoRPG.utils';
import { findMentionedEntities } from '../Chat/renderers';

import { useVoice } from './hooks/useVoice';
import { useSocketMirror } from './hooks/useSocketMirror';
import { useMessageInput } from './hooks/useMessageInput';
import { useDiceAndTurns } from './hooks/useDiceAndTurns';
import { useFichaModal } from './hooks/useFichaModal';

interface User {
  id?: number | string;
  nome?: string;
  name?: string;
  [key: string]: unknown;
}

interface Historia {
  id?: number | string;
  nome?: string;
  [key: string]: unknown;
}

interface PersonagemSel {
  id?: number | string;
  nome?: string;
  [key: string]: unknown;
}

interface Participante {
  userId?: number | string;
  username?: string;
  [key: string]: unknown;
}

interface Mensagem {
  id?: number | string;
  tipo?: string;
  message?: string;
  [key: string]: unknown;
}

interface SceneImage {
  url?: string;
  nome: string;
  tipo: string;
}

interface UseEtapaJogoRPGModelParams {
  historia: Historia;
  personagemSelecionado: PersonagemSel;
  participantes: Participante[];
  mensagens: Mensagem[];
  user: User;
  onAdicionarMensagem: (m: Mensagem) => void;
  onSair: () => void;
}

export const useEtapaJogoRPGModel = ({
  historia,
  personagemSelecionado,
  participantes,
  mensagens,
  user,
  onAdicionarMensagem,
  onSair
}: UseEtapaJogoRPGModelParams) => {
  // Ref para evitar stale closure no onAdicionarMensagem
  const onAdicionarMensagemRef = useRef(onAdicionarMensagem);
  useEffect(() => {
    onAdicionarMensagemRef.current = onAdicionarMensagem;
  }, [onAdicionarMensagem]);

  // === Sub-hooks ===
  const { effectiveVoiceId, effectiveVoiceProvider } = useVoice(historia, mensagens);

  const socketMirror = useSocketMirror(user, onAdicionarMensagemRef as unknown as Parameters<typeof useSocketMirror>[1]);
  const {
    faseJogo, rodadaAtual, turnoAtual, jogadorAtual,
    ordemJogadores, ordemDefinida, resultadosDados,
    ehMeuTurno, turnoIniciado, turnoStatus,
    testePendente, testesPendentes,
    cooldownRoleplay: _cooldownRoleplay, combateAtivo, combateFase, combateMonstros,
    combateJogadores, combateRodada, combateResultado,
    combateLog, combateXpGanho, combateOrdemIniciativa,
    combateTurnoAtual, combateIniciativaPendente, combateIniciativaModificador,
    sessionRecap,
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
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    historia, personagemSelecionado, user, onAdicionarMensagem as Parameters<typeof useMessageInput>[3],
    faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal, combateAtivo
  );

  const diceAndTurns = useDiceAndTurns(historia, personagemSelecionado, user, onAdicionarMensagem as Parameters<typeof useDiceAndTurns>[3]);

  const fichaModal = useFichaModal(personagemSelecionado, user);

  // Domain K: Habilidades e Magias (hidratação do personagem completo)
  useEffect(() => {
    if (!personagemSelecionado?.id) return;
    personagemService.getById(Number(personagemSelecionado.id)).then((res) => {
      const r = res as { data?: { data?: unknown } | unknown };
      const data = (r?.data && typeof r.data === 'object' && 'data' in r.data) ? (r.data as { data?: unknown }).data : (r?.data ?? r);
      if (data) {
        useGameStore.setState({
          personagemSelecionado: {
            ...personagemSelecionado,
            ...(data as Record<string, unknown>),
          },
        } as unknown as Parameters<typeof useGameStore.setState>[0]);
      }
    }).catch(() => {});
  }, [personagemSelecionado?.id]);

  const ownedCombatActions = useMemo(
    () => getOwnedCombatActions(personagemSelecionado || {}),
    [personagemSelecionado]
  );
  const habilidadesPersonagem = ownedCombatActions.habilidades;
  const magiasPersonagem = ownedCombatActions.magias;

  // Cooldowns e concentração do combate
  const combateJogadoresMap = (combateJogadores ?? {}) as Record<string, { cooldowns?: Record<string, unknown>; concentracao?: unknown }>;
  const combateStats = combateJogadoresMap[String(user?.id ?? '')] || {};
  const cooldownsHabilidades = combateStats.cooldowns || {};
  const concentracaoAtiva = combateStats.concentracao || null;

  // Domain L: UI Layout
  const [mobileDrawer, setMobileDrawer] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [showRodadaInfo, setShowRodadaInfo] = useState(false);
  const rodadaDropdownRef = useRef<HTMLDivElement | null>(null);
  const [inventarioAberto, setInventarioAberto] = useState(false);
  const [grimorioAberto, setGrimorioAberto] = useState(false);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rodadaDropdownRef.current && !rodadaDropdownRef.current.contains(event.target as Node)) {
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
  interface EntidadeComImagem {
    nome: string;
    imagem: string;
    tipo: string;
    descricao?: string;
    papel?: string;
    local?: string;
    motivacao?: string;
    segredo?: string;
    categoria?: string;
    perigo?: string;
  }

  const entidadesComImagem = useMemo<EntidadeComImagem[]>(() => {
    const roteiro = historia?.roteiro as { npcs?: Array<Record<string, string>>; locais?: Array<Record<string, string>> } | undefined;
    if (!roteiro) return [];
    const itens: EntidadeComImagem[] = [];
    (roteiro.npcs || []).forEach((npc) => {
      if (npc.imagem) {
        itens.push({
          nome: npc.nome, imagem: npc.imagem, tipo: 'npc',
          descricao: npc.descricao || '', papel: npc.papel || '',
          local: npc.local || '', motivacao: npc.motivacao || '',
          segredo: npc.segredo || ''
        });
      }
    });
    (roteiro.locais || []).forEach((local) => {
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

  // Domain M2: Scene transition + session gallery
  const [sceneTransitionImage, setSceneTransitionImage] = useState<SceneImage | null>(null);
  const [sessionImages, setSessionImages] = useState<SceneImage[]>([]);
  const seenMessageIdsRef = useRef<Set<number | string>>(new Set());

  // Detecta novos locais/NPCs mencionados nas mensagens do Mestre e dispara transição
  useEffect(() => {
    if (!mensagens?.length || !entidadesComImagem.length) return;

    // Inicializa o set de IDs já vistos (sem disparar transição no carregamento inicial)
    const isFirstLoad = seenMessageIdsRef.current.size === 0 && mensagens.length > 0;
    if (isFirstLoad) {
      mensagens.forEach(m => { if (m.id != null) seenMessageIdsRef.current.add(m.id); });
      return;
    }

    const newMestreMsgs = mensagens.filter(
      m => (m.tipo || (m as { type?: string }).type) === 'mestre' && m.id != null && !seenMessageIdsRef.current.has(m.id)
    );
    if (!newMestreMsgs.length) return;

    newMestreMsgs.forEach(m => { if (m.id != null) seenMessageIdsRef.current.add(m.id); });

    // Procura só locais (tipo: 'local') para trigger de transição
    for (const msg of newMestreMsgs) {
      const text = String(msg.message || msg.mensagem || '');
      const mencionados = findMentionedEntities(text, entidadesComImagem);
      const localMencionado = mencionados.find(e => e.tipo === 'local');
      if (localMencionado) {
        setSceneTransitionImage({ url: localMencionado.imagem, nome: localMencionado.nome, tipo: 'local' });
        // Acumula na galeria
        setSessionImages(prev => {
          const jaExiste = prev.some(i => i.url === localMencionado.imagem);
          return jaExiste ? prev : [{ url: localMencionado.imagem, nome: localMencionado.nome, tipo: 'local' }, ...prev];
        });
        break; // uma transição por vez
      }
    }
  }, [mensagens, entidadesComImagem]);

  const handleSceneTransitionDone = useCallback(() => setSceneTransitionImage(null), []);

  // Acumula imagens de cena geradas durante a sessão na galeria
  const handleSceneImageGenerated = useCallback(async (mensagemId: number | string, url: string) => {
    const salaId = `historia_${historia?.id}`;
    gameStoreAtualizarMensagem(mensagemId, { scene_image: url });
    setSessionImages(prev => {
      const jaExiste = prev.some(i => i.url === url);
      return jaExiste ? prev : [{ url, nome: 'Cena', tipo: 'cena' }, ...prev];
    });
    try {
      const { apiClient: api } = await import('../../../services');
      await api.patch(`/sessoes/${salaId}/mensagem/${mensagemId}`, { campos: { scene_image: url } });
    } catch { /* silent */ }
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
        groupId: (meuTestePendente as { groupId?: unknown }).groupId || null,
        tipoDado: (meuTestePendente as { tipoDado?: string }).tipoDado || 'd20',
        teste: (meuTestePendente as { teste?: string }).teste || '',
        dificuldade: ((meuTestePendente as { metadata?: { dificuldadeLabel?: string } }).metadata?.dificuldadeLabel) || (meuTestePendente as { dificuldade?: string }).dificuldade || 'Media',
        atributo: (meuTestePendente as { atributo?: unknown }).atributo || null,
        contexto: (meuTestePendente as { contexto?: unknown }).contexto || null,
        modificador: (meuTestePendente as { modificador?: unknown }).modificador ?? null
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
    || (!!activeMestreRequestId && ['accepted', 'processing', 'streaming', 'reviewing'].includes(String(activeMestreRequestStatus ?? '')))
    || aguardandoRespostaMestre;
  const jaRolouDadoInicial = !!(resultadosDados as Record<string, unknown>)[String(user?.id ?? '')];
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

    if (['failed', 'timed_out'].includes(String(activeMestreRequestStatus ?? ''))) {
      useSocketStore.setState({
        mestreTimedOut: false,
        mestreStale: false,
        pendingMestreRequestId: activeMestreRequestId,
        pendingMestreRequestKind: ((lastRegenerableMestreRequest as { kind?: string } | null | undefined)?.kind) || pendingMestreRequestKind || 'player_action',
        pendingMestreSentAt: new Date().toISOString()
      } as unknown as Parameters<typeof useSocketStore.setState>[0]);
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
    combateAtivo, combateFase, combateMonstros, combateJogadores,
    combateRodada, combateResultado, combateLog, combateXpGanho,
    combateOrdemIniciativa, combateTurnoAtual,
    combateIniciativaPendente, combateIniciativaModificador,
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
    grimorioAberto, setGrimorioAberto,

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
    sceneTransitionImage, handleSceneTransitionDone,
    sessionImages,

    // Mana (computed)
    manaAtual: (combateJogadoresMap[String(user?.id ?? '')] as { mana_atual?: number } | undefined)?.mana_atual ?? calcularMana(personagemSelecionado as unknown as Parameters<typeof calcularMana>[0]),
    manaMax: (combateJogadoresMap[String(user?.id ?? '')] as { mana_max?: number } | undefined)?.mana_max ?? calcularMana(personagemSelecionado as unknown as Parameters<typeof calcularMana>[0]),
  };
};

export type EtapaJogoRPGModel = ReturnType<typeof useEtapaJogoRPGModel>;
