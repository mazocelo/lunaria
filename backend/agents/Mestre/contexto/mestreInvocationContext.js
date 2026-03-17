export function getResumoMaisRecente(sessao = {}) {
  if (Array.isArray(sessao.resumos) && sessao.resumos.length > 0) {
    return sessao.resumos[sessao.resumos.length - 1]?.resumo || null;
  }
  return null;
}

const ROLEPLAY_MAX_ITEMS = 2;
const ROLEPLAY_MAX_CHARS = 140;
const ROLEPLAY_SPAM_WINDOW_MS = 30000;
const CONTINUIDADE_MAX_ITEMS = 1;
const CONTINUIDADE_MAX_CHARS = 180;

function getFormalChatHistory(sessao = {}) {
  const mensagens = Array.isArray(sessao.mensagens) ? sessao.mensagens : [];
  return mensagens.filter((mensagem) => {
    const tipo = mensagem?.tipo || mensagem?.type;
    // Manter apenas tipos que a IA consegue usar como contexto narrativo
    return tipo === 'jogador' || tipo === 'mestre' || tipo === 'resultado_teste';
  });
}

function getMessageText(mensagem = {}) {
  return String(
    mensagem?.message
    || mensagem?.mensagem
    || mensagem?.content
    || mensagem?.payload?.message
    || ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}

function getMessageSpeaker(mensagem = {}) {
  return String(
    mensagem?.personagem
    || mensagem?.username
    || mensagem?.autor
    || mensagem?.author
    || mensagem?.origem
    || 'Alguem'
  )
    .trim()
    .slice(0, 60);
}

function normalizeContextValue(value, maxChars = CONTINUIDADE_MAX_CHARS) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
  return text ? text.slice(0, maxChars) : null;
}

function normalizeNpcNames(rawNpcs = []) {
  const origem = Array.isArray(rawNpcs) ? rawNpcs : [];
  const unicos = new Set();
  const nomes = [];

  for (const npc of origem) {
    const nome = normalizeContextValue(
      typeof npc === 'string'
        ? npc
        : (npc?.nome || npc?.name || npc?.titulo || npc?.label || null),
      60
    );
    if (!nome) continue;

    const key = nome.toLowerCase();
    if (unicos.has(key)) continue;
    unicos.add(key);
    nomes.push(nome);
  }

  return nomes;
}

function getCurrentSceneRound(sessao = {}) {
  return sessao.estadoJogo?.turno?.rodadaAtual
    || sessao.estadoJogo?.rodadaAtual
    || null;
}

function normalizeRoleplayText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function coerceTimestamp(value) {
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getRecentRoleplayMessages(sessao = {}, options = {}) {
  const { maxItems = ROLEPLAY_MAX_ITEMS } = options;
  const rodadaAtual = options.rodadaAtual ?? getCurrentSceneRound(sessao);
  const roleplays = Array.isArray(sessao.roleplayRecente)
    ? sessao.roleplayRecente
    : [];

  const filtradas = roleplays.filter((mensagem) => {
    const canal = mensagem?.canal || 'roleplay';
    const tipo = mensagem?.tipo || mensagem?.type || 'roleplay';
    const cena = mensagem?.payload?.cena ?? mensagem?.cena ?? null;
    if (canal !== 'roleplay' && tipo !== 'roleplay') return false;
    if (rodadaAtual == null || cena == null) return true;
    return String(cena) === String(rodadaAtual);
  });

  const aceitas = [];
  for (let index = filtradas.length - 1; index >= 0; index -= 1) {
    const mensagem = filtradas[index];
    const textoNormalizado = normalizeRoleplayText(mensagem?.message || mensagem?.mensagem);
    if (!textoNormalizado) continue;

    const timestampAtual = coerceTimestamp(mensagem?.timestamp);
    const repetida = aceitas.some((existente) => {
      if (String(existente.userId || existente.username || '') !== String(mensagem?.userId || mensagem?.username || '')) {
        return false;
      }
      if (normalizeRoleplayText(existente?.message || existente?.mensagem) !== textoNormalizado) {
        return false;
      }
      const timestampExistente = coerceTimestamp(existente?.timestamp);
      if (timestampAtual == null || timestampExistente == null) {
        return true;
      }
      return Math.abs(timestampExistente - timestampAtual) <= ROLEPLAY_SPAM_WINDOW_MS;
    });

    if (repetida) continue;
    aceitas.unshift(mensagem);
    if (aceitas.length >= maxItems) break;
  }

  return aceitas;
}

export function buildRoleplayLateralContext(sessao = {}, options = {}) {
  const roleplays = getRecentRoleplayMessages(sessao, options);
  if (!roleplays.length) return '';

  const linhas = roleplays
    .map((mensagem) => {
      const texto = String(mensagem?.message || mensagem?.mensagem || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, ROLEPLAY_MAX_CHARS);
      if (!texto) return null;
      return `- ${mensagem.username || 'Jogador'}: ${texto}`;
    })
    .filter(Boolean);

  if (!linhas.length) return '';

  return `[CONTEXTO LATERAL DE ROLEPLAY - use apenas para colorir a cena, sem transformar em fato canonico]\n${linhas.join('\n')}`;
}

export function buildSceneAnchor(sessao = {}) {
  const estadoJogo = sessao.estadoJogo || {};
  const mestreSessao = sessao.mestreContexto?.sessao || estadoJogo.mestreContexto?.sessao || {};
  const ultimasBatidas = getFormalChatHistory(sessao)
    .slice(-CONTINUIDADE_MAX_ITEMS)
    .map((mensagem) => {
      const text = getMessageText(mensagem).slice(0, CONTINUIDADE_MAX_CHARS);
      if (!text) return null;
      return {
        speaker: getMessageSpeaker(mensagem),
        text,
        tipo: mensagem?.tipo || mensagem?.type || null
      };
    })
    .filter(Boolean);

  const ultimaFala = ultimasBatidas.length > 0
    ? { ...ultimasBatidas[ultimasBatidas.length - 1] }
    : null;

  const npcsEstadoJogo = Array.isArray(estadoJogo.npcs) ? estadoJogo.npcs : [];
  const npcsMestre = Array.isArray(mestreSessao.npcsPresentes) ? mestreSessao.npcsPresentes : [];

  return {
    cenaAtual: normalizeContextValue(estadoJogo.cenaAtual || mestreSessao.cenaAtual || null, 120),
    ambiente: normalizeContextValue(estadoJogo.ambiente || mestreSessao.ambiente || null, 120),
    npcsPresentes: normalizeNpcNames(npcsEstadoJogo.length > 0 ? npcsEstadoJogo : npcsMestre),
    ultimaFala,
    ultimasBatidas
  };
}

export function buildImmediateSceneLock(sessao = {}) {
  const sceneAnchor = buildSceneAnchor(sessao);
  const { cenaAtual, ambiente, npcsPresentes, ultimaFala, ultimasBatidas } = sceneAnchor;
  if (!ultimasBatidas.length) return '';

  const historico = getFormalChatHistory(sessao).slice(-CONTINUIDADE_MAX_ITEMS);
  const linhas = historico
    .map((mensagem) => {
      const texto = getMessageText(mensagem).slice(0, CONTINUIDADE_MAX_CHARS);
      if (!texto) return null;
      return `- ${getMessageSpeaker(mensagem)}: ${texto}`;
    })
    .filter(Boolean);

  const partes = ['[CONTINUIDADE]'];

  if (cenaAtual) partes.push(`Cena: ${cenaAtual}`);
  if (ambiente) partes.push(`Ambiente: ${ambiente}`);
  if (npcsPresentes.length > 0) {
    partes.push(`NPCs: ${npcsPresentes.join(', ')}`);
  }
  if (ultimaFala?.text) {
    partes.push(`Ultima fala: ${ultimaFala.speaker || 'Alguem'}: ${ultimaFala.text}`);
  }

  partes.push('Continue da mesma cena. Se o jogador for passivo, avance: NPC fala algo novo, evento ocorre, ou cena evolui. Nao reapresente NPCs ja presentes.');

  return partes.join('\n');
}

function buildBaseContext(sessao = {}) {
  const sceneAnchor = buildSceneAnchor(sessao);
  return {
    chatHistory: getFormalChatHistory(sessao),
    resumo: getResumoMaisRecente(sessao),
    contextoLateralRoleplay: buildRoleplayLateralContext(sessao),
    lockContinuidade: buildImmediateSceneLock(sessao),
    sceneAnchor
  };
}

export function buildNarracaoContext(sessao = {}) {
  return buildBaseContext(sessao);
}

export function buildTurnStartContext(sessao = {}, userId = null) {
  return {
    ...buildBaseContext(sessao),
    turno: sessao.estadoJogo?.turno || null,
    userId
  };
}

export function buildDiceResolutionContext(sessao = {}, testeResolvido = null) {
  const contexto = buildBaseContext(sessao);
  if (!testeResolvido) return contexto;

  return {
    ...contexto,
    resumo: contexto.resumo,
    testeResolvido
  };
}
