import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useJogo, useJogoSocket, useJogoGuard } from '../hooks';

/**
 * Model hook para a pagina de Jogo Ativo.
 * Terceira etapa do jogo - jogo em andamento.
 */
export const useJogoAtivoModel = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();

  // Validacao de acesso
  useJogoGuard('jogo-ativo');

  // Shared hooks
  const jogo = useJogo();
  const socket = useJogoSocket();

  const {
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    mensagens,
    statusPersonagem,
    error,
    adicionarMensagem,
    atualizarStatusPersonagem,
    carregarMensagensSalvas,
    retomarJogo,
    sairDoJogo,
    clearErrors,
  } = jogo;

  const {
    isConnected,
    socketError,
    isReconnecting,
    conectarSocket,
    clearSocketError,
  } = socket;

  // Inicializacao e retomada de sessao
  useEffect(() => {
    const inicializarOuRetomar = async () => {
      // Se nao tem historia carregada, pode ser uma retomada de sessao
      if (!historiaAtual) {
        try {
          const { historiaService } = await import('../../../services/index.js');
          const sessaoData = await historiaService.verificarSessaoAtiva(id);

          if (sessaoData && sessaoData.hasActiveSession) {
            await retomarJogo(id, user);
          }
        } catch (err) {
          console.error('Erro ao retomar sessão:', err);
        }
      }

      // Conectar socket se ainda não está conectado
      if (!isConnected && user) {
        try {
          await conectarSocket({
            userId: user.id,
            username: user.nome || user.name,
            email: user.email,
          });
        } catch (err) {
          console.error('Erro ao conectar socket:', err);
        }
      }
    };

    inicializarOuRetomar();
    hideSidebar();

    return () => openSidebar();
  }, []);

  // Carregar mensagens salvas
  useEffect(() => {
    if (historiaAtual?.id && isConnected) {
      carregarMensagensSalvas(historiaAtual.id);
    }
  }, [historiaAtual?.id, isConnected, carregarMensagensSalvas]);

  // Handlers
  const handleSair = useCallback(() => {
    sairDoJogo();
    navigate('/historias');
  }, [sairDoJogo, navigate]);

  const handleAdicionarMensagem = useCallback((mensagem) => {
    adicionarMensagem(mensagem);
  }, [adicionarMensagem]);

  const handleAtualizarStatus = useCallback((status) => {
    atualizarStatusPersonagem(status);
  }, [atualizarStatusPersonagem]);

  const handleClearErrors = useCallback(() => {
    clearErrors();
    clearSocketError();
  }, [clearErrors, clearSocketError]);

  return {
    // State
    user,
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    mensagens,
    statusPersonagem,
    error,
    socketError,
    isConnected,
    isReconnecting,

    // Handlers
    handleSair,
    handleAdicionarMensagem,
    handleAtualizarStatus,
    handleClearErrors,
  };
};

export default useJogoAtivoModel;
