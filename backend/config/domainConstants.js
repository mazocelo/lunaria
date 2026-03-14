/**
 * Fonte canônica de constantes de domínio mecânico.
 * Espelha a tabela `elementos` do DB e centraliza literals
 * que antes viviam inline em combateHelper, acoesProcessor, etc.
 *
 * Regra: qualquer string de domínio usada em mais de 1 arquivo
 * deve ser importada daqui — nunca hardcoded.
 */

// ── Elementos (espelho de sql/migrate_create_elementos.sql) ──────────

export const ELEMENTOS = [
  'fogo', 'gelo', 'eletrico', 'acido', 'veneno', 'sonico',
  'radiante', 'necrotico', 'sombrio', 'psiquico', 'arcano',
  'divino', 'natureza', 'agua', 'terra', 'vento',
  'contundente', 'cortante', 'perfurante',
];

export const ELEMENTOS_SET = new Set(ELEMENTOS);

/** Aliases legados que podem chegar da IA e devem ser normalizados */
export const ELEMENTO_ALIASES = {
  sagrado:   'radiante',
  fisico:    'contundente',
  'elétrico': 'eletrico',
  'psíquico': 'psiquico',
  'sônico':   'sonico',
  holy:       'radiante',
  fire:       'fogo',
  ice:        'gelo',
  lightning:  'eletrico',
  poison:     'veneno',
};

/**
 * Normaliza um nome de elemento: resolve alias e valida contra tabela canônica.
 * @param {string|null} raw
 * @returns {string|null} elemento canônico ou null se inválido
 */
export function normalizarElemento(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  if (ELEMENTOS_SET.has(key)) return key;
  return ELEMENTO_ALIASES[key] || null;
}

// ── Status effects com mecânica real ─────────────────────────────────

/** Status que impedem o personagem de agir no turno */
export const STATUS_IMPEDE_ACAO = ['atordoado', 'paralisado', 'congelado'];

/** Status com dano por turno: nome → notação de dado */
export const STATUS_DANO_POR_TURNO = {
  envenenado: '1d4',
  queimando:  '1d6',
};

/** Status com penalidade de ataque: nome → valor da penalidade */
export const STATUS_PENALIDADE_ATAQUE = {
  cego: 5,
};

/** Todos os status com handler mecânico */
export const STATUS_MECANICOS = [
  ...STATUS_IMPEDE_ACAO,
  ...Object.keys(STATUS_DANO_POR_TURNO),
  ...Object.keys(STATUS_PENALIDADE_ATAQUE),
];

// ── Tamanhos de monstro ──────────────────────────────────────────────

export const TAMANHO_MODS = {
  minusculo:    { armadura: -2, esquiva: 10 },
  pequeno:      { armadura: -1, esquiva: 5 },
  medio:        { armadura: 0,  esquiva: 0 },
  grande:       { armadura: 3,  esquiva: -5 },
  enorme:       { armadura: 5,  esquiva: -10 },
  gargantuesco: { armadura: 7,  esquiva: -13 },
  colossal:     { armadura: 8,  esquiva: -15 },
};

// ── Resultado e status de combate ────────────────────────────────────

export const RESULTADO_COMBATE = {
  VITORIA: 'vitoria',
  DERROTA: 'derrota',
  FUGA:    'fuga',
};

export const STATUS_COMBATENTE = {
  VIVO:         'vivo',
  DERROTADO:    'derrotado',
  INCONSCIENTE: 'inconsciente',
};

// ── Tipos de habilidade de monstro (Zod enum source) ─────────────────

export const TIPO_HABILIDADE_MONSTRO = ['ofensiva', 'suporte', 'defensiva'];
