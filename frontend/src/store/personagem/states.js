export const personagemInitialStates = {
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
