import { itemTresDetService } from '../../services/index';
import type { ItemTresDet, ItemTresDetState } from './states';

export type ItemTresDetActions = {
  carregarItens: (forceReload?: boolean) => Promise<ItemTresDet[]>;
  processarItens: (itensData: ItemTresDet[]) => void;
  getItemById: (id: number | string) => ItemTresDet | null;
  recarregarItens: () => Promise<void>;
  resetItemTresDetState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<ItemTresDetState>) => void;
type GetState = () => ItemTresDetState;

export const createItemTresDetActions = (set: SetState, getBase: GetState): ItemTresDetActions => {
  const get = getBase as () => ItemTresDetState & ItemTresDetActions;
  return ({

    carregarItens: async (forceReload = false) => {
      const { itensCarregados, loading } = get();
      if ((itensCarregados || loading) && !forceReload) {
        return get().itens;
      }

      set({ loading: true, error: null });

      try {
        const response = await itemTresDetService.getAll() as { data?: unknown };
        const itensData = (Array.isArray(response.data) ? response.data : []) as ItemTresDet[];
        get().processarItens(itensData);
        return itensData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, itens: [], itensCarregados: false });
        throw error;
      }
    },

    processarItens: (itensData) => {
      const itensPorId = new Map<number, ItemTresDet>();
      itensData.forEach((item) => {
        itensPorId.set(item.id, item);
      });

      set({
        itens: itensData,
        itensPorId,
        itensCarregados: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
      });
    },

    getItemById: (id) => {
      const { itensPorId } = get();
      return itensPorId.get(parseInt(String(id), 10)) || null;
    },

    recarregarItens: async () => {
      await get().carregarItens(true);
    },

    resetItemTresDetState: () => {
      set({
        itens: [],
        itensCarregados: false,
        itensPorId: new Map(),
        loading: false,
        error: null,
        lastLoadTime: null,
      });
    },

    inicializar: async () => {
      const { itensCarregados } = get();
      if (!itensCarregados) {
        await get().carregarItens();
      }
    },
  });
};
