import React, { useState, useEffect } from 'react';
import { RPGActions } from '../../../components/RPGActions';
import BackgroundEffects from './shared/BackgroundEffects';
import HeaderJogoRPG from './rpg/HeaderJogoRPG';
import PainelJogadores from './rpg/PainelJogadores';
import ChatArea from './rpg/ChatArea';
import InputArea from './rpg/InputArea';
import StatusPersonagem from './rpg/StatusPersonagem';
import RolagemDadosInicial from './rpg/RolagemDadosInicial';
import IndicadorTurno from './rpg/IndicadorTurno';
import { etapaJogoRPGViewModel } from '../../../viewmodels/Jogo';

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
    cooldownRoleplay: 0
  });

  // ⏱️ Timer local para cooldown roleplay
  const [cooldownLocal, setCooldownLocal] = useState(0);
  const cooldownIntervalRef = React.useRef(null);

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
            cooldownRoleplay: state.cooldownRoleplay || 0
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
      }, 1000);
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
      const { default: jogoViewModel } = await import('../../../viewmodels/Jogo/jogoViewModel.js');
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

  // 🎭 LISTENERS PARA MENSAGENS DO MESTRE E JOGADORES
  useEffect(() => {
    const setupListeners = async () => {
      try {
        const { getSocketStoreAPI } = await import('../../../store/index.js');
        const socketStore = getSocketStoreAPI();

        // Listener para mensagens do Mestre
        const handleMensagemMestre = (data) => {
          console.log('🎭 Mensagem do Mestre recebida:', data);
          
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

        // Adicionar listeners
        socketStore.on('mensagem_mestre', handleMensagemMestre);
        socketStore.on('chat_message', handleChatMessage);
        socketStore.on('resultado_dado_inicial', handleResultadoDado);
        socketStore.on('mensagem_roleplay', handleMensagemRoleplay);
        socketStore.on('rodada_finalizada', handleRodadaFinalizada);
        socketStore.on('ordem_definida', handleOrdemDefinida);

        console.log('📡 Listeners de mensagens configurados');

        // Cleanup
        return () => {
          socketStore.off('mensagem_mestre', handleMensagemMestre);
          socketStore.off('chat_message', handleChatMessage);
          socketStore.off('resultado_dado_inicial', handleResultadoDado);
          socketStore.off('mensagem_roleplay', handleMensagemRoleplay);
          socketStore.off('rodada_finalizada', handleRodadaFinalizada);
          socketStore.off('ordem_definida', handleOrdemDefinida);
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
          // Iniciar cooldown local de 12 segundos
          setCooldownLocal(12);
          etapaJogoRPGViewModel.clearMensagemAtual();
          console.log('✅ Mensagem roleplay enviada, cooldown de 12s iniciado');
        }
      } else {
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
          console.log('✅ Mensagem enviada para o Mestre com sucesso');
        } else {
          console.log('❌ Falha ao enviar mensagem (socket desconectado)');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    } finally {
      // Resetar flag após um pequeno delay para evitar duplo clique
      setTimeout(() => {
        enviandoRef.current = false;
      }, 500);
    }
  };

  const handleRolarDados = (tipoDado = 'd20', descricao = '') => {
    const resultado = etapaJogoRPGViewModel.rolarDados(tipoDado, descricao);
    onAdicionarMensagem(resultado.mensagem);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <BackgroundEffects particleCount={50} />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header Compact */}
        <HeaderJogoRPG
          historia={historia}
          participantes={participantesFormatados}
          showActions={showActions}
          setShowActions={toggleActions}
          onSairJogo={onSair}
          socketStatus={socketConnected}
        />

        {/* Main Game Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Painel Lateral Esquerdo - Outros Jogadores */}
          <PainelJogadores 
            participantes={participantesFormatados}
            ordemJogadores={socketState.ordemJogadores}
            resultadosDados={socketState.resultadosDados}
            turnoAtual={socketState.turnoAtual}
            faseJogo={socketState.faseJogo}
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

            {/* Indicador de Turno (durante o jogo) */}
            {socketState.faseJogo === 'rodada_em_andamento' && socketState.ordemJogadores.length > 0 && (
              <div className="p-6 pb-0">
                <IndicadorTurno
                  rodadaAtual={socketState.rodadaAtual}
                  turnoAtual={socketState.turnoAtual}
                  jogadorAtual={socketState.jogadorAtual}
                  ordemJogadores={socketState.ordemJogadores}
                  ehMeuTurno={socketState.ehMeuTurno}
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

        {/* Painel Inferior - Dados do Seu Personagem */}
        <StatusPersonagem
          personagemSelecionado={infoPersonagem}
          onRolarDados={handleRolarDados}
        />
      </div>
    </div>
  );
};

export default EtapaJogoRPG;