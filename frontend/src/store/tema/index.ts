/**
 * TEMA STORE - Gerenciamento de temas estaticos
 *
 * Store centralizado para todos os temas do sistema:
 * - Carregamento unico e cache
 * - Acesso otimizado por ID e nome
 * - Funcoes utilitarias para ViewModels
 * - Estado global compartilhado
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { temaInitialStates } from './states';
import { createTemaActions } from './actions';

export const useTemaStore = create(
  combine(
    temaInitialStates,
    createTemaActions,
  ),
);

/**
 * Inicializa o tema store (carrega temas se necessario)
 * Usado por: App.jsx ou outras inicializacoes globais
 */
export const initializeTemaStore = async (): Promise<void> => {
  const { temasCarregados, inicializar } = useTemaStore.getState();

  if (!temasCarregados) {
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum.
 * Nao sao hooks/componentes — sao wrappers de leitura; rule-of-hooks nao se
 * aplica (nome `useXSelectors` herdado da API .js anterior).
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const useTemaSelectors = {
  temas: () => useTemaStore((state) => state.temas),
  temasAtivos: () => useTemaStore((state) => state.temasAtivos),
  loading: () => useTemaStore((state) => state.loading),
  getTemaById: () => useTemaStore((state) => state.getTemaById),
  getTemaByNome: () => useTemaStore((state) => state.getTemaByNome),
  getNomesDeTemas: () => useTemaStore((state) => state.getNomesDeTemas),
  estadoCompleto: () => useTemaStore((state) => ({
    temas: state.temas,
    temasAtivos: state.temasAtivos,
    loading: state.loading,
    error: state.error,
    temasCarregados: state.temasCarregados,
  })),
};

export default useTemaStore;
