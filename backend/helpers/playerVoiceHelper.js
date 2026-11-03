/**
 * playerVoiceHelper — Resolve voz TTS para personagens de jogadores.
 *
 * Atribui uma voz free aleatória (Kokoro/Piper) se o personagem não
 * tiver voz configurada, e persiste a escolha no DB (lazy assignment).
 */
import db from '../Model/index.js';
import logger from './logger.js';

const log = logger.child({ module: 'playerVoiceHelper' });

const FREE_VOICES = [
  { voice_id: 'pt-br-kokoro-santa', voice_provider: 'opensource' },
  { voice_id: 'pt-br-kokoro-alex', voice_provider: 'opensource' },
  { voice_id: 'pt-br-kokoro-dora', voice_provider: 'opensource' },
  { voice_id: 'pt-br-faber-medium', voice_provider: 'opensource' },
];

export function pickRandomFreeVoice() {
  return FREE_VOICES[Math.floor(Math.random() * FREE_VOICES.length)];
}

/**
 * Resolve a voz de um personagem. Se não tiver, sorteia e persiste.
 * @param {number} personagemId
 * @param {object} [prisma] - instância Prisma opcional (usa db.prisma por padrão)
 * @returns {Promise<{voice_id: string, voice_provider: string}>}
 */
export async function resolvePlayerVoice(personagemId, prisma = null) {
  if (!personagemId || isNaN(personagemId)) {
    return pickRandomFreeVoice();
  }

  const client = prisma || db.prisma;

  try {
    const pc = await client.personagens.findUnique({
      where: { id: personagemId },
      select: { voice_id: true, voice_provider: true }
    });

    if (pc?.voice_id) {
      return { voice_id: pc.voice_id, voice_provider: pc.voice_provider || 'opensource' };
    }

    const voice = pickRandomFreeVoice();
    await client.personagens.update({
      where: { id: personagemId },
      data: { voice_id: voice.voice_id, voice_provider: voice.voice_provider }
    });

    log.info({ personagemId, voice_id: voice.voice_id }, 'Voz atribuida ao personagem');
    return voice;
  } catch (err) {
    log.warn({ err: err.message, personagemId }, 'Falha ao resolver voz do personagem, usando fallback');
    return pickRandomFreeVoice();
  }
}
