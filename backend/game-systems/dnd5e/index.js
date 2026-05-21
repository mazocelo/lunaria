/**
 * D&D 5e (SRD) game engine — aggregates all sub-engines into a single object
 * matching the GameEngine interface defined in game-systems/interface.js.
 */

import {
  calcularHP,
  calcularMP,
  calcularAtaque,
  calcularDefesa,
  getAtributosBase,
  getProgressaoNivel,
  getSpellSlots,
  validarCriacao,
} from './characterEngine.js';

import {
  resolverAtaque,
  calcularIniciativa,
  resolverDeathSave,
} from './combatEngine.js';

import { resolverTeste } from './testEngine.js';

import {
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
} from './magiaEngine.js';

import { getRegrasMestrePrompt } from './prompts/regras.js';

const WIZARD_STAGES = [
  { id: 'boas_vindas',  titulo: 'The Call' },
  { id: 'raca',         titulo: 'Race' },
  { id: 'classe',       titulo: 'Class' },
  { id: 'background',   titulo: 'Background' },
  { id: 'atributos',    titulo: 'Ability Scores' },
  { id: 'skills',       titulo: 'Skills' },
  { id: 'equipamentos', titulo: 'Equipment' },
  { id: 'spells',       titulo: 'Spells' },
  { id: 'resumo',       titulo: 'Summary' },
];

function getWizardStages() {
  return WIZARD_STAGES;
}

/** @type {import('../interface.js').GameEngine} */
const dnd5eEngine = {
  resolverAtaque,
  calcularIniciativa,
  resolverTeste,
  calcularHP,
  calcularMP,
  calcularAtaque,
  calcularDefesa,
  getAtributosBase,
  getProgressaoNivel,
  getWizardStages,
  validarCriacao,
  getRegrasMestrePrompt,
  // D&D-specific extras
  resolverDeathSave,
  getSpellSlots,
  // contrato de magias (§5 spec H&M)
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
  // v2 interface stubs
  extrairBonusEquipamentos: () => { throw new Error('Not implemented: dnd5e.extrairBonusEquipamentos'); },
  buildCombatState: () => { throw new Error('Not implemented: dnd5e.buildCombatState'); },
  getIniciativaConfig: () => { throw new Error('Not implemented: dnd5e.getIniciativaConfig'); },
  resolverConsumo: () => { throw new Error('Not implemented: dnd5e.resolverConsumo'); },
};

export default dnd5eEngine;
