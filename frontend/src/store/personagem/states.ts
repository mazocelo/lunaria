import type { Personagem } from '../../models/Personagem';

export type PersonagemState = {
  personagens: Personagem[];
  personagensCarregados: boolean;
  personagensPorId: Map<number, Personagem>;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export const personagemInitialStates: PersonagemState = {
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
};
