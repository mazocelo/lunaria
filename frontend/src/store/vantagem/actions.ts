/**
 * VANTAGEM ACTIONS - Logicas e acoes das vantagens
 *
 * Contem todas as funcoes que modificam o estado das vantagens:
 * - Carregamento unico das vantagens (cache)
 * - Mapeamento por ID e nome
 * - Separacao entre vantagens e desvantagens
 * - Acesso otimizado aos dados
 * - Funcoes utilitarias para views e viewmodels
 * - Suporte a paginacao da API
 *
 * API REAL: /vantagens endpoint com paginacao (limit, offset)
 */
import { vantagemService } from '../../services/index';
import type { VantagemDesvantagem } from '../../types/api';
import type { VantagemState } from './states';

type VantagemLike = VantagemDesvantagem & { id: number; nome: string; custo?: number; descricao?: string };

export type VantagemActions = {
  carregarVantagens: (forceReload?: boolean) => Promise<VantagemDesvantagem[]>;
  processarVantagens: (vantagensData: VantagemDesvantagem[], total: number, offset: number, limit: number) => void;
  getVantagemById: (id: number | string) => VantagemDesvantagem | null;
  getVantagemByNome: (nome: string) => VantagemDesvantagem | null;
  getNomesDeVantagens: (ids: unknown) => string[];
  getIdsDeVantagens: (nomes: unknown) => number[];
  vantagemExists: (id: number | string) => boolean;
  mapearVantagensDePersonagem: (vantagensPersonagem: Array<Record<string, unknown>> | unknown) => Array<Record<string, unknown>>;
  getVantagensParaSelecao: () => Array<{ id: number; nome: string; custo: number | undefined; descricao: string | undefined }>;
  getDesvantagensParaSelecao: () => Array<{ id: number; nome: string; custo: number | undefined; descricao: string | undefined }>;
  getVantagensParaFiltro: () => Array<{ id: number; nome: string; tipo: 'vantagem' | 'desvantagem' | 'neutro' }>;
  inicializar: () => Promise<void>;
  recarregarVantagens: () => Promise<void>;
  resetVantagemState: () => void;
  carregarMaisVantagens: () => Promise<void>;
};

type SetState = (partial: Partial<VantagemState>) => void;
type GetState = () => VantagemState;

export const createVantagemActions = (set: SetState, getBase: GetState): VantagemActions => {
  const get = getBase as () => VantagemState & VantagemActions;
  return ({

    carregarVantagens: async (forceReload = false) => {
      const { vantagensCarregadas, loading } = get();

      if ((vantagensCarregadas || loading) && !forceReload) {
        return get().vantagens;
      }

      set({ loading: true, error: null });

      try {
        const response = await vantagemService.getAll();

        const vantagensData = response.data || [];
        const total = response.pagination?.total ?? vantagensData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarVantagens(vantagensData, total, offset, limit);

        return vantagensData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('VantagemStore: Erro ao carregar vantagens:', error);
        set({
          loading: false,
          error: message,
          vantagens: [],
          vantagensCarregadas: false,
        });
        throw error;
      }
    },

    processarVantagens: (vantagensData, total, offset, limit) => {
      const vantagensPorId = new Map<number, VantagemDesvantagem>();
      const vantagensPorNome = new Map<string, VantagemDesvantagem>();

      const vantagensPositivas: VantagemDesvantagem[] = [];
      const vantagensNegativas: VantagemDesvantagem[] = [];
      const vantagensNeutras: VantagemDesvantagem[] = [];

      vantagensData.forEach((vantagem) => {
        const v = vantagem as VantagemLike;
        vantagensPorId.set(v.id, vantagem);
        vantagensPorNome.set(v.nome.toLowerCase(), vantagem);

        const custo = v.custo ?? 0;
        if (custo > 0) {
          vantagensPositivas.push(vantagem);
        } else if (custo < 0) {
          vantagensNegativas.push(vantagem);
        } else {
          vantagensNeutras.push(vantagem);
        }
      });

      set({
        vantagens: vantagensData,
        vantagensPorId,
        vantagensPorNome,
        vantagensPositivas,
        vantagensNegativas,
        vantagensNeutras,
        totalVantagens: vantagensPositivas.length,
        totalDesvantagens: vantagensNegativas.length,
        vantagensCarregadas: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      });
    },

    getVantagemById: (id) => {
      const { vantagensPorId } = get();
      return vantagensPorId.get(parseInt(String(id), 10)) || null;
    },

    getVantagemByNome: (nome) => {
      const { vantagensPorNome } = get();
      return vantagensPorNome.get(nome.toLowerCase()) || null;
    },

    getNomesDeVantagens: (ids) => {
      if (!Array.isArray(ids)) return [];
      const { vantagensPorId } = get();
      return ids.map((id) => {
        const vantagem = vantagensPorId.get(parseInt(String(id), 10)) as VantagemLike | undefined;
        return vantagem ? vantagem.nome : `Vantagem ${id}`;
      });
    },

    getIdsDeVantagens: (nomes) => {
      if (!Array.isArray(nomes)) return [];
      const { vantagensPorNome } = get();
      return nomes
        .map((nome) => {
          if (typeof nome !== 'string') return null;
          const vantagem = vantagensPorNome.get(nome.toLowerCase()) as VantagemLike | undefined;
          return vantagem ? vantagem.id : null;
        })
        .filter((id): id is number => Boolean(id));
    },

    vantagemExists: (id) => {
      const { vantagensPorId } = get();
      return vantagensPorId.has(parseInt(String(id), 10));
    },

    mapearVantagensDePersonagem: (vantagensPersonagem) => {
      if (!Array.isArray(vantagensPersonagem)) return [];

      const { vantagensPorId } = get();
      return vantagensPersonagem.map((vantagemData) => {
        const vd = vantagemData as { id?: number | string; vantagem_id?: number | string };
        const vantagem = vantagensPorId.get(parseInt(String(vd.id ?? vd.vantagem_id), 10));
        return vantagem ? {
          ...vantagem,
          ...vantagemData,
        } as Record<string, unknown> : vantagemData as Record<string, unknown>;
      });
    },

    getVantagensParaSelecao: () => {
      const { vantagensPositivas } = get();
      return vantagensPositivas.map((vantagem) => {
        const v = vantagem as VantagemLike;
        return {
          id: v.id,
          nome: v.nome,
          custo: v.custo,
          descricao: v.descricao,
        };
      });
    },

    getDesvantagensParaSelecao: () => {
      const { vantagensNegativas } = get();
      return vantagensNegativas.map((desvantagem) => {
        const v = desvantagem as VantagemLike;
        return {
          id: v.id,
          nome: v.nome,
          custo: v.custo,
          descricao: v.descricao,
        };
      });
    },

    getVantagensParaFiltro: () => {
      const { vantagens } = get();
      return vantagens.map((vantagem) => {
        const v = vantagem as VantagemLike;
        const custo = v.custo ?? 0;
        return {
          id: v.id,
          nome: v.nome,
          tipo: custo > 0 ? 'vantagem' as const : custo < 0 ? 'desvantagem' as const : 'neutro' as const,
        };
      });
    },

    inicializar: async () => {
      const { vantagensCarregadas } = get();
      if (!vantagensCarregadas) {
        await get().carregarVantagens();
      }
    },

    recarregarVantagens: async () => {
      await get().carregarVantagens(true);
    },

    resetVantagemState: () => {
      set({
        vantagens: [],
        vantagensCarregadas: false,
        vantagensPorId: new Map(),
        vantagensPorNome: new Map(),
        vantagensPositivas: [],
        vantagensNegativas: [],
        vantagensNeutras: [],
        totalVantagens: 0,
        totalDesvantagens: 0,
        loading: false,
        error: null,
        lastLoadTime: null,
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
      });
    },

    carregarMaisVantagens: async () => {
      const { hasMore, loading, offset, limit } = get();

      if (!hasMore || loading) {
        return;
      }

      set({ loading: true });

      try {
        const response = await vantagemService.getAll({
          offset: offset + limit,
          limit,
        });

        const novasVantagens = response.data || [];
        const currentVantagens = get().vantagens;
        const todasVantagens = [...currentVantagens, ...novasVantagens];

        get().processarVantagens(
          todasVantagens,
          response.pagination?.total ?? todasVantagens.length,
          response.pagination?.offset ?? 0,
          response.pagination?.limit ?? 50,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('VantagemStore: Erro ao carregar mais vantagens:', error);
        set({ loading: false, error: message });
      }
    },
  });
};
