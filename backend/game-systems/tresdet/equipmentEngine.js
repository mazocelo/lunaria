/**
 * Equipment bonus extraction for the 3D&T Alpha system.
 * Pure functions — no DB access, no side effects.
 *
 * Parses item names to extract mechanical bonuses.
 * 3D&T items don't have a structured `bonus` field — bonuses
 * are derived from the item name patterns defined in the manual.
 */

const EMPTY_BONUS = Object.freeze({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });

const ARMA_BONUS_RE = /^Arma Mágica: Bônus Mágico \+(\d+)$/i;
const ARMADURA_BONUS_RE = /^Armadura Mágica: Bônus Mágico \+(\d+)$/i;
const ARMA_VELOZ_RE = /^Arma Mágica: Veloz$/i;
const ARMA_ATAQUE_ESPECIAL_RE = /^Arma Mágica: Ataque Especial$/i;
const FLAGELO_RE = /^Arma Mágica: Flagelo \((.+)\)$/i;
const ARMADURA_EXTRA_RE = /^Armadura Mágica: Armadura Extra \((.+)\)$/i;
const INVULNERAVEL_RE = /^Armadura Mágica: Invulnerável \((.+)\)$/i;

function extrairBonusItem(item) {
  const nome = item?.nome || '';
  let match;

  match = nome.match(ARMA_BONUS_RE);
  if (match) {
    const n = parseInt(match[1], 10);
    return { F: n, PdF: n };
  }

  match = nome.match(ARMADURA_BONUS_RE);
  if (match) {
    const n = parseInt(match[1], 10);
    return { A: n };
  }

  if (ARMA_VELOZ_RE.test(nome)) {
    return { iniciativa: 2 };
  }

  if (ARMA_ATAQUE_ESPECIAL_RE.test(nome)) {
    return { especial: { tipo: 'ataque_especial', bonus: 2, usos: 1 } };
  }

  match = nome.match(FLAGELO_RE);
  if (match) {
    return { especial: { tipo: 'flagelo', alvo: match[1], bonus: 1 } };
  }

  match = nome.match(ARMADURA_EXTRA_RE);
  if (match) {
    return { especial: { tipo: 'armadura_extra', elemento: match[1] } };
  }

  match = nome.match(INVULNERAVEL_RE);
  if (match) {
    return { especial: { tipo: 'invulneravel', elemento: match[1] } };
  }

  return null;
}

/**
 * Aggregate equipment bonuses from equipped 3D&T items.
 * @param {Object[]|null} itensEquipados
 * @returns {{ F: number, PdF: number, A: number, H: number, iniciativa: number, especiais: Object[] }}
 */
export function extrairBonusEquipamentos(itensEquipados) {
  if (!Array.isArray(itensEquipados)) return { ...EMPTY_BONUS, especiais: [] };

  const resultado = { F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] };

  for (const item of itensEquipados) {
    const bonus = extrairBonusItem(item);
    if (!bonus) continue;

    resultado.F += bonus.F || 0;
    resultado.PdF += bonus.PdF || 0;
    resultado.A += bonus.A || 0;
    resultado.H += bonus.H || 0;
    resultado.iniciativa += bonus.iniciativa || 0;

    if (bonus.especial) {
      resultado.especiais.push(bonus.especial);
    }
  }

  return resultado;
}
