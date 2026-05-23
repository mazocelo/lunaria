/**
 * DESVANTAGEM STORE - Gerenciamento de desvantagens estaticas
 *
 * Store centralizado para todas as desvantagens do sistema:
 * - Carregamento unico e cache
 * - Acesso otimizado por ID e nome
 * - Organizacao por nivel e tipo
 * - Estatisticas avancadas
 * - Funcoes utilitarias para ViewModels
 * - Estado global compartilhado
 * - Suporte a paginacao da API
 */

import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { desvantagemInitialStates } from './states';
import { createDesvantagemActions } from './actions';

export const useDesvantagemStore = create(
  combine(
    desvantagemInitialStates,
    createDesvantagemActions,
  ),
);

/**
 * Inicializa o desvantagem store (carrega desvantagens se necessario)
 * Usado por: App.jsx ou outras inicializacoes globais
 */
export const initializeDesvantagemStore = async (): Promise<void> => {
  const { desvantagensCarregadas, inicializar } = useDesvantagemStore.getState();

  if (!desvantagensCarregadas) {
    await inicializar();
  }
};

/**
 * Selectors customizados para uso comum.
 * Nao sao hooks/componentes — sao wrappers de leitura; rule-of-hooks nao se
 * aplica (nome `useXSelectors` herdado da API .js anterior).
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const useDesvantagemSelectors = {
  desvantagens: () => useDesvantagemStore((state) => state.desvantagens),
  desvantagensAtivas: () => useDesvantagemStore((state) => state.desvantagensAtivas),
  loading: () => useDesvantagemStore((state) => state.loading),
  getDesvantagemById: () => useDesvantagemStore((state) => state.getDesvantagemById),
  getDesvantagemByNome: () => useDesvantagemStore((state) => state.getDesvantagemByNome),
  getDesvantagensPorNivel: () => useDesvantagemStore((state) => state.getDesvantagensPorNivel),
  getDesvantagensPorTipo: () => useDesvantagemStore((state) => state.getDesvantagensPorTipo),
  getNomesDeDesvantagens: () => useDesvantagemStore((state) => state.getNomesDeDesvantagens),
  getEstatisticasDesvantagens: () => useDesvantagemStore((state) => state.getEstatisticasDesvantagens),
  estadoCompleto: () => useDesvantagemStore((state) => ({
    desvantagens: state.desvantagens,
    desvantagensAtivas: state.desvantagensAtivas,
    totalDesvantagens: state.totalDesvantagens,
    nivelMaisComum: state.nivelMaisComum,
    tipoMaisComum: state.tipoMaisComum,
    loading: state.loading,
    error: state.error,
    desvantagensCarregadas: state.desvantagensCarregadas,
    total: state.total,
    hasMore: state.hasMore,
  })),
};

export default useDesvantagemStore;
