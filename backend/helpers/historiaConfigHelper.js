import logger from './logger.js';

const log = logger.child({ module: 'historiaConfigHelper' });

const VALID_OPENING_MODES = ['direto', 'transicao_personalizada'];
const VALID_SPEEDS = ['lento', 'medio', 'rapido'];

const DEFAULT_OPENING_MODE = 'direto';
const DEFAULT_SPEED = 'medio';
const DEFAULT_BEAT_BUDGET = 12;
const DEFAULT_MAX_ACTIONS_PER_TURN = 4;

const MIN_BEAT_BUDGET = 4;
const MAX_BEAT_BUDGET = 40;
const MIN_ACTIONS_PER_TURN = 1;
const MAX_ACTIONS_PER_TURN = 8;

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} deve ser um numero inteiro`);
  }
  return parsed;
}

function clampInteger(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cleanupEmptyNestedConfig(config) {
  if (!config || typeof config !== 'object') return null;

  const sanitized = { ...config };
  if (sanitized.ritmo && Object.keys(sanitized.ritmo).length === 0) {
    delete sanitized.ritmo;
  }
  if (sanitized.regras_de_turno && Object.keys(sanitized.regras_de_turno).length === 0) {
    delete sanitized.regras_de_turno;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

/**
 * Valida e normaliza o config de uma historia.
 * Retorna config sanitizado ou null se input for falsy.
 * Lanca erro se a forma for invalida.
 */
export function validateHistoriaConfig(config) {
  if (!config) return null;

  if (!isPlainObject(config)) {
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

  if (config.ritmo !== undefined) {
    if (!isPlainObject(config.ritmo)) {
      throw new Error('ritmo deve ser um objeto JSON');
    }

    const ritmo = {};

    if (config.ritmo.velocidade !== undefined) {
      if (!VALID_SPEEDS.includes(config.ritmo.velocidade)) {
        throw new Error(
          `ritmo.velocidade invalida: "${config.ritmo.velocidade}". ` +
          `Aceitos: ${VALID_SPEEDS.join(', ')}`
        );
      }
      ritmo.velocidade = config.ritmo.velocidade;
    }

    if (config.ritmo.orcamento_de_beats !== undefined) {
      const beats = parseInteger(config.ritmo.orcamento_de_beats, 'ritmo.orcamento_de_beats');
      if (beats < MIN_BEAT_BUDGET || beats > MAX_BEAT_BUDGET) {
        throw new Error(
          `ritmo.orcamento_de_beats deve estar entre ${MIN_BEAT_BUDGET} e ${MAX_BEAT_BUDGET}`
        );
      }
      ritmo.orcamento_de_beats = beats;
    }

    if (Object.keys(ritmo).length > 0) {
      sanitized.ritmo = ritmo;
    }
  }

  if (config.regras_de_turno !== undefined) {
    if (!isPlainObject(config.regras_de_turno)) {
      throw new Error('regras_de_turno deve ser um objeto JSON');
    }

    const regrasDeTurno = {};

    if (config.regras_de_turno.max_acoes_por_turno !== undefined) {
      const maxAcoes = parseInteger(
        config.regras_de_turno.max_acoes_por_turno,
        'regras_de_turno.max_acoes_por_turno'
      );
      if (maxAcoes < MIN_ACTIONS_PER_TURN || maxAcoes > MAX_ACTIONS_PER_TURN) {
        throw new Error(
          `regras_de_turno.max_acoes_por_turno deve estar entre ${MIN_ACTIONS_PER_TURN} e ${MAX_ACTIONS_PER_TURN}`
        );
      }
      regrasDeTurno.max_acoes_por_turno = maxAcoes;
    }

    if (Object.keys(regrasDeTurno).length > 0) {
      sanitized.regras_de_turno = regrasDeTurno;
    }
  }

  return cleanupEmptyNestedConfig(sanitized);
}

export function mergeHistoriaConfig(baseConfig, patchConfig) {
  if (patchConfig === undefined) {
    return validateHistoriaConfig(baseConfig);
  }

  const validatedBase = validateHistoriaConfig(baseConfig);
  const validatedPatch = validateHistoriaConfig(patchConfig);

  if (!validatedBase) return validatedPatch;
  if (!validatedPatch) return validatedBase;

  return cleanupEmptyNestedConfig({
    ...validatedBase,
    ...validatedPatch,
    ritmo: {
      ...(validatedBase.ritmo || {}),
      ...(validatedPatch.ritmo || {})
    },
    regras_de_turno: {
      ...(validatedBase.regras_de_turno || {}),
      ...(validatedPatch.regras_de_turno || {})
    }
  });
}

/**
 * Le o modo de abertura de um objeto config, com default 'direto'.
 */
export function getOpeningMode(config) {
  return config?.session_opening_mode || DEFAULT_OPENING_MODE;
}

export function getNarrativeSpeed(config) {
  return config?.ritmo?.velocidade || DEFAULT_SPEED;
}

export function getBeatBudget(config) {
  const beats = Number(config?.ritmo?.orcamento_de_beats);
  if (!Number.isFinite(beats)) return DEFAULT_BEAT_BUDGET;
  return clampInteger(Math.round(beats), MIN_BEAT_BUDGET, MAX_BEAT_BUDGET);
}

export function getTurnActionLimit(config) {
  const maxAcoes = Number(config?.regras_de_turno?.max_acoes_por_turno);
  if (!Number.isFinite(maxAcoes)) return DEFAULT_MAX_ACTIONS_PER_TURN;
  return clampInteger(Math.round(maxAcoes), MIN_ACTIONS_PER_TURN, MAX_ACTIONS_PER_TURN);
}

export function describeNarrativeSpeed(speed) {
  switch (speed) {
    case 'lento':
      return 'desenvolva mais exploracao, investigacao e interacoes antes de acelerar as consequencias';
    case 'rapido':
      return 'va cedo para decisao, risco e consequencia, com menos rodeios e menos repeticao de ambiente';
    case 'medio':
    default:
      return 'equilibre ambientacao, descoberta e consequencia sem enrolar nem atropelar a progressao';
  }
}

export function buildHistoriaConfigPrompt(config) {
  const velocidade = getNarrativeSpeed(config);
  const orcamentoDeBeats = getBeatBudget(config);
  const maxAcoesPorTurno = getTurnActionLimit(config);

  return [
    'CONFIGURACAO NARRATIVA DA HISTORIA:',
    `- Velocidade: ${velocidade}. Diretriz: ${describeNarrativeSpeed(velocidade)}.`,
    `- Orcamento de beats: ${orcamentoDeBeats}. Trate isso como o tamanho esperado da aventura e distribua inicio, meio, escalada e desfecho sem esticar demais.`,
    `- Regra de turno: no maximo ${maxAcoesPorTurno} resposta(s) do Mestre por turno do jogador antes de encerrar ou concluir a batida.`
  ].join('\n');
}

// Mantem o logger ativo para futuras extensoes sem tree-shaking agressivo.
void log;
