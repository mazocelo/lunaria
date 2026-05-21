/**
 * Constantes do sistema D&D 5e (SRD).
 * Fonte unica para abilities, proficiency, spell slots e dados do sistema.
 */

export const ABILITIES = [
  { id: 'STR', nome: 'Strength', sigla: 'STR', min: 3, max: 20 },
  { id: 'DEX', nome: 'Dexterity', sigla: 'DEX', min: 3, max: 20 },
  { id: 'CON', nome: 'Constitution', sigla: 'CON', min: 3, max: 20 },
  { id: 'INT', nome: 'Intelligence', sigla: 'INT', min: 3, max: 20 },
  { id: 'WIS', nome: 'Wisdom', sigla: 'WIS', min: 3, max: 20 },
  { id: 'CHA', nome: 'Charisma', sigla: 'CHA', min: 3, max: 20 },
];

export const ABILITY_IDS = ABILITIES.map(a => a.id);

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_TOTAL = 27;
export const POINT_BUY_COSTS = { 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 };

export const NIVEL_MAX = 20;

// Proficiency bonus by level
export const PROFICIENCY_BONUS = {
  1:2, 2:2, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3,
  9:4, 10:4, 11:4, 12:4, 13:5, 14:5, 15:5, 16:5,
  17:6, 18:6, 19:6, 20:6
};

// Full caster spell slots by level (levels 1-20)
export const FULL_CASTER_SLOTS = {
  1:  [2,0,0,0,0,0,0,0,0],
  2:  [3,0,0,0,0,0,0,0,0],
  3:  [4,2,0,0,0,0,0,0,0],
  4:  [4,3,0,0,0,0,0,0,0],
  5:  [4,3,2,0,0,0,0,0,0],
  6:  [4,3,3,0,0,0,0,0,0],
  7:  [4,3,3,1,0,0,0,0,0],
  8:  [4,3,3,2,0,0,0,0,0],
  9:  [4,3,3,3,1,0,0,0,0],
  10: [4,3,3,3,2,0,0,0,0],
  11: [4,3,3,3,2,1,0,0,0],
  12: [4,3,3,3,2,1,0,0,0],
  13: [4,3,3,3,2,1,1,0,0],
  14: [4,3,3,3,2,1,1,0,0],
  15: [4,3,3,3,2,1,1,1,0],
  16: [4,3,3,3,2,1,1,1,0],
  17: [4,3,3,3,2,1,1,1,1],
  18: [4,3,3,3,3,1,1,1,1],
  19: [4,3,3,3,3,2,1,1,1],
  20: [4,3,3,3,3,2,2,1,1],
};

// Half caster slots (Paladin, Ranger) - start at level 2
export const HALF_CASTER_SLOTS = {
  1:  [0,0,0,0,0],
  2:  [2,0,0,0,0],
  3:  [3,0,0,0,0],
  4:  [3,0,0,0,0],
  5:  [4,2,0,0,0],
  6:  [4,2,0,0,0],
  7:  [4,3,0,0,0],
  8:  [4,3,0,0,0],
  9:  [4,3,2,0,0],
  10: [4,3,2,0,0],
  11: [4,3,3,0,0],
  12: [4,3,3,0,0],
  13: [4,3,3,1,0],
  14: [4,3,3,1,0],
  15: [4,3,3,2,0],
  16: [4,3,3,2,0],
  17: [4,3,3,3,1],
  18: [4,3,3,3,1],
  19: [4,3,3,3,2],
  20: [4,3,3,3,2],
};

// Hit dice by class
export const HIT_DICE = {
  barbarian: 12, bard: 8, cleric: 8, druid: 8, fighter: 10,
  monk: 8, paladin: 10, ranger: 10, rogue: 8,
  sorcerer: 6, warlock: 8, wizard: 6
};

// ASI levels (standard classes)
export const ASI_LEVELS = [4, 8, 12, 16, 19];

// 18 skills mapped to abilities
export const SKILLS = [
  { id: 'acrobatics', nome: 'Acrobatics', ability: 'DEX' },
  { id: 'animal_handling', nome: 'Animal Handling', ability: 'WIS' },
  { id: 'arcana', nome: 'Arcana', ability: 'INT' },
  { id: 'athletics', nome: 'Athletics', ability: 'STR' },
  { id: 'deception', nome: 'Deception', ability: 'CHA' },
  { id: 'history', nome: 'History', ability: 'INT' },
  { id: 'insight', nome: 'Insight', ability: 'WIS' },
  { id: 'intimidation', nome: 'Intimidation', ability: 'CHA' },
  { id: 'investigation', nome: 'Investigation', ability: 'INT' },
  { id: 'medicine', nome: 'Medicine', ability: 'WIS' },
  { id: 'nature', nome: 'Nature', ability: 'INT' },
  { id: 'perception', nome: 'Perception', ability: 'WIS' },
  { id: 'performance', nome: 'Performance', ability: 'CHA' },
  { id: 'persuasion', nome: 'Persuasion', ability: 'CHA' },
  { id: 'religion', nome: 'Religion', ability: 'INT' },
  { id: 'sleight_of_hand', nome: 'Sleight of Hand', ability: 'DEX' },
  { id: 'stealth', nome: 'Stealth', ability: 'DEX' },
  { id: 'survival', nome: 'Survival', ability: 'WIS' },
];

// SRD Classes with spellcasting type
export const SRD_CLASSES = {
  barbarian: { hitDie: 12, spellcasting: null, savingThrows: ['STR','CON'] },
  bard: { hitDie: 8, spellcasting: 'full', castingAbility: 'CHA', savingThrows: ['DEX','CHA'] },
  cleric: { hitDie: 8, spellcasting: 'full', castingAbility: 'WIS', savingThrows: ['WIS','CHA'] },
  druid: { hitDie: 8, spellcasting: 'full', castingAbility: 'WIS', savingThrows: ['INT','WIS'] },
  fighter: { hitDie: 10, spellcasting: null, savingThrows: ['STR','CON'] },
  monk: { hitDie: 8, spellcasting: null, savingThrows: ['STR','DEX'] },
  paladin: { hitDie: 10, spellcasting: 'half', castingAbility: 'CHA', savingThrows: ['WIS','CHA'] },
  ranger: { hitDie: 10, spellcasting: 'half', castingAbility: 'WIS', savingThrows: ['STR','DEX'] },
  rogue: { hitDie: 8, spellcasting: null, savingThrows: ['DEX','INT'] },
  sorcerer: { hitDie: 6, spellcasting: 'full', castingAbility: 'CHA', savingThrows: ['CON','CHA'] },
  warlock: { hitDie: 8, spellcasting: 'pact', castingAbility: 'CHA', savingThrows: ['WIS','CHA'] },
  wizard: { hitDie: 6, spellcasting: 'full', castingAbility: 'INT', savingThrows: ['INT','WIS'] },
};
