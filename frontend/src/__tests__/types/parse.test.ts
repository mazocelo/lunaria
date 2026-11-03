/**
 * Testes dos helpers parseEnvelope/parseRaw — validam que erros sao
 * fail-loud com contexto e que sucesso retorna o tipo correto.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseEnvelope, parseRaw } from '../../types/api/parse';

const userSchema = z.object({ id: z.number().int(), nome: z.string() });

describe('parseEnvelope', () => {
  it('retorna o payload tipado de dentro de { data }', () => {
    const raw = { data: { id: 1, nome: 'Aria' } };
    const user = parseEnvelope(userSchema, raw, 'test:user');
    expect(user.id).toBe(1);
    expect(user.nome).toBe('Aria');
  });

  it('aceita envelope com meta', () => {
    const raw = { data: { id: 2, nome: 'B' }, meta: { total: 10 } };
    const user = parseEnvelope(userSchema, raw, 'test:user');
    expect(user.id).toBe(2);
  });

  it('lanca erro com contexto quando o envelope nao existe', () => {
    expect(() => parseEnvelope(userSchema, { id: 1, nome: 'x' }, 'test:user')).toThrow(
      /\[contract:test:user\]/,
    );
  });

  it('lanca erro quando o data nao bate com o schema', () => {
    expect(() => parseEnvelope(userSchema, { data: { id: 'nao-numero' } }, 'ctx')).toThrow(
      /\[contract:ctx\]/,
    );
  });
});

describe('parseRaw', () => {
  it('valida sem envelope', () => {
    const user = parseRaw(userSchema, { id: 5, nome: 'C' }, 'test:raw');
    expect(user.nome).toBe('C');
  });

  it('lanca erro com contexto em shape invalido', () => {
    expect(() => parseRaw(userSchema, { id: 5 }, 'ctx-raw')).toThrow(/\[contract:ctx-raw\]/);
  });
});
