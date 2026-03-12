import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RPGActions } from '../../RPGActions';
import BackgroundEffects from '../Shared/BackgroundEffects';
import PainelJogadores from '../Chat/PainelJogadores';
import ChatArea from '../Chat/ChatArea';
import InputArea from '../Chat/InputArea';
import StatusPersonagem from '../Gameplay/StatusPersonagem';
import RolagemDadosInicial from '../Gameplay/RolagemDadosInicial';
import BatalhaUI from '../Gameplay/BatalhaUI';
import InventarioPanel from '../Gameplay/InventarioPanel';
import LevelUpCelebration from '../Gameplay/LevelUpCelebration';
import SessionRecap from '../Gameplay/SessionRecap';
import NotificationManager, { showGameNotification } from '../NotificationManager';
import BarraStatusCompacta from '../Gameplay/BarraStatusCompacta';
import FichaPersonagemModal from '../Modals/FichaPersonagemModal';
import { personagemService, apiClient } from '../../../services';
import { TIMEOUTS, ROLEPLAY_COOLDOWN_SECONDS, PARTICLES } from '../../../constants/game';
import { useTheme } from '../../../contexts/theme.jsx';
import { useSocketStore, useGameStore } from '../../../store/index.js';
import { calcularMana } from '../../../utils/rpgHelpers';

// --- Helper functions (antes no ViewModel) ---

const extrairFacesDoDado = (tipoDado) => {
  if (!tipoDado || typeof tipoDado !== 'string') return 20;
  const match = tipoDado.match(/d(\d+)/);
  return match ? parseInt(match[1]) : 20;
};

const rolarDados = (tipoDado = 'd20', descricao = '') => {
  const faces = extrairFacesDoDado(tipoDado);
  const resultado = Math.floor(Math.random() * faces) + 1;
  const conteudo = descricao
    ? `🎲 ${descricao}: ${resultado} (${tipoDado})`
    : `🎲 Voce rolou: ${resultado} (${tipoDado})`;
  return {
    resultado,
    tipoDado,
    descricao,
    mensagem: {
      id: Date.now() + Math.random(),
      autor: 'Sistema',
      conteudo,
      tipo: 'dado',
      timestamp: new Date()
    }
  };
};

const formatarInformacoesPersonagem = (personagem) => {
  if (!personagem) {
    return { nome: 'Personagem nao encontrado', classe: 'Desconhecida', raca: 'Desconhecida', nivel: '1', hp: '???', mp: '???', xp: '0' };
  }
  const manaMax = calcularMana(personagem);
  return {
    nome: personagem.nome || 'Personagem sem nome',
    classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
    raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
    nivel: personagem.nivel || '1',
    hp: personagem.hp_atual || personagem.hp || '???',
    mp: manaMax,
    xp: personagem.xp || '0',
  };
};

const formatarParticipantes = (participantes, user) => {
  if (!Array.isArray(participantes)) return [];
  return participantes
    .filter(p => p.userId !== user?.id)
    .map(participante => ({
      ...participante,
      username: participante.username || 'Jogador',
      personagem: participante.personagem || 'Personagem',
      isOwner: participante.isOwner || false,
      status: participante.status || 'online',
    }));
};

/**
 * Layout do jogo RPG ativo
 * Usado por: JogoView (etapa 'jogo-ativo')
 * Refatorado: Usa hooks diretos (useSocketStore, useGameStore) no lugar de ViewModels
 * Sistema de turnos: Integrado com fases, rodadas e turnos
 */
const EtapaJogoRPG = ({
  historia,
  personagemSelecionado,
  participantes,
  mensagens,
  statusPersonagem,
  isDonoSala,
  socketConnected,
  user,
  onAdicionarMensagem,
  onAtualizarStatus,
  onSair
}) => {
  // Theme
  const { theme, toggleTheme } = useTheme();

  // Entidades do roteiro que possuem imagem (NPCs e Locais)
  const entidadesComImagem = useMemo(() => {
    const roteiro = historia?.roteiro;
    if (!roteiro) return [];
    const itens = [];
    (roteiro.npcs || []).forEach(npc => {
      if (npc.imagem) {
        itens.push({
          nome: npc.nome,
          imagem: npc.imagem,
          tipo: 'npc',
          descricao: npc.descricao || '',
          papel: npc.papel || '',
          local: npc.local || '',
          motivacao: npc.motivacao || '',
          segredo: npc.segredo || ''
        });
      }
    });
    (roteiro.locais || []).forEach(local => {
      if (local.imagem) {
        itens.push({
          nome: local.nome,
          imagem: local.imagem,
          tipo: 'local',
          descricao: local.descricao || '',
          categoria: local.tipo || '',
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

  // Socket store - acesso direto via hooks
  const socketStoreOn = useSocketStore(s => s.on);
  const socketStoreOff = useSocketStore(s => s.off);
  const socketStoreSafeEmit = useSocketStore(s => s.safeEmit);
  const socketStoreRolarDadoInicial = useSocketStore(s => s.rolarDadoInicial);
  const socketStoreIniciarTurno = useSocketStore(s => s.iniciarTurno);

  // Game store - para mensagens
  const gameStoreMensagens = useGameStore(s => s.mensagens);
  const gameStoreSetMensagens = useGameStore(s => s.setMensagens);
  const gameStoreAtualizarMensagem = useGameStore(s => s.atualizarMensagem);

  // --- Estado local (antes no ViewModel etapaJogoRPGViewModel) ---
  const [mobileDrawer, setMobileDrawer] = useState(null); // 'jogadores' | 'acoes' | null
  const [showActions, setShowActions] = useState(false);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [typingTimeout, setTypingTimeoutState] = useState(null);

  // Socket state (turnos e rodadas)
  const [socketState, setSocketState] = useState({
    faseJogo: 'aguardando_inicio',
    rodadaAtual: 1,
    turnoAtual: 0,
    jogadorAtual: null,
    ordemJogadores: [],
    ordemDefinida: false,
    resultadosDados: {},
    ehMeuTurno: false,
    turnoIniciado: false,
    turnoStatus: 'idle',
    testePendente: null,
    cooldownRoleplay: 0,
    combateAtivo: false,
    combateMonstros: [],
    combateJogadores: {},
    combateRodada: 0,
    combateResultado: null,
    combateLog: [],
    combateXpGanho: 0,
    sessionRecap: null
  });

  // Timer local para cooldown roleplay
  const [cooldownLocal, setCooldownLocal] = useState(0);
  const cooldownIntervalRef = useRef(null);

  useEffect(() => {
    const testePendente = socketState.testePendente;
    const meuTeste = testePendente && String(testePendente.jogadorAlvo) === String(user?.id);

    if (!meuTeste) {
      setDadosSolicitados(false);
      setDadoSolicitadoInfo(null);
    } else {
      setDadosSolicitados(true);
      setDadoSolicitadoInfo(prev => ({
        ...prev,
        tipoDado: testePendente.tipoDado || prev?.tipoDado || 'd20',
        teste: testePendente.teste || prev?.teste || '',
        dificuldade: testePendente.dificuldade || prev?.dificuldade || 'Media',
        atributo: testePendente.atributo || prev?.atributo || null,
        contexto: testePendente.contexto || prev?.contexto || null
      }));
    }

    setAguardandoMestre(socketState.turnoStatus === 'resolving_roll');
  }, [socketState.testePendente, socketState.turnoStatus, user?.id]);

  // Estado para dropdown de informacoes da rodada
  const [showRodadaInfo, setShowRodadaInfo] = useState(false);
  // Estado para collapse do painel direito
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const rodadaDropdownRef = useRef(null);

  // Estado para controlar solicitacao de dados do Mestre
  const [dadosSolicitados, setDadosSolicitados] = useState(false);
  const [dadoSolicitadoInfo, setDadoSolicitadoInfo] = useState(null);
  const [aguardandoMestre, setAguardandoMestre] = useState(false);
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [fichaCarregando, setFichaCarregando] = useState(false);
  const [fichaErro, setFichaErro] = useState(null);
  const [tituloFicha, setTituloFicha] = useState('Ficha do Personagem');
  const [fichasCache, setFichasCache] = useState({});
  // Inventario + Level Up + Habilidades
  const [inventarioAberto, setInventarioAberto] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [levelUpQueue, setLevelUpQueue] = useState([]);
  const [habilidadesPersonagem, setHabilidadesPersonagem] = useState([]);
  const [cooldownsHabilidades, setCooldownsHabilidades] = useState({});

  // Consumir fila de level-ups sequencialmente
  useEffect(() => {
    if (!levelUpData && levelUpQueue.length > 0) {
      const [next, ...rest] = levelUpQueue;
      setLevelUpData(next);
      setLevelUpQueue(rest);
    }
  }, [levelUpData, levelUpQueue]);

  // Buscar habilidades do personagem por classe e nivel
  useEffect(() => {
    if (!personagemSelecionado?.classe_id) return;
    apiClient.get('/catalogos/habilidades', {
      params: { classe_id: personagemSelecionado.classe_id, nivel: personagemSelecionado.nivel || 1 }
    }).then(res => {
      if (res.data?.success) setHabilidadesPersonagem(res.data.data || []);
    }).catch(() => {});
  }, [personagemSelecionado?.classe_id, personagemSelecionado?.nivel]);

  // Ref para evitar stale closure no onAdicionarMensagem
  const onAdicionarMensagemRef = useRef(onAdicionarMensagem);
  useEffect(() => {
    onAdicionarMensagemRef.current = onAdicionarMensagem;
  }, [onAdicionarMensagem]);

  // Subscribe ao socket store (para estados de turnos)
  useEffect(() => {
    const extractSocketState = (state) => ({
      faseJogo: state.faseJogo ?? 'aguardando_inicio',
      rodadaAtual: state.rodadaAtual ?? 1,
      turnoAtual: state.turnoAtual ?? 0,
      jogadorAtual: state.jogadorAtual ?? null,
      ordemJogadores: state.ordemJogadores ?? [],
      ordemDefinida: state.ordemDefinida ?? false,
      resultadosDados: state.resultadosDados ?? {},
      ehMeuTurno: state.ehMeuTurno ?? false,
      turnoIniciado: state.turnoIniciado ?? false,
      turnoStatus: state.turnoStatus ?? 'idle',
      testePendente: state.testePendente ?? null,
      cooldownRoleplay: state.cooldownRoleplay ?? 0,
      combateAtivo: state.combateAtivo ?? false,
      combateMonstros: state.combateMonstros ?? [],
      combateJogadores: state.combateJogadores ?? {},
      combateRodada: state.combateRodada ?? 0,
      combateResultado: state.combateResultado ?? null,
      combateLog: state.combateLog ?? [],
      combateXpGanho: state.combateXpGanho ?? 0,
      sessionRecap: state.sessionRecap ?? null
    });

    // Ler estado inicial
    const initialState = useSocketStore.getState();
    setSocketState(extractSocketState(initialState));

    // Subscribe para mudancas
    const unsubscribe = useSocketStore.subscribe((state) => {
      setSocketState(extractSocketState(state));
    });

    return () => unsubscribe();
  }, []);

  // Timer para decrementar cooldown local
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

  // Timeout de seguranca para aguardandoMestre (30s)
  useEffect(() => {
    if (!aguardandoMestre) return;
    const timeout = setTimeout(() => {
      setAguardandoMestre(false);
      showGameNotification('O Mestre demorou para responder. Tente novamente.', 'warning');
      // Remover mensagens de loading
      const msgs = useGameStore.getState().mensagens || [];
      const semLoading = msgs.filter(m => m.tipo !== 'loading');
      if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [aguardandoMestre, gameStoreSetMensagens]);

  // Limpar loading e aguardandoMestre se socket desconectar
  useEffect(() => {
    let wasConnected = useSocketStore.getState().isConnected;
    const unsubscribe = useSocketStore.subscribe((state) => {
      if (wasConnected && !state.isConnected && aguardandoMestre) {
        setAguardandoMestre(false);
        const msgs = useGameStore.getState().mensagens || [];
        const semLoading = msgs.filter(m => m.tipo !== 'loading');
        if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
      }
      wasConnected = state.isConnected;
    });
    return unsubscribe;
  }, [aguardandoMestre, gameStoreSetMensagens]);

  // Listener para limpar mensagens de dados quando ordem definida
  useEffect(() => {
    const limparMensagensDados = () => {
      const mensagensAtuais = useGameStore.getState().mensagens || [];
      const mensagensFiltradas = mensagensAtuais.filter(m => m.tipo === 'mestre' || m.tipo === 'entre_rodadas');
      gameStoreSetMensagens(mensagensFiltradas);
    };

    window.addEventListener('limparMensagensDados', limparMensagensDados);
    return () => window.removeEventListener('limparMensagensDados', limparMensagensDados);
  }, [gameStoreSetMensagens]);

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

  // Listeners para mensagens do Mestre e jogadores
  useEffect(() => {
    // Listener para mensagens do Mestre
    const handleMensagemMestre = (data) => {
      // Remover mensagens de loading
      const mensagensAtuais = useGameStore.getState().mensagens || [];
      const mensagensSemLoading = mensagensAtuais.filter(m => m.tipo !== 'loading');
      if (mensagensAtuais.length !== mensagensSemLoading.length) {
        gameStoreSetMensagens(mensagensSemLoading);
      }

      setAguardandoMestre(false);
      setDadosSolicitados(false);
      setDadoSolicitadoInfo(null);

      const mensagem = {
        id: data.id || Date.now(),
        userId: 'mestre',
        username: 'Mestre',
        message: data.message,
        tipo: 'mestre',
        timestamp: data.timestamp || Date.now()
      };

      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleChatMessage = (data) => {
      if (data.userId !== 'mestre' && data.tipo !== 'mestre') {
        if (onAdicionarMensagemRef.current) {
          onAdicionarMensagemRef.current(data);
        }
      }
    };

    const handleResultadoDado = (data) => {
      const mensagem = {
        id: data.id || `dado_${Date.now()}`,
        userId: data.userId,
        username: data.username,
        personagemNome: data.personagemNome,
        valor: data.valor,
        dice: 'd20',
        tipo: 'dado',
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleMensagemRoleplay = (data) => {
      const mensagem = {
        id: data.id || Date.now(),
        userId: data.userId,
        username: data.username,
        message: data.message,
        tipo: 'roleplay',
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleRodadaFinalizada = (data) => {
      const mensagem = {
        id: `rodada_${data.rodada}_fim`,
        tipo: 'entre_rodadas',
        titulo: `Fim da Rodada ${data.rodada}`,
        mensagem: `A rodada ${data.rodada} foi concluida. Preparando proxima rodada...`,
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleOrdemDefinida = () => {
      const event = new CustomEvent('limparMensagensDados');
      window.dispatchEvent(event);
    };

    const handleDiceRoll = (data) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const foiEuQueRolei = String(data.userId) === String(currentUser.id);
      if (foiEuQueRolei) {
        if (data.dadosSolicitados) {
          setDadosSolicitados(false);
          setDadoSolicitadoInfo(null);
          setAguardandoMestre(true);
        }
      }
      if (data.dadosSolicitados) return;

      const mensagem = {
        id: data.id || `dice_${Date.now()}`,
        userId: data.userId,
        username: data.username,
        dice: data.dice,
        result: data.result,
        tipo: 'dado',
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleResultadoTeste = (data) => {
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: `teste_${Date.now()}`,
          userId: data.username,
          username: data.username,
          dice: data.dice || 'd20',
          result: data.rolagemBruta,
          rolagemBruta: data.rolagemBruta,
          modificador: data.modificador,
          bonusNivel: data.bonusNivel,
          totalModificador: data.totalModificador,
          atributoNome: data.atributoNome,
          bonusVantDesvant: data.bonusVantDesvant,
          detalhesBonus: data.detalhesBonus,
          total: data.total,
          dc: data.dc,
          sucesso: data.sucesso,
          descricaoResultado: data.descricaoResultado,
          tipo: 'dado',
          timestamp: data.timestamp || Date.now()
        });
      }
    };

    const handleMestreSolicitaDados = (data) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const jogadorAlvo = String(data?.testePendente?.jogadorAlvo || currentUser.id);
      if (String(jogadorAlvo) !== String(currentUser.id)) {
        return;
      }
      setDadosSolicitados(true);
      setDadoSolicitadoInfo({
        tipoDado: data.tipoDado || 'd20',
        teste: data.teste || '',
        dificuldade: data.dificuldade || 'Media',
        modificador: data.modificador || 0,
        atributo: data.atributo || null,
        contexto: data.contexto || null
      });
      setAguardandoMestre(false);
    };

    const handleLevelUp = (data) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (String(data.userId) === String(currentUser.id)) {
        setLevelUpQueue(prev => [...prev, {
          novoNivel: data.novoNivel || data.nivel,
          ganhos: data.ganhos || {}
        }]);
      }
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: `levelup_${Date.now()}_${data.novoNivel}`,
          tipo: 'mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `🎉 **${data.personagemNome || data.username || 'Jogador'}** subiu para o **Nivel ${data.novoNivel || data.nivel}**!`,
          timestamp: Date.now()
        });
      }
    };

    const handleAcaoMestre = (data) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const ehMeu = String(data.userId) === String(currentUser.id);
      if (data.tipo === 'item_recebido' && ehMeu) {
        if (data.item) showGameNotification(`Item recebido: ${data.item.nome || 'Novo item'}`, 'success');
      } else if (data.tipo === 'item_removido' && ehMeu) {
        const nomeItem = data.item?.nome || data.itemNome;
        if (nomeItem) showGameNotification(`Item removido: ${nomeItem}`, 'warning');
      } else if (data.tipo === 'curado' && ehMeu) {
        showGameNotification(`+${data.hp_restaurado || 0} HP restaurado!`, 'success');
      } else if (data.tipo === 'dano_recebido' && ehMeu) {
        if (data.imune) {
          showGameNotification(`Imune ao dano${data.elemento ? ` de ${data.elemento}` : ''}!`, 'info');
        } else {
          showGameNotification(`-${data.dano} HP${data.elemento ? ` (${data.elemento})` : ''}${data.derrotado ? ' - Derrotado!' : ''}`, 'error');
        }
      } else if (data.tipo === 'status_aplicado' && ehMeu) {
        showGameNotification(`Status: ${data.status} (${data.duracao || 3} turnos)`, 'warning');
      } else if (data.tipo === 'status_removido' && ehMeu) {
        showGameNotification(`Status removido: ${data.status}`, 'info');
      }
    };

    const handleCombateFinalizado = (data) => {
      const xpPorJogador = data.xpPorJogador || 0;
      if (xpPorJogador > 0) {
        showGameNotification(`+${xpPorJogador} XP ganho no combate!`, 'success');
      }
      if (onAdicionarMensagemRef.current) {
        const resultado = data.resultado === 'vitoria' ? 'Vitoria!' : data.resultado === 'derrota' ? 'Derrota...' : 'Combate encerrado';
        onAdicionarMensagemRef.current({
          id: `combate_fim_${Date.now()}`,
          tipo: 'mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `${resultado}${xpPorJogador > 0 ? ` (+${xpPorJogador} XP)` : ''}`,
          timestamp: Date.now()
        });
      }
    };

    const handleCombateLoot = (data) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const meusItens = data.lootPorJogador?.[String(currentUser.id)] || [];
      if (meusItens.length > 0) {
        const nomes = meusItens.map(i => i.nome).join(', ');
        showGameNotification(`Loot recebido: ${nomes}`, 'success');
      }
      if (onAdicionarMensagemRef.current && data.todosItens?.length > 0) {
        const listaItens = data.todosItens.map(i => i.nome).join(', ');
        onAdicionarMensagemRef.current({
          id: `loot_${Date.now()}`,
          tipo: 'mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `Loot obtido: ${listaItens}`,
          timestamp: Date.now()
        });
      }
    };

    const handleErroMensagem = (data) => {
      setAguardandoMestre(false);
      if (data?.message) showGameNotification(data.message, 'warning');
      // Remover loading messages
      const msgs = useGameStore.getState().mensagens || [];
      const semLoading = msgs.filter(m => m.tipo !== 'loading');
      if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
    };

    // Adicionar listeners
    socketStoreOn('mensagem_mestre', handleMensagemMestre);
    socketStoreOn('chat_message', handleChatMessage);
    socketStoreOn('resultado_dado_inicial', handleResultadoDado);
    socketStoreOn('mensagem_roleplay', handleMensagemRoleplay);
    socketStoreOn('rodada_finalizada', handleRodadaFinalizada);
    socketStoreOn('ordem_definida', handleOrdemDefinida);
    socketStoreOn('dice_roll', handleDiceRoll);
    socketStoreOn('resultado_teste', handleResultadoTeste);
    socketStoreOn('mestre_solicita_dados', handleMestreSolicitaDados);
    socketStoreOn('solicitacao_dados', handleMestreSolicitaDados);
    socketStoreOn('level_up', handleLevelUp);
    socketStoreOn('acao_mestre', handleAcaoMestre);
    socketStoreOn('combate_finalizado', handleCombateFinalizado);
    socketStoreOn('combate_loot', handleCombateLoot);
    socketStoreOn('erro_mensagem', handleErroMensagem);

    return () => {
      socketStoreOff('mensagem_mestre', handleMensagemMestre);
      socketStoreOff('chat_message', handleChatMessage);
      socketStoreOff('resultado_dado_inicial', handleResultadoDado);
      socketStoreOff('mensagem_roleplay', handleMensagemRoleplay);
      socketStoreOff('rodada_finalizada', handleRodadaFinalizada);
      socketStoreOff('ordem_definida', handleOrdemDefinida);
      socketStoreOff('dice_roll', handleDiceRoll);
      socketStoreOff('resultado_teste', handleResultadoTeste);
      socketStoreOff('mestre_solicita_dados', handleMestreSolicitaDados);
      socketStoreOff('solicitacao_dados', handleMestreSolicitaDados);
      socketStoreOff('level_up', handleLevelUp);
      socketStoreOff('acao_mestre', handleAcaoMestre);
      socketStoreOff('combate_finalizado', handleCombateFinalizado);
      socketStoreOff('combate_loot', handleCombateLoot);
      socketStoreOff('erro_mensagem', handleErroMensagem);
    };
  }, [socketStoreOn, socketStoreOff, gameStoreSetMensagens]);

  // Formatar dados
  const infoPersonagem = formatarInformacoesPersonagem(personagemSelecionado);
  const participantesFormatados = formatarParticipantes(participantes, user);

  // Handlers
  const handleMensagemChange = (e) => {
    setMensagemAtual(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  // Persiste scene_image de mensagem do mestre no backend (Redis/DB)
  const handleSceneImageGenerated = useCallback(async (mensagemId, url) => {
    const salaId = `historia_${historia?.id}`;
    gameStoreAtualizarMensagem(mensagemId, { scene_image: url });
    try {
      const { apiClient } = await import('../../../services');
      await apiClient.patch(`/sessoes/${salaId}/mensagem/${mensagemId}`, { campos: { scene_image: url } });
    } catch (_) { /* silent — imagem já aparece localmente */ }
  }, [historia?.id, gameStoreAtualizarMensagem]);

  // Flag para prevenir envios duplicados
  const enviandoRef = useRef(false);

  const handleEnviarMensagem = async () => {
    if (!mensagemAtual.trim()) return;
    if (enviandoRef.current) return;

    try {
      enviandoRef.current = true;

      const roomId = `historia_${historia?.id}`;
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Verificar se e mensagem roleplay
      const ehMensagemRoleplay = socketState.faseJogo === 'rodada_em_andamento' && !socketState.ehMeuTurno;

      if (ehMensagemRoleplay) {
        if (cooldownLocal > 0) {
          showGameNotification(`Aguarde ${cooldownLocal}s para enviar outra mensagem roleplay`, 'warning');
          return;
        }

        const enviado = socketStoreSafeEmit('mensagem_roleplay', {
          roomId,
          userId: String(currentUser.id),
          username: currentUser.nome || currentUser.name,
          mensagem: mensagemAtual
        });

        if (enviado) {
          setCooldownLocal(ROLEPLAY_COOLDOWN_SECONDS);
          setMensagemAtual('');
        }
      } else {
        // Ativar loading
        setAguardandoMestre(true);

        // Adicionar mensagem temporaria de loading
        const loadingMsg = {
          id: `loading_${Date.now()}`,
          userId: 'sistema',
          username: 'Sistema',
          message: '⏳ O Mestre esta pensando...',
          tipo: 'loading',
          timestamp: Date.now()
        };
        onAdicionarMensagem(loadingMsg);

        const enviado = socketStoreSafeEmit('mensagem_para_mestre', {
          roomId,
          userId: String(currentUser.id),
          username: currentUser.nome || currentUser.name,
          mensagem: mensagemAtual,
          personagem: {
            nome: personagemSelecionado?.nome || 'Aventureiro',
            classe: personagemSelecionado?.classe_nome || '',
            nivel: personagemSelecionado?.nivel || 1
          }
        });

        if (enviado) {
          setMensagemAtual('');
        } else {
          setAguardandoMestre(false);
          showGameNotification('Falha ao enviar mensagem. Verifique sua conexao.', 'error');
          const msgs = useGameStore.getState().mensagens || [];
          const semLoading = msgs.filter(m => m.tipo !== 'loading');
          if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
        }
      }
    } catch (error) {
      // silenced
    } finally {
      setTimeout(() => {
        enviandoRef.current = false;
      }, TIMEOUTS.FLAG_RESET_DELAY);
    }
  };

  const handleRolarDados = async (tipoDado = 'd20', descricao = '') => {
    try {
      const dadoFinal = dadoSolicitadoInfo?.tipoDado || tipoDado;
      const descricaoFinal = descricao || dadoSolicitadoInfo?.teste || '';

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      const resultado = rolarDados(dadoFinal, descricaoFinal);

      const enviado = socketStoreSafeEmit('dice_roll', {
        roomId: roomId,
        userId: String(currentUser.id),
        username: currentUser.nome || currentUser.name,
        dice: String(dadoFinal),
        result: String(resultado.resultado),
        description: descricaoFinal
      });

      if (!enviado) {
        onAdicionarMensagem(resultado.mensagem);
      }
    } catch (error) {
      const resultado = rolarDados(tipoDado, descricao);
      onAdicionarMensagem(resultado.mensagem);
    }
  };

  const handleRolarDadoInicial = async () => {
    try {
      if (socketStoreRolarDadoInicial) {
        socketStoreRolarDadoInicial();
      }
    } catch (error) {
      // silenced
    }
  };

  const handleIniciarTurno = async () => {
    try {
      if (socketStoreIniciarTurno) {
        socketStoreIniciarTurno();
      }
    } catch (error) {
      // silenced
    }
  };

  const handleExecutarAcao = (acao, target = null, description = null) => {
    const textoAcao = description || acao;
    const mensagemAcao = {
      id: Date.now() + Math.random(),
      autor: 'Voce',
      conteudo: `⚔️ ${textoAcao}`,
      tipo: 'acao',
      timestamp: new Date()
    };
    onAdicionarMensagem(mensagemAcao);
  };

  const handleUsarHabilidade = async (vantagem) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      const descricao = `[USA HABILIDADE: ${vantagem.nome}]${vantagem.dano_base ? ` Dano base: ${vantagem.dano_base}` : ''}${vantagem.elemento?.length ? ` Elemento: ${vantagem.elemento.join(', ')}` : ''} - ${vantagem.descricao || ''}`;

      setAguardandoMestre(true);
      onAdicionarMensagem({
        id: `loading_${Date.now()}`,
        userId: 'sistema',
        username: 'Sistema',
        message: '⏳ O Mestre esta pensando...',
        tipo: 'loading',
        timestamp: Date.now()
      });

      socketStoreSafeEmit('mensagem_para_mestre', {
        roomId,
        userId: String(currentUser.id),
        username: currentUser.nome || currentUser.name,
        mensagem: descricao,
        personagem: {
          nome: personagemSelecionado?.nome || 'Aventureiro',
          classe: personagemSelecionado?.classe_nome || '',
          nivel: personagemSelecionado?.nivel || 1
        }
      });
    } catch (error) {
      setAguardandoMestre(false);
    }
  };

  const handleUsarEquipamento = async (equipamento) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      const descricao = `[USA EQUIPAMENTO: ${equipamento.nome}]${equipamento.dano_base ? ` Dano: ${equipamento.dano_base}` : ''}${equipamento.elemento?.length ? ` Elemento: ${equipamento.elemento.join(', ')}` : ''} - ${equipamento.descricao || ''}`;

      setAguardandoMestre(true);
      onAdicionarMensagem({
        id: `loading_${Date.now()}`,
        userId: 'sistema',
        username: 'Sistema',
        message: '⏳ O Mestre esta pensando...',
        tipo: 'loading',
        timestamp: Date.now()
      });

      socketStoreSafeEmit('mensagem_para_mestre', {
        roomId,
        userId: String(currentUser.id),
        username: currentUser.nome || currentUser.name,
        mensagem: descricao,
        personagem: {
          nome: personagemSelecionado?.nome || 'Aventureiro',
          classe: personagemSelecionado?.classe_nome || '',
          nivel: personagemSelecionado?.nivel || 1
        }
      });
    } catch (error) {
      setAguardandoMestre(false);
    }
  };

  const toggleActions = () => {
    setShowActions(!showActions);
    setRightPanelExpanded(true);
  };

  // Preparar dados para componentes
  const jaRolouDadoInicial = !!socketState.resultadosDados[user?.id];

  // Usar ordemJogadores como fallback se participantes estiver vazio
  const jogadoresExibir = participantesFormatados.length > 0
    ? participantesFormatados
    : socketState.ordemJogadores.map(j => ({
        userId: j.userId,
        username: j.username,
        personagem: j.personagemNome,
        personagemNome: j.personagemNome,
        valorDado: j.valorDado,
        isCurrentUser: String(j.userId) === String(user?.id),
        status: j.status || 'online'
      }));

  const fecharFichaModal = () => {
    setFichaModalAberta(false);
    setFichaErro(null);
    setFichaSelecionada(null);
    setFichaCarregando(false);
  };

  const abrirFichaLocal = (dados, titulo = 'Ficha do Personagem') => {
    setTituloFicha(titulo);
    setFichaErro(null);
    setFichaSelecionada(dados);
    setFichaCarregando(false);
    setFichaModalAberta(true);
  };

  const carregarFichaRemota = async (personagemId, titulo) => {
    if (!personagemId) {
      setTituloFicha(titulo);
      setFichaErro('Personagem nao informado para esta ficha.');
      setFichaSelecionada(null);
      setFichaCarregando(false);
      setFichaModalAberta(true);
      return;
    }

    setTituloFicha(titulo);
    setFichaErro(null);
    setFichaSelecionada(null);
    setFichaCarregando(true);
    setFichaModalAberta(true);

    if (fichasCache[personagemId]) {
      setFichaSelecionada(fichasCache[personagemId]);
      setFichaCarregando(false);
      return;
    }

    try {
      const ficha = await personagemService.getById(personagemId);
      setFichasCache(prev => ({ ...prev, [personagemId]: ficha }));
      setFichaSelecionada(ficha);
    } catch (error) {
      setFichaErro(error.message || 'Erro ao carregar ficha do personagem.');
    } finally {
      setFichaCarregando(false);
    }
  };

  const handleVerMinhaFicha = () => {
    if (!personagemSelecionado) {
      setTituloFicha('Minha Ficha');
      setFichaErro('Nenhum personagem selecionado.');
      setFichaSelecionada(null);
      setFichaModalAberta(true);
      return;
    }
    abrirFichaLocal(personagemSelecionado, 'Minha Ficha');
  };

  const handleVerFichaJogador = (jogador) => {
    if (!jogador) return;
    if (user?.id && String(jogador.userId) === String(user.id)) {
      handleVerMinhaFicha();
      return;
    }
    const personagemId = jogador.personagemId || jogador.personagem_id;
    const titulo = `${jogador.username || 'Jogador'} • ${jogador.personagemNome || jogador.personagem || 'Personagem'}`;
    carregarFichaRemota(personagemId, titulo);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Gerenciador de Notificacoes */}
      <NotificationManager />

      {/* Background effects */}
      <BackgroundEffects particleCount={PARTICLES.GAME_SCREEN_COUNT} />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Barra de Controle Unificada - Header unico do jogo */}
        <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between bg-black/30 backdrop-blur-sm border-b border-purple-500/20 z-40">
          {/* Lado esquerdo: Logo + Info da fase */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
              The Fable Forge
            </h1>
            <span className="text-purple-500/30 hidden sm:inline">|</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                socketState.faseJogo === 'rodada_em_andamento' ? 'bg-green-400 animate-pulse' : 'bg-purple-400'
              }`} />
              <span className="text-sm font-semibold text-purple-200">
                {socketState.faseJogo === 'rolagem_inicial' ? 'Rolagem Inicial' :
                 socketState.faseJogo === 'rodada_em_andamento' ? `Rodada ${socketState.rodadaAtual}` :
                 'Aguardando'}
              </span>
            </div>
            {socketState.ehMeuTurno && socketState.faseJogo === 'rodada_em_andamento' && (
              <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-cyan-300 text-xs font-bold animate-pulse">
                Seu Turno
              </span>
            )}
            <span className="text-purple-500/50 text-xs hidden sm:inline">|</span>
            <span className="text-purple-300/70 text-xs hidden sm:inline">{jogadoresExibir.length} jogadores</span>
          </div>

          {/* Lado direito: Botoes de controle */}
          <div className="flex items-center space-x-2">
            {/* Botao RODADA com dropdown */}
            <div className="relative" ref={rodadaDropdownRef}>
              <button
                onClick={() => setShowRodadaInfo(!showRodadaInfo)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm"
              >
                <span>📊</span>
                <span>RODADA</span>
              </button>

              {/* Dropdown de informacoes */}
              {showRodadaInfo && (
                <div className="absolute right-0 top-full mt-1 w-80 glass p-4 rounded-xl border-2 border-purple-500/50 shadow-2xl animate-scale-in max-h-96 overflow-y-auto z-50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {historia?.imagem && (
                        <img src={historia.imagem} alt={historia.nome} className="w-14 h-14 rounded-lg object-cover border border-purple-500/30 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-purple-300 text-xs font-semibold mb-1">Historia</p>
                        <p className="text-white font-bold text-lg">{historia?.nome || historia?.titulo || 'Aventura RPG'}</p>
                      </div>
                    </div>

                    <div className="border-t border-purple-500/20 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-purple-300 text-xs font-semibold mb-1">Rodada Atual</p>
                          <p className="text-cyan-400 font-bold text-2xl">{socketState.rodadaAtual}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-xs font-semibold mb-1">Jogadores</p>
                          <p className="text-cyan-400 font-bold text-2xl">{jogadoresExibir.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-purple-500/20 pt-3">
                      <p className="text-purple-300 text-xs font-semibold mb-1">Status</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-300 text-sm font-semibold">
                          {socketState.faseJogo === 'rolagem_inicial' ? 'Rolagem Inicial' :
                           socketState.faseJogo === 'rodada_em_andamento' ? 'Jogo Ativo' :
                           'Aguardando Inicio'}
                        </span>
                      </div>
                    </div>

                    {/* Ordem de Jogadores */}
                    {socketState.ordemJogadores.length > 0 && (
                      <div className="border-t border-purple-500/20 pt-3">
                        <p className="text-purple-300 text-xs font-semibold mb-2">Ordem de Jogadores</p>
                        <div className="space-y-2">
                          {socketState.ordemJogadores.map((jogador, index) => (
                            <div
                              key={jogador.userId}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                index === socketState.turnoAtual && socketState.faseJogo === 'rodada_em_andamento'
                                  ? 'bg-cyan-500/20 border border-cyan-400/50'
                                  : 'bg-white/5'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-purple-400 font-bold text-sm">#{index + 1}</span>
                                <div>
                                  <p className="text-white text-sm font-semibold">{jogador.username}</p>
                                  {jogador.personagemNome && (
                                    <p className="text-purple-300 text-xs">{jogador.personagemNome}</p>
                                  )}
                                </div>
                              </div>
                              {index === socketState.turnoAtual && socketState.faseJogo === 'rodada_em_andamento' && (
                                <span className="text-cyan-400 text-xs font-bold">TURNO</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botao FICHA */}
            <button
              onClick={handleVerMinhaFicha}
              className="px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm bg-gradient-to-r from-cyan-600/70 to-purple-600/70 text-white border border-cyan-300/40 hover:from-cyan-500/80 hover:to-purple-500/80"
            >
              <span>📜</span>
              <span>FICHA</span>
            </button>

            {/* Botao ACOES */}
            <button
              onClick={toggleActions}
              className={`px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm ${
                showActions
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-300'
                  : 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-purple-200 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30'
              }`}
            >
              <span>⚡</span>
              <span>ACOES</span>
            </button>

            {/* Botao TEMA */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
              aria-label="Alternar tema"
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>

            {/* Botao SAIR */}
            <button
              onClick={onSair}
              className="px-3 py-1.5 bg-red-500/30 text-red-200 border border-red-500/50 rounded-lg hover:bg-red-500/40 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">SAIR</span>
            </button>

            {/* Mobile: toggle jogadores e ações */}
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'jogadores' ? null : 'jogadores')}
              className="md:hidden px-2 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all text-sm"
              title="Jogadores"
            >
              👥
            </button>
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'acoes' ? null : 'acoes')}
              className="md:hidden px-2 py-1.5 bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 rounded-lg hover:bg-cyan-600/50 transition-all text-sm"
              title="Ações"
            >
              ⚔️
            </button>
          </div>
        </div>

        {/* Main Game Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Painel Lateral Esquerdo - Outros Jogadores */}
          <PainelJogadores
            participantes={jogadoresExibir}
            ordemJogadores={socketState.ordemJogadores}
            resultadosDados={socketState.resultadosDados}
            turnoAtual={socketState.turnoAtual}
            faseJogo={socketState.faseJogo}
            onVerFichaJogador={handleVerFichaJogador}
          />

          {/* Area Central - Chat do Mestre */}
          <div className="flex-1 flex flex-col">
            {/* Barra de HP/XP compacta — sempre visível */}
            <BarraStatusCompacta
              personagem={personagemSelecionado}
              combateAtivo={socketState.combateAtivo}
              combateJogadores={socketState.combateJogadores}
              userId={user?.id}
            />

            {/* Componente de Rolagem de Dados Inicial */}
            {socketState.faseJogo === 'rolagem_inicial' && (
              <div className="p-6">
                <RolagemDadosInicial
                  jogadores={Object.values(participantes || {})}
                  resultados={socketState.resultadosDados}
                  ordemDefinida={socketState.ordemDefinida}
                  ordemJogadores={socketState.ordemJogadores}
                  usuarioAtual={user}
                  onRolarDado={handleRolarDadoInicial}
                />
              </div>
            )}

            {/* BatalhaUI - exibida quando combate ativo */}
            {(socketState.combateAtivo || socketState.combateResultado) && (
              <div className="px-4 pt-4">
                <BatalhaUI
                  monstros={socketState.combateMonstros}
                  jogadores={socketState.combateJogadores}
                  rodada={socketState.combateRodada}
                  log={socketState.combateLog}
                  resultado={socketState.combateResultado}
                  xpGanho={socketState.combateXpGanho}
                  userId={String(user?.id)}
                />
              </div>
            )}

            <ChatArea
              mensagens={mensagens}
              usuariosDigitando={[]}
              mensagensRef={null}
              voiceId={historia?.mestre?.voice_id || historia?.mestres?.voice_id}
              voiceProvider={historia?.mestre?.voice_provider || historia?.mestres?.voice_provider || 'elevenlabs'}
              entidadesComImagem={entidadesComImagem}
              contextoImagemCena={contextoImagemCena}
              onSceneImageGenerated={handleSceneImageGenerated}
              estiloImagem={historia?.estilo_imagem}
            />

            {/* Area de Input - Chat */}
            <InputArea
              mensagemAtual={mensagemAtual}
              onMensagemChange={handleMensagemChange}
              onKeyPress={handleKeyPress}
              onEnviarMensagem={handleEnviarMensagem}
              onRolarDados={handleRolarDados}
              onExecutarAcao={handleExecutarAcao}
              faseJogo={socketState.faseJogo}
              ehMeuTurno={socketState.ehMeuTurno}
              turnoIniciado={socketState.turnoIniciado}
              turnoStatus={socketState.turnoStatus}
              cooldownRoleplay={cooldownLocal}
              onRolarDadoInicial={handleRolarDadoInicial}
              onIniciarTurno={handleIniciarTurno}
              jaRolouDadoInicial={jaRolouDadoInicial}
              dadosSolicitados={dadosSolicitados}
              dadoSolicitadoInfo={dadoSolicitadoInfo}
              aguardandoMestre={aguardandoMestre}
              combateAtivo={socketState.combateAtivo}
              habilidadesPersonagem={habilidadesPersonagem}
              manaAtual={socketState.combateJogadores?.[user?.id]?.mana_atual ?? calcularMana(personagemSelecionado)}
              manaMax={socketState.combateJogadores?.[user?.id]?.mana_max ?? calcularMana(personagemSelecionado)}
              cooldownsHabilidades={cooldownsHabilidades}
            />
          </div>

          {/* Painel Lateral Direito - Acoes RPG (colapsavel, hidden on mobile) */}
          {showActions && (
            <div className={`transition-all duration-300 bg-black/20 backdrop-blur-sm border-l border-purple-500/20 p-4 overflow-y-auto overflow-x-hidden hidden md:block ${
              rightPanelExpanded ? 'w-80' : 'w-16'
            }`}>
              {/* Header com botao de collapse */}
              <div className={`flex items-center mb-3 ${rightPanelExpanded ? 'justify-between' : 'justify-center'}`}>
                {rightPanelExpanded && (
                  <h3 className="text-white font-bold text-lg">Acoes RPG</h3>
                )}
                <button
                  onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all flex-shrink-0"
                  title={rightPanelExpanded ? 'Retrair painel' : 'Expandir painel'}
                >
                  <span className="text-lg">{rightPanelExpanded ? '▶' : '◀'}</span>
                </button>
              </div>

              {/* Conteudo expandido */}
              {rightPanelExpanded && (
                <div className="space-y-4">
                  <RPGActions
                    onRollDice={handleRolarDados}
                    onUsarHabilidade={handleUsarHabilidade}
                    onUsarEquipamento={handleUsarEquipamento}
                    personagem={personagemSelecionado}
                  />
                  <div className="border-t border-purple-500/20 pt-4">
                    <h4 className="text-white font-semibold mb-2">Status</h4>
                    <StatusPersonagem
                      personagemSelecionado={infoPersonagem}
                      onRolarDados={handleRolarDados}
                      onToggleInventario={() => setInventarioAberto(!inventarioAberto)}
                      compact={true}
                      combateAtivo={socketState.combateAtivo}
                      combateJogadores={socketState.combateJogadores}
                      userId={String(user.id)}
                    />
                  </div>
                </div>
              )}

              {/* Versao compacta quando colapsado */}
              {!rightPanelExpanded && (
                <div className="flex flex-col items-center space-y-3 mt-4">
                  <button
                    onClick={() => setRightPanelExpanded(true)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30 hover:bg-purple-500/40 transition-all"
                    title="Acoes RPG"
                  >
                    <span className="text-lg">⚔️</span>
                  </button>
                  <button
                    onClick={() => setRightPanelExpanded(true)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-500/30 hover:bg-cyan-500/40 transition-all"
                    title="Status"
                  >
                    <span className="text-lg">📊</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileDrawer(null)} />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-md border-l border-purple-500/20 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <h3 className="text-white font-fantasy font-bold">
                {mobileDrawer === 'jogadores' ? '👥 Aventureiros' : '⚔️ Ações RPG'}
              </h3>
              <button
                onClick={() => setMobileDrawer(null)}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {mobileDrawer === 'jogadores' && (
                <div className="space-y-3">
                  {(socketState.ordemJogadores.length > 0 ? socketState.ordemJogadores : jogadoresExibir).map((jogador, i) => {
                    const uid = jogador.userId || jogador.id;
                    const nome = jogador.username || jogador.nome;
                    const pNome = jogador.personagemNome || jogador.personagem;
                    const ehTurno = socketState.turnoAtual === i;
                    return (
                      <div key={uid || i} className={`p-3 rounded-lg border ${
                        ehTurno ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-purple-500/20 bg-black/20'
                      }`}>
                        <div className="text-white font-medium text-sm">{nome}</div>
                        <div className="text-purple-300 text-xs">{pNome}</div>
                        {jogador.valorDado && (
                          <div className="text-yellow-300 text-xs mt-1">🎲 {jogador.valorDado}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {mobileDrawer === 'acoes' && (
                <div className="space-y-4">
                  <RPGActions
                    onRollDice={handleRolarDados}
                    onUsarHabilidade={handleUsarHabilidade}
                    onUsarEquipamento={handleUsarEquipamento}
                    personagem={personagemSelecionado}
                  />
                  <div className="border-t border-purple-500/20 pt-4">
                    <StatusPersonagem
                      personagemSelecionado={infoPersonagem}
                      onRolarDados={handleRolarDados}
                      onToggleInventario={() => { setInventarioAberto(!inventarioAberto); setMobileDrawer(null); }}
                      compact={true}
                      combateAtivo={socketState.combateAtivo}
                      combateJogadores={socketState.combateJogadores}
                      userId={String(user.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FichaPersonagemModal
        isOpen={fichaModalAberta}
        onClose={fecharFichaModal}
        personagem={fichaSelecionada}
        loading={fichaCarregando}
        error={fichaErro}
        titulo={tituloFicha}
      />

      <InventarioPanel
        isOpen={inventarioAberto}
        onClose={() => setInventarioAberto(false)}
        equipamentos={personagemSelecionado?.equipamentos || []}
        personagemNome={personagemSelecionado?.nome || 'Aventureiro'}
      />

      <LevelUpCelebration
        isVisible={!!levelUpData}
        novoNivel={levelUpData?.novoNivel}
        ganhos={levelUpData?.ganhos}
        onClose={() => setLevelUpData(null)}
      />

      <SessionRecap
        isVisible={!!socketState.sessionRecap}
        recapData={socketState.sessionRecap}
        onClose={() => {
          try {
            useSocketStore.setState({ sessionRecap: null });
          } catch (_) {}
        }}
      />
    </div>
  );
};

export default EtapaJogoRPG;
