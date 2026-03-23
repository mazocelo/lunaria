import { itemTresDetService } from '../../services/index.js';

export const createItemTresDetActions = (set, get) => ({

  carregarItens: async (forceReload = false) => {
    const { itensCarregados, loading } = get();
    if ((itensCarregados || loading) && !forceReload) {
      return get().itens;
    }

    set({ loading: true, error: null });

    try {
      const response = await itemTresDetService.getAll();
      const itensData = Array.isArray(response.data) ? response.data : [];
      get().processarItens(itensData);
      return itensData;
    } catch (error) {
      set({ loading: false, error: error.message, itens: [], itensCarregados: false });
      throw error;
    }
  },

  processarItens: (itensData) => {
    const itensPorId = new Map();
    itensData.forEach(item => {
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
    return itensPorId.get(parseInt(id)) || null;
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
