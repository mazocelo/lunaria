import { useEffect, useCallback, useRef } from 'react';
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
    garantirEntradaSala,
    clearSocketError,
  } = socket;

  const resumeAttemptKeyRef = useRef(null);
  const joinAttemptKeyRef = useRef(null);

  // Layout
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, [hideSidebar, openSidebar]);

  // Retomar sessao se usuario entrou direto em jogo-ativo e ainda nao carregou historia.
  useEffect(() => {
    if (!id || !user?.id || historiaAtual?.id) return;

    const key = `${id}:${user.id}`;
    if (resumeAttemptKeyRef.current === key) return;
    resumeAttemptKeyRef.current = key;

    const tryResume = async () => {
      try {
        const { historiaService } = await import('../../../services/index.js');
        const sessaoData = await historiaService.verificarSessaoAtiva(id);
        if (sessaoData?.hasActiveSession) {
          await retomarJogo(id, user);
        }
      } catch (err) {
        console.error('Erro ao retomar sessao:', err);
      }
    };

    tryResume();
  }, [id, user?.id, historiaAtual?.id, retomarJogo]);

  // Conectar socket sempre que tiver usuario e estiver desconectado.
  useEffect(() => {
    if (!user?.id || isConnected) return;

    const connect = async () => {
      try {
        await conectarSocket({
          userId: user.id,
          username: user.nome || user.name,
          email: user.email,
        });
      } catch (err) {
        console.error('Erro ao conectar socket:', err);
      }
    };

    connect();
  }, [user?.id, user?.nome, user?.name, user?.email, isConnected, conectarSocket]);

  // Se estiver conectado e com historia+personagem, garantir entrada na sala.
  useEffect(() => {
    if (!isConnected || !user?.id || !historiaAtual?.id || !personagemSelecionado?.id) return;

    const key = `${historiaAtual.id}:${personagemSelecionado.id}:${user.id}`;
    if (joinAttemptKeyRef.current === key) return;
    joinAttemptKeyRef.current = key;

    const ensureJoin = async () => {
      try {
        await garantirEntradaSala({
          userId: user.id,
          username: user.nome || user.name,
          email: user.email,
        });
      } catch (err) {
        console.error('Erro ao entrar na sala do jogo ativo:', err);
      }
    };

    ensureJoin();
  }, [
    isConnected,
    user?.id,
    user?.nome,
    user?.name,
    user?.email,
    historiaAtual?.id,
    personagemSelecionado?.id,
    garantirEntradaSala,
  ]);

  useEffect(() => {
    if (!isConnected) {
      joinAttemptKeyRef.current = null;
    }
  }, [isConnected]);

  // Carregar mensagens salvas ao ter historia carregada e socket conectado.
  useEffect(() => {
    if (historiaAtual?.id && isConnected) {
      carregarMensagensSalvas(historiaAtual.id);
    }
  }, [historiaAtual?.id, isConnected, carregarMensagensSalvas]);

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
    handleSair,
    handleAdicionarMensagem,
    handleAtualizarStatus,
    handleClearErrors,
  };
};

export default useJogoAtivoModel;
