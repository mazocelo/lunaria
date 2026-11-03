/**
 * VANTAGEM STATES - Estados iniciais das vantagens
 *
 * Estados globais para vantagens e desvantagens:
 * - Cache unico de todas as vantagens/desvantagens
 * - Maps otimizados para acesso O(1)
 * - Estados de loading e erro
 * - Suporte a paginacao da API
 * - Separacao entre vantagens (custo > 0) e desvantagens (custo < 0)
 */

import type { VantagemDesvantagem } from '../../types/api';

export type VantagemState = {
  vantagens: VantagemDesvantagem[];
  vantagensCarregadas: boolean;
  vantagensPorId: Map<number, VantagemDesvantagem>;
  vantagensPorNome: Map<string, VantagemDesvantagem>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  vantagensPositivas: VantagemDesvantagem[];
  vantagensNegativas: VantagemDesvantagem[];
  vantagensNeutras: VantagemDesvantagem[];
  totalVantagens: number;
  totalDesvantagens: number;
};

export const vantagemInitialStates: VantagemState = {
  vantagens: [],
  vantagensCarregadas: false,
  vantagensPorId: new Map(),
  vantagensPorNome: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
  vantagensPositivas: [],
  vantagensNegativas: [],
  vantagensNeutras: [],
  totalVantagens: 0,
  totalDesvantagens: 0,
};
