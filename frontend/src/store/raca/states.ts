/**
 * RACA STATES - Estados iniciais das racas
 *
 * Contem todos os estados iniciais das racas (dados estaticos):
 * - Lista de racas carregadas do backend
 * - Status de carregamento
 * - Cache de racas por ID e nome
 * - Controle de inicializacao e paginacao
 */

import type { Raca } from '../../types/api';

export type RacaState = {
  racas: Raca[];
  racasCarregadas: boolean;
  racasPorId: Record<number, Raca>;
  racasPorNome: Record<string, Raca>;
  loading: boolean;
  error: string | null;
  lastLoadTime: string | null;
  sistemaCarregado: string | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  totalRacas: number;
};

export const racaInitialStates: RacaState = {
  racas: [],
  racasCarregadas: false,
  racasPorId: {},
  racasPorNome: {},
  loading: false,
  error: null,
  lastLoadTime: null,
  sistemaCarregado: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
  totalRacas: 0,
};

export default racaInitialStates;
