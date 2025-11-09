import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * 🎮 Context para gerenciar estado de carregamento e seleções prévias do jogo
 * 
 * Responsabilidades:
 * - Gerenciar estados de loading das diferentes etapas
 * - Manter cache de seleções anteriores
 * - Controlar transições entre etapas
 * - Otimizar UX com pre-loading
 */

const GameLoadingContext = createContext({});

export const useGameLoading = () => {
  const context = useContext(GameLoadingContext);
  if (!context) {
    throw new Error('useGameLoading deve ser usado dentro de GameLoadingProvider');
  }
  return context;
};

export const GameLoadingProvider = ({ children }) => {
  // 🎯 Estados de loading por etapa
  const [loadingStates, setLoadingStates] = useState({
    historia: false,
    personagens: false,
    sala: false,
    jogo: false,
    socket: false
  });

  // 💾 Cache de seleções anteriores
  const [previousSelections, setPreviousSelections] = useState({
    historiaId: null,
    personagemId: null,
    salaId: null,
    configuracoes: {}
  });

  // 🔄 Estado da transição atual
  const [transitionState, setTransitionState] = useState({
    from: null,
    to: null,
    progress: 0,
    isTransitioning: false
  });

  // 📊 Progresso geral do carregamento
  const [overallProgress, setOverallProgress] = useState(0);

  // 🎯 AÇÕES - Gerenciar loading por etapa
  const setLoading = useCallback((etapa, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [etapa]: isLoading
    }));

    // Calcular progresso geral
    setLoadingStates(current => {
      const totalSteps = Object.keys(current).length;
      const completedSteps = Object.values({
        ...current,
        [etapa]: !isLoading
      }).filter(Boolean).length;
      
      const progress = Math.round((completedSteps / totalSteps) * 100);
      setOverallProgress(progress);
      
      return {
        ...current,
        [etapa]: isLoading
      };
    });
  }, []);

  // 💾 AÇÕES - Gerenciar cache de seleções
  const saveSelection = useCallback((tipo, valor) => {
    setPreviousSelections(prev => ({
      ...prev,
      [tipo]: valor
    }));
  }, []);

  const getSelection = useCallback((tipo) => {
    return previousSelections[tipo];
  }, [previousSelections]);

  const clearSelection = useCallback((tipo) => {
    setPreviousSelections(prev => ({
      ...prev,
      [tipo]: null
    }));
  }, []);

  const clearAllSelections = useCallback(() => {
    setPreviousSelections({
      historiaId: null,
      personagemId: null,
      salaId: null,
      configuracoes: {}
    });
  }, []);

  // 🔄 AÇÕES - Gerenciar transições
  const startTransition = useCallback((from, to) => {
    setTransitionState({
      from,
      to,
      progress: 0,
      isTransitioning: true
    });
  }, []);

  const updateTransitionProgress = useCallback((progress) => {
    setTransitionState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  const completeTransition = useCallback(() => {
    setTransitionState(prev => ({
      ...prev,
      progress: 100,
      isTransitioning: false
    }));
  }, []);

  // 🧹 AÇÕES - Limpeza
  const resetLoadingStates = useCallback(() => {
    setLoadingStates({
      historia: false,
      personagens: false,
      sala: false,
      jogo: false,
      socket: false
    });
    setOverallProgress(0);
  }, []);

  const resetAll = useCallback(() => {
    resetLoadingStates();
    clearAllSelections();
    setTransitionState({
      from: null,
      to: null,
      progress: 0,
      isTransitioning: false
    });
  }, [resetLoadingStates, clearAllSelections]);

  // 🎯 GETTERS - Estados computados
  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const isAllLoaded = Object.values(loadingStates).every(state => !state);
  
  const getLoadingStep = () => {
    if (loadingStates.historia) return 'Carregando história...';
    if (loadingStates.personagens) return 'Carregando personagens...';
    if (loadingStates.socket) return 'Conectando à sala...';
    if (loadingStates.sala) return 'Preparando sala...';
    if (loadingStates.jogo) return 'Iniciando jogo...';
    return 'Carregado';
  };

  // 📦 VALOR DO CONTEXT
  const contextValue = {
    // Estados
    loadingStates,
    previousSelections,
    transitionState,
    overallProgress,
    isAnyLoading,
    isAllLoaded,

    // Ações de Loading
    setLoading,
    resetLoadingStates,

    // Ações de Seleções
    saveSelection,
    getSelection,
    clearSelection,
    clearAllSelections,

    // Ações de Transição
    startTransition,
    updateTransitionProgress,
    completeTransition,

    // Utilitários
    getLoadingStep,
    resetAll
  };

  return (
    <GameLoadingContext.Provider value={contextValue}>
      {children}
    </GameLoadingContext.Provider>
  );
};

export default GameLoadingProvider;
