import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import Notification from '../../../components/Notification.jsx';
import { EtapaJogoRPG } from '../../../components/Jogo';
import { AuthLoading } from '../../../components/Jogo/Shared/LoadingStates';
import { jogoViewModel } from '../../../viewmodels/Jogo';
import useGameStore from '../../../store/game';
import { useJogoGuard } from '../hooks';

/**
 * 🎮 PÁGINA DE JOGO ATIVO
 * 
 * Terceira etapa do jogo - jogo em andamento
 * 
 * VALIDAÇÕES:
 * - Redireciona para sala-espera se sala não estiver aberta
 * - Redireciona para seleção se não tiver personagem
 */
export const JogoAtivoView = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();

  // 🔒 VALIDAÇÃO DE ACESSO - Redireciona se não tiver requisitos
  useJogoGuard('jogo-ativo');

  // 🎯 ESTADO DO VIEWMODEL
  const [viewModelState, setViewModelState] = useState(jogoViewModel.getState());

  // 🎮 ESTADO DO GAMESTORE
  const {
    personagemSelecionado,
    historiaAtual,
    participantes,
    isDonoSala,
    salaAberta,
    mensagens,
    statusPersonagem
  } = useGameStore();

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
    isTyping
  } = viewModelState;

  // 🚀 INICIALIZAÇÃO E RETOMADA DE SESSÃO
  useEffect(() => {
    const inicializarOuRetomar = async () => {
      // Se não tem história carregada, pode ser uma retomada de sessão
      if (!historiaAtual) {
        try {
          const { historiaService } = await import('../../../services/index.js');
          const sessaoData = await historiaService.verificarSessaoAtiva(id);

          if (sessaoData && sessaoData.hasActiveSession) {
            // Retomar jogo com história e personagem da sessão
            await jogoViewModel.retomarJogo(id, user);
          }
        } catch (error) {
          // silenced
        }
      }
    };
    
    inicializarOuRetomar();
    hideSidebar();
    
    return () => openSidebar();
  }, []);

  // 📥 CARREGAR MENSAGENS SALVAS
  useEffect(() => {
    if (historiaAtual?.id && isConnected) {
      jogoViewModel.carregarMensagensSalvas(historiaAtual.id);
    }
  }, [historiaAtual?.id, isConnected]);

  // 🎯 HANDLERS
  const handleSair = () => {
    jogoViewModel.sairDoJogo();
    navigate('/historias');
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

  if (!salaAberta) {
    return <AuthLoading message="Aguardando sala..." />;
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

      {/* Componente de Jogo Ativo */}
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
        onSair={handleSair}
      />
    </div>
  );
};

export default JogoAtivoView;

