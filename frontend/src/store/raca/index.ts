/**
 * RACA STORE - Gerenciamento de racas estaticas
 *
 * Store centralizado para todas as racas do sistema:
 * - Carregamento unico e cache
 * - Acesso otimizado por ID e nome
 * - Funcoes utilitarias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginacao da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { racaInitialStates } from './states';
import { createRacaActions } from './actions';

export const useRacaStore = create(
  combine(
    racaInitialStates,
    createRacaActions,
  ),
);

/**
 * Inicializa o raca store (carrega racas se necessario)
 * Usado por: App.jsx ou outras inicializacoes globais
 */
export const initializeRacaStore = async (): Promise<void> => {
  const { racasCarregadas, inicializar } = useRacaStore.getState();

  if (!racasCarregadas) {
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum.
 * Nao sao hooks/componentes — sao wrappers de leitura; rule-of-hooks nao se
 * aplica (nome `useXSelectors` herdado da API .js anterior).
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const useRacaSelectors = {
  racas: () => useRacaStore((state) => state.racas),
  loading: () => useRacaStore((state) => state.loading),
  getRacaById: () => useRacaStore((state) => state.getRacaById),
  getRacaByNome: () => useRacaStore((state) => state.getRacaByNome),
  getNomesDeRacas: () => useRacaStore((state) => state.getNomesDeRacas),
  estadoCompleto: () => useRacaStore((state) => ({
    racas: state.racas,
    loading: state.loading,
    error: state.error,
    racasCarregadas: state.racasCarregadas,
    total: state.total,
    hasMore: state.hasMore,
  })),
};

export default useRacaStore;
