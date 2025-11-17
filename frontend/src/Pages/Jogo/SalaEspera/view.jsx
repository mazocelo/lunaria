import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useGameLoading } from '../../../contexts/GameLoadingContext';
import Notification from '../../../components/Notification.jsx';
import { EtapaSalaEspera } from '../../../views/Jogo/components';
import { AuthLoading } from '../../../views/Jogo/components/shared/LoadingStates';
import { jogoViewModel } from '../../../viewmodels/Jogo';
import useGameStore from '../../../store/game';
import { useJogoGuard } from '../hooks';

/**
 * 🎮 PÁGINA DE SALA DE ESPERA
 * 
 * Segunda etapa do jogo - aguardando outros jogadores
 * Ao iniciar jogo, navega para /jogo/:id/jogo-ativo
 * 
 * VALIDAÇÕES:
 * - Redireciona para seleção se não tiver personagem selecionado
 */
export const SalaEsperaView = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { getSelection } = useGameLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // 🔒 VALIDAÇÃO DE ACESSO - Redireciona se não tiver requisitos
  useJogoGuard('sala-espera');

  // 🎯 ESTADO DO VIEWMODEL
  const [viewModelState, setViewModelState] = useState(jogoViewModel.getState());
  
  // 🔒 FLAG PARA EVITAR MÚLTIPLAS CONEXÕES
  const tentouConectarRef = useRef(false);

  // 🎮 ESTADO DO GAMESTORE
  const { personagemSelecionado, historiaAtual, participantes, isDonoSala, salaAberta } = useGameStore();

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = jogoViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 📊 DESTRUCTURING DO ESTADO DO VIEWMODEL
  const {
    error,
    isConnected,
    socketError,
    isTyping,
    roomUsers,
    isConnecting
  } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, []);

  // 🌐 CONEXÃO AUTOMÁTICA AO WEBSOCKET
  useEffect(() => {
    // Só conectar se tiver personagem e não estiver conectado
    if (personagemSelecionado && !isConnected && !isConnecting && !tentouConectarRef.current && user) {
      tentouConectarRef.current = true;
      
      console.log('🔒 SalaEspera: Iniciando conexão WebSocket...');

      const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;
      
      if (fromInvite && historiaAtual?.id) {
        // Conectar como convidado
        console.log('🎯 SalaEspera: Conectando como convidado...');
        jogoViewModel.conectarComoConvidado(historiaAtual.id, personagemSelecionado.id, user)
          .catch(error => {
            console.error('❌ SalaEspera: Erro ao conectar convidado:', error);
            tentouConectarRef.current = false;
          });
      } else {
        // Conectar como anfitrião
        console.log('👑 SalaEspera: Conectando como anfitrião...');
        jogoViewModel.conectarSocket({
          userId: user?.id,
          username: user?.nome || user?.name,
          email: user?.email
        }).catch(error => {
          console.error('❌ SalaEspera: Erro ao conectar anfitrião:', error);
          tentouConectarRef.current = false;
        });
      }
    }
  }, [personagemSelecionado, isConnected, isConnecting, user, historiaAtual, location.state]);

  // 🎮 LISTENER PARA INÍCIO DA AVENTURA
  useEffect(() => {
    const setupListener = async () => {
      try {
        const { getSocketStoreAPI } = await import('../../../store/index.js');
        const socketStore = getSocketStoreAPI();

        // Handler quando aventura é iniciada
        const handleAventuraIniciada = (data) => {
          console.log('🎮 SalaEspera: Aventura iniciada!', data);
          navigate(`/jogo/${id}/jogo-ativo`);
        };

        // Handler quando entra na sala - verificar se já foi iniciada
        const handleRoomJoined = (data) => {
          console.log('🏠 SalaEspera: Entrou na sala:', data);
          
          if (data?.sessao?.status === 'iniciada') {
            console.log('🎮 SalaEspera: Sessão já iniciada! Redirecionando...');
            
            // Carregar mensagens se disponíveis
            if (historiaAtual?.id) {
              jogoViewModel.carregarMensagensSalvas(historiaAtual.id);
            }
            
            // Ir para jogo ativo
            navigate(`/jogo/${id}/jogo-ativo`);
          }
        };

        // Adicionar listeners
        console.log('📡 SalaEspera: Configurando listeners WebSocket');
        socketStore.on('aventura_iniciada', handleAventuraIniciada);
        socketStore.on('room_joined', handleRoomJoined);

        // Cleanup
        return () => {
          console.log('🧹 SalaEspera: Removendo listeners WebSocket');
          socketStore.off('aventura_iniciada', handleAventuraIniciada);
          socketStore.off('room_joined', handleRoomJoined);
        };
      } catch (error) {
        console.error('❌ SalaEspera: Erro ao configurar listeners:', error);
      }
    };

    setupListener();
  }, [historiaAtual, id, navigate]);

  // 🎯 HANDLERS
  const handleIniciarJogo = () => {
    jogoViewModel.iniciarJogo();
    // Navegação será feita pelo listener aventura_iniciada
  };

  const handleSair = () => {
    jogoViewModel.sairDoJogo();
    navigate('/historias');
  };

  const handleVoltar = () => {
    navigate(`/jogo/${id}/selecao-personagem`);
  };

  // 🔒 VALIDAÇÕES
  if (!jogoViewModel.isUserAuthenticated(user)) {
    return <AuthLoading message="Verificando autenticação..." />;
  }

  if (!historiaAtual) {
    return <AuthLoading message="Carregando história..." />;
  }

  if (!personagemSelecionado) {
    return <AuthLoading message="Redirecionando..." />;
  }

  // 🎨 RENDERIZAÇÃO
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Notificações */}
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

      {/* Componente de Sala de Espera */}
      <EtapaSalaEspera
        historia={historiaAtual}
        personagemSelecionado={personagemSelecionado}
        participantes={participantes}
        isDonoSala={isDonoSala}
        salaAberta={salaAberta}
        socketConnected={isConnected}
        roomUsers={roomUsers}
        onIniciarJogo={handleIniciarJogo}
        onSair={handleSair}
        onVoltar={handleVoltar}
      />
    </div>
  );
};

export default SalaEsperaView;

