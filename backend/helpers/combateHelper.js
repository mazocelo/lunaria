/**
 * Helper de Combate - Formulas, dados e logica mecanica
 * Usado pelo socketManager durante combates ativos
 *
 * Sistema de defesa em 2 camadas:
 * - Esquiva: chance percentual de desviar completamente
 * - Armadura: reducao flat de dano nos hits
 */
import logger from './logger.js';
import {
  TAMANHO_MODS,
  STATUS_IMPEDE_ACAO,
  STATUS_DANO_POR_TURNO,
  STATUS_PENALIDADE_ATAQUE,
  STATUS_COMBATENTE,
  RESULTADO_COMBATE,
} from '../config/domainConstants.js';
import { TESTES_CONFIG } from '../config/testesConfig.js';
import { createCombatRoundResult } from './combat/combatRoundResult.js';
import {
  normalizarEfeitoCatalogo,
  normalizarEfeitoRuntime,
  normalizarElementoPrimario,
} from './catalogJsonHelper.js';
import { setCooldown } from './cooldownManager.js';
import { getOwnedCombatActionList } from './ownedActionsHelper.js';
import { checkDanoConcentracao, quebrarConcentracao } from './concentrationManager.js';
const log = logger.child({ module: 'combateHelper' });

/**
 * Normaliza uma entrada de log de combate no momento da escrita.
 * Garante shape consistente: atacante/alvo sempre { id, nome }.
 */
export function normalizeCombatLogEntry(entry) {
  if (!entry) return entry;
  const n = { ...entry };

  // atacante: string → { id, nome }
  if (typeof n.atacante === 'string') {
    n.atacante = { id: n.atacanteId ?? n.userId ?? null, nome: n.atacante };
    delete n.atacanteId;
  }

  // alvo: garantir { id, nome }
  if (typeof n.alvo === 'string') {
    n.alvo = { id: n.alvoId ?? null, nome: n.alvo };
  } else if (!n.alvo && n.alvoNome) {
    n.alvo = { id: n.alvoId ?? null, nome: n.alvoNome };
  }
  if (n.alvo) {
    delete n.alvoId;
    delete n.alvoNome;
  }

  return n;
}

function _pushCombatLog(combate, entry) {
  combate.log.push(normalizeCombatLogEntry(entry));
}

function _findJogadorSessao(sessao, userId, personagem = null, jogadorStats = null) {
  const jogadoresMap = sessao?.jogadores || {};
  if (jogadoresMap[String(userId)]) return jogadoresMap[String(userId)];

  const conectados = Array.isArray(sessao?.jogadoresConectados) ? sessao.jogadoresConectados : [];
  return conectados.find((jogador) => {
    const jogadorUserId = jogador?.userId || jogador?.id;
    const jogadorPersonagemId = jogador?.personagemId || jogador?.personagem_id;
    return String(jogadorUserId) === String(userId)
      || (personagem?.id != null && String(jogadorPersonagemId) === String(personagem.id))
      || (personagem?.personagemId != null && String(jogadorPersonagemId) === String(personagem.personagemId))
      || (jogadorStats?.personagemId != null && String(jogadorPersonagemId) === String(jogadorStats.personagemId));
  }) || null;
}

function _resolvePersonagemSnapshot(sessao, userId, personagem = null, jogadorStats = null) {
  const completos = sessao?.personagensCompletos || {};
  const jogadorSessao = _findJogadorSessao(sessao, userId, personagem, jogadorStats);
  const candidateIds = new Set();
  const addId = (value) => {
    if (value != null && value !== '') candidateIds.add(String(value));
  };

  addId(personagem?.id);
  addId(personagem?.personagemId);
  addId(personagem?.personagem_id);
  addId(jogadorStats?.personagemId);
  addId(jogadorSessao?.personagemId || jogadorSessao?.personagem_id);

  for (const id of candidateIds) {
    if (completos[id]) {
      return { personagemId: id, personagem: completos[id], jogadorSessao };
    }
  }

  const nomeAlvo = personagem?.nome || jogadorStats?.personagemNome || jogadorSessao?.personagemNome || null;
  if (nomeAlvo) {
    for (const [id, completo] of Object.entries(completos)) {
      if (completo?.nome?.toLowerCase?.() === String(nomeAlvo).toLowerCase()) {
        return { personagemId: id, personagem: completo, jogadorSessao };
      }
    }
  }

  return {
    personagemId: Array.from(candidateIds)[0] || null,
    personagem: null,
    jogadorSessao
  };
}

function _getPersonagemHabilidades(personagemCompleto = {}) {
  return getOwnedCombatActionList(personagemCompleto);
}

function _buildResultadoHabilidadeInvalida({ personagem, userId, habilidadeId, habilidadeNome, erro, jogadorStats, habilidadeBase = null, tipoAcao = 'usar_habilidade' }) {
  return {
    valido: false,
    tipoAcao,
    personagem: personagem?.nome || 'Aventureiro',
    userId,
    habilidadeNome: habilidadeBase?.nome || habilidadeNome || 'Habilidade',
    habilidadeId: habilidadeBase?.id ?? habilidadeId ?? null,
    erro,
    custoMana: habilidadeBase?.custo_mana ?? 0,
    cooldown: habilidadeBase?.cooldown_turnos ?? 0,
    manaRestante: jogadorStats?.mana_atual ?? 0,
    manaMax: jogadorStats?.mana_max ?? 0
  };
}

function _getDefesaTemporaria(combate, jogadorStats) {
  const defesa = jogadorStats?.defesaTemporaria;
  if (!defesa) return null;
  if ((defesa.ativaAteRodada || 0) < (combate?.rodadaCombate || 0)) {
    delete jogadorStats.defesaTemporaria;
    return null;
  }
  return defesa;
}

/**
 * Parseia notacao de dado (ex: "2d6+3") e retorna resultado
 * @param {string} notacao - Ex: "1d6", "2d8+3", "1d20-1"
 * @returns {number} Resultado da rolagem
 */
export function rolarDado(notacao) {
  if (!notacao || typeof notacao !== 'string') {
    log.warn({ tipo: typeof notacao, notacao }, 'rolarDado: notacao invalida');
    return 1;
  }

  const match = notacao.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    log.warn({ notacao }, 'rolarDado: notacao nao reconhecida');
    return 1;
  }

  const quantidade = parseInt(match[1]);
  const faces = parseInt(match[2]);
  const modificador = match[3] ? parseInt(match[3]) : 0;

  let total = 0;
  for (let i = 0; i < quantidade; i++) {
    total += Math.floor(Math.random() * faces) + 1;
  }

  return Math.max(0, total + modificador);
}

/**
 * Calcula HP maximo de um personagem jogador
 * @param {Object} personagem - Dados do personagem
 * @returns {number} HP maximo
 */
export function calcularHP(personagem) {
  const constituicao = personagem.constituicao || 10;
  const nivel = personagem.nivel || 1;
  const modConstituicao = Math.floor((constituicao - 10) / 2);
  return Math.max(1, 10 + (nivel * 2) + (modConstituicao * nivel));
}

/**
 * Calcula mana maxima de um personagem
 * Formula: 10 + nivel + modInteligencia * 2
 */
export function calcularMana(personagem) {
  const inteligencia = personagem.inteligencia || 10;
  const nivel = personagem.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  return Math.max(5, 10 + nivel + modInt * 2);
}

function parseDiceNotation(notacao) {
  if (!notacao || typeof notacao !== 'string') return null;
  const match = String(notacao).trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  return {
    quantidade: parseInt(match[1], 10),
    faces: parseInt(match[2], 10),
    modificador: match[3] ? parseInt(match[3], 10) : 0
  };
}

function buildDiceNotation(notacaoBase, modificadorExtra = 0) {
  const parsed = parseDiceNotation(notacaoBase);
  if (!parsed) return notacaoBase || '1d6';

  const modificadorTotal = parsed.modificador + (Number.isFinite(modificadorExtra) ? modificadorExtra : 0);
  const modSuffix = modificadorTotal === 0
    ? ''
    : modificadorTotal > 0
      ? `+${modificadorTotal}`
      : `${modificadorTotal}`;

  return `${parsed.quantidade}d${parsed.faces}${modSuffix}`;
}

function applyOpenRollDamage(rawDamage, { critico = false, armadura = 0 } = {}) {
  const danoBase = Math.max(0, Number(rawDamage) || 0);
  if (critico) {
    return Math.max(1, danoBase * 2);
  }
  return Math.max(Math.ceil(danoBase * 0.25), danoBase - (Number(armadura) || 0));
}

function buildAttackBonus(pc = {}, jogadorStats = {}, statusEfeitos = []) {
  const attrs = pc.atributos || {};
  const modForca = Math.floor(((attrs.forca || 10) - 10) / 2);
  const bonusAtaqueEquip = jogadorStats.bonusAtaque || 0;
  const penalidadeCego = Object.entries(STATUS_PENALIDADE_ATAQUE)
    .reduce((acc, [nome, val]) => statusEfeitos.some((efeito) => efeito.nome === nome) ? acc + val : acc, 0);

  return {
    bonusAtaque: modForca + Math.min(2, Math.floor((pc.nivel || 1) / 6)) + bonusAtaqueEquip - penalidadeCego,
    modForca,
    penalidadeCego,
    bonusDanoEquip: jogadorStats.bonusDano || 0
  };
}

function buildAttackTestRequest({
  personagem,
  monstroAlvo,
  bonusAtaque,
  damageNotation,
  intentTipo,
  actionName,
  elemento = null,
  extraPendingAction = {}
} = {}) {
  const defesaAlvo = monstroAlvo?.defesa || 10;
  return {
    teste: `Ataque em ${monstroAlvo?.nome || 'Alvo'}`,
    atributo: 'Ataque',
    dificuldade: defesaAlvo,
    dcNumerico: defesaAlvo,
    contexto: `${personagem?.nome || 'Aventureiro'} tenta acertar ${monstroAlvo?.nome || 'o alvo'}.`,
    tipoDado: 'd20',
    origem: 'combate',
    intentTipo,
    dificuldadeLabel: `TA ${defesaAlvo}`,
    metadata: {
      rollKind: 'combat_attack',
      attackBonus: bonusAtaque,
      targetId: monstroAlvo?.id || null,
      targetName: monstroAlvo?.nome || 'Alvo',
      targetDefense: defesaAlvo,
      targetEvasion: monstroAlvo?.esquiva || 0,
      targetArmor: monstroAlvo?.armadura || 0,
      damageNotation,
      sourceActionName: actionName || 'Ataque',
      elemento: elemento || null,
    },
    pendingCombatAction: {
      stage: 'attack_roll',
      targetId: monstroAlvo?.id || null,
      targetName: monstroAlvo?.nome || 'Alvo',
      targetDefense: defesaAlvo,
      targetEvasion: monstroAlvo?.esquiva || 0,
      targetArmor: monstroAlvo?.armadura || 0,
      damageNotation,
      attackBonus: bonusAtaque,
      sourceActionName: actionName || 'Ataque',
      elemento: elemento || null,
      ...extraPendingAction
    }
  };
}

/**
 * Valida e processa uso de habilidade ativa em combate
 * @returns {{ valido: boolean, erro?: string, dano?: number, efeito?: object }}
 */
export function processarHabilidade(habilidade, jogadorState, options = {}) {
  const { rollDamage = true } = options;
  const { mana_atual = 0, cooldowns = {} } = jogadorState;
  const isSpell = Boolean(habilidade.escola_magia && habilidade.escola_magia !== 'nenhuma');
  const cdTipo = isSpell ? 'mag' : 'hab';
  const cooldownKey = `${cdTipo}_${habilidade.id ?? habilidade.nome ?? 'habilidade'}`;

  // Verificar mana
  if (habilidade.custo_mana > 0 && mana_atual < habilidade.custo_mana) {
    return { valido: false, erro: `Mana insuficiente (${mana_atual}/${habilidade.custo_mana})` };
  }

  // Verificar cooldown
  const cdRestante = cooldowns[cooldownKey] || 0;
  if (cdRestante > 0) {
    return { valido: false, erro: `Habilidade em cooldown (${cdRestante} turnos)` };
  }

  // Calcular dano se aplicável
  let dano = 0;
  if (habilidade.dano_base && rollDamage) {
    dano = rolarDado(habilidade.dano_base);
  }

  return {
    valido: true,
    dano,
    danoBaseNotation: habilidade.dano_base || null,
    cooldownKey,
    custoMana: habilidade.custo_mana,
    cooldown: habilidade.cooldown_turnos,
    efeito: normalizarEfeitoCatalogo(habilidade.efeito || null)
  };
}

/**
 * Calcula taxa de esquiva de um personagem (%)
 * Formula: (ModAGI + floor(ModDEX/2)) * 5 + floor(nivel*0.5) + equip_bonus - equip_penalidade
 * Cap: 0-50%
 * @param {Object} personagem - Dados do personagem
 * @param {Object} bonusEquip - Bonus agregados { esquiva_bonus, esquiva_penalidade }
 * @returns {number} Taxa de esquiva em porcentagem (0-50)
 */
export function calcularEsquiva(personagem, bonusEquip = {}) {
  const agilidade = personagem.agilidade || 10;
  const destreza = personagem.destreza || 10;
  const nivel = personagem.nivel || 1;

  const modAgi = Math.floor((agilidade - 10) / 2);
  const modDex = Math.floor((destreza - 10) / 2);

  const baseEsquiva = (modAgi + Math.floor(modDex / 2)) * 5;
  const bonusNivel = Math.floor(nivel * 0.5);
  const bonusEquipamento = bonusEquip.esquiva_bonus || 0;
  const penalidadeEquipamento = bonusEquip.esquiva_penalidade || 0;

  const total = baseEsquiva + bonusNivel + bonusEquipamento - penalidadeEquipamento;
  return Math.min(50, Math.max(0, total));
}

/**
 * Calcula armadura total de equipamentos (reducao flat de dano)
 * @param {Object} bonusEquip - Bonus agregados { armadura }
 * @returns {number} Valor de armadura
 */
export function calcularArmadura(bonusEquip = {}) {
  return bonusEquip.armadura || 0;
}

/**
 * Verifica se o alvo esquivou do ataque
 * @param {number} taxaEsquiva - Taxa de esquiva em % (0-50)
 * @returns {boolean} true se esquivou
 */
export function verificarEsquiva(taxaEsquiva) {
  return Math.random() * 100 < taxaEsquiva;
}

/**
 * Aplica formula de escalamento dinamico ao monstro
 * @param {Object} monstro - Monstro base do banco
 * @param {number} nivel - Nivel efetivo
 * @returns {Object} Stats efetivos
 */
export function calcularStatsEfetivos(monstro, nivel) {
  const n = Math.max(1, nivel);
  const hpBase = monstro.hp_base || 10;
  const constituicao = monstro.constituicao || 10;
  const forca = monstro.forca || 10;
  const ataqueBase = monstro.ataque_base || 2;
  const defesaBase = monstro.defesa_base || 10;
  const xpBase = monstro.xp_base || 50;
  const modAgi = Math.floor(((monstro.agilidade || 10) - 10) / 2);
  const modTam = _getModTamanho(monstro.tamanho);

  return {
    hp_max: Math.round(hpBase + (n * constituicao * 0.5)),
    ataque: Math.round(ataqueBase + Math.floor((forca - 10) / 2) + Math.min(2, Math.floor(n / 6))),
    defesa: Math.round(defesaBase + modAgi + Math.floor(n * 0.4)),
    armadura: Math.max(0, Math.round(Math.floor(defesaBase * 0.3) + Math.floor(n * 0.2) + modTam.armadura)),
    esquiva: Math.min(30, Math.max(0, (modAgi * 3) + modTam.esquiva)),
    dano_base: monstro.dano_base || '1d6',
    xp: xpBase * n
  };
}

/**
 * Modificadores de combate por tamanho do monstro
 */
function _getModTamanho(tamanho) {
  return TAMANHO_MODS[tamanho] || TAMANHO_MODS.medio;
}

/**
 * Aplica resistencias e imunidades elementais ao dano
 * @param {number} dano - Dano base calculado
 * @param {string|null} elemento - Elemento do ataque (ex: "fogo")
 * @param {Object} resistencias - Multiplicadores (ex: { fogo: 0.5 })
 * @param {Array} imunidades - Lista de imunidades (ex: ["veneno"])
 * @returns {number} Dano ajustado
 */
export function aplicarResistencias(dano, elemento, resistencias = {}, imunidades = []) {
  if (!elemento) return dano;
  if (Array.isArray(imunidades) && imunidades.includes(elemento)) return 0;
  const mult = resistencias[elemento];
  if (mult != null) return Math.max(0, Math.round(dano * mult));
  return dano;
}

/**
 * Classifica a interação elemental de um alvo contra um elemento de ataque.
 * @returns {'imune'|'resistente'|'vulneravel'|null} null = sem interação especial
 */
export function classificarResistenciaElemental(elemento, resistencias = {}, imunidades = []) {
  if (!elemento) return null;
  if (Array.isArray(imunidades) && imunidades.includes(elemento)) return 'imune';
  const mult = resistencias[elemento];
  if (mult == null) return null;
  if (mult <= 0) return 'imune';
  if (mult < 1) return 'resistente';
  if (mult > 1) return 'vulneravel';
  return null;
}

/**
 * Verifica acerto baseado na rolagem do d20
 * Nat 1 = miss automatico, Nat 20 = critico
 * Para rolagens normais, o ataque sempre "acerta" — esquiva eh checada separadamente
 * @param {number} rolagem - Resultado do d20
 * @returns {{ acertou: boolean, critico: boolean }}
 */
export function verificarAcerto(rolagem, total = null, defesaAlvo = null) {
  if (rolagem === 20) return { acertou: true, critico: true };
  if (rolagem === 1) return { acertou: false, critico: false };
  if (total == null || defesaAlvo == null) {
    return { acertou: true, critico: false };
  }
  return { acertou: Number(total) >= Number(defesaAlvo), critico: false };
}

/**
 * Calcula dano de um ataque
 * Se critico, ignora armadura (dano cheio)
 * @param {string} dano_base - Notacao do dado (ex: "1d8+2")
 * @param {number} modForca - Modificador de forca
 * @param {boolean} critico - Se acerto critico (2x dano, ignora armadura)
 * @param {number} armadura - Reducao flat de dano do alvo
 * @returns {number} Dano total
 */
export function calcularDano(dano_base, modForca = 0, critico = false, armadura = 0) {
  let dano = rolarDado(dano_base) + modForca;
  if (critico) {
    dano *= 2;
    // Critico ignora armadura
    return Math.max(1, dano);
  }
  // Cap: armadura reduz no maximo 75% do dano
  return Math.max(Math.ceil(dano * 0.25), dano - armadura);
}

/**
 * Seleciona habilidade do monstro baseado em cooldown e chance
 * @param {Object} monstro - Instancia do monstro com cooldowns
 * @param {number} rodadaCombate - Rodada atual do combate
 * @returns {Object|null} Habilidade selecionada ou null (ataque basico)
 */
export function selecionarHabilidadeMonstro(monstro, rodadaCombate) {
  const habilidades = monstro.habilidades || [];
  if (habilidades.length === 0) return null;

  const cooldowns = monstro.cooldowns || {};

  const disponiveis = habilidades.filter(hab => {
    const ultimoUso = cooldowns[hab.nome] || 0;
    const cooldown = hab.cooldown || 0;
    return (rodadaCombate - ultimoUso) >= cooldown;
  });

  if (disponiveis.length === 0) return null;

  // Selecionar baseado na chance de cada habilidade
  for (const hab of disponiveis) {
    const chance = hab.chance || 30;
    if (Math.random() * 100 < chance) {
      return hab;
    }
  }

  // Fallback: usar habilidade aleatoria ao inves de ataque basico
  return disponiveis[Math.floor(Math.random() * disponiveis.length)];
}

/**
 * Gera instancias de combate a partir de dados da IA e do banco
 * @param {Array} monstrosBanco - Monstros encontrados no banco
 * @param {Array} monstrosIA - Monstros sugeridos pela IA [{nome, tipo, quantidade, nivel_sugerido}]
 * @param {number} nivelMedio - Nivel medio dos jogadores
 * @returns {Array} Instancias prontas para combate
 */
export function gerarInstanciasCombate(monstrosBanco, monstrosIA, nivelMedio) {
  const instancias = [];
  let idCounter = 1;

  for (const sugestao of monstrosIA) {
    const quantidade = Math.min(sugestao.quantidade || 1, 5); // Max 5 por tipo
    const nivelEfetivo = sugestao.nivel_sugerido || nivelMedio;

    // Encontrar monstro correspondente no banco (3 tentativas: exato, contém nome completo, primeiro nome)
    const nomeIA = sugestao.nome.toLowerCase().trim();
    const monstroBase = monstrosBanco.find(m => m.nome.toLowerCase() === nomeIA)
      || monstrosBanco.find(m => m.nome.toLowerCase().includes(nomeIA) || nomeIA.includes(m.nome.toLowerCase()))
      || monstrosBanco.find(m => {
        const palavras = nomeIA.split(' ');
        return palavras.length > 0 && m.nome.toLowerCase().startsWith(palavras[0]) && palavras[0].length >= 4;
      });

    for (let i = 0; i < quantidade; i++) {
      if (monstroBase) {
        // Monstro encontrado no banco - usar stats reais
        const stats = calcularStatsEfetivos(monstroBase, nivelEfetivo);
        instancias.push({
          id: `${monstroBase.nome.toLowerCase().replace(/\s/g, '_')}_${idCounter++}`,
          monstroId: monstroBase.id,
          nome: quantidade > 1 ? `${monstroBase.nome} ${String.fromCharCode(64 + i + 1)}` : monstroBase.nome,
          tipo: monstroBase.tipo[0] || 'besta',
          tamanho: monstroBase.tamanho || 'medio',
          nivel: nivelEfetivo,
          hp_max: stats.hp_max,
          hp_atual: stats.hp_max,
          ataque: stats.ataque,
          defesa: stats.defesa,
          armadura: stats.armadura,
          esquiva: stats.esquiva,
          dano_base: stats.dano_base,
          habilidades: monstroBase.habilidades || [],
          forca: monstroBase.forca || 10,
          elemento: monstroBase.elemento || [],
          resistencias: monstroBase.resistencias || {},
          imunidades: monstroBase.imunidades || [],
          xp: stats.xp,
          status: 'vivo',
          cooldowns: {}
        });
      } else {
        // Monstro nao encontrado - gerar generico
        const stats = _gerarStatsGenericos(nivelEfetivo, sugestao.tipo);
        instancias.push({
          id: `${sugestao.nome.toLowerCase().replace(/\s/g, '_')}_${idCounter++}`,
          monstroId: null,
          nome: quantidade > 1 ? `${sugestao.nome} ${String.fromCharCode(64 + i + 1)}` : sugestao.nome,
          tipo: sugestao.tipo || 'besta',
          nivel: nivelEfetivo,
          hp_max: stats.hp_max,
          hp_atual: stats.hp_max,
          ataque: stats.ataque,
          defesa: stats.defesa,
          armadura: stats.armadura,
          esquiva: stats.esquiva,
          dano_base: stats.dano_base,
          forca: 10 + Math.floor(nivelEfetivo * 0.5),
          habilidades: [],
          elemento: [],
          xp: stats.xp,
          status: 'vivo',
          cooldowns: {}
        });
      }
    }
  }

  return instancias;
}

/**
 * Gera stats genericos para monstro nao encontrado no banco
 */
function _gerarStatsGenericos(nivel, tipo) {
  const n = Math.max(1, nivel);
  const baseHP = tipo === 'dragao' ? 30 : tipo === 'demonio' ? 25 : 15;
  return {
    hp_max: Math.round(baseHP + (n * 5)),
    ataque: Math.round(2 + Math.min(2, Math.floor(n / 6))),
    defesa: Math.round(10 + Math.floor(n * 0.4)),
    armadura: Math.round(Math.floor(n * 0.3)),
    esquiva: Math.min(20, Math.round(n * 1.5)),
    dano_base: n <= 3 ? '1d6' : n <= 6 ? '1d8' : '1d10',
    xp: 50 * n
  };
}

/**
 * Verifica se o combate acabou
 * @param {Object} combateState - Estado do combate no Redis
 * @returns {{ finalizado: boolean, resultado: string|null }}
 */
export function verificarFimCombate(combateState) {
  if (!combateState || !combateState.ativo) {
    return { finalizado: false, resultado: null };
  }

  const monstrosVivos = combateState.monstros.filter(m => m.status === 'vivo');
  const jogadoresVivos = Object.values(combateState.jogadores).filter(j => j.status === 'vivo');

  if (monstrosVivos.length === 0) {
    return { finalizado: true, resultado: RESULTADO_COMBATE.VITORIA };
  }

  if (jogadoresVivos.length === 0) {
    return { finalizado: true, resultado: RESULTADO_COMBATE.DERROTA };
  }

  return { finalizado: false, resultado: null };
}

/**
 * Formata contexto de combate para injetar no prompt da IA
 * @param {Object} combateState - Estado do combate
 * @param {string} userId - ID do jogador atual
 * @returns {string} Contexto formatado
 */
export function formatarContextoCombate(combateState, userId) {
  if (!combateState?.ativo) return '';

  const monstrosInfo = combateState.monstros
    .filter(m => m.status === 'vivo')
    .map(m => `${m.nome} (HP ${m.hp_atual}/${m.hp_max}, ATK ${m.ataque}, ARM ${m.armadura || 0}, ESQ ${m.esquiva || 0}%${m.imunidades?.length ? `, Imune: ${m.imunidades.join(',')}` : ''})`)
    .join(', ');

  const monstrosDerrotados = combateState.monstros
    .filter(m => m.status === 'derrotado')
    .map(m => m.nome)
    .join(', ');

  const jogadorHP = combateState.jogadores[userId];
  const manaStr = jogadorHP?.mana_atual != null ? ` | Mana ${jogadorHP.mana_atual}/${jogadorHP.mana_max}` : '';
  const jogadorInfo = jogadorHP
    ? `HP ${jogadorHP.hp_atual}/${jogadorHP.hp_max}${manaStr} | Esquiva ${jogadorHP.esquiva || 0}% | Armadura ${jogadorHP.armadura || 0}`
    : 'HP desconhecido';

  // HP e status de todos os aliados (excluindo o jogador atual)
  const aliadosInfo = Object.entries(combateState.jogadores)
    .filter(([id]) => String(id) !== String(userId))
    .map(([_, j]) => {
      const efeitos = j.status_efeitos || [];
      const efeitosStr = efeitos.length > 0 ? ` [${efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')}]` : '';
      return `${j.personagemNome} HP ${j.hp_atual}/${j.hp_max}${efeitosStr}`;
    })
    .join(', ');

  // Status effects ativos do jogador atual
  const statusInfo = jogadorHP?.status_efeitos?.length
    ? jogadorHP.status_efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')
    : '';

  let contexto = `\n[COMBATE ATIVO - Rodada ${combateState.rodadaCombate}]`;
  contexto += `\n[Monstros vivos: ${monstrosInfo || 'nenhum'}]`;
  if (monstrosDerrotados) contexto += `\n[Monstros derrotados: ${monstrosDerrotados}]`;
  contexto += `\n[Seu status: ${jogadorInfo}]`;
  if (aliadosInfo) contexto += `\n[Aliados: ${aliadosInfo}]`;
  if (statusInfo) contexto += `\n[Seus efeitos: ${statusInfo}]`;

  // Habilidades disponíveis do jogador
  const jogadorCooldowns = jogadorHP?.cooldowns || {};
  if (combateState.habilidadesJogador?.length > 0) {
    const habsStr = combateState.habilidadesJogador
      .map(h => {
        const cd = jogadorCooldowns[h.id] || 0;
        const cdStr = cd > 0 ? ` [CD: ${cd}t]` : '';
        return `${h.nome} (${h.custo_mana}MP, ${h.tipo}${h.dano_base ? `, ${h.dano_base}` : ''}${cdStr})`;
      })
      .join(', ');
    contexto += `\n[Habilidades disponiveis: ${habsStr}]`;
  }

  return contexto;
}

/**
 * Resolve TODA a mecanica de combate de uma rodada ANTES da IA narrar.
 * Muta o estado do combate (HP, status, log, rodada) e retorna um resumo.
 * @param {Object} combate - Estado do combate
 * @param {string} userId - ID do jogador
 * @param {Object} sessao - Sessao completa
 * @param {Object} personagem - Dados do personagem
 * @param {Object|null} combatIntent - { tipo: 'atacar'|'defender'|'fugir'|'usar_habilidade'|'conjurar_magia', habilidadeId?, habilidadeNome?, magiaId?, magiaNome? }
 */
/**
 * Handler map por intent de combate.
 * Cada handler recebe (ctx, resultados) e popula os campos relevantes.
 * ctx = { combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent }
 */
const COMBAT_INTENT_HANDLERS = {
  atacar: (ctx, r) => {
    const ataque = _resolverAtaque(ctx.combate, ctx.userId, ctx.sessao, ctx.personagem, ctx.jogadorStats, ctx.statusEfeitos, ctx.combatIntent);
    if (ataque?.requerTeste) {
      r.requerTeste = ataque.requerTeste;
      r.acaoConsumida = false;
      return;
    }
    r.ataqueJogador = ataque;
    r.acaoConsumida = !!ataque;
  },
  defender: (ctx, r) => {
    r.defesa = _resolverDefesa(ctx.combate, ctx.userId, ctx.personagem, ctx.jogadorStats);
    r.acaoConsumida = !!r.defesa;
  },
  fugir: (ctx, r) => {
    r.requerTeste = _prepararTesteFuga(ctx.combate, ctx.userId, ctx.personagem);
    r.acaoConsumida = false;
    log.info({ userId: ctx.userId, teste: r.requerTeste }, 'Fuga requer teste de habilidade');
  },
  usar_habilidade: (ctx, r) => {
    const habilidade = _resolverHabilidade(ctx.combate, ctx.userId, ctx.sessao, ctx.personagem, ctx.jogadorStats, ctx.statusEfeitos, ctx.combatIntent);
    if (habilidade?.requerTeste) {
      r.requerTeste = habilidade.requerTeste;
      r.acaoConsumida = false;
      return;
    }
    r.habilidade = habilidade;
    r.acaoConsumida = habilidade?.valido !== false;
  },
  conjurar_magia: (ctx, r) => {
    const habilidade = _resolverHabilidade(ctx.combate, ctx.userId, ctx.sessao, ctx.personagem, ctx.jogadorStats, ctx.statusEfeitos, ctx.combatIntent);
    if (habilidade?.requerTeste) {
      r.requerTeste = habilidade.requerTeste;
      r.acaoConsumida = false;
      return;
    }
    r.habilidade = habilidade;
    r.acaoConsumida = habilidade?.valido !== false;
  },
};

/**
 * Fase 1: Processa status effects do jogador (DOT, impedimentos).
 * Retorna se o jogador esta impedido de agir.
 */
function _resolveCombatStatusEffects(sessao, userId, personagem, jogadorStats, resultados) {
  const snapshotAtual = _resolvePersonagemSnapshot(sessao, userId, personagem, jogadorStats);
  const pcStatus = snapshotAtual.personagem || {};
  const statusEfeitos = pcStatus.status_efeitos || [];
  jogadorStats.status_efeitos = statusEfeitos;
  let impedidoDeAgir = false;

  for (const efeito of statusEfeitos) {
    if (STATUS_IMPEDE_ACAO.includes(efeito.nome)) {
      impedidoDeAgir = true;
      resultados.statusEfeitos.push({ tipo: 'impedido', efeito: efeito.nome, personagem: personagem.nome, userId });
    } else if (STATUS_DANO_POR_TURNO[efeito.nome]) {
      const danoPorTurno = rolarDado(STATUS_DANO_POR_TURNO[efeito.nome]);
      jogadorStats.hp_atual = Math.max(0, jogadorStats.hp_atual - danoPorTurno);
      if (jogadorStats.hp_atual <= 0 && jogadorStats.status === STATUS_COMBATENTE.VIVO) jogadorStats.status = STATUS_COMBATENTE.INCONSCIENTE;
      resultados.statusEfeitos.push({
        tipo: 'dano', efeito: efeito.nome, dano: danoPorTurno,
        hpRestante: jogadorStats.hp_atual, hpMax: jogadorStats.hp_max,
        personagem: personagem.nome, userId, personagemId: jogadorStats.personagemId,
        derrotado: jogadorStats.status === STATUS_COMBATENTE.DERROTADO,
      });
    }
  }

  return { impedidoDeAgir, statusEfeitos };
}

/**
 * Fase 2: Resolve a acao do jogador via handler map por intent.
 * Retorna true se a acao requer teste (fuga, habilidade com teste).
 */
function _resolveCombatAction(ctx, resultados) {
  const handler = COMBAT_INTENT_HANDLERS[ctx.intentTipo];
  if (handler) handler(ctx, resultados);
  return !!resultados.requerTeste;
}

/**
 * Fase 3: Contra-ataques + controle de rodada.
 */
function _applyRoundConsequences(combate, userId, sessao, resultados) {
  _executarContraAtaques(combate, sessao, resultados);
  _controlarRodada(combate, userId, sessao, resultados);
}

/**
 * Fase 4: Verificar fim de combate e atribuir resultado.
 */
function _finalizeCombatState(combate, resultados) {
  _verificarFimEAtribuir(combate, resultados);
}

/**
 * Orquestrador principal de mecanica de combate.
 * Retorna CombatRoundResult com todos os efeitos da rodada.
 *
 * @param {Object} combate - Estado do combate
 * @param {string} userId - ID do jogador
 * @param {Object} sessao - Sessao completa
 * @param {Object} personagem - Dados do personagem
 * @param {Object|null} combatIntent - { tipo: 'atacar'|'defender'|'fugir'|'usar_habilidade'|'conjurar_magia', habilidadeId?, habilidadeNome?, magiaId?, magiaNome? }
 * @returns {CombatRoundResult}
 */
export function resolverMecanicaCombate(combate, userId, sessao, personagem, combatIntent = null) {
  const intentTipo = combatIntent?.tipo || 'atacar';
  const resultados = createCombatRoundResult({ intentTipo });

  if (!combate?.ativo) return resultados;

  const jogadorStats = combate.jogadores[userId];
  if (!jogadorStats) return resultados;
  if (jogadorStats.status === 'derrotado' || jogadorStats.status === STATUS_COMBATENTE.INCONSCIENTE) {
    resultados.jogadorDerrotado = true;
    return resultados;
  }

  // --- 1. Status effects (DOT, impedimentos) ---
  const { impedidoDeAgir, statusEfeitos } = _resolveCombatStatusEffects(
    sessao, userId, personagem, jogadorStats, resultados
  );

  // --- 2. Acao do jogador (por intent via handler map) ---
  if (!impedidoDeAgir) {
    const ctx = { combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent, intentTipo };
    const requerTeste = _resolveCombatAction(ctx, resultados);
    if (requerTeste) return resultados;
  } else {
    resultados.acaoConsumida = true;
  }

  if (!resultados.acaoConsumida) return resultados;

  // --- 3. Contra-ataques + controle de rodada ---
  _applyRoundConsequences(combate, userId, sessao, resultados);

  // --- 4. Fim de combate ---
  _finalizeCombatState(combate, resultados);

  return resultados;
}

/**
 * Resolve ataque basico do jogador contra primeiro monstro vivo
 */
function _resolverAtaque(combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent = null) {
  const alvoId = combatIntent?.alvoId;
  const monstroAlvo = (alvoId && combate.monstros.find(m => m.id === alvoId && m.status === 'vivo'))
    || combate.monstros.find(m => m.status === 'vivo');
  if (!monstroAlvo) return null;

  const snapshot = _resolvePersonagemSnapshot(sessao, userId, personagem, jogadorStats);
  const pc = snapshot.personagem || {};
  const { bonusAtaque, modForca, bonusDanoEquip } = buildAttackBonus(pc, jogadorStats, statusEfeitos);
  const danoBase = jogadorStats.dano_base || (pc.nivel >= 5 ? '1d8' : '1d6');
  const damageNotation = buildDiceNotation(danoBase, modForca + bonusDanoEquip);

  return {
    requerTeste: buildAttackTestRequest({
      personagem,
      monstroAlvo,
      bonusAtaque,
      damageNotation,
      intentTipo: 'atacar',
      actionName: 'Ataque',
      elemento: jogadorStats.elemento || null,
      extraPendingAction: {
        actionKind: 'attack'
      }
    })
  };
}

/**
 * Resolve defesa: bonus de esquiva +25%, reducao de dano 50% nos contra-ataques
 */
function _resolverDefesa(combate, userId, personagem, jogadorStats) {
  jogadorStats.defesaTemporaria = {
    esquivaBonus: 25,
    reducaoDano: 0.5,
    ativaAteRodada: combate.rodadaCombate + 1
  };
  const result = {
    personagem: personagem.nome,
    userId,
    esquivaBonus: jogadorStats.defesaTemporaria.esquivaBonus,
    reducaoDano: jogadorStats.defesaTemporaria.reducaoDano,
    hpAtual: jogadorStats.hp_atual,
    hpMax: jogadorStats.hp_max,
  };
  _pushCombatLog(combate, { tipo: 'defesa_jogador', ...result, timestamp: Date.now() });
  return result;
}

// ────────── Funções extraídas de resolverMecanicaCombate (seções 3-5) ──────────

/**
 * Seção 3 — Contra-ataques dos monstros vivos contra jogadores aleatórios
 */
function _executarContraAtaques(combate, sessao, resultados) {
  const monstrosVivos = combate.monstros.filter(m => m.status === 'vivo');
  for (const monstro of monstrosVivos) {
    const jogadoresVivos = Object.entries(combate.jogadores).filter(([_, j]) => j.status === 'vivo');
    if (jogadoresVivos.length === 0) break;

    const [alvoId, alvoStats] = jogadoresVivos[Math.floor(Math.random() * jogadoresVivos.length)];
    const habilidade = selecionarHabilidadeMonstro(monstro, combate.rodadaCombate);
    const rolagemMonstro = Math.floor(Math.random() * 20) + 1;
    const { acertou: mAcertou, critico: mCritico } = verificarAcerto(rolagemMonstro);

    let danoMonstro = 0;
    let mEsquivou = false;
    if (mAcertou) {
      const defesaTemporaria = _getDefesaTemporaria(combate, alvoStats);
      const esquivaExtra = defesaTemporaria?.esquivaBonus || 0;
      const esquivaEfetiva = Math.min(75, (alvoStats.esquiva || 0) + esquivaExtra);
      if (!mCritico && verificarEsquiva(esquivaEfetiva)) {
        mEsquivou = true;
      } else {
        const danoNotacao = habilidade?.dano || monstro.dano_base;
        const modForcaM = Math.floor(((monstro.forca || 10) - 10) / 2);
        danoMonstro = calcularDano(danoNotacao, modForcaM, mCritico, alvoStats.armadura || 0);
        if (defesaTemporaria?.reducaoDano) {
          danoMonstro = Math.max(1, Math.floor(danoMonstro * (1 - defesaTemporaria.reducaoDano)));
        }
        alvoStats.hp_atual = Math.max(0, alvoStats.hp_atual - danoMonstro);

        // Teste de concentração ao receber dano (DC = max(10, dano/2))
        if (danoMonstro > 0 && alvoStats.hp_atual > 0) {
          const concCheck = checkDanoConcentracao(sessao, alvoId, danoMonstro);
          if (concCheck.precisaTestar) {
            const rolagemConc = Math.floor(Math.random() * 20) + 1;
            const modCon = Math.floor(((alvoStats.constituicao || 10) - 10) / 2);
            const totalConc = rolagemConc + modCon;
            if (totalConc < concCheck.dc) {
              const magiaQuebrada = quebrarConcentracao(sessao, alvoId, 'dano_recebido');
              if (magiaQuebrada) {
                resultados.concentracaoQuebrada = {
                  personagem: alvoStats.personagemNome,
                  magia: magiaQuebrada.nome,
                  dano: danoMonstro,
                  dc: concCheck.dc,
                  rolagem: rolagemConc,
                  total: totalConc,
                };
              }
            }
          }
        }

        if (alvoStats.hp_atual <= 0 && alvoStats.status === 'vivo') alvoStats.status = 'inconsciente';
      }
    }

    if (habilidade) monstro.cooldowns[habilidade.nome] = combate.rodadaCombate;

    resultados.contraAtaques.push({
      atacante: monstro.nome, atacanteId: monstro.id,
      habilidade: habilidade?.nome || 'Ataque básico',
      alvoId, alvoNome: alvoStats.personagemNome,
      rolagem: rolagemMonstro,
      acertou: mAcertou && !mEsquivou, esquivou: mEsquivou, critico: mCritico,
      dano: danoMonstro, armaduraAlvo: alvoStats.armadura || 0,
      hpRestante: alvoStats.hp_atual, hpMax: alvoStats.hp_max,
      inconsciente: alvoStats.status === 'inconsciente',
      personagemId: alvoStats.personagemId,
    });
    _pushCombatLog(combate, { tipo: 'ataque_monstro', ...resultados.contraAtaques.at(-1), timestamp: Date.now() });
  }
}

/**
 * Seção 4 — Controle de rodada: avança quando todos agiram, tick efeitos
 */
function _controlarRodada(combate, userId, sessao, resultados) {
  if (!combate.jogadoresQueAgiram) combate.jogadoresQueAgiram = [];
  if (!combate.jogadoresQueAgiram.includes(userId)) combate.jogadoresQueAgiram.push(userId);

  const totalJogadoresVivos = Object.entries(combate.jogadores).filter(([_, j]) => j.status === 'vivo').length;
  if (combate.jogadoresQueAgiram.length >= totalJogadoresVivos) {
    combate.rodadaCombate++;
    combate.jogadoresQueAgiram = [];
    resultados.rodadaAvancou = true;

    // Limpar defesa temporária expirada dos jogadores.
    // Status effects de jogadores são decrementados pelo effectManager (masterNarrationEngine),
    // então NÃO decrementamos aqui para evitar decremento duplo.
    for (const [jId, jStats] of Object.entries(combate.jogadores)) {
      const defesaTemporaria = _getDefesaTemporaria(combate, jStats);
      if (!defesaTemporaria) {
        delete jStats.defesaTemporaria;
      }
    }

    // Tick de efeitos nos monstros (DOT + decremento)
    for (const monstro of combate.monstros) {
      if (monstro.status !== 'vivo' || !monstro.status_efeitos?.length) continue;

      monstro.status_efeitos = monstro.status_efeitos.filter(e => {
        // DOT: aplicar dano se o efeito causa dano por turno
        const dadoDano = STATUS_DANO_POR_TURNO[e.nome];
        if (dadoDano) {
          const dano = rolarDado(dadoDano);
          monstro.hp_atual = Math.max(0, monstro.hp_atual - dano);
          if (monstro.hp_atual <= 0) monstro.status = 'derrotado';
          resultados.statusEfeitosMonstro.push({
            tipo: 'dano', efeito: e.nome, dano,
            monstroId: monstro.id, monstroNome: monstro.nome,
            hpRestante: monstro.hp_atual, hpMax: monstro.hp_max,
            derrotado: monstro.status === 'derrotado',
          });
          _pushCombatLog(combate, {
            tipo: 'status_dano', alvo: { id: monstro.id, nome: monstro.nome },
            status: e.nome, dano, timestamp: Date.now()
          });
        }

        e.duracao = (e.duracao || 1) - 1;
        if (e.duracao <= 0) {
          resultados.statusEfeitosMonstro.push({
            tipo: 'removido', efeito: e.nome,
            monstroId: monstro.id, monstroNome: monstro.nome,
          });
          return false;
        }
        return true;
      });
    }
  }
}

/**
 * Seção 5 — Verifica fim de combate e atribui resultado
 */
function _verificarFimEAtribuir(combate, resultados) {
  const { finalizado, resultado } = verificarFimCombate(combate);
  resultados.combateFinalizado = finalizado;
  resultados.resultadoCombate = resultado;
}

// ────────────────────────────────────────────────────────────────────────────────

/**
 * Prepara teste de fuga sem resolver — jogador rola o dado via pipeline de testes.
 * DC = 10 + (monstrosVivos * 2). Retorna config para criarTestesPendentes().
 */
function _prepararTesteFuga(combate, userId, personagem) {
  const monstrosVivos = combate.monstros.filter(m => m.status === 'vivo').length;
  const dcNumerico = 10 + (monstrosVivos * 2);

  // Mapear DC numérico → nome de dificuldade mais próximo
  let dificuldadeNome = 'Média';
  let menorDiff = Number.POSITIVE_INFINITY;
  for (const [nome, valor] of Object.entries(TESTES_CONFIG.dificuldade)) {
    const diff = Math.abs(valor - dcNumerico);
    if (diff < menorDiff) {
      menorDiff = diff;
      dificuldadeNome = nome;
    }
  }

  return {
    teste: 'Agilidade',
    dificuldade: dificuldadeNome,
    dcNumerico,
    contexto: `${personagem.nome} tenta fugir do combate (${monstrosVivos} monstro${monstrosVivos > 1 ? 's' : ''} vivo${monstrosVivos > 1 ? 's' : ''})`,
    tipoDado: 'd20',
    origem: 'combate',
    intentTipo: 'fugir',
  };
}

/**
 * Resolve tentativa de fuga: teste de AGI vs DC baseada nos monstros vivos
 * @deprecated Mantido para referência — fuga agora usa _prepararTesteFuga + finalizarAcaoCombatePosTeste
 */
function _resolverFuga(combate, userId, sessao, personagem) {
  const snapshot = _resolvePersonagemSnapshot(sessao, userId, personagem);
  const pc = snapshot.personagem || {};
  const attrs = pc.atributos || {};
  const modAgi = Math.floor(((attrs.agilidade || 10) - 10) / 2);

  const rolagem = Math.floor(Math.random() * 20) + 1;
  const total = rolagem + modAgi;
  const monstrosVivos = combate.monstros.filter(m => m.status === 'vivo').length;
  const dc = 10 + (monstrosVivos * 2);
  const sucesso = total >= dc;

  const result = {
    personagem: personagem.nome,
    userId,
    rolagem,
    modificador: modAgi,
    total,
    dc,
    sucesso,
  };
  _pushCombatLog(combate, { tipo: 'fuga_jogador', ...result, timestamp: Date.now() });
  return result;
}

/**
 * Resolve uso de habilidade ativa em combate
 */
function buildDamageTestRequest(acaoPendente, personagem) {
  return {
    origem: 'combate',
    jogadorAlvo: acaoPendente.userId,
    personagemAlvo: personagem?.nome || 'Aventureiro',
    teste: `Dano de ${acaoPendente.sourceActionName || 'Ataque'}`,
    dificuldade: 0,  // damage rolls have no DC
    dcNumerico: 0,
    tipoDado: acaoPendente.damageNotation || '1d6',
    contexto: `${personagem?.nome || 'Aventureiro'} conectou o golpe em ${acaoPendente.targetName || 'o alvo'}. Role o dano.`,
    metadata: {
      rollKind: 'combat_damage',
      difficultyLabel: 'Dano',
      sourceActionName: acaoPendente.sourceActionName || 'Ataque',
      targetId: acaoPendente.targetId || null,
      targetName: acaoPendente.targetName || 'Alvo',
      critico: Boolean(acaoPendente.critico),
      targetArmor: acaoPendente.targetArmor || 0,
      elemento: acaoPendente.elemento || null
    }
  };
}

function buildBaseAttackOutcome(acaoPendente, personagem, monstroAlvo, { rolagem, bonus, acertou, esquivou = false, critico = false, dano = 0 } = {}) {
  return {
    atacante: personagem.nome,
    userId: acaoPendente.userId,
    alvo: monstroAlvo.nome,
    alvoId: monstroAlvo.id,
    rolagem,
    bonus,
    acertou,
    esquivou,
    critico,
    dano,
    armaduraAlvo: monstroAlvo.armadura || 0,
    hpRestante: monstroAlvo.hp_atual,
    hpMax: monstroAlvo.hp_max,
    derrotado: monstroAlvo.status === 'derrotado',
    xp: monstroAlvo.xp || 0,
  };
}

function finalizeResolvedCombatRound(sessao, combate, userId, resultados) {
  _executarContraAtaques(combate, sessao, resultados);
  _controlarRodada(combate, userId, sessao, resultados);
  _verificarFimEAtribuir(combate, resultados);
  return resultados;
}

function _consumirRecursosHabilidade(sessao, userId, jogadorStats, hab, validacao) {
  if (validacao.custoMana > 0) {
    jogadorStats.mana_atual = Math.max(0, (jogadorStats.mana_atual || 0) - validacao.custoMana);
  }
  if (validacao.cooldown > 0) {
    const isSpell = Boolean(hab.escola_magia && hab.escola_magia !== 'nenhuma');
    setCooldown(sessao, userId, isSpell ? 'mag' : 'hab', hab.id, validacao.cooldown);
    if (!jogadorStats.cooldowns) jogadorStats.cooldowns = {};
    jogadorStats.cooldowns[validacao.cooldownKey] = validacao.cooldown;
  }
}

function _resolverHabilidade(combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent) {
  const tipoAcao = combatIntent?.tipo === 'conjurar_magia' ? 'conjurar_magia' : 'usar_habilidade';
  const habilidadeId = combatIntent?.habilidadeId ?? combatIntent?.magiaId;
  const habilidadeNome = combatIntent?.habilidadeNome ?? combatIntent?.magiaNome;

  const snapshot = _resolvePersonagemSnapshot(sessao, userId, personagem, jogadorStats);
  const pc = snapshot.personagem || {};
  const habilidades = _getPersonagemHabilidades(pc);
  const hab = habilidades.find(h => String(h.id) === String(habilidadeId)) || habilidades.find(h => h.nome === habilidadeNome);

  if (!hab) {
    log.warn({ userId, habilidadeId, habilidadeNome }, 'Habilidade nao encontrada no personagem');
    const result = _buildResultadoHabilidadeInvalida({
      personagem, userId, habilidadeId, habilidadeNome,
      erro: 'Habilidade nao encontrada',
      jogadorStats,
      tipoAcao
    });
    _pushCombatLog(combate, { tipo: tipoAcao === 'conjurar_magia' ? 'magia_falhou' : 'habilidade_falhou', ...result, timestamp: Date.now() });
    return result;
  }

  const validacao = processarHabilidade(hab, jogadorStats, { rollDamage: false });
  if (!validacao.valido) {
    const result = _buildResultadoHabilidadeInvalida({
      personagem, userId, habilidadeId, habilidadeNome,
      erro: validacao.erro,
      jogadorStats,
      habilidadeBase: hab,
      tipoAcao
    });
    _pushCombatLog(combate, { tipo: tipoAcao === 'conjurar_magia' ? 'magia_falhou' : 'habilidade_falhou', ...result, timestamp: Date.now() });
    return result;
  }

  if (validacao.custoMana > 0) {
    jogadorStats.mana_atual = Math.max(0, (jogadorStats.mana_atual || 0) - validacao.custoMana);
  }
  if (validacao.cooldown > 0) {
    // Gravar no cooldownManager (store canônico em sessao.estadoJogo.cooldowns)
    const isSpell = Boolean(hab.escola_magia && hab.escola_magia !== 'nenhuma');
    setCooldown(sessao, userId, isSpell ? 'mag' : 'hab', hab.id, validacao.cooldown);
    // Sincronizar em jogadorStats para o turno corrente
    if (!jogadorStats.cooldowns) jogadorStats.cooldowns = {};
    jogadorStats.cooldowns[validacao.cooldownKey] = validacao.cooldown;
  }

  const alvoId = combatIntent?.alvoId;
  let ataqueHabilidade = null;
  let efeitoAplicado = null;
  const monstroAlvo = (alvoId && combate.monstros.find(m => m.id === alvoId && m.status === 'vivo'))
    || combate.monstros.find(m => m.status === 'vivo');

  if (validacao.danoBaseNotation && monstroAlvo) {
    const { bonusAtaque } = buildAttackBonus(pc, jogadorStats, statusEfeitos);
    return {
      valido: true,
      tipoAcao,
      habilidadeNome: hab.nome,
      habilidadeId: hab.id,
      requerTeste: buildAttackTestRequest({
        personagem,
        monstroAlvo,
        bonusAtaque,
        damageNotation: validacao.danoBaseNotation,
        intentTipo: tipoAcao,
        actionName: hab.nome,
        elemento: normalizarElementoPrimario(hab.elemento),
        extraPendingAction: {
          actionKind: tipoAcao === 'conjurar_magia' ? 'spell' : 'ability',
          habilidadeBase: hab,
          habilidadePreValidada: validacao,
          combatIntent,
          resourcesConsumed: true  // mana/cooldown already consumed above
        }
      })
    };
  }

  if (validacao.dano > 0 && monstroAlvo) {
    let danoFinal = validacao.dano;
    const elementoHab = normalizarElementoPrimario(hab.elemento);
    if (elementoHab) {
      danoFinal = aplicarResistencias(danoFinal, elementoHab, monstroAlvo.resistencias || {}, monstroAlvo.imunidades || []);
    }
    monstroAlvo.hp_atual = Math.max(0, monstroAlvo.hp_atual - danoFinal);
    if (monstroAlvo.hp_atual <= 0) monstroAlvo.status = 'derrotado';

    ataqueHabilidade = {
      alvo: monstroAlvo.nome, alvoId: monstroAlvo.id,
      dano: danoFinal, elemento: elementoHab,
      hpRestante: monstroAlvo.hp_atual, hpMax: monstroAlvo.hp_max,
      derrotado: monstroAlvo.status === 'derrotado', xp: monstroAlvo.xp || 0,
    };
  }

  // Auto-apply efeito da habilidade no alvo (ex: queimando, envenenado)
  if (validacao.efeito && monstroAlvo && monstroAlvo.status === 'vivo') {
    if (!monstroAlvo.status_efeitos) monstroAlvo.status_efeitos = [];
    const efeitoRuntime = normalizarEfeitoRuntime(validacao.efeito);
    if (efeitoRuntime?.nome) {
      const existente = monstroAlvo.status_efeitos.find(e => e.nome === efeitoRuntime.nome);
      if (existente) {
        existente.duracao = efeitoRuntime.duracao;
        if (efeitoRuntime.valor != null) existente.valor = efeitoRuntime.valor;
        if (efeitoRuntime.dano_por_turno != null) existente.dano_por_turno = efeitoRuntime.dano_por_turno;
        if (efeitoRuntime.cura_por_turno != null) existente.cura_por_turno = efeitoRuntime.cura_por_turno;
      } else {
        monstroAlvo.status_efeitos.push(efeitoRuntime);
      }
      efeitoAplicado = { status: efeitoRuntime.nome, duracao: efeitoRuntime.duracao, valor: efeitoRuntime.valor || 0 };
      log.info({ alvo: monstroAlvo.nome, efeito: efeitoRuntime.nome, duracao: efeitoRuntime.duracao }, 'Efeito de habilidade aplicado no monstro');
    }
  }

  const result = {
    valido: true,
    tipoAcao,
    personagem: personagem.nome, userId,
    habilidadeNome: hab.nome, habilidadeId: hab.id,
    custoMana: validacao.custoMana || 0,
    cooldown: validacao.cooldown || 0,
    dano: validacao.dano,
    efeito: validacao.efeito,
    efeitoAplicado,
    ataque: ataqueHabilidade,
    manaRestante: jogadorStats.mana_atual,
    manaMax: jogadorStats.mana_max,
  };
  _pushCombatLog(combate, { tipo: tipoAcao === 'conjurar_magia' ? 'magia_jogador' : 'habilidade_jogador', ...result, timestamp: Date.now() });
  return result;
}

/**
 * Completa resolução de ação de combate após teste mecânico.
 * Chamado pelo testEngine quando o jogador rola o dado para ação pendente.
 *
 * @param {Object} sessao - Sessão ativa
 * @param {Object} acaoPendente - sessao.estadoJogo.acaoPendenteCombate
 * @param {Object} resultadoTeste - Resultado de resolverTeste() (testeHelper)
 * @returns {Object} Mesma shape de resolverMecanicaCombate() para reuso do pipeline
 */
export function finalizarAcaoCombatePosTeste(sessao, acaoPendente, resultadoTeste) {
  const combate = sessao.estadoJogo?.combate;
  if (!combate) {
    log.error('finalizarAcaoCombatePosTeste: sem combate ativo na sessão');
    return null;
  }

  const userId = acaoPendente.userId;
  const personagem = acaoPendente.personagem;

  // Shape base consistente com resolverMecanicaCombate
  const resultados = {
    statusEfeitos: acaoPendente.statusEfeitos || [],
    contraAtaques: [],
    statusRemovidos: [],
    statusEfeitosMonstro: [],
    acaoConsumida: true,
    combateFinalizado: false,
    resultadoCombate: null,
    rodadaAvancou: false,
    requerTeste: null,
    openRolls: [],
  };

  if (acaoPendente.stage === 'attack_roll' || acaoPendente.stage === 'damage_roll') {
    const monstroAlvo = combate.monstros.find((monstro) => monstro.id === acaoPendente.targetId) || null;
    const jogadorStats = combate.jogadores[userId];
    if (!monstroAlvo || !jogadorStats) {
      log.warn({ userId, targetId: acaoPendente.targetId, stage: acaoPendente.stage }, 'Acao pendente de combate sem alvo ou jogador valido');
      return resultados;
    }

    if (acaoPendente.stage === 'attack_roll') {
      const rolagem = Number(resultadoTeste.rolagemBruta ?? resultadoTeste.total ?? 0);
      const bonus = Number(acaoPendente.attackBonus || 0);
      const total = rolagem + bonus;
      const defesaAlvo = Number(acaoPendente.targetDefense || monstroAlvo.defesa || 10);
      const { acertou, critico } = verificarAcerto(rolagem, total, defesaAlvo);
      const attackKind = acaoPendente.actionKind || 'attack';

      if ((attackKind === 'ability' || attackKind === 'spell') && !acaoPendente.resourcesConsumed) {
        _consumirRecursosHabilidade(
          sessao,
          userId,
          jogadorStats,
          acaoPendente.habilidadeBase || {},
          acaoPendente.habilidadePreValidada || { custoMana: 0, cooldown: 0, cooldownKey: null }
        );
        acaoPendente.resourcesConsumed = true;
      }

      let esquivaRolagem = null;
      let esquivou = false;
      if (acertou && !critico && Number(acaoPendente.targetEvasion || 0) > 0) {
        esquivaRolagem = Math.floor(Math.random() * 100) + 1;
        esquivou = esquivaRolagem <= Number(acaoPendente.targetEvasion || 0);
        resultados.openRolls.push({
          actorName: monstroAlvo.nome,
          actorUserId: 'sistema',
          dice: 'd100',
          result: esquivaRolagem,
          description: `Esquiva de ${monstroAlvo.nome}`,
          threshold: Number(acaoPendente.targetEvasion || 0),
          success: esquivou
        });
      }

      if (!acertou || esquivou) {
        const ataqueBase = buildBaseAttackOutcome(acaoPendente, personagem, monstroAlvo, {
          rolagem,
          bonus,
          acertou: acertou && !esquivou,
          esquivou,
          critico,
          dano: 0
        });

        if (attackKind === 'attack') {
          resultados.ataqueJogador = ataqueBase;
          _pushCombatLog(combate, { tipo: 'ataque_jogador', ...ataqueBase, timestamp: Date.now() });
        } else {
          const habilidadeBase = acaoPendente.habilidadeBase || {};
          resultados.habilidade = {
            valido: true,
            tipoAcao: acaoPendente.tipo,
            personagem: personagem.nome,
            userId,
            habilidadeNome: habilidadeBase.nome || acaoPendente.sourceActionName,
            habilidadeId: habilidadeBase.id || null,
            custoMana: acaoPendente.habilidadePreValidada?.custoMana || 0,
            cooldown: acaoPendente.habilidadePreValidada?.cooldown || 0,
            dano: 0,
            efeito: acaoPendente.habilidadePreValidada?.efeito || null,
            efeitoAplicado: null,
            ataque: ataqueBase,
            manaRestante: jogadorStats.mana_atual,
            manaMax: jogadorStats.mana_max,
          };
          _pushCombatLog(combate, {
            tipo: acaoPendente.tipo === 'conjurar_magia' ? 'magia_jogador' : 'habilidade_jogador',
            ...resultados.habilidade,
            timestamp: Date.now()
          });
        }

        return finalizeResolvedCombatRound(sessao, combate, userId, resultados);
      }

      resultados.aguardandoProximoTeste = true;
      resultados.proximoTeste = buildDamageTestRequest({
        ...acaoPendente,
        critico
      }, personagem);
      resultados.proximaAcaoPendente = {
        ...acaoPendente,
        stage: 'damage_roll',
        critico,
        rolagemAtaque: rolagem,
        totalAtaque: total,
        resourcesConsumed: Boolean(acaoPendente.resourcesConsumed)
      };
      return resultados;
    }

    const danoRolado = Math.max(0, Number(resultadoTeste.total ?? resultadoTeste.rolagemBruta ?? 0));
    let danoFinal = applyOpenRollDamage(danoRolado, {
      critico: Boolean(acaoPendente.critico),
      armadura: Number(acaoPendente.targetArmor || monstroAlvo.armadura || 0)
    });
    if (acaoPendente.elemento) {
      danoFinal = aplicarResistencias(danoFinal, acaoPendente.elemento, monstroAlvo.resistencias || {}, monstroAlvo.imunidades || []);
    }
    monstroAlvo.hp_atual = Math.max(0, monstroAlvo.hp_atual - danoFinal);
    if (monstroAlvo.hp_atual <= 0) monstroAlvo.status = 'derrotado';

    const ataqueBase = buildBaseAttackOutcome(acaoPendente, personagem, monstroAlvo, {
      rolagem: Number(acaoPendente.rolagemAtaque || 0),
      bonus: Number(acaoPendente.attackBonus || 0),
      acertou: true,
      esquivou: false,
      critico: Boolean(acaoPendente.critico),
      dano: danoFinal
    });

    if ((acaoPendente.actionKind || 'attack') === 'attack') {
      resultados.ataqueJogador = ataqueBase;
      _pushCombatLog(combate, { tipo: 'ataque_jogador', ...ataqueBase, timestamp: Date.now() });
    } else {
      const habilidadeBase = acaoPendente.habilidadeBase || {};
      let efeitoAplicado = null;
      if (acaoPendente.habilidadePreValidada?.efeito && monstroAlvo.status === 'vivo') {
        if (!monstroAlvo.status_efeitos) monstroAlvo.status_efeitos = [];
        const efeitoRuntime = normalizarEfeitoRuntime(acaoPendente.habilidadePreValidada.efeito);
        if (efeitoRuntime?.nome) {
          const existente = monstroAlvo.status_efeitos.find((efeito) => efeito.nome === efeitoRuntime.nome);
          if (existente) {
            existente.duracao = efeitoRuntime.duracao;
            if (efeitoRuntime.valor != null) existente.valor = efeitoRuntime.valor;
            if (efeitoRuntime.dano_por_turno != null) existente.dano_por_turno = efeitoRuntime.dano_por_turno;
            if (efeitoRuntime.cura_por_turno != null) existente.cura_por_turno = efeitoRuntime.cura_por_turno;
          } else {
            monstroAlvo.status_efeitos.push(efeitoRuntime);
          }
          efeitoAplicado = { status: efeitoRuntime.nome, duracao: efeitoRuntime.duracao, valor: efeitoRuntime.valor || 0 };
        }
      }

      resultados.habilidade = {
        valido: true,
        tipoAcao: acaoPendente.tipo,
        personagem: personagem.nome,
        userId,
        habilidadeNome: habilidadeBase.nome || acaoPendente.sourceActionName,
        habilidadeId: habilidadeBase.id || null,
        custoMana: acaoPendente.habilidadePreValidada?.custoMana || 0,
        cooldown: acaoPendente.habilidadePreValidada?.cooldown || 0,
        dano: danoFinal,
        efeito: acaoPendente.habilidadePreValidada?.efeito || null,
        efeitoAplicado,
        ataque: ataqueBase,
        manaRestante: jogadorStats.mana_atual,
        manaMax: jogadorStats.mana_max,
      };
      _pushCombatLog(combate, {
        tipo: acaoPendente.tipo === 'conjurar_magia' ? 'magia_jogador' : 'habilidade_jogador',
        ...resultados.habilidade,
        timestamp: Date.now()
      });
    }

    return finalizeResolvedCombatRound(sessao, combate, userId, resultados);
  }

  if (acaoPendente.tipo === 'fugir') {
    const sucesso = resultadoTeste.sucesso;
    resultados.fuga = {
      personagem: personagem.nome,
      userId,
      rolagem: resultadoTeste.rolagemBruta,
      modificador: resultadoTeste.totalModificador,
      total: resultadoTeste.total,
      dc: resultadoTeste.dc,
      sucesso,
    };

    if (sucesso) {
      // Fuga bem-sucedida: finalizar combate, sem contra-ataques
      resultados.combateFinalizado = true;
      resultados.resultadoCombate = 'fuga';
      _pushCombatLog(combate, { tipo: 'fuga_jogador', ...resultados.fuga, timestamp: Date.now() });
      log.info({ userId, dc: resultadoTeste.dc, total: resultadoTeste.total }, 'Fuga pós-teste: SUCESSO');
    } else {
      // Fuga falhou: contra-ataques + controle de rodada
      _pushCombatLog(combate, { tipo: 'fuga_jogador', ...resultados.fuga, timestamp: Date.now() });
      _executarContraAtaques(combate, resultados);
      _controlarRodada(combate, userId, sessao, resultados);
      _verificarFimEAtribuir(combate, resultados);
      log.info({ userId, dc: resultadoTeste.dc, total: resultadoTeste.total }, 'Fuga pós-teste: FALHA, contra-ataques aplicados');
    }
  } else if (acaoPendente.tipo === 'usar_habilidade' || acaoPendente.tipo === 'conjurar_magia') {
    // Futuro: habilidade com requer_teste
    const sucesso = resultadoTeste.sucesso;
    const preValidada = acaoPendente.habilidadePreValidada;
    const hab = acaoPendente.habilidadeBase;
    const jogadorStats = combate.jogadores[userId];
    const tipoAcao = acaoPendente.tipo === 'conjurar_magia' ? 'conjurar_magia' : 'usar_habilidade';

    if (sucesso && preValidada && hab && jogadorStats) {
      // Teste passou: calcular dano e aplicar efeito
      const alvoId = acaoPendente.combatIntent?.alvoId;
      const monstroAlvo = (alvoId && combate.monstros.find(m => m.id === alvoId && m.status === 'vivo'))
        || combate.monstros.find(m => m.status === 'vivo');

      let ataqueHabilidade = null;
      let efeitoAplicado = null;

      if (preValidada.dano > 0 && monstroAlvo) {
        let danoFinal = preValidada.dano;
        const elementoHab = normalizarElementoPrimario(hab.elemento);
        if (elementoHab) {
          danoFinal = aplicarResistencias(danoFinal, elementoHab, monstroAlvo.resistencias || {}, monstroAlvo.imunidades || []);
        }
        monstroAlvo.hp_atual = Math.max(0, monstroAlvo.hp_atual - danoFinal);
        if (monstroAlvo.hp_atual <= 0) monstroAlvo.status = 'derrotado';

        ataqueHabilidade = {
          alvo: monstroAlvo.nome, alvoId: monstroAlvo.id,
          dano: danoFinal, elemento: elementoHab,
          hpRestante: monstroAlvo.hp_atual, hpMax: monstroAlvo.hp_max,
          derrotado: monstroAlvo.status === 'derrotado', xp: monstroAlvo.xp || 0,
        };
      }

      if (preValidada.efeito && monstroAlvo && monstroAlvo.status === 'vivo') {
        if (!monstroAlvo.status_efeitos) monstroAlvo.status_efeitos = [];
        const efeitoRuntime = normalizarEfeitoRuntime(preValidada.efeito);
        if (efeitoRuntime?.nome) {
          const existente = monstroAlvo.status_efeitos.find(e => e.nome === efeitoRuntime.nome);
          if (existente) {
            existente.duracao = efeitoRuntime.duracao;
            if (efeitoRuntime.valor != null) existente.valor = efeitoRuntime.valor;
            if (efeitoRuntime.dano_por_turno != null) existente.dano_por_turno = efeitoRuntime.dano_por_turno;
            if (efeitoRuntime.cura_por_turno != null) existente.cura_por_turno = efeitoRuntime.cura_por_turno;
          } else {
            monstroAlvo.status_efeitos.push(efeitoRuntime);
          }
          efeitoAplicado = { status: efeitoRuntime.nome, duracao: efeitoRuntime.duracao, valor: efeitoRuntime.valor || 0 };
        }
      }

      resultados.habilidade = {
        valido: true,
        tipoAcao,
        personagem: personagem.nome, userId,
        habilidadeNome: hab.nome, habilidadeId: hab.id,
        custoMana: preValidada.custoMana || 0,
        cooldown: preValidada.cooldown || 0,
        dano: preValidada.dano,
        efeito: preValidada.efeito,
        efeitoAplicado,
        ataque: ataqueHabilidade,
        manaRestante: jogadorStats.mana_atual,
        manaMax: jogadorStats.mana_max,
      };
      _pushCombatLog(combate, { tipo: tipoAcao === 'conjurar_magia' ? 'magia_jogador' : 'habilidade_jogador', ...resultados.habilidade, timestamp: Date.now() });
    } else {
      // Teste falhou: habilidade fizzles (mana já gasta)
      resultados.habilidade = {
        valido: true,
        tipoAcao,
        testeFalhou: true,
        personagem: personagem.nome, userId,
        habilidadeNome: hab?.nome || acaoPendente.combatIntent?.habilidadeNome,
        habilidadeId: hab?.id || acaoPendente.combatIntent?.habilidadeId,
        custoMana: preValidada?.custoMana || 0,
        cooldown: preValidada?.cooldown || 0,
        dano: 0,
        efeito: null,
        efeitoAplicado: null,
        ataque: null,
        manaRestante: jogadorStats?.mana_atual,
        manaMax: jogadorStats?.mana_max,
      };
      _pushCombatLog(combate, { tipo: tipoAcao === 'conjurar_magia' ? 'magia_falhou' : 'habilidade_falhou', ...resultados.habilidade, motivo: 'teste_falhou', timestamp: Date.now() });
    }

    // Sempre: contra-ataques + controle rodada
    _executarContraAtaques(combate, resultados);
    _controlarRodada(combate, userId, sessao, resultados);
    _verificarFimEAtribuir(combate, resultados);
  }

  return resultados;
}

/**
 * Formata os resultados mecanicos em texto para injetar no prompt da IA.
 */
export function formatarResultadoMecanico(resultados, personagemNome) {
  const linhas = [
    '[RESULTADO MECÂNICO DA RODADA]',
    '⚠️ Narre SOMENTE os fatos listados abaixo. Dano 5 = ferimento leve, NÃO grave. ERROU = falhou completamente. Respeite HP/dano/efeitos EXATOS.'
  ];

  for (const se of resultados.statusEfeitos) {
    if (se.tipo === 'impedido') {
      linhas.push(`${personagemNome} está ${se.efeito} e não pode agir!`);
    } else if (se.tipo === 'dano') {
      linhas.push(`${personagemNome} sofreu ${se.dano} de dano por ${se.efeito}. HP: ${se.hpRestante}/${se.hpMax}`);
    }
  }

  // Ataque
  const atk = resultados.ataqueJogador;
  if (atk) {
    if (!atk.acertou && !atk.esquivou) {
      linhas.push(`${atk.atacante} atacou ${atk.alvo}: d20=${atk.rolagem}${atk.rolagem === 1 ? ' — FALHA CRÍTICA! Errou desastrosamente!' : ' — ERROU!'}`);
    } else if (atk.esquivou) {
      linhas.push(`${atk.atacante} atacou ${atk.alvo}: d20=${atk.rolagem} (acertou) mas ${atk.alvo} ESQUIVOU!`);
    } else {
      linhas.push(`${atk.atacante} atacou ${atk.alvo}: d20=${atk.rolagem}${atk.critico ? ' CRÍTICO!' : ''} — ${atk.dano} de dano. ${atk.alvo} HP: ${atk.hpRestante}/${atk.hpMax}${atk.derrotado ? ' — DERROTADO!' : ''}`);
    }
  }

  // Defesa
  if (resultados.defesa) {
    linhas.push(`${personagemNome} adotou postura defensiva! Esquiva +${resultados.defesa.esquivaBonus}%, dano recebido reduzido em 50%.`);
  }

  // Teste necessário (ação pendente)
  if (resultados.requerTeste) {
    const rt = resultados.requerTeste;
    linhas.push(`${personagemNome} tenta ${rt.intentTipo === 'fugir' ? 'fugir do combate' : 'usar habilidade'} — requer teste de ${rt.teste} (DC ${rt.dcNumerico}, ${rt.dificuldade}). Aguardando rolagem do jogador.`);
  }

  // Fuga
  if (resultados.fuga) {
    const f = resultados.fuga;
    if (f.sucesso) {
      linhas.push(`${personagemNome} tentou fugir: d20=${f.rolagem}+${f.modificador}=${f.total} vs DC ${f.dc} — FUGIU COM SUCESSO!`);
    } else {
      linhas.push(`${personagemNome} tentou fugir: d20=${f.rolagem}+${f.modificador}=${f.total} vs DC ${f.dc} — FALHOU! Não conseguiu escapar.`);
    }
  }

  // Habilidade
  if (resultados.habilidade) {
    const h = resultados.habilidade;
    if (h.valido === false) {
      linhas.push(`${personagemNome} tentou usar habilidade mas falhou: ${h.erro}`);
    } else if (h.testeFalhou) {
      let failLine = `${personagemNome} tentou usar ${h.habilidadeNome} mas FALHOU no teste!`;
      if (h.custoMana > 0) failLine += ` (-${h.custoMana} MP gastos, restam ${h.manaRestante}/${h.manaMax})`;
      linhas.push(failLine);
    } else {
      let habLine = `${personagemNome} usou ${h.habilidadeNome}!`;
      if (h.custoMana > 0) habLine += ` (-${h.custoMana} MP, restam ${h.manaRestante}/${h.manaMax})`;
      if (h.ataque) {
        habLine += ` ${h.ataque.dano} de dano em ${h.ataque.alvo}. HP: ${h.ataque.hpRestante}/${h.ataque.hpMax}${h.ataque.derrotado ? ' — DERROTADO!' : ''}`;
      }
      if (h.efeitoAplicado) {
        habLine += ` Efeito aplicado: ${h.efeitoAplicado.status} (${h.efeitoAplicado.duracao} turnos)`;
      }
      linhas.push(habLine);
    }
  }

  for (const ca of resultados.contraAtaques) {
    const atkName = ca.habilidade !== 'Ataque básico' ? `usou ${ca.habilidade} contra` : 'atacou';
    if (!ca.acertou && !ca.esquivou) {
      linhas.push(`${ca.atacante} ${atkName} ${ca.alvoNome}: d20=${ca.rolagem}${ca.rolagem === 1 ? ' — FALHA CRÍTICA! Errou desastrosamente!' : ' — ERROU!'}`);
    } else if (ca.esquivou) {
      linhas.push(`${ca.atacante} ${atkName} ${ca.alvoNome}: d20=${ca.rolagem} (acertou) mas ${ca.alvoNome} ESQUIVOU!`);
    } else {
      linhas.push(`${ca.atacante} ${atkName} ${ca.alvoNome}: d20=${ca.rolagem}${ca.critico ? ' CRÍTICO!' : ''} — ${ca.dano} de dano. ${ca.alvoNome} HP: ${ca.hpRestante}/${ca.hpMax}${ca.inconsciente ? ' — INCONSCIENTE!' : ''}`);
    }
  }

  if (resultados.concentracaoQuebrada) {
    const cq = resultados.concentracaoQuebrada;
    linhas.push(`${cq.personagem} recebeu ${cq.dano} de dano e PERDEU CONCENTRAÇÃO em ${cq.magia}! (d20=${cq.rolagem}+CON=${cq.total} vs DC ${cq.dc} — FALHOU)`);
  }

  if (resultados.combateFinalizado) {
    const msg = resultados.resultadoCombate === 'fuga'
      ? 'COMBATE FINALIZADO: Os jogadores fugiram!'
      : resultados.resultadoCombate === RESULTADO_COMBATE.VITORIA
        ? 'COMBATE FINALIZADO: VITÓRIA dos jogadores!'
        : 'COMBATE FINALIZADO: DERROTA dos jogadores!';
    linhas.push(msg);
  }

  return '\n' + linhas.join('\n');
}

export default {
  rolarDado,
  calcularHP,
  calcularMana,
  processarHabilidade,
  calcularEsquiva,
  calcularArmadura,
  verificarEsquiva,
  calcularStatsEfetivos,
  verificarAcerto,
  calcularDano,
  aplicarResistencias,
  selecionarHabilidadeMonstro,
  gerarInstanciasCombate,
  verificarFimCombate,
  formatarContextoCombate,
  resolverMecanicaCombate,
  formatarResultadoMecanico,
  finalizarAcaoCombatePosTeste,
};
