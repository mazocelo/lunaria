/**
 * Constantes do sistema Lunaria.
 * Fonte única para limites, atributos e valores base do sistema.
 */

export const ATRIBUTOS = [
  { id: 'forca',        nome: 'Força',        sigla: 'FOR', min: 1, max: 20 },
  { id: 'destreza',     nome: 'Destreza',     sigla: 'DEX', min: 1, max: 20 },
  { id: 'constituicao', nome: 'Constituição', sigla: 'CON', min: 1, max: 20 },
  { id: 'inteligencia', nome: 'Inteligência', sigla: 'INT', min: 1, max: 20 },
  { id: 'agilidade',    nome: 'Agilidade',    sigla: 'AGI', min: 1, max: 20 },
  { id: 'carisma',      nome: 'Carisma',      sigla: 'CAR', min: 1, max: 20 },
];

export const ATRIBUTO_IDS = ATRIBUTOS.map(a => a.id);

export const ATRIBUTO_BASE = 60;
export const NIVEL_MAX = 20;
export const HP_MULT_DEFAULT = 5;
export const MANA_BASE = 10;
export const MANA_MIN = 5;

export const STAT_MIN = 1;
export const STAT_MAX = 20;

export const CRIACAO_ATRIBUTO_MIN = 5;
export const CRIACAO_ATRIBUTO_MAX = 16;
export const CRIACAO_ATRIBUTO_TOTAL = 60;

export const VANTAGEM_BASE = 10;
