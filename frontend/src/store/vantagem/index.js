/**
 * 🌟 VANTAGEM STORE - Gerenciamento de vantagens e desvantagens estáticas
 * 
 * Store centralizado para todas as vantagens/desvantagens do sistema:
 * - Carregamento único e cache
 * - Acesso otimizado por ID e nome
 * - Separação entre vantagens (custo > 0) e desvantagens (custo < 0)
 * - Funções utilitárias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginação da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { vantagemInitialStates } from './states.js';
import { createVantagemActions } from './actions.js';

// ===== VANTAGEM STORE =====
export const useVantagemStore = create(
  combine(
    vantagemInitialStates,
    createVantagemActions
  )
);

// ===== UTILITÁRIOS GLOBAIS =====

/**
 * Inicializa o vantagem store (carrega vantagens se necessário)
 * Usado por: App.jsx ou outras inicializações globais
 */
export const initializeVantagemStore = async () => {
  const { vantagensCarregadas, inicializar } = useVantagemStore.getState();
  
  if (!vantagensCarregadas) {
    console.log('🚀 Inicializando Vantagem Store...');
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum
 */
export const useVantagemSelectors = {
  // Todas as vantagens/desvantagens
  vantagens: () => useVantagemStore(state => state.vantagens),
  
  // Apenas vantagens positivas
  vantagensPositivas: () => useVantagemStore(state => state.vantagensPositivas),
  
  // Apenas desvantagens (custo negativo)
  desvantagens: () => useVantagemStore(state => state.vantagensNegativas),
  
  // Status de carregamento
  loading: () => useVantagemStore(state => state.loading),
  
  // Função para buscar vantagem por ID
  getVantagemById: () => useVantagemStore(state => state.getVantagemById),
  
  // Função para buscar vantagem por nome
  getVantagemByNome: () => useVantagemStore(state => state.getVantagemByNome),
  
  // Função para converter IDs em nomes
  getNomesDeVantagens: () => useVantagemStore(state => state.getNomesDeVantagens),
  
  // Estado combinado para ViewModels
  estadoCompleto: () => useVantagemStore(state => ({
    vantagens: state.vantagens,
    vantagensPositivas: state.vantagensPositivas,
    vantagensNegativas: state.vantagensNegativas,
    totalVantagens: state.totalVantagens,
    totalDesvantagens: state.totalDesvantagens,
    loading: state.loading,
    error: state.error,
    vantagensCarregadas: state.vantagensCarregadas,
    total: state.total,
    hasMore: state.hasMore
  }))
};

export default useVantagemStore; 