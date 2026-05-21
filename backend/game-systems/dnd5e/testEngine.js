/**
 * Test resolution for the D&D 5e system (SRD).
 * Pure functions — no DB access, no side effects.
 *
 * Ability/skill check: d20 + ability mod + proficiency (if proficient) vs DC
 * Advantage: roll 2d20, take higher
 * Disadvantage: roll 2d20, take lower
 */

import { getAtributo } from '../../helpers/atributosHelper.js';
import { PROFICIENCY_BONUS } from './constants.js';

function rolarD20() { return Math.floor(Math.random() * 20) + 1; }

/**
 * Resolve ability check or skill check.
 *
 * @param {Object} personagem - Character data
 * @param {string} atributo - Ability or skill id (e.g. 'STR', 'perception')
 * @param {number} dc - Difficulty class
 * @param {Object} [options] - { advantage, disadvantage }
 * @returns {{ sucesso: boolean, rolagem: number, total: number, dc: number, detalhes: string }}
 */
export function resolverTeste(personagem, atributo, dc, options = {}) {
  const score = getAtributo(personagem, atributo, 10);
  const mod = Math.floor((score - 10) / 2);
  const nivel = personagem.nivel || 1;
  const prof = PROFICIENCY_BONUS[nivel] || 2;

  const proficiencies = personagem.stats_sistema?.proficiencies || [];
  const isProficient = proficiencies.includes(atributo);
  const profBonus = isProficient ? prof : 0;

  const advantage = options.advantage || false;
  const disadvantage = options.disadvantage || false;

  let rolagem;
  if (advantage && !disadvantage) {
    const r1 = rolarD20(), r2 = rolarD20();
    rolagem = Math.max(r1, r2);
  } else if (disadvantage && !advantage) {
    const r1 = rolarD20(), r2 = rolarD20();
    rolagem = Math.min(r1, r2);
  } else {
    rolagem = rolarD20();
  }

  const total = rolagem + mod + profBonus;
  const sucesso = total >= dc;

  return {
    sucesso, rolagem, total, dc,
    detalhes: `d20(${rolagem})+${mod}${profBonus ? `+${profBonus}(prof)` : ''}=${total} vs DC${dc}`,
  };
}
