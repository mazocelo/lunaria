/**
 * stagePolicy.js — Fonte unica de regras de etapa no backend
 *
 * Define transicoes validas, tipo de sugestao, suporte a refresh/skip
 * e progressao manual por etapa.
 * Suporta multiplos sistemas (lunaria, 3det, dnd5e).
 */

// ── Lunaria ──────────────────────────────────────────────────────────

export const STAGE_ORDER = [
  'boas_vindas',
  'raca',
  'classe',
  'background',
  'desvantagens',
  'vantagens',
  'atributos',
  'equipamentos',
  'grimorio',
  'resumo',
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
    allowedNext: ['equipamentos'],
    defaultNext: 'equipamentos',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: true,
  },
  equipamentos: {
    allowedNext: ['grimorio'],
    defaultNext: 'grimorio',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: false,
  },
  grimorio: {
    allowedNext: ['resumo'],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: true,
  },
  resumo: {
    allowedNext: [],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: false,
  },
};

// ── 3D&T ─────────────────────────────────────────────────────────────

export const TRESDET_STAGE_ORDER = [
  'boas_vindas',
  'conceito',
  'caracteristicas',
  'vantagens',
  'desvantagens',
  'equipamentos',
  'magias',
  'resumo',
];

export const TRESDET_STAGE_IDS = new Set(TRESDET_STAGE_ORDER);

export const TRESDET_STAGE_POLICY = {
  boas_vindas: {
    allowedNext: ['conceito'],
    defaultNext: 'conceito',
    suggestionType: 'nome',
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  conceito: {
    allowedNext: ['caracteristicas'],
    defaultNext: 'caracteristicas',
    suggestionType: 'conceito',
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  caracteristicas: {
    allowedNext: ['vantagens'],
    defaultNext: 'vantagens',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: true,
  },
  vantagens: {
    allowedNext: ['desvantagens'],
    defaultNext: 'desvantagens',
    suggestionType: 'vantagem',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  desvantagens: {
    allowedNext: ['equipamentos'],
    defaultNext: 'equipamentos',
    suggestionType: 'desvantagem',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  equipamentos: {
    allowedNext: ['magias'],
    defaultNext: 'magias',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  magias: {
    allowedNext: ['resumo'],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  resumo: {
    allowedNext: [],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: false,
  },
};

// ── D&D 5e ──────────────────────────────────────────────────────────

export const DND5E_STAGE_ORDER = [
  'boas_vindas',
  'raca',
  'classe',
  'background',
  'atributos',
  'skills',
  'equipamentos',
  'spells',
  'resumo',
];

export const DND5E_STAGE_IDS = new Set(DND5E_STAGE_ORDER);

export const DND5E_STAGE_POLICY = {
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
    manualProgression: true,
  },
  classe: {
    allowedNext: ['background'],
    defaultNext: 'background',
    suggestionType: 'classe',
    supportsRefresh: true,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: true,
  },
  background: {
    allowedNext: ['atributos'],
    defaultNext: 'atributos',
    suggestionType: 'background',
    supportsRefresh: true,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  atributos: {
    allowedNext: ['skills'],
    defaultNext: 'skills',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: true,
  },
  skills: {
    allowedNext: ['equipamentos'],
    defaultNext: 'equipamentos',
    suggestionType: 'skill',
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: true,
  },
  equipamentos: {
    allowedNext: ['spells'],
    defaultNext: 'spells',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  spells: {
    allowedNext: ['resumo'],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  resumo: {
    allowedNext: [],
    defaultNext: 'resumo',
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: false,
  },
};

// ── Helpers sistema-aware ────────────────────────────────────────────

/**
 * Retorna { stageOrder, stagePolicy, stageIds } do sistema solicitado.
 */
export function getStagePolicy(sistema) {
  if (sistema === 'tresdet') {
    return {
      stageOrder: TRESDET_STAGE_ORDER,
      stagePolicy: TRESDET_STAGE_POLICY,
      stageIds: TRESDET_STAGE_IDS,
    };
  }
  if (sistema === 'dnd5e') {
    return {
      stageOrder: DND5E_STAGE_ORDER,
      stagePolicy: DND5E_STAGE_POLICY,
      stageIds: DND5E_STAGE_IDS,
    };
  }
  return {
    stageOrder: STAGE_ORDER,
    stagePolicy: STAGE_POLICY,
    stageIds: STAGE_IDS,
  };
}

/**
 * Retorna a policy de uma etapa. Fallback seguro para boas_vindas.
 */
export function getPolicy(etapa, sistema) {
  const { stagePolicy } = getStagePolicy(sistema);
  return stagePolicy[etapa] || stagePolicy.boas_vindas;
}

/**
 * Valida e sanitiza etapa_proxima retornada pela IA.
 * Se a IA retornar um destino invalido, usa o default da policy.
 */
export function sanitizeEtapaProxima(etapaAtual, etapaProximaIA, sistema) {
  // Permitir que a IA fique na etapa atual (ex: background refinando)
  if (etapaProximaIA === etapaAtual) return etapaAtual;
  const policy = getPolicy(etapaAtual, sistema);
  if (policy.allowedNext.includes(etapaProximaIA)) {
    return etapaProximaIA;
  }
  return policy.defaultNext || etapaAtual;
}

/**
 * Decide se deve travar a etapa com base no actionMode e na policy.
 *
 * @param {string} etapa
 * @param {string} actionMode - 'reply' | 'refresh_options' | 'continue_stage' | 'enter_stage'
 * @param {string} [sistema]
 * @returns {boolean} true se deve forcar etapa_proxima = etapa (nao avancar)
 */
export function shouldLockStage(etapa, actionMode, sistema) {
  // Refresh e enter nunca avancam
  if (actionMode === 'refresh_options' || actionMode === 'enter_stage') return true;

  const policy = getPolicy(etapa, sistema);

  // Etapas com progressao manual so avancam via continue_stage
  if (policy.manualProgression && actionMode !== 'continue_stage') return true;

  return false;
}

/**
 * Quando o jogador clica "continuar" (continue_stage) numa etapa gerenciada
 * pelo frontend, o avanco e deterministico: segue o defaultNext da policy.
 * A IA dessas etapas e decorativa e nao deve decidir o fluxo.
 * @returns {string|null} etapa de destino, ou null se nao se aplica
 */
export function resolveContinueStage(etapa, actionMode, sistema) {
  if (actionMode !== 'continue_stage') return null;
  const policy = getPolicy(etapa, sistema);
  return policy.defaultNext || null;
}

// Backward compat exports
export const ETAPAS = STAGE_ORDER;
export const TRANSICOES = Object.fromEntries(
  STAGE_ORDER.map((id) => [id, STAGE_POLICY[id].allowedNext])
);
