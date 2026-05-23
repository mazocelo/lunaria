/**
 * CLASSE ACTIONS - Logicas e acoes das classes
 *
 * Contem todas as funcoes que modificam o estado das classes:
 * - Carregamento unico das classes (cache)
 * - Mapeamento por ID e nome
 * - Acesso otimizado aos dados
 * - Funcoes utilitarias para views e viewmodels
 * - Suporte a paginacao da API
 *
 * API REAL: /classes endpoint com paginacao (limit, offset)
 */
import { classeService } from '../../services/index';
import type { Classe } from '../../types/api';
import type { ClasseState } from './states';

export type ClasseActions = {
  carregarClasses: (forceReload?: boolean, sistema?: string | null) => Promise<Classe[]>;
  processarClasses: (classesData: Classe[] | null | undefined, total?: number, offset?: number, limit?: number) => void;
  getClasseById: (id: number | string) => Classe | null;
  getClasseByNome: (nome: string | null | undefined) => Classe | null;
  getNomesDeClasses: (ids: unknown) => string[];
  getIdsDeClasses: (nomes: unknown) => number[];
  classeExists: (idOrNome: number | string) => boolean;
  mapearClasseDePersonagem: (personagem: { classe_id?: number | null } | null | undefined) => Classe | null;
  inicializar: () => Promise<void>;
  recarregarClasses: () => Promise<Classe[]>;
  resetClasseState: () => Promise<void>;
  getClassesParaSelecao: () => Array<{ id: number; nome: string; descricao: string; nivel_inicial: number }>;
  getClassesParaFiltro: () => Array<{ id: number | null; nome: string }>;
  carregarMaisClasses: () => Promise<void>;
};

type SetState = (partial: Partial<ClasseState>) => void;
type GetState = () => ClasseState;

export const createClasseActions = (set: SetState, getBase: GetState): ClasseActions => {
  const get = getBase as () => ClasseState & ClasseActions;
  return ({

    carregarClasses: async (forceReload = false, sistema = null) => {
      const { classesCarregadas, loading, sistemaCarregado } = get();

      const sistemaDivergente = sistemaCarregado !== sistema;

      if ((classesCarregadas || loading) && !forceReload && !sistemaDivergente) {
        return get().classes;
      }

      set({ loading: true, error: null });

      try {
        const response = await classeService.getAll(sistema ? { sistema } : undefined);

        const classesData = response.data || [];
        const total = response.pagination?.total ?? classesData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarClasses(classesData, total, offset, limit);
        set({ sistemaCarregado: sistema });

        return classesData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('ClasseStore: Erro ao carregar classes:', error);
        set({
          error: message,
          loading: false,
        });
        throw error;
      }
    },

    processarClasses: (classesData, total = 0, offset = 0, limit = 50) => {
      const classesValidas: Classe[] = (classesData || []).filter(
        (classe): classe is Classe => !!classe && typeof classe.id === 'number',
      );

      const classesPorId: Record<number, Classe> = {};
      const classesPorNome: Record<string, Classe> = {};

      classesValidas.forEach((classe) => {
        classesPorId[classe.id] = classe;

        if (classe.nome) {
          const nomeNormalizado = classe.nome.toLowerCase().trim();
          classesPorNome[nomeNormalizado] = classe;
        }
      });

      const hasMore = (offset + classesValidas.length) < total;

      set({
        classes: classesValidas,
        classesPorId,
        classesPorNome,
        totalClasses: classesValidas.length,
        total,
        offset,
        limit,
        hasMore,
        classesCarregadas: true,
        loading: false,
        lastLoadTime: new Date().toISOString(),
      });
    },

    getClasseById: (id) => {
      const { classesPorId } = get();
      return classesPorId[id as number] || null;
    },

    getClasseByNome: (nome) => {
      const { classesPorNome } = get();
      if (!nome) return null;

      const nomeNormalizado = nome.toLowerCase().trim();
      return classesPorNome[nomeNormalizado] || null;
    },

    getNomesDeClasses: (ids) => {
      if (!Array.isArray(ids)) return [];

      const { classesPorId } = get();
      return ids
        .map((id) => classesPorId[id as number]?.nome)
        .filter((nome): nome is string => Boolean(nome));
    },

    getIdsDeClasses: (nomes) => {
      if (!Array.isArray(nomes)) return [];

      const { classesPorNome } = get();
      return nomes
        .map((nome) => {
          if (typeof nome !== 'string') return undefined;
          const nomeNormalizado = nome.toLowerCase().trim();
          return classesPorNome[nomeNormalizado]?.id;
        })
        .filter((id): id is number => id !== undefined);
    },

    classeExists: (idOrNome) => {
      const { classesPorId, classesPorNome } = get();

      if (typeof idOrNome === 'number' || !isNaN(Number(idOrNome))) {
        return !!classesPorId[idOrNome as number];
      }

      const nomeNormalizado = String(idOrNome).toLowerCase().trim();
      return !!classesPorNome[nomeNormalizado];
    },

    mapearClasseDePersonagem: (personagem) => {
      if (!personagem || !personagem.classe_id) return null;

      const { classesPorId } = get();
      return classesPorId[personagem.classe_id] || null;
    },

    inicializar: async () => {
      const { classesCarregadas } = get();

      if (!classesCarregadas) {
        await get().carregarClasses();
      }
    },

    recarregarClasses: async () => {
      return await get().carregarClasses(true);
    },

    resetClasseState: async () => {
      const { default: states } = await import('./states');
      set(states);
    },

    getClassesParaSelecao: () => {
      const { classes } = get();
      return classes.map((classe) => ({
        id: classe.id,
        nome: classe.nome,
        descricao: (classe as { descricao?: string }).descricao || '',
        nivel_inicial: (classe as { nivel_inicial?: number }).nivel_inicial || 1,
      }));
    },

    getClassesParaFiltro: () => {
      const { classes } = get();
      return [
        { id: null, nome: 'Todas as classes' },
        ...classes.map((classe) => ({
          id: classe.id,
          nome: classe.nome,
        })),
      ];
    },

    carregarMaisClasses: async () => {
      const { hasMore, offset, limit, loading } = get();

      if (!hasMore || loading) {
        return;
      }

      set({ loading: true });

      try {
        const { classeService: classeServiceDyn } = await import('../../services/index');

        const response = await classeServiceDyn.getAll({
          limit,
          offset: offset + limit,
        });

        const novasClasses = response.data || [];
        const todasClasses = [...get().classes, ...novasClasses];

        get().processarClasses(
          todasClasses,
          response.pagination?.total ?? todasClasses.length,
          response.pagination?.offset ?? (offset + limit),
          response.pagination?.limit ?? limit,
        );

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('ClasseStore: Erro ao carregar mais classes:', error);
        set({
          error: message,
          loading: false,
        });
        throw error;
      }
    },
  });
};
