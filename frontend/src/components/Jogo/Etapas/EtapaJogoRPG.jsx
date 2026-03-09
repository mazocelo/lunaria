import React, { useState, useEffect } from 'react';
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
import { etapaJogoRPGViewModel } from '../../../viewmodels/Jogo';
import NotificationManager, { showGameNotification } from '../NotificationManager';
import FichaPersonagemModal from '../Modals/FichaPersonagemModal';
import { personagemService } from '../../../services';
import { TIMEOUTS, ROLEPLAY_COOLDOWN_SECONDS, PARTICLES } from '../../../constants/game';
import { useTheme } from '../../../contexts/theme.jsx';

/**
 * Layout do jogo RPG ativo - Usando ViewModel específico
 * 📍 Usado por: JogoView (etapa 'jogo-ativo')
 * 🎯 MIGRADO: Agora usa ViewModel específico para lógica de negócio
 * 🎲 SISTEMA DE TURNOS: Integrado com fases, rodadas e turnos
 */
const EtapaJogoRPG = ({
  historia,
  personagemSelecionado,
  participantes,
  mensagens,
  statusPersonagem,
  isDonoSala,
  socketConnected,
  isTyping,
  user,
  onAdicionarMensagem,
  onAtualizarStatus,
  onSair
}) => {
  // 🎨 THEME
  const { theme, toggleTheme } = useTheme();

  // 🎯 VIEWMODEL - Estado reativo
  const [viewModelState, setViewModelState] = useState(etapaJogoRPGViewModel.getState());

  // 🎲 SOCKET STORE - Estado de turnos e rodadas
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
    cooldownRoleplay: 0,
    // Combate
    combateAtivo: false,
    combateMonstros: [],
    combateJogadores: {},
    combateRodada: 0,
    combateResultado: null,
    combateLog: [],
    combateXpGanho: 0,
    sessionRecap: null
  });

  // ⏱️ Timer local para cooldown roleplay
  const [cooldownLocal, setCooldownLocal] = useState(0);
  const cooldownIntervalRef = React.useRef(null);

  // 📊 Estado para dropdown de informações da rodada
  const [showRodadaInfo, setShowRodadaInfo] = useState(false);
  // 🎯 Estado para collapse do painel direito
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const rodadaDropdownRef = React.useRef(null);

  // 🎲 Estado para controlar solicitação de dados do Mestre
  const [dadosSolicitados, setDadosSolicitados] = useState(false);
  const [dadoSolicitadoInfo, setDadoSolicitadoInfo] = useState(null);
  const [aguardandoMestre, setAguardandoMestre] = useState(false);
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [fichaCarregando, setFichaCarregando] = useState(false);
  const [fichaErro, setFichaErro] = useState(null);
  const [tituloFicha, setTituloFicha] = useState('Ficha do Personagem');
  const [fichasCache, setFichasCache] = useState({});
  // 🎒 Inventario + Level Up
  const [inventarioAberto, setInventarioAberto] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [levelUpQueue, setLevelUpQueue] = useState([]);

  // Consumir fila de level-ups sequencialmente (mostra um por vez)
  React.useEffect(() => {
    if (!levelUpData && levelUpQueue.length > 0) {
      const [next, ...rest] = levelUpQueue;
      setLevelUpData(next);
      setLevelUpQueue(rest);
    }
  }, [levelUpData, levelUpQueue]);

  // Ref para evitar stale closure no onAdicionarMensagem
  const onAdicionarMensagemRef = React.useRef(onAdicionarMensagem);
  React.useEffect(() => {
    onAdicionarMensagemRef.current = onAdicionarMensagem;
  }, [onAdicionarMensagem]);

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = etapaJogoRPGViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 🔄 SUBSCRIBE AO SOCKET STORE (para estados de turnos)
  useEffect(() => {
    let unsubscribe;
    
    const setupSocketStoreSubscription = async () => {
      try {
        const { getSocketStoreAPI } = await import('../../../store/index.js');
        const socketStore = getSocketStoreAPI();
        
        // Extrai estado relevante do socket store
        const extractSocketState = (state) => ({
          faseJogo: state.faseJogo || 'aguardando_inicio',
          rodadaAtual: state.rodadaAtual || 1,
          turnoAtual: state.turnoAtual || 0,
          jogadorAtual: state.jogadorAtual,
          ordemJogadores: state.ordemJogadores || [],
          ordemDefinida: state.ordemDefinida || false,
          resultadosDados: state.resultadosDados || {},
          ehMeuTurno: state.ehMeuTurno || false,
          turnoIniciado: state.turnoIniciado || false,
          cooldownRoleplay: state.cooldownRoleplay || 0,
          // Combate
          combateAtivo: state.combateAtivo || false,
          combateMonstros: state.combateMonstros || [],
          combateJogadores: state.combateJogadores || {},
          combateRodada: state.combateRodada || 0,
          combateResultado: state.combateResultado || null,
          combateLog: state.combateLog || [],
          combateXpGanho: state.combateXpGanho || 0,
          sessionRecap: state.sessionRecap || null
        });

        // Ler estado inicial (subscribe só dispara em mudanças futuras)
        setSocketState(extractSocketState(socketStore.getState()));

        // Subscribe para mudanças no socket store
        unsubscribe = socketStore.subscribe((state) => {
          setSocketState(extractSocketState(state));
        });
      } catch (error) {
        // silenced
      }
    };

    setupSocketStoreSubscription();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ⏱️ Timer para decrementar cooldown local
  useEffect(() => {
    if (cooldownLocal > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownLocal(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, TIMEOUTS.COOLDOWN_TICK);
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [cooldownLocal]);

  // ⏱️ Timeout de segurança para aguardandoMestre (30s)
  useEffect(() => {
    if (!aguardandoMestre) return;
    const timeout = setTimeout(() => {
      setAguardandoMestre(false);
      showGameNotification('O Mestre demorou para responder. Tente novamente.', 'warning');
    }, 30000);
    return () => clearTimeout(timeout);
  }, [aguardandoMestre]);

  // 🧹 Listener para limpar mensagens de dados quando ordem definida
  useEffect(() => {
    const limparMensagensDados = async () => {
      // Filtrar mensagens para manter apenas a do Mestre
      const { jogoViewModel } = await import('../../../viewmodels/Jogo/index.js');
      const mensagensAtuais = jogoViewModel.getState().mensagens || [];

      // Manter apenas mensagens do tipo 'mestre'
      const mensagensFiltradas = mensagensAtuais.filter(m => m.tipo === 'mestre' || m.tipo === 'entre_rodadas');

      jogoViewModel.limparMensagensDados(mensagensFiltradas);
    };

    window.addEventListener('limparMensagensDados', limparMensagensDados);

    return () => {
      window.removeEventListener('limparMensagensDados', limparMensagensDados);
    };
  }, []);

  // 📊 DESTRUCTURING DO ESTADO
  const { showActions, mensagemAtual, messageType, isTyping: isTypingLocal } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    etapaJogoRPGViewModel.initialize();
    
    // Cleanup ao desmontar
    return () => {
      etapaJogoRPGViewModel.destroy();
    };
  }, []);

  // 🖱️ Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rodadaDropdownRef.current && !rodadaDropdownRef.current.contains(event.target)) {
        setShowRodadaInfo(false);
      }
    };

    if (showRodadaInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRodadaInfo]);

  // 🎭 LISTENERS PARA MENSAGENS DO MESTRE E JOGADORES
  useEffect(() => {
    const setupListeners = async () => {
      try {
        const { getSocketStoreAPI } = await import('../../../store/index.js');
        const socketStore = getSocketStoreAPI();

        // Listener para mensagens do Mestre
        const handleMensagemMestre = async (data) => {
          // ✅ Remover mensagens de loading antes de adicionar resposta real
          try {
            const { jogoViewModel } = await import('../../../viewmodels/Jogo/index.js');
            const mensagensAtuais = jogoViewModel.getState().mensagens || [];
            const mensagensSemLoading = mensagensAtuais.filter(m => m.tipo !== 'loading');

            if (mensagensAtuais.length !== mensagensSemLoading.length) {
              jogoViewModel.setMensagens(mensagensSemLoading);
            }
          } catch (error) {
            // silenced
          }
          
          // ✅ Desativar loading e limpar estado de dados solicitados
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

        // Listener para mensagens de chat normais (eco dos jogadores)
        const handleChatMessage = (data) => {
          // Só adicionar se não for mestre (mensagens do mestre vêm pelo outro listener)
          if (data.userId !== 'mestre' && data.tipo !== 'mestre') {
            if (onAdicionarMensagemRef.current) {
              onAdicionarMensagemRef.current(data);
            }
          }
        };

        // Listener para resultados de dados
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

        // Listener para mensagens roleplay
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

        // Listener para rodada finalizada (narrativa entre rodadas)
        const handleRodadaFinalizada = (data) => {
          const mensagem = {
            id: `rodada_${data.rodada}_fim`,
            tipo: 'entre_rodadas',
            titulo: `Fim da Rodada ${data.rodada}`,
            mensagem: `A rodada ${data.rodada} foi concluída. Preparando próxima rodada...`,
            timestamp: data.timestamp || Date.now()
          };

          if (onAdicionarMensagemRef.current) {
            onAdicionarMensagemRef.current(mensagem);
          }
        };

        // Listener para ordem definida - limpar chat de dados
        const handleOrdemDefinida = (data) => {
          // Emitir evento customizado para limpar mensagens
          const event = new CustomEvent('limparMensagensDados');
          window.dispatchEvent(event);
        };

        // Listener para dice_roll (dados normais durante o jogo)
        const handleDiceRoll = (data) => {
          // ✅ Se era o usuário atual que rolou, transição: dado → aguardando mestre
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (String(data.userId) === String(user.id)) {
            setDadosSolicitados(false);
            setDadoSolicitadoInfo(null);
            setAguardandoMestre(true);
          }

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

        // Listener para solicitação de dados do Mestre
        const handleMestreSolicitaDados = (data) => {

          // ✅ Ativar estado de dados solicitados com info completa
          setDadosSolicitados(true);
          setDadoSolicitadoInfo({
            tipoDado: data.tipoDado || 'd20',
            teste: data.teste || '',
            dificuldade: data.dificuldade || 'Média'
          });
        };

        // Listener para level up (usa fila para multi-level-up)
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
              message: `🎉 **${data.personagemNome || data.username || 'Jogador'}** subiu para o **Nível ${data.novoNivel || data.nivel}**!`,
              timestamp: Date.now()
            });
          }
        };

        // Listener para acoes do mestre (itens, cura, etc)
        // Nota: não mutamos props diretamente - apenas notificamos via toast
        const handleAcaoMestre = (data) => {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const ehMeu = String(data.userId) === String(currentUser.id);
          if (data.tipo === 'item_recebido' && ehMeu) {
            if (data.item) {
              showGameNotification(`Item recebido: ${data.item.nome || 'Novo item'}`, 'success');
            }
          } else if (data.tipo === 'item_removido' && ehMeu) {
            const nomeItem = data.item?.nome || data.itemNome;
            if (nomeItem) {
              showGameNotification(`Item removido: ${nomeItem}`, 'warning');
            }
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

        // Adicionar listeners
        socketStore.on('mensagem_mestre', handleMensagemMestre);
        socketStore.on('chat_message', handleChatMessage);
        socketStore.on('resultado_dado_inicial', handleResultadoDado);
        socketStore.on('mensagem_roleplay', handleMensagemRoleplay);
        socketStore.on('rodada_finalizada', handleRodadaFinalizada);
        socketStore.on('ordem_definida', handleOrdemDefinida);
        socketStore.on('dice_roll', handleDiceRoll);
        socketStore.on('mestre_solicita_dados', handleMestreSolicitaDados);
        socketStore.on('solicitacao_dados', handleMestreSolicitaDados);
        socketStore.on('level_up', handleLevelUp);
        socketStore.on('acao_mestre', handleAcaoMestre);

        // XP toast ao fim de combate
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
        socketStore.on('combate_finalizado', handleCombateFinalizado);

        // Loot pós-combate
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
        socketStore.on('combate_loot', handleCombateLoot);

        // Cleanup
        return () => {
          socketStore.off('mensagem_mestre', handleMensagemMestre);
          socketStore.off('chat_message', handleChatMessage);
          socketStore.off('resultado_dado_inicial', handleResultadoDado);
          socketStore.off('mensagem_roleplay', handleMensagemRoleplay);
          socketStore.off('rodada_finalizada', handleRodadaFinalizada);
          socketStore.off('ordem_definida', handleOrdemDefinida);
          socketStore.off('dice_roll', handleDiceRoll);
          socketStore.off('mestre_solicita_dados', handleMestreSolicitaDados);
          socketStore.off('solicitacao_dados', handleMestreSolicitaDados);
          socketStore.off('level_up', handleLevelUp);
          socketStore.off('acao_mestre', handleAcaoMestre);
          socketStore.off('combate_finalizado', handleCombateFinalizado);
          socketStore.off('combate_loot', handleCombateLoot);
        };
      } catch (error) {
        // silenced
      }
    };

    const cleanup = setupListeners();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []); // ← REMOVIDA DEPENDÊNCIA onAdicionarMensagem

  // 📋 HELPERS: Formatar dados via ViewModel
  const infoPersonagem = etapaJogoRPGViewModel.formatarInformacoesPersonagem(personagemSelecionado);
  const participantesFormatados = etapaJogoRPGViewModel.formatarParticipantes(participantes, user);

  // 🎯 HANDLERS: Usando ViewModel
  const handleMensagemChange = (e) => {
    etapaJogoRPGViewModel.updateMensagemAtual(e.target.value);
  };

  const handleKeyPress = (e) => {
    const preventDefault = etapaJogoRPGViewModel.handleKeyPress(e, handleEnviarMensagem);
    if (preventDefault) {
      e.preventDefault();
    }
  };

  // Flag para prevenir envios duplicados
  const enviandoRef = React.useRef(false);

  const handleEnviarMensagem = async () => {
    if (!mensagemAtual.trim()) {
      return;
    }

    // Prevenir envios duplicados
    if (enviandoRef.current) {
      return;
    }

    try {
      enviandoRef.current = true;
      
      // Importar socketStore dinamicamente
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();

      // Obter dados da história e usuário
      const roomId = `historia_${historia?.id}`;
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Verificar se é mensagem roleplay (não é o turno do jogador)
      const ehMensagemRoleplay = socketState.faseJogo === 'rodada_em_andamento' && !socketState.ehMeuTurno;

      if (ehMensagemRoleplay) {
        // Verificar cooldown local antes de enviar
        if (cooldownLocal > 0) {
          showGameNotification(`Aguarde ${cooldownLocal}s para enviar outra mensagem roleplay`, 'warning');
          return;
        }

        // Enviar mensagem roleplay
        const enviado = socketStore.safeEmit('mensagem_roleplay', {
          roomId,
          userId: String(user.id),
          username: user.nome || user.name,
          mensagem: mensagemAtual
        });

        if (enviado) {
          setCooldownLocal(ROLEPLAY_COOLDOWN_SECONDS);
          etapaJogoRPGViewModel.clearMensagemAtual();
        }
      } else {
        // ✅ Ativar loading
        setAguardandoMestre(true);
        
        // ✅ Adicionar mensagem temporária de loading
        const loadingMsg = {
          id: `loading_${Date.now()}`,
          userId: 'sistema',
          username: 'Sistema',
          message: '⏳ O Mestre está pensando...',
          tipo: 'loading',
          timestamp: Date.now()
        };
        onAdicionarMensagem(loadingMsg);
        
        // Enviar mensagem para o Mestre via WebSocket (turno do jogador)
        const enviado = socketStore.safeEmit('mensagem_para_mestre', {
          roomId,
          userId: String(user.id),
          username: user.nome || user.name,
          mensagem: mensagemAtual,
          personagem: {
            nome: personagemSelecionado?.nome || 'Aventureiro',
            classe: personagemSelecionado?.classe_nome || '',
            nivel: personagemSelecionado?.nivel || 1
          }
        });

        if (enviado) {
          // Limpar input apenas se enviou com sucesso
          etapaJogoRPGViewModel.clearMensagemAtual();
        } else {
          // ✅ Remover loading se falhar
          setAguardandoMestre(false);
          showGameNotification('Falha ao enviar mensagem. Verifique sua conexão.', 'error');
          // Remover loading message (mesmo pattern do handleMensagemMestre)
          try {
            const { jogoViewModel } = await import('../../../viewmodels/Jogo/index.js');
            const msgs = jogoViewModel.getState().mensagens || [];
            const semLoading = msgs.filter(m => m.tipo !== 'loading');
            if (msgs.length !== semLoading.length) jogoViewModel.setMensagens(semLoading);
          } catch (e) { /* silenced */ }
        }
      }
    } catch (error) {
      // silenced
    } finally {
      // Resetar flag após um pequeno delay para evitar duplo clique
      setTimeout(() => {
        enviandoRef.current = false;
      }, TIMEOUTS.FLAG_RESET_DELAY);
    }
  };

  const handleRolarDados = async (tipoDado = 'd20', descricao = '') => {
    try {
      // Usar info do dado solicitado pelo Mestre se disponível
      const dadoFinal = dadoSolicitadoInfo?.tipoDado || tipoDado;
      const descricaoFinal = descricao || dadoSolicitadoInfo?.teste || '';

      // Durante o jogo, emitir para o backend ao invés de adicionar localmente
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      // Rolar dados localmente para obter resultado
      const resultado = etapaJogoRPGViewModel.rolarDados(dadoFinal, descricaoFinal);

      // Emitir para o backend (backend irá distribuir para todos)
      const enviado = socketStore.safeEmit('dice_roll', {
        roomId: roomId,
        userId: String(user.id),
        username: user.nome || user.name,
        dice: String(dadoFinal),
        result: String(resultado.resultado),
        description: descricaoFinal
      });

      if (!enviado) {
        // Se falhar ao enviar, adicionar localmente como fallback
        onAdicionarMensagem(resultado.mensagem);
      }
    } catch (error) {
      // Fallback: adicionar mensagem localmente
      const resultado = etapaJogoRPGViewModel.rolarDados(tipoDado, descricao);
      onAdicionarMensagem(resultado.mensagem);
    }
  };

  // 🎲 Handler para rolar dado inicial (d20)
  const handleRolarDadoInicial = async () => {
    try {
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      socketStore.getState().rolarDadoInicial();
    } catch (error) {
      // silenced
    }
  };

  // ⚡ Handler para iniciar turno (receber mensagem inicial do Mestre)
  const handleIniciarTurno = async () => {
    try {
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      socketStore.getState().iniciarTurno();
    } catch (error) {
      // silenced
    }
  };

  const handleExecutarAcao = (acao, target = null, description = null) => {
    // Se description foi fornecida, usar ela; caso contrário, formatar a ação
    const textoAcao = description || acao;
    const mensagemAcao = etapaJogoRPGViewModel.criarMensagemAcao(textoAcao);
    onAdicionarMensagem(mensagemAcao);
  };

  const handleUsarHabilidade = async (vantagem) => {
    try {
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      const descricao = `[USA HABILIDADE: ${vantagem.nome}]${vantagem.dano_base ? ` Dano base: ${vantagem.dano_base}` : ''}${vantagem.elemento?.length ? ` Elemento: ${vantagem.elemento.join(', ')}` : ''} - ${vantagem.descricao || ''}`;

      setAguardandoMestre(true);
      onAdicionarMensagem({
        id: `loading_${Date.now()}`,
        userId: 'sistema',
        username: 'Sistema',
        message: '⏳ O Mestre está pensando...',
        tipo: 'loading',
        timestamp: Date.now()
      });

      socketStore.safeEmit('mensagem_para_mestre', {
        roomId,
        userId: String(user.id),
        username: user.nome || user.name,
        mensagem: descricao,
        personagem: {
          nome: personagemSelecionado?.nome || 'Aventureiro',
          classe: personagemSelecionado?.classe_nome || '',
          nivel: personagemSelecionado?.nivel || 1
        }
      });
    } catch (error) {
      // silenced
      setAguardandoMestre(false);
    }
  };

  const handleUsarEquipamento = async (equipamento) => {
    try {
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      const descricao = `[USA EQUIPAMENTO: ${equipamento.nome}]${equipamento.dano_base ? ` Dano: ${equipamento.dano_base}` : ''}${equipamento.elemento?.length ? ` Elemento: ${equipamento.elemento.join(', ')}` : ''} - ${equipamento.descricao || ''}`;

      setAguardandoMestre(true);
      onAdicionarMensagem({
        id: `loading_${Date.now()}`,
        userId: 'sistema',
        username: 'Sistema',
        message: '⏳ O Mestre está pensando...',
        tipo: 'loading',
        timestamp: Date.now()
      });

      socketStore.safeEmit('mensagem_para_mestre', {
        roomId,
        userId: String(user.id),
        username: user.nome || user.name,
        mensagem: descricao,
        personagem: {
          nome: personagemSelecionado?.nome || 'Aventureiro',
          classe: personagemSelecionado?.classe_nome || '',
          nivel: personagemSelecionado?.nivel || 1
        }
      });
    } catch (error) {
      // silenced
      setAguardandoMestre(false);
    }
  };

  const toggleActions = () => {
    etapaJogoRPGViewModel.toggleActions();
    setRightPanelExpanded(true);
  };


  // 📊 Preparar dados para componentes
  const jaRolouDadoInicial = !!socketState.resultadosDados[user?.id];

  // ✅ Usar ordemJogadores como fallback se participantes estiver vazio
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
      setFichaErro('Personagem não informado para esta ficha.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Gerenciador de Notificações */}
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

          {/* Lado direito: Botões de controle */}
          <div className="flex items-center space-x-2">
            {/* Botão RODADA com dropdown */}
            <div className="relative" ref={rodadaDropdownRef}>
              <button
                onClick={() => setShowRodadaInfo(!showRodadaInfo)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm"
              >
                <span>📊</span>
                <span>RODADA</span>
              </button>

              {/* Dropdown de informações */}
              {showRodadaInfo && (
                <div className="absolute right-0 top-full mt-1 w-80 glass p-4 rounded-xl border-2 border-purple-500/50 shadow-2xl animate-scale-in max-h-96 overflow-y-auto z-50">
                  <div className="space-y-3">
                    <div>
                      <p className="text-purple-300 text-xs font-semibold mb-1">Historia</p>
                      <p className="text-white font-bold text-lg">{historia?.nome || historia?.titulo || 'Aventura RPG'}</p>
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

            {/* Botão FICHA */}
            <button
              onClick={handleVerMinhaFicha}
              className="px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm bg-gradient-to-r from-cyan-600/70 to-purple-600/70 text-white border border-cyan-300/40 hover:from-cyan-500/80 hover:to-purple-500/80"
            >
              <span>📜</span>
              <span>FICHA</span>
            </button>

            {/* Botão AÇÕES */}
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

            {/* Botão TEMA */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
              aria-label="Alternar tema"
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>

            {/* Botão SAIR */}
            <button
              onClick={onSair}
              className="px-3 py-1.5 bg-red-500/30 text-red-200 border border-red-500/50 rounded-lg hover:bg-red-500/40 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
            >
              <span>🚪</span>
              <span>SAIR</span>
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

          {/* Área Central - Chat do Mestre */}
          <div className="flex-1 flex flex-col">
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
              mensagensRef={null} // No longer needed
            />

            {/* Área de Input - Chat */}
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
              cooldownRoleplay={cooldownLocal}
              onRolarDadoInicial={handleRolarDadoInicial}
              onIniciarTurno={handleIniciarTurno}
              jaRolouDadoInicial={jaRolouDadoInicial}
              dadosSolicitados={dadosSolicitados}
              dadoSolicitadoInfo={dadoSolicitadoInfo}
              aguardandoMestre={aguardandoMestre}
              combateAtivo={socketState.combateAtivo}
            />
          </div>

          {/* Painel Lateral Direito - Ações RPG (colapsável) */}
          {showActions && (
            <div className={`transition-all duration-300 bg-black/20 backdrop-blur-sm border-l border-purple-500/20 p-4 overflow-y-auto overflow-x-hidden ${
              rightPanelExpanded ? 'w-80' : 'w-16'
            }`}>
              {/* Header com botão de collapse */}
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

              {/* Conteúdo expandido */}
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

              {/* Versão compacta quando colapsado */}
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
        onClose={async () => {
          try {
            const { getSocketStoreAPI } = await import('../../../store/index.js');
            getSocketStoreAPI().setState({ sessionRecap: null });
          } catch (_) {}
        }}
      />
    </div>
  );
};

export default EtapaJogoRPG;
