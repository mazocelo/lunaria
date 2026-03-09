import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useGameLoading } from '../../../contexts/GameLoadingContext';
import { useJogo, useJogoSocket, useJogoGuard } from '../hooks';

/**
 * Model hook para a pagina de Sala de Espera.
 * Segunda etapa do jogo - aguardando outros jogadores.
 * Ao iniciar jogo, navega para /jogo/:id/jogo-ativo.
 */
export const useSalaEsperaModel = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { getSelection } = useGameLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Validacao de acesso
  useJogoGuard('sala-espera');

  // Shared hooks
  const jogo = useJogo();
  const socket = useJogoSocket();

  const {
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    error,
    iniciarJogo,
    sairDoJogo,
    carregarMensagensSalvas,
    clearErrors,
  } = jogo;

  const {
    isConnected,
    isConnecting,
    socketError,
    roomUsers,
    conectarSocket,
    conectarComoConvidado,
    onSocketEvent,
    offSocketEvent,
    clearSocketError,
  } = socket;

  // Flag para evitar multiplas conexoes
  const tentouConectarRef = useRef(false);

  // Inicializacao de layout
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, []);

  // Conexao automatica ao WebSocket
  useEffect(() => {
    if (personagemSelecionado && !isConnected && !isConnecting && !tentouConectarRef.current && user) {
      tentouConectarRef.current = true;

      const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;

      if (fromInvite && historiaAtual?.id) {
        // Conectar como convidado
        conectarComoConvidado(historiaAtual.id, personagemSelecionado.id, user)
          .catch(() => {
            tentouConectarRef.current = false;
          });
      } else {
        // Conectar como anfitriao
        conectarSocket({
          userId: user?.id,
          username: user?.nome || user?.name,
          email: user?.email,
        })
          .then((result) => {
            // Se sessao ja foi iniciada, redirecionar para jogo ativo
            if (result?.sessionAlreadyStarted) {
              navigate(`/jogo/${id}/jogo-ativo`);
            }
          })
          .catch(() => {
            tentouConectarRef.current = false;
          });
      }
    }
  }, [personagemSelecionado, isConnected, isConnecting, user, historiaAtual, location.state]);

  // Listener para inicio da aventura
  useEffect(() => {
    let cleanupFns = [];

    const handleAventuraIniciada = () => {
      navigate(`/jogo/${id}/jogo-ativo`);
    };

    const handleRoomJoined = (data) => {
      if (data?.sessao?.status === 'iniciada') {
        if (historiaAtual?.id) {
          carregarMensagensSalvas(historiaAtual.id);
        }
        navigate(`/jogo/${id}/jogo-ativo`);
      }
    };

    onSocketEvent('aventura_iniciada', handleAventuraIniciada);
    onSocketEvent('room_joined', handleRoomJoined);

    cleanupFns.push(
      () => offSocketEvent('aventura_iniciada', handleAventuraIniciada),
      () => offSocketEvent('room_joined', handleRoomJoined)
    );

    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [historiaAtual, id, navigate, onSocketEvent, offSocketEvent, carregarMensagensSalvas]);

  // Handlers
  const handleIniciarJogo = useCallback(async () => {
    try {
      await iniciarJogo();
      // Navegacao sera feita pelo listener aventura_iniciada
    } catch {
      // silenced
    }
  }, [iniciarJogo]);

  const handleSair = useCallback(() => {
    sairDoJogo();
    navigate('/historias');
  }, [sairDoJogo, navigate]);

  const handleVoltar = useCallback(() => {
    navigate(`/jogo/${id}/selecao-personagem`);
  }, [navigate, id]);

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
    error,
    socketError,
    isConnected,
    isConnecting,
    roomUsers,

    // Handlers
    handleIniciarJogo,
    handleSair,
    handleVoltar,
    handleClearErrors,
  };
};

export default useSalaEsperaModel;
