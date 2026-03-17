function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLastNarrativeUnit(narrativa) {
  const chunks = String(narrativa || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lastChunk = chunks[chunks.length - 1] || '';
  const sentences = lastChunk
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences[sentences.length - 1] || lastChunk;
}

function hasActionableQuestion(normalizedLastUnit, rawLastUnit) {
  if (rawLastUnit.includes('?')) return true;
  return /\b(voce|quer|prefere|segue|examina|investiga|abre|responde|fala|ataca|avanca|recua|vai)\b/.test(normalizedLastUnit);
}

function hasActionableChoice(normalizedNarrativa) {
  return /\b(voce pode|pode escolher|ou pode|ou entao|prefere .* ou )\b/.test(normalizedNarrativa);
}

export function analyzeNarrativeHook({
  narrativa,
  respostaIA,
  combateAtivo = false,
  fimDeTurno = false
} = {}) {
  const rawNarrativa = String(narrativa || '').trim();
  if (!rawNarrativa) {
    return {
      hasActionableHook: false,
      reason: 'narrativa_vazia',
      shouldSuggest: true,
      lastUnit: ''
    };
  }

  const finalizaTurno = Boolean(
    fimDeTurno
    || respostaIA?.fimDeTurno
    || respostaIA?.acaoCompleta
    || respostaIA?.solicitaDados?.solicita
    || respostaIA?.teste
  );

  if (finalizaTurno) {
    return {
      hasActionableHook: true,
      reason: null,
      shouldSuggest: false,
      lastUnit: getLastNarrativeUnit(rawNarrativa)
    };
  }

  const lastUnit = getLastNarrativeUnit(rawNarrativa);
  const normalizedLastUnit = normalizeText(lastUnit);
  const normalizedNarrativa = normalizeText(rawNarrativa);

  if (hasActionableQuestion(normalizedLastUnit, lastUnit) || hasActionableChoice(normalizedNarrativa)) {
    return {
      hasActionableHook: true,
      reason: null,
      shouldSuggest: false,
      lastUnit
    };
  }

  return {
    hasActionableHook: false,
    reason: 'deixa_final_vaga',
    shouldSuggest: !combateAtivo || /\b(corredor|porta|mapa|selo|marca|parede|altar|escada)\b/.test(normalizedNarrativa),
    lastUnit
  };
}

export function buildFallbackHookLine(narrativa, { combateAtivo = false, shouldSuggest = false } = {}) {
  const normalized = normalizeText(narrativa);

  if (combateAtivo) {
    return 'O inimigo ainda pressiona a cena. Voce avanca de novo, muda de posicao ou se fecha em defesa?';
  }

  if (/\bmapa\b/.test(normalized) && /\bselo\b/.test(normalized)) {
    return shouldSuggest
      ? 'Voce pode examinar primeiro as marcas do mapa e do selo rompido, ou seguir pelo corredor antes que algo mais se aproxime.'
      : 'Voce examina primeiro as marcas do mapa e do selo rompido, ou segue pelo corredor antes que algo mais se aproxime?';
  }

  if (/\bporta\b/.test(normalized) && /\bcorredor\b/.test(normalized)) {
    return shouldSuggest
      ? 'Se quiser um caminho mais seguro, pode comecar pela porta antes de seguir pelo corredor escuro.'
      : 'Voce encara primeiro a porta ou avanca pelo corredor escuro?';
  }

  if (/\bparede\b/.test(normalized) || /\bmarca\b/.test(normalized)) {
    return shouldSuggest
      ? 'Se quiser se orientar antes de seguir, pode inspecionar as marcas na parede agora.'
      : 'Voce para para inspecionar as marcas na parede ou segue em frente?';
  }

  return shouldSuggest
    ? 'Se quiser um proximo passo seguro, comece examinando o que a cena colocou diante de voce antes de avancar mais fundo.'
    : 'O que voce faz a seguir?';
}

export function applyFallbackHook(narrativa, options = {}) {
  const base = String(narrativa || '').trim();
  if (!base) return buildFallbackHookLine('', options);
  const hookLine = buildFallbackHookLine(base, options);
  return `${base}\n\n${hookLine}`.trim();
}
