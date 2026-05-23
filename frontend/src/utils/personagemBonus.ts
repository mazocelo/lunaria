export const BONUS_ATTR_KEYS = [
  'forca',
  'destreza',
  'constituicao',
  'inteligencia',
  'agilidade',
  'carisma',
] as const;

/**
 * Mapa de bonus de atributos. Chaves variam pelas `allowedKeys` recebidas —
 * default cobre Lunaria/D&D. Valores sao deltas inteiros (positivos ou
 * negativos), nunca zero (zeros sao filtrados pelo parser).
 */
export type BonusMap = Record<string, number>;

/**
 * Conjunto de bonus de combate agregados de equipamentos. Os campos `dc_esquiva`
 * e `absorcao` sao aliases novos para `esquiva_bonus`/`armadura` (manter ambos
 * por compatibilidade com componentes antigos que ainda leem o nome antigo).
 */
export interface CombatBonus {
  ataque: number;
  dano: number;
  armadura: number;
  esquiva_bonus: number;
  esquiva_penalidade: number;
  dc_esquiva: number;
  absorcao: number;
}

interface EquipamentoBonus {
  bonus?: {
    ataque?: number | string;
    dano?: number | string;
    armadura?: number | string;
    esquiva_bonus?: number | string;
    esquiva_penalidade?: number | string;
    [key: string]: unknown;
  };
}

function toNumeric(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function parseJsonIfNeeded(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeMap(target: BonusMap, source: BonusMap): BonusMap {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
  return target;
}

export function parseBonusMap(
  raw: unknown,
  allowedKeys: readonly string[] = BONUS_ATTR_KEYS
): BonusMap | null {
  if (!raw) return null;

  const normalized = parseJsonIfNeeded(raw);
  if (!normalized) return null;

  const allowed = new Set(allowedKeys);

  if (Array.isArray(normalized)) {
    const merged = normalized.reduce<BonusMap>((acc, entry) => {
      const parsed = parseBonusMap(entry, allowedKeys);
      return parsed ? mergeMap(acc, parsed) : acc;
    }, {});
    return Object.keys(merged).length > 0 ? merged : null;
  }

  if (isPlainObject(normalized) && 'atributo' in normalized && 'valor' in normalized) {
    const atributo = normalized.atributo;
    const value = toNumeric(normalized.valor);
    if (typeof atributo !== 'string' || !allowed.has(atributo) || value == null || value === 0) {
      return null;
    }
    return { [atributo]: value };
  }

  if (isPlainObject(normalized)) {
    const mapped: BonusMap = {};
    for (const [key, value] of Object.entries(normalized)) {
      if (!allowed.has(key)) continue;
      const numeric = toNumeric(value);
      if (numeric == null || numeric === 0) continue;
      mapped[key] = numeric;
    }
    return Object.keys(mapped).length > 0 ? mapped : null;
  }

  return null;
}

/**
 * Soma os bonus de varios itens (vantagens, tracos, etc.). Cada item pode ter
 * o bonus no campo `.bonus` ou ser ele proprio o mapa cru — espelha o que a
 * View envia em `PersonagemPreviewCard`/`useBonusCalculation`.
 */
export function somarBonusAtributos(
  items: unknown[] | null | undefined,
  allowedKeys: readonly string[] = BONUS_ATTR_KEYS
): BonusMap {
  const merged = (items || []).reduce<BonusMap>((acc, item) => {
    const raw = isPlainObject(item) && 'bonus' in item ? item.bonus : item;
    const parsed = parseBonusMap(raw, allowedKeys);
    return parsed ? mergeMap(acc, parsed) : acc;
  }, {});
  return Object.keys(merged).length > 0 ? merged : {};
}

export function parseRacaClasseBonus(
  raw: unknown,
  allowedKeys: readonly string[] = BONUS_ATTR_KEYS
): BonusMap | null {
  return parseBonusMap(raw, allowedKeys);
}

// --- Combat / Equipment bonus ---

export const COMBAT_BONUS_KEYS = [
  'ataque',
  'dano',
  'armadura',
  'esquiva_bonus',
  'esquiva_penalidade',
] as const;

const COMBAT_BONUS_ZERO: Readonly<CombatBonus> = Object.freeze({
  ataque: 0,
  dano: 0,
  armadura: 0,
  esquiva_bonus: 0,
  esquiva_penalidade: 0,
  dc_esquiva: 0,
  absorcao: 0,
});

export function agregarBonusEquipamentos(
  equipamentos: EquipamentoBonus[] | null | undefined
): CombatBonus {
  if (!equipamentos?.length) return { ...COMBAT_BONUS_ZERO };
  return equipamentos.reduce<CombatBonus>((acc, eq) => {
    const b = eq.bonus || {};
    const esquivaBonus = Number(b.esquiva_bonus) || 0;
    const armaduraBonus = Number(b.armadura) || 0;
    return {
      ataque: acc.ataque + (Number(b.ataque) || 0),
      dano: acc.dano + (Number(b.dano) || 0),
      armadura: acc.armadura + armaduraBonus,
      esquiva_bonus: acc.esquiva_bonus + esquivaBonus,
      esquiva_penalidade: acc.esquiva_penalidade + (Number(b.esquiva_penalidade) || 0),
      // New system aliases
      dc_esquiva: acc.dc_esquiva + esquivaBonus,
      absorcao: acc.absorcao + armaduraBonus,
    };
  }, { ...COMBAT_BONUS_ZERO });
}
