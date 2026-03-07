/**
 * STORE INDEX - Centralizador de todos os stores Zustand
 */

// ===== EXPORTS DOS STORES =====
export { useGameStore } from './game/index.js';
export { useSocketStore } from './socket/index.js';
export { useTemaStore, initializeTemaStore, useTemaSelectors } from './tema/index.js';
export { useClasseStore, initializeClasseStore, useClasseSelectors } from './classe/index.js';
export { useRacaStore, initializeRacaStore, useRacaSelectors } from './raca/index.js';
export { useVantagemStore, initializeVantagemStore, useVantagemSelectors } from './vantagem/index.js';
export { useDesvantagemStore, initializeDesvantagemStore, useDesvantagemSelectors } from './desvantagem/index.js';
export { useMestreStore, initializeMestreStore, useMestreSelectors } from './mestre/index.js';
export { initializeGameStore } from './game/index.js';

// ===== IMPORTS INTERNOS =====
import { useGameStore } from './game/index.js';
import { useSocketStore } from './socket/index.js';
import { useTemaStore } from './tema/index.js';
import { useClasseStore } from './classe/index.js';
import { useRacaStore } from './raca/index.js';
import { useVantagemStore } from './vantagem/index.js';
import { useDesvantagemStore } from './desvantagem/index.js';
import { useMestreStore } from './mestre/index.js';
import { initializeGameStore } from './game/index.js';
import { initializeTemaStore } from './tema/index.js';
import { initializeClasseStore } from './classe/index.js';
import { initializeRacaStore } from './raca/index.js';
import { initializeVantagemStore } from './vantagem/index.js';
import { initializeDesvantagemStore } from './desvantagem/index.js';
import { initializeMestreStore } from './mestre/index.js';

// ===== INICIALIZACAO =====
let storesInitialized = false;
let initializationPromise = null;

/**
 * Inicializa todos os stores do sistema (SINGLETON)
 * Usado por: App.jsx na inicializacao da aplicacao
 */
export const initializeAllStores = async () => {
  if (storesInitialized) return;
  if (initializationPromise) return await initializationPromise;

  initializationPromise = (async () => {
    try {
      initializeGameStore();
      await Promise.all([
        initializeTemaStore(),
        initializeClasseStore(),
        initializeRacaStore(),
        initializeVantagemStore(),
        initializeDesvantagemStore(),
        initializeMestreStore()
      ]);
      storesInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar stores:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return await initializationPromise;
};

// ===== APIs DIRETAS PARA VIEWMODELS (sem hooks) =====

export const getTemaStoreAPI = () => {
  const store = useTemaStore.getState();
  return {
    getState: () => useTemaStore.getState(),
    get temasAtivos() { return useTemaStore.getState().temasAtivos; },
    get temas() { return useTemaStore.getState().temas; },
    get loading() { return useTemaStore.getState().loading; },
    get temasCarregados() { return useTemaStore.getState().temasCarregados; },
    get error() { return useTemaStore.getState().error; },
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
    subscribe: (callback) => useTemaStore.subscribe(callback)
  };
};

export const getRacaStoreAPI = () => {
  const store = useRacaStore.getState();
  return {
    getState: () => useRacaStore.getState(),
    get racas() { return useRacaStore.getState().racas; },
    get loading() { return useRacaStore.getState().loading; },
    get racasCarregadas() { return useRacaStore.getState().racasCarregadas; },
    get total() { return useRacaStore.getState().total; },
    get hasMore() { return useRacaStore.getState().hasMore; },
    get error() { return useRacaStore.getState().error; },
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
    subscribe: (callback) => useRacaStore.subscribe(callback)
  };
};

export const getClasseStoreAPI = () => {
  const store = useClasseStore.getState();
  return {
    getState: () => useClasseStore.getState(),
    get classes() { return useClasseStore.getState().classes; },
    get loading() { return useClasseStore.getState().loading; },
    get classesCarregadas() { return useClasseStore.getState().classesCarregadas; },
    get total() { return useClasseStore.getState().total; },
    get hasMore() { return useClasseStore.getState().hasMore; },
    get error() { return useClasseStore.getState().error; },
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
    subscribe: (callback) => useClasseStore.subscribe(callback)
  };
};

export const getVantagemStoreAPI = () => {
  const store = useVantagemStore.getState();
  return {
    getState: () => useVantagemStore.getState(),
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
    subscribe: (callback) => useVantagemStore.subscribe(callback)
  };
};

export const getDesvantagemStoreAPI = () => {
  const store = useDesvantagemStore.getState();
  return {
    getState: () => useDesvantagemStore.getState(),
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
    subscribe: (callback) => useDesvantagemStore.subscribe(callback)
  };
};

export const getGameStoreAPI = () => {
  const store = useGameStore;
  return {
    getState: () => store.getState(),
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
    get setMensagens() { return store.getState().setMensagens; },
    get setStatusPersonagem() { return store.getState().setStatusPersonagem; },
    get resetGameState() { return store.getState().resetGameState; },
    get setIsDonoSala() { return store.getState().setIsDonoSala; },
    get setParticipantes() { return store.getState().setParticipantes; },
    subscribe: (callback) => store.subscribe(callback)
  };
};

export const getSocketStoreAPI = () => {
  const store = useSocketStore;
  return {
    getState: () => store.getState(),
    get isConnected() { return store.getState().isConnected; },
    get isAuthenticated() { return store.getState().isAuthenticated; },
    get error() { return store.getState().error; },
    get latency() { return store.getState().latency; },
    get isTyping() { return store.getState().isTyping; },
    get roomUsers() { return store.getState().roomUsers; },
    get isConnecting() { return store.getState().isConnecting; },
    get inRoom() { return store.getState().inRoom; },
    get roomId() { return store.getState().roomId; },
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
    subscribe: (callback) => store.subscribe(callback)
  };
};

export const getMestreStoreAPI = () => {
  const store = useMestreStore.getState();
  return {
    getState: () => useMestreStore.getState(),
    get mestres() { return useMestreStore.getState().mestres; },
    get mestresAtivos() { return useMestreStore.getState().mestresAtivos; },
    get loading() { return useMestreStore.getState().loading; },
    get mestresCarregados() { return useMestreStore.getState().mestresCarregados; },
    get total() { return useMestreStore.getState().total; },
    get hasMore() { return useMestreStore.getState().hasMore; },
    get error() { return useMestreStore.getState().error; },
    carregarMestres: store.carregarMestres,
    getMestreById: store.getMestreById,
    getMestreByNome: store.getMestreByNome,
    recarregarMestres: store.recarregarMestres,
    resetMestreState: store.resetMestreState,
    subscribe: (callback) => useMestreStore.subscribe(callback)
  };
};