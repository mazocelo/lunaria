/**
 * 🏪 STORE INDEX - Centralizador de todos os stores Zustand
 * 
 * Exports principais:
 * - Game Store (estado do jogo)
 * - Socket Store (conexão WebSocket)
 * - Tema Store (dados estáticos de temas)
 * - Utilitários globais
 * - Selectors combinados
 */

// ===== IMPORTS DOS STORES =====
export { useGameStore } from './game/index.js';
export { useSocketStore } from './socket/index.js';
export { useTemaStore, initializeTemaStore, useTemaSelectors } from './tema/index.js';
export { useClasseStore, initializeClasseStore, useClasseSelectors } from './classe/index.js';
export { useRacaStore, initializeRacaStore, useRacaSelectors } from './raca/index.js';
export { useVantagemStore, initializeVantagemStore, useVantagemSelectors } from './vantagem/index.js';
export { useDesvantagemStore, initializeDesvantagemStore, useDesvantagemSelectors } from './desvantagem/index.js';

// ===== UTILITÁRIOS DE INICIALIZAÇÃO =====
export { initializeGameStore } from './game/index.js';

// ===== IMPORTS INTERNOS PARA HOOKS =====
import { useGameStore } from './game/index.js';
import { useSocketStore } from './socket/index.js';
import { useTemaStore } from './tema/index.js';
import { useClasseStore } from './classe/index.js';
import { useRacaStore } from './raca/index.js';
import { useVantagemStore } from './vantagem/index.js';
import { useDesvantagemStore } from './desvantagem/index.js';
import { initializeGameStore } from './game/index.js';

// ===== IMPORTS INTERNOS PARA INICIALIZAÇÃO =====
import { initializeTemaStore } from './tema/index.js';
import { initializeClasseStore } from './classe/index.js';
import { initializeRacaStore } from './raca/index.js';
import { initializeVantagemStore } from './vantagem/index.js';
import { initializeDesvantagemStore } from './desvantagem/index.js';

// ===== UTILITÁRIOS GLOBAIS =====

// 🔒 CONTROLE DE INICIALIZAÇÃO - Evita execuções múltiplas
let storesInitialized = false;
let initializationPromise = null;

/**
 * Inicializa todos os stores do sistema (SINGLETON)
 * Usado por: App.jsx na inicialização da aplicação
 * Garante execução única mesmo se chamado múltiplas vezes
 */
export const initializeAllStores = async () => {
  // Se já inicializados, retorna imediatamente
  if (storesInitialized) {
    return;
  }
  
  // Se já está inicializando, aguarda a promise em andamento
  if (initializationPromise) {
    return await initializationPromise;
  }
  
  // Criar promise para controlar inicialização
  initializationPromise = (async () => {
    try {
      // Inicializar game store (hidrata localStorage)
      initializeGameStore();
      
      // Inicializar stores estáticos (carrega do backend) EM PARALELO
      await Promise.all([
        initializeTemaStore(),
        initializeClasseStore(),
        initializeRacaStore(),
        initializeVantagemStore(),
        initializeDesvantagemStore()
      ]);
      
      storesInitialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar stores:', error);
      // Reset para permitir nova tentativa
      initializationPromise = null;
      throw error;
    }
  })();
  
  return await initializationPromise;
};

/**
 * Persiste estados críticos de todos os stores
 * Usado por: Em momentos críticos da aplicação
 */
export const persistirEstadoCritico = () => {
  
  try {
    // Persistir apenas dados críticos do game store
    const { persistirEstadoCritico: persistirGame } = useGameStore.getState();
    persistirGame();
  } catch (error) {
    console.error('❌ Erro ao persistir estados:', error);
  }
};

/**
 * Verifica se todos os stores estáticos estão carregados
 * Usado por: Components para verificar status do cache
 */
export const areStaticStoresLoaded = () => {
  const temaState = useTemaStore.getState();
  const classeState = useClasseStore.getState();
  const racaState = useRacaStore.getState();
  const vantagemState = useVantagemStore.getState();
  const desvantagemState = useDesvantagemStore.getState();
  
  return {
    allLoaded: temaState.temasCarregados && classeState.classesCarregadas && racaState.racasCarregadas && vantagemState.vantagensCarregadas && desvantagemState.desvantagensCarregadas,
    temas: { loaded: temaState.temasCarregados, count: temaState.temas.length },
    classes: { loaded: classeState.classesCarregadas, count: classeState.classes.length },
    racas: { loaded: racaState.racasCarregadas, count: racaState.racas.length },
    vantagens: { loaded: vantagemState.vantagensCarregadas, count: vantagemState.vantagens.length },
    desvantagens: { loaded: desvantagemState.desvantagensCarregadas, count: desvantagemState.desvantagens.length }
  };
};

/**
 * Força recarregamento de todos os stores estáticos
 * Usado por: Para refresh manual dos dados
 */
export const reloadStaticStores = async () => {
  
  try {
    // Reset do controle de inicialização
    storesInitialized = false;
    initializationPromise = null;
    
    // Recarregar todos
    await Promise.all([
      initializeTemaStore(),
      initializeClasseStore(), 
      initializeRacaStore(),
      initializeVantagemStore(),
      initializeDesvantagemStore()
    ]);
    
    storesInitialized = true;
  } catch (error) {
    console.error('❌ Erro ao recarregar stores estáticos:', error);
    throw error;
  }
};

/**
 * Reset de todos os stores
 * Usado por: Logout ou reset completo da aplicação
 */
export const resetAllStores = () => {
  
  try {
    // Reset do controle de inicialização
    storesInitialized = false;
    initializationPromise = null;
    
    const { resetGameState } = useGameStore.getState();
    const { resetSocketState } = useSocketStore.getState();
    const { resetTemaState } = useTemaStore.getState();
    const { resetClasseState } = useClasseStore.getState();
    const { resetRacaState } = useRacaStore.getState();
    const { resetVantagemState } = useVantagemStore.getState();
    const { resetDesvantagemState } = useDesvantagemStore.getState();
    
    resetGameState();
    resetSocketState();
    resetTemaState();
    resetClasseState();
    resetRacaState();
    resetVantagemState();
    resetDesvantagemState();
  } catch (error) {
    console.error('❌ Erro ao resetar stores:', error);
  }
};

// ===== SELECTORS COMBINADOS =====

/**
 * Selectors que combinam dados de múltiplos stores
 */
export const useCombinedSelectors = {
  // Estado de loading geral
  globalLoading: () => {
    const gameLoading = useGameStore(state => state.loading);
    const socketConnecting = useSocketStore(state => state.isConnecting);
    const temaLoading = useTemaStore(state => state.loading);
    const classeLoading = useClasseStore(state => state.loading);
    const racaLoading = useRacaStore(state => state.loading);
    const vantagemLoading = useVantagemStore(state => state.loading);
    const desvantagemLoading = useDesvantagemStore(state => state.loading);
    
    return gameLoading || socketConnecting || temaLoading || classeLoading || racaLoading || vantagemLoading || desvantagemLoading;
  },
  
  // Errors gerais
  globalErrors: () => {
    const gameError = useGameStore(state => state.error);
    const socketError = useSocketStore(state => state.error);
    const temaError = useTemaStore(state => state.error);
    const classeError = useClasseStore(state => state.error);
    const racaError = useRacaStore(state => state.error);
    const vantagemError = useVantagemStore(state => state.error);
    const desvantagemError = useDesvantagemStore(state => state.error);
    
    return [gameError, socketError, temaError, classeError, racaError, vantagemError, desvantagemError].filter(Boolean);
  },
  
  // Status de prontidão da aplicação
  appReady: () => {
    const gameInitialized = useGameStore(state => true); // Game store sempre pronto
    const temasCarregados = useTemaStore(state => state.temasCarregados);
    const classesCarregadas = useClasseStore(state => state.classesCarregadas);
    const racasCarregadas = useRacaStore(state => state.racasCarregadas);
    const vantagensCarregadas = useVantagemStore(state => state.vantagensCarregadas);
    const desvantagensCarregadas = useDesvantagemStore(state => state.desvantagensCarregadas);
    
    return gameInitialized && temasCarregados && classesCarregadas && racasCarregadas && vantagensCarregadas && desvantagensCarregadas;
  },

  // Estado combinado para história com temas mapeados
  historiaComTemas: () => {
    const historiaAtual = useGameStore(state => state.historiaAtual);
    const mapearTemasDeHistoria = useTemaStore(state => state.mapearTemasDeHistoria);
    
    if (!historiaAtual) return null;
    
    return {
      ...historiaAtual,
      temasNomes: mapearTemasDeHistoria(historiaAtual)
    };
  }
};

// ===== HOOKS CUSTOMIZADOS =====

/**
 * Hook para acessar temas de forma otimizada
 * Usado por: Views e ViewModels que trabalham com temas
 */
export const useTemas = () => {
  const temas = useTemaStore(state => state.temas);
  const temasAtivos = useTemaStore(state => state.temasAtivos);
  const loading = useTemaStore(state => state.loading);
  const error = useTemaStore(state => state.error);
  const temasCarregados = useTemaStore(state => state.temasCarregados);
  
  // Actions
  const carregarTemas = useTemaStore(state => state.carregarTemas);
  const getTemaById = useTemaStore(state => state.getTemaById);
  const getTemaByNome = useTemaStore(state => state.getTemaByNome);
  const getNomesDeTemas = useTemaStore(state => state.getNomesDeTemas);
  const getTemasParaSelecao = useTemaStore(state => state.getTemasParaSelecao);
  
  return {
    // Estados
    temas,
    temasAtivos,
    loading,
    error,
    temasCarregados,
    
    // Actions
    carregarTemas,
    getTemaById,
    getTemaByNome,
    getNomesDeTemas,
    getTemasParaSelecao
  };
};

/**
 * Hook para componentes React que trabalham com temas
 * ⚠️ APENAS PARA COMPONENTES REACT - NÃO PARA VIEWMODELS
 */
export const useTemasParaHistoria = () => {
  const temasAtivos = useTemaStore(state => state.temasAtivos);
  const getTemasParaSelecao = useTemaStore(state => state.getTemasParaSelecao);
  const getTemasParaFiltro = useTemaStore(state => state.getTemasParaFiltro);
  const mapearTemasDeHistoria = useTemaStore(state => state.mapearTemasDeHistoria);
  const carregarTemas = useTemaStore(state => state.carregarTemas);
  
  return {
    temasAtivos,
    getTemasParaSelecao,
    getTemasParaFiltro,
    mapearTemasDeHistoria,
    carregarTemas
  };
};

/**
 * Hook para acessar raças de forma otimizada
 * Usado por: Views e ViewModels que trabalham com raças
 */
export const useRacas = () => {
  const racas = useRacaStore(state => state.racas);
  const loading = useRacaStore(state => state.loading);
  const error = useRacaStore(state => state.error);
  const racasCarregadas = useRacaStore(state => state.racasCarregadas);
  const total = useRacaStore(state => state.total);
  const hasMore = useRacaStore(state => state.hasMore);
  
  // Actions
  const carregarRacas = useRacaStore(state => state.carregarRacas);
  const getRacaById = useRacaStore(state => state.getRacaById);
  const getRacaByNome = useRacaStore(state => state.getRacaByNome);
  const getNomesDeRacas = useRacaStore(state => state.getNomesDeRacas);
  const getRacasParaSelecao = useRacaStore(state => state.getRacasParaSelecao);
  const carregarMaisRacas = useRacaStore(state => state.carregarMaisRacas);
  
  return {
    // Estados
    racas,
    loading,
    error,
    racasCarregadas,
    total,
    hasMore,
    
    // Actions
    carregarRacas,
    getRacaById,
    getRacaByNome,
    getNomesDeRacas,
    getRacasParaSelecao,
    carregarMaisRacas
  };
};

/**
 * 🔧 API DIRETA para ViewModels de Raças (sem hooks)
 * Usado por: PersonagemViewModel, NovoPersonagemViewModel (classes JavaScript)
 */
export const getRacaStoreAPI = () => {
  const store = useRacaStore.getState();
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => useRacaStore.getState(),
    
    // Estados atuais (getters dinâmicos)
    get racas() { return useRacaStore.getState().racas; },
    get loading() { return useRacaStore.getState().loading; },
    get racasCarregadas() { return useRacaStore.getState().racasCarregadas; },
    get total() { return useRacaStore.getState().total; },
    get hasMore() { return useRacaStore.getState().hasMore; },
    get error() { return useRacaStore.getState().error; },
    
    // Actions (mantém referência original)
    carregarRacas: store.carregarRacas,
    getRacaById: store.getRacaById,
    getRacaByNome: store.getRacaByNome,
    getNomesDeRacas: store.getNomesDeRacas,
    getIdsDeRacas: store.getIdsDeRacas,
    getRacasParaSelecao: store.getRacasParaSelecao,
    getRacasParaFiltro: store.getRacasParaFiltro,
    mapearRacaDePersonagem: store.mapearRacaDePersonagem,
    racaExists: store.racaExists,
    recarregarRacas: store.recarregarRacas,
    carregarMaisRacas: store.carregarMaisRacas,
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => useRacaStore.subscribe(callback)
  };
};

/**
 * Hook para componentes React que trabalham com personagens e raças
 * ⚠️ APENAS PARA COMPONENTES REACT - NÃO PARA VIEWMODELS
 */
export const useRacasParaPersonagem = () => {
  const racas = useRacaStore(state => state.racas);
  const getRacasParaSelecao = useRacaStore(state => state.getRacasParaSelecao);
  const getRacasParaFiltro = useRacaStore(state => state.getRacasParaFiltro);
  const mapearRacaDePersonagem = useRacaStore(state => state.mapearRacaDePersonagem);
  const carregarRacas = useRacaStore(state => state.carregarRacas);
  
  return {
    racas,
    getRacasParaSelecao,
    getRacasParaFiltro,
    mapearRacaDePersonagem,
    carregarRacas
  };
};

/**
 * Hook para acessar vantagens de forma otimizada
 * Usado por: Views e ViewModels que trabalham com vantagens
 */
export const useVantagens = () => {
  const vantagens = useVantagemStore(state => state.vantagens);
  const vantagensPositivas = useVantagemStore(state => state.vantagensPositivas);
  const vantagensNegativas = useVantagemStore(state => state.vantagensNegativas);
  const loading = useVantagemStore(state => state.loading);
  const error = useVantagemStore(state => state.error);
  const vantagensCarregadas = useVantagemStore(state => state.vantagensCarregadas);
  const total = useVantagemStore(state => state.total);
  const hasMore = useVantagemStore(state => state.hasMore);
  const totalVantagens = useVantagemStore(state => state.totalVantagens);
  const totalDesvantagens = useVantagemStore(state => state.totalDesvantagens);
  
  // Actions
  const carregarVantagens = useVantagemStore(state => state.carregarVantagens);
  const getVantagemById = useVantagemStore(state => state.getVantagemById);
  const getVantagemByNome = useVantagemStore(state => state.getVantagemByNome);
  const getNomesDeVantagens = useVantagemStore(state => state.getNomesDeVantagens);
  const getVantagensParaSelecao = useVantagemStore(state => state.getVantagensParaSelecao);
  const getDesvantagensParaSelecao = useVantagemStore(state => state.getDesvantagensParaSelecao);
  const carregarMaisVantagens = useVantagemStore(state => state.carregarMaisVantagens);
  
  return {
    // Estados
    vantagens,
    vantagensPositivas,
    vantagensNegativas,
    loading,
    error,
    vantagensCarregadas,
    total,
    hasMore,
    totalVantagens,
    totalDesvantagens,
    
    // Actions
    carregarVantagens,
    getVantagemById,
    getVantagemByNome,
    getNomesDeVantagens,
    getVantagensParaSelecao,
    getDesvantagensParaSelecao,
    carregarMaisVantagens
  };
};

/**
 * Hook para componentes React que trabalham com personagens e vantagens
 * ⚠️ APENAS PARA COMPONENTES REACT - NÃO PARA VIEWMODELS
 */
export const useVantagensParaPersonagem = () => {
  const vantagensPositivas = useVantagemStore(state => state.vantagensPositivas);
  const vantagensNegativas = useVantagemStore(state => state.vantagensNegativas);
  const getVantagensParaSelecao = useVantagemStore(state => state.getVantagensParaSelecao);
  const getDesvantagensParaSelecao = useVantagemStore(state => state.getDesvantagensParaSelecao);
  const getVantagensParaFiltro = useVantagemStore(state => state.getVantagensParaFiltro);
  const mapearVantagensDePersonagem = useVantagemStore(state => state.mapearVantagensDePersonagem);
  const carregarVantagens = useVantagemStore(state => state.carregarVantagens);
  
  return {
    vantagensPositivas,
    vantagensNegativas,
    getVantagensParaSelecao,
    getDesvantagensParaSelecao,
    getVantagensParaFiltro,
    mapearVantagensDePersonagem,
    carregarVantagens
  };
};

/**
 * Hook para acessar classes de forma otimizada
 * Usado por: Views e ViewModels que trabalham com classes
 */
export const useClasses = () => {
  const classes = useClasseStore(state => state.classes);
  const loading = useClasseStore(state => state.loading);
  const error = useClasseStore(state => state.error);
  const classesCarregadas = useClasseStore(state => state.classesCarregadas);
  const total = useClasseStore(state => state.total);
  const hasMore = useClasseStore(state => state.hasMore);
  
  // Actions
  const carregarClasses = useClasseStore(state => state.carregarClasses);
  const getClasseById = useClasseStore(state => state.getClasseById);
  const getClasseByNome = useClasseStore(state => state.getClasseByNome);
  const getNomesDeClasses = useClasseStore(state => state.getNomesDeClasses);
  const getClassesParaSelecao = useClasseStore(state => state.getClassesParaSelecao);
  const carregarMaisClasses = useClasseStore(state => state.carregarMaisClasses);
  
  return {
    // Estados
    classes,
    loading,
    error,
    classesCarregadas,
    total,
    hasMore,
    
    // Actions
    carregarClasses,
    getClasseById,
    getClasseByNome,
    getNomesDeClasses,
    getClassesParaSelecao,
    carregarMaisClasses
  };
};

/**
 * 🔧 API DIRETA para ViewModels de Classes (sem hooks)
 * Usado por: PersonagemViewModel, NovoPersonagemViewModel (classes JavaScript)
 */
export const getClasseStoreAPI = () => {
  const store = useClasseStore.getState();
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => useClasseStore.getState(),
    
    // Estados atuais (getters dinâmicos)
    get classes() { return useClasseStore.getState().classes; },
    get loading() { return useClasseStore.getState().loading; },
    get classesCarregadas() { return useClasseStore.getState().classesCarregadas; },
    get total() { return useClasseStore.getState().total; },
    get hasMore() { return useClasseStore.getState().hasMore; },
    get error() { return useClasseStore.getState().error; },
    
    // Actions (mantém referência original)
    carregarClasses: store.carregarClasses,
    getClasseById: store.getClasseById,
    getClasseByNome: store.getClasseByNome,
    getNomesDeClasses: store.getNomesDeClasses,
    getIdsDeClasses: store.getIdsDeClasses,
    getClassesParaSelecao: store.getClassesParaSelecao,
    getClassesParaFiltro: store.getClassesParaFiltro,
    mapearClasseDePersonagem: store.mapearClasseDePersonagem,
    classeExists: store.classeExists,
    recarregarClasses: store.recarregarClasses,
    carregarMaisClasses: store.carregarMaisClasses,
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => useClasseStore.subscribe(callback)
  };
};

/**
 * Hook para componentes React que trabalham com personagens
 * ⚠️ APENAS PARA COMPONENTES REACT - NÃO PARA VIEWMODELS
 */
export const useClassesParaPersonagem = () => {
  const classes = useClasseStore(state => state.classes);
  const getClassesParaSelecao = useClasseStore(state => state.getClassesParaSelecao);
  const getClassesParaFiltro = useClasseStore(state => state.getClassesParaFiltro);
  const mapearClasseDePersonagem = useClasseStore(state => state.mapearClasseDePersonagem);
  const carregarClasses = useClasseStore(state => state.carregarClasses);
  
  return {
    classes,
    getClassesParaSelecao,
    getClassesParaFiltro,
    mapearClasseDePersonagem,
    carregarClasses
  };
};

/**
 * 🔧 API DIRETA para ViewModels (sem hooks)
 * Usado por: HistoriaViewModel, NovaHistoriaViewModel (classes JavaScript)
 * 
 * Esta função retorna uma API que acessa o store diretamente,
 * sem violar as regras dos hooks do React.
 */
export const getTemaStoreAPI = () => {
  const store = useTemaStore.getState();
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => useTemaStore.getState(),
    
    // Estados atuais (getters dinâmicos)
    get temasAtivos() { return useTemaStore.getState().temasAtivos; },
    get temas() { return useTemaStore.getState().temas; },
    get loading() { return useTemaStore.getState().loading; },
    get temasCarregados() { return useTemaStore.getState().temasCarregados; },
    get error() { return useTemaStore.getState().error; },
    
    // Actions (mantém referência original)
    carregarTemas: store.carregarTemas,
    getTemaById: store.getTemaById,
    getTemaByNome: store.getTemaByNome,
    getNomesDeTemas: store.getNomesDeTemas,
    getIdsDeTemas: store.getIdsDeTemas,
    getTemasParaSelecao: store.getTemasParaSelecao,
    getTemasParaFiltro: store.getTemasParaFiltro,
    mapearTemasDeHistoria: store.mapearTemasDeHistoria,
    temaExists: store.temaExists,
    recarregarTemas: store.recarregarTemas,
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => useTemaStore.subscribe(callback)
  };
};

/**
 * 🔧 API DIRETA para ViewModels de Vantagens (sem hooks)
 * Usado por: PersonagemViewModel, NovoPersonagemViewModel (classes JavaScript)
 */
export const getVantagemStoreAPI = () => {
  const store = useVantagemStore.getState();
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => useVantagemStore.getState(),
    
    // Estados atuais (getters dinâmicos)
    get vantagens() { return useVantagemStore.getState().vantagens; },
    get vantagensPositivas() { return useVantagemStore.getState().vantagensPositivas; },
    get vantagensNegativas() { return useVantagemStore.getState().vantagensNegativas; },
    get loading() { return useVantagemStore.getState().loading; },
    get vantagensCarregadas() { return useVantagemStore.getState().vantagensCarregadas; },
    get total() { return useVantagemStore.getState().total; },
    get hasMore() { return useVantagemStore.getState().hasMore; },
    get error() { return useVantagemStore.getState().error; },
    get totalVantagens() { return useVantagemStore.getState().totalVantagens; },
    get totalDesvantagens() { return useVantagemStore.getState().totalDesvantagens; },
    
    // Actions (mantém referência original)
    carregarVantagens: store.carregarVantagens,
    getVantagemById: store.getVantagemById,
    getVantagemByNome: store.getVantagemByNome,
    getNomesDeVantagens: store.getNomesDeVantagens,
    getIdsDeVantagens: store.getIdsDeVantagens,
    getVantagensParaSelecao: store.getVantagensParaSelecao,
    getDesvantagensParaSelecao: store.getDesvantagensParaSelecao,
    getVantagensParaFiltro: store.getVantagensParaFiltro,
    mapearVantagensDePersonagem: store.mapearVantagensDePersonagem,
    vantagemExists: store.vantagemExists,
    recarregarVantagens: store.recarregarVantagens,
    carregarMaisVantagens: store.carregarMaisVantagens,
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => useVantagemStore.subscribe(callback)
  };
}; 

/**
 * Hook para acessar desvantagens de forma otimizada
 * Usado por: Views e ViewModels que trabalham com desvantagens
 */
export const useDesvantagens = () => {
  const desvantagens = useDesvantagemStore(state => state.desvantagens);
  const desvantagensAtivas = useDesvantagemStore(state => state.desvantagensAtivas);
  const loading = useDesvantagemStore(state => state.loading);
  const error = useDesvantagemStore(state => state.error);
  const desvantagensCarregadas = useDesvantagemStore(state => state.desvantagensCarregadas);
  const total = useDesvantagemStore(state => state.total);
  const hasMore = useDesvantagemStore(state => state.hasMore);
  const totalDesvantagens = useDesvantagemStore(state => state.totalDesvantagens);
  const nivelMaisComum = useDesvantagemStore(state => state.nivelMaisComum);
  const tipoMaisComum = useDesvantagemStore(state => state.tipoMaisComum);
  
  // Actions
  const carregarDesvantagens = useDesvantagemStore(state => state.carregarDesvantagens);
  const getDesvantagemById = useDesvantagemStore(state => state.getDesvantagemById);
  const getDesvantagemByNome = useDesvantagemStore(state => state.getDesvantagemByNome);
  const getDesvantagensPorNivel = useDesvantagemStore(state => state.getDesvantagensPorNivel);
  const getDesvantagensPorTipo = useDesvantagemStore(state => state.getDesvantagensPorTipo);
  const getNomesDeDesvantagens = useDesvantagemStore(state => state.getNomesDeDesvantagens);
  const getDesvantagensParaSelecao = useDesvantagemStore(state => state.getDesvantagensParaSelecao);
  const getEstatisticasDesvantagens = useDesvantagemStore(state => state.getEstatisticasDesvantagens);
  const carregarMaisDesvantagens = useDesvantagemStore(state => state.carregarMaisDesvantagens);
  
  return {
    // Estados
    desvantagens,
    desvantagensAtivas,
    loading,
    error,
    desvantagensCarregadas,
    total,
    hasMore,
    totalDesvantagens,
    nivelMaisComum,
    tipoMaisComum,
    
    // Actions
    carregarDesvantagens,
    getDesvantagemById,
    getDesvantagemByNome,
    getDesvantagensPorNivel,
    getDesvantagensPorTipo,
    getNomesDeDesvantagens,
    getDesvantagensParaSelecao,
    getEstatisticasDesvantagens,
    carregarMaisDesvantagens
  };
};

/**
 * Hook para componentes React que trabalham com personagens e desvantagens
 * ⚠️ APENAS PARA COMPONENTES REACT - NÃO PARA VIEWMODELS
 */
export const useDesvantagensParaPersonagem = () => {
  const desvantagensAtivas = useDesvantagemStore(state => state.desvantagensAtivas);
  const getDesvantagensParaSelecao = useDesvantagemStore(state => state.getDesvantagensParaSelecao);
  const getDesvantagensParaFiltro = useDesvantagemStore(state => state.getDesvantagensParaFiltro);
  const getDesvantagensPorNivel = useDesvantagemStore(state => state.getDesvantagensPorNivel);
  const getDesvantagensPorTipo = useDesvantagemStore(state => state.getDesvantagensPorTipo);
  const mapearDesvantagensDePersonagem = useDesvantagemStore(state => state.mapearDesvantagensDePersonagem);
  const carregarDesvantagens = useDesvantagemStore(state => state.carregarDesvantagens);
  
  return {
    desvantagensAtivas,
    getDesvantagensParaSelecao,
    getDesvantagensParaFiltro,
    getDesvantagensPorNivel,
    getDesvantagensPorTipo,
    mapearDesvantagensDePersonagem,
    carregarDesvantagens
  };
};

/**
 * 🔧 API DIRETA para ViewModels de Desvantagens (sem hooks)
 * Usado por: PersonagemViewModel, NovoPersonagemViewModel (classes JavaScript)
 */
export const getDesvantagemStoreAPI = () => {
  const store = useDesvantagemStore.getState();
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => useDesvantagemStore.getState(),
    
    // Estados atuais (getters dinâmicos)
    get desvantagens() { return useDesvantagemStore.getState().desvantagens; },
    get desvantagensAtivas() { return useDesvantagemStore.getState().desvantagensAtivas; },
    get loading() { return useDesvantagemStore.getState().loading; },
    get desvantagensCarregadas() { return useDesvantagemStore.getState().desvantagensCarregadas; },
    get total() { return useDesvantagemStore.getState().total; },
    get hasMore() { return useDesvantagemStore.getState().hasMore; },
    get error() { return useDesvantagemStore.getState().error; },
    get totalDesvantagens() { return useDesvantagemStore.getState().totalDesvantagens; },
    get nivelMaisComum() { return useDesvantagemStore.getState().nivelMaisComum; },
    get tipoMaisComum() { return useDesvantagemStore.getState().tipoMaisComum; },
    
    // Actions (mantém referência original)
    carregarDesvantagens: store.carregarDesvantagens,
    getDesvantagemById: store.getDesvantagemById,
    getDesvantagemByNome: store.getDesvantagemByNome,
    getDesvantagensPorNivel: store.getDesvantagensPorNivel,
    getDesvantagensPorTipo: store.getDesvantagensPorTipo,
    getNomesDeDesvantagens: store.getNomesDeDesvantagens,
    getIdsDeDesvantagens: store.getIdsDeDesvantagens,
    getDesvantagensParaSelecao: store.getDesvantagensParaSelecao,
    getDesvantagensParaFiltro: store.getDesvantagensParaFiltro,
    getEstatisticasDesvantagens: store.getEstatisticasDesvantagens,
    mapearDesvantagensDePersonagem: store.mapearDesvantagensDePersonagem,
    desvantagemExists: store.desvantagemExists,
    recarregarDesvantagens: store.recarregarDesvantagens,
    carregarMaisDesvantagens: store.carregarMaisDesvantagens,
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => useDesvantagemStore.subscribe(callback)
  };
};

/**
 * 🔧 API DIRETA para ViewModels de Game (sem hooks)
 * Usado por: JogoViewModel (classes JavaScript)
 */
export const getGameStoreAPI = () => {
  // Importar dinamicamente para evitar problemas de escopo
  const store = useGameStore;
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => store.getState(),
    
    // Estados atuais (getters dinâmicos)
    get etapaAtual() { return store.getState().etapaAtual; },
    get historiaAtual() { return store.getState().historiaAtual; },
    get personagensDaHistoria() { return store.getState().personagensDaHistoria; },
    get personagemSelecionado() { return store.getState().personagemSelecionado; },
    get participantes() { return store.getState().participantes; },
    get salaAberta() { return store.getState().salaAberta; },
    get isDonoSala() { return store.getState().isDonoSala; },
    get loading() { return store.getState().loading; },
    get error() { return store.getState().error; },
    get loadingPersonagens() { return store.getState().loadingPersonagens; },
    get errorPersonagens() { return store.getState().errorPersonagens; },
    get mensagens() { return store.getState().mensagens; },
    get statusPersonagem() { return store.getState().statusPersonagem; },
    
    // Actions (acessadas dinamicamente)
    get setHistoriaAtual() { return store.getState().setHistoriaAtual; },
    get mudarEtapa() { return store.getState().mudarEtapa; },
    get setPersonagensDaHistoria() { return store.getState().setPersonagensDaHistoria; },
    get selecionarPersonagem() { return store.getState().selecionarPersonagem; },
    get setLoading() { return store.getState().setLoading; },
    get setError() { return store.getState().setError; },
    get clearErrors() { return store.getState().clearErrors; },
    get setLoadingPersonagens() { return store.getState().setLoadingPersonagens; },
    get setErrorPersonagens() { return store.getState().setErrorPersonagens; },
    get iniciarJogo() { return store.getState().iniciarJogo; },
    get abrirSala() { return store.getState().abrirSala; },
    get adicionarMensagem() { return store.getState().adicionarMensagem; },
    get setStatusPersonagem() { return store.getState().setStatusPersonagem; },
    get resetGameState() { return store.getState().resetGameState; },
    get setIsDonoSala() { return store.getState().setIsDonoSala; },
    get setParticipantes() { return store.getState().setParticipantes; },
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => store.subscribe(callback)
  };
};

/**
 * 🔧 API DIRETA para ViewModels de Socket (sem hooks)
 * Usado por: JogoViewModel (classes JavaScript)
 */
export const getSocketStoreAPI = () => {
  // Importar dinamicamente para evitar problemas de escopo
  const store = useSocketStore;
  
  return {
    // ===== ACESSO AO ESTADO COMPLETO =====
    getState: () => store.getState(),
    
    // Estados atuais (getters dinâmicos)
    get isConnected() { return store.getState().isConnected; },
    get isAuthenticated() { return store.getState().isAuthenticated; },
    get error() { return store.getState().error; },
    get latency() { return store.getState().latency; },
    get isTyping() { return store.getState().isTyping; },
    get roomUsers() { return store.getState().roomUsers; },
    get isConnecting() { return store.getState().isConnecting; },
    get inRoom() { return store.getState().inRoom; },
    get roomId() { return store.getState().roomId; },
    
    // Actions (acessadas dinamicamente)
    get clearError() { return store.getState().clearError; },
    get resetSocketState() { return store.getState().resetSocketState; },
    get connectToSocket() { return store.getState().connectToSocket; },
    get connect() { return store.getState().connect; },
    get authenticate() { return store.getState().authenticate; },
    get joinRoom() { return store.getState().joinRoom; },
    get leaveRoom() { return store.getState().leaveRoom; },
    get sendMessage() { return store.getState().sendMessage; },
    get safeEmit() { return store.getState().safeEmit; },
    get on() { return store.getState().on; },
    get off() { return store.getState().off; },
    get once() { return store.getState().once; },
    
    // Método para subscribir a mudanças (obrigatório para ViewModels)
    subscribe: (callback) => store.subscribe(callback)
  };
}; 