/**
 * Helper de Testes de Habilidade — resolução mecânica
 *
 * Aplica modificadores de atributo + bônus de nível ao resultado de d20
 * e compara com DC para determinar sucesso/falha.
 *
 * Fórmula: d20 + mod_atributo + bonus_nivel vs DC
 * - mod_atributo = Math.floor((atributo - 10) / 2)
 * - bonus_nivel  = Math.min(2, Math.floor(nivel / 6))
 */

import { TESTES_CONFIG } from '../config/testesConfig.js';
import { calcularBonusTeste } from './bonusHelper.js';
import logger from './logger.js';
const log = logger.child({ module: 'testeHelper' });

/**
 * Calcula modificador de um atributo (mesma fórmula usada em combate)
 * @param {number} valorAtributo - Valor base do atributo (ex: 16)
 * @returns {number} Modificador (ex: +3)
 */
export function calcularModificadorAtributo(valorAtributo) {
  return Math.floor(((valorAtributo || 10) - 10) / 2);
}

/**
 * Calcula bônus de nível para testes
 * Nv1-5: +0, Nv6-11: +1, Nv12-20: +2
 * @param {number} nivel
 * @returns {number}
 */
export function calcularBonusNivel(nivel) {
  return Math.min(2, Math.floor((nivel || 1) / 6));
}

/**
 * Mapeia nome do teste para o atributo primário
 * Suporta match exato, case-insensitive e sem acentos
 * @param {string} nomeTeste - Ex: "Percepção", "Furtividade", "Força"
 * @returns {string|null} Nome do atributo (ex: "inteligencia") ou null se não encontrado
 */
export function mapearTesteParaAtributo(nomeTeste) {
  if (!nomeTeste) return null;

  const teste = nomeTeste.trim();

  // Match exato
  if (TESTES_CONFIG.habilidades[teste] !== undefined) {
    return TESTES_CONFIG.habilidades[teste];
  }

  // Match case-insensitive
  const testeLC = teste.toLowerCase();
  for (const [key, value] of Object.entries(TESTES_CONFIG.habilidades)) {
    if (key.toLowerCase() === testeLC) return value;
  }

  // Match sem acentos
  const semAcento = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const testeSA = semAcento(teste);
  for (const [key, value] of Object.entries(TESTES_CONFIG.habilidades)) {
    if (semAcento(key) === testeSA) return value;
  }

  // Tentar match parcial (ex: "teste de Força" → "Força")
  for (const [key, value] of Object.entries(TESTES_CONFIG.habilidades)) {
    if (testeSA.includes(semAcento(key)) || semAcento(key).includes(testeSA)) {
      return value;
    }
  }

  // Verificar se é um nome de atributo direto (ex: "forca", "destreza")
  if (TESTES_CONFIG.ATRIBUTOS.includes(testeLC)) {
    return testeLC;
  }

  log.warn({ teste: nomeTeste }, 'testeHelper: Teste nao mapeado, usando d20 puro');
  return null;
}

/**
 * Obtém DC numérico a partir do nome da dificuldade
 * @param {string|number} dificuldade - "Média", "Difícil" ou número direto
 * @returns {number} DC
 */
export function obterDC(dificuldade) {
  if (typeof dificuldade === 'number') return dificuldade;
  if (!dificuldade) return TESTES_CONFIG.DC_PADRAO;

  const dc = TESTES_CONFIG.dificuldade[dificuldade];
  if (dc != null) return dc;

  // Match case-insensitive
  const difLC = dificuldade.toLowerCase().trim();
  for (const [key, value] of Object.entries(TESTES_CONFIG.dificuldade)) {
    if (key.toLowerCase() === difLC) return value;
  }

  // Match parcial (ex: "media" sem acento)
  const semAcento = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const difSA = semAcento(dificuldade);
  for (const [key, value] of Object.entries(TESTES_CONFIG.dificuldade)) {
    if (semAcento(key) === difSA) return value;
  }

  log.warn({ dificuldade, dcPadrao: TESTES_CONFIG.DC_PADRAO }, 'testeHelper: Dificuldade nao reconhecida, usando DC padrao');
  return TESTES_CONFIG.DC_PADRAO;
}

/**
 * Calcula o modificador total para um personagem em um teste específico
 * @param {Object} personagem - Dados do personagem com atributos
 * @param {string} nomeTeste - Nome do teste
 * @returns {{ atributo, atributoNome, valorAtributo, modificador, bonusNivel, totalModificador }}
 */
export function calcularModificadorTeste(personagem, nomeTeste) {
  const atributo = mapearTesteParaAtributo(nomeTeste);

  if (!atributo || !personagem) {
    return {
      atributo: null,
      atributoNome: null,
      valorAtributo: 10,
      modificador: 0,
      bonusNivel: 0,
      totalModificador: 0
    };
  }

  // Atributos podem estar em personagem.atributos.X ou personagem.X (compatível com ambos)
  const valorAtributo = personagem.atributos?.[atributo] || personagem[atributo] || 10;
  const modificador = calcularModificadorAtributo(valorAtributo);
  const bonusNivel = calcularBonusNivel(personagem.nivel || 1);

  // Bonus de vantagens/desvantagens
  const { bonusTotal: bonusVantDesvant, detalhes: detalhesBonus } =
    calcularBonusTeste(personagem, nomeTeste, atributo);

  return {
    atributo,
    atributoNome: TESTES_CONFIG.ATRIBUTOS_DISPLAY[atributo] || atributo,
    valorAtributo,
    modificador,
    bonusNivel,
    bonusVantDesvant,
    detalhesBonus,
    totalModificador: modificador + bonusNivel + bonusVantDesvant
  };
}

/**
 * Calcula a DC de um saving throw de magia
 * Fórmula: 8 + custo_mana da magia
 * @param {Object} magia - Objeto da magia com campo custo_mana
 * @returns {number} DC do saving throw
 */
export function calcularDCSavingThrow(magia) {
  const custoMana = magia?.custo_mana || 0;
  return 8 + custoMana;
}

/**
 * Resolve um teste de habilidade completo
 * @param {Object} personagem - Dados do personagem (atributos + nivel)
 * @param {string} nomeTeste - Nome do teste (ex: "Percepção")
 * @param {number} rolagemBruta - Resultado do d20 (1-20)
 * @param {string|number} dificuldade - Nome ou DC numérico
 * @returns {Object} Resultado completo do teste
 */
export function resolverTeste(personagem, nomeTeste, rolagemBruta, dificuldade) {
  const roll = parseInt(rolagemBruta) || 1;
  const dc = obterDC(dificuldade);
  const mod = calcularModificadorTeste(personagem, nomeTeste);

  const total = Math.max(1, roll + mod.totalModificador);
  const critico = roll === 20;
  const falha_critica = roll === 1;

  // Nat 20 = sempre sucesso, Nat 1 = sempre falha
  let sucesso;
  if (critico) sucesso = true;
  else if (falha_critica) sucesso = false;
  else sucesso = total >= dc;

  const margem = total - dc;

  let descricaoResultado;
  if (critico) descricaoResultado = 'Sucesso Crítico!';
  else if (falha_critica) descricaoResultado = 'Falha Crítica!';
  else if (sucesso && margem >= 5) descricaoResultado = 'Sucesso Excepcional!';
  else if (sucesso) descricaoResultado = 'Sucesso!';
  else if (margem >= -2) descricaoResultado = 'Falha marginal';
  else descricaoResultado = 'Falha';

  // Encontrar nome da dificuldade se DC numérico
  let dificuldadeNome = typeof dificuldade === 'string' ? dificuldade : null;
  if (!dificuldadeNome) {
    for (const [nome, valor] of Object.entries(TESTES_CONFIG.dificuldade)) {
      if (valor === dc) { dificuldadeNome = nome; break; }
    }
  }

  return {
    rolagemBruta: roll,
    atributo: mod.atributo,
    atributoNome: mod.atributoNome,
    valorAtributo: mod.valorAtributo,
    modificador: mod.modificador,
    bonusNivel: mod.bonusNivel,
    bonusVantDesvant: mod.bonusVantDesvant || 0,
    detalhesBonus: mod.detalhesBonus || [],
    totalModificador: mod.totalModificador,
    total,
    dc,
    dificuldadeNome: dificuldadeNome || 'Média',
    sucesso,
    margem,
    critico,
    falha_critica,
    descricaoResultado
  };
}
