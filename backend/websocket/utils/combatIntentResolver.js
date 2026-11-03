import { getOwnedCombatActionList, isSpellAction } from '../../helpers/ownedActionsHelper.js';
import db from '../../Model/index.js';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function collectCharacterActions(personagemCompleto = {}) {
  return getOwnedCombatActionList(personagemCompleto, db);
}

function buildNamedIntent(item) {
  if (!item) return null;

  if (isSpellAction(item)) {
    return {
      tipo: 'conjurar_magia',
      magiaId: item.id ?? null,
      magiaNome: item.nome || null,
      source: 'inferred'
    };
  }

  return {
    tipo: 'usar_habilidade',
    habilidadeId: item.id ?? null,
    habilidadeNome: item.nome || null,
    source: 'inferred'
  };
}

function findNamedMatches(normalizedMessage, actions) {
  const exact = [];
  const partial = [];

  for (const item of actions) {
    const normalizedName = normalizeText(item?.nome);
    if (!normalizedName || normalizedName.length < 3) continue;

    if (normalizedMessage.includes(normalizedName)) {
      exact.push(item);
      continue;
    }

    if (normalizedName.split(' ').every((token) => token.length > 2 && normalizedMessage.includes(token))) {
      partial.push(item);
    }
  }

  if (exact.length === 1) return { match: exact[0], ambiguous: false, candidates: [] };
  if (exact.length > 1) return { match: null, ambiguous: true, candidates: exact.map((item) => item.nome) };
  if (partial.length === 1) return { match: partial[0], ambiguous: false, candidates: [] };
  if (partial.length > 1) return { match: null, ambiguous: true, candidates: partial.map((item) => item.nome) };

  return { match: null, ambiguous: false, candidates: [] };
}

function inferGenericIntent(normalizedMessage) {
  const attackPatterns = [
    /\batac[a-z]*\b/,
    /\bgolpe[a-z]*\b/,
    /\binvest[a-z]*\b/,
    /\bextermin[a-z]*\b/,
    /\bcort[a-z]*\b/,
    /\besmag[a-z]*\b/,
    /\bdestru[a-z]*\b/,
    /\barrebent[a-z]*\b/,
    /\bdeton[a-z]*\b/,
    /\bdesco .* machad/,
    /\bbato\b/,
    /\bparto pra cima\b/,
    /\bvou pra cima\b/,
    /\bvou ataca/
  ];
  const defendPatterns = [
    /\bdefend(?:o|er|a)\b/,
    /\bme protejo\b/,
    /\bpostura defensiva\b/,
    /\bergo o escudo\b/,
    /\bapar(?:o|ar)\b/
  ];
  const fleePatterns = [
    /\bfu(?:jo|gir)\b/,
    /\brecu(?:o|ar)\b/,
    /\bbato em retirada\b/,
    /\bsaio correndo\b/,
    /\bescap(?:o|ar)\b/
  ];

  if (fleePatterns.some((regex) => regex.test(normalizedMessage))) {
    return { intent: { tipo: 'fugir', source: 'inferred' }, confidence: 0.86 };
  }

  if (defendPatterns.some((regex) => regex.test(normalizedMessage))) {
    return { intent: { tipo: 'defender', source: 'inferred' }, confidence: 0.87 };
  }

  if (attackPatterns.some((regex) => regex.test(normalizedMessage))) {
    return { intent: { tipo: 'atacar', source: 'inferred' }, confidence: 0.82 };
  }

  return null;
}

function normalizeExplicitIntent(explicitIntent) {
  const allowedTypes = ['atacar', 'defender', 'fugir', 'usar_habilidade', 'conjurar_magia'];
  if (!explicitIntent?.tipo || !allowedTypes.includes(explicitIntent.tipo)) return null;
  return {
    ...explicitIntent,
    source: explicitIntent.source || 'explicit'
  };
}

export async function resolveCombatIntent({
  mensagem,
  explicitIntent,
  personagemCompleto,
  combate,
  userId
} = {}) {
  const directIntent = normalizeExplicitIntent(explicitIntent);
  if (directIntent) {
    return {
      intent: directIntent,
      confidence: 1,
      ambiguous: false,
      reason: null,
      candidates: []
    };
  }

  if (!combate?.ativo || !userId) {
    return {
      intent: null,
      confidence: 0,
      ambiguous: false,
      reason: null,
      candidates: []
    };
  }

  const normalizedMessage = normalizeText(mensagem);
  if (!normalizedMessage) {
    return {
      intent: null,
      confidence: 0,
      ambiguous: true,
      reason: 'Mensagem vazia em combate.',
      candidates: []
    };
  }

  const actions = await collectCharacterActions(personagemCompleto);
  const namedMatch = findNamedMatches(normalizedMessage, actions);
  if (namedMatch.ambiguous) {
    return {
      intent: null,
      confidence: 0,
      ambiguous: true,
      reason: 'Ha mais de uma habilidade ou magia compativel com o texto informado.',
      candidates: namedMatch.candidates
    };
  }

  if (namedMatch.match) {
    return {
      intent: buildNamedIntent(namedMatch.match),
      confidence: 0.95,
      ambiguous: false,
      reason: null,
      candidates: []
    };
  }

  const genericIntent = inferGenericIntent(normalizedMessage);
  if (genericIntent) {
    return {
      intent: genericIntent.intent,
      confidence: genericIntent.confidence,
      ambiguous: false,
      reason: null,
      candidates: []
    };
  }

  return {
    intent: null,
    confidence: 0,
    ambiguous: true,
    reason: 'Nao ficou claro se a acao e atacar, defender, fugir ou usar uma habilidade/magia.',
    candidates: []
  };
}

export default resolveCombatIntent;
