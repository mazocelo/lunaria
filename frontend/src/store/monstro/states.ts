import type { Monstro } from '../../types/api';

export type MonstroState = {
  monstros: Monstro[];
  monstrosCarregados: boolean;
  monstrosPorId: Map<number, Monstro>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export const monstroInitialStates: MonstroState = {
  monstros: [],
  monstrosCarregados: false,
  monstrosPorId: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
};
