/**
 * Helpers RPG — fórmulas compartilhadas entre frontend e backend.
 * Manter em sincronia com Backend/helpers/combateHelper.js
 */

/**
 * Calcula mana máxima de um personagem.
 * Fórmula: max(5, 10 + nivel + modInteligencia * 2)
 */
export function calcularMana(personagem) {
  const inteligencia = personagem?.inteligencia || 10;
  const nivel = personagem?.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  return Math.max(5, 10 + nivel + modInt * 2);
}
