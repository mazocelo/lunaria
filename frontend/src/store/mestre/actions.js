import { mestreService } from '../../services/index.js';

export const createMestreActions = (set, get) => ({

  carregarMestres: async (forceReload = false) => {
    const { mestresCarregados, loading } = get();
    if ((mestresCarregados || loading) && !forceReload) {
      return get().mestres;
    }

    set({ loading: true, error: null });

    try {
      const { data } = await mestreService.getAll();
      const mestresData = Array.isArray(data) ? data : [];
      const total = data.total || mestresData.length;
      const offset = data.offset || 0;
      const limit = data.limit || 50;

      get().processarMestres(mestresData, total, offset, limit);
      return mestresData;
    } catch (error) {
      set({ loading: false, error: error.message, mestres: [], mestresCarregados: false });
      throw error;
    }
  },

  processarMestres: (mestresData, total, offset, limit) => {
    const mestresPorId = new Map();
    const mestresPorNome = new Map();
    const mestresAtivos = [];

    mestresData.forEach(mestre => {
      mestresPorId.set(mestre.id, mestre);
      mestresPorNome.set(mestre.nome.toLowerCase(), mestre);
      if (!mestre.deleted_at) {
        mestresAtivos.push(mestre);
      }
    });

    set({
      mestres: mestresData,
      mestresPorId,
      mestresPorNome,
      mestresAtivos,
      mestresCarregados: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });
  },

  getMestreById: (id) => {
    const { mestresPorId } = get();
    return mestresPorId.get(parseInt(id)) || null;
  },

  getMestreByNome: (nome) => {
    const { mestresPorNome } = get();
    return mestresPorNome.get(nome.toLowerCase()) || null;
  },

  recarregarMestres: async () => {
    await get().carregarMestres(true);
  },

  resetMestreState: () => {
    set({
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
    });
  },

  inicializar: async () => {
    const { mestresCarregados } = get();
    if (!mestresCarregados) {
      await get().carregarMestres();
    }
  },
});
