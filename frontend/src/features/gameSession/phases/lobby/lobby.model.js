import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useGameLoading } from '../../../../contexts/GameLoadingContext';
import { historiaService } from '../../../../services/index.js';

// Core novo (Fase 1) — apenas leitura de state store-backed
import { useGameSessionCore } from '../../core/useGameSessionCore.js';

// Hooks legados — acao + erro/loading devem vir do MESMO hook
// para evitar instancias separadas de error/loading state.
// Sera consolidado em fase futura quando as acoes migrarem para o core.
import { useJogo, useJogoSocket, useJogoGuard } from '../../../../Pages/Jogo/hooks/index.js';

/**
 * Model hook do lobby (sala de espera).
 *
 * Regra de instancia: acao e erro/loading SEMPRE vem do mesmo hook.
 * - State store-backed (historiaAtual, participantes, etc.) → core
 * - Acoes + erro + loading + socket state → legado (useJogo, useJogoSocket)
 * - sairDoJogo → core (escreve no store, sem local state)
 *
 * Retorna o MESMO shape que useSalaEsperaModel original.
 */
export function useLobbyModel() {
  // === CORE (leitura de state store-backed + helpers puros) ===
  const core = useGameSessionCore();

  // === LEGADO (acao + erro/loading acoplados na mesma instancia) ===
  const {
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    error,
    iniciarJogo,
    retomarJogo,
    clearErrors,
  } = useJogo();

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
  } = useJogoSocket();

  // === GUARD ===
  useJogoGuard('sala-espera');

  // === CONTEXTS ===
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { getSelection } = useGameLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // === LOCAL STATE (lobby-especifico) ===
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');
  const [showConfirmSair, setShowConfirmSair] = useState(false);

  // Guards contra chamadas duplicadas
  const tentouConectarRef = useRef(false);
  const tentouVerificarRef = useRef(false);

  // ------------------------------------------------------------------
  // EFFECT 1: Layout — esconder sidebar na entrada, restaurar na saida
  // ------------------------------------------------------------------
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, []);

  // ------------------------------------------------------------------
  // EFFECT 2: Verificacao de sessao ativa (reconexao)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!id || !user || tentouVerificarRef.current) return;
    tentouVerificarRef.current = true;

    const verificar = async () => {
      try {
        const data = await historiaService.verificarSessaoAtiva(id);

        if (data?.isPlaying) {
          setIsResumingSession(true);
          setResumeMessage('Reconectando a sessao...');

          try {
            await retomarJogo(id, user);
            setResumeMessage('Carregando dados da aventura...');
          } catch {
            // retomarJogo pode falhar se dados ja estao carregados
          }

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

  // ------------------------------------------------------------------
  // EFFECT 3: Conexao automatica ao WebSocket (fluxo normal)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isResumingSession) return;
    if (
      personagemSelecionado &&
      !isConnected &&
      !isConnecting &&
      !tentouConectarRef.current &&
      user
    ) {
      tentouConectarRef.current = true;

      const fromInvite =
        location.state?.fromInvite ||
        getSelection('configuracoes')?.fromInvite;

      if (fromInvite && historiaAtual?.id) {
        conectarComoConvidado(
          historiaAtual.id,
          personagemSelecionado.id,
          user,
        ).catch(() => {
          tentouConectarRef.current = false;
        });
      } else {
        conectarSocket({
          userId: user?.id,
          username: user?.nome || user?.name,
          email: user?.email,
        })
          .then((result) => {
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
  }, [
    isResumingSession,
    personagemSelecionado,
    isConnected,
    isConnecting,
    user,
    historiaAtual,
    location.state,
  ]);

  // ------------------------------------------------------------------
  // EFFECT 4: Listeners WS — aventura_iniciada, room_joined
  // ------------------------------------------------------------------
  useEffect(() => {
    const cleanupFns = [];

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
      () => offSocketEvent('room_joined', handleRoomJoined),
    );

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [historiaAtual, id, navigate, onSocketEvent, offSocketEvent]);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

  const handleIniciarJogo = useCallback(async () => {
    try {
      setIsResumingSession(true);
      setResumeMessage('Iniciando aventura...');
      await iniciarJogo();
      setResumeMessage('Preparando o campo de batalha...');
      await new Promise((r) => setTimeout(r, 1200));
      navigate(`/jogo/${id}/jogo-ativo`);
    } catch (err) {
      setIsResumingSession(false);
      setResumeMessage('');
      console.error('Erro ao iniciar jogo:', err);
    }
  }, [iniciarJogo, navigate, id]);

  const handleSair = useCallback(() => {
    setShowConfirmSair(true);
  }, []);

  const confirmarSair = useCallback(() => {
    setShowConfirmSair(false);
    core.sairDoJogo(); // sairDoJogo escreve no store, sem local state — seguro usar core
    navigate('/historias');
  }, [core.sairDoJogo, navigate]);

  const cancelarSair = useCallback(() => {
    setShowConfirmSair(false);
  }, []);

  const handleVoltar = useCallback(() => {
    navigate(`/jogo/${id}/selecao-personagem`);
  }, [navigate, id]);

  const handleClearErrors = useCallback(() => {
    clearErrors(); // do useJogo — limpa error local + store
    clearSocketError(); // do useJogoSocket — limpa socketError local
  }, [clearErrors, clearSocketError]);

  // ------------------------------------------------------------------
  // RETURN — mesmo shape que useSalaEsperaModel original
  // ------------------------------------------------------------------
  return {
    // State (do useJogo — mesma instancia que as acoes)
    user,
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    error,

    // Socket state (do useJogoSocket — mesma instancia que conectarSocket)
    socketError,
    isConnected,
    isConnecting,
    roomUsers,

    // Local state
    isResumingSession,
    resumeMessage,

    // Handlers
    handleIniciarJogo,
    handleSair,
    handleVoltar,
    handleClearErrors,

    // P-03: Confirmacao ao sair
    showConfirmSair,
    confirmarSair,
    cancelarSair,
  };
}

export default useLobbyModel;
