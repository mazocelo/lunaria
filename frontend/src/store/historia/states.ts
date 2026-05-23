import type { Historia } from '../../types/api';

export type HistoriaState = {
  historias: Historia[];
  historiasCarregadas: boolean;
  historiasPorId: Map<number, Historia>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  _backoffUntil?: number | null;
};

export const historiaInitialStates: HistoriaState = {
  historias: [],
  historiasCarregadas: false,
  historiasPorId: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
};
