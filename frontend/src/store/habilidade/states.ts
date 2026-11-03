import type { Habilidade } from '../../types/api';

export type HabilidadeState = {
  habilidades: Habilidade[];
  habilidadesCarregadas: boolean;
  habilidadesPorId: Map<number, Habilidade>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export const habilidadeInitialStates: HabilidadeState = {
  habilidades: [],
  habilidadesCarregadas: false,
  habilidadesPorId: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
};
