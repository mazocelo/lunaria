/**
 * RACA ACTIONS - Logicas e acoes das racas
 *
 * Contem todas as funcoes que modificam o estado das racas:
 * - Carregamento unico das racas (cache)
 * - Mapeamento por ID e nome
 * - Acesso otimizado aos dados
 * - Funcoes utilitarias para views e viewmodels
 * - Suporte a paginacao da API
 *
 * API REAL: /racas endpoint com paginacao (limit, offset)
 */
import { racaService } from '../../services/index';
import type { Raca } from '../../types/api';
import type { RacaState } from './states';

export type RacaActions = {
  carregarRacas: (forceReload?: boolean, sistema?: string | null) => Promise<Raca[]>;
  processarRacas: (racasData: Raca[] | null | undefined, total?: number, offset?: number, limit?: number) => void;
  getRacaById: (id: number | string) => Raca | null;
  getRacaByNome: (nome: string | null | undefined) => Raca | null;
  getNomesDeRacas: (ids: unknown) => string[];
  getIdsDeRacas: (nomes: unknown) => number[];
  racaExists: (idOrNome: number | string) => boolean;
  mapearRacaDePersonagem: (personagem: { raca_id?: number | null } | null | undefined) => Raca | null;
  inicializar: () => Promise<void>;
  recarregarRacas: () => Promise<Raca[]>;
  resetRacaState: () => Promise<void>;
  getRacasParaSelecao: () => Array<{ id: number; nome: string; descricao: string; atributos: Record<string, unknown> }>;
  getRacasParaFiltro: () => Array<{ id: number | null; nome: string }>;
  carregarMaisRacas: () => Promise<void>;
};

type SetState = (partial: Partial<RacaState>) => void;
type GetState = () => RacaState;

export const createRacaActions = (set: SetState, getBase: GetState): RacaActions => {
  const get = getBase as () => RacaState & RacaActions;
  return ({

    carregarRacas: async (forceReload = false, sistema = null) => {
      const { racasCarregadas, loading, sistemaCarregado } = get();

      const sistemaDivergente = sistemaCarregado !== sistema;

      if ((racasCarregadas || loading) && !forceReload && !sistemaDivergente) {
        return get().racas;
      }

      set({ loading: true, error: null });

      try {
        const response = await racaService.getAll(sistema ? { sistema } : undefined);
        const racasData = response.data || [];
        const total = response.pagination?.total ?? racasData.length;
        const offset = response.pagination?.offset ?? 0;
        const limit = response.pagination?.limit ?? 50;

        get().processarRacas(racasData, total, offset, limit);
        set({ sistemaCarregado: sistema });

        return racasData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('RacaStore: Erro ao carregar racas:', error);
        set({
          error: message,
          loading: false,
        });
        throw error;
      }
    },

    processarRacas: (racasData, total = 0, offset = 0, limit = 50) => {
      const racasValidas: Raca[] = (racasData || []).filter(
        (raca): raca is Raca => !!raca && typeof raca.id === 'number',
      );

      const racasPorId: Record<number, Raca> = {};
      const racasPorNome: Record<string, Raca> = {};

      racasValidas.forEach((raca) => {
        racasPorId[raca.id] = raca;

        if (raca.nome) {
          const nomeNormalizado = raca.nome.toLowerCase().trim();
          racasPorNome[nomeNormalizado] = raca;
        }
      });

      const hasMore = (offset + racasValidas.length) < total;

      set({
        racas: racasValidas,
        racasPorId,
        racasPorNome,
        totalRacas: racasValidas.length,
        total,
        offset,
        limit,
        hasMore,
        racasCarregadas: true,
        loading: false,
        lastLoadTime: new Date().toISOString(),
      });
    },

    getRacaById: (id) => {
      const { racasPorId } = get();
      return racasPorId[id as number] || null;
    },

    getRacaByNome: (nome) => {
      const { racasPorNome } = get();
      if (!nome) return null;

      const nomeNormalizado = nome.toLowerCase().trim();
      return racasPorNome[nomeNormalizado] || null;
    },

    getNomesDeRacas: (ids) => {
      if (!Array.isArray(ids)) return [];

      const { racasPorId } = get();
      return ids
        .map((id) => racasPorId[id as number]?.nome)
        .filter((nome): nome is string => Boolean(nome));
    },

    getIdsDeRacas: (nomes) => {
      if (!Array.isArray(nomes)) return [];

      const { racasPorNome } = get();
      return nomes
        .map((nome) => {
          if (typeof nome !== 'string') return undefined;
          const nomeNormalizado = nome.toLowerCase().trim();
          return racasPorNome[nomeNormalizado]?.id;
        })
        .filter((id): id is number => id !== undefined);
    },

    racaExists: (idOrNome) => {
      const { racasPorId, racasPorNome } = get();

      if (typeof idOrNome === 'number' || !isNaN(Number(idOrNome))) {
        return !!racasPorId[idOrNome as number];
      }

      const nomeNormalizado = String(idOrNome).toLowerCase().trim();
      return !!racasPorNome[nomeNormalizado];
    },

    mapearRacaDePersonagem: (personagem) => {
      if (!personagem || !personagem.raca_id) return null;

      const { racasPorId } = get();
      return racasPorId[personagem.raca_id] || null;
    },

    inicializar: async () => {
      const { racasCarregadas } = get();

      if (!racasCarregadas) {
        await get().carregarRacas();
      }
    },

    recarregarRacas: async () => {
      return await get().carregarRacas(true);
    },

    resetRacaState: async () => {
      const { default: states } = await import('./states');
      set(states);
    },

    getRacasParaSelecao: () => {
      const { racas } = get();
      return racas.map((raca) => ({
        id: raca.id,
        nome: raca.nome,
        descricao: (raca as { descricao?: string }).descricao || '',
        atributos: ((raca as { atributos?: Record<string, unknown> }).atributos) || {},
      }));
    },

    getRacasParaFiltro: () => {
      const { racas } = get();
      return [
        { id: null, nome: 'Todas as racas' },
        ...racas.map((raca) => ({
          id: raca.id,
          nome: raca.nome,
        })),
      ];
    },

    carregarMaisRacas: async () => {
      const { hasMore, offset, limit, loading } = get();

      if (!hasMore || loading) {
        return;
      }

      set({ loading: true });

      try {
        const response = await racaService.getAll({
          limit,
          offset: offset + limit,
        });

        const novasRacas = response.data || [];
        const todasRacas = [...get().racas, ...novasRacas];

        get().processarRacas(
          todasRacas,
          response.pagination?.total ?? todasRacas.length,
          response.pagination?.offset ?? (offset + limit),
          response.pagination?.limit ?? limit,
        );

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('RacaStore: Erro ao carregar mais racas:', error);
        set({
          error: message,
          loading: false,
        });
        throw error;
      }
    },
  });
};
