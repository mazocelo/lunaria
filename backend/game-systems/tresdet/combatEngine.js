/**
 * Combat mechanics for the 3D&T Alpha system.
 * Pure functions — no DB access, no side effects.
 *
 * FA (melee)  = F + H + 1d6
 * FA (ranged) = PdF + H + 1d6
 * FD = A + H + 1d6
 * Dano = FA - FD (se positivo)
 */

import { getAtributo } from '../../helpers/atributosHelper.js';
import { calcularHP, calcularMP } from './characterEngine.js';

function rolarD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Resolve ataque no sistema 3D&T.
 *
 * @param {Object} atacante - Personagem atacante
 * @param {Object} defensor - Personagem/monstro defensor
 * @param {Object} [acao] - Acao opcional (tipo: 'ranged' ou alcance: 'distancia')
 * @returns {{ acertou: boolean, dano: number, critico: boolean, FA: number, FD: number, dadoAtaque: number, dadoDefesa: number, detalhes: string }}
 */
export function resolverAtaque(atacante, defensor, acao = {}) {
  const isRanged = acao.tipo === 'ranged' || acao.alcance === 'distancia';

  const attrAtaque = isRanged ? 'PdF' : 'F';
  const valorAtaque = getAtributo(atacante, attrAtaque, 0);
  const hAtacante = getAtributo(atacante, 'H', 0);
  const dadoAtaque = rolarD6();
  const FA = valorAtaque + hAtacante + dadoAtaque;

  const aDefensor = getAtributo(defensor, 'A', 0);
  const hDefensor = getAtributo(defensor, 'H', 0);
  const dadoDefesa = rolarD6();
  const FD = aDefensor + hDefensor + dadoDefesa;

  const dano = Math.max(0, FA - FD);
  const acertou = dano > 0;

  return {
    acertou,
    dano,
    critico: false,
    FA,
    FD,
    dadoAtaque,
    dadoDefesa,
    detalhes: `FA: ${attrAtaque}(${valorAtaque})+H(${hAtacante})+d6(${dadoAtaque})=${FA} vs FD: A(${aDefensor})+H(${hDefensor})+d6(${dadoDefesa})=${FD} → Dano: ${dano}`,
  };
}

/**
 * Iniciativa: d6 + H
 */
export function calcularIniciativa(personagem) {
  const h = getAtributo(personagem, 'H', 0);
  return rolarD6() + h;
}

export function buildCombatState(personagemCompleto, bonusEquip = {}) {
  if (!personagemCompleto) {
    return {
      hp_max: 5, hp_atual: 5,
      mana_max: 0, mana_atual: 0,
      ofensivo: { F: 1, PdF: 0, H: 1 },
      defensivo: { A: 1, H: 1 },
      iniciativa_bonus: 0,
      especiais: [],
      dano_base: null,
      elemento: null,
      personagemNome: 'Personagem',
    };
  }

  const hp_max = calcularHP(personagemCompleto);
  const mana_max = calcularMP(personagemCompleto);
  const F = getAtributo(personagemCompleto, 'F', 0) + (bonusEquip.F || 0);
  const PdF = getAtributo(personagemCompleto, 'PdF', 0) + (bonusEquip.PdF || 0);
  const H = getAtributo(personagemCompleto, 'H', 0) + (bonusEquip.H || 0);
  const A = getAtributo(personagemCompleto, 'A', 0) + (bonusEquip.A || 0);

  return {
    hp_max,
    hp_atual: personagemCompleto.hp_atual ?? hp_max,
    mana_max,
    mana_atual: personagemCompleto.mana_atual ?? mana_max,
    ofensivo: { F, PdF, H },
    defensivo: { A, H },
    iniciativa_bonus: bonusEquip.iniciativa || 0,
    especiais: bonusEquip.especiais || [],
    dano_base: null,
    elemento: null,
    personagemNome: personagemCompleto.nome || 'Personagem',
  };
}

export function getIniciativaConfig(personagem) {
  const H = getAtributo(personagem, 'H', 0);
  const bonus = personagem?.iniciativa_bonus || 0;
  return {
    atributo: 'Habilidade',
    lados: 6,
    modificador: H + bonus,
  };
}

export function resolverConsumo(_personagem, item) {
  const efeito = item?.efeito || '';
  const resultados = [];

  if (/restaura todos os pontos de vida e (?:pontos de )?magia/i.test(efeito)) {
    resultados.push({ campo: 'hp', valor: 'max', descricao: 'Restaura todos os Pontos de Vida' });
    resultados.push({ campo: 'mp', valor: 'max', descricao: 'Restaura todos os Pontos de Magia' });
    return resultados;
  }

  const dualMatch = efeito.match(/restaura (\d+) pontos de vida e (\d+) pontos de magia/i);
  if (dualMatch) {
    resultados.push({ campo: 'hp', valor: parseInt(dualMatch[1], 10), descricao: `Restaura ${dualMatch[1]} Pontos de Vida` });
    resultados.push({ campo: 'mp', valor: parseInt(dualMatch[2], 10), descricao: `Restaura ${dualMatch[2]} Pontos de Magia` });
    return resultados;
  }

  if (/restaura todos os pontos de vida/i.test(efeito)) {
    resultados.push({ campo: 'hp', valor: 'max', descricao: 'Restaura todos os Pontos de Vida' });
    return resultados;
  }

  if (/restaura todos os pontos de magia/i.test(efeito) || /restaura todos os pms/i.test(efeito)) {
    resultados.push({ campo: 'mp', valor: 'max', descricao: 'Restaura todos os Pontos de Magia' });
    return resultados;
  }

  const pvMatch = efeito.match(/restaura (\d+) pontos de vida/i);
  if (pvMatch) {
    resultados.push({ campo: 'hp', valor: parseInt(pvMatch[1], 10), descricao: `Restaura ${pvMatch[1]} Pontos de Vida` });
  }

  const pmMatch = efeito.match(/restaura (\d+) pontos de magia/i);
  if (pmMatch) {
    resultados.push({ campo: 'mp', valor: parseInt(pmMatch[1], 10), descricao: `Restaura ${pmMatch[1]} Pontos de Magia` });
  }

  return resultados;
}
