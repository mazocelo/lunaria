import { monstroService } from '../../services/index.js';

export const createMonstroActions = (set, get) => ({

  carregarMonstros: async (forceReload = false) => {
    const { monstrosCarregados, loading } = get();
    if ((monstrosCarregados || loading) && !forceReload) {
      return get().monstros;
    }

    set({ loading: true, error: null });

    try {
      const response = await monstroService.getAll({});
      const monstrosData = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.total ?? monstrosData.length;
      const offset = response.pagination?.offset ?? 0;
      const limit = response.pagination?.limit ?? 50;

      get().processarMonstros(monstrosData, total, offset, limit);
      return monstrosData;
    } catch (error) {
      set({ loading: false, error: error.message, monstros: [], monstrosCarregados: false });
      throw error;
    }
  },

  processarMonstros: (monstrosData, total, offset, limit) => {
    const monstrosPorId = new Map();

    monstrosData.forEach(m => {
      monstrosPorId.set(m.id, m);
    });

    set({
      monstros: monstrosData,
      monstrosPorId,
      monstrosCarregados: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });
  },

  getMonstroById: (id) => {
    const { monstrosPorId } = get();
    return monstrosPorId.get(parseInt(id)) || null;
  },

  recarregarMonstros: async () => {
    await get().carregarMonstros(true);
  },

  resetMonstroState: () => {
    set({
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
    });
  },

  inicializar: async () => {
    const { monstrosCarregados } = get();
    if (!monstrosCarregados) {
      await get().carregarMonstros();
    }
  },
});
