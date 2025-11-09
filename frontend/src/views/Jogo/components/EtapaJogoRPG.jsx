import React, { useState, useEffect } from 'react';
import { RPGActions } from '../../../components/RPGActions';
import BackgroundEffects from './shared/BackgroundEffects';
import HeaderJogoRPG from './rpg/HeaderJogoRPG';
import PainelJogadores from './rpg/PainelJogadores';
import ChatArea from './rpg/ChatArea';
import InputArea from './rpg/InputArea';
import StatusPersonagem from './rpg/StatusPersonagem';
import { etapaJogoRPGViewModel } from '../../../viewmodels/Jogo';

/**
 * Layout do jogo RPG ativo - Usando ViewModel específico
 * 📍 Usado por: JogoView (etapa 'jogo-ativo')
 * 🎯 MIGRADO: Agora usa ViewModel específico para lógica de negócio
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

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = etapaJogoRPGViewModel.subscribe(setViewModelState);
    return unsubscribe;
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

        // Adicionar listeners
        socketStore.on('mensagem_mestre', handleMensagemMestre);
        socketStore.on('chat_message', handleChatMessage);

        console.log('📡 Listeners de mensagens configurados');

        // Cleanup
        return () => {
          socketStore.off('mensagem_mestre', handleMensagemMestre);
          socketStore.off('chat_message', handleChatMessage);
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

      // Enviar mensagem para o Mestre via WebSocket
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
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para o Mestre:', error);
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

  const handleExecutarAcao = (acao, target = null, description = null) => {
    // Se description foi fornecida, usar ela; caso contrário, formatar a ação
    const textoAcao = description || acao;
    const mensagemAcao = etapaJogoRPGViewModel.criarMensagemAcao(textoAcao);
    onAdicionarMensagem(mensagemAcao);
  };

  const toggleActions = () => {
    etapaJogoRPGViewModel.toggleActions();
  };

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
          <PainelJogadores participantes={participantesFormatados} />

          {/* Área Central - Chat do Mestre */}
          <div className="flex-1 flex flex-col">
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