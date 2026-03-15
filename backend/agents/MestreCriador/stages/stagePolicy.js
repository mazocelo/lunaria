/**
 * stagePolicy.js — Fonte unica de regras de etapa no backend
 *
 * Define transicoes validas, tipo de sugestao, suporte a refresh/skip
 * e progressao manual por etapa.
 */

export const STAGE_ORDER = [
  'boas_vindas',
  'raca',
  'classe',
  'background',
  'desvantagens',
  'vantagens',
  'atributos',
  'resumo',
  'refinamento',
];

export const STAGE_IDS = new Set(STAGE_ORDER);

export const STAGE_POLICY = {
  boas_vindas: {
    allowedNext: ['raca'],
    defaultNext: 'raca',
    suggestionType: 'nome',
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  raca: {
    allowedNext: ['classe'],
    defaultNext: 'classe',
    suggestionType: 'raca',
    supportsRefresh: true,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  classe: {
    allowedNext: ['background'],
    defaultNext: 'background',
    suggestionType: 'classe',
    supportsRefresh: true,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  background: {
    allowedNext: ['desvantagens'],
    defaultNext: 'desvantagens',
    suggestionType: 'background',
    supportsRefresh: true,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  desvantagens: {
    allowedNext: ['vantagens'],
    defaultNext: 'vantagens',
    suggestionType: 'desvantagem',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  vantagens: {
    allowedNext: ['atributos'],
    defaultNext: 'atributos',
    suggestionType: 'vantagem',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  atributos: {
    allowedNext: ['resumo'],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: true,
  },
  resumo: {
    allowedNext: ['refinamento'],
    defaultNext: 'refinamento',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: false,
  },
  refinamento: {
    allowedNext: ['refinamento'],
    defaultNext: 'refinamento',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: false,
  },
};

/**
 * Retorna a policy de uma etapa. Fallback seguro para boas_vindas.
 */
export function getPolicy(etapa) {
  return STAGE_POLICY[etapa] || STAGE_POLICY.boas_vindas;
}

/**
 * Valida e sanitiza etapa_proxima retornada pela IA.
 * Se a IA retornar um destino invalido, usa o default da policy.
 */
export function sanitizeEtapaProxima(etapaAtual, etapaProximaIA) {
  // Permitir que a IA fique na etapa atual (ex: background refinando)
  if (etapaProximaIA === etapaAtual) return etapaAtual;
  const policy = getPolicy(etapaAtual);
  if (policy.allowedNext.includes(etapaProximaIA)) {
    return etapaProximaIA;
  }
  return policy.defaultNext || etapaAtual;
}

/**
 * Decide se deve travar a etapa com base no actionMode e na policy.
 *
 * @param {string} etapa
 * @param {string} actionMode - 'reply' | 'refresh_options' | 'continue_stage' | 'skip_stage' | 'enter_stage'
 * @returns {boolean} true se deve forcar etapa_proxima = etapa (nao avancar)
 */
export function shouldLockStage(etapa, actionMode) {
  // Refresh nunca avanca
  if (actionMode === 'refresh_options') return true;

  const policy = getPolicy(etapa);

  // Etapas com progressao manual so avancam via continue_stage
  if (policy.manualProgression && actionMode !== 'continue_stage') return true;

  return false;
}

// Backward compat exports
export const ETAPAS = STAGE_ORDER;
export const TRANSICOES = Object.fromEntries(
  STAGE_ORDER.map((id) => [id, STAGE_POLICY[id].allowedNext])
);
