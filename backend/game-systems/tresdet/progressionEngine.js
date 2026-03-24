/**
 * Progression engine for 3D&T Alpha — PE (Pontos de Experiencia).
 * Pure functions — no DB access, no side effects.
 *
 * Manual rules:
 * - 1 PE per enemy defeated in fair combat
 * - 1 PE for completing mission alive
 * - 10 PE = 1 characteristic/vantagem point
 * - 1 PE = 100 Moedas
 */

/**
 * Calculate PE reward for defeating monsters in combat.
 * 3D&T: 1 PE per enemy defeated in fair combat.
 *
 * @param {Object[]} monstrosVencidos - array of defeated monsters
 * @returns {{ peTotal: number, detalhes: string[] }}
 */
export function calcularPECombate(monstrosVencidos) {
  if (!Array.isArray(monstrosVencidos) || monstrosVencidos.length === 0) {
    return { peTotal: 0, detalhes: [] };
  }

  let peTotal = 0;
  const detalhes = [];

  for (const m of monstrosVencidos) {
    const pe = 1;
    peTotal += pe;
    detalhes.push(`${m.nome || 'Monstro'}: +${pe} PE`);
  }

  return { peTotal, detalhes };
}

/**
 * Calculate what PE can buy.
 * @param {number} peDisponivel
 * @returns {Object} available conversions
 */
export function calcularConversoesPE(peDisponivel) {
  return {
    caracteristicas: Math.floor(peDisponivel / 10),
    moedas: peDisponivel * 100,
    magias: peDisponivel,
    autoSucessos: peDisponivel,
  };
}

/**
 * Convert PE to a specific reward.
 * @param {number} pe - PE to spend
 * @param {'caracteristica'|'tesouro'|'magia'|'auto_sucesso'} tipo
 * @returns {{ peGasto: number, ganho: string, detalhes: string } | null}
 */
export function converterPE(pe, tipo) {
  switch (tipo) {
    case 'caracteristica':
      if (pe < 10) return null;
      return { peGasto: 10, ganho: '+1 ponto de personagem', detalhes: 'Gastar 10 PE → +1 ponto (caracteristicas ou vantagens)' };
    case 'tesouro':
      if (pe < 1) return null;
      return { peGasto: 1, ganho: '+100 Moedas', detalhes: 'Gastar 1 PE → +100 Moedas' };
    case 'magia':
      if (pe < 1) return null;
      return { peGasto: 1, ganho: '+1 magia nova', detalhes: 'Gastar 1 PE → aprender uma magia nova' };
    case 'auto_sucesso':
      if (pe < 1) return null;
      return { peGasto: 1, ganho: 'Sucesso automatico', detalhes: 'Gastar 1 PE → sucesso automatico no proximo teste' };
    default:
      return null;
  }
}
