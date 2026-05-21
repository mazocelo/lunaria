/**
 * Helpers RPG — fórmulas compartilhadas entre frontend e backend.
 * Manter em sincronia com Backend/helpers/combateHelper.js
 */

/**
 * Multiplicador de HP por raca (tamanho).
 * Sincronia com Backend/helpers/combateHelper.js → getMultRaca()
 */
const MULT_RACA = {
  'humano': 5, 'anão': 6, 'elfo': 4, 'elfo negro': 4, 'meio-elfo': 5,
  'halfling': 4, 'gnomo': 4, 'orc': 7, 'meio-orc': 6, 'tiefling': 5,
  'draconato': 7, 'aasimar': 5, 'primordiano': 5, 'anfíbio': 5, 'centauro': 7,
  'minotauro': 7, 'kythari': 5, 'kemono': 5, 'pardalino': 4, 'kobold': 3,
  'goblin': 3, 'hobgoblin': 5, 'bugbear': 6, 'meio-dragão': 7,
  'ogro': 8, 'meio-ogro': 7, 'troglodita': 5, 'verdeante': 5,
  'cristálide': 5, 'anjo': 6, 'demônio': 6, 'meio-abissal': 6,
  'meio-celestial': 6, 'fada': 3, 'licantropo': 7, 'meio-gênio': 6,
  'silvagante': 7, 'deva': 6, 'androide': 6, 'golem': 9,
};

function getMultRaca(racaNome) {
  if (!racaNome) return 5;
  return MULT_RACA[racaNome.toLowerCase()] || 5;
}

/**
 * Calcula HP máximo de um personagem.
 * Lunaria: multRaca × (nivel + max(1, modCON))
 * 3D&T: R × 5 (minimo 1)
 * Sincronia com Backend/helpers/combateHelper.js → calcularHP()
 */
export function calcularHPMaximo(personagem) {
  if (personagem?.sistema === 'tresdet') {
    const R = Number(personagem?.atributos?.R ?? personagem?.R ?? 0) || 0;
    return Math.max(1, R * 5);
  }
  const constituicao = personagem?.constituicao || 10;
  const nivel = personagem?.nivel || 1;
  const modCon = Math.floor((constituicao - 10) / 2);
  const racaNome = personagem?.raca_nome || personagem?.racas?.nome || personagem?.raca || '';
  const mult = getMultRaca(racaNome);
  return mult * (nivel + Math.max(1, modCon));
}

/**
 * Calcula mana máxima de um personagem.
 * Lunaria: 10 + nivel + max(modINT, modCHA) × 2
 * 3D&T: R × 5 (somente se tem vantagem Magia)
 * Sincronia com Backend/helpers/combateHelper.js → calcularMana()
 */
export function calcularMana(personagem) {
  if (personagem?.sistema === 'tresdet') {
    if (!personagem?.stats_sistema?.temMagia) return 0;
    const R = Number(personagem?.atributos?.R ?? personagem?.R ?? 0) || 0;
    return Math.max(1, R * 5);
  }
  const inteligencia = personagem?.inteligencia || 10;
  const carisma = personagem?.carisma || 10;
  const nivel = personagem?.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  const modCha = Math.floor((carisma - 10) / 2);
  return 10 + nivel + Math.max(modInt, modCha) * 2;
}

export function getDnd5eProficiencyBonus(nivel) {
  if (nivel <= 4) return 2;
  if (nivel <= 8) return 3;
  if (nivel <= 12) return 4;
  if (nivel <= 16) return 5;
  return 6;
}
export function getDnd5eModifier(score) {
  return Math.floor(((score || 10) - 10) / 2);
}
export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
