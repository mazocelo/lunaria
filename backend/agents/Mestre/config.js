/**
 * Configurações do Mestre RPG
 * Centraliza todas as configurações de modelo, comportamento, cache, etc.
 * Override via env vars quando disponível.
 */

// Timeouts padrão por kind (fallback quando o modelo não define)
const DEFAULT_TIMEOUT_MS_BY_KIND = {
  player_action: 30000,
  turn_start: 60000
};

// Catálogo de modelos disponíveis com metadata
export const AI_MODELS = {
  // Google Gemini
  'gemini-2.5-flash':      { provider: 'gemini', label: 'Gemini 2.5 Flash', badge: 'Recomendado', inputPrice: 0.30, outputPrice: 2.50, context: 1048576, temperature: 0.9, topP: 0.99, timeouts: { player_action: 15000, turn_start: 30000 } },
  'gemini-2.5-flash-lite': { provider: 'gemini', label: 'Gemini 2.5 Flash-Lite', badge: 'Economico', inputPrice: 0.10, outputPrice: 0.40, context: 1048576, temperature: 0.9, topP: 0.99, timeouts: { player_action: 15000, turn_start: 30000 } },
  'gemini-2.0-flash':      { provider: 'gemini', label: 'Gemini 2.0 Flash', badge: 'Legado', inputPrice: 0.10, outputPrice: 0.40, context: 1048576, temperature: 0.9, topP: 0.99, timeouts: { player_action: 15000, turn_start: 30000 } },
  'gemini-3.1-flash-lite-preview': { provider: 'gemini', label: 'Gemini 3.1 Flash-Lite', badge: 'Poeta', inputPrice: 0.25, outputPrice: 1.50, context: 1048576, temperature: 0.9, topP: 0.99, timeouts: { player_action: 15000, turn_start: 30000 } },
  'gemini-3-flash-preview':        { provider: 'gemini', label: 'Gemini 3 Flash', badge: 'Bardo', inputPrice: 0.50, outputPrice: 3.00, context: 1048576, temperature: 0.9, topP: 0.99, timeouts: { player_action: 15000, turn_start: 30000 } },
  'gemini-3.1-pro-preview':        { provider: 'gemini', label: 'Gemini 3.1 Pro', badge: 'Profeta', inputPrice: 2.00, outputPrice: 12.00, context: 1048576, temperature: 0.85, topP: 0.95, timeouts: { player_action: 30000, turn_start: 60000 } },
  // Groq (Llama) — LPU hardware, inferência rápida mas com picos sob carga
  'openai/gpt-oss-120b':                       { provider: 'groq', label: 'GPT OSS 120B', badge: null, inputPrice: 0, outputPrice: 0, context: 131072, temperature: 0.8, topP: 0.92, timeouts: { player_action: 35000, turn_start: 70000 } },
  'openai/gpt-oss-20b':                        { provider: 'groq', label: 'GPT OSS 20B', badge: 'Rapido', inputPrice: 0, outputPrice: 0, context: 131072, temperature: 0.7, topP: 0.90, timeouts: { player_action: 12000, turn_start: 25000 } },
  // Anthropic — latência maior, especialmente Sonnet com prompts narrativos densos
  'claude-sonnet-4-6': { provider: 'anthropic', label: 'Claude Sonnet 4.6', badge: 'Premium+', inputPrice: 3.00, outputPrice: 15.00, context: 200000, temperature: 0.85, topP: null, timeouts: { player_action: 60000, turn_start: 120000 } },
  'claude-haiku-4-5-20251001': { provider: 'anthropic', label: 'Claude Haiku 4.5', badge: 'Premium', inputPrice: 0.80, outputPrice: 4.00, context: 200000, temperature: 0.85, topP: null, timeouts: { player_action: 30000, turn_start: 60000 } },
};

// Tiers de Mestre — determina modelo por historia
export const MESTRE_TIERS = {
  pescador: { model: 'gemini-2.5-flash-lite',        label: 'Pescador', badge: 'Gratis' },
  poeta:    { model: 'gemini-2.5-flash',              label: 'Poeta',    badge: 'Basico' },
  bardo:    { model: 'gemini-3-flash-preview',        label: 'Bardo',    badge: 'Premium' },
  profeta:  { model: 'gemini-3.1-pro-preview',           label: 'Profeta',  badge: 'Top' },
  profetisa:{ model: 'claude-sonnet-4-6',               label: 'Profetisa', badge: 'Top' },
};
export const DEFAULT_MESTRE_TIER = 'poeta';
export const VALID_MESTRE_TIERS = Object.keys(MESTRE_TIERS);
export function resolveModelFromTier(tier) {
  return (MESTRE_TIERS[tier] || MESTRE_TIERS[DEFAULT_MESTRE_TIER]).model;
}

// Modelos deprecados → fallback automático
export const DEPRECATED_MODELS = {
  'gemini-1.5-pro': 'gemini-2.5-flash',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-2.0-flash-lite': 'gemini-2.5-flash-lite',
  'llama-3.1-8b-instant': 'gemini-2.5-flash',
  'meta-llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'meta-llama/llama-4-scout-17b-16e-instruct': 'openai/gpt-oss-120b',
};

// Resolve o nome do modelo efetivo a partir da config da sessão
export function resolveModelName(mestreConfig) {
  const name = mestreConfig?.modelo || MESTRE_CONFIG.model.name;
  return DEPRECATED_MODELS[name] || name;
}

// Retorna timeout em ms para um modelo e tipo de operação
export function getModelTimeoutMs(modelName, kind = 'player_action') {
  const resolved = DEPRECATED_MODELS[modelName] || modelName;
  const model = AI_MODELS[resolved];
  if (model?.timeouts?.[kind]) return model.timeouts[kind];
  return DEFAULT_TIMEOUT_MS_BY_KIND[kind] || DEFAULT_TIMEOUT_MS_BY_KIND.player_action;
}

// Retorna temperature/topP resolvidos para um modelo específico
export function getModelParams(modelName) {
  const resolved = DEPRECATED_MODELS[modelName] || modelName;
  const model = AI_MODELS[resolved];
  return {
    temperature: model?.temperature ?? MESTRE_CONFIG.model.temperature,
    topP: model?.topP ?? MESTRE_CONFIG.model.topP,
  };
}

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
    timeout: parseInt(process.env.AI_TIMEOUT_MS) || 60000,
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
    enabled: true,
    ttl: parseInt(process.env.MESTRE_CACHE_TTL) || 3600,
    maxSize: parseInt(process.env.MESTRE_CACHE_MAX_SIZE) || 30,
  }
};

export default MESTRE_CONFIG;
