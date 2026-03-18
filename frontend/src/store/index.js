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
let _initBackoffUntil = 0;

/**
 * Inicializa todos os stores do sistema (SINGLETON)
 * Usado por: App.jsx na inicializacao da aplicacao
 */
export const initializeAllStores = async () => {
  if (storesInitialized) return;
  if (initializationPromise) return await initializationPromise;

  // Backoff: se falhou recentemente (429), esperar antes de retentar
  if (Date.now() < _initBackoffUntil) return;

  initializationPromise = (async () => {
    try {
      initializeGameStore();
      // allSettled: stores que falharem não impedem as outras
      const results = await Promise.allSettled([
        initializeTemaStore(),
        initializeClasseStore(),
        initializeRacaStore(),
        initializeVantagemStore(),
        initializeDesvantagemStore(),
        initializeMestreStore()
      ]);
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length === results.length) {
        // Todas falharam — propagar erro
        throw failures[0].reason;
      }
      // Pelo menos algumas carregaram — marcar como inicializado
      storesInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar stores:', error);
      // Backoff de 30s para evitar loop de requests em 429
      _initBackoffUntil = Date.now() + 30000;
      initializationPromise = null;
      throw error;
    }
  })();

  return await initializationPromise;
};
