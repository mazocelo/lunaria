/**
 * DESVANTAGEM ACTIONS - Logicas e acoes das desvantagens
 *
 * Contem todas as funcoes que modificam o estado das desvantagens:
 * - Carregamento unico das desvantagens (cache)
 * - Mapeamento por ID e nome
 * - Organizacao por nivel e tipo
 * - Acesso otimizado aos dados
 * - Funcoes utilitarias para views e viewmodels
 * - Suporte a paginacao da API
 *
 * API REAL: /desvantagens endpoint com paginacao (limit, offset)
 */
import { desvantagemService } from '../../services/index';
import type { VantagemDesvantagem } from '../../types/api';
import type { DesvantagemState } from './states';

type DesvantagemLike = VantagemDesvantagem & {
  id: number;
  nome: string;
  custo?: number;
  descricao?: string;
  nivel?: number;
  tipo?: string[] | string;
};

export type DesvantagemActions = {
  carregarDesvantagens: (forceReload?: boolean) => Promise<VantagemDesvantagem[]>;
  processarDesvantagens: (desvantagensData: VantagemDesvantagem[], total: number, offset: number, limit: number) => void;
  getDesvantagemById: (id: number | string) => VantagemDesvantagem | null;
  getDesvantagemByNome: (nome: string) => VantagemDesvantagem | null;
  getDesvantagensPorNivel: (nivel: number | string) => VantagemDesvantagem[];
  getDesvantagensPorTipo: (tipo: string) => VantagemDesvantagem[];
  getNomesDeDesvantagens: (ids: unknown) => string[];
  getIdsDeDesvantagens: (nomes: unknown) => number[];
  desvantagemExists: (id: number | string) => boolean;
  mapearDesvantagensDePersonagem: (desvantagensPersonagem: unknown) => Array<Record<string, unknown>>;
  getDesvantagensParaSelecao: () => Array<{
    id: number;
    nome: string;
    custo: number | undefined;
    descricao: string | undefined;
    nivel: number | undefined;
    tipo: string[] | string | undefined;
  }>;
  getDesvantagensParaFiltro: () => Array<{
    id: number;
    nome: string;
    nivel: number | undefined;
    tipo: string[] | string | undefined;
    custo: number | undefined;
  }>;
  getEstatisticasDesvantagens: () => {
    total: number;
    nivelMaisComum: number | null;
    tipoMaisComum: string | null;
    niveis: number[];
    tipos: string[];
    desvantagensPorNivel: Record<number, VantagemDesvantagem[]>;
    desvantagensPorTipo: Record<string, VantagemDesvantagem[]>;
  };
  inicializar: () => Promise<void>;
  recarregarDesvantagens: () => Promise<void>;
  resetDesvantagemState: () => void;
  carregarMaisDesvantagens: () => Promise<void>;
};

type SetState = (partial: Partial<DesvantagemState>) => void;
type GetState = () => DesvantagemState;

export const createDesvantagemActions = (set: SetState, getBase: GetState): DesvantagemActions => {
  const get = getBase as () => DesvantagemState & DesvantagemActions;
  return ({

    carregarDesvantagens: async (forceReload = false) => {
      const { desvantagensCarregadas, loading } = get();

      if ((desvantagensCarregadas || loading) && !forceReload) {
        return get().desvantagens;
      }

      set({ loading: true, error: null });

      try {
        const response = await desvantagemService.getAll();

        const desvantagensData = response.data || [];
        const total = response.pagination?.total ?? desvantagensData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarDesvantagens(desvantagensData, total, offset, limit);

        return desvantagensData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('DesvantagemStore: Erro ao carregar desvantagens:', error);
        set({
          loading: false,
          error: message,
          desvantagens: [],
          desvantagensCarregadas: false,
        });
        throw error;
      }
    },

    processarDesvantagens: (desvantagensData, total, offset, limit) => {
      const desvantagensPorId = new Map<number, VantagemDesvantagem>();
      const desvantagensPorNome = new Map<string, VantagemDesvantagem>();
      const desvantagensPorNivel = new Map<number, VantagemDesvantagem[]>();
      const desvantagensPorTipo = new Map<string, VantagemDesvantagem[]>();

      const desvantagensAtivas: VantagemDesvantagem[] = [];

      const nivelCount = new Map<number, number>();
      const tipoCount = new Map<string, number>();

      desvantagensData.forEach((desvantagem) => {
        const d = desvantagem as DesvantagemLike;
        desvantagensPorId.set(d.id, desvantagem);
        desvantagensPorNome.set(d.nome.toLowerCase(), desvantagem);

        desvantagensAtivas.push(desvantagem);

        const nivel = d.nivel || 1;
        if (!desvantagensPorNivel.has(nivel)) {
          desvantagensPorNivel.set(nivel, []);
        }
        desvantagensPorNivel.get(nivel)!.push(desvantagem);

        nivelCount.set(nivel, (nivelCount.get(nivel) || 0) + 1);

        if (Array.isArray(d.tipo) && d.tipo.length > 0) {
          d.tipo.forEach((tipo) => {
            if (!desvantagensPorTipo.has(tipo)) {
              desvantagensPorTipo.set(tipo, []);
            }
            desvantagensPorTipo.get(tipo)!.push(desvantagem);

            tipoCount.set(tipo, (tipoCount.get(tipo) || 0) + 1);
          });
        }
      });

      let nivelMaisComum: number | null = null;
      let maxNivelCount = 0;
      nivelCount.forEach((count, nivel) => {
        if (count > maxNivelCount) {
          maxNivelCount = count;
          nivelMaisComum = nivel;
        }
      });

      let tipoMaisComum: string | null = null;
      let maxTipoCount = 0;
      tipoCount.forEach((count, tipo) => {
        if (count > maxTipoCount) {
          maxTipoCount = count;
          tipoMaisComum = tipo;
        }
      });

      set({
        desvantagens: desvantagensData,
        desvantagensPorId,
        desvantagensPorNome,
        desvantagensPorNivel,
        desvantagensPorTipo,
        desvantagensAtivas,
        totalDesvantagens: desvantagensData.length,
        nivelMaisComum,
        tipoMaisComum,
        desvantagensCarregadas: true,
        loading: false,
        error: null,
        lastLoadTime: Date.now(),
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      });
    },

    getDesvantagemById: (id) => {
      const { desvantagensPorId } = get();
      return desvantagensPorId.get(parseInt(String(id), 10)) || null;
    },

    getDesvantagemByNome: (nome) => {
      const { desvantagensPorNome } = get();
      return desvantagensPorNome.get(nome.toLowerCase()) || null;
    },

    getDesvantagensPorNivel: (nivel) => {
      const { desvantagensPorNivel } = get();
      return desvantagensPorNivel.get(parseInt(String(nivel), 10)) || [];
    },

    getDesvantagensPorTipo: (tipo) => {
      const { desvantagensPorTipo } = get();
      return desvantagensPorTipo.get(tipo) || [];
    },

    getNomesDeDesvantagens: (ids) => {
      if (!Array.isArray(ids)) return [];
      const { desvantagensPorId } = get();
      return ids.map((id) => {
        const desvantagem = desvantagensPorId.get(parseInt(String(id), 10)) as DesvantagemLike | undefined;
        return desvantagem ? desvantagem.nome : `Desvantagem ${id}`;
      });
    },

    getIdsDeDesvantagens: (nomes) => {
      if (!Array.isArray(nomes)) return [];
      const { desvantagensPorNome } = get();
      return nomes
        .map((nome) => {
          if (typeof nome !== 'string') return null;
          const desvantagem = desvantagensPorNome.get(nome.toLowerCase()) as DesvantagemLike | undefined;
          return desvantagem ? desvantagem.id : null;
        })
        .filter((id): id is number => Boolean(id));
    },

    desvantagemExists: (id) => {
      const { desvantagensPorId } = get();
      return desvantagensPorId.has(parseInt(String(id), 10));
    },

    mapearDesvantagensDePersonagem: (desvantagensPersonagem) => {
      if (!Array.isArray(desvantagensPersonagem)) return [];

      const { desvantagensPorId } = get();
      return desvantagensPersonagem.map((desvantagemData) => {
        const dv = desvantagemData as { id?: number | string; desvantagem_id?: number | string };
        const desvantagem = desvantagensPorId.get(parseInt(String(dv.id ?? dv.desvantagem_id), 10));
        return desvantagem ? {
          ...desvantagem,
          ...desvantagemData,
        } as Record<string, unknown> : desvantagemData as Record<string, unknown>;
      });
    },

    getDesvantagensParaSelecao: () => {
      const { desvantagensAtivas } = get();
      return desvantagensAtivas.map((desvantagem) => {
        const d = desvantagem as DesvantagemLike;
        return {
          id: d.id,
          nome: d.nome,
          custo: d.custo,
          descricao: d.descricao,
          nivel: d.nivel,
          tipo: d.tipo,
        };
      });
    },

    getDesvantagensParaFiltro: () => {
      const { desvantagens } = get();
      return desvantagens.map((desvantagem) => {
        const d = desvantagem as DesvantagemLike;
        return {
          id: d.id,
          nome: d.nome,
          nivel: d.nivel,
          tipo: d.tipo,
          custo: d.custo,
        };
      });
    },

    getEstatisticasDesvantagens: () => {
      const {
        totalDesvantagens,
        nivelMaisComum,
        tipoMaisComum,
        desvantagensPorNivel,
        desvantagensPorTipo,
      } = get();

      return {
        total: totalDesvantagens,
        nivelMaisComum,
        tipoMaisComum,
        niveis: Array.from(desvantagensPorNivel.keys()).sort((a, b) => a - b),
        tipos: Array.from(desvantagensPorTipo.keys()).sort(),
        desvantagensPorNivel: Object.fromEntries(desvantagensPorNivel) as Record<number, VantagemDesvantagem[]>,
        desvantagensPorTipo: Object.fromEntries(desvantagensPorTipo) as Record<string, VantagemDesvantagem[]>,
      };
    },

    inicializar: async () => {
      const { desvantagensCarregadas } = get();
      if (!desvantagensCarregadas) {
        await get().carregarDesvantagens();
      }
    },

    recarregarDesvantagens: async () => {
      await get().carregarDesvantagens(true);
    },

    resetDesvantagemState: () => {
      set({
        desvantagens: [],
        desvantagensCarregadas: false,
        desvantagensPorId: new Map(),
        desvantagensPorNome: new Map(),
        desvantagensPorNivel: new Map(),
        desvantagensPorTipo: new Map(),
        desvantagensAtivas: [],
        totalDesvantagens: 0,
        nivelMaisComum: null,
        tipoMaisComum: null,
        loading: false,
        error: null,
        lastLoadTime: null,
        total: 0,
        offset: 0,
        limit: 50,
        hasMore: false,
      });
    },

    carregarMaisDesvantagens: async () => {
      const { hasMore, loading, offset, limit } = get();

      if (!hasMore || loading) {
        return;
      }

      set({ loading: true });

      try {
        const response = await desvantagemService.getAll({
          offset: offset + limit,
          limit,
        });

        const novasDesvantagens = response.data || [];
        const currentDesvantagens = get().desvantagens;
        const todasDesvantagens = [...currentDesvantagens, ...novasDesvantagens];

        get().processarDesvantagens(
          todasDesvantagens,
          response.pagination?.total ?? todasDesvantagens.length,
          response.pagination?.offset ?? 0,
          response.pagination?.limit ?? 50,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('DesvantagemStore: Erro ao carregar mais desvantagens:', error);
        set({ loading: false, error: message });
      }
    },
  });
};
