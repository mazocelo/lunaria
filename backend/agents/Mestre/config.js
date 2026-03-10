/**
 * Configurações do Mestre RPG
 * Centraliza todas as configurações de modelo, comportamento, cache, etc.
 * Override via env vars quando disponível.
 */

// Catálogo de modelos disponíveis com metadata
export const AI_MODELS = {
  // Google Gemini
  'gemini-2.5-flash':      { provider: 'gemini', label: 'Gemini 2.5 Flash', badge: 'Recomendado', inputPrice: 0.30, outputPrice: 2.50, context: 1048576 },
  'gemini-2.5-flash-lite': { provider: 'gemini', label: 'Gemini 2.5 Flash-Lite', badge: 'Economico', inputPrice: 0.10, outputPrice: 0.40, context: 1048576 },
  'gemini-2.0-flash':      { provider: 'gemini', label: 'Gemini 2.0 Flash', badge: 'Legado', inputPrice: 0.10, outputPrice: 0.40, context: 1048576 },
  // Groq (Llama)
  'openai/gpt-oss-120b':                       { provider: 'groq', label: 'GPT OSS 120B', badge: null, inputPrice: 0, outputPrice: 0, context: 131072 },
  'llama-3.3-70b-versatile':                   { provider: 'groq', label: 'Llama 3.3 70B Versatile', badge: null, inputPrice: 0, outputPrice: 0, context: 131072 },
  'openai/gpt-oss-20b':                        { provider: 'groq', label: 'GPT OSS 20B', badge: 'Rapido', inputPrice: 0, outputPrice: 0, context: 131072 },
  'meta-llama/llama-4-scout-17b-16e-instruct': { provider: 'groq', label: 'Llama 4 Scout', badge: 'Avancado', inputPrice: 0, outputPrice: 0, context: 131072 },
  // Anthropic
  'claude-haiku-4-5-20251001': { provider: 'anthropic', label: 'Claude Haiku 4.5', badge: 'Premium', inputPrice: 0.80, outputPrice: 4.00, context: 200000 },
};

// Modelos deprecados → fallback automático
export const DEPRECATED_MODELS = {
  'gemini-1.5-pro': 'gemini-2.5-flash',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-2.0-flash-lite': 'gemini-2.5-flash-lite',
  'llama-3.1-8b-instant': 'gemini-2.5-flash',
};

// Detecta provider pelo nome do modelo
export function detectProvider(modelName) {
  if (modelName?.startsWith('gemini')) return 'gemini';
  if (modelName?.startsWith('claude')) return 'anthropic';
  return 'groq';
}

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
