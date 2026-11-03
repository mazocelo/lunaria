/**
 * MESTRE STATES - Estados iniciais dos mestres
 */

export type MestreItem = {
  id: number;
  nome: string;
  deleted_at?: string | null;
  [key: string]: unknown;
};

export type MestreState = {
  mestres: MestreItem[];
  mestresCarregados: boolean;
  mestresPorId: Map<number, MestreItem>;
  mestresPorNome: Map<string, MestreItem>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  mestresAtivos: MestreItem[];
};

export const mestreInitialStates: MestreState = {
  mestres: [],
  mestresCarregados: false,
  mestresPorId: new Map(),
  mestresPorNome: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
  mestresAtivos: [],
};
