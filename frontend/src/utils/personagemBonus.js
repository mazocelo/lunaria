export const BONUS_ATTR_KEYS = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

function toNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function parseJsonIfNeeded(raw) {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeMap(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
  return target;
}

export function parseBonusMap(raw, allowedKeys = BONUS_ATTR_KEYS) {
  if (!raw) return null;

  const normalized = parseJsonIfNeeded(raw);
  if (!normalized) return null;

  const allowed = new Set(allowedKeys);

  if (Array.isArray(normalized)) {
    const merged = normalized.reduce((acc, entry) => {
      const parsed = parseBonusMap(entry, allowedKeys);
      return parsed ? mergeMap(acc, parsed) : acc;
    }, {});
    return Object.keys(merged).length > 0 ? merged : null;
  }

  if (isPlainObject(normalized) && 'atributo' in normalized && 'valor' in normalized) {
    const atributo = normalized.atributo;
    const value = toNumeric(normalized.valor);
    if (!allowed.has(atributo) || value == null || value === 0) return null;
    return { [atributo]: value };
  }

  if (isPlainObject(normalized)) {
    const mapped = {};
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

export function somarBonusAtributos(items, allowedKeys = BONUS_ATTR_KEYS) {
  const merged = (items || []).reduce((acc, item) => {
    const parsed = parseBonusMap(item?.bonus ?? item, allowedKeys);
    return parsed ? mergeMap(acc, parsed) : acc;
  }, {});
  return Object.keys(merged).length > 0 ? merged : {};
}

export function parseRacaClasseBonus(raw, allowedKeys = BONUS_ATTR_KEYS) {
  return parseBonusMap(raw, allowedKeys);
}

// --- Combat / Equipment bonus ---

export const COMBAT_BONUS_KEYS = ['ataque', 'dano', 'armadura', 'esquiva_bonus', 'esquiva_penalidade'];

const COMBAT_BONUS_ZERO = Object.freeze({ ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0, dc_esquiva: 0, absorcao: 0 });

export function agregarBonusEquipamentos(equipamentos) {
  if (!equipamentos?.length) return { ...COMBAT_BONUS_ZERO };
  return equipamentos.reduce((acc, eq) => {
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
