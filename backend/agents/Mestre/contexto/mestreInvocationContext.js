export function getResumoMaisRecente(sessao = {}) {
  if (Array.isArray(sessao.resumos) && sessao.resumos.length > 0) {
    return sessao.resumos[sessao.resumos.length - 1]?.resumo || null;
  }
  return null;
}

const ROLEPLAY_MAX_ITEMS = 2;
const ROLEPLAY_MAX_CHARS = 140;
const ROLEPLAY_SPAM_WINDOW_MS = 30000;

function getFormalChatHistory(sessao = {}) {
  const mensagens = Array.isArray(sessao.mensagens) ? sessao.mensagens : [];
  return mensagens.filter((mensagem) => {
    const tipo = mensagem?.tipo || mensagem?.type;
    // Manter apenas tipos que a IA consegue usar como contexto narrativo
    return tipo === 'jogador' || tipo === 'mestre' || tipo === 'resultado_teste';
  });
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

function buildBaseContext(sessao = {}) {
  return {
    chatHistory: getFormalChatHistory(sessao),
    resumo: getResumoMaisRecente(sessao),
    contextoLateralRoleplay: buildRoleplayLateralContext(sessao)
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
