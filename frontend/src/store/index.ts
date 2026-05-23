/**
 * STORE INDEX - Centralizador de todos os stores Zustand
 */

export { useGameStore } from './game/index';
export { useSocketStore } from './socket/index';
export { useTemaStore, initializeTemaStore, useTemaSelectors } from './tema/index';
export { useClasseStore, initializeClasseStore, useClasseSelectors } from './classe/index';
export { useRacaStore, initializeRacaStore, useRacaSelectors } from './raca/index';
export { useVantagemStore, initializeVantagemStore, useVantagemSelectors } from './vantagem/index';
export { useDesvantagemStore, initializeDesvantagemStore, useDesvantagemSelectors } from './desvantagem/index';
export { useMestreStore, initializeMestreStore, useMestreSelectors } from './mestre/index';
export { initializeGameStore } from './game/index';

import { initializeGameStore } from './game/index';
import { initializeTemaStore } from './tema/index';
import { initializeClasseStore } from './classe/index';
import { initializeRacaStore } from './raca/index';
import { initializeVantagemStore } from './vantagem/index';
import { initializeDesvantagemStore } from './desvantagem/index';
import { initializeMestreStore } from './mestre/index';

let storesInitialized = false;
let initializationPromise: Promise<void> | null = null;
let _initBackoffUntil = 0;

/**
 * Inicializa todos os stores do sistema (SINGLETON)
 * Usado por: App.jsx na inicializacao da aplicacao
 */
export const initializeAllStores = async (): Promise<void> => {
  if (storesInitialized) return;
  if (initializationPromise) return await initializationPromise;

  // Backoff: se falhou recentemente (429), esperar antes de retentar
  if (Date.now() < _initBackoffUntil) return;

  initializationPromise = (async () => {
    try {
      initializeGameStore();
      // allSettled: stores que falharem nao impedem as outras
      const results = await Promise.allSettled([
        initializeTemaStore(),
        initializeClasseStore(),
        initializeRacaStore(),
        initializeVantagemStore(),
        initializeDesvantagemStore(),
        initializeMestreStore(),
      ]);
      const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
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
