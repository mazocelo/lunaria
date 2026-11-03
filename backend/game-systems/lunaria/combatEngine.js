/**
 * Combat mechanics for the Lunaria system.
 * Pure functions — no DB access, no side effects.
 *
 * Formulas extracted from combateHelper.js and testeHelper.js.
 */

import { agregarBonusEquipamentos } from '../../helpers/bonusHelper.js';
import {
  calcularHP as calcularHPHelper,
  calcularMP,
  calcularEsquiva,
  calcularArmadura,
  getMultRaca,
} from './characterEngine.js';

function mod(valor) {
  return Math.floor(((valor || 10) - 10) / 2);
}

function getAttr(personagem, nome) {
  const attrs = personagem.atributos || {};
  return personagem[nome] ?? attrs[nome] ?? 10;
}

function rolarD20() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Bônus de nível para ataque em combate: floor(nivel / 2)
 */
function bonusNivelCombate(nivel) {
  return Math.floor((nivel || 1) / 2);
}

/**
 * Bônus de nível para testes: min(2, floor(nivel / 6))
 * Nv1-5: +0, Nv6-11: +1, Nv12-20: +2
 */
function bonusNivelTeste(nivel) {
  return Math.min(2, Math.floor((nivel || 1) / 6));
}

/**
 * Resolve ataque: d20 + modDEX + bonusNivel vs 10 + modAGI
 *
 * @param {Object} atacante - Personagem atacante
 * @param {Object} defensor - Personagem/monstro defensor
 * @param {Object} [acao] - Ação opcional com dados extras
 * @returns {{ acertou: boolean, dano: number, critico: boolean, detalhes: Object }}
 */
export function resolverAtaque(atacante, defensor, acao = {}) {
  const rolagem = rolarD20();
  const modDEX = mod(getAttr(atacante, 'destreza'));
  const nivel = atacante.nivel || 1;
  const bonusNivel = bonusNivelCombate(nivel);
  const bonusAtaque = modDEX + bonusNivel;
  const totalAtaque = rolagem + bonusAtaque;

  const modAGI = mod(getAttr(defensor, 'agilidade'));
  const defesa = 10 + modAGI;

  const critico = rolagem === 20;
  const falhaCritica = rolagem === 1;

  let acertou;
  if (critico) acertou = true;
  else if (falhaCritica) acertou = false;
  else acertou = totalAtaque >= defesa;

  let dano = 0;
  if (acertou) {
    const modFOR = mod(getAttr(atacante, 'forca'));
    const danoBase = acao.dano_base || (nivel >= 5 ? 8 : 6);
    dano = Math.floor(Math.random() * danoBase) + 1 + modFOR;
    if (critico) dano *= 2;
    dano = Math.max(0, dano);
  }

  return {
    acertou,
    dano,
    critico,
    detalhes: {
      rolagem,
      bonusAtaque,
      totalAtaque,
      defesa,
      falhaCritica,
    },
  };
}

/**
 * Iniciativa: d20 + modAGI
 */
export function calcularIniciativa(personagem) {
  const agilidade = getAttr(personagem, 'agilidade');
  return rolarD20() + mod(agilidade);
}

/**
 * Resolve teste de habilidade: d20 + mod_atributo + bonusNivel vs DC
 *
 * @param {Object} personagem - Dados do personagem
 * @param {string} atributo - Nome do atributo (ex: "forca", "inteligencia")
 * @param {number} dc - Dificuldade do teste
 * @returns {{ sucesso: boolean, rolagem: number, detalhes: Object }}
 */
export function resolverTeste(personagem, atributo, dc) {
  const rolagem = rolarD20();
  const valorAtributo = getAttr(personagem, atributo);
  const modificador = mod(valorAtributo);
  const nivel = personagem.nivel || 1;
  const bonusNivel = bonusNivelTeste(nivel);
  const total = Math.max(1, rolagem + modificador + bonusNivel);

  const critico = rolagem === 20;
  const falhaCritica = rolagem === 1;

  let sucesso;
  if (critico) sucesso = true;
  else if (falhaCritica) sucesso = false;
  else sucesso = total >= dc;

  return {
    sucesso,
    rolagem,
    detalhes: {
      atributo,
      valorAtributo,
      modificador,
      bonusNivel,
      total,
      dc,
      critico,
      falhaCritica,
      margem: total - dc,
    },
  };
}

export function extrairBonusEquipamentos(itensEquipados) {
  return agregarBonusEquipamentos(itensEquipados);
}

export function buildCombatState(personagemCompleto, bonusEquip = {}) {
  if (!personagemCompleto) {
    return {
      hp_max: 15, hp_atual: 15,
      mana_max: 10, mana_atual: 10,
      esquiva: 5, armadura: 0,
      bonusAtaque: 0, bonusDano: 0,
      dano_base: '1d6-1', elemento: null,
      personagemNome: 'Jogador',
    };
  }

  const attrs = personagemCompleto.atributos || {};
  const personagemStats = {
    constituicao: attrs.constituicao || 10,
    destreza: attrs.destreza || 10,
    agilidade: attrs.agilidade || 10,
    nivel: personagemCompleto.nivel || 1,
  };
  const multRaca = getMultRaca(personagemCompleto.raca_nome || personagemCompleto.raca || '');
  const hpMax = calcularHPHelper(personagemStats, multRaca);
  const manaMax = calcularMP({
    inteligencia: attrs.inteligencia || 10,
    carisma: attrs.carisma || 10,
    nivel: personagemCompleto.nivel || 1,
  });

  return {
    hp_max: hpMax,
    hp_atual: personagemCompleto.hp_atual ?? hpMax,
    mana_max: manaMax,
    mana_atual: personagemCompleto.mana_atual ?? manaMax,
    esquiva: calcularEsquiva(personagemStats, bonusEquip),
    armadura: calcularArmadura(bonusEquip),
    bonusAtaque: Math.floor(((attrs.destreza || 10) - 10) / 2) + (bonusEquip.ataque || 0),
    bonusDano: bonusEquip.dano || 0,
    dano_base: personagemCompleto.melhorArma || (personagemCompleto.equipamentos?.length > 0 ? '1d6' : '1d6-1'),
    elemento: personagemCompleto.elementoArma || null,
    personagemNome: personagemCompleto.nome || 'Jogador',
  };
}

export function getIniciativaConfig(personagem) {
  const attrs = personagem?.atributos || personagem || {};
  const agilidade = attrs.agilidade || 10;
  return {
    atributo: 'Agilidade',
    lados: 20,
    modificador: Math.floor((agilidade - 10) / 2),
  };
}

export function resolverConsumo() {
  return [];
}
