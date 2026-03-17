/**
 * Helper de Evolucao — formulas e regras do sistema de progressao
 * Todas as regras sao funcoes puras do nivel, sem estado.
 */

/** Orcamento base de pontos de vantagem antes de descontar raca/classe */
const VANTAGEM_BASE = 10;

/** Pontos de atributo na criacao */
const ATRIBUTO_BASE = 75;

/** Maximo por stat individual */
const STAT_MAX = 20;
const STAT_MIN = 1;

/** Nivel maximo do personagem */
const NIVEL_MAX = 20;

// ===== FORMULAS POR NIVEL =====

/**
 * Total de pontos de vantagem disponiveis no nivel (antes de descontar raca/classe)
 * Nv1: 10, Nv2: 11, ... Nv20: 29
 */
export function pontosVantagemBase(nivel) {
  return VANTAGEM_BASE + (Math.min(nivel, NIVEL_MAX) - 1);
}

/**
 * Maximo de custo acumulado de desvantagens aceitas
 * Nv1: 3, Nv5: 4, Nv9: 5, Nv13: 6, Nv17: 7
 */
export function maxCustoDesvantagem(nivel) {
  return 3 + Math.floor((Math.min(nivel, NIVEL_MAX) - 1) / 4);
}

/**
 * Tier maximo de vantagens/desvantagens desbloqueado
 * Nv1: 1, Nv5: 2, Nv9: 3, Nv13: 4, Nv17: 5
 */
export function tierDesbloqueado(nivel) {
  return 1 + Math.floor((Math.min(nivel, NIVEL_MAX) - 1) / 4);
}

/**
 * Bonus total de pontos de atributo ganhos por evolucao
 * +2 a cada nivel impar a partir do 3 (3,5,7,9,11,13,15,17,19)
 */
export function pontosAtributoBonus(nivel) {
  if (nivel <= 2) return 0;
  return Math.floor((Math.min(nivel, NIVEL_MAX) - 1) / 2) * 2;
}

/**
 * Total de pontos de atributo disponiveis no nivel
 */
export function pontosAtributoTotal(nivel) {
  return ATRIBUTO_BASE + pontosAtributoBonus(nivel);
}

// ===== XP — Thresholds fixos de progressao =====

/**
 * XP acumulado necessario para alcancar cada nivel (indice 0 = Nv1).
 * Nv1=0, Nv2=100, Nv3=300, Nv4=600, Nv5=1000, Nv6=1500, Nv7=2100, Nv8=2800, Nv9=3600, Nv10=4500
 * A partir do Nv11 a progressao continua com incremento de +1000 por nivel.
 */
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

// Preencher thresholds ate NIVEL_MAX para manter compatibilidade
(function preencherThresholds() {
  for (let i = XP_THRESHOLDS.length; i < NIVEL_MAX; i++) {
    XP_THRESHOLDS.push(XP_THRESHOLDS[i - 1] + 1000 * (i - 8));
  }
})();

/**
 * XP necessario para ir do nivel atual para o proximo (custo incremental)
 */
export function xpParaNivel(nivel) {
  if (nivel >= NIVEL_MAX) return Number.POSITIVE_INFINITY;
  return XP_THRESHOLDS[nivel] - XP_THRESHOLDS[nivel - 1];
}

/**
 * XP total acumulado necessario para alcancar um nivel
 */
export function xpAcumuladoParaNivel(nivel) {
  if (nivel <= 1) return 0;
  if (nivel - 1 < XP_THRESHOLDS.length) return XP_THRESHOLDS[nivel - 1];
  return XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
}

/**
 * Calcula o nivel correspondente a um total de XP acumulado
 */
export function calcularNivelPorXP(xpTotal) {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xpTotal >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/**
 * XP acumulado necessario para o proximo nivel (threshold absoluto)
 * Retorna null se ja esta no nivel maximo
 */
export function xpParaProximoNivel(nivelAtual) {
  if (nivelAtual >= NIVEL_MAX) return null;
  if (nivelAtual < XP_THRESHOLDS.length) return XP_THRESHOLDS[nivelAtual];
  return XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 1000 * (nivelAtual - XP_THRESHOLDS.length + 1);
}

// ===== VALIDACAO DE CRIACAO =====

/**
 * Calcula pontos de vantagem disponiveis para um personagem
 * @param {number} nivel - Nivel do personagem
 * @param {number} racaCusto - Custo da raca (campo custo da tabela racas)
 * @param {number} classeCusto - Custo da classe (campo custo da tabela classes)
 * @param {number} custoDesvantagensAceitas - Soma dos |custo| das desvantagens escolhidas
 * @returns {number} Pontos de vantagem disponiveis
 */
export function calcularPontosVantagem(nivel, racaCusto, classeCusto, custoDesvantagensAceitas) {
  return pontosVantagemBase(nivel) - racaCusto - classeCusto + custoDesvantagensAceitas;
}

/**
 * Valida a distribuicao de atributos
 * @param {Object} atributos - { forca, inteligencia, carisma, destreza, constituicao, agilidade }
 * @param {number} nivel - Nivel do personagem
 * @returns {{ valido: boolean, erros: string[] }}
 */
export function validarAtributos(atributos, nivel) {
  const erros = [];
  const nomes = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];
  let soma = 0;

  for (const nome of nomes) {
    const valor = parseInt(atributos[nome]) || 0;
    if (valor < STAT_MIN || valor > STAT_MAX) {
      erros.push(`${nome} deve estar entre ${STAT_MIN} e ${STAT_MAX} (atual: ${valor})`);
    }
    soma += valor;
  }

  const maxPontos = pontosAtributoTotal(nivel);
  if (soma > maxPontos) {
    erros.push(`Total de atributos (${soma}) excede o maximo permitido (${maxPontos}) para nivel ${nivel}`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Valida vantagens escolhidas contra o orcamento
 * @param {Array} vantagens - Array de objetos vantagem com { custo, nivel }
 * @param {number} pontosDisponiveis - Pontos de vantagem disponiveis
 * @param {number} nivelPersonagem - Nivel do personagem
 * @returns {{ valido: boolean, erros: string[] }}
 */
export function validarVantagens(vantagens, pontosDisponiveis, nivelPersonagem) {
  const erros = [];
  const tier = tierDesbloqueado(nivelPersonagem);
  let custoTotal = 0;

  for (const v of vantagens) {
    if (v.nivel > tier) {
      erros.push(`Vantagem "${v.nome}" requer tier ${v.nivel}, mas personagem so tem tier ${tier} (nivel ${nivelPersonagem})`);
    }
    custoTotal += Math.abs(v.custo);
  }

  if (custoTotal > pontosDisponiveis) {
    erros.push(`Custo total de vantagens (${custoTotal}) excede pontos disponiveis (${pontosDisponiveis})`);
  }

  return { valido: erros.length === 0, erros, custoTotal };
}

/**
 * Valida desvantagens escolhidas contra o limite
 * @param {Array} desvantagens - Array de objetos desvantagem com { custo, nivel }
 * @param {number} nivelPersonagem - Nivel do personagem
 * @returns {{ valido: boolean, erros: string[], custoTotal: number }}
 */
export function validarDesvantagens(desvantagens, nivelPersonagem) {
  const erros = [];
  const tier = tierDesbloqueado(nivelPersonagem);
  const maxCusto = maxCustoDesvantagem(nivelPersonagem);
  let custoTotal = 0;

  for (const d of desvantagens) {
    if (d.nivel > tier) {
      erros.push(`Desvantagem "${d.nome}" requer tier ${d.nivel}, mas personagem so tem tier ${tier}`);
    }
    custoTotal += Math.abs(d.custo);
  }

  if (custoTotal > maxCusto) {
    erros.push(`Custo total de desvantagens (${custoTotal}) excede o limite (${maxCusto}) para nivel ${nivelPersonagem}`);
  }

  return { valido: erros.length === 0, erros, custoTotal };
}

// ===== LEVEL UP =====

/**
 * Verifica se o personagem pode subir de nivel e retorna o que ganha
 * @param {number} nivelAtual - Nivel atual
 * @param {number} xpAtual - XP acumulado atual
 * @returns {{ podeEvoluir: boolean, xpNecessario: number, ganhos: Object|null }}
 */
export function verificarLevelUp(nivelAtual, xpAtual) {
  if (nivelAtual >= NIVEL_MAX) {
    return { podeEvoluir: false, xpNecessario: 0, ganhos: null };
  }

  const xpNecessario = xpParaNivel(nivelAtual);

  if (xpAtual < xpNecessario) {
    return { podeEvoluir: false, xpNecessario, ganhos: null };
  }

  const novoNivel = nivelAtual + 1;
  return {
    podeEvoluir: true,
    xpNecessario,
    ganhos: {
      novoNivel,
      pontosAtributo: pontosAtributoBonus(novoNivel) - pontosAtributoBonus(nivelAtual),
      pontosVantagem: pontosVantagemBase(novoNivel) - pontosVantagemBase(nivelAtual),
      novoMaxDesvantagem: maxCustoDesvantagem(novoNivel),
      novoTier: tierDesbloqueado(novoNivel),
      tierMudou: tierDesbloqueado(novoNivel) > tierDesbloqueado(nivelAtual),
      xpRestante: xpAtual - xpNecessario,
      xpProximoNivel: xpParaNivel(novoNivel)
    }
  };
}

// ===== CONSTANTES EXPORTADAS =====

export const EVOLUCAO = {
  VANTAGEM_BASE,
  ATRIBUTO_BASE,
  STAT_MAX,
  STAT_MIN,
  NIVEL_MAX
};

export default {
  EVOLUCAO,
  pontosVantagemBase,
  maxCustoDesvantagem,
  tierDesbloqueado,
  pontosAtributoBonus,
  pontosAtributoTotal,
  xpParaNivel,
  xpAcumuladoParaNivel,
  calcularNivelPorXP,
  xpParaProximoNivel,
  calcularPontosVantagem,
  validarAtributos,
  validarVantagens,
  validarDesvantagens,
  verificarLevelUp
};
