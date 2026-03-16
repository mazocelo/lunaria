import ttsCacheService from './ttsCacheService.js';
import { getDefaultProviderName } from './ttsService.js';
import logger from '../helpers/logger.js';
import { sanitizeTextForSpeech } from './speechTextService.js';

const log = logger.child({ module: 'narrationSegmentsService' });

const VALID_EMOCOES = new Set([
  'neutro',
  'calmo',
  'sombrio',
  'tenso',
  'epico',
  'frio',
  'acolhedor',
  'ameacador',
  'triste',
  'urgente'
]);

const VALID_RITMOS = new Set(['lento', 'medio', 'rapido']);
const VALID_INTENSIDADES = new Set(['baixa', 'media', 'alta']);

const DEFAULT_NARRACAO = Object.freeze({
  emocao: 'neutro',
  ritmo: 'medio',
  intensidade: 'media'
});
const DEFAULT_TTS_PROVIDER = getDefaultProviderName();

function asTrimmedString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeKey(value) {
  return asTrimmedString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slugify(value, fallback = 'item') {
  const normalized = normalizeKey(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
}

function inferSegmentType(segment = {}) {
  const explicitType = asTrimmedString(segment.tipo || segment.type, '').toLowerCase();
  if (explicitType === 'fala_npc') return 'fala_npc';
  if (explicitType === 'narracao') return 'narracao';

  const explicitSpeaker = asTrimmedString(segment.speaker, '').toLowerCase();
  if (explicitSpeaker === 'npc') return 'fala_npc';
  if (segment?.npc_id) return 'fala_npc';
  return 'narracao';
}

function normalizeNarracao(raw = {}) {
  const emocao = asTrimmedString(raw?.emocao, DEFAULT_NARRACAO.emocao).toLowerCase();
  const ritmo = asTrimmedString(raw?.ritmo, DEFAULT_NARRACAO.ritmo).toLowerCase();
  const intensidade = asTrimmedString(raw?.intensidade, DEFAULT_NARRACAO.intensidade).toLowerCase();

  return {
    emocao: VALID_EMOCOES.has(emocao) ? emocao : DEFAULT_NARRACAO.emocao,
    ritmo: VALID_RITMOS.has(ritmo) ? ritmo : DEFAULT_NARRACAO.ritmo,
    intensidade: VALID_INTENSIDADES.has(intensidade) ? intensidade : DEFAULT_NARRACAO.intensidade
  };
}

function buildFallbackSegments(fallbackText = '') {
  const text = asTrimmedString(fallbackText, '');
  if (!text) return [];

  return [{
    id: 'seg_1',
    ordem: 1,
    tipo: 'narracao',
    speaker: 'mestre',
    speaker_label: 'Mestre',
    text,
    speech_text: sanitizeTextForSpeech(text),
    npc_id: null,
    narracao: { ...DEFAULT_NARRACAO }
  }];
}

function buildUniqueSegmentId(baseId, usedIds, index) {
  const normalizedBaseId = asTrimmedString(baseId, `seg_${index + 1}`);
  let nextId = normalizedBaseId;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${normalizedBaseId}_${suffix}`;
    suffix += 1;
  }

  usedIds.add(nextId);
  return nextId;
}

export function ensureNpcIds(npcs = []) {
  const usedIds = new Set();

  return (Array.isArray(npcs) ? npcs : []).map((npc, index) => {
    const nome = asTrimmedString(npc?.nome, `NPC ${index + 1}`);
    const explicitId = asTrimmedString(npc?.id, '');
    let npcId = explicitId || `npc_${slugify(nome, `npc_${index + 1}`)}`;

    while (usedIds.has(npcId)) {
      npcId = `${npcId}_${index + 1}`;
    }
    usedIds.add(npcId);

    const voiceId = asTrimmedString(npc?.voice_id, '') || null;
    const voiceProvider = voiceId
      ? asTrimmedString(npc?.voice_provider, DEFAULT_TTS_PROVIDER)
      : null;
    const dialogoExemplo = asTrimmedString(npc?.dialogo_exemplo, '') || null;

    return {
      ...npc,
      id: npcId,
      nome,
      dialogo_exemplo: dialogoExemplo,
      voice_id: voiceId,
      voice_provider: voiceProvider
    };
  });
}

export function normalizeNarrationSegments(segments = [], { fallbackText = '' } = {}) {
  const usedIds = new Set();
  const normalized = (Array.isArray(segments) ? segments : [])
    .map((segment, index) => {
      const tipo = inferSegmentType(segment);
      const text = asTrimmedString(
        segment?.text || segment?.message || segment?.mensagem || segment?.conteudo,
        ''
      );

      if (!text) return null;

      const speaker = tipo === 'fala_npc' ? 'npc' : 'mestre';
      const speakerLabel = tipo === 'fala_npc'
        ? asTrimmedString(segment?.speaker_label || segment?.speaker, 'NPC')
        : 'Mestre';

      return {
        ...segment,
        id: buildUniqueSegmentId(segment?.id, usedIds, index),
        ordem: index + 1,
        tipo,
        speaker,
        speaker_label: speakerLabel,
        text,
        speech_text: asTrimmedString(
          segment?.speech_text,
          sanitizeTextForSpeech(text)
        ),
        npc_id: tipo === 'fala_npc' ? (asTrimmedString(segment?.npc_id, '') || null) : null,
        narracao: normalizeNarracao(segment?.narracao || {})
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : buildFallbackSegments(fallbackText);
}

export function aggregateNarrationFromSegments(segments = []) {
  return (normalizeNarrationSegments(segments) || [])
    .map((segment) => asTrimmedString(segment?.text, ''))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function aggregateSpeechFromSegments(segments = []) {
  return (normalizeNarrationSegments(segments) || [])
    .map((segment) => asTrimmedString(segment?.speech_text || segment?.text, ''))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function resolveNarrationSegments({
  narrativa = '',
  segmentos = [],
  mestreConfig = null,
  roteiro = null,
  historiaId = null
} = {}) {
  const normalizedSegments = normalizeNarrationSegments(segmentos, { fallbackText: narrativa });
  const normalizedNpcs = ensureNpcIds(roteiro?.npcs || []);
  const npcById = new Map(normalizedNpcs.map((npc) => [String(npc.id), npc]));
  const npcByName = new Map(
    normalizedNpcs
      .filter((npc) => npc?.nome)
      .map((npc) => [normalizeKey(npc.nome), npc])
  );

  return normalizedSegments.map((segment, index) => {
    const explicitVoiceId = asTrimmedString(segment?.voice_id, '') || null;
    const explicitVoiceProvider = asTrimmedString(segment?.voice_provider, '') || null;

    let matchedNpc = null;
    if (segment.tipo === 'fala_npc') {
      matchedNpc = segment.npc_id
        ? (npcById.get(String(segment.npc_id)) || null)
        : null;

      if (!matchedNpc) {
        const byLabel = npcByName.get(normalizeKey(segment.speaker_label));
        const bySpeaker = npcByName.get(normalizeKey(segment.speaker));
        matchedNpc = byLabel || bySpeaker || null;
      }
    }

    const resolvedNpcId = segment.tipo === 'fala_npc'
      ? (segment.npc_id || matchedNpc?.id || null)
      : null;

    if (segment.tipo === 'fala_npc' && segment.npc_id && !matchedNpc && !explicitVoiceId) {
      log.warn({ historiaId, npc_id: segment.npc_id, speaker_label: segment.speaker_label }, 'NPC nao encontrado para segmento');
    }

    let voiceId = null;
    let voiceProvider = null;
    let voiceOrigin = 'unresolved';

    if (explicitVoiceId) {
      voiceId = explicitVoiceId;
      voiceProvider = explicitVoiceProvider || DEFAULT_TTS_PROVIDER;
      voiceOrigin = 'segmento';
    } else if (matchedNpc?.voice_id) {
      voiceId = matchedNpc.voice_id;
      voiceProvider = matchedNpc.voice_provider || DEFAULT_TTS_PROVIDER;
      voiceOrigin = 'npc';
    } else if (mestreConfig?.voice_id) {
      voiceId = mestreConfig.voice_id;
      voiceProvider = mestreConfig.voice_provider || DEFAULT_TTS_PROVIDER;
      voiceOrigin = segment.tipo === 'fala_npc' ? 'fallback_mestre' : 'mestre';
    }

    return {
      ...segment,
      id: segment.id,
      ordem: index + 1,
      npc_id: resolvedNpcId,
      speaker_label: segment.tipo === 'fala_npc'
        ? asTrimmedString(segment?.speaker_label, matchedNpc?.nome || 'NPC')
        : 'Mestre',
      speech_text: asTrimmedString(
        segment?.speech_text,
        sanitizeTextForSpeech(segment?.text || '')
      ),
      narracao: normalizeNarracao(segment?.narracao || {}),
      voice_id: voiceId,
      voice_provider: voiceProvider,
      voice_origin: voiceOrigin,
      audio_cache_key: voiceId
        ? ttsCacheService.generateCacheKey(
          asTrimmedString(segment?.speech_text, sanitizeTextForSpeech(segment?.text || '')),
          voiceId,
          voiceProvider || DEFAULT_TTS_PROVIDER
        )
        : null
    };
  });
}

export default {
  ensureNpcIds,
  normalizeNarrationSegments,
  resolveNarrationSegments,
  aggregateNarrationFromSegments,
  aggregateSpeechFromSegments
};
