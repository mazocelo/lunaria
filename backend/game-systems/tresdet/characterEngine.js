/**
 * Character mechanics for the 3D&T Alpha system.
 * Pure functions — no DB access, no side effects.
 */

import { getAtributo } from '../../helpers/atributosHelper.js';
import { CARACTERISTICAS, CARACTERISTICA_IDS, TIERS, TIER_DEFAULT, FOCUS_KEYS } from './constants.js';

/**
 * HP = R x 5 (minimo 1)
 */
export function calcularHP(personagem) {
  const R = getAtributo(personagem, 'R', 0);
  return Math.max(1, R * 5);
}

/**
 * PM = R x 5 (somente se personagem tem vantagem Magia)
 */
export function calcularMP(personagem) {
  const R = getAtributo(personagem, 'R', 0);
  const temMagia = personagem.stats_sistema?.temMagia || false;
  return temMagia ? R * 5 : 0;
}

/**
 * Ataque base (FA sem d6) = F + H
 */
export function calcularAtaque(personagem) {
  const F = getAtributo(personagem, 'F', 0);
  const H = getAtributo(personagem, 'H', 0);
  return F + H;
}

/**
 * Defesa base (FD sem d6) = A + H
 */
export function calcularDefesa(personagem) {
  const A = getAtributo(personagem, 'A', 0);
  const H = getAtributo(personagem, 'H', 0);
  return A + H;
}

export function getAtributosBase() {
  return CARACTERISTICAS;
}

/**
 * Progressao por nivel no 3D&T: +1 ponto por nivel apos o primeiro.
 * Decisao final do Mestre sobre como distribuir.
 */
export function getProgressaoNivel(nivel) {
  return {
    pontosBonus: nivel - 1,
  };
}

/**
 * Valida criacao de personagem no sistema point-buy do 3D&T.
 * Pool unico: caracteristicas + vantagens + focus - desvantagens.
 */
export function validarCriacao(dados) {
  const erros = [];
  const tier = dados.tier || TIER_DEFAULT;
  const tierConfig = TIERS[tier];

  if (!tierConfig) {
    erros.push(`Tier desconhecido: ${tier}`);
    return { valido: false, erros };
  }

  const totalCaract = CARACTERISTICA_IDS
    .reduce((sum, c) => sum + (dados[c] || 0), 0);

  const custoVantagens = (dados.vantagens || [])
    .reduce((sum, v) => sum + (v.custo || 0), 0);

  const reembolsoDesv = (dados.desvantagens || [])
    .reduce((sum, d) => sum + Math.abs(d.custo || 0), 0);

  const focus = dados.focus || {};
  const totalFocus = FOCUS_KEYS.reduce((sum, k) => sum + (focus[k] || 0), 0);

  const pontosUsados = totalCaract + custoVantagens + totalFocus;
  const pontosDisponiveis = tierConfig.pontos + reembolsoDesv;

  if (pontosUsados > pontosDisponiveis) {
    erros.push(`Pontos excedidos: ${pontosUsados}/${pontosDisponiveis}`);
  }

  if (reembolsoDesv > tierConfig.maxDesv) {
    erros.push(`Desvantagens excedem limite: ${reembolsoDesv}/${tierConfig.maxDesv}`);
  }

  for (const c of CARACTERISTICA_IDS) {
    const val = dados[c] || 0;
    if (val < 0 || val > tierConfig.maxAttr) {
      erros.push(`${c} deve ser entre 0 e ${tierConfig.maxAttr}, recebido: ${val}`);
    }
  }

  for (const k of FOCUS_KEYS) {
    const val = focus[k] || 0;
    if (val < 0 || val > tierConfig.maxAttr) {
      erros.push(`Focus ${k} deve ser entre 0 e ${tierConfig.maxAttr}, recebido: ${val}`);
    }
  }

  return { valido: erros.length === 0, erros };
}
