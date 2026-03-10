/**
 * Configurações do Mestre RPG
 * Centraliza todas as configurações de modelo, comportamento, cache, etc.
 * Override via env vars quando disponível.
 */

export const MESTRE_CONFIG = {
  // Configurações do modelo de IA
  model: {
    provider: process.env.AI_PROVIDER || 'gemini',
    name: process.env.AI_MODEL || 'gemini-2.5-flash',
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.9,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 8000,
    topP: parseFloat(process.env.AI_TOP_P) || 0.99,
    timeout: parseInt(process.env.AI_TIMEOUT_MS) || 12000,
  },

  // Configurações de comportamento
  behavior: {
    language: 'pt-br',
    maxHistoryLength: parseInt(process.env.MESTRE_HISTORY_LIMIT) || 15,
    resumoMaxChars: parseInt(process.env.MESTRE_RESUMO_MAX_CHARS) || 2000,
    contextWindow: 4000,
  },

  // Configurações de rate limiting
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.MESTRE_RATE_LIMIT) || 10,
    cooldownTime: 1000,
  },

  // Configurações de cache
  cache: {
    enabled: process.env.MESTRE_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.MESTRE_CACHE_TTL) || 3600,
    maxSize: parseInt(process.env.MESTRE_CACHE_MAX_SIZE) || 30,
  }
};

export default MESTRE_CONFIG;
