/**
 * Helpers RPG — fórmulas compartilhadas entre frontend e backend.
 * Manter em sincronia com Backend/helpers/combateHelper.js
 */

/**
 * Calcula HP máximo de um personagem.
 * Fórmula: max(1, 10 + (nivel * 2) + (modConstituicao * nivel))
 * Sincronia com Backend/helpers/combateHelper.js → calcularHP()
 */
export function calcularHPMaximo(personagem) {
  const constituicao = personagem?.constituicao || 10;
  const nivel = personagem?.nivel || 1;
  const modCon = Math.floor((constituicao - 10) / 2);
  return Math.max(1, 10 + (nivel * 2) + (modCon * nivel));
}

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
