import { personagemService } from '../../services/index';
import { Personagem } from '../../models/Personagem';
import type { PersonagemState } from './states';

export type PersonagemActions = {
  carregarPersonagens: (forceReload?: boolean) => Promise<Personagem[]>;
  processarPersonagens: (personagensData: Personagem[], total: number, offset: number, limit: number) => void;
  getPersonagemById: (id: number | string) => Personagem | null;
  recarregarPersonagens: () => Promise<void>;
  resetPersonagemState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = (partial: Partial<PersonagemState>) => void;
type GetState = () => PersonagemState;

export const createPersonagemActions = (set: SetState, getBase: GetState): PersonagemActions => {
  const get = getBase as () => PersonagemState & PersonagemActions;
  return ({

    carregarPersonagens: async (forceReload = false) => {
      const { personagensCarregados, loading } = get();
      if ((personagensCarregados || loading) && !forceReload) {
        return get().personagens;
      }

      set({ loading: true, error: null });

      try {
        const response = await personagemService.getAll();
        const personagensData: Personagem[] = Array.isArray(response.data) ? response.data : [];
        const total = response.pagination?.total ?? personagensData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarPersonagens(personagensData, total, offset, limit);
        return personagensData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, personagens: [], personagensCarregados: false });
        throw error;
      }
    },

    processarPersonagens: (personagensData, total, offset, limit) => {
      const personagensPorId = new Map<number, Personagem>();

      personagensData.forEach((p) => {
        personagensPorId.set((p as { id: number }).id, p);
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
        hasMore: offset + limit < total,
      });
    },

    getPersonagemById: (id) => {
      const { personagensPorId } = get();
      return personagensPorId.get(parseInt(String(id), 10)) || null;
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
};
