/**
 * 🎨 TEMA STORE - Gerenciamento de temas estáticos
 * 
 * Store centralizado para todos os temas do sistema:
 * - Carregamento único e cache
 * - Acesso otimizado por ID e nome
 * - Funções utilitárias para ViewModels
 * - Estado global compartilhado
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { temaInitialStates } from './states.js';
import { createTemaActions } from './actions.js';

// ===== TEMA STORE =====
export const useTemaStore = create(
  combine(
    temaInitialStates,
    createTemaActions
  )
);

// ===== UTILITÁRIOS GLOBAIS =====

/**
 * Inicializa o tema store (carrega temas se necessário)
 * Usado por: App.jsx ou outras inicializações globais
 */
export const initializeTemaStore = async () => {
  const { temasCarregados, inicializar } = useTemaStore.getState();
  
  if (!temasCarregados) {
    console.log('🚀 Inicializando Tema Store...');
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum
 */
export const useTemaSelectors = {
  // Todos os temas
  temas: () => useTemaStore(state => state.temas),
  
  // Apenas temas ativos
  temasAtivos: () => useTemaStore(state => state.temasAtivos),
  
  // Status de carregamento
  loading: () => useTemaStore(state => state.loading),
  
  // Função para buscar tema por ID
  getTemaById: () => useTemaStore(state => state.getTemaById),
  
  // Função para buscar tema por nome
  getTemaByNome: () => useTemaStore(state => state.getTemaByNome),
  
  // Função para converter IDs em nomes
  getNomesDeTemas: () => useTemaStore(state => state.getNomesDeTemas),
  
  // Estado combinado para ViewModels
  estadoCompleto: () => useTemaStore(state => ({
    temas: state.temas,
    temasAtivos: state.temasAtivos,
    loading: state.loading,
    error: state.error,
    temasCarregados: state.temasCarregados
  }))
};

export default useTemaStore; 