import { habilidadeService } from '../../services/index.js';

export const createHabilidadeActions = (set, get) => ({

  carregarHabilidades: async (params = {}, forceReload = false) => {
    const { loading } = get();
    if (loading && !forceReload) return get().habilidades;

    set({ loading: true, error: null });

    try {
      const response = await habilidadeService.getAll(params);
      const data = response.data || [];
      const total = response.total ?? data.length;

      const habilidadesPorId = new Map();
      data.forEach(h => habilidadesPorId.set(h.id, h));

      set({
        habilidades: data,
        habilidadesPorId,
        habilidadesCarregadas: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
        total,
        offset: response.offset ?? 0,
        limit: response.limit ?? 50,
        hasMore: response.hasMore ?? false,
      });

      return data;
    } catch (error) {
      console.error('HabilidadeStore: Erro ao carregar:', error);
      set({ loading: false, error: error.message, habilidades: [], habilidadesCarregadas: false });
      throw error;
    }
  },

  getHabilidadeById: (id) => {
    const { habilidadesPorId } = get();
    return habilidadesPorId.get(parseInt(id)) || null;
  },

  criarHabilidade: async (data) => {
    try {
      const response = await habilidadeService.create(data);
      await get().carregarHabilidades({}, true);
      return response;
    } catch (error) {
      throw error;
    }
  },

  atualizarHabilidade: async (id, data) => {
    try {
      const response = await habilidadeService.update(id, data);
      await get().carregarHabilidades({}, true);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deletarHabilidade: async (id) => {
    try {
      const response = await habilidadeService.delete(id);
      await get().carregarHabilidades({}, true);
      return response;
    } catch (error) {
      throw error;
    }
  },

  resetHabilidadeState: () => {
    set({
      habilidades: [],
      habilidadesCarregadas: false,
      habilidadesPorId: new Map(),
      loading: false,
      error: null,
      lastLoadTime: null,
      total: 0,
      offset: 0,
      limit: 50,
      hasMore: false,
    });
  },
});
