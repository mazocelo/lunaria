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

// ===== IMPORTS INTERNOS (para initializeAllStores) =====
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
