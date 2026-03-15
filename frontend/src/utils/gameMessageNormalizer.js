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

function normalizeSegmentos(segmentos = [], messageId = 'msg') {
  const usedIds = new Set();

  return (Array.isArray(segmentos) ? segmentos : []).map((segmento, index) => {
    const baseId = segmento?.id || `seg_${index + 1}`;
    let nextId = baseId;

    while (usedIds.has(String(nextId))) {
      nextId = `${baseId}_${index}_${Math.random().toString(36).slice(2, 5)}`;
    }
    usedIds.add(String(nextId));

    return {
      ...segmento,
      id: nextId,
      ordem: segmento?.ordem || index + 1,
      tipo: segmento?.tipo || (segmento?.npc_id ? 'fala_npc' : 'narracao'),
      speaker: segmento?.speaker || (segmento?.npc_id ? 'npc' : 'mestre'),
      speaker_label: segmento?.speaker_label || (segmento?.npc_id ? 'NPC' : 'Mestre'),
      text: segmento?.text || segmento?.message || segmento?.mensagem || '',
      npc_id: segmento?.npc_id || null,
      voice_id: segmento?.voice_id || null,
      voice_provider: segmento?.voice_provider || null,
      audio_cache_key: segmento?.audio_cache_key || null,
      narracao: segmento?.narracao || null,
      itemKey: `${messageId}::${nextId}`
    };
  }).filter((segmento) => String(segmento.text || '').trim());
}

export function normalizeGameMessage(mensagem = {}, index = 0) {
  const tipo = inferTipo(mensagem);
  const message = mensagem.message || mensagem.mensagem || '';
  const payload = mensagem.payload || null;
  const canal = mensagem.canal || (tipo === 'roleplay' ? 'roleplay' : 'formal');
  const messageId = buildFallbackId(mensagem, index);

  return {
    ...mensagem,
    id: messageId,
    tipo,
    type: tipo,
    canal,
    message,
    mensagem: message,
    payload,
    segmentos: normalizeSegmentos(mensagem.segmentos, messageId)
  };
}

export function normalizeGameMessages(mensagens = []) {
  const usedIds = new Set();

  return (mensagens || []).reduce((acc, mensagem, index) => {
    const normalized = normalizeGameMessage(mensagem, index);
    const idStr = String(normalized.id);

    // Deduplicar — descartar mensagem com id já visto
    if (usedIds.has(idStr)) return acc;

    usedIds.add(idStr);
    acc.push(normalized);
    return acc;
  }, []);
}
