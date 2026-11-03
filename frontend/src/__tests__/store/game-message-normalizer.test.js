/**
 * Tests for the gameMessageNormalizer utility.
 *
 * This is used by the Game store's message actions.
 *
 * Covers:
 * - normalizeGameMessage: tipo inference, id generation, field normalization
 * - normalizeGameMessages: deduplication, batch normalization
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeGameMessage,
  normalizeGameMessages,
} from '../../utils/gameMessageNormalizer.js';

// ===========================================================================
// normalizeGameMessage
// ===========================================================================

describe('normalizeGameMessage', () => {
  it('preserves explicit tipo/type', () => {
    const result = normalizeGameMessage({ tipo: 'mestre', message: 'Hello' });
    expect(result.tipo).toBe('mestre');
    expect(result.type).toBe('mestre');
  });

  it('infers tipo = roleplay from canal', () => {
    const result = normalizeGameMessage({ canal: 'roleplay', message: 'RP text' });
    expect(result.tipo).toBe('roleplay');
  });

  it('infers tipo = dado when dice/valor fields present', () => {
    const result = normalizeGameMessage({ dice: true, valor: 6 });
    expect(result.tipo).toBe('dado');
  });

  it('infers tipo = mestre for userId = "mestre"', () => {
    const result = normalizeGameMessage({ userId: 'mestre', message: 'Narration' });
    expect(result.tipo).toBe('mestre');
  });

  it('infers tipo = mestre for username = "Mestre"', () => {
    const result = normalizeGameMessage({ username: 'Mestre', message: 'Text' });
    expect(result.tipo).toBe('mestre');
  });

  it('infers tipo = jogador for regular userId', () => {
    const result = normalizeGameMessage({ userId: 'player-1', message: 'Attack!' });
    expect(result.tipo).toBe('jogador');
  });

  it('infers tipo = sistema as fallback', () => {
    const result = normalizeGameMessage({ message: 'System msg' });
    expect(result.tipo).toBe('sistema');
  });

  it('preserves existing id', () => {
    const result = normalizeGameMessage({ id: 'msg-42', message: 'Hi' });
    expect(result.id).toBe('msg-42');
  });

  it('falls back to timestamp for id when no explicit id', () => {
    const result = normalizeGameMessage({ timestamp: 'ts-123', message: 'Hi' });
    expect(result.id).toBe('ts-123');
  });

  it('generates a fallback id when neither id nor timestamp exist', () => {
    const result = normalizeGameMessage({ message: 'Hi' });
    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe('string');
  });

  it('normalizes message and mensagem fields', () => {
    const result = normalizeGameMessage({ message: 'Hello' });
    expect(result.message).toBe('Hello');
    expect(result.mensagem).toBe('Hello');
  });

  it('normalizes mensagem to message field', () => {
    const result = normalizeGameMessage({ mensagem: 'Ola' });
    expect(result.message).toBe('Ola');
  });

  it('normalizes segmentos', () => {
    const result = normalizeGameMessage({
      id: 'm1',
      segmentos: [{ text: 'Segment 1' }, { text: 'Segment 2' }],
    });
    expect(result.segmentos).toHaveLength(2);
    expect(result.segmentos[0]).toHaveProperty('id');
    expect(result.segmentos[0]).toHaveProperty('ordem');
    expect(result.segmentos[0]).toHaveProperty('tipo');
    expect(result.segmentos[0]).toHaveProperty('speaker');
    expect(result.segmentos[0]).toHaveProperty('itemKey');
  });

  it('assigns unique ids to segmentos', () => {
    const result = normalizeGameMessage({
      id: 'm1',
      segmentos: [{ text: 'A' }, { text: 'B' }],
    });
    const ids = result.segmentos.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('filters out empty segmentos', () => {
    const result = normalizeGameMessage({
      id: 'm1',
      segmentos: [{ text: 'Has text' }, { text: '' }, { text: '  ' }],
    });
    expect(result.segmentos).toHaveLength(1);
  });

  it('handles segmento with npc_id', () => {
    const result = normalizeGameMessage({
      id: 'm1',
      segmentos: [{ text: 'NPC says hi', npc_id: 'npc-1' }],
    });
    expect(result.segmentos[0].tipo).toBe('fala_npc');
    expect(result.segmentos[0].speaker).toBe('npc');
    expect(result.segmentos[0].npc_id).toBe('npc-1');
  });

  it('sets canal from tipo when tipo is roleplay', () => {
    const result = normalizeGameMessage({ tipo: 'roleplay', message: 'RP' });
    expect(result.canal).toBe('roleplay');
  });

  it('defaults canal to formal', () => {
    const result = normalizeGameMessage({ message: 'Regular' });
    expect(result.canal).toBe('formal');
  });

  it('preserves payload field', () => {
    const result = normalizeGameMessage({ payload: { some: 'data' } });
    expect(result.payload).toEqual({ some: 'data' });
  });

  it('defaults payload to null', () => {
    const result = normalizeGameMessage({});
    expect(result.payload).toBeNull();
  });

  it('preserves speech_text', () => {
    const result = normalizeGameMessage({ speech_text: 'spoken text' });
    expect(result.speech_text).toBe('spoken text');
  });
});

// ===========================================================================
// normalizeGameMessages
// ===========================================================================

describe('normalizeGameMessages', () => {
  it('normalizes an array of messages', () => {
    const result = normalizeGameMessages([
      { id: 'a', message: 'First' },
      { id: 'b', message: 'Second' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('b');
  });

  it('deduplicates messages by id', () => {
    const result = normalizeGameMessages([
      { id: 'dup', message: 'First' },
      { id: 'dup', message: 'Duplicate' },
      { id: 'unique', message: 'Third' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('dup');
    expect(result[1].id).toBe('unique');
  });

  it('handles empty array', () => {
    expect(normalizeGameMessages([])).toEqual([]);
  });

  it('handles null input', () => {
    expect(normalizeGameMessages(null)).toEqual([]);
  });

  it('handles undefined input', () => {
    expect(normalizeGameMessages(undefined)).toEqual([]);
  });
});
