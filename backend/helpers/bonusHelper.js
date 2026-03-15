/**
 * Helper de Bonus - parsing e agregacao de bonus de raca, classe e equipamentos.
 * Funcoes puras, sem estado.
 */
import logger from './logger.js';
import { extrairAtributosBonus, normalizarBonusCombate } from './catalogJsonHelper.js';

const log = logger.child({ module: 'bonusHelper' });
const ATRIBUTOS = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];

/**
 * Parseia bonus de raca ou classe, aceitando string JSON legado ou objeto.
 * @param {string|Object|null} bonusStr
 * @returns {{ forca: number, inteligencia: number, carisma: number, destreza: number, constituicao: number, agilidade: number }}
 */
export function parsearBonusEntidade(bonusStr) {
  try {
    return extrairAtributosBonus(bonusStr);
  } catch (e) {
    log.warn({ err: e }, 'Erro ao parsear bonus');
    return { forca: 0, inteligencia: 0, carisma: 0, destreza: 0, constituicao: 0, agilidade: 0 };
  }
}

/**
 * Agrega bonus de todos os equipamentos do personagem.
 * O shape canonico e { ataque, dano, armadura, esquiva_bonus, esquiva_penalidade }.
 * Campos legados ca/ca_base sao convertidos na normalizacao.
 * @param {Array} equipamentos
 * @returns {{ ataque: number, dano: number, armadura: number, esquiva_bonus: number, esquiva_penalidade: number }}
 */
export function agregarBonusEquipamentos(equipamentos) {
  const resultado = { ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 };

  if (!Array.isArray(equipamentos)) return resultado;

  for (const equip of equipamentos) {
    const bonus = normalizarBonusCombate(equip?.bonus || equip?.equipamentos?.bonus);
    if (!bonus || typeof bonus !== 'object') continue;

    resultado.ataque += bonus.ataque || 0;
    resultado.dano += bonus.dano || 0;
    resultado.armadura += bonus.armadura || 0;
    resultado.esquiva_bonus += bonus.esquiva_bonus || 0;
    resultado.esquiva_penalidade += bonus.esquiva_penalidade || 0;
  }

  return resultado;
}

/**
 * Calcula atributos efetivos (base + bonus raca + bonus classe)
 * @param {Object} personagem
 * @param {string|Object|null} bonusRaca
 * @param {string|Object|null} bonusClasse
 * @returns {Object}
 */
export function calcularAtributosEfetivos(personagem, bonusRaca, bonusClasse) {
  const bonusR = parsearBonusEntidade(bonusRaca);
  const bonusC = parsearBonusEntidade(bonusClasse);

  const resultado = {};
  for (const attr of ATRIBUTOS) {
    const base = personagem[attr] || 10;
    resultado[attr] = base + bonusR[attr] + bonusC[attr];
  }

  return resultado;
}

/**
 * Encontra o melhor dano_base entre os equipamentos do personagem
 * @param {Array} equipamentos
 * @returns {string|null}
 */
export function encontrarMelhorArma(equipamentos) {
  if (!Array.isArray(equipamentos) || equipamentos.length === 0) return null;

  let melhorDano = null;
  let melhorValor = 0;

  for (const equip of equipamentos) {
    const dano = equip.dano_base || equip.equipamentos?.dano_base;
    if (!dano) continue;

    const valorEsperado = _calcularDanoEsperado(dano);
    if (valorEsperado > melhorValor) {
      melhorValor = valorEsperado;
      melhorDano = dano;
    }
  }

  return melhorDano;
}

function _calcularDanoEsperado(notacao) {
  if (!notacao || typeof notacao !== 'string') return 0;

  const match = notacao.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return 0;

  const quantidade = parseInt(match[1], 10);
  const faces = parseInt(match[2], 10);
  const modificador = match[3] ? parseInt(match[3], 10) : 0;

  return (quantidade * (faces + 1) / 2) + modificador;
}

/**
 * Valida se personagem atende requisitos de um equipamento.
 * @param {Object|null} requisitos
 * @param {string} classeNome
 * @param {string} racaNome
 * @returns {{ valido: boolean, motivo: string|null }}
 */
export function validarRequisitosEquipamento(requisitos, classeNome, racaNome) {
  if (!requisitos || typeof requisitos !== 'object') {
    return { valido: true, motivo: null };
  }

  if (requisitos.classe && Array.isArray(requisitos.classe)) {
    const classeMatch = requisitos.classe.some((c) =>
      classeNome.toLowerCase().includes(c.toLowerCase())
    );
    if (!classeMatch) {
      return { valido: false, motivo: `Requer classe: ${requisitos.classe.join(', ')}` };
    }
  }

  if (requisitos.raca && Array.isArray(requisitos.raca)) {
    const racaMatch = requisitos.raca.some((r) =>
      racaNome.toLowerCase().includes(r.toLowerCase())
    );
    if (!racaMatch) {
      return { valido: false, motivo: `Requer raça: ${requisitos.raca.join(', ')}` };
    }
  }

  return { valido: true, motivo: null };
}

/**
 * Calcula bonus de vantagens/desvantagens aplicaveis a um teste especifico.
 * @param {Object} personagem
 * @param {string} nomeTeste
 * @param {string|null} atributoDoTeste
 * @returns {{ bonusTotal: number, detalhes: Array<{ fonte: string, valor: number }> }}
 */
export function calcularBonusTeste(personagem, nomeTeste, atributoDoTeste) {
  let bonusTotal = 0;
  const detalhes = [];

  const normalizar = (s) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const testeNorm = nomeTeste ? normalizar(nomeTeste) : '';

  const itens = [
    ...(personagem.vantagens || []),
    ...(personagem.desvantagens || [])
  ];

  for (const item of itens) {
    if (!item.bonus || typeof item.bonus !== 'object') continue;

    for (const [key, value] of Object.entries(item.bonus)) {
      const val = Number(value) || 0;
      if (val === 0) continue;

      const keyNorm = normalizar(key.replace(/^penalidade_/i, ''));

      if (
        (testeNorm && keyNorm === testeNorm) ||
        (atributoDoTeste && keyNorm === normalizar(atributoDoTeste))
      ) {
        bonusTotal += val;
        detalhes.push({ fonte: item.nome, valor: val });
      }
    }
  }

  return { bonusTotal, detalhes };
}

export default {
  parsearBonusEntidade,
  agregarBonusEquipamentos,
  calcularAtributosEfetivos,
  encontrarMelhorArma,
  validarRequisitosEquipamento,
  calcularBonusTeste
};
