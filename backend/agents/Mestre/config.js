/**
 * Configurações do Mestre RPG
 * Centraliza todas as configurações de modelo, temperatura, etc.
 */

export const MESTRE_CONFIG = {
  // Configurações do modelo de IA
  model: {
    provider: 'groq',
    name: 'meta-llama/llama-4-scout-17b-16e-instruct',
    temperature: 0.9, // Alta criatividade para narração
    maxTokens: 8000,
    topP: 0.99
  },

  // Configurações de comportamento
  behavior: {
    language: 'pt-br',
    maxHistoryLength: 20, // Número máximo de mensagens no histórico
    contextWindow: 4000, // Janela de contexto em tokens
  },

  // Configurações de rate limiting
  rateLimit: {
    maxRequestsPerMinute: 10,
    cooldownTime: 1000 // ms entre requisições
  },

  // Configurações de cache
  cache: {
    enabled: true,
    ttl: 3600 // segundos (1 hora)
  }
};

export default MESTRE_CONFIG;

