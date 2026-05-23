import { magiasTresDetService } from '../../services/index';
import type { MagiaTresdet } from '../../types/api';
import type { MagiasTresDetState } from './states';

export type MagiasTresDetActions = {
  carregarMagias: (params?: Record<string, unknown>, forceReload?: boolean) => Promise<MagiaTresdet[]>;
  getMagiaById: (id: number | string) => MagiaTresdet | null;
  recarregarMagias: () => Promise<void>;
  resetMagiasState: () => void;
};

type SetState = (partial: Partial<MagiasTresDetState>) => void;
type GetState = () => MagiasTresDetState;

export const createMagiasTresDetActions = (set: SetState, getBase: GetState): MagiasTresDetActions => {
  const get = getBase as () => MagiasTresDetState & MagiasTresDetActions;
  return ({

    carregarMagias: async (params = {}, forceReload = false) => {
      const { magiasCarregadas, loading } = get();
      if ((magiasCarregadas || loading) && !forceReload) return get().magias;

      set({ loading: true, error: null });

      try {
        const response = await magiasTresDetService.getAll(params);
        const data = (response.data || []) as MagiaTresdet[];

        const magiasPorId = new Map<number, MagiaTresdet>();
        data.forEach((m) => magiasPorId.set((m as { id: number }).id, m));

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
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, magias: [], magiasCarregadas: false });
        throw error;
      }
    },

    getMagiaById: (id) => {
      const { magiasPorId } = get();
      return magiasPorId.get(parseInt(String(id), 10)) || null;
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
};
