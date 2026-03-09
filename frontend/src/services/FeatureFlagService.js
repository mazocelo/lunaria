import { apiClient } from './ApiClient';

let cachedFlags = null;
let fetchPromise = null;

/**
 * Busca feature flags do backend com cache em memoria.
 * @returns {Promise<Object>} Mapa de flags { FLAG_NAME: boolean }
 */
export async function getFeatureFlags() {
  if (cachedFlags) return cachedFlags;
  if (fetchPromise) return fetchPromise;

  fetchPromise = apiClient
    .get('/features')
    .then(res => {
      cachedFlags = res.data || res;
      fetchPromise = null;
      return cachedFlags;
    })
    .catch(() => {
      fetchPromise = null;
      return {};
    });

  return fetchPromise;
}

/**
 * Verifica se uma flag esta ativa. Retorna false se flags nao carregaram ainda.
 * Para uso sincrono apos o primeiro load.
 */
export function isEnabled(flag) {
  return cachedFlags?.[flag] ?? false;
}

/** Limpa cache (util em logout ou refresh) */
export function clearFlagCache() {
  cachedFlags = null;
  fetchPromise = null;
}

export default { getFeatureFlags, isEnabled, clearFlagCache };
