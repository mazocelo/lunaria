import { amizadeService } from '../../services/index';
import type { Amigo, AmizadeState, Pendente, Sugestao } from './states';

type ServiceResponse = { data?: unknown };

export type AmizadeActions = {
  carregarAmigos: (forceReload?: boolean) => Promise<Amigo[]>;
  carregarPendentes: (forceReload?: boolean) => Promise<Pendente[]>;
  carregarSugestoes: (forceReload?: boolean) => Promise<Sugestao[]>;
  recarregarAmigos: () => Promise<void>;
  recarregarPendentes: () => Promise<void>;
  recarregarSugestoes: () => Promise<void>;
  removerAmigoDaLista: (amizadeId: number | string) => void;
  removerPendenteDaLista: (amizadeId: number | string) => void;
  resetAmizadeState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<AmizadeState>) => void;
type GetState = () => AmizadeState;

export const createAmizadeActions = (set: SetState, getBase: GetState): AmizadeActions => {
  const get = getBase as () => AmizadeState & AmizadeActions;
  return ({

    carregarAmigos: async (forceReload = false) => {
      const { amigosCarregados, loading } = get();
      if ((amigosCarregados || loading) && !forceReload) {
        return get().amigos;
      }

      set({ loading: true, error: null });

      try {
        const response = (await amizadeService.fetchFriends()) as ServiceResponse;
        const amigosData = (Array.isArray(response.data) ? response.data : []) as Amigo[];

        set({
          amigos: amigosData,
          amigosCarregados: true,
          loading: false,
          error: null,
          lastLoadTime: Date.now(),
        });
        return amigosData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, amigos: [], amigosCarregados: false });
        throw error;
      }
    },

    carregarPendentes: async (forceReload = false) => {
      const { pendentesCarregados } = get();
      if (pendentesCarregados && !forceReload) {
        return get().pendentes;
      }

      try {
        const response = (await amizadeService.fetchPending()) as ServiceResponse;
        const pendentesData = (Array.isArray(response.data) ? response.data : []) as Pendente[];

        set({
          pendentes: pendentesData,
          pendentesCarregados: true,
        });
        return pendentesData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, pendentes: [], pendentesCarregados: false });
        throw error;
      }
    },

    carregarSugestoes: async (forceReload = false) => {
      const { sugestoesCarregadas } = get();
      if (sugestoesCarregadas && !forceReload) {
        return get().sugestoes;
      }

      try {
        const response = (await amizadeService.fetchSuggestions()) as ServiceResponse;
        const sugestoesData = (Array.isArray(response.data) ? response.data : []) as Sugestao[];

        set({
          sugestoes: sugestoesData,
          sugestoesCarregadas: true,
        });
        return sugestoesData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, sugestoes: [], sugestoesCarregadas: false });
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
      set({ amigos: get().amigos.filter((f) => f.amizadeId !== amizadeId) });
    },

    removerPendenteDaLista: (amizadeId) => {
      set({ pendentes: get().pendentes.filter((p) => p.id !== amizadeId) });
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
};
