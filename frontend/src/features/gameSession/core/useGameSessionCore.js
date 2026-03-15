import { useState, useCallback, useRef } from 'react';
import { historiaService } from '../../../services/index.js';
import useGameStore from '../../../store/game/index.js';
import useSocketStore from '../../../store/socket/index.js';
import { useTemaStore } from '../../../store/tema/index.js';

/**
 * Core hook para sessao de jogo.
 * Centraliza estado compartilhado e acoes comuns entre todas as fases
 * (selecao-personagem, sala-espera, jogo-ativo).
 *
 * NAO inclui logica especifica de fase (lobby countdown, message loading,
 * selecao de personagem, compartilhar sala, etc.).
 */
export function useGameSessionCore() {
  // ===== READ FROM STORES =====
  const historiaAtual = useGameStore((s) => s.historiaAtual);
  const personagemSelecionado = useGameStore((s) => s.personagemSelecionado);
  const participantes = useGameStore((s) => s.participantes);
  const isDonoSala = useGameStore((s) => s.isDonoSala);
  const salaAberta = useGameStore((s) => s.salaAberta);
  const mensagens = useGameStore((s) => s.mensagens);
  const gameLoading = useGameStore((s) => s.loading);
  const gameError = useGameStore((s) => s.error);

  // Socket connection state
  const isConnected = useSocketStore((s) => s.isConnected);
  const isAuthenticated = useSocketStore((s) => s.isAuthenticated);
  const inRoom = useSocketStore((s) => s.inRoom);
  const aventuraIniciada = useSocketStore((s) => s.aventuraIniciada);

  // Tema store (for tema name resolution)
  const carregarTemas = useTemaStore((s) => s.carregarTemas);
  const temasCarregados = useTemaStore((s) => s.temasCarregados);
  const getNomesDeTemas = useTemaStore((s) => s.getNomesDeTemas);

  // ===== LOCAL STATE =====
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===== REFS (guards contra chamadas duplicadas) =====
  const isInitializingRef = useRef(false);
  const isLoadingHistoriaRef = useRef(false);

  // ===== STORE ACTIONS (stable references via selector) =====
  const storeSetHistoriaAtual = useGameStore((s) => s.setHistoriaAtual);
  const storeSelecionarPersonagem = useGameStore((s) => s.selecionarPersonagem);
  const storeSetLoading = useGameStore((s) => s.setLoading);
  const storeClearErrors = useGameStore((s) => s.clearErrors);
  const storeResetGameState = useGameStore((s) => s.resetGameState);

  // ------------------------------------------------------------------
  // DERIVED STATE
  // ------------------------------------------------------------------

  /** Jogo esta ativo (conectado, autenticado, na sala, aventura iniciada) */
  const isGameActive = isConnected && isAuthenticated && inRoom && aventuraIniciada;

  /** Jogador esta no lobby (conectado, na sala, aventura NAO iniciada) */
  const isInLobby = isConnected && inRoom && !aventuraIniciada;

  // ------------------------------------------------------------------
  // CARREGAR HISTORIA
  // ------------------------------------------------------------------
  const carregarHistoria = useCallback(
    async (historiaId) => {
      if (isLoadingHistoriaRef.current) return;
      try {
        isLoadingHistoriaRef.current = true;
        setLoading(true);
        storeSetLoading(true);
        setError(null);

        const historia = await historiaService.getById(historiaId);
        storeSetHistoriaAtual(historia);
      } catch (err) {
        setError('Erro ao carregar historia: ' + err.message);
      } finally {
        setLoading(false);
        storeSetLoading(false);
        isLoadingHistoriaRef.current = false;
      }
    },
    [storeSetHistoriaAtual, storeSetLoading],
  );

  // ------------------------------------------------------------------
  // INICIALIZAR JOGO (historia + temas)
  // Usado por: selecao-personagem, sala-espera (resume)
  // ------------------------------------------------------------------
  const initializeGame = useCallback(
    async (historiaId) => {
      if (isInitializingRef.current) return;
      try {
        isInitializingRef.current = true;
        setError(null);

        // Limpar personagem selecionado de sessao anterior
        storeSelecionarPersonagem(null);
        localStorage.removeItem('personagemSelecionado');

        await carregarHistoria(historiaId);

        // Carregar temas se necessario
        if (!temasCarregados) {
          await carregarTemas();
        }

        isInitializingRef.current = false;
      } catch (err) {
        setError('Erro ao inicializar jogo: ' + err.message);
        isInitializingRef.current = false;
      }
    },
    [carregarHistoria, temasCarregados, carregarTemas, storeSelecionarPersonagem],
  );

  // ------------------------------------------------------------------
  // SAIR DO JOGO
  // Usado por: todas as fases (botao voltar, cleanup)
  // ------------------------------------------------------------------
  const sairDoJogo = useCallback(() => {
    storeResetGameState();
    useSocketStore.getState().resetSocketState();
  }, [storeResetGameState]);

  // ------------------------------------------------------------------
  // TEMAS — helper reutilizado pelos formatadores
  // ------------------------------------------------------------------
  const obterTemasNomes = useCallback(
    (historia) => {
      if (!historia?.temas) return [];
      if (Array.isArray(historia.temas)) {
        return getNomesDeTemas(historia.temas);
      }
      return [];
    },
    [getNomesDeTemas],
  );

  // ------------------------------------------------------------------
  // FORMATADORES COMPARTILHADOS
  // ------------------------------------------------------------------

  /**
   * Formata informacoes basicas da historia.
   * Usado por: selecao-personagem, sala-espera
   */
  const formatarInformacoesHistoria = useCallback(
    (historia) => {
      if (!historia) {
        return {
          nome: 'Historia sem nome',
          descricao: '',
          maximoParticipantes: 0,
          temas: [],
        };
      }
      return {
        nome: historia.nome || historia.titulo || 'Historia sem nome',
        descricao: historia.descricao || '',
        maximoParticipantes: historia.maximo_de_participantes || 0,
        temas: obterTemasNomes(historia),
      };
    },
    [obterTemasNomes],
  );

  // ------------------------------------------------------------------
  // CLEAR ERRORS
  // Usado por: todas as fases
  // ------------------------------------------------------------------
  const clearErrors = useCallback(() => {
    setError(null);
    storeClearErrors();
  }, [storeClearErrors]);

  // ------------------------------------------------------------------
  // RETURN — somente estado e acoes compartilhados entre 2+ fases
  // ------------------------------------------------------------------
  return {
    // Store state (read-only)
    historiaAtual,
    personagemSelecionado,
    participantes,
    isDonoSala,
    salaAberta,
    mensagens,

    // Connection state
    isConnected,
    isAuthenticated,
    inRoom,
    aventuraIniciada,

    // Derived state
    isGameActive,
    isInLobby,

    // Loading / error (merged local + store)
    loading: loading || gameLoading,
    error: error || gameError,

    // Shared actions
    initializeGame,
    carregarHistoria,
    sairDoJogo,
    clearErrors,

    // Shared formatters
    formatarInformacoesHistoria,
    obterTemasNomes,
  };
}

export default useGameSessionCore;
