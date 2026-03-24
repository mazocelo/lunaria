/**
 * Test resolution for the 3D&T Alpha system.
 * Pure functions — no DB access, no side effects.
 *
 * Teste simples: 1d6 <= caracteristica -> sucesso
 * Teste dificil: 1d6 <= caracteristica - penalidade
 * Teste oposto: ambos rolam 1d6 + caracteristica, maior vence
 */

import { getAtributo } from '../../helpers/atributosHelper.js';

function rolarD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Resolve teste de habilidade 3D&T.
 *
 * @param {Object} personagem - Dados do personagem
 * @param {string} atributo - Caracteristica testada (F, H, R, A, PdF)
 * @param {number} dc - Penalidade de dificuldade (0 = normal, 1 = dificil, 2+ = muito dificil)
 * @param {Object} [opcoes={}] - Opcoes adicionais
 * @param {number} [opcoes.bonus] - Bonus ou penalidade ao teste (ex: +1 pericia, -3 inculto)
 * @param {string[]} [opcoes.pericias] - Pericias relevantes que o personagem possui (cada uma aplica +1)
 * @returns {{ sucesso: boolean, rolagem: number, total: number, dc: number, detalhes: string }}
 */
export function resolverTeste(personagem, atributo, dc, opcoes = {}) {
  const rolagem = rolarD6();
  const valor = getAtributo(personagem, atributo, 0);

  const bonusPericia = opcoes.pericias?.length ? opcoes.pericias.length : 0;
  const bonusExtra = opcoes.bonus ?? 0;
  const bonusTotal = bonusPericia + bonusExtra;

  // Alvo = valor da caracteristica - penalidade de dificuldade + bonus
  const alvo = Math.max(0, valor - (dc || 0) + bonusTotal);
  const sucesso = rolagem <= alvo;

  const partes = [`d6(${rolagem}) ${sucesso ? '<=' : '>'} ${atributo}(${valor})`];
  if (dc) partes.push(`-${dc}`);
  if (bonusTotal > 0) partes.push(`+${bonusTotal}`);
  if (bonusTotal < 0) partes.push(`${bonusTotal}`);
  partes.push(`=${alvo}`);

  return {
    sucesso,
    rolagem,
    total: rolagem,
    dc: alvo,
    detalhes: partes.join(''),
  };
}
