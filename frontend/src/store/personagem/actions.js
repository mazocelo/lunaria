import { personagemService } from '../../services/index.js';

export const createPersonagemActions = (set, get) => ({

  carregarPersonagens: async (forceReload = false) => {
    const { personagensCarregados, loading } = get();
    if ((personagensCarregados || loading) && !forceReload) {
      return get().personagens;
    }

    set({ loading: true, error: null });

    try {
      const response = await personagemService.getAll();
      const personagensData = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.total ?? personagensData.length;
      const offset = response.pagination?.offset ?? 0;
      const limit = response.pagination?.limit ?? 50;

      get().processarPersonagens(personagensData, total, offset, limit);
      return personagensData;
    } catch (error) {
      set({ loading: false, error: error.message, personagens: [], personagensCarregados: false });
      throw error;
    }
  },

  processarPersonagens: (personagensData, total, offset, limit) => {
    const personagensPorId = new Map();

    personagensData.forEach(p => {
      personagensPorId.set(p.id, p);
    });

    set({
      personagens: personagensData,
      personagensPorId,
      personagensCarregados: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });
  },

  getPersonagemById: (id) => {
    const { personagensPorId } = get();
    return personagensPorId.get(parseInt(id)) || null;
  },

  recarregarPersonagens: async () => {
    await get().carregarPersonagens(true);
  },

  resetPersonagemState: () => {
    set({
      personagens: [],
      personagensCarregados: false,
      personagensPorId: new Map(),
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
    const { personagensCarregados } = get();
    if (!personagensCarregados) {
      await get().carregarPersonagens();
    }
  },
});
