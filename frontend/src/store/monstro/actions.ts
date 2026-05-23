import { monstroService } from '../../services/index';
import type { Monstro } from '../../types/api';
import type { MonstroState } from './states';

export type MonstroActions = {
  carregarMonstros: (forceReload?: boolean) => Promise<Monstro[]>;
  processarMonstros: (monstrosData: Monstro[], total: number, offset: number, limit: number) => void;
  getMonstroById: (id: number | string) => Monstro | null;
  recarregarMonstros: () => Promise<void>;
  resetMonstroState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<MonstroState>) => void;
type GetState = () => MonstroState;

export const createMonstroActions = (set: SetState, getBase: GetState): MonstroActions => {
  const get = getBase as () => MonstroState & MonstroActions;
  return ({

    carregarMonstros: async (forceReload = false) => {
      const { monstrosCarregados, loading } = get();
      if ((monstrosCarregados || loading) && !forceReload) {
        return get().monstros;
      }

      set({ loading: true, error: null });

      try {
        const response = await monstroService.getAll({});
        const monstrosData = (Array.isArray(response.data) ? response.data : []) as Monstro[];
        const total = response.pagination?.total ?? monstrosData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarMonstros(monstrosData, total, offset, limit);
        return monstrosData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, monstros: [], monstrosCarregados: false });
        throw error;
      }
    },

    processarMonstros: (monstrosData, total, offset, limit) => {
      const monstrosPorId = new Map<number, Monstro>();

      monstrosData.forEach((m) => {
        monstrosPorId.set(m.id, m);
      });

      set({
        monstros: monstrosData,
        monstrosPorId,
        monstrosCarregados: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      });
    },

    getMonstroById: (id) => {
      const { monstrosPorId } = get();
      return monstrosPorId.get(parseInt(String(id), 10)) || null;
    },

    recarregarMonstros: async () => {
      await get().carregarMonstros(true);
    },

    resetMonstroState: () => {
      set({
        monstros: [],
        monstrosCarregados: false,
        monstrosPorId: new Map(),
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
      const { monstrosCarregados } = get();
      if (!monstrosCarregados) {
        await get().carregarMonstros();
      }
    },
  });
};
