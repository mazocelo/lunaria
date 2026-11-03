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
 * Returns attribute definitions ({ id, nome, sigla, min, max }) for any
 * supported system. Falls back to the Lunaria engine if the system is unknown.
 */
function getAttrDefsForSystem(sistema = 'lunaria') {
  try {
    return getEngine(sistema).getAtributosBase();
  } catch {
    return getEngine('lunaria').getAtributosBase();
  }
}

/**
 * Returns attribute names for any supported system.
 * Falls back to LUNARIA_ATTRS if the system is unknown.
 */
function getAttrNamesForSystem(sistema = 'lunaria') {
  try {
    return getEngine(sistema).getAtributosBase().map(a => a.id);
  } catch {
    return LUNARIA_ATTRS;
  }
}

/**
 * Integrity guard: throws if `nome` is not a valid attribute of `sistema`.
 * Use before any write (upsert/createMany) into atributos_personagem so a
 * foreign-system key can never be persisted (fail loud).
 */
function assertAtributoDoSistema(nome, sistema = 'lunaria') {
  const nomes = getAttrNamesForSystem(sistema);
  if (!nomes.includes(nome)) {
    throw new Error(
      `Atributo "${nome}" nao pertence ao sistema "${sistema}" (validos: ${nomes.join(', ')})`
    );
  }
}

export {
  getAtributosMap,
  getAtributo,
  getModificador,
  LUNARIA_ATTRS,
  getAttrNamesForSystem,
  getAttrDefsForSystem,
  assertAtributoDoSistema,
};
