/**
 * CLASSE STATES - Estados iniciais das classes
 *
 * Contem todos os estados iniciais das classes (dados estaticos):
 * - Lista de classes carregadas do backend
 * - Status de carregamento
 * - Cache de classes por ID e nome
 * - Controle de inicializacao e paginacao
 */

import type { Classe } from '../../types/api';

export type ClasseState = {
  classes: Classe[];
  classesCarregadas: boolean;
  classesPorId: Record<number, Classe>;
  classesPorNome: Record<string, Classe>;
  loading: boolean;
  error: string | null;
  lastLoadTime: string | null;
  sistemaCarregado: string | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  totalClasses: number;
};

export const classeInitialStates: ClasseState = {
  classes: [],
  classesCarregadas: false,
  classesPorId: {},
  classesPorNome: {},
  loading: false,
  error: null,
  lastLoadTime: null,
  sistemaCarregado: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
  totalClasses: 0,
};

export default classeInitialStates;
