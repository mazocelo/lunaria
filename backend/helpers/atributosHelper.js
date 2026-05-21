/**
 * Helper for reading character/monster attributes from the flexible
 * atributos_personagem / atributos_monstro tables.
 */

import { getEngine } from '../game-systems/index.js';
import { ATRIBUTO_IDS } from '../game-systems/lunaria/constants.js';

const LUNARIA_ATTRS = ATRIBUTO_IDS;

/**
 * Builds a {nome: valor} map from an atributos array.
 * Works with both atributos_personagem and atributos_monstro.
 * If the entity already has an `_atributosMap` cache, returns it.
 */
function getAtributosMap(entity) {
  if (entity._atributosMap) return entity._atributosMap;

  const atributos = entity.atributos_personagem || entity.atributos_monstro || [];
  const map = {};
  for (const a of atributos) {
    map[a.nome] = a.valor;
  }
  entity._atributosMap = map;
  return map;
}

/**
 * Gets a single attribute value. Returns default (10) if not found.
 */
function getAtributo(entity, nome, defaultVal = 10) {
  const map = getAtributosMap(entity);
  return map[nome] ?? defaultVal;
}

/**
 * Calculates D&D/Lunaria-style modifier: floor((valor - 10) / 2)
 */
function getModificador(entity, nome) {
  const valor = getAtributo(entity, nome);
  return Math.floor((valor - 10) / 2);
}

/**
 * Returns attribute names for any supported system.
 * Falls back to LUNARIA_ATTRS if the system is unknown.
 */
function getAttrNamesForSystem(sistema = 'lunaria') {
  try {
    const engine = getEngine(sistema);
    return engine.getAtributosBase().map(a => a.id);
  } catch {
    return LUNARIA_ATTRS;
  }
}

export { getAtributosMap, getAtributo, getModificador, LUNARIA_ATTRS, getAttrNamesForSystem };
