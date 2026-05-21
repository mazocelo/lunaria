/**
 * Character mechanics for the D&D 5e system (SRD).
 * Pure functions — no DB access, no side effects.
 */

import { getAtributo } from '../../helpers/atributosHelper.js';
import {
  ABILITIES,
  PROFICIENCY_BONUS,
  HIT_DICE,
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  STANDARD_ARRAY,
  POINT_BUY_TOTAL,
  POINT_BUY_COSTS,
} from './constants.js';

function getModifier(entity, ability) {
  const score = getAtributo(entity, ability, 10);
  return Math.floor((score - 10) / 2);
}

/**
 * HP = hitDie + CON mod (level 1) + (avg(hitDie) + 1 + CON mod) per level after 1st.
 * Minimum 1 HP.
 */
export function calcularHP(personagem) {
  const nivel = personagem.nivel || 1;
  const modCON = getModifier(personagem, 'CON');
  const classeKey = personagem.stats_sistema?.classeKey || 'fighter';
  const hitDie = HIT_DICE[classeKey] || 10;

  const hpLevel1 = hitDie + modCON;
  const avgPerLevel = Math.floor(hitDie / 2) + 1 + modCON;
  return Math.max(1, hpLevel1 + avgPerLevel * (nivel - 1));
}

/**
 * D&D uses spell slots, not mana. Returns 0.
 * Spell slots are handled via stats_sistema and getSpellSlots().
 */
export function calcularMP() {
  return 0;
}

/**
 * Attack bonus = max(STR mod, DEX mod) + proficiency bonus.
 */
export function calcularAtaque(personagem) {
  const nivel = personagem.nivel || 1;
  const prof = PROFICIENCY_BONUS[nivel] || 2;
  const modSTR = getModifier(personagem, 'STR');
  const modDEX = getModifier(personagem, 'DEX');
  return Math.max(modSTR, modDEX) + prof;
}

/**
 * AC = stats_sistema.ac or 10 + DEX modifier (unarmored).
 */
export function calcularDefesa(personagem) {
  return personagem.stats_sistema?.ac || (10 + getModifier(personagem, 'DEX'));
}

export function getAtributosBase() {
  return ABILITIES;
}

export function getProgressaoNivel(nivel) {
  return {
    proficiencyBonus: PROFICIENCY_BONUS[nivel] || 2,
    isASI: [4, 8, 12, 16, 19].includes(nivel),
  };
}

export function getSpellSlots(nivel, spellcasting) {
  if (!spellcasting || spellcasting === 'none') return [];
  if (spellcasting === 'full') return FULL_CASTER_SLOTS[nivel] || [];
  if (spellcasting === 'half') return HALF_CASTER_SLOTS[nivel] || [];
  return [];
}

/**
 * Validates character creation ability scores.
 * Supports standard_array and point_buy methods.
 */
export function validarCriacao(dados) {
  const erros = [];
  const scores = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(a => dados[a] || 10);

  if (dados.metodo === 'standard_array') {
    const sorted = [...scores].sort((a, b) => b - a);
    const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);
    if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
      erros.push('Standard Array deve usar os valores: 15, 14, 13, 12, 10, 8');
    }
  } else if (dados.metodo === 'point_buy') {
    const totalCost = scores.reduce((sum, s) => sum + (POINT_BUY_COSTS[s] ?? 99), 0);
    if (totalCost > POINT_BUY_TOTAL) erros.push(`Point Buy excede ${POINT_BUY_TOTAL} pontos: ${totalCost}`);
    if (scores.some(s => s < 8 || s > 15)) erros.push('Point Buy: scores devem estar entre 8 e 15');
  }

  return { valido: erros.length === 0, erros };
}
