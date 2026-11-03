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

/**
 * Resolve os poderes de monstro acionados logo apos o monstro receber dano.
 * O helper aplica o dano base e delega aqui as regras 3D&T:
 *  - Absorção: acumula o dano recebido para devolver no proximo turno.
 *  - Ressurreição: se o monstro chegou a 0 PV e ainda nao ressuscitou, regenera;
 *    caso contrario marca como derrotado.
 *
 * Muta o estado de combate do monstro (`_danoAbsorvido`, `_jaRessuscitou`,
 * `hp`, `status`) — e o state machine dos poderes, nao cabe ao orquestrador.
 *
 * @param {Object} monstro - estado de combate do monstro (com `hp`/`hp_atual`)
 * @param {number} danoRecebido - dano aplicado neste golpe
 * @returns {{ danoAbsorvidoTotal: number|null, ressurreicao: Object|null }}
 */
export function aplicarPoderesPosDano(monstro, danoRecebido) {
  const resultado = { danoAbsorvidoTotal: null, ressurreicao: null };

  if (temPoder(monstro, 'Absorção')) {
    monstro._danoAbsorvido = (monstro._danoAbsorvido || 0) + danoRecebido;
    resultado.danoAbsorvidoTotal = monstro._danoAbsorvido;
  }

  const hp = monstro.hp ?? monstro.hp_atual ?? 0;
  if (hp <= 0) {
    if (temPoder(monstro, 'Ressurreição') && !monstro._jaRessuscitou) {
      const ress = resolverRessurreicao(monstro);
      monstro.hp = ress.hpRestaurado;
      monstro.status = 'vivo';
      monstro._jaRessuscitou = true;
      resultado.ressurreicao = ress;
    } else {
      monstro.status = 'derrotado';
    }
  }

  return resultado;
}

/**
 * Consome o dano acumulado pela Absorção (devolvido no inicio do turno do monstro).
 * Zera o acumulador e retorna o total a devolver.
 *
 * @param {Object} monstro - estado de combate do monstro
 * @returns {{ dano: number }}
 */
export function consumirDanoAbsorvido(monstro) {
  if (!temPoder(monstro, 'Absorção') || !(monstro._danoAbsorvido > 0)) {
    return { dano: 0 };
  }
  const dano = monstro._danoAbsorvido;
  monstro._danoAbsorvido = 0;
  return { dano };
}
