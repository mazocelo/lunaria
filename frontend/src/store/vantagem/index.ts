/**
 * VANTAGEM STORE - Gerenciamento de vantagens e desvantagens estaticas
 *
 * Store centralizado para todas as vantagens/desvantagens do sistema:
 * - Carregamento unico e cache
 * - Acesso otimizado por ID e nome
 * - Separacao entre vantagens (custo > 0) e desvantagens (custo < 0)
 * - Funcoes utilitarias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginacao da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { vantagemInitialStates } from './states';
import { createVantagemActions } from './actions';

export const useVantagemStore = create(
  combine(
    vantagemInitialStates,
    createVantagemActions,
  ),
);

/**
 * Inicializa o vantagem store (carrega vantagens se necessario)
 * Usado por: App.jsx ou outras inicializacoes globais
 */
export const initializeVantagemStore = async (): Promise<void> => {
  const { vantagensCarregadas, inicializar } = useVantagemStore.getState();

  if (!vantagensCarregadas) {
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum.
 * Nao sao hooks/componentes — sao wrappers de leitura; rule-of-hooks nao se
 * aplica (nome `useXSelectors` herdado da API .js anterior).
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const useVantagemSelectors = {
  vantagens: () => useVantagemStore((state) => state.vantagens),
  vantagensPositivas: () => useVantagemStore((state) => state.vantagensPositivas),
  desvantagens: () => useVantagemStore((state) => state.vantagensNegativas),
  loading: () => useVantagemStore((state) => state.loading),
  getVantagemById: () => useVantagemStore((state) => state.getVantagemById),
  getVantagemByNome: () => useVantagemStore((state) => state.getVantagemByNome),
  getNomesDeVantagens: () => useVantagemStore((state) => state.getNomesDeVantagens),
  estadoCompleto: () => useVantagemStore((state) => ({
    vantagens: state.vantagens,
    vantagensPositivas: state.vantagensPositivas,
    vantagensNegativas: state.vantagensNegativas,
    totalVantagens: state.totalVantagens,
    totalDesvantagens: state.totalDesvantagens,
    loading: state.loading,
    error: state.error,
    vantagensCarregadas: state.vantagensCarregadas,
    total: state.total,
    hasMore: state.hasMore,
  })),
};

export default useVantagemStore;
