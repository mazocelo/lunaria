/**
 * Configuracoes do Mestre Criador - Wizard de criacao de personagem
 */
import { MESTRE_CONFIG, detectProvider } from '../Mestre/config.js';

// Re-export from stagePolicy (fonte unica de etapas e transicoes)
import { ETAPAS, TRANSICOES } from './stages/stagePolicy.js';
export { ETAPAS, TRANSICOES };

// Config do modelo para o Mestre Criador (reutiliza defaults do Mestre)
export const CRIADOR_CONFIG = {
  model: {
    ...MESTRE_CONFIG.model,
    maxTokens: parseInt(process.env.CRIADOR_MAX_TOKENS) || 4000,
    temperature: parseFloat(process.env.CRIADOR_TEMPERATURE) || 0.85,
  },
};

export { detectProvider };
