/**
 * Helper de Evolucao — port das formulas do backend para uso no frontend
 * Fonte: Backend/helpers/evolucaoHelper.js
 */

export const NIVEL_MAX = 20;

/**
 * XP necessario para ir do nivel atual para o proximo
 * Escala exponencial: 100 * 1.5^(nivel-1)
 */
export function xpParaNivel(nivel) {
  if (nivel >= NIVEL_MAX) return Number.POSITIVE_INFINITY;
  return Math.round(100 * Math.pow(1.5, nivel - 1));
}

/**
 * Tier maximo de vantagens/desvantagens desbloqueado
 * Nv1: 1, Nv5: 2, Nv9: 3, Nv13: 4, Nv17: 5
 */
export function tierDesbloqueado(nivel) {
  return 1 + Math.floor((Math.min(nivel, NIVEL_MAX) - 1) / 4);
}

/**
 * Nome do tier para exibicao
 */
export function nomeTier(tier) {
  const nomes = {
    1: 'Iniciante',
    2: 'Veterano',
    3: 'Elite',
    4: 'Mestre',
    5: 'Lendário'
  };
  return nomes[tier] || `Tier ${tier}`;
}
