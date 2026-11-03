/**
 * DESVANTAGEM STATES - Estados iniciais das desvantagens
 *
 * Estados globais para desvantagens do sistema:
 * - Cache unico de todas as desvantagens
 * - Maps otimizados para acesso O(1)
 * - Estados de loading e erro
 * - Suporte a paginacao da API
 * - Foco exclusivo em desvantagens (custo < 0)
 */

import type { VantagemDesvantagem } from '../../types/api';

export type DesvantagemState = {
  desvantagens: VantagemDesvantagem[];
  desvantagensCarregadas: boolean;
  desvantagensPorId: Map<number, VantagemDesvantagem>;
  desvantagensPorNome: Map<string, VantagemDesvantagem>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  desvantagensAtivas: VantagemDesvantagem[];
  desvantagensPorNivel: Map<number, VantagemDesvantagem[]>;
  desvantagensPorTipo: Map<string, VantagemDesvantagem[]>;
  totalDesvantagens: number;
  nivelMaisComum: number | null;
  tipoMaisComum: string | null;
};

export const desvantagemInitialStates: DesvantagemState = {
  desvantagens: [],
  desvantagensCarregadas: false,
  desvantagensPorId: new Map(),
  desvantagensPorNome: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
  desvantagensAtivas: [],
  desvantagensPorNivel: new Map(),
  desvantagensPorTipo: new Map(),
  totalDesvantagens: 0,
  nivelMaisComum: null,
  tipoMaisComum: null,
};
