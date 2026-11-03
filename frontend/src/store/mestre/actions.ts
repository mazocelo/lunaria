import { mestreService } from '../../services/index';
import type { MestreItem, MestreState } from './states';

type ServiceResponse = {
  data?: unknown;
  pagination?: { total?: number; offset?: number; limit?: number } | null;
};

export type MestreActions = {
  carregarMestres: (forceReload?: boolean) => Promise<MestreItem[]>;
  processarMestres: (mestresData: MestreItem[], total: number, offset: number, limit: number) => void;
  getMestreById: (id: number | string) => MestreItem | null;
  getMestreByNome: (nome: string) => MestreItem | null;
  recarregarMestres: () => Promise<void>;
  resetMestreState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<MestreState>) => void;
type GetState = () => MestreState;

export const createMestreActions = (set: SetState, getBase: GetState): MestreActions => {
  const get = getBase as () => MestreState & MestreActions;
  return ({

    carregarMestres: async (forceReload = false) => {
      const { mestresCarregados, loading } = get();
      if ((mestresCarregados || loading) && !forceReload) {
        return get().mestres;
      }

      set({ loading: true, error: null });

      try {
        const response = (await mestreService.getAll()) as ServiceResponse;
        const mestresData = (Array.isArray(response.data) ? response.data : []) as MestreItem[];
        const total = response.pagination?.total ?? mestresData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarMestres(mestresData, total, offset, limit);
        return mestresData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, mestres: [], mestresCarregados: false });
        throw error;
      }
    },

    processarMestres: (mestresData, total, offset, limit) => {
      const mestresPorId = new Map<number, MestreItem>();
      const mestresPorNome = new Map<string, MestreItem>();
      const mestresAtivos: MestreItem[] = [];

      mestresData.forEach((mestre) => {
        mestresPorId.set(mestre.id, mestre);
        mestresPorNome.set(mestre.nome.toLowerCase(), mestre);
        if (!mestre.deleted_at) {
          mestresAtivos.push(mestre);
        }
      });

      set({
        mestres: mestresData,
        mestresPorId,
        mestresPorNome,
        mestresAtivos,
        mestresCarregados: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      });
    },

    getMestreById: (id) => {
      const { mestresPorId } = get();
      return mestresPorId.get(parseInt(String(id), 10)) || null;
    },

    getMestreByNome: (nome) => {
      const { mestresPorNome } = get();
      return mestresPorNome.get(nome.toLowerCase()) || null;
    },

    recarregarMestres: async () => {
      await get().carregarMestres(true);
    },

    resetMestreState: () => {
      set({
        mestres: [],
        mestresCarregados: false,
        mestresPorId: new Map(),
        mestresPorNome: new Map(),
        loading: false,
        error: null,
        lastLoadTime: null,
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
        mestresAtivos: [],
      });
    },

    inicializar: async () => {
      const { mestresCarregados } = get();
      if (!mestresCarregados) {
        await get().carregarMestres();
      }
    },
  });
};
