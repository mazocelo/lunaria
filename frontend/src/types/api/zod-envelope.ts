import { z } from 'zod';

/**
 * Envelope canonico `{ data, meta? }` que aceita qualquer schema como payload.
 * Pareia com o tipo `ApiEnvelope<T>` de `./envelope.ts` mas em runtime — usado
 * nos services para validar a resposta da API antes do consumo pelo Model.
 *
 * NOTA: a maioria dos controllers do backend hoje retorna
 * `{ success, data, message?, pagination? }` e nao `{ data, meta }`. Os schemas
 * de cada dominio expoem o shape NU da entidade; este envelope sera adotado
 * nas Fases 2-3, quando os controllers forem normalizados.
 */
export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    meta: z.record(z.string(), z.unknown()).optional(),
  });

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiEnvelopeOf<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof apiEnvelopeSchema<T>>>;
export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;
