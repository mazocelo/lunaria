/**
 * Helper de Bonus — parsing e agregação de bonus de raça, classe e equipamentos
 * Funções puras, sem estado.
 */

const ATRIBUTOS = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];

/**
 * Parseia bonus de raça ou classe (campo String JSON no banco)
 * Formato esperado: '{ "forca": "+2", "constituicao": "+1", "vantagens": [...], "desvantagens": [...] }'
 * @param {string|null} bonusStr - Campo bonus (String JSON)
 * @returns {{ forca: number, inteligencia: number, carisma: number, destreza: number, constituicao: number, agilidade: number }}
 */
export function parsearBonusEntidade(bonusStr) {
  const resultado = { forca: 0, inteligencia: 0, carisma: 0, destreza: 0, constituicao: 0, agilidade: 0 };

  if (!bonusStr) return resultado;

  try {
    const bonus = typeof bonusStr === 'string' ? JSON.parse(bonusStr) : bonusStr;

    for (const attr of ATRIBUTOS) {
      if (bonus[attr]) {
        const valor = String(bonus[attr]).replace('+', '');
        resultado[attr] = parseInt(valor) || 0;
      }
    }
  } catch (e) {
    console.warn('⚠️ Erro ao parsear bonus:', e.message);
  }

  return resultado;
}

/**
 * Agrega bonus de todos os equipamentos do personagem
 * Formato bonus novo: { dano: 2, ataque: 2, armadura: 5, esquiva_bonus: 3, esquiva_penalidade: 5 }
 * Fallback para formato antigo: { ca, ca_base } → convertido para armadura
 * @param {Array} equipamentos - Array de equipamentos com campo bonus
 * @returns {{ ataque: number, dano: number, armadura: number, esquiva_bonus: number, esquiva_penalidade: number }}
 */
export function agregarBonusEquipamentos(equipamentos) {
  const resultado = { ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 };

  if (!Array.isArray(equipamentos)) return resultado;

  for (const equip of equipamentos) {
    const bonus = equip.bonus || equip.equipamentos?.bonus;
    if (!bonus || typeof bonus !== 'object') continue;

    resultado.ataque += bonus.ataque || 0;
    resultado.dano += bonus.dano || 0;

    // Novo formato: armadura direto
    if (bonus.armadura != null) {
      resultado.armadura += bonus.armadura;
    }
    // Fallback formato antigo: ca_base → armadura (30% do valor)
    else if (bonus.ca_base != null) {
      resultado.armadura += Math.floor(bonus.ca_base * 0.3);
    }

    // Fallback: ca aditivo antigo → armadura
    if (bonus.ca && !bonus.armadura) {
      resultado.armadura += bonus.ca;
    }

    resultado.esquiva_bonus += bonus.esquiva_bonus || 0;
    resultado.esquiva_penalidade += bonus.esquiva_penalidade || 0;
  }

  return resultado;
}

/**
 * Calcula atributos efetivos (base + bonus raça + bonus classe)
 * @param {Object} personagem - Personagem com atributos base
 * @param {string|null} bonusRaca - Bonus JSON string da raça
 * @param {string|null} bonusClasse - Bonus JSON string da classe
 * @returns {Object} Atributos com bonus aplicados
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
 * @param {Array} equipamentos - Equipamentos do personagem
 * @returns {string|null} Notação de dado (ex: "2d6+3") ou null
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

/**
 * Calcula dano esperado de uma notação de dado
 * @param {string} notacao - Ex: "2d6+3"
 * @returns {number} Dano médio esperado
 */
function _calcularDanoEsperado(notacao) {
  if (!notacao || typeof notacao !== 'string') return 0;

  const match = notacao.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return 0;

  const quantidade = parseInt(match[1]);
  const faces = parseInt(match[2]);
  const modificador = match[3] ? parseInt(match[3]) : 0;

  return (quantidade * (faces + 1) / 2) + modificador;
}

/**
 * Valida se personagem atende requisitos de um equipamento
 * @param {Object|null} requisitos - JSON de requisitos do equipamento
 * @param {string} classeNome - Nome da classe do personagem
 * @param {string} racaNome - Nome da raça do personagem
 * @returns {{ valido: boolean, motivo: string|null }}
 */
export function validarRequisitosEquipamento(requisitos, classeNome, racaNome) {
  if (!requisitos || typeof requisitos !== 'object') {
    return { valido: true, motivo: null };
  }

  if (requisitos.classe && Array.isArray(requisitos.classe)) {
    const classeMatch = requisitos.classe.some(c =>
      classeNome.toLowerCase().includes(c.toLowerCase())
    );
    if (!classeMatch) {
      return { valido: false, motivo: `Requer classe: ${requisitos.classe.join(', ')}` };
    }
  }

  if (requisitos.raca && Array.isArray(requisitos.raca)) {
    const racaMatch = requisitos.raca.some(r =>
      racaNome.toLowerCase().includes(r.toLowerCase())
    );
    if (!racaMatch) {
      return { valido: false, motivo: `Requer raça: ${requisitos.raca.join(', ')}` };
    }
  }

  return { valido: true, motivo: null };
}

export default {
  parsearBonusEntidade,
  agregarBonusEquipamentos,
  calcularAtributosEfetivos,
  encontrarMelhorArma,
  validarRequisitosEquipamento
};
