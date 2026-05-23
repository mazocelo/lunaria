import { habilidadeService } from '../../services/index';
import type { Habilidade } from '../../types/api';
import type { HabilidadeState } from './states';

export type HabilidadeActions = {
  carregarHabilidades: (params?: Record<string, unknown>, forceReload?: boolean) => Promise<Habilidade[]>;
  getHabilidadeById: (id: number | string) => Habilidade | null;
  criarHabilidade: (data: Record<string, unknown>) => Promise<Habilidade>;
  atualizarHabilidade: (id: number, data: Record<string, unknown>) => Promise<Habilidade>;
  deletarHabilidade: (id: number) => Promise<unknown>;
  resetHabilidadeState: () => void;
};

type SetState = (partial: Partial<HabilidadeState>) => void;
type GetState = () => HabilidadeState;

export const createHabilidadeActions = (set: SetState, getBase: GetState): HabilidadeActions => {
  const get = getBase as () => HabilidadeState & HabilidadeActions;
  return ({

    carregarHabilidades: async (params = {}, forceReload = false) => {
      const { loading } = get();
      if (loading && !forceReload) return get().habilidades;

      set({ loading: true, error: null });

      try {
        const response = await habilidadeService.getAll(params);
        const data = (response.data || []) as Habilidade[];
        const total = response.total ?? data.length;

        const habilidadesPorId = new Map<number, Habilidade>();
        data.forEach((h) => habilidadesPorId.set((h as { id: number }).id, h));

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
        const message = error instanceof Error ? error.message : String(error);
        console.error('HabilidadeStore: Erro ao carregar:', error);
        set({ loading: false, error: message, habilidades: [], habilidadesCarregadas: false });
        throw error;
      }
    },

    getHabilidadeById: (id) => {
      const { habilidadesPorId } = get();
      return habilidadesPorId.get(parseInt(String(id), 10)) || null;
    },

    criarHabilidade: async (data) => {
      const response = await habilidadeService.create(data);
      await get().carregarHabilidades({}, true);
      return response;
    },

    atualizarHabilidade: async (id, data) => {
      const response = await habilidadeService.update(id, data);
      await get().carregarHabilidades({}, true);
      return response;
    },

    deletarHabilidade: async (id) => {
      const response = await habilidadeService.delete(id);
      await get().carregarHabilidades({}, true);
      return response;
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
};
