/**
 * CLASSE STORE - Gerenciamento de classes estaticas
 *
 * Store centralizado para todas as classes do sistema:
 * - Carregamento unico e cache
 * - Acesso otimizado por ID e nome
 * - Funcoes utilitarias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginacao da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { classeInitialStates } from './states';
import { createClasseActions } from './actions';

export const useClasseStore = create(
  combine(
    classeInitialStates,
    createClasseActions,
  ),
);

/**
 * Inicializa o classe store (carrega classes se necessario)
 * Usado por: App.jsx ou outras inicializacoes globais
 */
export const initializeClasseStore = async (): Promise<void> => {
  const { classesCarregadas, inicializar } = useClasseStore.getState();

  if (!classesCarregadas) {
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum.
 * Nao sao hooks/componentes — sao wrappers de leitura; rule-of-hooks nao se
 * aplica (nome `useXSelectors` herdado da API .js anterior).
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const useClasseSelectors = {
  classes: () => useClasseStore((state) => state.classes),
  loading: () => useClasseStore((state) => state.loading),
  getClasseById: () => useClasseStore((state) => state.getClasseById),
  getClasseByNome: () => useClasseStore((state) => state.getClasseByNome),
  getNomesDeClasses: () => useClasseStore((state) => state.getNomesDeClasses),
  estadoCompleto: () => useClasseStore((state) => ({
    classes: state.classes,
    loading: state.loading,
    error: state.error,
    classesCarregadas: state.classesCarregadas,
    total: state.total,
    hasMore: state.hasMore,
  })),
};

export default useClasseStore;
