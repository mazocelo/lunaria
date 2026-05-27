import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout } from '../../../../contexts/LayoutContext';

// Core novo (Fase 1) — apenas sairDoJogo (store-backed, sem local state)
import { useGameSessionCore } from '../../core/useGameSessionCore';

// Hooks legados — acao + erro/loading devem vir do MESMO hook
// para evitar instancias separadas de error/loading state.
// Sera consolidado em fase futura quando as acoes migrarem para o core.
import { useJogo, useJogoSocket, useJogoGuard } from '../../../../Pages/Jogo/hooks/index';

interface UseActiveModelParams {
  navigate: (path: string) => void;
}

/**
 * Model hook do jogo ativo (terceira etapa).
 *
 * Regra de instancia: acao e erro/loading SEMPRE vem do mesmo hook.
 * - State + actions + error + clearErrors → useJogo (mesma instancia)
 * - Socket state + conectarSocket + garantirEntradaSala + clearSocketError → useJogoSocket (mesma instancia)
 * - sairDoJogo → core (escreve no store, sem local state)
 *
 * Retorna o MESMO shape que useJogoAtivoModel original.
 */
export function useActiveModel({ navigate }: UseActiveModelParams) {
  // === CORE (apenas sairDoJogo — store-backed) ===
  const core = useGameSessionCore();

  // === LEGADO (acao + erro/loading acoplados na mesma instancia) ===
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
    retomarJogo,
    clearErrors,
  } = useJogo();

  const {
    isConnected,
    isAuthenticated,
    socketError,
    isReconnecting,
    inRoom,
    joiningRoomId,
    conectarSocket,
    garantirEntradaSala,
    clearSocketError,
  } = useJogoSocket();

  // === GUARD ===
  useJogoGuard('jogo-ativo');

  // === CONTEXTS ===
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { id } = useParams();

  // === LOCAL STATE ===
  const [showConfirmSair, setShowConfirmSair] = useState(false);
  const resumeAttemptKeyRef = useRef<string | null>(null);
  const joinAttemptKeyRef = useRef<string | null>(null);

  // ------------------------------------------------------------------
  // EFFECT 1: Layout — esconder sidebar na entrada, restaurar na saida
  // ------------------------------------------------------------------
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, [hideSidebar, openSidebar]);

  // ------------------------------------------------------------------
  // EFFECT 2: Retomar sessao se usuario entrou direto sem historia
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!id || !user?.id || historiaAtual?.id) return;

    const key = `${id}:${user.id}`;
    if (resumeAttemptKeyRef.current === key) return;
    resumeAttemptKeyRef.current = key;

    const tryResume = async () => {
      try {
        const { historiaService } = await import('../../../../services/index');
        const sessaoData = await historiaService.verificarSessaoAtiva(id) as { hasActiveSession?: boolean } | null;
        if (sessaoData?.hasActiveSession) {
          await retomarJogo(id, user);
        }
      } catch (err) {
        console.error('Erro ao retomar sessao:', err);
      }
    };

    tryResume();
  }, [id, user?.id, historiaAtual?.id, retomarJogo]);

  // ------------------------------------------------------------------
  // EFFECT 3: Conectar socket quando user disponivel e desconectado
  // ------------------------------------------------------------------
  const connectBackoffRef = useRef(0);
  useEffect(() => {
    if (!user?.id || isConnected) {
      connectBackoffRef.current = 0; // reset on success
      return;
    }

    // Backoff: don't retry if we failed recently
    if (connectBackoffRef.current > Date.now()) return;

    const connect = async () => {
      try {
        await conectarSocket({
          userId: user.id,
          username: user.nome || user.name,
          email: user.email,
        });
        connectBackoffRef.current = 0;
      } catch (err) {
        console.error('Erro ao conectar socket:', err);
        // Exponential backoff: 5s, 10s, 20s, max 30s
        const delay = Math.min(30000, 5000 * Math.pow(2, Math.floor(Math.random() * 3)));
        connectBackoffRef.current = Date.now() + delay;
      }
    };

    connect();
  }, [user?.id, user?.nome, user?.name, user?.email, isConnected, conectarSocket]);

  // ------------------------------------------------------------------
  // EFFECT 4: Garantir entrada na sala (connected + authenticated + historia + personagem)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isConnected || !isAuthenticated || !user?.id || !historiaAtual?.id || !personagemSelecionado?.id) return;

    const targetRoomId = `historia_${historiaAtual.id}`;
    if (inRoom || joiningRoomId === targetRoomId) return;

    const key = `${historiaAtual.id}:${personagemSelecionado.id}:${user.id}`;
    if (joinAttemptKeyRef.current === key) return;
    joinAttemptKeyRef.current = key;

    const ensureJoin = async () => {
      try {
        await (garantirEntradaSala as unknown as (data: { userId: number | string; username?: string; email?: string }) => Promise<unknown>)({
          userId: user.id,
          username: (user.nome || user.name) as string | undefined,
          email: user.email,
        });
      } catch (err) {
        // Reset guard after delay to prevent instant retry loop
        console.error('Erro ao entrar na sala do jogo ativo:', err);
        setTimeout(() => { joinAttemptKeyRef.current = null; }, 10000);
      }
    };

    ensureJoin();
  }, [
    isConnected,
    isAuthenticated,
    user?.id,
    user?.nome,
    user?.name,
    user?.email,
    historiaAtual?.id,
    personagemSelecionado?.id,
    garantirEntradaSala,
    inRoom,
    joiningRoomId,
  ]);

  // ------------------------------------------------------------------
  // EFFECT 5: Reset join key ao desconectar (permite re-join)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isConnected) {
      joinAttemptKeyRef.current = null;
    }
  }, [isConnected]);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

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

  const handleAdicionarMensagem = useCallback((mensagem: Parameters<typeof adicionarMensagem>[0]) => {
    adicionarMensagem(mensagem);
  }, [adicionarMensagem]);

  const handleAtualizarStatus = useCallback((status: Parameters<typeof atualizarStatusPersonagem>[0]) => {
    atualizarStatusPersonagem(status);
  }, [atualizarStatusPersonagem]);

  const handleClearErrors = useCallback(() => {
    clearErrors();     // do useJogo — limpa error local + store
    clearSocketError(); // do useJogoSocket — limpa socketError local
  }, [clearErrors, clearSocketError]);

  // ------------------------------------------------------------------
  // RETURN — mesmo shape que useJogoAtivoModel original
  // ------------------------------------------------------------------
  return {
    // State (do useJogo — mesma instancia que as acoes)
    user,
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    mensagens,
    statusPersonagem,
    error,

    // Socket state (do useJogoSocket — mesma instancia que conectarSocket)
    socketError,
    isConnected,
    isReconnecting,

    // Handlers
    handleSair,
    showConfirmSair,
    confirmarSair,
    cancelarSair,
    handleAdicionarMensagem,
    handleAtualizarStatus,
    handleClearErrors,
  };
}

export default useActiveModel;
