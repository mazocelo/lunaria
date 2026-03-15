import logger from './logger.js';

const log = logger.child({ module: 'historiaConfigHelper' });

const VALID_OPENING_MODES = ['direto', 'transicao_personalizada'];

/**
 * Valida e normaliza o config de uma história.
 * Retorna config sanitizado ou null se input for falsy.
 * Lança erro se a forma for inválida.
 */
export function validateHistoriaConfig(config) {
  if (!config) return null;

  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('config deve ser um objeto JSON');
  }

  const sanitized = {};

  if (config.session_opening_mode !== undefined) {
    if (!VALID_OPENING_MODES.includes(config.session_opening_mode)) {
      throw new Error(
        `session_opening_mode invalido: "${config.session_opening_mode}". ` +
        `Aceitos: ${VALID_OPENING_MODES.join(', ')}`
      );
    }
    sanitized.session_opening_mode = config.session_opening_mode;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

/**
 * Lê o modo de abertura de um objeto config, com default 'direto'.
 */
export function getOpeningMode(config) {
  return config?.session_opening_mode || 'direto';
}
