/**
 * Character mechanics for the Lunaria system.
 * Pure functions — no DB access, no side effects.
 *
 * Formulas extracted from combateHelper.js, evolucaoHelper.js, criacaoPersonagemHelper.js.
 */

import {
  ATRIBUTOS,
  ATRIBUTO_IDS,
  ATRIBUTO_BASE,
  NIVEL_MAX,
  HP_MULT_DEFAULT,
  MANA_BASE,
  MANA_MIN,
  STAT_MIN,
  STAT_MAX,
  CRIACAO_ATRIBUTO_MIN,
  CRIACAO_ATRIBUTO_MAX,
  CRIACAO_ATRIBUTO_TOTAL,
  VANTAGEM_BASE,
} from './constants.js';

function mod(valor) {
  return Math.floor(((valor || 10) - 10) / 2);
}

function getAttr(personagem, nome) {
  const attrs = personagem.atributos || {};
  return personagem[nome] ?? attrs[nome] ?? 10;
}

/**
 * HP = multRaca * (nivel + max(1, modCON))
 */
export function calcularHP(personagem, multRaca = HP_MULT_DEFAULT) {
  const constituicao = getAttr(personagem, 'constituicao');
  const nivel = personagem.nivel || 1;
  const modCON = mod(constituicao);
  return multRaca * (nivel + Math.max(1, modCON));
}

/**
 * MP = max(5, 10 + nivel + max(modINT, modCHA) * 2)
 */
export function calcularMP(personagem) {
  const inteligencia = getAttr(personagem, 'inteligencia');
  const carisma = getAttr(personagem, 'carisma');
  const nivel = personagem.nivel || 1;
  const modInt = mod(inteligencia);
  const modCha = mod(carisma);
  const modCaster = Math.max(modInt, modCha);
  return Math.max(MANA_MIN, MANA_BASE + nivel + modCaster * 2);
}

/**
 * Ataque = modDEX + floor(nivel / 2)
 */
export function calcularAtaque(personagem) {
  const destreza = getAttr(personagem, 'destreza');
  const nivel = personagem.nivel || 1;
  const modDEX = mod(destreza);
  return modDEX + Math.floor(nivel / 2);
}

/**
 * Defesa (DC esquiva) = 10 + modAGI
 */
export function calcularDefesa(personagem) {
  const agilidade = getAttr(personagem, 'agilidade');
  return 10 + mod(agilidade);
}

/**
 * Retorna as definições dos 6 atributos do Lunaria.
 */
export function getAtributosBase() {
  return ATRIBUTOS;
}

/**
 * Progressão de nível: pontos de vantagem, max desvantagem, tier desbloqueado.
 * Fórmulas extraídas de evolucaoHelper.js.
 */
export function getProgressaoNivel(nivel) {
  const n = Math.min(nivel, NIVEL_MAX);
  return {
    pontosVantagem: VANTAGEM_BASE + (n - 1),
    maxCustoDesvantagem: 3 + Math.floor((n - 1) / 4),
    tierMax: 1 + Math.floor((n - 1) / 4),
  };
}

/**
 * Valida distribuição de atributos na criação de personagem.
 * Total deve ser exatamente CRIACAO_ATRIBUTO_TOTAL (60), cada valor entre 5 e 16.
 */
export function validarCriacao(dados) {
  const erros = [];
  const atributos = dados.atributos || dados;
  let soma = 0;

  for (const nome of ATRIBUTO_IDS) {
    const valor = parseInt(atributos[nome], 10) || 0;
    if (valor < CRIACAO_ATRIBUTO_MIN || valor > CRIACAO_ATRIBUTO_MAX) {
      erros.push(`${nome} deve estar entre ${CRIACAO_ATRIBUTO_MIN} e ${CRIACAO_ATRIBUTO_MAX} na criacao (atual: ${valor})`);
    }
    soma += valor;
  }

  if (soma !== CRIACAO_ATRIBUTO_TOTAL) {
    erros.push(`Total de atributos na criacao deve ser ${CRIACAO_ATRIBUTO_TOTAL} (atual: ${soma})`);
  }

  return { valido: erros.length === 0, erros };
}
