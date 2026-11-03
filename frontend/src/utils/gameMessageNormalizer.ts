/**
 * Normalizador de mensagens do chat de jogo (Game store).
 *
 * O shape de entrada e propositalmente solto (`Record<string, unknown>`)
 * porque mensagens chegam de varias fontes (Socket.IO, REST historico,
 * fixtures de teste) e cada uma traz subconjuntos diferentes dos campos.
 * O normalizador define o shape canonico que o resto do front consome.
 */

export type GameMessageTipo = 'mestre' | 'jogador' | 'sistema' | 'dado' | 'roleplay' | string;
export type GameMessageCanal = 'roleplay' | 'formal' | string;

export interface GameMessageSegmentoInput {
  id?: string | number;
  ordem?: number;
  tipo?: string;
  speaker?: string;
  speaker_label?: string;
  text?: string;
  message?: string;
  mensagem?: string;
  speech_text?: string | null;
  npc_id?: string | number | null;
  voice_id?: string | null;
  voice_provider?: string | null;
  audio_cache_key?: string | null;
  narracao?: unknown;
  [key: string]: unknown;
}

export interface GameMessageSegmento {
  id: string | number;
  ordem: number;
  tipo: string;
  speaker: string;
  speaker_label: string;
  text: string;
  speech_text: string | null;
  npc_id: string | number | null;
  voice_id: string | null;
  voice_provider: string | null;
  audio_cache_key: string | null;
  narracao: unknown;
  itemKey: string;
  [key: string]: unknown;
}

export interface GameMessageInput {
  id?: string | number;
  tipo?: string;
  type?: string;
  canal?: string;
  message?: string;
  mensagem?: string;
  payload?: unknown;
  speech_text?: string | null;
  segmentos?: GameMessageSegmentoInput[];
  timestamp?: string | number;
  userId?: string;
  username?: string;
  dice?: unknown;
  valor?: unknown;
  result?: unknown;
  [key: string]: unknown;
}

export interface GameMessage extends GameMessageInput {
  id: string | number;
  tipo: GameMessageTipo;
  type: GameMessageTipo;
  canal: GameMessageCanal;
  message: string;
  mensagem: string;
  speech_text: string | null;
  payload: unknown;
  segmentos: GameMessageSegmento[];
}

function inferTipo(mensagem: GameMessageInput = {}): GameMessageTipo {
  if (mensagem.tipo || mensagem.type) {
    return (mensagem.tipo || mensagem.type) as GameMessageTipo;
  }

  if (mensagem.canal === 'roleplay') return 'roleplay';
  if (mensagem.dice || mensagem.valor != null || mensagem.result != null) return 'dado';
  if (mensagem.userId === 'mestre' || mensagem.username === 'Mestre') return 'mestre';
  if (mensagem.userId && mensagem.userId !== 'sistema') return 'jogador';
  return 'sistema';
}

function buildFallbackId(mensagem: GameMessageInput = {}, index = 0): string | number {
  return (
    mensagem.id ||
    mensagem.timestamp ||
    `${inferTipo(mensagem)}_${index}_${Math.random().toString(36).slice(2, 8)}`
  );
}

function normalizeSegmentos(
  segmentos: GameMessageSegmentoInput[] | undefined = [],
  messageId: string | number = 'msg'
): GameMessageSegmento[] {
  const usedIds = new Set<string>();

  return (Array.isArray(segmentos) ? segmentos : [])
    .map((segmento, index): GameMessageSegmento => {
      const baseId = segmento?.id || `seg_${index + 1}`;
      let nextId: string | number = baseId;

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
        speech_text: segmento?.speech_text || null,
        npc_id: segmento?.npc_id || null,
        voice_id: segmento?.voice_id || null,
        voice_provider: segmento?.voice_provider || null,
        audio_cache_key: segmento?.audio_cache_key || null,
        narracao: segmento?.narracao || null,
        itemKey: `${messageId}::${nextId}`,
      };
    })
    .filter((segmento) => String(segmento.text || '').trim());
}

export function normalizeGameMessage(
  mensagem: GameMessageInput = {},
  index = 0
): GameMessage {
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
    speech_text: mensagem.speech_text || null,
    payload,
    segmentos: normalizeSegmentos(mensagem.segmentos, messageId),
  };
}

export function normalizeGameMessages(
  mensagens: GameMessageInput[] | null | undefined = []
): GameMessage[] {
  const usedIds = new Set<string>();

  return (mensagens || []).reduce<GameMessage[]>((acc, mensagem, index) => {
    const normalized = normalizeGameMessage(mensagem, index);
    const idStr = String(normalized.id);

    // Deduplicar — descartar mensagem com id já visto
    if (usedIds.has(idStr)) return acc;

    usedIds.add(idStr);
    acc.push(normalized);
    return acc;
  }, []);
}
