/**
 * Agrega bonus de uma lista de equipamentos.
 * @param {Array} equipamentos - Lista de equipamentos com campo `bonus`
 * @returns {{ ataque: number, dano: number, armadura: number, esquiva_bonus: number, esquiva_penalidade: number }}
 */
export function agregarBonus(equipamentos) {
  if (!equipamentos?.length) return { ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 };
  return equipamentos.reduce((acc, eq) => {
    const b = eq.bonus || {};
    return {
      ataque: acc.ataque + (b.ataque || 0),
      dano: acc.dano + (b.dano || 0),
      armadura: acc.armadura + (b.armadura || 0),
      esquiva_bonus: acc.esquiva_bonus + (b.esquiva_bonus || 0),
      esquiva_penalidade: acc.esquiva_penalidade + (b.esquiva_penalidade || 0),
    };
  }, { ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 });
}
