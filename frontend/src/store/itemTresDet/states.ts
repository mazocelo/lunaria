export type ItemTresDet = {
  id: number;
  [key: string]: unknown;
};

export type ItemTresDetState = {
  itens: ItemTresDet[];
  itensCarregados: boolean;
  itensPorId: Map<number, ItemTresDet>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
};

export const itemTresDetInitialStates: ItemTresDetState = {
  itens: [],
  itensCarregados: false,
  itensPorId: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
};
