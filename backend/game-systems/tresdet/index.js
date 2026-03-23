/**
 * 3D&T Alpha game engine — aggregates all sub-engines into a single object
 * matching the GameEngine interface defined in game-systems/interface.js.
 */

import {
  calcularHP,
  calcularMP,
  calcularAtaque,
  calcularDefesa,
  getAtributosBase,
  getProgressaoNivel,
  validarCriacao,
} from './characterEngine.js';

import {
  resolverAtaque,
  calcularIniciativa,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
  processarDescansoTresDet,
  parseCustoPM,
} from './combatEngine.js';

import { extrairBonusEquipamentos } from './equipmentEngine.js';

import { resolverTeste } from './testEngine.js';

import { getRegrasMestrePrompt } from './prompts/regras.js';

const WIZARD_STAGES = [
  { id: 'boas_vindas',   titulo: 'O Chamado' },
  { id: 'conceito',      titulo: 'Conceito' },
  { id: 'caracteristicas', titulo: 'Caracteristicas' },
  { id: 'vantagens',     titulo: 'Vantagens' },
  { id: 'desvantagens',  titulo: 'Desvantagens' },
  { id: 'equipamentos',  titulo: 'Equipamentos' },
  { id: 'magias',        titulo: 'Magias' },
  { id: 'resumo',        titulo: 'Resumo' },
];

function getWizardStages() {
  return WIZARD_STAGES;
}

/** @type {import('../interface.js').GameEngine} */
const tresdetEngine = {
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
  // v2
  extrairBonusEquipamentos,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
  processarDescansoTresDet,
  parseCustoPM,
};

export default tresdetEngine;
