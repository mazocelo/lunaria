import { amizadeService } from '../../services/index.js';

export const createAmizadeActions = (set, get) => ({

  carregarAmigos: async (forceReload = false) => {
    const { amigosCarregados, loading } = get();
    if ((amigosCarregados || loading) && !forceReload) {
      return get().amigos;
    }

    set({ loading: true, error: null });

    try {
      const response = await amizadeService.fetchFriends();
      const amigosData = Array.isArray(response.data) ? response.data : [];

      set({
        amigos: amigosData,
        amigosCarregados: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
      });
      return amigosData;
    } catch (error) {
      set({ loading: false, error: error.message, amigos: [], amigosCarregados: false });
      throw error;
    }
  },

  carregarPendentes: async (forceReload = false) => {
    const { pendentesCarregados } = get();
    if (pendentesCarregados && !forceReload) {
      return get().pendentes;
    }

    try {
      const response = await amizadeService.fetchPending();
      const pendentesData = Array.isArray(response.data) ? response.data : [];

      set({
        pendentes: pendentesData,
        pendentesCarregados: true,
      });
      return pendentesData;
    } catch (error) {
      set({ error: error.message, pendentes: [], pendentesCarregados: false });
      throw error;
    }
  },

  carregarSugestoes: async (forceReload = false) => {
    const { sugestoesCarregadas } = get();
    if (sugestoesCarregadas && !forceReload) {
      return get().sugestoes;
    }

    try {
      const response = await amizadeService.fetchSuggestions();
      const sugestoesData = Array.isArray(response.data) ? response.data : [];

      set({
        sugestoes: sugestoesData,
        sugestoesCarregadas: true,
      });
      return sugestoesData;
    } catch (error) {
      set({ error: error.message, sugestoes: [], sugestoesCarregadas: false });
      throw error;
    }
  },

  recarregarAmigos: async () => {
    await get().carregarAmigos(true);
  },

  recarregarPendentes: async () => {
    await get().carregarPendentes(true);
  },

  recarregarSugestoes: async () => {
    await get().carregarSugestoes(true);
  },

  removerAmigoDaLista: (amizadeId) => {
    set({ amigos: get().amigos.filter(f => f.amizadeId !== amizadeId) });
  },

  removerPendenteDaLista: (amizadeId) => {
    set({ pendentes: get().pendentes.filter(p => p.id !== amizadeId) });
  },

  resetAmizadeState: () => {
    set({
      amigos: [],
      pendentes: [],
      sugestoes: [],
      amigosCarregados: false,
      pendentesCarregados: false,
      sugestoesCarregadas: false,
      loading: false,
      error: null,
      lastLoadTime: null,
    });
  },

  inicializar: async () => {
    const { amigosCarregados } = get();
    if (!amigosCarregados) {
      await get().carregarAmigos();
    }
  },
});
