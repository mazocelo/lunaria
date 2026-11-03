/**
 * Character mechanics for the Lunaria system.
 * Pure functions — no DB access. O unico efeito colateral e um `log.warn`
 * em `getMultRaca` quando a raca nao tem `mult_raca` carregado nem fallback.
 *
 * Formulas extracted from combateHelper.js, evolucaoHelper.js, criacaoPersonagemHelper.js.
 */

import logger from '../../helpers/logger.js';
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

const log = logger.child({ module: 'lunaria/characterEngine' });

function mod(valor) {
  return Math.floor(((valor || 10) - 10) / 2);
}

/**
 * Resolve um atributo cobrindo os 3 shapes que o backend produz: campo direto
 * (`personagem.constituicao`), objeto `atributos` e o array relacional
 * `atributos_personagem`/`atributos_monstro`.
 */
function getAttr(personagem, nome, def = 10) {
  if (personagem == null) return def;
  if (personagem[nome] != null) return personagem[nome];
  const attrs = personagem.atributos;
  if (attrs && attrs[nome] != null) return attrs[nome];
  const arr = personagem.atributos_personagem || personagem.atributos_monstro;
  if (Array.isArray(arr)) {
    const found = arr.find(a => a.nome === nome);
    if (found && found.valor != null) return found.valor;
  }
  return def;
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
 * Taxa de esquiva (%) usada pelo motor de combate (distinta de calcularDefesa, que e o DC).
 * Formula: (modAGI + floor(modDEX/2)) * 5 + floor(nivel*0.5) + esquiva_bonus - esquiva_penalidade
 * Cap: 0-50%.
 */
export function calcularEsquiva(personagem, bonusEquip = {}) {
  const modAgi = mod(getAttr(personagem, 'agilidade'));
  const modDex = mod(getAttr(personagem, 'destreza'));
  const nivel = personagem.nivel || 1;

  const baseEsquiva = (modAgi + Math.floor(modDex / 2)) * 5;
  const bonusNivel = Math.floor(nivel * 0.5);
  const bonusEquipamento = bonusEquip.esquiva_bonus || 0;
  const penalidadeEquipamento = bonusEquip.esquiva_penalidade || 0;

  const total = baseEsquiva + bonusNivel + bonusEquipamento - penalidadeEquipamento;
  return Math.min(50, Math.max(0, total));
}

/**
 * Armadura total de equipamentos (reducao flat de dano).
 */
export function calcularArmadura(bonusEquip = {}) {
  return bonusEquip.armadura || 0;
}

/**
 * Absorcao de dano do alvo: floor(modCON/2) + armadura.
 */
export function calcularAbsorcao(constituicao, armadura = 0) {
  const modCON = Math.floor(((constituicao || 10) - 10) / 2);
  return Math.floor(modCON / 2) + (armadura || 0);
}

/**
 * Mapa estatico de mult_raca por nome de raca. E a FONTE UNICA de sincronizacao:
 * a coluna `mult_raca` da tabela `racas` deve espelhar este mapa, e o script
 * `scripts/seed-mult-raca.mjs` semeia a coluna a partir daqui. Assim, o caminho
 * por coluna (getMultRaca com objeto raca) e o caminho por nome (getMultRaca com
 * string) convergem para o mesmo valor. Ao mexer aqui, rode o seed. Serve tambem
 * como fallback quando a raca carregada nao traz o valor da coluna; fallback
 * final: HP_MULT_DEFAULT.
 */
export const MULT_RACA_MAP = {
  'Humano': 5, 'Anão': 6, 'Elfo': 4, 'Elfo Negro': 4, 'Meio-Elfo': 5,
  'Halfling': 4, 'Gnomo': 4, 'Orc': 7, 'Meio-Orc': 6, 'Tiefling': 5,
  'Draconato': 7, 'Aasimar': 5, 'Primordiano': 5, 'Anfíbio': 5, 'Centauro': 7,
  'Minotauro': 7, 'Kythari': 5, 'Kemono': 5, 'Pardalino': 4, 'Kobold': 3,
  'Goblin': 3, 'Hobgoblin': 5, 'Bugbear': 6, 'Meio-Dragão': 7,
  'Ogro': 8, 'Meio-Ogro': 7, 'Troglodita': 5, 'Verdeante': 5,
  'Cristálide': 5, 'Anjo': 6, 'Demônio': 6, 'Meio-Abissal': 6,
  'Meio-Celestial': 6, 'Fada': 3, 'Licantropo': 7, 'Meio-Gênio': 6,
  'Silvagante': 7, 'Deva': 6, 'Androide': 6, 'Golem': 9,
};

function multRacaPorNome(racaNome) {
  if (!racaNome) return HP_MULT_DEFAULT;
  const mult = MULT_RACA_MAP[racaNome];
  if (mult === undefined) {
    log.warn({ raca: racaNome }, 'getMultRaca: raca sem mult_raca carregado nem no MULT_RACA_MAP; usando fallback');
    return HP_MULT_DEFAULT;
  }
  return mult;
}

/**
 * Retorna o multiplicador de HP da raca.
 *
 * Fonte primaria: a coluna `mult_raca` da raca carregada — aceita tanto o
 * objeto da raca (`{ mult_raca, nome }`) quanto um personagem com `racas`.
 * Quando so o nome estiver disponivel (string), cai no MULT_RACA_MAP; se a
 * raca nao existir no mapa, registra log.warn e usa HP_MULT_DEFAULT.
 *
 * @param {string|Object|null|undefined} racaOuPersonagem
 * @returns {number} mult_raca
 */
export function getMultRaca(racaOuPersonagem) {
  if (racaOuPersonagem && typeof racaOuPersonagem === 'object') {
    const multCarregado = racaOuPersonagem.mult_raca ?? racaOuPersonagem.racas?.mult_raca;
    if (Number.isFinite(multCarregado)) return multCarregado;
    const nome = racaOuPersonagem.nome
      ?? racaOuPersonagem.racas?.nome
      ?? racaOuPersonagem.raca_nome
      ?? racaOuPersonagem.raca;
    return multRacaPorNome(nome);
  }
  return multRacaPorNome(racaOuPersonagem);
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
