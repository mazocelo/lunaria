/**
 * Combat mechanics for the D&D 5e system (SRD).
 * Pure functions — no DB access, no side effects.
 */

import { getAtributo } from '../../helpers/atributosHelper.js';
import { PROFICIENCY_BONUS } from './constants.js';

function rolarD20() { return Math.floor(Math.random() * 20) + 1; }

function getModifier(entity, ability) {
  const score = getAtributo(entity, ability, 10);
  return Math.floor((score - 10) / 2);
}

function getProficiencyBonus(nivel) {
  return PROFICIENCY_BONUS[nivel] || 2;
}

/**
 * D&D 5e attack resolution.
 * d20 + ability mod + proficiency vs AC
 * Nat 20 = critical hit (double damage dice)
 * Nat 1 = automatic miss
 */
export function resolverAtaque(atacante, defensor, acao = {}) {
  const nivel = atacante.nivel || 1;
  const prof = getProficiencyBonus(nivel);

  const isRanged = acao.tipo === 'ranged';
  const isSpell = acao.tipo === 'spell';
  let abilityMod;

  if (isSpell) {
    const castingAbility = atacante.stats_sistema?.castingAbility || 'INT';
    abilityMod = getModifier(atacante, castingAbility);
  } else {
    abilityMod = isRanged ? getModifier(atacante, 'DEX') : getModifier(atacante, 'STR');
  }

  const advantage = acao.advantage || false;
  const disadvantage = acao.disadvantage || false;

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

  const totalAtaque = rolagem + abilityMod + prof;
  const ac = defensor.stats_sistema?.ac || (10 + getModifier(defensor, 'DEX'));
  const critico = rolagem === 20;
  const fumble = rolagem === 1;
  const acertou = fumble ? false : (critico || totalAtaque >= ac);

  return {
    acertou, critico, fumble, rolagem, totalAtaque, ac,
    detalhes: `d20(${rolagem})+${abilityMod}+${prof}=${totalAtaque} vs AC ${ac}${critico ? ' CRITICAL!' : ''}${fumble ? ' FUMBLE!' : ''}`,
  };
}

/**
 * Iniciativa: d20 + DEX modifier
 */
export function calcularIniciativa(personagem) {
  return rolarD20() + getModifier(personagem, 'DEX');
}

/**
 * Death saving throw.
 * d20: >=10 success, <10 failure. Nat 1 = 2 failures. Nat 20 = regain 1 HP.
 */
export function resolverDeathSave() {
  const rolagem = rolarD20();
  if (rolagem === 20) return { tipo: 'nat20', rolagem, detalhes: 'Nat 20! Volta com 1 HP' };
  if (rolagem === 1) return { tipo: 'nat1', rolagem, detalhes: 'Nat 1! 2 falhas' };
  if (rolagem >= 10) return { tipo: 'sucesso', rolagem, detalhes: `d20(${rolagem}) >= 10: Sucesso` };
  return { tipo: 'falha', rolagem, detalhes: `d20(${rolagem}) < 10: Falha` };
}
