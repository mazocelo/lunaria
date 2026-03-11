import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useGameLoading } from '../../../contexts/GameLoadingContext';
import { useJogo, useJogoSocket, useJogoGuard } from '../hooks';
import { historiaService } from '../../../services/index.js';

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

  // Estado de retomada de sessao
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');

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
    clearErrors,
    retomarJogo,
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

  // Flags para evitar multiplas execucoes
  const tentouConectarRef = useRef(false);
  const tentouVerificarRef = useRef(false);

  // Inicializacao de layout
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, []);

  // Verificacao inicial: usuario ja participa de sessao ativa?
  useEffect(() => {
    if (!id || !user || tentouVerificarRef.current) return;
    tentouVerificarRef.current = true;

    const verificar = async () => {
      try {
        const data = await historiaService.verificarSessaoAtiva(id);

        if (data?.isPlaying) {
          setIsResumingSession(true);
          setResumeMessage('Reconectando a sessao...');

          // Restaurar dados da sessao
          try {
            await retomarJogo(id, user);
            setResumeMessage('Carregando dados da aventura...');
          } catch {
            // retomarJogo pode falhar se dados ja estao carregados
          }

          // Conectar socket
          setResumeMessage('Estabelecendo conexao...');
          try {
            await conectarSocket({
              userId: user.id,
              username: user.nome || user.name,
              email: user.email,
            });
          } catch {
            // Socket pode ja estar conectado
          }

          setResumeMessage('Entrando na aventura...');
          // Delay para UX (loading visivel)
          await new Promise(r => setTimeout(r, 1500));
          navigate(`/jogo/${id}/jogo-ativo`);
          return;
        }
      } catch {
        // Sem sessao ativa ou erro — prosseguir normal
      }
    };

    verificar();
  }, [id, user]);

  // Conexao automatica ao WebSocket (fluxo normal, sem sessao ativa)
  useEffect(() => {
    if (isResumingSession) return; // Nao conectar se ja esta retomando
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
            // Se sessao ja foi iniciada, mostrar loading e redirecionar
            if (result?.sessionAlreadyStarted) {
              setIsResumingSession(true);
              setResumeMessage('Entrando na aventura...');
              setTimeout(() => navigate(`/jogo/${id}/jogo-ativo`), 1500);
            }
          })
          .catch(() => {
            tentouConectarRef.current = false;
          });
      }
    }
  }, [isResumingSession, personagemSelecionado, isConnected, isConnecting, user, historiaAtual, location.state]);

  // Listener para inicio da aventura
  useEffect(() => {
    let cleanupFns = [];

    const handleAventuraIniciada = () => {
      setIsResumingSession(true);
      setResumeMessage('A aventura comecou!');
      setTimeout(() => navigate(`/jogo/${id}/jogo-ativo`), 1200);
    };

    const handleRoomJoined = (data) => {
      if (data?.sessao?.status === 'iniciada') {
        setIsResumingSession(true);
        setResumeMessage('Entrando na aventura...');
        setTimeout(() => navigate(`/jogo/${id}/jogo-ativo`), 1500);
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
  }, [historiaAtual, id, navigate, onSocketEvent, offSocketEvent]);

  // Handlers
  const handleIniciarJogo = useCallback(async () => {
    try {
      setIsResumingSession(true);
      setResumeMessage('Iniciando aventura...');
      await iniciarJogo();
      setResumeMessage('Preparando o campo de batalha...');
      await new Promise(r => setTimeout(r, 1200));
      navigate(`/jogo/${id}/jogo-ativo`);
    } catch (err) {
      setIsResumingSession(false);
      setResumeMessage('');
      console.error('Erro ao iniciar jogo:', err);
    }
  }, [iniciarJogo, navigate, id]);

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
    isResumingSession,
    resumeMessage,

    // Handlers
    handleIniciarJogo,
    handleSair,
    handleVoltar,
    handleClearErrors,
  };
};

export default useSalaEsperaModel;
