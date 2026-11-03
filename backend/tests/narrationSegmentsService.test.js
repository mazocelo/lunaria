import { describe, it, expect, vi } from 'vitest';

// Mock dependencies that require external services (Redis, Prisma, pino, etc.)
vi.mock('../helpers/logger.js', () => {
  const noop = () => {};
  const child = () => ({ warn: noop, info: noop, error: noop, debug: noop });
  return { default: { child, warn: noop, info: noop, error: noop, debug: noop } };
});
vi.mock('../services/ttsCacheService.js', () => ({
  default: {
    generateCacheKey: (text, voiceId, provider) =>
      `cache_${voiceId}_${provider}_${text.slice(0, 16)}`
  }
}));
vi.mock('../services/ttsService.js', () => ({
  getDefaultProviderName: () => 'opensource'
}));

import {
  normalizeNarrationSegments,
  aggregateNarrationFromSegments,
  aggregateSpeechFromSegments,
  ensureNpcIds,
  resolveNarrationSegments
} from '../services/narrationSegmentsService.js';

// ── normalizeNarrationSegments ──

describe('normalizeNarrationSegments', () => {

  // ── Valid segments pass through normalized ──

  describe('segmentos validos passam normalizados', () => {
    it('segmento simples de narracao e normalizado', () => {
      const segments = [{ text: 'O dragao rugiu.', tipo: 'narracao' }];
      const result = normalizeNarrationSegments(segments);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('O dragao rugiu.');
      expect(result[0].tipo).toBe('narracao');
      expect(result[0].speaker).toBe('mestre');
      expect(result[0].speaker_label).toBe('Mestre');
      expect(result[0].ordem).toBe(1);
    });

    it('segmento de fala_npc e normalizado', () => {
      const segments = [{ text: 'Eu sou o guardiao.', tipo: 'fala_npc', speaker_label: 'Goblin' }];
      const result = normalizeNarrationSegments(segments);
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('fala_npc');
      expect(result[0].speaker).toBe('npc');
      expect(result[0].speaker_label).toBe('Goblin');
    });

    it('multiplos segmentos recebem ordem sequencial', () => {
      const segments = [
        { text: 'Primeiro.', tipo: 'narracao' },
        { text: 'Segundo.', tipo: 'narracao' },
        { text: 'Terceiro.', tipo: 'narracao' }
      ];
      const result = normalizeNarrationSegments(segments);
      expect(result).toHaveLength(3);
      expect(result[0].ordem).toBe(1);
      expect(result[1].ordem).toBe(2);
      expect(result[2].ordem).toBe(3);
    });

    it('preserva propriedades extras do segmento original', () => {
      const segments = [{ text: 'Texto.', tipo: 'narracao', custom_field: 'valor' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].custom_field).toBe('valor');
    });

    it('gera id unico automaticamente se nao fornecido', () => {
      const segments = [
        { text: 'Primeiro.' },
        { text: 'Segundo.' }
      ];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].id).toBe('seg_1');
      expect(result[1].id).toBe('seg_2');
    });

    it('preserva id fornecido pelo segmento', () => {
      const segments = [{ id: 'meu_id', text: 'Texto.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].id).toBe('meu_id');
    });

    it('desduplicar ids repetidos adicionando sufixo', () => {
      const segments = [
        { id: 'seg_a', text: 'Primeiro.' },
        { id: 'seg_a', text: 'Segundo.' }
      ];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].id).toBe('seg_a');
      expect(result[1].id).toBe('seg_a_2');
    });
  });

  // ── Segments with invalid emocao ──

  describe('emocao invalida e mapeada via aliases ou default', () => {
    it('emocao valida permanece intacta', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'epico' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('epico');
    });

    it('emocao alias "medo" e mapeada para "tenso"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'medo' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('tenso');
    });

    it('emocao alias "raiva" e mapeada para "ameacador"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'raiva' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('ameacador');
    });

    it('emocao alias "alegria" e mapeada para "acolhedor"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'alegria' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('acolhedor');
    });

    it('emocao alias "desespero" e mapeada para "urgente"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'desespero' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('urgente');
    });

    it('emocao alias "misterio" e mapeada para "sombrio"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'misterio' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('sombrio');
    });

    it('emocao alias "serenidade" e mapeada para "calmo"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'serenidade' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('calmo');
    });

    it('emocao alias "determinacao" e mapeada para "epico"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'determinacao' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('epico');
    });

    it('emocao totalmente invalida recebe default "neutro"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'inexistente' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('neutro');
    });

    it('emocao nula recebe default "neutro"', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: null } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('neutro');
    });

    it('emocao undefined recebe default "neutro"', () => {
      const segments = [{ text: 'Texto.', narracao: {} }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('neutro');
    });

    it('emocao com case misto e normalizada', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'EPICO' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('epico');
    });

    it('emocao com espacos extras e normalizada', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: '  tenso  ' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('tenso');
    });
  });

  // ── Segments with invalid ritmo ──

  describe('ritmo invalido recebe default ou alias', () => {
    it('ritmo valido "lento" permanece', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'lento' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('lento');
    });

    it('ritmo valido "rapido" permanece', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'rapido' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('rapido');
    });

    it('ritmo alias "moderado" e mapeado para "medio"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'moderado' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('medio');
    });

    it('ritmo alias "acelerado" e mapeado para "rapido"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'acelerado' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('rapido');
    });

    it('ritmo alias "devagar" e mapeado para "lento"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'devagar' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('lento');
    });

    it('ritmo alias "normal" e mapeado para "medio"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'normal' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('medio');
    });

    it('ritmo alias "veloz" e mapeado para "rapido"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'veloz' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('rapido');
    });

    it('ritmo invalido recebe default "medio"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: 'supersonic' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('medio');
    });

    it('ritmo nulo recebe default "medio"', () => {
      const segments = [{ text: 'Texto.', narracao: { ritmo: null } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.ritmo).toBe('medio');
    });
  });

  // ── Segments with invalid intensidade ──

  describe('intensidade invalida recebe default ou alias', () => {
    it('intensidade valida "baixa" permanece', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'baixa' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('baixa');
    });

    it('intensidade valida "alta" permanece', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'alta' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('alta');
    });

    it('intensidade alias "moderada" e mapeada para "media"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'moderada' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('media');
    });

    it('intensidade alias "forte" e mapeada para "alta"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'forte' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('alta');
    });

    it('intensidade alias "fraca" e mapeada para "baixa"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'fraca' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('baixa');
    });

    it('intensidade alias "normal" e mapeada para "media"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'normal' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('media');
    });

    it('intensidade alias "maxima" e mapeada para "alta"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'maxima' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('alta');
    });

    it('intensidade alias "minima" e mapeada para "baixa"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'minima' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('baixa');
    });

    it('intensidade invalida recebe default "media"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: 'extrema' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('media');
    });

    it('intensidade nula recebe default "media"', () => {
      const segments = [{ text: 'Texto.', narracao: { intensidade: null } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.intensidade).toBe('media');
    });
  });

  // ── Missing tipo defaults to narracao ──

  describe('tipo ausente ou invalido recebe default "narracao"', () => {
    it('segmento sem tipo recebe "narracao"', () => {
      const segments = [{ text: 'Texto sem tipo.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });

    it('tipo vazio recebe "narracao"', () => {
      const segments = [{ text: 'Texto.', tipo: '' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });

    it('tipo null recebe "narracao"', () => {
      const segments = [{ text: 'Texto.', tipo: null }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });

    it('tipo invalido recebe "narracao"', () => {
      const segments = [{ text: 'Texto.', tipo: 'inventado' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });
  });

  // ── Tipo aliases ──

  describe('tipo aliases sao resolvidos corretamente', () => {
    it('tipo "dialogo" e mapeado para "fala_npc"', () => {
      const segments = [{ text: 'Fala do NPC.', tipo: 'dialogo' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('fala_npc');
      expect(result[0].speaker).toBe('npc');
    });

    it('tipo "descricao" e mapeado para "narracao"', () => {
      const segments = [{ text: 'Descricao.', tipo: 'descricao' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });

    it('tipo "acao" e mapeado para "narracao"', () => {
      const segments = [{ text: 'Acao.', tipo: 'acao' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });

    it('tipo "ambiente" e mapeado para "narracao"', () => {
      const segments = [{ text: 'Ambiente.', tipo: 'ambiente' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('narracao');
    });

    it('campo "type" alternativo tambem e reconhecido', () => {
      const segments = [{ text: 'Fala.', type: 'fala_npc' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('fala_npc');
    });
  });

  // ── Inference de tipo via speaker/npc_id ──

  describe('inferencia de tipo via speaker ou npc_id', () => {
    it('speaker "npc" infere tipo fala_npc', () => {
      const segments = [{ text: 'Fala.', speaker: 'npc' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('fala_npc');
    });

    it('presenca de npc_id infere tipo fala_npc', () => {
      const segments = [{ text: 'Fala.', npc_id: 'npc_guardiao' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].tipo).toBe('fala_npc');
    });
  });

  // ── Text extraction from alternative fields ──

  describe('texto extraido de campos alternativos', () => {
    it('campo "message" e usado se "text" ausente', () => {
      const segments = [{ message: 'Via message.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].text).toBe('Via message.');
    });

    it('campo "mensagem" e usado se "text" e "message" ausentes', () => {
      const segments = [{ mensagem: 'Via mensagem.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].text).toBe('Via mensagem.');
    });

    it('campo "conteudo" e usado se outros ausentes', () => {
      const segments = [{ conteudo: 'Via conteudo.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].text).toBe('Via conteudo.');
    });

    it('segmento sem nenhum campo de texto e filtrado', () => {
      const segments = [{ tipo: 'narracao' }];
      const result = normalizeNarrationSegments(segments);
      expect(result).toHaveLength(0);
    });

    it('segmento com texto vazio e filtrado', () => {
      const segments = [{ text: '' }];
      const result = normalizeNarrationSegments(segments);
      expect(result).toHaveLength(0);
    });

    it('segmento com texto somente espacos e filtrado', () => {
      const segments = [{ text: '   ' }];
      const result = normalizeNarrationSegments(segments);
      expect(result).toHaveLength(0);
    });
  });

  // ── Empty segments with fallbackText ──

  describe('array vazio com fallbackText gera segmento', () => {
    it('array vazio com fallbackText gera segmento de narracao', () => {
      const result = normalizeNarrationSegments([], { fallbackText: 'Texto de fallback.' });
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Texto de fallback.');
      expect(result[0].tipo).toBe('narracao');
      expect(result[0].speaker).toBe('mestre');
      expect(result[0].speaker_label).toBe('Mestre');
      expect(result[0].id).toBe('seg_1');
      expect(result[0].ordem).toBe(1);
    });

    it('todos segmentos sem texto com fallbackText gera fallback', () => {
      const segments = [{ tipo: 'narracao' }, { text: '' }];
      const result = normalizeNarrationSegments(segments, { fallbackText: 'Fallback.' });
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Fallback.');
    });

    it('array vazio sem fallbackText retorna array vazio', () => {
      const result = normalizeNarrationSegments([]);
      expect(result).toHaveLength(0);
    });

    it('array vazio com fallbackText vazio retorna array vazio', () => {
      const result = normalizeNarrationSegments([], { fallbackText: '' });
      expect(result).toHaveLength(0);
    });

    it('array vazio com fallbackText somente espacos retorna array vazio', () => {
      const result = normalizeNarrationSegments([], { fallbackText: '   ' });
      expect(result).toHaveLength(0);
    });

    it('fallback gera narracao com defaults de narracao', () => {
      const result = normalizeNarrationSegments([], { fallbackText: 'Fallback.' });
      expect(result[0].narracao).toEqual({
        emocao: 'neutro',
        ritmo: 'medio',
        intensidade: 'media'
      });
    });

    it('fallback gera npc_id null', () => {
      const result = normalizeNarrationSegments([], { fallbackText: 'Fallback.' });
      expect(result[0].npc_id).toBeNull();
    });
  });

  // ── null/undefined segments handling ──

  describe('tratamento de segments null/undefined', () => {
    it('segments undefined retorna array vazio', () => {
      const result = normalizeNarrationSegments(undefined);
      expect(result).toEqual([]);
    });

    it('segments null retorna array vazio', () => {
      const result = normalizeNarrationSegments(null);
      expect(result).toEqual([]);
    });

    it('segments nao-array retorna array vazio', () => {
      const result = normalizeNarrationSegments('nao sou array');
      expect(result).toEqual([]);
    });

    it('segments null com fallbackText gera fallback', () => {
      const result = normalizeNarrationSegments(null, { fallbackText: 'Backup.' });
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Backup.');
    });

    it('chamada sem argumentos retorna array vazio', () => {
      const result = normalizeNarrationSegments();
      expect(result).toEqual([]);
    });
  });

  // ── Segments with speaker_label (fala_npc type) ──

  describe('segmentos com speaker_label para fala_npc', () => {
    it('speaker_label e preservado para fala_npc', () => {
      const segments = [{
        text: 'Eu protejo esta ponte!',
        tipo: 'fala_npc',
        speaker_label: 'Troll da Ponte'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].speaker_label).toBe('Troll da Ponte');
      expect(result[0].speaker).toBe('npc');
    });

    it('fala_npc sem speaker_label usa speaker como fallback', () => {
      const segments = [{
        text: 'Fala de NPC.',
        tipo: 'fala_npc',
        speaker: 'Guardiao'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].speaker_label).toBe('Guardiao');
    });

    it('fala_npc sem speaker_label nem speaker usa "NPC" como default', () => {
      const segments = [{
        text: 'Fala generica.',
        tipo: 'fala_npc'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].speaker_label).toBe('NPC');
    });

    it('narracao sempre recebe speaker_label "Mestre"', () => {
      const segments = [{
        text: 'Narracao.',
        tipo: 'narracao',
        speaker_label: 'Outro'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].speaker_label).toBe('Mestre');
    });
  });

  // ── npc_id handling ──

  describe('tratamento de npc_id', () => {
    it('npc_id e preservado para fala_npc', () => {
      const segments = [{
        text: 'Fala.',
        tipo: 'fala_npc',
        npc_id: 'npc_guardiao'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].npc_id).toBe('npc_guardiao');
    });

    it('npc_id e null para narracao', () => {
      const segments = [{
        text: 'Narracao.',
        tipo: 'narracao',
        npc_id: 'npc_alguem'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].npc_id).toBeNull();
    });

    it('fala_npc sem npc_id recebe null', () => {
      const segments = [{
        text: 'Fala.',
        tipo: 'fala_npc'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].npc_id).toBeNull();
    });
  });

  // ── speech_text handling ──

  describe('tratamento de speech_text', () => {
    it('speech_text explicito e preservado', () => {
      const segments = [{
        text: '**Texto** com markdown.',
        speech_text: 'Texto limpo para fala.'
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].speech_text).toBe('Texto limpo para fala.');
    });

    it('speech_text e gerado a partir do text se ausente', () => {
      const segments = [{ text: 'Texto simples.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].speech_text).toBeDefined();
      expect(typeof result[0].speech_text).toBe('string');
      expect(result[0].speech_text.length).toBeGreaterThan(0);
    });
  });

  // ── narracao defaults ──

  describe('narracao recebe defaults quando ausente', () => {
    it('segmento sem narracao recebe defaults completos', () => {
      const segments = [{ text: 'Texto.' }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao).toEqual({
        emocao: 'neutro',
        ritmo: 'medio',
        intensidade: 'media'
      });
    });

    it('narracao parcial e complementada com defaults', () => {
      const segments = [{ text: 'Texto.', narracao: { emocao: 'epico' } }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0].narracao.emocao).toBe('epico');
      expect(result[0].narracao.ritmo).toBe('medio');
      expect(result[0].narracao.intensidade).toBe('media');
    });
  });

  // ── Combinacao completa de todos os campos ──

  describe('normalizacao completa com todos os campos', () => {
    it('segmento completo e normalizado corretamente', () => {
      const segments = [{
        id: 'seg_custom',
        text: 'O dragao ataca!',
        tipo: 'narracao',
        narracao: {
          emocao: 'epico',
          ritmo: 'rapido',
          intensidade: 'alta'
        }
      }];
      const result = normalizeNarrationSegments(segments);
      expect(result[0]).toMatchObject({
        id: 'seg_custom',
        ordem: 1,
        tipo: 'narracao',
        speaker: 'mestre',
        speaker_label: 'Mestre',
        text: 'O dragao ataca!',
        npc_id: null,
        narracao: {
          emocao: 'epico',
          ritmo: 'rapido',
          intensidade: 'alta'
        }
      });
    });
  });
});

// ── aggregateNarrationFromSegments ──

describe('aggregateNarrationFromSegments', () => {

  it('agrega texto de multiplos segmentos separados por dupla quebra de linha', () => {
    const segments = [
      { text: 'Primeiro paragrafo.' },
      { text: 'Segundo paragrafo.' },
      { text: 'Terceiro paragrafo.' }
    ];
    const result = aggregateNarrationFromSegments(segments);
    expect(result).toBe('Primeiro paragrafo.\n\nSegundo paragrafo.\n\nTerceiro paragrafo.');
  });

  it('segmento unico retorna seu texto', () => {
    const segments = [{ text: 'Texto unico.' }];
    const result = aggregateNarrationFromSegments(segments);
    expect(result).toBe('Texto unico.');
  });

  it('array vazio retorna string vazia', () => {
    const result = aggregateNarrationFromSegments([]);
    expect(result).toBe('');
  });

  it('undefined retorna string vazia', () => {
    const result = aggregateNarrationFromSegments(undefined);
    expect(result).toBe('');
  });

  it('null retorna string vazia', () => {
    const result = aggregateNarrationFromSegments(null);
    expect(result).toBe('');
  });

  it('segmentos sem texto sao filtrados', () => {
    const segments = [
      { text: 'Texto valido.' },
      { tipo: 'narracao' },
      { text: 'Outro valido.' }
    ];
    const result = aggregateNarrationFromSegments(segments);
    expect(result).toBe('Texto valido.\n\nOutro valido.');
  });

  it('segmentos de fala_npc e narracao sao agregados juntos', () => {
    const segments = [
      { text: 'O mestre descreve a cena.', tipo: 'narracao' },
      { text: 'Eu sou o guardiao!', tipo: 'fala_npc', speaker_label: 'Guardiao' }
    ];
    const result = aggregateNarrationFromSegments(segments);
    expect(result).toContain('O mestre descreve a cena.');
    expect(result).toContain('Eu sou o guardiao!');
  });

  it('chamada sem argumentos retorna string vazia', () => {
    const result = aggregateNarrationFromSegments();
    expect(result).toBe('');
  });
});

// ── aggregateSpeechFromSegments ──

describe('aggregateSpeechFromSegments', () => {

  it('agrega speech_text de multiplos segmentos', () => {
    const segments = [
      { text: 'Primeiro.', speech_text: 'Fala primeiro.' },
      { text: 'Segundo.', speech_text: 'Fala segundo.' }
    ];
    const result = aggregateSpeechFromSegments(segments);
    expect(result).toBe('Fala primeiro.\n\nFala segundo.');
  });

  it('usa text como fallback quando speech_text ausente', () => {
    const segments = [{ text: 'Texto simples.' }];
    const result = aggregateSpeechFromSegments(segments);
    expect(result.length).toBeGreaterThan(0);
  });

  it('array vazio retorna string vazia', () => {
    const result = aggregateSpeechFromSegments([]);
    expect(result).toBe('');
  });

  it('undefined retorna string vazia', () => {
    const result = aggregateSpeechFromSegments(undefined);
    expect(result).toBe('');
  });

  it('null retorna string vazia', () => {
    const result = aggregateSpeechFromSegments(null);
    expect(result).toBe('');
  });

  it('chamada sem argumentos retorna string vazia', () => {
    const result = aggregateSpeechFromSegments();
    expect(result).toBe('');
  });
});

// ── ensureNpcIds ──

describe('ensureNpcIds', () => {

  it('gera id a partir do nome do NPC', () => {
    const npcs = [{ nome: 'Guardiao da Ponte' }];
    const result = ensureNpcIds(npcs);
    expect(result[0].id).toBe('npc_guardiao_da_ponte');
    expect(result[0].nome).toBe('Guardiao da Ponte');
  });

  it('preserva id explicito do NPC', () => {
    const npcs = [{ id: 'meu_npc', nome: 'Goblin' }];
    const result = ensureNpcIds(npcs);
    expect(result[0].id).toBe('meu_npc');
  });

  it('gera nome default se ausente', () => {
    const npcs = [{}];
    const result = ensureNpcIds(npcs);
    expect(result[0].nome).toBe('NPC 1');
  });

  it('desduplicar ids repetidos', () => {
    const npcs = [
      { nome: 'Goblin' },
      { nome: 'Goblin' }
    ];
    const result = ensureNpcIds(npcs);
    expect(result[0].id).toBe('npc_goblin');
    expect(result[1].id).not.toBe(result[0].id);
  });

  it('preserva voice_id e voice_provider', () => {
    const npcs = [{
      nome: 'Mago',
      voice_id: 'voice_123',
      voice_provider: 'elevenlabs'
    }];
    const result = ensureNpcIds(npcs);
    expect(result[0].voice_id).toBe('voice_123');
    expect(result[0].voice_provider).toBe('elevenlabs');
  });

  it('voice_provider recebe default quando voice_id presente mas provider ausente', () => {
    const npcs = [{
      nome: 'Mago',
      voice_id: 'voice_123'
    }];
    const result = ensureNpcIds(npcs);
    expect(result[0].voice_id).toBe('voice_123');
    expect(result[0].voice_provider).toBe('opensource');
  });

  it('voice_id e voice_provider sao null quando voice_id ausente', () => {
    const npcs = [{ nome: 'Mago' }];
    const result = ensureNpcIds(npcs);
    expect(result[0].voice_id).toBeNull();
    expect(result[0].voice_provider).toBeNull();
  });

  it('preserva dialogo_exemplo', () => {
    const npcs = [{ nome: 'Mago', dialogo_exemplo: 'Eu lancarei um feitico!' }];
    const result = ensureNpcIds(npcs);
    expect(result[0].dialogo_exemplo).toBe('Eu lancarei um feitico!');
  });

  it('dialogo_exemplo vazio vira null', () => {
    const npcs = [{ nome: 'Mago', dialogo_exemplo: '' }];
    const result = ensureNpcIds(npcs);
    expect(result[0].dialogo_exemplo).toBeNull();
  });

  it('array vazio retorna array vazio', () => {
    expect(ensureNpcIds([])).toEqual([]);
  });

  it('undefined retorna array vazio', () => {
    expect(ensureNpcIds(undefined)).toEqual([]);
  });

  it('null retorna array vazio', () => {
    expect(ensureNpcIds(null)).toEqual([]);
  });

  it('nao-array retorna array vazio', () => {
    expect(ensureNpcIds('nao sou array')).toEqual([]);
  });

  it('chamada sem argumentos retorna array vazio', () => {
    expect(ensureNpcIds()).toEqual([]);
  });

  it('preserva propriedades extras do NPC', () => {
    const npcs = [{ nome: 'Mago', custom: 'valor' }];
    const result = ensureNpcIds(npcs);
    expect(result[0].custom).toBe('valor');
  });

  it('processa multiplos NPCs corretamente', () => {
    const npcs = [
      { nome: 'Goblin', voice_id: 'v1' },
      { nome: 'Troll' },
      { nome: 'Dragao', voice_id: 'v3', voice_provider: 'cartesia' }
    ];
    const result = ensureNpcIds(npcs);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('npc_goblin');
    expect(result[1].id).toBe('npc_troll');
    expect(result[2].id).toBe('npc_dragao');
    expect(result[2].voice_provider).toBe('cartesia');
  });
});

// ── resolveNarrationSegments ──

describe('resolveNarrationSegments', () => {

  it('resolve segmentos com voice_id explicitodo segmento', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Texto.',
        tipo: 'narracao',
        voice_id: 'voice_seg',
        voice_provider: 'elevenlabs'
      }]
    });
    expect(result[0].voice_id).toBe('voice_seg');
    expect(result[0].voice_provider).toBe('elevenlabs');
    expect(result[0].voice_origin).toBe('segmento');
  });

  it('resolve voice do NPC quando npc_id encontrado no roteiro', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Eu falo!',
        tipo: 'fala_npc',
        npc_id: 'npc_goblin'
      }],
      roteiro: {
        npcs: [{
          id: 'npc_goblin',
          nome: 'Goblin',
          voice_id: 'voice_goblin',
          voice_provider: 'elevenlabs'
        }]
      }
    });
    expect(result[0].voice_id).toBe('voice_goblin');
    expect(result[0].voice_provider).toBe('elevenlabs');
    expect(result[0].voice_origin).toBe('npc');
  });

  it('resolve voice do NPC por nome via speaker_label', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Eu falo!',
        tipo: 'fala_npc',
        speaker_label: 'Goblin'
      }],
      roteiro: {
        npcs: [{
          nome: 'Goblin',
          voice_id: 'voice_goblin'
        }]
      }
    });
    expect(result[0].voice_id).toBe('voice_goblin');
    expect(result[0].voice_origin).toBe('npc');
  });

  it('fallback para voice do mestre quando NPC nao encontrado', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Eu falo!',
        tipo: 'fala_npc',
        npc_id: 'npc_inexistente'
      }],
      mestreConfig: {
        voice_id: 'voice_mestre',
        voice_provider: 'elevenlabs'
      }
    });
    expect(result[0].voice_id).toBe('voice_mestre');
    expect(result[0].voice_origin).toBe('fallback_mestre');
  });

  it('usa voice do mestre para narracao', () => {
    const result = resolveNarrationSegments({
      segmentos: [{ text: 'Narracao.', tipo: 'narracao' }],
      mestreConfig: {
        voice_id: 'voice_mestre',
        voice_provider: 'elevenlabs'
      }
    });
    expect(result[0].voice_id).toBe('voice_mestre');
    expect(result[0].voice_origin).toBe('mestre');
  });

  it('voice unresolved quando nenhuma source de voice disponivel', () => {
    const result = resolveNarrationSegments({
      segmentos: [{ text: 'Sem voz.', tipo: 'narracao' }]
    });
    expect(result[0].voice_id).toBeNull();
    expect(result[0].voice_provider).toBeNull();
    expect(result[0].voice_origin).toBe('unresolved');
  });

  it('audio_cache_key e gerado quando voice_id presente', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Com cache.',
        tipo: 'narracao',
        voice_id: 'voice_test'
      }]
    });
    expect(result[0].audio_cache_key).toBeTruthy();
    expect(typeof result[0].audio_cache_key).toBe('string');
  });

  it('audio_cache_key e null quando voice_id ausente', () => {
    const result = resolveNarrationSegments({
      segmentos: [{ text: 'Sem cache.' }]
    });
    expect(result[0].audio_cache_key).toBeNull();
  });

  it('usa narrativa como fallback quando segmentos vazio', () => {
    const result = resolveNarrationSegments({
      narrativa: 'Texto de narrativa.',
      segmentos: []
    });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Texto de narrativa.');
  });

  it('chamada sem argumentos retorna array vazio', () => {
    const result = resolveNarrationSegments();
    expect(result).toEqual([]);
  });

  it('segmentos recebem ordem sequencial apos resolucao', () => {
    const result = resolveNarrationSegments({
      segmentos: [
        { text: 'Primeiro.' },
        { text: 'Segundo.' },
        { text: 'Terceiro.' }
      ]
    });
    expect(result[0].ordem).toBe(1);
    expect(result[1].ordem).toBe(2);
    expect(result[2].ordem).toBe(3);
  });

  it('voice_provider usa default quando explicito ausente com voice_id do segmento', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Texto.',
        voice_id: 'voice_x'
      }]
    });
    expect(result[0].voice_provider).toBe('opensource');
  });

  it('npc_id resolvido a partir do NPC matched por nome', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Fala.',
        tipo: 'fala_npc',
        speaker_label: 'Goblin'
      }],
      roteiro: {
        npcs: [{
          id: 'npc_goblin_rei',
          nome: 'Goblin',
          voice_id: 'v1'
        }]
      }
    });
    expect(result[0].npc_id).toBe('npc_goblin_rei');
  });

  it('segmento com voice_id explicito tem prioridade sobre NPC voice', () => {
    const result = resolveNarrationSegments({
      segmentos: [{
        text: 'Fala.',
        tipo: 'fala_npc',
        npc_id: 'npc_goblin',
        voice_id: 'voice_override',
        voice_provider: 'cartesia'
      }],
      roteiro: {
        npcs: [{
          id: 'npc_goblin',
          nome: 'Goblin',
          voice_id: 'voice_goblin',
          voice_provider: 'elevenlabs'
        }]
      }
    });
    expect(result[0].voice_id).toBe('voice_override');
    expect(result[0].voice_provider).toBe('cartesia');
    expect(result[0].voice_origin).toBe('segmento');
  });
});
