import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout } from '../../../../contexts/LayoutContext';

// Core novo (Fase 1) — apenas sairDoJogo (store-backed, sem local state)
import { useGameSessionCore } from '../../core/useGameSessionCore.js';

// Hooks legados — acao + erro/loading devem vir do MESMO hook
// para evitar instancias separadas de error/loading state.
// Sera consolidado em fase futura quando as acoes migrarem para o core.
import { useJogo, useJogoSocket, useJogoGuard } from '../../../../Pages/Jogo/hooks/index.js';

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
export function useActiveModel() {
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
    socketError,
    isReconnecting,
    conectarSocket,
    garantirEntradaSala,
    clearSocketError,
  } = useJogoSocket();

  // === GUARD ===
  useJogoGuard('jogo-ativo');

  // === CONTEXTS ===
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();

  // === LOCAL STATE ===
  const [showConfirmSair, setShowConfirmSair] = useState(false);
  const resumeAttemptKeyRef = useRef(null);
  const joinAttemptKeyRef = useRef(null);

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
        const { historiaService } = await import('../../../../services/index.js');
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

  // ------------------------------------------------------------------
  // EFFECT 3: Conectar socket quando user disponivel e desconectado
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // EFFECT 4: Garantir entrada na sala (connected + historia + personagem)
  // ------------------------------------------------------------------
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

  const handleAdicionarMensagem = useCallback((mensagem) => {
    adicionarMensagem(mensagem);
  }, [adicionarMensagem]);

  const handleAtualizarStatus = useCallback((status) => {
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
