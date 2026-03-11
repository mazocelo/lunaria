/**
 * Configurações do Mestre Criador — Wizard de criação de personagem
 */
import { MESTRE_CONFIG, detectProvider } from '../Mestre/config.js';

// Etapas do wizard na ordem
export const ETAPAS = [
  'boas_vindas',
  'raca',
  'classe',
  'background',
  'vantagens',
  'desvantagens',
  'atributos',
  'resumo',
  'refinamento',
];

// Transições válidas: de qual etapa pode ir para quais
export const TRANSICOES = {
  boas_vindas: ['raca'],
  raca: ['classe'],
  classe: ['background'],
  background: ['vantagens'],
  vantagens: ['desvantagens'],
  desvantagens: ['atributos'],
  atributos: ['resumo'],
  resumo: ['refinamento'],
  refinamento: ['refinamento', 'confirmado'],
};

// Campos obrigatórios por etapa (para validar antes de avançar)
export const CAMPOS_OBRIGATORIOS = {
  boas_vindas: ['nome'],
  raca: ['raca_id'],
  classe: ['classe_id'],
  background: ['background'],
  vantagens: [],
  desvantagens: [],
  atributos: ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'],
  resumo: [],
  refinamento: [],
};

// Config do modelo para o Mestre Criador (reutiliza defaults do Mestre)
export const CRIADOR_CONFIG = {
  model: {
    ...MESTRE_CONFIG.model,
    maxTokens: parseInt(process.env.CRIADOR_MAX_TOKENS) || 4000,
    temperature: parseFloat(process.env.CRIADOR_TEMPERATURE) || 0.85,
  },
};

export { detectProvider };
