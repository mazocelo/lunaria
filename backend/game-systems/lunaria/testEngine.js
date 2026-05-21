/**
 * Test resolution for the Lunaria system.
 * Re-exports resolverTeste from combatEngine and adds helper utilities.
 *
 * Formulas extracted from testeHelper.js.
 */

export { resolverTeste } from './combatEngine.js';

/**
 * Modificador de atributo: floor((valor - 10) / 2)
 */
export function calcularModificador(valorAtributo) {
  return Math.floor(((valorAtributo || 10) - 10) / 2);
}

/**
 * Bônus de nível para testes: min(2, floor(nivel / 6))
 * Nv1-5: +0, Nv6-11: +1, Nv12-20: +2
 */
export function calcularBonusNivel(nivel) {
  return Math.min(2, Math.floor((nivel || 1) / 6));
}

/**
 * Calcula modificador total de um atributo + nível para um teste.
 * Não rola dado, apenas retorna o bônus total.
 *
 * @param {Object} personagem - Dados do personagem
 * @param {string} atributo - Nome do atributo
 * @returns {{ modificador: number, bonusNivel: number, total: number }}
 */
export function calcularModificadorTotal(personagem, atributo) {
  const attrs = personagem.atributos || {};
  const valor = personagem[atributo] ?? attrs[atributo] ?? 10;
  const modificador = calcularModificador(valor);
  const bonusNivel = calcularBonusNivel(personagem.nivel || 1);
  return {
    modificador,
    bonusNivel,
    total: modificador + bonusNivel,
  };
}
