function inferTipo(mensagem = {}) {
  if (mensagem.tipo || mensagem.type) {
    return mensagem.tipo || mensagem.type;
  }

  if (mensagem.canal === 'roleplay') return 'roleplay';
  if (mensagem.dice || mensagem.valor != null || mensagem.result != null) return 'dado';
  if (mensagem.userId === 'mestre' || mensagem.username === 'Mestre') return 'mestre';
  if (mensagem.userId && mensagem.userId !== 'sistema') return 'jogador';
  return 'sistema';
}

function buildFallbackId(mensagem = {}, index = 0) {
  return (
    mensagem.id
    || mensagem.timestamp
    || `${inferTipo(mensagem)}_${index}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export function normalizeGameMessage(mensagem = {}, index = 0) {
  const tipo = inferTipo(mensagem);
  const message = mensagem.message || mensagem.mensagem || '';
  const payload = mensagem.payload || null;
  const canal = mensagem.canal || (tipo === 'roleplay' ? 'roleplay' : 'formal');

  return {
    ...mensagem,
    id: buildFallbackId(mensagem, index),
    tipo,
    type: tipo,
    canal,
    message,
    mensagem: message,
    payload
  };
}

export function normalizeGameMessages(mensagens = []) {
  const usedIds = new Set();

  return (mensagens || []).map((mensagem, index) => {
    const normalized = normalizeGameMessage(mensagem, index);
    let nextId = normalized.id;

    while (usedIds.has(String(nextId))) {
      nextId = `${normalized.id}_${index}_${Math.random().toString(36).slice(2, 5)}`;
    }

    usedIds.add(String(nextId));
    return {
      ...normalized,
      id: nextId
    };
  });
}

