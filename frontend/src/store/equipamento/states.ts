import type { VantagemDesvantagem } from '../../types/api';

// EquipamentoService usa VantagemDesvantagem como shape (mesma estrutura).
export type Equipamento = VantagemDesvantagem;

export type EquipamentoState = {
  equipamentos: Equipamento[];
  equipamentosCarregados: boolean;
  equipamentosPorId: Map<number, Equipamento>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export const equipamentoInitialStates: EquipamentoState = {
  equipamentos: [],
  equipamentosCarregados: false,
  equipamentosPorId: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
};
