import { historiaService } from '../../services/index.js';

export const createHistoriaActions = (set, get) => ({

  carregarHistorias: async (forceReload = false) => {
    const { historiasCarregadas, loading, _backoffUntil } = get();
    if ((historiasCarregadas || loading) && !forceReload) {
      return get().historias;
    }

    // Backoff: se recebeu 429 recentemente, retornar dados em cache
    if (_backoffUntil && Date.now() < _backoffUntil) {
      return get().historias;
    }

    set({ loading: true, error: null });

    try {
      const response = await historiaService.getAll();
      const historiasData = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.total ?? historiasData.length;
      const offset = response.pagination?.offset ?? 0;
      const limit = response.pagination?.limit ?? 50;

      get().processarHistorias(historiasData, total, offset, limit);
      return historiasData;
    } catch (error) {
      const is429 = error.message?.includes('429') || error.message?.includes('Muitas tentativas');
      set({
        loading: false,
        error: error.message,
        historiasCarregadas: is429 ? get().historiasCarregadas : false,
        _backoffUntil: is429 ? Date.now() + 30000 : null
      });
      if (!is429) throw error;
      return get().historias;
    }
  },

  processarHistorias: (historiasData, total, offset, limit) => {
    const historiasPorId = new Map();

    historiasData.forEach(historia => {
      historiasPorId.set(historia.id, historia);
    });

    set({
      historias: historiasData,
      historiasPorId,
      historiasCarregadas: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });
  },

  getHistoriaById: (id) => {
    const { historiasPorId } = get();
    return historiasPorId.get(parseInt(id)) || null;
  },

  recarregarHistorias: async () => {
    await get().carregarHistorias(true);
  },

  resetHistoriaState: () => {
    set({
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
    });
  },

  inicializar: async () => {
    const { historiasCarregadas } = get();
    if (!historiasCarregadas) {
      await get().carregarHistorias();
    }
  },
});
