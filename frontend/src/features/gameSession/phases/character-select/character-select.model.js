import { useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useGameLoading } from '../../../../contexts/GameLoadingContext';

// Legado — acao + erro/loading devem vir do MESMO hook
// para evitar instancias separadas de error/loading state.
// Sera consolidado em fase futura quando as acoes migrarem para o core.
import { useJogo } from '../../../../Pages/Jogo/hooks/index.js';

/**
 * Model hook da selecao de personagem (primeira etapa).
 *
 * Regra de instancia: acao e erro/loading SEMPRE vem do mesmo hook.
 * - TUDO vem de useJogo (state + actions + error/loading)
 * - Sem useJogoSocket (selecao nao conecta socket)
 * - Sem useJogoGuard (e a fase base, sem pre-requisitos)
 * - Sem useGameSessionCore (sem sairDoJogo nem socket cleanup)
 *
 * Retorna o MESMO shape que useSelecaoPersonagemModel original.
 */
export function useCharacterSelectModel({ navigate }) {
  // === LEGADO (acao + erro/loading acoplados na mesma instancia) ===
  const {
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    error,
    loading,
    loadingPersonagens,
    errorPersonagens,
    initializeGame,
    carregarPersonagens,
    selecionarPersonagem,
    retomarJogo,
    clearErrors,
    clearErrorPersonagens,
  } = useJogo();

  // === CONTEXTS ===
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { getSelection } = useGameLoading();
  const location = useLocation();
  const { id } = useParams();

  // === REFS (guards contra chamadas duplicadas) ===
  const personagensCarregadosRef = useRef(false);
  const jogoInicializadoRef = useRef(false);

  // ------------------------------------------------------------------
  // EFFECT 1: Inicializacao (historia + verificacao sessao ativa)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (jogoInicializadoRef.current) return;

    const inicializar = async () => {
      try {
        jogoInicializadoRef.current = true;

        const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;

        // Verificar se ha sessao ativa
        const { historiaService } = await import('../../../../services/index.js');
        const sessaoData = await historiaService.verificarSessaoAtiva(id);

        if (sessaoData && sessaoData.hasActiveSession && sessaoData.isPlaying) {
          // Sessao ativa - RETOMAR JOGO
          await retomarJogo(id, user);
          await new Promise(resolve => setTimeout(resolve, 150));
          navigate(`/jogo/${id}/jogo-ativo`);
          return;
        }

        // Inicializar jogo
        await initializeGame(id, { fromInvite });
        hideSidebar();
      } catch {
        await initializeGame(id, { fromInvite: location.state?.fromInvite });
        hideSidebar();
      }
    };

    inicializar();

    return () => {
      openSidebar();
      jogoInicializadoRef.current = false;
    };
  }, [id]);

  // ------------------------------------------------------------------
  // EFFECT 2: Carregar personagens (apos historia carregada)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (historiaAtual && user?.id && !personagensCarregadosRef.current && !loadingPersonagens) {
      personagensCarregadosRef.current = true;
      carregarPersonagens(user.id);
    }
  }, [historiaAtual, user?.id, loadingPersonagens, carregarPersonagens]);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

  const handleSelecionarPersonagem = useCallback(async (personagem) => {
    try {
      await selecionarPersonagem(personagem, user);
      navigate(`/jogo/${id}/sala-espera`);
    } catch (err) {
      console.error('Erro ao selecionar personagem:', err);
    }
  }, [selecionarPersonagem, user, id, navigate]);

  const handleVoltar = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  const handleClearErrors = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  const handleClearErrorPersonagens = useCallback(() => {
    clearErrorPersonagens();
  }, [clearErrorPersonagens]);

  // ------------------------------------------------------------------
  // RETURN — mesmo shape que useSelecaoPersonagemModel original
  // ------------------------------------------------------------------
  return {
    // State (do useJogo — mesma instancia que as acoes)
    user,
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    error,
    loading,
    loadingPersonagens,
    errorPersonagens,

    // Handlers
    handleSelecionarPersonagem,
    handleVoltar,
    handleClearErrors,
    handleClearErrorPersonagens,
  };
}

export default useCharacterSelectModel;
