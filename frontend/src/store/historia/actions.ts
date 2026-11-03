import { historiaService } from '../../services/index';
import type { Historia } from '../../types/api';
import type { HistoriaState } from './states';

export type HistoriaActions = {
  carregarHistorias: (forceReload?: boolean) => Promise<Historia[]>;
  processarHistorias: (historiasData: Historia[], total: number, offset: number, limit: number) => void;
  getHistoriaById: (id: number | string) => Historia | null;
  recarregarHistorias: () => Promise<void>;
  resetHistoriaState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<HistoriaState>) => void;
type GetState = () => HistoriaState;

export const createHistoriaActions = (set: SetState, getBase: GetState): HistoriaActions => {
  const get = getBase as () => HistoriaState & HistoriaActions;
  return ({

    carregarHistorias: async (forceReload = false) => {
      const { historiasCarregadas, loading, _backoffUntil } = get();
      if ((historiasCarregadas || loading) && !forceReload) {
        return get().historias;
      }

      if (_backoffUntil && Date.now() < _backoffUntil) {
        return get().historias;
      }

      set({ loading: true, error: null });

      try {
        const response = await historiaService.getAll();
        const historiasData = (Array.isArray(response.data) ? response.data : []) as Historia[];
        const total = response.pagination?.total ?? historiasData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarHistorias(historiasData, total, offset, limit);
        return historiasData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const is429 = message.includes('429') || message.includes('Muitas tentativas');
        set({
          loading: false,
          error: message,
          historiasCarregadas: is429 ? get().historiasCarregadas : false,
          _backoffUntil: is429 ? Date.now() + 30000 : null,
        });
        if (!is429) throw error;
        return get().historias;
      }
    },

    processarHistorias: (historiasData, total, offset, limit) => {
      const historiasPorId = new Map<number, Historia>();

      historiasData.forEach((historia) => {
        historiasPorId.set((historia as { id: number }).id, historia);
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
        hasMore: offset + limit < total,
      });
    },

    getHistoriaById: (id) => {
      const { historiasPorId } = get();
      return historiasPorId.get(parseInt(String(id), 10)) || null;
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
};
