import { z } from 'zod';
import { apiEnvelopeSchema } from './zod-envelope';

/**
 * Valida em runtime que `raw` e o envelope canonico `{ data, meta? }` e retorna
 * o payload tipado. Fail-loud: se o backend devolver shape diferente do
 * esperado, lanca Error com o contexto e os caminhos do ZodError — facilita
 * achar a divergencia no console do navegador.
 *
 * Usar nos services para chamadas de endpoints que ja seguem `{ data, meta }`.
 * Para os controllers legados (`{ success, data, ... }` ou objeto nu), use
 * `parseRaw` aplicado ao payload extraido manualmente no service.
 *
 * Reusa `apiEnvelopeSchema` de `zod-envelope.ts` para garantir que envelope
 * e parser nunca divirjam — qualquer evolucao do envelope (paginacao,
 * warnings, etc.) entra por um ponto so.
 */
export function parseEnvelope<T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown,
  ctx: string,
): z.infer<T> {
  const result = apiEnvelopeSchema(schema).safeParse(raw);
  if (!result.success) {
    throw new Error(`[contract:${ctx}] resposta da API nao bate com o schema: ${result.error.message}`);
  }
  // O envelope ja validou `data` contra `schema`; cast aqui so estreita o
  // tipo do generic que o TS nao consegue inferir do retorno do safeParse.
  const parsed = result.data as { data: z.infer<T> };
  return parsed.data;
}

/**
 * Valida em runtime que `raw` casa com `schema` sem envelope. Usado em
 * endpoints que devolvem o objeto cru (sem `{ data }` ao redor) — ex.: alguns
 * controllers de habilidades/magias hoje.
 */
export function parseRaw<T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown,
  ctx: string,
): z.infer<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`[contract:${ctx}] resposta da API nao bate com o schema: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Envelope LEGADO dos controllers de catalogo: `{ success, data, message?,
 * pagination? }`. A maioria dos controllers reais ainda devolve este shape (e
 * nao o canonico `{ data, meta }`). `pagination` so aparece em endpoints de
 * listagem paginada — por isso e opcional.
 */
export interface LegacyEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total?: number;
    offset?: number;
    limit?: number;
  } | null;
}

/**
 * Guard fail-loud do envelope legado: garante que `raw` e um objeto com a chave
 * `success` antes do service extrair `data` e validar com `parseRaw`. Lanca
 * `[contract:ctx]` quando o backend foge do shape esperado.
 */
export function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}
