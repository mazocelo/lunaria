export function getResumoMaisRecente(sessao = {}) {
  if (Array.isArray(sessao.resumos) && sessao.resumos.length > 0) {
    return sessao.resumos[sessao.resumos.length - 1]?.resumo || null;
  }
  return null;
}

function getFormalChatHistory(sessao = {}) {
  const mensagens = Array.isArray(sessao.mensagens) ? sessao.mensagens : [];
  return mensagens.filter((mensagem) => {
    const canal = mensagem?.canal || 'formal';
    const tipo = mensagem?.tipo || mensagem?.type;
    return canal !== 'roleplay' && tipo !== 'roleplay';
  });
}

function buildBaseContext(sessao = {}) {
  return {
    chatHistory: getFormalChatHistory(sessao),
    resumo: getResumoMaisRecente(sessao)
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
