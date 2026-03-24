/**
 * Monster-only powers for 3D&T Alpha.
 * Pure functions — no DB access, no side effects.
 */

/**
 * Absorção: monster absorbs damage received. Next turn, deals that damage back.
 * @param {Object} monstro - monster state
 * @param {number} danoRecebido - damage taken this turn
 * @returns {{ danoAbsorvido: number, detalhes: string }}
 */
export function resolverAbsorcao(monstro, danoRecebido) {
  const danoAbsorvido = danoRecebido;
  return {
    danoAbsorvido,
    detalhes: `${monstro.nome} absorveu ${danoAbsorvido} de dano — devolverá no próximo turno`,
  };
}

/**
 * Ressurreição: when monster reaches 0 HP, it may respawn.
 * The monster regenerates from a body part that wasn't destroyed.
 * @param {Object} monstro - monster state
 * @returns {{ ressuscitou: boolean, hpRestaurado: number, detalhes: string }}
 */
export function resolverRessurreicao(monstro) {
  const hpMax = monstro.hp_max || 10;
  const hpRestaurado = Math.ceil(hpMax / 2);
  return {
    ressuscitou: true,
    hpRestaurado,
    detalhes: `${monstro.nome} se regenera a partir de restos do corpo — ressurge com ${hpRestaurado} PV!`,
  };
}

/**
 * Check if a monster has a specific power in its habilidades array.
 * @param {Object} monstro
 * @param {string} powerName - e.g., 'Absorção', 'Ressurreição'
 * @returns {Object|null} the matching habilidade or null
 */
export function temPoder(monstro, powerName) {
  const habs = monstro.habilidades;
  if (!Array.isArray(habs)) return null;
  return habs.find(h =>
    h.nome?.toLowerCase().includes(powerName.toLowerCase())
  ) || null;
}
