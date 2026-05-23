import type { MagiaTresdet } from '../../types/api';

export type MagiasTresDetState = {
  magias: MagiaTresdet[];
  magiasCarregadas: boolean;
  magiasPorId: Map<number, MagiaTresdet>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
};

export const magiasTresDetInitialStates: MagiasTresDetState = {
  magias: [],
  magiasCarregadas: false,
  magiasPorId: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
};
