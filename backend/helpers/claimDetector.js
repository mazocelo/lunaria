/**
 * Detector de Alegacoes Concretas — Fases 1-2
 *
 * Fase 1: Valida itens, habilidades e recursos contra ficha real.
 * Fase 2: Valida fatos previos e preparo contra historico da sessao.
 *
 * Fontes de verdade:
 *   - turnState.inventario (equipamentos via turnStateBuilder)
 *   - personagemCompleto.habilidadesClasse / magias / equipamentos
 *   - estadoJogo.cooldowns[userId] (cooldownManager)
 *   - pSessao.mana_atual / mana_max
 *   - sessao.mensagens (historico para fatos previos)
 *   - mestreContexto.sessao.memoriaSemantica (contexto persistente)
 *
 * Shape de retorno alinhado com PLANO-parte-2-detector-de-alegacoes.md
 */
import logger from './logger.js';
import { getOwnedCombatActionList } from './ownedActionsHelper.js';

const log = logger.child({ module: 'claimDetector' });

// --- Normalizacao ---

/**
 * Normaliza texto para matching: lowercase, trim, sem acentos, sem pontuacao irrelevante.
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[.,;:!?'"()\[\]{}]/g, '') // remove pontuacao
    .replace(/\s+/g, ' ');
}

/**
 * Compara nome normalizado. Retorna true se match exato ou contido.
 */
function matchesName(candidate, target) {
  const a = normalizeText(candidate);
  const b = normalizeText(target);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Busca candidatos em uma lista pelo nome normalizado.
 * Retorna { found, candidates } com os matches parciais.
 */
function findInList(name, list, nameField = 'nome') {
  if (!name || !Array.isArray(list) || list.length === 0) return { found: false, candidates: [] };

  const normalized = normalizeText(name);
  const exact = list.filter(item => normalizeText(item[nameField]) === normalized);
  if (exact.length === 1) return { found: true, candidates: exact };

  const partial = list.filter(item => {
    const itemName = normalizeText(item[nameField]);
    return itemName.includes(normalized) || normalized.includes(itemName);
  });

  if (partial.length === 1) return { found: true, candidates: partial };
  return { found: false, candidates: partial };
}

// --- Padroes de alegacao ---

const CLAIM_PATTERNS = [
  // Acoes de uso direto
  { regex: /\b(?:eu\s+)?(?:saco|puxo|desembainho)\s+(?:o\s+|a\s+|meu\s+|minha\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'item' },
  { regex: /\b(?:eu\s+)?(?:uso|utilizo|bebo|tomo)\s+(?:o\s+|a\s+|um\s+|uma\s+|meu\s+|minha\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'item' },
  { regex: /\b(?:eu\s+)?(?:equipo|visto|coloco)\s+(?:o\s+|a\s+|meu\s+|minha\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'item' },
  { regex: /\b(?:eu\s+)?troco\s+para\s+(?:o\s+|a\s+|meu\s+|minha\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'item' },

  // Habilidades e magias
  { regex: /\b(?:eu\s+)?(?:ativo|lanc?o|conjuro|executo)\s+(?:o\s+|a\s+|meu\s+|minha\s+)?(.+?)(?:\s+(?:no|na|em|contra)\b|[.!,]|$)/i, tipo: 'habilidade' },

  // Alegacoes de posse previa
  { regex: /\b(?:eu\s+)?(?:ja\s+tinha|trouxe\s+comigo)\s+(?:o\s+|a\s+|um\s+|uma\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'item' },

  // Fase 2: Fatos previos e conhecimento
  { regex: /\b(?:eu\s+)?(?:ja\s+sabia|ja\s+sei)\s+(?:que\s+|da\s+|do\s+|de\s+|sobre\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'fato_previo' },
  { regex: /\b(?:eu\s+)?(?:ja\s+combinei|ja\s+combinamos)\s+(?:com\s+|que\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'fato_previo' },
  { regex: /\b(?:eu\s+)?(?:ja\s+descobri|ja\s+investiguei)\s+(?:que\s+|sobre\s+|o\s+|a\s+)?(.+?)(?:\s+e\b|[.!,]|$)/i, tipo: 'fato_previo' },
];

// --- Deteccao ---

/**
 * Extrai alegacoes concretas da mensagem do jogador.
 * @param {string} mensagem
 * @returns {Array<{ claim: string, tipo: string }>}
 */
export function detectClaims(mensagem) {
  if (!mensagem || typeof mensagem !== 'string') return [];

  const claims = [];
  const normalized = normalizeText(mensagem);

  for (const pattern of CLAIM_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match && match[1]) {
      const claim = match[1].trim();
      if (claim.length >= 2 && claim.length <= 60) {
        claims.push({ claim, tipo: pattern.tipo });
      }
    }
  }

  return claims;
}

// --- Validacao ---

/**
 * Valida uma alegacao individual contra as fontes de verdade.
 * @param {{ claim: string, tipo: string }} claimInfo
 * @param {Object} sources - { turnState, personagemCompleto, cooldowns, mensagensRecentes?, memoriaSemantica? }
 * @returns {ClaimFlag}
 */
export function validateClaim(claimInfo, sources) {
  const { claim, tipo } = claimInfo;
  const { turnState, personagemCompleto, cooldowns } = sources;

  const base = {
    claim,
    tipo,
    confidence: 0,
    candidatos: [],
  };

  if (tipo === 'item') {
    return _validateItem(claim, turnState, personagemCompleto, base);
  }

  if (tipo === 'habilidade') {
    return _validateHabilidade(claim, personagemCompleto, cooldowns, turnState, base);
  }

  if (tipo === 'fato_previo') {
    return _validateFatoPrevio(claim, sources.mensagensRecentes, sources.memoriaSemantica, base);
  }

  // Tipo nao reconhecido — seguir
  return { ...base, status: 'ok', motivo: null, fonte: null, acaoRecomendada: 'seguir', blockLevel: null };
}

function _validateItem(claim, turnState, personagemCompleto, base) {
  // Checar inventario do turnState (equipamentos atuais)
  const inventario = turnState?.inventario || [];
  const resultInv = findInList(claim, inventario);

  if (resultInv.found) {
    return {
      ...base,
      status: 'ok',
      motivo: null,
      fonte: 'turnState.inventario',
      acaoRecomendada: 'seguir',
      blockLevel: null,
      confidence: 0.9,
      candidatos: resultInv.candidates.map(c => c.nome),
    };
  }

  // Checar equipamentos completos do personagem
  const equipamentos = personagemCompleto?.equipamentos || [];
  const resultEquip = findInList(claim, equipamentos);

  if (resultEquip.found) {
    return {
      ...base,
      status: 'ok',
      motivo: null,
      fonte: 'personagemCompleto.equipamentos',
      acaoRecomendada: 'seguir',
      blockLevel: null,
      confidence: 0.85,
      candidatos: resultEquip.candidates.map(c => c.nome),
    };
  }

  // Nao encontrado
  const allCandidates = [
    ...inventario.map(i => i.nome),
    ...equipamentos.map(e => e.nome),
  ];
  const partialMatches = allCandidates.filter(name => {
    const n = normalizeText(name);
    const c = normalizeText(claim);
    return n.includes(c) || c.includes(n);
  });

  if (partialMatches.length > 0) {
    return {
      ...base,
      status: 'suspeito',
      motivo: 'match parcial — possivel variacao de nome',
      fonte: 'turnState.inventario + personagemCompleto.equipamentos',
      acaoRecomendada: 'pedir_clarificacao',
      blockLevel: 'soft',
      confidence: 0.4,
      candidatos: partialMatches,
    };
  }

  return {
    ...base,
    status: 'inexistente',
    motivo: 'nao encontrado no inventario',
    fonte: 'turnState.inventario + personagemCompleto.equipamentos',
    acaoRecomendada: 'bloquear',
    blockLevel: 'hard',
    confidence: 0.8,
    candidatos: [],
  };
}

function _validateHabilidade(claim, personagemCompleto, cooldowns, turnState, base) {
  const habilidades = getOwnedCombatActionList(personagemCompleto);

  const result = findInList(claim, habilidades);

  if (!result.found) {
    // Checar candidatos parciais
    const allNames = habilidades.map(h => h.nome).filter(Boolean);
    const partial = allNames.filter(name => {
      const n = normalizeText(name);
      const c = normalizeText(claim);
      return n.includes(c) || c.includes(n);
    });

    if (partial.length > 0) {
      return {
        ...base,
        status: 'suspeito',
        motivo: 'match parcial de habilidade',
        fonte: 'personagemCompleto.habilidades',
        acaoRecomendada: 'pedir_clarificacao',
        blockLevel: 'soft',
        confidence: 0.4,
        candidatos: partial,
      };
    }

    return {
      ...base,
      status: 'inexistente',
      motivo: 'habilidade nao encontrada na ficha',
      fonte: 'personagemCompleto.habilidades',
      acaoRecomendada: 'bloquear',
      blockLevel: 'hard',
      confidence: 0.8,
      candidatos: [],
    };
  }

  const hab = result.candidates[0];

  // Checar cooldown — soft block (mecanica autoritativa tem precedencia)
  if (cooldowns && hab.id) {
    const isSpell = Boolean(hab.escola_magia && hab.escola_magia !== 'nenhuma');
    const cdKey = isSpell ? `mag_${hab.id}` : `hab_${hab.id}`;
    const cdTurnos = cooldowns[cdKey];
    if (cdTurnos && cdTurnos > 0) {
      return {
        ...base,
        status: 'suspeito',
        motivo: `habilidade em cooldown (${cdTurnos} turnos restantes)`,
        fonte: 'estadoJogo.cooldowns',
        acaoRecomendada: 'pedir_clarificacao',
        blockLevel: 'soft',
        confidence: 0.9,
        candidatos: [hab.nome],
      };
    }
  }

  // Checar mana — soft block (mecanica autoritativa tem precedencia)
  if (hab.custo_mana && hab.custo_mana > 0) {
    const manaAtual = turnState?.mana?.atual ?? 0;
    if (manaAtual < hab.custo_mana) {
      return {
        ...base,
        status: 'suspeito',
        motivo: `mana insuficiente (precisa ${hab.custo_mana}, tem ${manaAtual})`,
        fonte: 'turnState.mana',
        acaoRecomendada: 'pedir_clarificacao',
        blockLevel: 'soft',
        confidence: 0.9,
        candidatos: [hab.nome],
      };
    }
  }

  return {
    ...base,
    status: 'ok',
    motivo: null,
    fonte: 'personagemCompleto.habilidades',
    acaoRecomendada: 'seguir',
    blockLevel: null,
    confidence: 0.9,
    candidatos: [hab.nome],
  };
}

function _validateFatoPrevio(claim, mensagensRecentes, memoriaSemantica, base) {
  const normalized = normalizeText(claim);

  // Buscar no historico recente do mestre
  if (Array.isArray(mensagensRecentes)) {
    for (const msg of mensagensRecentes) {
      const texto = normalizeText(msg.message || msg.mensagem || '');
      if (texto && texto.includes(normalized)) {
        return {
          ...base,
          status: 'ok',
          motivo: null,
          fonte: 'sessao.mensagens',
          acaoRecomendada: 'seguir',
          blockLevel: null,
          confidence: 0.8,
          candidatos: [],
        };
      }
    }
  }

  // Buscar na memoria semantica
  if (Array.isArray(memoriaSemantica)) {
    for (const entrada of memoriaSemantica) {
      const texto = normalizeText(typeof entrada === 'string' ? entrada : entrada?.conteudo || entrada?.texto || '');
      if (texto && texto.includes(normalized)) {
        return {
          ...base,
          status: 'ok',
          motivo: null,
          fonte: 'mestreContexto.memoriaSemantica',
          acaoRecomendada: 'seguir',
          blockLevel: null,
          confidence: 0.75,
          candidatos: [],
        };
      }
    }
  }

  // Nao encontrado — soft block, nunca hard
  return {
    ...base,
    status: 'incerto',
    motivo: 'fato nao encontrado no historico da sessao',
    fonte: 'sessao.mensagens + mestreContexto.memoriaSemantica',
    acaoRecomendada: 'pedir_clarificacao',
    blockLevel: 'soft',
    confidence: 0.5,
    candidatos: [],
  };
}

// --- Entrada principal ---

/**
 * Detecta e valida alegacoes concretas na mensagem do jogador.
 * Fase 1: modo observacao — loga mas nao bloqueia.
 *
 * @param {string} mensagem - Mensagem bruta do jogador
 * @param {Object} sources - { turnState, personagemCompleto, cooldowns, mensagensRecentes?, memoriaSemantica? }
 * @param {{ roomId: string, userId: string }} meta - Metadados para log
 * @returns {Array<ClaimFlag>} Flags de alegacao (vazio se nenhuma detectada)
 */
export function runClaimDetection(mensagem, sources, meta = {}) {
  const claims = detectClaims(mensagem);
  if (claims.length === 0) return [];

  const flags = claims.map(c => validateClaim(c, sources));

  // Modo observacao: logar flags nao-ok
  for (const flag of flags) {
    if (flag.status !== 'ok') {
      log.info({
        roomId: meta.roomId,
        userId: meta.userId,
        tipo: flag.tipo,
        status: flag.status,
        claim: flag.claim,
        motivo: flag.motivo,
        fonte: flag.fonte,
        acaoRecomendada: flag.acaoRecomendada,
      }, 'claim_detected');
    }
  }

  return flags;
}
