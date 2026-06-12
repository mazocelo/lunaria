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
  resolverTesteMorte,
  verificarPertoDaMorte,
  calcularMultiplicadorEscala,
} from './combatEngine.js';

import { extrairBonusEquipamentos } from './equipmentEngine.js';

import { resolverTeste } from './testEngine.js';

import {
  resolverAbsorcao,
  resolverRessurreicao,
  temPoder,
  aplicarPoderesPosDano,
  consumirDanoAbsorvido,
} from './monsterPowerEngine.js';

import { calcularPECombate, calcularConversoesPE, converterPE } from './progressionEngine.js';

import {
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
} from './magiaEngine.js';

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
  // suporta o motor de combate em sala (contrato v2)
  suportaCombateSala: true,
  processarDescansoTresDet,
  parseCustoPM,
  resolverTesteMorte,
  verificarPertoDaMorte,
  calcularMultiplicadorEscala,
  // monster powers
  resolverAbsorcao,
  resolverRessurreicao,
  temPoder,
  aplicarPoderesPosDano,
  consumirDanoAbsorvido,
  // progression (PE)
  calcularPECombate,
  calcularConversoesPE,
  converterPE,
  // contrato de magias (§5 spec H&M)
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
};

export default tresdetEngine;
