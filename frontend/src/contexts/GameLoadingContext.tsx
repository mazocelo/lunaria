import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Context para gerenciar estado de carregamento e selecoes previas do jogo
 *
 * Responsabilidades:
 * - Gerenciar estados de loading das diferentes etapas
 * - Manter cache de selecoes anteriores
 * - Controlar transicoes entre etapas
 * - Otimizar UX com pre-loading
 */

export type LoadingEtapa = 'historia' | 'personagens' | 'sala' | 'jogo' | 'socket';
export type LoadingStates = Record<LoadingEtapa, boolean>;

export type SelecaoTipo = 'historiaId' | 'personagemId' | 'salaId' | 'configuracoes';

export interface PreviousSelections {
  historiaId: number | string | null;
  personagemId: number | string | null;
  salaId: number | string | null;
  configuracoes: Record<string, unknown>;
}

export interface TransitionState {
  from: string | null;
  to: string | null;
  progress: number;
  isTransitioning: boolean;
}

export interface GameLoadingContextValue {
  loadingStates: LoadingStates;
  previousSelections: PreviousSelections;
  transitionState: TransitionState;
  overallProgress: number;
  isAnyLoading: boolean;
  isAllLoaded: boolean;
  setLoading: (etapa: LoadingEtapa, isLoading: boolean) => void;
  resetLoadingStates: () => void;
  saveSelection: (tipo: SelecaoTipo, valor: PreviousSelections[SelecaoTipo]) => void;
  getSelection: (tipo: SelecaoTipo) => PreviousSelections[SelecaoTipo];
  clearSelection: (tipo: SelecaoTipo) => void;
  clearAllSelections: () => void;
  startTransition: (from: string, to: string) => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
  getLoadingStep: () => string;
  resetAll: () => void;
}

const GameLoadingContext = createContext<GameLoadingContextValue | null>(null);

export const useGameLoading = (): GameLoadingContextValue => {
  const context = useContext(GameLoadingContext);
  if (!context) {
    throw new Error('useGameLoading deve ser usado dentro de GameLoadingProvider');
  }
  return context;
};

interface GameLoadingProviderProps {
  children: ReactNode;
}

const INITIAL_LOADING_STATES: LoadingStates = {
  historia: false,
  personagens: false,
  sala: false,
  jogo: false,
  socket: false,
};

const INITIAL_SELECTIONS: PreviousSelections = {
  historiaId: null,
  personagemId: null,
  salaId: null,
  configuracoes: {},
};

const INITIAL_TRANSITION: TransitionState = {
  from: null,
  to: null,
  progress: 0,
  isTransitioning: false,
};

export const GameLoadingProvider = ({ children }: GameLoadingProviderProps) => {
  // Estados de loading por etapa
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(INITIAL_LOADING_STATES);

  // Cache de selecoes anteriores
  const [previousSelections, setPreviousSelections] = useState<PreviousSelections>(INITIAL_SELECTIONS);

  // Estado da transicao atual
  const [transitionState, setTransitionState] = useState<TransitionState>(INITIAL_TRANSITION);

  // Progresso geral do carregamento
  const [overallProgress, setOverallProgress] = useState(0);

  // ACOES - Gerenciar loading por etapa
  const setLoading = useCallback((etapa: LoadingEtapa, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [etapa]: isLoading,
    }));

    // Calcular progresso geral
    setLoadingStates((current) => {
      const totalSteps = Object.keys(current).length;
      const completedSteps = Object.values({
        ...current,
        [etapa]: !isLoading,
      }).filter(Boolean).length;

      const progress = Math.round((completedSteps / totalSteps) * 100);
      setOverallProgress(progress);

      return {
        ...current,
        [etapa]: isLoading,
      };
    });
  }, []);

  // ACOES - Gerenciar cache de selecoes
  const saveSelection = useCallback(
    (tipo: SelecaoTipo, valor: PreviousSelections[SelecaoTipo]) => {
      setPreviousSelections((prev) => ({
        ...prev,
        [tipo]: valor,
      }));
    },
    []
  );

  const getSelection = useCallback(
    (tipo: SelecaoTipo): PreviousSelections[SelecaoTipo] => {
      return previousSelections[tipo];
    },
    [previousSelections]
  );

  const clearSelection = useCallback((tipo: SelecaoTipo) => {
    setPreviousSelections((prev) => ({
      ...prev,
      [tipo]: tipo === 'configuracoes' ? {} : null,
    }));
  }, []);

  const clearAllSelections = useCallback(() => {
    setPreviousSelections(INITIAL_SELECTIONS);
  }, []);

  // ACOES - Gerenciar transicoes
  const startTransition = useCallback((from: string, to: string) => {
    setTransitionState({
      from,
      to,
      progress: 0,
      isTransitioning: true,
    });
  }, []);

  const updateTransitionProgress = useCallback((progress: number) => {
    setTransitionState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  const completeTransition = useCallback(() => {
    setTransitionState((prev) => ({
      ...prev,
      progress: 100,
      isTransitioning: false,
    }));
  }, []);

  // ACOES - Limpeza
  const resetLoadingStates = useCallback(() => {
    setLoadingStates(INITIAL_LOADING_STATES);
    setOverallProgress(0);
  }, []);

  const resetAll = useCallback(() => {
    resetLoadingStates();
    clearAllSelections();
    setTransitionState(INITIAL_TRANSITION);
  }, [resetLoadingStates, clearAllSelections]);

  // GETTERS - Estados computados
  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const isAllLoaded = Object.values(loadingStates).every((state) => !state);

  const getLoadingStep = (): string => {
    if (loadingStates.historia) return 'Carregando história...';
    if (loadingStates.personagens) return 'Carregando personagens...';
    if (loadingStates.socket) return 'Conectando à sala...';
    if (loadingStates.sala) return 'Preparando sala...';
    if (loadingStates.jogo) return 'Iniciando jogo...';
    return 'Carregado';
  };

  const contextValue: GameLoadingContextValue = {
    loadingStates,
    previousSelections,
    transitionState,
    overallProgress,
    isAnyLoading,
    isAllLoaded,
    setLoading,
    resetLoadingStates,
    saveSelection,
    getSelection,
    clearSelection,
    clearAllSelections,
    startTransition,
    updateTransitionProgress,
    completeTransition,
    getLoadingStep,
    resetAll,
  };

  return (
    <GameLoadingContext.Provider value={contextValue}>
      {children}
    </GameLoadingContext.Provider>
  );
};

export default GameLoadingProvider;
