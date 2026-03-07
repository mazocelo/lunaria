export const mestreInitialStates = {
  mestres: [],
  mestresCarregados: false,
  mestresPorId: new Map(),
  mestresPorNome: new Map(),
  loading: false,
  error: null,
  lastLoadTime: null,
  total: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
  mestresAtivos: [],
};
