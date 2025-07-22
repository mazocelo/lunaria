/**
 * 🏛️ CLASSE STORE - Gerenciamento de classes estáticas
 * 
 * Store centralizado para todas as classes do sistema:
 * - Carregamento único e cache
 * - Acesso otimizado por ID e nome
 * - Funções utilitárias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginação da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { classeInitialStates } from './states.js';
import { createClasseActions } from './actions.js';

// ===== CLASSE STORE =====
export const useClasseStore = create(
  combine(
    classeInitialStates,
    createClasseActions
  )
);

// ===== UTILITÁRIOS GLOBAIS =====

/**
 * Inicializa o classe store (carrega classes se necessário)
 * Usado por: App.jsx ou outras inicializações globais
 */
export const initializeClasseStore = async () => {
  const { classesCarregadas, inicializar } = useClasseStore.getState();
  
  if (!classesCarregadas) {
    console.log('🚀 Inicializando Classe Store...');
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum
 */
export const useClasseSelectors = {
  // Todas as classes
  classes: () => useClasseStore(state => state.classes),
  
  // Status de carregamento
  loading: () => useClasseStore(state => state.loading),
  
  // Função para buscar classe por ID
  getClasseById: () => useClasseStore(state => state.getClasseById),
  
  // Função para buscar classe por nome
  getClasseByNome: () => useClasseStore(state => state.getClasseByNome),
  
  // Função para converter IDs em nomes
  getNomesDeClasses: () => useClasseStore(state => state.getNomesDeClasses),
  
  // Estado combinado para ViewModels
  estadoCompleto: () => useClasseStore(state => ({
    classes: state.classes,
    loading: state.loading,
    error: state.error,
    classesCarregadas: state.classesCarregadas,
    total: state.total,
    hasMore: state.hasMore
  }))
};

export default useClasseStore; 