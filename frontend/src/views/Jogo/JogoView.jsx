import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useGame } from '../../contexts/GameContext';
import { useGameLoading } from '../../contexts/GameLoadingContext';
import Notification from '../../components/Notification.jsx';

// 🎨 Importar componentes das etapas
import { EtapaSelecaoPersonagem } from './components';
import { EtapaSalaEspera } from './components';
import { EtapaJogoRPG } from './components';

// 🔧 Importar componentes compartilhados
import { AuthLoading, AuthError } from './components/shared/LoadingStates';
import HistoriaNotFound from './components/shared/HistoriaNotFound';

// 🎯 Importar ViewModel
import { jogoViewModel } from '../../viewmodels/Jogo';

/**
 * 🎮 VIEW PRINCIPAL DO JOGO - Usando ViewModel
 * 
 * Agora usa:
 * - jogoViewModel: Toda a lógica de negócio centralizada
 * - Estados reativos através de hooks
 * - Separação clara entre View e lógica
 */
export const JogoView = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { initializeGame, selectCharacter, joinWaitingRoom, startActiveGame, leaveGame } = useGame();
  const { getSelection, saveSelection } = useGameLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // 🎯 ESTADO DO VIEWMODEL - Usando hook personalizado
  const [viewModelState, setViewModelState] = useState(jogoViewModel.getState());
  
  // 🔒 FLAG PARA EVITAR MÚLTIPLAS TENTATIVAS DE CONEXÃO (useRef não causa re-render)
  const tentouConectarRef = useRef(false);

  // 🔄 SUBSCRIBE AO VIEWMODEL - Atualiza estado quando ViewModel muda
  useEffect(() => {
    const unsubscribe = jogoViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 📊 DESTRUCTURING DO ESTADO
  const {
    // Estados principais
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    etapaAtual,
    participantes,
    salaAberta,
    isDonoSala,
    mensagens,
    statusPersonagem,

    // Estados de loading e erro
    error,
    loadingPersonagens,
    errorPersonagens,
    
    // Estados do socket
    isConnected,
    socketError,

    // Estados do socket
    isTyping,
    roomUsers,
    isConnecting
  } = viewModelState;

  // 🎯 HANDLERS DAS ETAPAS - Agora usando ViewModel
  const handleSelecionarPersonagem = async (personagem) => {
    // Usar context para gerenciar a transição
    selectCharacter(personagem);
    
    // Usar ViewModel para lógica de negócio (agora assíncrono)
    await jogoViewModel.selecionarPersonagem(personagem, user);
  };

  const handleIniciarJogo = () => {
    // Usar context para gerenciar a transição
    startActiveGame();
    
    // Usar ViewModel para lógica de negócio
    jogoViewModel.iniciarJogo();
  };

  const handleSairDaSala = () => {
    // Usar context para gerenciar saída
    leaveGame();
    
    // Usar ViewModel para lógica de negócio
    jogoViewModel.sairDoJogo();
    navigate('/historias');
  };

  const handleVoltarEtapa = () => {
    const resultado = jogoViewModel.voltarEtapa();
    
    if (resultado === 'historias') {
      navigate('/historias');
    }
  };

  // 🚀 INICIALIZAÇÃO - Usando ViewModel
  useEffect(() => {
    const inicializar = async () => {
      try {
    // Verificar se veio de convite
    const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;

        // Verificar se há sessão ativa (usando historiaService com token)
        const { historiaService } = await import('../../services/index.js');
        const sessaoData = await historiaService.verificarSessaoAtiva(id);
        
        console.log('🔍 JogoView: Verificando sessão ativa:', sessaoData);
        console.log('🔍 JogoView: Condições:', {
          temSessaoData: !!sessaoData,
          hasActiveSession: sessaoData?.hasActiveSession,
          isPlaying: sessaoData?.isPlaying,
          userId: user?.id,
          condicaoFinal: sessaoData && sessaoData.hasActiveSession && sessaoData.isPlaying
        });
        
        if (sessaoData && sessaoData.hasActiveSession && sessaoData.isPlaying) {
          // Sessão ativa encontrada - RETOMAR JOGO
          console.log('🔄 JogoView: Detectada sessão ativa, retomando jogo...');
          await jogoViewModel.retomarJogo(id, user);  // Passar user também
        } else {
          // Sem sessão ativa - NOVO JOGO
          console.log('🆕 JogoView: Nenhuma sessão ativa OU usuário não está jogando, iniciando novo jogo...');
          console.log('  - Motivo: hasActiveSession?', sessaoData?.hasActiveSession, 'isPlaying?', sessaoData?.isPlaying);

    // Inicializar jogo com context
    initializeGame(id, { fromInvite });

    // Inicializar jogo com ViewModel
    jogoViewModel.initializeGame(id, { fromInvite });
        }

    // Esconder sidebar para tela cheia
    hideSidebar();
      } catch (error) {
        console.error('❌ JogoView: Erro ao verificar sessão:', error);
        // Em caso de erro, iniciar novo jogo
        initializeGame(id, { fromInvite: location.state?.fromInvite });
        jogoViewModel.initializeGame(id, { fromInvite: location.state?.fromInvite });
        hideSidebar();
      }
    };

    inicializar();

    // Cleanup ao desmontar
    return () => {
      openSidebar();
    };
  }, [id, location.state]);

  // 👥 CARREGAR PERSONAGENS - Usando ViewModel
  useEffect(() => {
    if (historiaAtual && user?.id) {
      jogoViewModel.carregarPersonagens(user.id);
    }
  }, [historiaAtual, user?.id]);

  // 🌐 CONEXÃO AUTOMÁTICA AO WEBSOCKET NA SALA DE ESPERA
  useEffect(() => {
    // EVITAR LOOP: Só tentar conectar UMA VEZ por sessão (usando ref)
    if (etapaAtual === 'sala-espera' && personagemSelecionado && !isConnected && !isConnecting && !tentouConectarRef.current && user) {
      // Marcar que tentou conectar para evitar loop
      tentouConectarRef.current = true;
      
      console.log('🔒 JogoView: Flag de conexão marcada - iniciando conexão...');

      // Verificar se veio de convite
      const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;
      
      if (fromInvite && historiaAtual?.id) {
        // Conectar como convidado (fluxo especial)
        console.log('🎯 JogoView: Detectado convidado, conectando via fluxo especial...');
        jogoViewModel.conectarComoConvidado(historiaAtual.id, personagemSelecionado.id, user)
          .catch(error => {
            console.error('❌ JogoView: Erro ao conectar convidado:', error);
            // Resetar flag para permitir retry manual
            tentouConectarRef.current = false;
          });
      } else {
        // Conectar como anfitrião (fluxo normal)
        console.log('👑 JogoView: Detectado anfitrião, conectando via fluxo normal...');
        jogoViewModel.conectarSocket({
          userId: user?.id,
          username: user?.nome || user?.name,
          email: user?.email
        }).catch(error => {
          console.error('❌ JogoView: Erro ao conectar anfitrião:', error);
          // Resetar flag para permitir retry manual
          tentouConectarRef.current = false;
        });
      }
    }
  }, [etapaAtual, personagemSelecionado, isConnected, isConnecting, user, historiaAtual, location.state]);
  
  // Resetar flag quando mudar de etapa (sair da sala de espera)
  useEffect(() => {
    if (etapaAtual !== 'sala-espera') {
      tentouConectarRef.current = false;
      console.log('🔓 JogoView: Flag de conexão resetada (saiu da sala de espera)');
    }
  }, [etapaAtual]);

  // 🎮 LISTENER PARA INÍCIO DA AVENTURA E REDIRECIONAMENTO (WebSocket)
  useEffect(() => {
    // Importar socketStore dinamicamente
    const setupListener = async () => {
      try {
        const { getSocketStoreAPI } = await import('../../store/index.js');
        const socketStore = getSocketStoreAPI();

        // Handler para quando a aventura for iniciada
        const handleAventuraIniciada = (data) => {
          console.log('🎮 JogoView: Aventura iniciada via WebSocket!', data);
          
          // Transição automática para jogo ativo
          jogoViewModel.mudarEtapa('jogo-ativo');
          startActiveGame();
        };

        // Handler para quando entrar na sala - verificar se sessão já foi iniciada
        const handleRoomJoined = (data) => {
          console.log('🏠 JogoView: Entrou na sala via room_joined:', data);
          console.log('  - Status da sessão:', data?.sessao?.status);
          
          if (data?.sessao?.status === 'iniciada') {
            console.log('🎮 JogoView: Sessão já iniciada! Redirecionando para jogo ativo...');
            
            // Carregar mensagens se disponíveis
            if (historiaAtual?.id) {
              jogoViewModel.carregarMensagensSalvas(historiaAtual.id);
            }
            
            // Ir para jogo ativo
            jogoViewModel.mudarEtapa('jogo-ativo');
          }
        };

        // Adicionar listeners SEMPRE (não depender de isConnected)
        console.log('📡 JogoView: Configurando listeners WebSocket globais');
        socketStore.on('aventura_iniciada', handleAventuraIniciada);
        socketStore.on('room_joined', handleRoomJoined);

        // Cleanup ao desmontar
        return () => {
          console.log('🧹 JogoView: Removendo listeners WebSocket');
          socketStore.off('aventura_iniciada', handleAventuraIniciada);
          socketStore.off('room_joined', handleRoomJoined);
        };
      } catch (error) {
        console.error('❌ JogoView: Erro ao configurar listeners:', error);
      }
    };

    setupListener();
  }, [historiaAtual, startActiveGame]);

  // 🔒 VALIDAÇÕES DE ACESSO - Usando ViewModel
  if (!jogoViewModel.isUserAuthenticated(user)) {
    return <AuthLoading message="Verificando autenticação..." />;
  }

  if (error && !jogoViewModel.isHistoriaLoaded()) {
    return <AuthError message={error} onRetry={() => jogoViewModel.clearErrors()} />;
  }

  if (!jogoViewModel.isHistoriaLoaded() && jogoViewModel.isLoading()) {
    return <AuthLoading message="Carregando história..." />;
  }

  if (!jogoViewModel.isHistoriaLoaded()) {
    return <HistoriaNotFound onVoltar={() => navigate('/historias')} />;
  }

  // 🎨 RENDERIZAÇÃO POR ETAPA
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 🚨 Notificações de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={() => jogoViewModel.clearErrors()}
        />
      )}

      {socketError && (
        <Notification
          message={`Erro de conexão: ${socketError}`}
          type="error"
          onClose={() => jogoViewModel.clearErrors()}
        />
      )}

      {errorPersonagens && (
        <Notification
          message={`Erro ao carregar personagens: ${errorPersonagens}`}
          type="error"
          onClose={() => jogoViewModel.clearErrorPersonagens()}
        />
      )}

      {/* 🎯 RENDERIZAÇÃO CONDICIONAL POR ETAPA */}

      {etapaAtual === 'selecao-personagem' && (
        <EtapaSelecaoPersonagem
          historia={historiaAtual}
          personagens={personagensDaHistoria}
          personagemSelecionado={personagemSelecionado}
          loading={loadingPersonagens}
          error={errorPersonagens}
          onSelecionarPersonagem={handleSelecionarPersonagem}
          onVoltar={handleVoltarEtapa}
        />
      )}

      {etapaAtual === 'sala-espera' && (
        <EtapaSalaEspera
          historia={historiaAtual}
          personagemSelecionado={personagemSelecionado}
          participantes={participantes}
          isDonoSala={isDonoSala}
          salaAberta={salaAberta}
          socketConnected={isConnected}
          roomUsers={roomUsers}
          onIniciarJogo={handleIniciarJogo}
          onSair={handleSairDaSala}
          onVoltar={handleVoltarEtapa}
        />
      )}

      {etapaAtual === 'jogo-ativo' && (
        <EtapaJogoRPG
          historia={historiaAtual}
          personagemSelecionado={personagemSelecionado}
          participantes={participantes}
          mensagens={mensagens}
          statusPersonagem={statusPersonagem}
          isDonoSala={isDonoSala}
          socketConnected={isConnected}
          isTyping={isTyping}
          onAdicionarMensagem={(mensagem) => jogoViewModel.adicionarMensagem(mensagem)}
          onAtualizarStatus={(status) => jogoViewModel.atualizarStatusPersonagem(status)}
          onSair={handleSairDaSala}
        />
      )}
    </div>
  );
};

export default JogoView; 