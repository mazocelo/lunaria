import { equipamentoService } from '../../services/index';
import type { Equipamento, EquipamentoState } from './states';

export type EquipamentoActions = {
  carregarEquipamentos: (forceReload?: boolean) => Promise<Equipamento[]>;
  processarEquipamentos: (equipamentosData: Equipamento[], total: number, offset: number, limit: number) => void;
  getEquipamentoById: (id: number | string) => Equipamento | null;
  recarregarEquipamentos: () => Promise<void>;
  resetEquipamentoState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<EquipamentoState>) => void;
type GetState = () => EquipamentoState;

export const createEquipamentoActions = (set: SetState, getBase: GetState): EquipamentoActions => {
  const get = getBase as () => EquipamentoState & EquipamentoActions;
  return ({

    carregarEquipamentos: async (forceReload = false) => {
      const { equipamentosCarregados, loading } = get();
      if ((equipamentosCarregados || loading) && !forceReload) {
        return get().equipamentos;
      }

      set({ loading: true, error: null });

      try {
        const response = await equipamentoService.getAll({});
        const equipamentosData = (Array.isArray(response.data) ? response.data : []) as Equipamento[];
        const total = response.pagination?.total ?? equipamentosData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarEquipamentos(equipamentosData, total, offset, limit);
        return equipamentosData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, equipamentos: [], equipamentosCarregados: false });
        throw error;
      }
    },

    processarEquipamentos: (equipamentosData, total, offset, limit) => {
      const equipamentosPorId = new Map<number, Equipamento>();

      equipamentosData.forEach((eq) => {
        equipamentosPorId.set((eq as { id: number }).id, eq);
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
        hasMore: offset + limit < total,
      });
    },

    getEquipamentoById: (id) => {
      const { equipamentosPorId } = get();
      return equipamentosPorId.get(parseInt(String(id), 10)) || null;
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
};
