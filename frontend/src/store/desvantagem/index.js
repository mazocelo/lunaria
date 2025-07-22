/**
 * 🔻 DESVANTAGEM STORE - Gerenciamento de desvantagens estáticas
 * 
 * Store centralizado para todas as desvantagens do sistema:
 * - Carregamento único e cache
 * - Acesso otimizado por ID e nome
 * - Organização por nível e tipo
 * - Estatísticas avançadas
 * - Funções utilitárias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginação da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { desvantagemInitialStates } from './states.js';
import { createDesvantagemActions } from './actions.js';

// ===== DESVANTAGEM STORE =====
export const useDesvantagemStore = create(
  combine(
    desvantagemInitialStates,
    createDesvantagemActions
  )
);

// ===== UTILITÁRIOS GLOBAIS =====

/**
 * Inicializa o desvantagem store (carrega desvantagens se necessário)
 * Usado por: App.jsx ou outras inicializações globais
 */
export const initializeDesvantagemStore = async () => {
  const { desvantagensCarregadas, inicializar } = useDesvantagemStore.getState();
  
  if (!desvantagensCarregadas) {
    console.log('🚀 Inicializando Desvantagem Store...');
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum
 */
export const useDesvantagemSelectors = {
  // Todas as desvantagens
  desvantagens: () => useDesvantagemStore(state => state.desvantagens),
  
  // Apenas desvantagens ativas
  desvantagensAtivas: () => useDesvantagemStore(state => state.desvantagensAtivas),
  
  // Status de carregamento
  loading: () => useDesvantagemStore(state => state.loading),
  
  // Função para buscar desvantagem por ID
  getDesvantagemById: () => useDesvantagemStore(state => state.getDesvantagemById),
  
  // Função para buscar desvantagem por nome
  getDesvantagemByNome: () => useDesvantagemStore(state => state.getDesvantagemByNome),
  
  // Função para buscar por nível
  getDesvantagensPorNivel: () => useDesvantagemStore(state => state.getDesvantagensPorNivel),
  
  // Função para buscar por tipo
  getDesvantagensPorTipo: () => useDesvantagemStore(state => state.getDesvantagensPorTipo),
  
  // Função para converter IDs em nomes
  getNomesDeDesvantagens: () => useDesvantagemStore(state => state.getNomesDeDesvantagens),
  
  // Função para estatísticas
  getEstatisticasDesvantagens: () => useDesvantagemStore(state => state.getEstatisticasDesvantagens),
  
  // Estado combinado para ViewModels
  estadoCompleto: () => useDesvantagemStore(state => ({
    desvantagens: state.desvantagens,
    desvantagensAtivas: state.desvantagensAtivas,
    totalDesvantagens: state.totalDesvantagens,
    nivelMaisComum: state.nivelMaisComum,
    tipoMaisComum: state.tipoMaisComum,
    loading: state.loading,
    error: state.error,
    desvantagensCarregadas: state.desvantagensCarregadas,
    total: state.total,
    hasMore: state.hasMore
  }))
};

export default useDesvantagemStore; 