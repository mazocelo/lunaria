import { magiasTresDetService } from '../../services/index.js';

export const createMagiasTresDetActions = (set, get) => ({

  carregarMagias: async (params = {}, forceReload = false) => {
    const { magiasCarregadas, loading } = get();
    if ((magiasCarregadas || loading) && !forceReload) return get().magias;

    set({ loading: true, error: null });

    try {
      const response = await magiasTresDetService.getAll(params);
      const data = response.data || [];

      const magiasPorId = new Map();
      data.forEach(m => magiasPorId.set(m.id, m));

      set({
        magias: data,
        magiasPorId,
        magiasCarregadas: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
        total: data.length,
      });

      return data;
    } catch (error) {
      set({ loading: false, error: error.message, magias: [], magiasCarregadas: false });
      throw error;
    }
  },

  getMagiaById: (id) => {
    const { magiasPorId } = get();
    return magiasPorId.get(parseInt(id)) || null;
  },

  recarregarMagias: async () => {
    await get().carregarMagias({}, true);
  },

  resetMagiasState: () => {
    set({
      magias: [],
      magiasCarregadas: false,
      magiasPorId: new Map(),
      loading: false,
      error: null,
      lastLoadTime: null,
      total: 0,
    });
  },
});
