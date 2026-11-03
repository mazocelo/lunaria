/**
 * TEMA STATES - Estados iniciais dos temas
 *
 * Contem todos os estados iniciais dos temas (dados estaticos):
 * - Lista de temas carregados do backend
 * - Status de carregamento
 * - Cache de temas por ID e nome
 * - Controle de inicializacao
 */

export type Tema = {
  id: number;
  nome: string;
  cor?: string;
  [key: string]: unknown;
};

export type TemaState = {
  temas: Tema[];
  temasCarregados: boolean;
  temasPorId: Record<number, Tema>;
  temasPorNome: Record<string, Tema>;
  loading: boolean;
  error: string | null;
  lastLoadTime: string | null;
  temasAtivos: Tema[];
  totalTemas: number;
};

export const temaInitialStates: TemaState = {
  temas: [],
  temasCarregados: false,
  temasPorId: {},
  temasPorNome: {},
  loading: false,
  error: null,
  lastLoadTime: null,
  temasAtivos: [],
  totalTemas: 0,
};

export default temaInitialStates;
