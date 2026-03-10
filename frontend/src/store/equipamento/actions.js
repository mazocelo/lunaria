import { equipamentoService } from '../../services/index.js';

export const createEquipamentoActions = (set, get) => ({

  carregarEquipamentos: async (forceReload = false) => {
    const { equipamentosCarregados, loading } = get();
    if ((equipamentosCarregados || loading) && !forceReload) {
      return get().equipamentos;
    }

    set({ loading: true, error: null });

    try {
      const response = await equipamentoService.getAll({});
      const equipamentosData = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.total ?? equipamentosData.length;
      const offset = response.pagination?.offset ?? 0;
      const limit = response.pagination?.limit ?? 50;

      get().processarEquipamentos(equipamentosData, total, offset, limit);
      return equipamentosData;
    } catch (error) {
      set({ loading: false, error: error.message, equipamentos: [], equipamentosCarregados: false });
      throw error;
    }
  },

  processarEquipamentos: (equipamentosData, total, offset, limit) => {
    const equipamentosPorId = new Map();

    equipamentosData.forEach(eq => {
      equipamentosPorId.set(eq.id, eq);
    });

    set({
      equipamentos: equipamentosData,
      equipamentosPorId,
      equipamentosCarregados: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });
  },

  getEquipamentoById: (id) => {
    const { equipamentosPorId } = get();
    return equipamentosPorId.get(parseInt(id)) || null;
  },

  recarregarEquipamentos: async () => {
    await get().carregarEquipamentos(true);
  },

  resetEquipamentoState: () => {
    set({
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
    });
  },

  inicializar: async () => {
    const { equipamentosCarregados } = get();
    if (!equipamentosCarregados) {
      await get().carregarEquipamentos();
    }
  },
});
