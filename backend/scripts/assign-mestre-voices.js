import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getConfiguredProviders, getProvider } from '../services/ttsService.js';

const prisma = new PrismaClient();
const FORCE = process.argv.includes('--force');
const providerArg = process.argv.find((arg) => arg.startsWith('--provider='))?.split('=')[1] || null;

async function resolveVoicePool() {
  const providerNames = providerArg
    ? [providerArg]
    : getConfiguredProviders();

  for (const providerName of providerNames) {
    try {
      const voices = await getProvider(providerName).listVoices();
      if (Array.isArray(voices) && voices.length > 0) {
        return { providerName, voices };
      }
    } catch (error) {
      console.warn(`[assign-mestre-voices] provider ${providerName} falhou: ${error.message}`);
    }
  }

  return { providerName: null, voices: [] };
}

async function main() {
  const voicePool = await resolveVoicePool();

  if (!voicePool.providerName || voicePool.voices.length === 0) {
    console.log(JSON.stringify({
      success: false,
      reason: 'Nenhum provider TTS configurado com vozes disponiveis',
      configuredProviders: getConfiguredProviders(),
    }, null, 2));
    return;
  }

  const mestres = await prisma.mestres.findMany({
    where: {
      deleted_at: null,
      ...(FORCE ? {} : { OR: [{ voice_id: null }, { voice_id: '' }] }),
    },
    orderBy: { id: 'asc' },
    select: { id: true, nome: true, voice_id: true, voice_provider: true },
  });

  let voiceIndex = 0;
  const updated = [];

  for (const mestre of mestres) {
    const voice = voicePool.voices[voiceIndex % voicePool.voices.length];
    const saved = await prisma.mestres.update({
      where: { id: mestre.id },
      data: {
        voice_id: voice.voice_id,
        voice_provider: voicePool.providerName,
        atualizado_em: new Date(),
      },
      select: { id: true, nome: true, voice_id: true, voice_provider: true },
    });
    updated.push(saved);
    voiceIndex += 1;
  }

  console.log(JSON.stringify({
    success: true,
    provider: voicePool.providerName,
    voices_available: voicePool.voices.length,
    mestres_updated: updated.length,
    updated,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('[assign-mestre-voices] erro:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
