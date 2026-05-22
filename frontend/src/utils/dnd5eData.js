/**
 * Fonte de dados D&D 5e (SRD) para o wizard de criacao de personagem.
 *
 * Arquivo de dados puro: sem JSX, sem React. Os `id`/slugs tecnicos ficam em
 * ingles para casar com o backend (`game-systems/dnd5e/constants.js`); apenas a
 * copy de usuario (`nome`) esta em PT-BR.
 */

// As 18 pericias D&D 5e. id/ability identicos a SKILLS do backend.
export const SKILLS = [
  { id: 'acrobatics', nome: 'Acrobacia', ability: 'DEX' },
  { id: 'animal_handling', nome: 'Lidar com Animais', ability: 'WIS' },
  { id: 'arcana', nome: 'Arcanismo', ability: 'INT' },
  { id: 'athletics', nome: 'Atletismo', ability: 'STR' },
  { id: 'deception', nome: 'Enganação', ability: 'CHA' },
  { id: 'history', nome: 'História', ability: 'INT' },
  { id: 'insight', nome: 'Intuição', ability: 'WIS' },
  { id: 'intimidation', nome: 'Intimidação', ability: 'CHA' },
  { id: 'investigation', nome: 'Investigação', ability: 'INT' },
  { id: 'medicine', nome: 'Medicina', ability: 'WIS' },
  { id: 'nature', nome: 'Natureza', ability: 'INT' },
  { id: 'perception', nome: 'Percepção', ability: 'WIS' },
  { id: 'performance', nome: 'Atuação', ability: 'CHA' },
  { id: 'persuasion', nome: 'Persuasão', ability: 'CHA' },
  { id: 'religion', nome: 'Religião', ability: 'INT' },
  { id: 'sleight_of_hand', nome: 'Prestidigitação', ability: 'DEX' },
  { id: 'stealth', nome: 'Furtividade', ability: 'DEX' },
  { id: 'survival', nome: 'Sobrevivência', ability: 'WIS' },
];

// Pericias disponiveis por classe e quantidade escolhivel.
// Slugs de classe identicos a SRD_CLASSES do backend.
export const CLASS_SKILL_OPTIONS = {
  barbarian: { skills: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], count: 2 },
  bard: { skills: SKILLS.map((s) => s.id), count: 3 },
  cleric: { skills: ['history', 'insight', 'medicine', 'persuasion', 'religion'], count: 2 },
  druid: { skills: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], count: 2 },
  fighter: { skills: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], count: 2 },
  monk: { skills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], count: 2 },
  paladin: { skills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], count: 2 },
  ranger: { skills: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], count: 3 },
  rogue: { skills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'], count: 4 },
  sorcerer: { skills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], count: 2 },
  warlock: { skills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], count: 2 },
  wizard: { skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], count: 2 },
};

// Standard array de atributos D&D 5e.
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Os 6 atributos. id identico a ABILITIES do backend.
export const ABILITIES = [
  { id: 'STR', nome: 'Força' },
  { id: 'DEX', nome: 'Destreza' },
  { id: 'CON', nome: 'Constituição' },
  { id: 'INT', nome: 'Inteligência' },
  { id: 'WIS', nome: 'Sabedoria' },
  { id: 'CHA', nome: 'Carisma' },
];

// Slugs das classes conjuradoras (spellcasting nao-nulo no backend).
export const SPELLCASTER_CLASSES = [
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard',
];
