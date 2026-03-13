import {
  aggregateNarrationFromSegments,
  ensureNpcIds,
  normalizeNarrationSegments,
  resolveNarrationSegments
} from '../services/narrationSegmentsService.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const roteiro = {
    npcs: [
      { nome: 'Seraphina', voice_id: 'voice_npc_1', voice_provider: 'elevenlabs' },
      { nome: 'Brom' }
    ]
  };

  const npcsComId = ensureNpcIds(roteiro.npcs);
  assert(npcsComId.length === 2, 'NPCs nao foram preservados');
  assert(npcsComId.every((npc) => npc.id), 'NPC sem id normalizado');

  const segmentosFallback = normalizeNarrationSegments([], { fallbackText: 'A noite cai sobre a cidade.' });
  assert(segmentosFallback.length === 1, 'Fallback de segmentos nao gerou item unico');
  assert(segmentosFallback[0].tipo === 'narracao', 'Fallback deveria gerar narracao');

  const segmentosResolvidos = resolveNarrationSegments({
    narrativa: 'As sombras dancam. Seraphina sorri. Brom observa em silencio.',
    segmentos: [
      {
        tipo: 'narracao',
        text: 'As sombras dancam no salao antigo.',
        narracao: { emocao: 'sombrio', ritmo: 'lento', intensidade: 'media' }
      },
      {
        tipo: 'fala_npc',
        npc_id: npcsComId[0].id,
        speaker_label: 'Seraphina',
        text: 'Vocês demoraram.',
        narracao: { emocao: 'frio', ritmo: 'medio', intensidade: 'baixa' }
      },
      {
        tipo: 'fala_npc',
        npc_id: 'npc_inexistente',
        speaker_label: 'Brom',
        text: 'Ainda ha tempo para recuar.',
        narracao: { emocao: 'tenso', ritmo: 'medio', intensidade: 'media' }
      }
    ],
    mestreConfig: {
      voice_id: 'voice_mestre_1',
      voice_provider: 'cartesia'
    },
    roteiro: { npcs: npcsComId },
    historiaId: 999
  });

  assert(segmentosResolvidos.length === 3, 'Quantidade de segmentos resolvidos invalida');
  assert(segmentosResolvidos[0].voice_origin === 'mestre', 'Narracao deveria herdar voz do mestre');
  assert(segmentosResolvidos[1].voice_origin === 'npc', 'NPC com voz deveria usar voice_origin npc');
  assert(segmentosResolvidos[1].voice_id === 'voice_npc_1', 'Voz do NPC nao foi aplicada');
  assert(segmentosResolvidos[2].voice_origin === 'fallback_mestre', 'NPC desconhecido deveria usar fallback do mestre');
  assert(segmentosResolvidos.every((segmento) => segmento.audio_cache_key), 'Todo segmento com voz deveria ter audio_cache_key');

  const narrativaAgregada = aggregateNarrationFromSegments(segmentosResolvidos);
  assert(narrativaAgregada.includes('As sombras dancam'), 'Narrativa agregada nao contem narracao');
  assert(narrativaAgregada.includes('Vocês demoraram.'), 'Narrativa agregada nao contem fala do NPC');

  console.log(JSON.stringify({
    success: true,
    npcs_normalizados: npcsComId,
    segmentos_resolvidos: segmentosResolvidos,
    narrativa_agregada: narrativaAgregada
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ success: false, error: error.message }, null, 2));
  process.exit(1);
});
