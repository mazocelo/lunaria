/**
 * 🧬 RAÇA STORE - Gerenciamento de raças estáticas
 * 
 * Store centralizado para todas as raças do sistema:
 * - Carregamento único e cache
 * - Acesso otimizado por ID e nome
 * - Funções utilitárias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginação da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { racaInitialStates } from './states.js';
import { createRacaActions } from './actions.js';

// ===== RAÇA STORE =====
export const useRacaStore = create(
  combine(
    racaInitialStates,
    createRacaActions
  )
);

// ===== UTILITÁRIOS GLOBAIS =====

/**
 * Inicializa o raça store (carrega raças se necessário)
 * Usado por: App.jsx ou outras inicializações globais
 */
export const initializeRacaStore = async () => {
  const { racasCarregadas, inicializar } = useRacaStore.getState();
  
  if (!racasCarregadas) {
    console.log('🚀 Inicializando Raça Store...');
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum
 */
export const useRacaSelectors = {
  // Todas as raças
  racas: () => useRacaStore(state => state.racas),
  
  // Status de carregamento
  loading: () => useRacaStore(state => state.loading),
  
  // Função para buscar raça por ID
  getRacaById: () => useRacaStore(state => state.getRacaById),
  
  // Função para buscar raça por nome
  getRacaByNome: () => useRacaStore(state => state.getRacaByNome),
  
  // Função para converter IDs em nomes
  getNomesDeRacas: () => useRacaStore(state => state.getNomesDeRacas),
  
  // Estado combinado para ViewModels
  estadoCompleto: () => useRacaStore(state => ({
    racas: state.racas,
    loading: state.loading,
    error: state.error,
    racasCarregadas: state.racasCarregadas,
    total: state.total,
    hasMore: state.hasMore
  }))
};

export default useRacaStore; 