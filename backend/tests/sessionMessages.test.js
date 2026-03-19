import { describe, it, expect } from 'vitest';
import {
  createMessageId,
  createSessionMessage,
  appendMensagemSessao,
  removeMensagensSessao,
  buildMestreMensagem,
  buildJogadorMensagem,
  buildRoleplayMensagem,
  buildDadoMensagem,
  buildResultadoDadoInicialMensagem,
  buildSolicitacaoDadosMensagem,
  buildResultadoTesteMensagem,
  buildAcaoMestreMensagem,
  buildSistemaMensagem,
  buildOrdemDefinidaMensagem,
  buildTransicaoTurnoMensagem,
  buildEntreRodadasMensagem,
  buildCombateMensagem
} from '../websocket/utils/sessionMessages.js';

// ---------------------------------------------------------------------------
// createMessageId
// ---------------------------------------------------------------------------
describe('createMessageId', () => {
  it('returns a string starting with the default prefix "msg"', () => {
    const id = createMessageId();
    expect(id).toMatch(/^msg_/);
  });

  it('uses a custom prefix', () => {
    const id = createMessageId('turno');
    expect(id).toMatch(/^turno_/);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createMessageId()));
    expect(ids.size).toBe(50);
  });

  it('returns a non-empty string', () => {
    const id = createMessageId('x');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(2);
  });
});

// ---------------------------------------------------------------------------
// createSessionMessage
// ---------------------------------------------------------------------------
describe('createSessionMessage', () => {
  it('creates a message with all default fields when called with no args', () => {
    const msg = createSessionMessage();
    expect(msg.id).toMatch(/^msg_/);
    expect(msg.tipo).toBe('sistema');
    expect(msg.canal).toBe('formal');
    expect(msg.origem).toBe('sistema');
    expect(msg.userId).toBeNull();
    expect(msg.username).toBe('Sistema');
    expect(msg.message).toBe('');
    expect(msg.mensagem).toBe('');
    expect(msg.payload).toBeNull();
    expect(typeof msg.timestamp).toBe('number');
  });

  it('applies provided fields', () => {
    const msg = createSessionMessage({
      tipo: 'mestre',
      canal: 'roleplay',
      origem: 'turno',
      userId: 'u1',
      username: 'Alice',
      message: 'Hello',
      payload: { foo: 1 },
      timestamp: 999
    });
    expect(msg.tipo).toBe('mestre');
    expect(msg.canal).toBe('roleplay');
    expect(msg.origem).toBe('turno');
    expect(msg.userId).toBe('u1');
    expect(msg.username).toBe('Alice');
    expect(msg.message).toBe('Hello');
    expect(msg.mensagem).toBe('Hello');
    expect(msg.payload).toEqual({ foo: 1 });
    expect(msg.timestamp).toBe(999);
  });

  it('generates id from tipo prefix when id is not provided', () => {
    const msg = createSessionMessage({ tipo: 'dado' });
    expect(msg.id).toMatch(/^dado_/);
  });

  it('uses provided id when given', () => {
    const msg = createSessionMessage({ id: 'custom-id' });
    expect(msg.id).toBe('custom-id');
  });

  it('converts null/undefined message to empty string', () => {
    const msg1 = createSessionMessage({ message: null });
    expect(msg1.message).toBe('');
    const msg2 = createSessionMessage({ message: undefined });
    expect(msg2.message).toBe('');
  });

  it('sets message and mensagem to the same value', () => {
    const msg = createSessionMessage({ message: 'abc' });
    expect(msg.message).toBe(msg.mensagem);
  });

  it('spreads extra (rest) fields onto the returned object', () => {
    const msg = createSessionMessage({ tipo: 'mestre', voice_id: 'v1', extra: true });
    expect(msg.voice_id).toBe('v1');
    expect(msg.extra).toBe(true);
  });

  it('generates a numeric timestamp by default', () => {
    const before = Date.now();
    const msg = createSessionMessage();
    const after = Date.now();
    expect(msg.timestamp).toBeGreaterThanOrEqual(before);
    expect(msg.timestamp).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// appendMensagemSessao
// ---------------------------------------------------------------------------
describe('appendMensagemSessao', () => {
  it('appends a message to an empty session', () => {
    const sessao = {};
    const msg = { id: 'm1', message: 'hi' };
    const returned = appendMensagemSessao(sessao, msg);
    expect(sessao.mensagens).toHaveLength(1);
    expect(sessao.mensagens[0]).toBe(msg);
    expect(returned).toBe(msg);
  });

  it('initializes mensagens array when session has none', () => {
    const sessao = {};
    appendMensagemSessao(sessao, { id: '1' });
    expect(Array.isArray(sessao.mensagens)).toBe(true);
  });

  it('appends to existing array', () => {
    const sessao = { mensagens: [{ id: '1' }] };
    appendMensagemSessao(sessao, { id: '2' });
    expect(sessao.mensagens).toHaveLength(2);
    expect(sessao.mensagens[1].id).toBe('2');
  });

  it('caps the array at 500 messages', () => {
    const sessao = { mensagens: Array.from({ length: 500 }, (_, i) => ({ id: `m${i}` })) };
    appendMensagemSessao(sessao, { id: 'overflow' });
    expect(sessao.mensagens).toHaveLength(500);
    expect(sessao.mensagens[499].id).toBe('overflow');
    // first element should have been trimmed
    expect(sessao.mensagens[0].id).toBe('m1');
  });

  it('handles session with mensagens set to a non-array value', () => {
    const sessao = { mensagens: 'not-an-array' };
    appendMensagemSessao(sessao, { id: '1' });
    expect(Array.isArray(sessao.mensagens)).toBe(true);
    expect(sessao.mensagens).toHaveLength(1);
  });

  it('handles default (undefined) session gracefully', () => {
    // Calling with no args should not throw (default param = {})
    const msg = { id: '1' };
    expect(() => appendMensagemSessao(undefined, msg)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// removeMensagensSessao
// ---------------------------------------------------------------------------
describe('removeMensagensSessao', () => {
  it('removes messages matching the predicate and returns count', () => {
    const sessao = {
      mensagens: [
        { id: '1', tipo: 'sistema' },
        { id: '2', tipo: 'mestre' },
        { id: '3', tipo: 'sistema' }
      ]
    };
    const removed = removeMensagensSessao(sessao, (m) => m.tipo === 'sistema');
    expect(removed).toBe(2);
    expect(sessao.mensagens).toHaveLength(1);
    expect(sessao.mensagens[0].id).toBe('2');
  });

  it('returns 0 when no messages match', () => {
    const sessao = { mensagens: [{ id: '1', tipo: 'mestre' }] };
    const removed = removeMensagensSessao(sessao, (m) => m.tipo === 'sistema');
    expect(removed).toBe(0);
    expect(sessao.mensagens).toHaveLength(1);
  });

  it('returns 0 when predicate is null', () => {
    const sessao = { mensagens: [{ id: '1' }] };
    const removed = removeMensagensSessao(sessao, null);
    expect(removed).toBe(0);
  });

  it('returns 0 when predicate is not a function', () => {
    const sessao = { mensagens: [{ id: '1' }] };
    const removed = removeMensagensSessao(sessao, 'not-a-function');
    expect(removed).toBe(0);
  });

  it('returns 0 when mensagens is not an array', () => {
    const sessao = { mensagens: null };
    const removed = removeMensagensSessao(sessao, () => true);
    expect(removed).toBe(0);
  });

  it('returns 0 for an empty session', () => {
    const removed = removeMensagensSessao({}, () => true);
    expect(removed).toBe(0);
  });

  it('passes index to predicate', () => {
    const sessao = { mensagens: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
    const removed = removeMensagensSessao(sessao, (_m, index) => index === 1);
    expect(removed).toBe(1);
    expect(sessao.mensagens.map((m) => m.id)).toEqual(['a', 'c']);
  });
});

// ---------------------------------------------------------------------------
// buildMestreMensagem
// ---------------------------------------------------------------------------
describe('buildMestreMensagem', () => {
  it('builds a mestre message with defaults', () => {
    const msg = buildMestreMensagem('Narrativa');
    expect(msg.tipo).toBe('mestre');
    expect(msg.canal).toBe('formal');
    expect(msg.origem).toBe('turno');
    expect(msg.userId).toBe('mestre');
    expect(msg.username).toBe('Mestre');
    expect(msg.message).toBe('Narrativa');
    expect(msg.mensagem).toBe('Narrativa');
    expect(msg.voice_id).toBeNull();
    expect(msg.voice_provider).toBeNull();
    expect(msg.speech_text).toBeNull();
    expect(msg.audio_cache_key).toBeNull();
    expect(msg.segmentos).toEqual([]);
  });

  it('picks up voice_id and voice_provider from mestreConfig', () => {
    const cfg = { voice_id: 'v-123', voice_provider: 'elevenlabs' };
    const msg = buildMestreMensagem('Hello', cfg);
    expect(msg.voice_id).toBe('v-123');
    expect(msg.voice_provider).toBe('elevenlabs');
  });

  it('applies option overrides', () => {
    const msg = buildMestreMensagem('Content', null, {
      tipo: 'custom_tipo',
      canal: 'roleplay',
      origem: 'manual',
      userId: 'u99',
      username: 'Custom',
      payload: { data: 1 },
      speechText: 'speak this',
      audioCacheKey: 'cache-1',
      segmentos: [{ text: 'seg' }]
    });
    expect(msg.tipo).toBe('custom_tipo');
    expect(msg.canal).toBe('roleplay');
    expect(msg.origem).toBe('manual');
    expect(msg.userId).toBe('u99');
    expect(msg.username).toBe('Custom');
    expect(msg.payload).toEqual({ data: 1 });
    expect(msg.speech_text).toBe('speak this');
    expect(msg.audio_cache_key).toBe('cache-1');
    expect(msg.segmentos).toEqual([{ text: 'seg' }]);
  });

  it('handles speech_text via snake_case option', () => {
    const msg = buildMestreMensagem('X', null, { speech_text: 'alt' });
    expect(msg.speech_text).toBe('alt');
  });

  it('applies extraFields from options', () => {
    const msg = buildMestreMensagem('Y', null, { extraFields: { custom: 42 } });
    expect(msg.custom).toBe(42);
  });

  it('handles null mestreConfig gracefully', () => {
    const msg = buildMestreMensagem('Z', null);
    expect(msg.voice_id).toBeNull();
    expect(msg.voice_provider).toBeNull();
  });

  it('ignores non-array segmentos in options', () => {
    const msg = buildMestreMensagem('W', null, { segmentos: 'not-array' });
    expect(msg.segmentos).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildJogadorMensagem
// ---------------------------------------------------------------------------
describe('buildJogadorMensagem', () => {
  it('builds a player message with required fields', () => {
    const msg = buildJogadorMensagem({
      userId: 'u1',
      username: 'Alice',
      message: 'I attack'
    });
    expect(msg.tipo).toBe('jogador');
    expect(msg.canal).toBe('formal');
    expect(msg.origem).toBe('turno');
    expect(msg.userId).toBe('u1');
    expect(msg.username).toBe('Alice');
    expect(msg.message).toBe('I attack');
    expect(msg.personagem).toBeNull();
    expect(msg.payload).toBeNull();
  });

  it('defaults username to "Jogador" when not provided', () => {
    const msg = buildJogadorMensagem({ userId: 'u1', message: 'hi' });
    expect(msg.username).toBe('Jogador');
  });

  it('includes personagem when provided', () => {
    const personagem = { nome: 'Aldaric', classe: 'Mago' };
    const msg = buildJogadorMensagem({
      userId: 'u1',
      username: 'Bob',
      personagem,
      message: 'Cast spell'
    });
    expect(msg.personagem).toBe(personagem);
  });

  it('spreads extraFields onto the message', () => {
    const msg = buildJogadorMensagem({
      userId: 'u1',
      username: 'Bob',
      message: 'x',
      extraFields: { custom: true }
    });
    expect(msg.custom).toBe(true);
  });

  it('uses provided origem', () => {
    const msg = buildJogadorMensagem({
      userId: 'u1',
      username: 'Bob',
      message: 'x',
      origem: 'manual'
    });
    expect(msg.origem).toBe('manual');
  });

  it('creates a message with defaults when called with no args', () => {
    const msg = buildJogadorMensagem();
    expect(msg.tipo).toBe('jogador');
    expect(msg.username).toBe('Jogador');
  });
});

// ---------------------------------------------------------------------------
// buildRoleplayMensagem
// ---------------------------------------------------------------------------
describe('buildRoleplayMensagem', () => {
  it('builds a roleplay message with correct tipo and canal', () => {
    const msg = buildRoleplayMensagem({
      userId: 'u1',
      username: 'Alice',
      message: 'RP action'
    });
    expect(msg.tipo).toBe('roleplay');
    expect(msg.canal).toBe('roleplay');
    expect(msg.origem).toBe('turno');
    expect(msg.message).toBe('RP action');
  });

  it('defaults username to Jogador', () => {
    const msg = buildRoleplayMensagem({ userId: 'u1', message: 'x' });
    expect(msg.username).toBe('Jogador');
  });
});

// ---------------------------------------------------------------------------
// buildDadoMensagem
// ---------------------------------------------------------------------------
describe('buildDadoMensagem', () => {
  it('builds a dice roll message with text description', () => {
    const msg = buildDadoMensagem({
      userId: 'u1',
      username: 'Alice',
      personagemNome: 'Aldaric',
      dice: 'd20',
      result: 15,
      description: 'attack roll'
    });
    expect(msg.tipo).toBe('dado');
    expect(msg.message).toBe('Aldaric rolou d20: 15 (attack roll)');
    expect(msg.dice).toBe('d20');
    expect(msg.result).toBe(15);
    expect(msg.personagemNome).toBe('Aldaric');
  });

  it('uses username when personagemNome is not provided', () => {
    const msg = buildDadoMensagem({ userId: 'u1', username: 'Bob', result: 5 });
    expect(msg.message).toContain('Bob rolou');
  });

  it('uses "?" when result is null', () => {
    const msg = buildDadoMensagem({ userId: 'u1', username: 'Bob' });
    expect(msg.message).toContain('?');
  });

  it('uses provided payload instead of auto-generated one', () => {
    const customPayload = { custom: true };
    const msg = buildDadoMensagem({ userId: 'u1', username: 'Bob', payload: customPayload });
    expect(msg.payload).toBe(customPayload);
  });
});

// ---------------------------------------------------------------------------
// buildResultadoDadoInicialMensagem
// ---------------------------------------------------------------------------
describe('buildResultadoDadoInicialMensagem', () => {
  it('builds an initiative roll message', () => {
    const msg = buildResultadoDadoInicialMensagem({
      userId: 'u1',
      username: 'Alice',
      personagemNome: 'Aldaric',
      valor: 18
    });
    expect(msg.tipo).toBe('resultado_dado_inicial');
    expect(msg.message).toBe('Aldaric rolou a iniciativa: 18');
    expect(msg.valor).toBe(18);
    expect(msg.origem).toBe('sistema');
  });

  it('uses "?" when valor is null', () => {
    const msg = buildResultadoDadoInicialMensagem({ userId: 'u1', username: 'Bob' });
    expect(msg.message).toContain('?');
  });
});

// ---------------------------------------------------------------------------
// buildSolicitacaoDadosMensagem
// ---------------------------------------------------------------------------
describe('buildSolicitacaoDadosMensagem', () => {
  it('builds a dice solicitation message', () => {
    const msg = buildSolicitacaoDadosMensagem({
      narrativa: 'Teste de sabedoria',
      origem: 'manual'
    });
    expect(msg.tipo).toBe('solicitacao_dados');
    expect(msg.userId).toBe('mestre');
    expect(msg.username).toBe('Mestre');
    expect(msg.message).toBe('Teste de sabedoria');
    expect(msg.origem).toBe('manual');
  });

  it('uses default message when narrativa is falsy', () => {
    const msg = buildSolicitacaoDadosMensagem({});
    expect(msg.message).toBe('O Mestre solicita uma rolagem de dados.');
  });
});

// ---------------------------------------------------------------------------
// buildResultadoTesteMensagem
// ---------------------------------------------------------------------------
describe('buildResultadoTesteMensagem', () => {
  it('builds a full test result message with all fields', () => {
    const msg = buildResultadoTesteMensagem({
      userId: 'u1',
      username: 'Alice',
      personagemNome: 'Aldaric',
      dice: 'd20',
      resultado: 14,
      rolagemBruta: 14,
      total: 17,
      totalModificador: 3,
      atributoNome: 'Sabedoria',
      dc: 15,
      sucesso: true,
      descricaoResultado: 'Sucesso!'
    });
    expect(msg.tipo).toBe('resultado_teste');
    expect(msg.message).toContain('Aldaric rolou d20: 14');
    expect(msg.message).toContain('Sabedoria +3');
    expect(msg.message).toContain('= 17');
    expect(msg.message).toContain('vs DC 15');
    expect(msg.message).toContain('-> Sucesso!');
    expect(msg.sucesso).toBe(true);
    expect(msg.total).toBe(17);
    expect(msg.dc).toBe(15);
  });

  it('handles negative modifier', () => {
    const msg = buildResultadoTesteMensagem({
      userId: 'u1',
      personagemNome: 'Warrior',
      dice: 'd20',
      rolagemBruta: 10,
      total: 8,
      totalModificador: -2,
      atributoNome: 'Inteligencia'
    });
    expect(msg.message).toContain('Inteligencia -2');
  });

  it('omits optional fields from message text when null', () => {
    const msg = buildResultadoTesteMensagem({
      userId: 'u1',
      username: 'Bob',
      resultado: 10
    });
    expect(msg.message).not.toContain('vs DC');
    expect(msg.message).not.toContain('->');
    expect(msg.message).not.toContain('=');
  });
});

// ---------------------------------------------------------------------------
// buildAcaoMestreMensagem
// ---------------------------------------------------------------------------
describe('buildAcaoMestreMensagem', () => {
  it('builds an item_recebido action message', () => {
    const msg = buildAcaoMestreMensagem({
      tipo: 'item_recebido',
      personagem: 'Aldaric',
      itemNome: 'Espada'
    });
    expect(msg.tipo).toBe('acao_mestre');
    expect(msg.message).toBe('Aldaric recebeu Espada.');
  });

  it('builds a dano_recebido action message', () => {
    const msg = buildAcaoMestreMensagem({
      tipo: 'dano_recebido',
      personagem: 'Aldaric',
      dano: 10,
      elemento: 'fogo'
    });
    expect(msg.message).toBe('Aldaric sofreu 10 de dano (fogo).');
  });

  it('builds a dano_recebido immune message', () => {
    const msg = buildAcaoMestreMensagem({
      tipo: 'dano_recebido',
      personagem: 'Aldaric',
      imune: true,
      elemento: 'gelo'
    });
    expect(msg.message).toBe('Aldaric ignorou o dano de gelo.');
  });

  it('builds a curado action message', () => {
    const msg = buildAcaoMestreMensagem({
      tipo: 'curado',
      personagem: 'Alice',
      hp_restaurado: 20
    });
    expect(msg.message).toBe('Alice recuperou 20 HP.');
  });

  it('builds a status_aplicado action message', () => {
    const msg = buildAcaoMestreMensagem({
      tipo: 'status_aplicado',
      personagem: 'Bob',
      status: 'envenenado'
    });
    expect(msg.message).toBe('Bob recebeu o status envenenado.');
  });

  it('falls back to default text for unknown action tipo', () => {
    const msg = buildAcaoMestreMensagem({ tipo: 'unknown_type' });
    expect(msg.message).toContain('unknown_type');
  });

  it('uses message/mensagem fallback for unknown tipo', () => {
    const msg = buildAcaoMestreMensagem({ tipo: 'custom', message: 'Custom text' });
    expect(msg.message).toBe('Custom text');
  });
});

// ---------------------------------------------------------------------------
// buildSistemaMensagem
// ---------------------------------------------------------------------------
describe('buildSistemaMensagem', () => {
  it('builds a system message with defaults', () => {
    const msg = buildSistemaMensagem('System alert');
    expect(msg.tipo).toBe('sistema');
    expect(msg.canal).toBe('sistema');
    expect(msg.origem).toBe('sistema');
    expect(msg.userId).toBe('sistema');
    expect(msg.username).toBe('Sistema');
    expect(msg.message).toBe('System alert');
  });

  it('accepts option overrides', () => {
    const msg = buildSistemaMensagem('msg', {
      tipo: 'custom',
      canal: 'formal',
      origem: 'turno',
      userId: 'u1',
      username: 'Admin',
      payload: { x: 1 },
      extraFields: { extra: true }
    });
    expect(msg.tipo).toBe('custom');
    expect(msg.canal).toBe('formal');
    expect(msg.origem).toBe('turno');
    expect(msg.userId).toBe('u1');
    expect(msg.username).toBe('Admin');
    expect(msg.payload).toEqual({ x: 1 });
    expect(msg.extra).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildOrdemDefinidaMensagem
// ---------------------------------------------------------------------------
describe('buildOrdemDefinidaMensagem', () => {
  it('builds an order-defined message with player names', () => {
    const msg = buildOrdemDefinidaMensagem({
      ordemJogadores: [
        { username: 'Alice' },
        { username: 'Bob' }
      ]
    });
    expect(msg.tipo).toBe('ordem_definida');
    expect(msg.message).toContain('Alice, Bob');
  });

  it('falls back to "Jogador" for missing names', () => {
    const msg = buildOrdemDefinidaMensagem({ ordemJogadores: [{}] });
    expect(msg.message).toContain('Jogador');
  });

  it('handles empty player list', () => {
    const msg = buildOrdemDefinidaMensagem({ ordemJogadores: [] });
    expect(msg.message).toContain('nenhum jogador');
  });

  it('uses nome fallback', () => {
    const msg = buildOrdemDefinidaMensagem({ ordemJogadores: [{ nome: 'Charlie' }] });
    expect(msg.message).toContain('Charlie');
  });
});

// ---------------------------------------------------------------------------
// buildTransicaoTurnoMensagem
// ---------------------------------------------------------------------------
describe('buildTransicaoTurnoMensagem', () => {
  it('builds a turn transition message', () => {
    const msg = buildTransicaoTurnoMensagem('Turn 2 starts', { round: 2 });
    expect(msg.tipo).toBe('transicao_turno');
    expect(msg.origem).toBe('rodada');
    expect(msg.message).toBe('Turn 2 starts');
    expect(msg.payload).toEqual({ round: 2 });
  });
});

// ---------------------------------------------------------------------------
// buildEntreRodadasMensagem
// ---------------------------------------------------------------------------
describe('buildEntreRodadasMensagem', () => {
  it('builds a between-rounds message', () => {
    const msg = buildEntreRodadasMensagem({
      message: 'Between rounds',
      titulo: 'Round break',
      rodadaAnterior: 1,
      proximaRodada: 2
    });
    expect(msg.tipo).toBe('entre_rodadas');
    expect(msg.canal).toBe('sistema');
    expect(msg.origem).toBe('rodada');
    expect(msg.message).toBe('Between rounds');
    expect(msg.titulo).toBe('Round break');
    expect(msg.rodadaAnterior).toBe(1);
    expect(msg.proximaRodada).toBe(2);
  });

  it('uses default userId and username', () => {
    const msg = buildEntreRodadasMensagem({ message: 'x' });
    expect(msg.userId).toBe('mestre');
    expect(msg.username).toBe('Mestre');
  });
});

// ---------------------------------------------------------------------------
// buildCombateMensagem
// ---------------------------------------------------------------------------
describe('buildCombateMensagem', () => {
  it('builds a combat message with defaults', () => {
    const msg = buildCombateMensagem({ message: 'Combat started' });
    expect(msg.tipo).toBe('combate');
    expect(msg.canal).toBe('sistema');
    expect(msg.origem).toBe('combate');
    expect(msg.userId).toBe('sistema');
    expect(msg.username).toBe('Sistema');
    expect(msg.message).toBe('Combat started');
  });

  it('accepts custom origem', () => {
    const msg = buildCombateMensagem({ message: 'x', origem: 'turno' });
    expect(msg.origem).toBe('turno');
  });
});
