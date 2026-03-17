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

function hasImmediateAffordance(normalizedText) {
  return /\b(examina|inspeciona|le|pega|recebe|estende|entrega|mostra|aponta|segue|entra|abre|desce|toca|observa|aproxima|acompanha|vai ate|olha)\b/.test(normalizedText);
}

function isBroadGenericHook(normalizedLastUnit) {
  return /\b(o que faremos agora|por onde comecaremos|precisamos da sua forca|precisamos que voce|voce deve ir|deve investigar|descubra o que aconteceu|contenha essa escuridao|nao temos tempo a perder)\b/.test(normalizedLastUnit);
}

function isRepetitiveBriefing(normalizedNarrativa) {
  const lastSentences = normalizedNarrativa.slice(-200);

  const endsWithAbstractMission = /\b(voce precisa|voce deve|e necessario que|sua missao e|cabe a voce|depende de voce|voce e o unico)\s*[^?]*$/.test(lastSentences);
  const endsWithMetaNarration = /\b(a aventura continua|o destino aguarda|o que esta por vir|a jornada apenas comecou|o futuro e incerto|a historia se desenrola)\s*[.!]*\s*$/.test(lastSentences);
  const endsWithPureAtmosphere = /\b(silencio paira|o ar esta pesado|sombras dancam|a escuridao se adensa|o vento sopra|uma brisa fria|o silencio e absoluto|a tensao e palpavel)\s*[.!]*\s*$/.test(lastSentences);

  return endsWithAbstractMission || endsWithMetaNarration || endsWithPureAtmosphere;
}

function extractNarrativeObjects(normalizedText) {
  const objectPatterns = [
    { pattern: /\b(porta|portao|portinhola)\b/, label: 'porta' },
    { pattern: /\b(bau|arca|caixa)\b/, label: 'bau' },
    { pattern: /\b(pergaminho|carta|bilhete|documento|livro|tomo)\b/, label: 'pergaminho' },
    { pattern: /\b(escada|degrau|degraus)\b/, label: 'escada' },
    { pattern: /\b(altar|santuario|estatua)\b/, label: 'altar' },
    { pattern: /\b(mapa|selo|marca|inscricao|runa)\b/, label: 'inscricao' },
    { pattern: /\b(corredor|passagem|tunel|caminho)\b/, label: 'passagem' },
    { pattern: /\b(fonte|poco|cisterna)\b/, label: 'fonte' },
    { pattern: /\b(espelho|cristal|orbe|esfera)\b/, label: 'objeto mistico' },
    { pattern: /\b(alavanca|mecanismo|botao|engrenagem)\b/, label: 'mecanismo' },
  ];

  const found = [];
  for (const { pattern, label } of objectPatterns) {
    if (pattern.test(normalizedText) && !found.includes(label)) {
      found.push(label);
    }
  }
  return found;
}

export function analyzeNarrativeHook({
  narrativa,
  respostaIA,
  combateAtivo = false,
  fimDeTurno = false,
  sceneContext = null
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

  if (isBroadGenericHook(normalizedLastUnit) && !hasImmediateAffordance(normalizedNarrativa)) {
    return {
      hasActionableHook: false,
      reason: 'gancho_generico',
      shouldSuggest: true,
      lastUnit
    };
  }

  if (isRepetitiveBriefing(normalizedNarrativa) && !hasImmediateAffordance(normalizedNarrativa)) {
    return {
      hasActionableHook: false,
      reason: 'briefing_repetido_sem_encaixe',
      shouldSuggest: true,
      lastUnit
    };
  }

  if (hasActionableQuestion(normalizedLastUnit, lastUnit) || hasActionableChoice(normalizedNarrativa) || hasImmediateAffordance(normalizedLastUnit)) {
    return {
      hasActionableHook: true,
      reason: null,
      shouldSuggest: false,
      lastUnit
    };
  }

  const hasSceneObjects = sceneContext?.objetosVisiveis?.length > 0
    || extractNarrativeObjects(normalizedNarrativa).length > 0;

  return {
    hasActionableHook: false,
    reason: 'deixa_final_vaga',
    shouldSuggest: !combateAtivo || hasSceneObjects,
    lastUnit
  };
}

function buildNpcHookLine(npcName, shouldSuggest) {
  if (shouldSuggest) {
    return `${npcName} aguarda sua resposta.`;
  }
  return `${npcName} se volta para voce, expectante.`;
}

function buildLocationHookLine(location, shouldSuggest) {
  if (shouldSuggest) {
    return `Voce pode examinar mais de perto ${location} ou seguir adiante.`;
  }
  return `Voce examina mais de perto ${location} ou segue adiante?`;
}

function buildThreatHookLine(threat, shouldSuggest) {
  if (shouldSuggest) {
    return `${threat} ainda ronda. Voce pode investigar ou se preparar.`;
  }
  return `${threat} ainda ronda. Voce investiga ou se prepara?`;
}

function buildObjectHookLine(objectLabel, shouldSuggest) {
  const article = /^[aeiou]/.test(objectLabel) ? 'a' : 'o';
  if (shouldSuggest) {
    return `Voce pode examinar ${article} ${objectLabel} mais de perto antes de seguir.`;
  }
  return `Voce examina ${article} ${objectLabel} mais de perto ou segue em frente?`;
}

export function buildFallbackHookLine(narrativa, { combateAtivo = false, shouldSuggest = false, sceneContext = null } = {}) {
  if (combateAtivo) {
    return 'O inimigo ainda pressiona a cena. Voce avanca de novo, muda de posicao ou se fecha em defesa?';
  }

  if (sceneContext?.npcsPresentes?.length > 0) {
    const npc = sceneContext.npcsPresentes[0];
    const npcName = typeof npc === 'string' ? npc : npc?.nome || npc;
    if (npcName) return buildNpcHookLine(npcName, shouldSuggest);
  }

  if (sceneContext?.cenaAtual) {
    return buildLocationHookLine(sceneContext.cenaAtual, shouldSuggest);
  }

  if (sceneContext?.ameacas?.length > 0) {
    const threat = sceneContext.ameacas[0];
    const threatName = typeof threat === 'string' ? threat : threat?.nome || String(threat);
    if (threatName) return buildThreatHookLine(threatName, shouldSuggest);
  }

  const normalized = normalizeText(narrativa);
  const narrativeObjects = extractNarrativeObjects(normalized);
  if (narrativeObjects.length > 0) {
    return buildObjectHookLine(narrativeObjects[0], shouldSuggest);
  }

  return shouldSuggest
    ? 'Se quiser um proximo passo seguro, comece examinando o que a cena colocou diante de voce antes de avancar mais fundo.'
    : 'O que voce faz?';
}

export function applyFallbackHook(narrativa, options = {}) {
  const base = String(narrativa || '').trim();
  if (!base) return buildFallbackHookLine('', options);
  const hookLine = buildFallbackHookLine(base, options);
  return `${base}\n\n${hookLine}`.trim();
}
