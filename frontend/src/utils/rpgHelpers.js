/**
 * Helpers RPG — fórmulas compartilhadas entre frontend e backend.
 * Manter em sincronia com Backend/helpers/combateHelper.js
 */

/**
 * Multiplicador de HP por raca (tamanho).
 * Sincronia com Backend/helpers/combateHelper.js → getMultRaca()
 */
const MULT_RACA = {
  'halfling': 4, 'gnomo': 4, 'kobold': 4, 'fada': 4, 'goblin': 4,
  'humano': 5, 'elfo': 5, 'meio-elfo': 5, 'anão': 6, 'meio-orc': 6,
  'tiefling': 5, 'aasimar': 5, 'primordiano': 5, 'meio-gênio': 5,
  'draconato': 6, 'goliath': 7, 'minotauro': 7, 'centauro': 7,
  'ogro': 8, 'troll': 8, 'gigante': 10,
};

function getMultRaca(racaNome) {
  if (!racaNome) return 5;
  return MULT_RACA[racaNome.toLowerCase()] || 5;
}

/**
 * Calcula HP máximo de um personagem.
 * Fórmula: multRaca × (nivel + max(1, modCON))
 * Sincronia com Backend/helpers/combateHelper.js → calcularHP()
 */
export function calcularHPMaximo(personagem) {
  const constituicao = personagem?.constituicao || 10;
  const nivel = personagem?.nivel || 1;
  const modCon = Math.floor((constituicao - 10) / 2);
  const racaNome = personagem?.raca_nome || personagem?.racas?.nome || personagem?.raca || '';
  const mult = getMultRaca(racaNome);
  return mult * (nivel + Math.max(1, modCon));
}

/**
 * Calcula mana máxima de um personagem.
 * Fórmula: 10 + nivel + max(modINT, modCHA) × 2
 * Sincronia com Backend/helpers/combateHelper.js → calcularMana()
 */
export function calcularMana(personagem) {
  const inteligencia = personagem?.inteligencia || 10;
  const carisma = personagem?.carisma || 10;
  const nivel = personagem?.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  const modCha = Math.floor((carisma - 10) / 2);
  return 10 + nivel + Math.max(modInt, modCha) * 2;
}
