import React, { useState, useEffect } from 'react';
import { RPGActions } from '../../RPGActions';
import BackgroundEffects from '../Shared/BackgroundEffects';
import PainelJogadores from '../Chat/PainelJogadores';
import ChatArea from '../Chat/ChatArea';
import InputArea from '../Chat/InputArea';
import StatusPersonagem from '../Gameplay/StatusPersonagem';
import RolagemDadosInicial from '../Gameplay/RolagemDadosInicial';
import BatalhaUI from '../Gameplay/BatalhaUI';
import { etapaJogoRPGViewModel } from '../../../viewmodels/Jogo';
import NotificationManager from '../NotificationManager';
import FichaPersonagemModal from '../Modals/FichaPersonagemModal';
import { personagemService } from '../../../services';
import { TIMEOUTS, ROLEPLAY_COOLDOWN_SECONDS, PARTICLES } from '../../../constants/game';

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
  onAdicionarMensagem,
  onAtualizarStatus,
  onSair
}) => {
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
    combateXpGanho: 0
  });

  // ⏱️ Timer local para cooldown roleplay
  const [cooldownLocal, setCooldownLocal] = useState(0);
  const cooldownIntervalRef = React.useRef(null);

  // 📊 Estado para dropdown de informações da rodada
  const [showRodadaInfo, setShowRodadaInfo] = useState(false);
  const rodadaDropdownRef = React.useRef(null);

  // 🎲 Estado para controlar solicitação de dados do Mestre
  const [dadosSolicitados, setDadosSolicitados] = useState(false);
  const [aguardandoMestre, setAguardandoMestre] = useState(false);
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [fichaCarregando, setFichaCarregando] = useState(false);
  const [fichaErro, setFichaErro] = useState(null);
  const [tituloFicha, setTituloFicha] = useState('Ficha do Personagem');
  const [fichasCache, setFichasCache] = useState({});

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
        
        // Subscribe para mudanças no socket store
        unsubscribe = socketStore.subscribe((state) => {
          setSocketState({
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
            combateXpGanho: state.combateXpGanho || 0
          });
        });
      } catch (error) {
        console.error('❌ Erro ao conectar ao socket store:', error);
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

  // 🧹 Listener para limpar mensagens de dados quando ordem definida
  useEffect(() => {
    const limparMensagensDados = async () => {
      console.log('🧹 Evento de limpar mensagens recebido');
      
      // Filtrar mensagens para manter apenas a do Mestre
      const { jogoViewModel } = await import('../../../viewmodels/Jogo/index.js');
      const mensagensAtuais = jogoViewModel.getState().mensagens || [];
      
      // Manter apenas mensagens do tipo 'mestre'
      const mensagensFiltradas = mensagensAtuais.filter(m => m.tipo === 'mestre' || m.tipo === 'entre_rodadas');
      
      jogoViewModel.limparMensagensDados(mensagensFiltradas);
      console.log(`✅ Mensagens filtradas: ${mensagensAtuais.length} → ${mensagensFiltradas.length}`);
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
          console.log('🎭 Mensagem do Mestre recebida:', data);
          
          // ✅ Remover mensagens de loading antes de adicionar resposta real
          try {
            const { jogoViewModel } = await import('../../../viewmodels/Jogo/index.js');
            const mensagensAtuais = jogoViewModel.getState().mensagens || [];
            const mensagensSemLoading = mensagensAtuais.filter(m => m.tipo !== 'loading');
            
            if (mensagensAtuais.length !== mensagensSemLoading.length) {
              jogoViewModel.setMensagens(mensagensSemLoading);
            }
          } catch (error) {
            console.error('Erro ao limpar loading:', error);
          }
          
          // ✅ Desativar loading
          setAguardandoMestre(false);
          
          const mensagem = {
            id: data.id || Date.now(),
            userId: 'mestre',
            username: 'Mestre',
            message: data.message,
            tipo: 'mestre',
            timestamp: data.timestamp || Date.now()
          };
          
          if (onAdicionarMensagem) {
            onAdicionarMensagem(mensagem);
          }
        };

        // Listener para mensagens de chat normais (eco dos jogadores)
        const handleChatMessage = (data) => {
          console.log('💬 Mensagem de chat recebida:', data);
          
          // Só adicionar se não for mestre (mensagens do mestre vêm pelo outro listener)
          if (data.userId !== 'mestre' && data.tipo !== 'mestre') {
            if (onAdicionarMensagem) {
              onAdicionarMensagem(data);
            }
          }
        };

        // Listener para resultados de dados
        const handleResultadoDado = (data) => {
          console.log('🎲 Resultado de dado recebido:', data);
          
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
          
          if (onAdicionarMensagem) {
            onAdicionarMensagem(mensagem);
          }
        };

        // Listener para mensagens roleplay
        const handleMensagemRoleplay = (data) => {
          console.log('💬 Mensagem roleplay recebida:', data);
          
          const mensagem = {
            id: data.id || Date.now(),
            userId: data.userId,
            username: data.username,
            message: data.message,
            tipo: 'roleplay',
            timestamp: data.timestamp || Date.now()
          };
          
          if (onAdicionarMensagem) {
            onAdicionarMensagem(mensagem);
          }
        };

        // Listener para rodada finalizada (narrativa entre rodadas)
        const handleRodadaFinalizada = (data) => {
          console.log('🏁 Rodada finalizada:', data);
          
          const mensagem = {
            id: `rodada_${data.rodada}_fim`,
            tipo: 'entre_rodadas',
            titulo: `Fim da Rodada ${data.rodada}`,
            mensagem: `A rodada ${data.rodada} foi concluída. Preparando próxima rodada...`,
            timestamp: data.timestamp || Date.now()
          };
          
          if (onAdicionarMensagem) {
            onAdicionarMensagem(mensagem);
          }
        };

        // Listener para ordem definida - limpar chat de dados
        const handleOrdemDefinida = (data) => {
          console.log('📋 Ordem definida - limpando mensagens de dados:', data);
          
          // Emitir evento customizado para limpar mensagens
          const event = new CustomEvent('limparMensagensDados');
          window.dispatchEvent(event);
        };

        // Listener para dice_roll (dados normais durante o jogo)
        const handleDiceRoll = (data) => {
          console.log('🎲 Dado rolado - data recebido:', data);
          
          // ✅ Se era o usuário atual que rolou, desbloquear input
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (String(data.userId) === String(user.id)) {
            setDadosSolicitados(false);
            console.log('✅ Input desbloqueado - dado rolado');
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
          
          console.log('🎲 Mensagem criada para adicionar:', {
            tipo: mensagem.tipo,
            result: mensagem.result,
            dice: mensagem.dice,
            username: mensagem.username
          });
          
          if (onAdicionarMensagem) {
            onAdicionarMensagem(mensagem);
          }
        };

        // Listener para solicitação de dados do Mestre
        const handleMestreSolicitaDados = (data) => {
          console.log('🎲 Mestre solicitou dados:', data);
          
          // ✅ Ativar estado de dados solicitados
          setDadosSolicitados(true);
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

        console.log('📡 Listeners de mensagens configurados');

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
          console.log('🧹 Listeners de mensagens removidos');
        };
      } catch (error) {
        console.error('❌ Erro ao configurar listeners de mensagens:', error);
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
  const participantesFormatados = etapaJogoRPGViewModel.formatarParticipantes(participantes, { id: 'current-user' });

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
      console.log('⚠️ Mensagem vazia, não enviando');
      return;
    }
    
    // Prevenir envios duplicados
    if (enviandoRef.current) {
      console.log('⚠️ Já está enviando mensagem, aguarde...');
      return;
    }
    
    try {
      enviandoRef.current = true;
      console.log('📤 EtapaJogoRPG: Iniciando envio de mensagem:', mensagemAtual.substring(0, 50));
      
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
          console.log(`⏱️ Cooldown ativo: ${cooldownLocal}s restantes`);
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
          console.log('✅ Mensagem enviada para o Mestre, aguardando resposta...');
        } else {
          // ✅ Remover loading se falhar
          setAguardandoMestre(false);
          console.log('❌ Falha ao enviar mensagem (socket desconectado)');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    } finally {
      // Resetar flag após um pequeno delay para evitar duplo clique
      setTimeout(() => {
        enviandoRef.current = false;
      }, TIMEOUTS.FLAG_RESET_DELAY);
    }
  };

  const handleRolarDados = async (tipoDado = 'd20', descricao = '') => {
    try {
      console.log('🎲 handleRolarDados chamado com:', { tipoDado, descricao });
      
      // Durante o jogo, emitir para o backend ao invés de adicionar localmente
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const roomId = `historia_${historia?.id}`;

      // Rolar dados localmente para obter resultado
      const resultado = etapaJogoRPGViewModel.rolarDados(tipoDado, descricao);
      console.log('🎲 Resultado local:', resultado);

      // Emitir para o backend (backend irá distribuir para todos)
      const enviado = socketStore.safeEmit('dice_roll', {
        roomId: roomId,
        userId: String(user.id),
        username: user.nome || user.name,
        dice: String(tipoDado),
        result: String(resultado.resultado),
        description: descricao || ''
      });

      if (enviado) {
        console.log(`✅ Dado ${tipoDado} rolado e enviado: ${resultado.resultado}`);
      } else {
        console.warn('⚠️ Falhou ao enviar dado, usando fallback local');
        // Se falhar ao enviar, adicionar localmente como fallback
        onAdicionarMensagem(resultado.mensagem);
      }
    } catch (error) {
      console.error('❌ Erro ao rolar dados:', error);
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
      
      const sucesso = socketStore.getState().rolarDadoInicial();
      
      if (sucesso) {
        console.log('✅ Evento de rolar dado inicial emitido');
      } else {
        console.error('❌ Falha ao emitir evento de rolar dado inicial');
      }
    } catch (error) {
      console.error('❌ Erro ao rolar dado inicial:', error);
    }
  };

  // ⚡ Handler para iniciar turno (receber mensagem inicial do Mestre)
  const handleIniciarTurno = async () => {
    try {
      const { getSocketStoreAPI } = await import('../../../store/index.js');
      const socketStore = getSocketStoreAPI();
      
      const sucesso = socketStore.getState().iniciarTurno();
      
      if (sucesso) {
        console.log('✅ Turno iniciado com sucesso');
      } else {
        console.error('❌ Falha ao iniciar turno');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar turno:', error);
    }
  };

  const handleExecutarAcao = (acao, target = null, description = null) => {
    // Se description foi fornecida, usar ela; caso contrário, formatar a ação
    const textoAcao = description || acao;
    const mensagemAcao = etapaJogoRPGViewModel.criarMensagemAcao(textoAcao);
    onAdicionarMensagem(mensagemAcao);
  };

  const toggleActions = () => {
    etapaJogoRPGViewModel.toggleActions();
  };


  // 📊 Preparar dados para componentes
  const user = JSON.parse(localStorage.getItem('user') || '{}');
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
      console.error('❌ Erro ao carregar ficha do personagem:', error);
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
        {/* Barra de Controle - Botões Fixos */}
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-3">
          {/* Botão RODADA com dropdown */}
          <div className="relative" ref={rodadaDropdownRef}>
            <button
              onClick={() => setShowRodadaInfo(!showRodadaInfo)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>📊</span>
              <span>RODADA</span>
            </button>
            
            {/* Dropdown de informações */}
            {showRodadaInfo && (
              <div className="absolute right-0 mt-2 w-80 glass p-4 rounded-xl border-2 border-purple-500/50 shadow-2xl animate-fade-in max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  <div>
                    <p className="text-purple-300 text-xs font-semibold mb-1">História</p>
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
                         'Aguardando Início'}
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
                              <span className="text-cyan-400 text-xs font-bold">⚡ TURNO</span>
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
            className="px-4 py-2 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2 bg-gradient-to-r from-cyan-600/70 to-purple-600/70 text-white border-2 border-cyan-300/40 hover:from-cyan-500/80 hover:to-purple-500/80"
          >
            <span>📜</span>
            <span>MINHA FICHA</span>
          </button>
          
          {/* Botão AÇÕES */}
          <button
            onClick={toggleActions}
            className={`px-4 py-2 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2 ${
              showActions 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300' 
                : 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-purple-200 hover:from-purple-600/60 hover:to-pink-600/60 border-2 border-purple-500/30'
            }`}
          >
            <span>⚡</span>
            <span>AÇÕES</span>
          </button>
          
          {/* Botão SAIR */}
          <button
            onClick={onSair}
            className="px-4 py-2 bg-red-500/30 text-red-200 border-2 border-red-500/50 rounded-xl hover:bg-red-500/40 transition-all font-bold shadow-lg transform hover:scale-105 flex items-center space-x-2"
          >
            <span>🚪</span>
            <span>SAIR</span>
          </button>
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
              usuariosDigitando={isTyping || isTypingLocal}
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
              aguardandoMestre={aguardandoMestre}
              combateAtivo={socketState.combateAtivo}
            />
          </div>

          {/* Painel Lateral Direito - Ações RPG */}
          {showActions && (
            <div className="w-80 bg-black/20 backdrop-blur-sm border-l border-purple-500/20 p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-white font-bold text-lg">🎲 Ações RPG</h3>
                <RPGActions
                  onRollDice={handleRolarDados}
                  onExecuteAction={handleExecutarAcao}
                />
                
                {/* Status do personagem */}
                <div className="border-t border-purple-500/20 pt-4">
                  <h4 className="text-white font-semibold mb-2">📊 Status</h4>
                  <StatusPersonagem
                    personagemSelecionado={infoPersonagem}
                    onRolarDados={handleRolarDados}
                    compact={true}
                  />
                </div>
              </div>
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
    </div>
  );
};

export default EtapaJogoRPG;
