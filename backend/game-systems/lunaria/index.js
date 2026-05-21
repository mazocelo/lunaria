/**
 * Lunaria game engine — aggregates all sub-engines into a single object
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
  resolverTeste,
  extrairBonusEquipamentos,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
} from './combatEngine.js';

import {
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
} from './magiaEngine.js';

import { getRegrasMestrePrompt } from './prompts/regras.js';

const WIZARD_STAGES = [
  { id: 'boas_vindas', titulo: 'Boas-vindas' },
  { id: 'raca',        titulo: 'Raça' },
  { id: 'classe',      titulo: 'Classe' },
  { id: 'background',  titulo: 'Background' },
  { id: 'desvantagens', titulo: 'Desvantagens' },
  { id: 'vantagens',   titulo: 'Vantagens' },
  { id: 'atributos',   titulo: 'Atributos' },
  { id: 'equipamentos', titulo: 'Equipamentos' },
  { id: 'grimorio',    titulo: 'Grimório' },
  { id: 'resumo',      titulo: 'Resumo' },
];

function getWizardStages() {
  return WIZARD_STAGES;
}

/** @type {import('../interface.js').GameEngine} */
const lunariaEngine = {
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
  extrairBonusEquipamentos,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
  // contrato de magias (§5 spec H&M)
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
};

export default lunariaEngine;
