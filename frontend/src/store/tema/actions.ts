/**
 * TEMA ACTIONS - Logicas e acoes dos temas
 *
 * Contem todas as funcoes que modificam o estado dos temas:
 * - Carregamento unico dos temas (cache)
 * - Mapeamento por ID e nome
 * - Acesso otimizado aos dados
 * - Funcoes utilitarias para views e viewmodels
 *
 * API REAL: Temas so tem { id, nome } - sem propriedade 'ativo'
 */
import { temaService } from '../../services/index';
import type { Tema, TemaState } from './states';

type LegacyEnvelope<T> = {
  success?: boolean;
  data: T;
  message?: string;
  error?: string;
};

export type TemaActions = {
  carregarTemas: () => Promise<Tema[]>;
  processarTemas: (temasData: Tema[] | null | undefined) => void;
  getTemaById: (id: number | string) => Tema | null;
  getTemaByNome: (nome: string | null | undefined) => Tema | null;
  getNomesDeTemas: (ids: unknown) => string[];
  getIdsDeTemas: (nomes: unknown) => number[];
  temaExists: (idOrNome: number | string) => boolean;
  mapearTemasDeHistoria: (historia: { temas?: unknown } | null | undefined) => unknown[];
  inicializar: () => Promise<void>;
  recarregarTemas: () => Promise<Tema[]>;
  resetTemaState: () => Promise<void>;
  getTemasParaSelecao: () => Array<{ id: number; nome: string; cor: string }>;
  getTemasParaFiltro: () => Array<{ id: number | null; nome: string }>;
};

type SetState = (partial: Partial<TemaState>) => void;
type GetState = () => TemaState;

export const createTemaActions = (set: SetState, getBase: GetState): TemaActions => {
  const get = getBase as () => TemaState & TemaActions;
  return ({

  carregarTemas: async () => {
    const { temasCarregados, loading } = get();

    if (temasCarregados || loading) {
      return get().temas;
    }

    set({ loading: true, error: null });

    try {
      const response = await temaService.getAll() as LegacyEnvelope<Tema[] | undefined>;
      const temasData = response.data || [];
      get().processarTemas(temasData);

      return temasData;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('TemaStore: Erro ao carregar temas:', error);
      set({
        error: message,
        loading: false,
      });
      throw error;
    }
  },

  processarTemas: (temasData) => {
    const temasValidos: Tema[] = (temasData || []).filter((tema): tema is Tema => !!tema && typeof tema.id === 'number');

    const temasPorId: Record<number, Tema> = {};
    const temasPorNome: Record<string, Tema> = {};
    const temasAtivos: Tema[] = [];

    temasValidos.forEach((tema) => {
      temasPorId[tema.id] = tema;

      if (tema.nome) {
        const nomeNormalizado = tema.nome.toLowerCase().trim();
        temasPorNome[nomeNormalizado] = tema;
      }

      temasAtivos.push(tema);
    });

    set({
      temas: temasValidos,
      temasPorId,
      temasPorNome,
      temasAtivos,
      totalTemas: temasValidos.length,
      temasCarregados: true,
      loading: false,
      lastLoadTime: new Date().toISOString(),
    });
  },

  getTemaById: (id) => {
    const { temasPorId } = get();
    return temasPorId[id as number] || null;
  },

  getTemaByNome: (nome) => {
    const { temasPorNome } = get();
    if (!nome) return null;

    const nomeNormalizado = nome.toLowerCase().trim();
    return temasPorNome[nomeNormalizado] || null;
  },

  getNomesDeTemas: (ids) => {
    if (!Array.isArray(ids)) return [];

    const { temasPorId } = get();
    return ids
      .map((id) => temasPorId[id as number]?.nome)
      .filter((nome): nome is string => Boolean(nome));
  },

  getIdsDeTemas: (nomes) => {
    if (!Array.isArray(nomes)) return [];

    const { temasPorNome } = get();
    return nomes
      .map((nome) => {
        if (typeof nome !== 'string') return undefined;
        const nomeNormalizado = nome.toLowerCase().trim();
        return temasPorNome[nomeNormalizado]?.id;
      })
      .filter((id): id is number => id !== undefined);
  },

  temaExists: (idOrNome) => {
    const { temasPorId, temasPorNome } = get();

    if (typeof idOrNome === 'number' || !isNaN(Number(idOrNome))) {
      return !!temasPorId[idOrNome as number];
    }

    const nomeNormalizado = String(idOrNome).toLowerCase().trim();
    return !!temasPorNome[nomeNormalizado];
  },

  mapearTemasDeHistoria: (historia) => {
    if (!historia || !historia.temas) return [];

    const temas = historia.temas;
    if (Array.isArray(temas) && temas[0] && typeof temas[0] === 'object' && 'nome' in (temas[0] as object)) {
      return temas;
    }

    if (Array.isArray(temas)) {
      return get().getNomesDeTemas(temas);
    }

    return [];
  },

  inicializar: async () => {
    const { temasCarregados } = get();

    if (!temasCarregados) {
      await get().carregarTemas();
    }
  },

  recarregarTemas: async () => {
    set({
      temasCarregados: false,
      temas: [],
      temasPorId: {},
      temasPorNome: {},
      temasAtivos: [],
      totalTemas: 0,
    });

    return await get().carregarTemas();
  },

  resetTemaState: async () => {
    const { default: states } = await import('./states');
    set(states);
  },

  getTemasParaSelecao: () => {
    const { temasAtivos } = get();
    return temasAtivos.map((tema) => ({
      id: tema.id,
      nome: tema.nome,
      cor: (typeof tema.cor === 'string' ? tema.cor : undefined) || '#8b5cf6',
    }));
  },

  getTemasParaFiltro: () => {
    const { temasAtivos } = get();
    return [
      { id: null, nome: 'Todos os temas' },
      ...temasAtivos.map((tema) => ({
        id: tema.id,
        nome: tema.nome,
      })),
    ];
  },
  });
};
