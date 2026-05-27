import { z } from 'zod';

/**
 * Enum de sistemas suportados (espelha o enum `Sistema` do Prisma).
 * `daemon` existe no schema mas nao esta implementado — fora da union.
 */
export const sistemaSchema = z.enum(['lunaria', 'tresdet', 'dnd5e']);

/**
 * Bonus do catalogo (Raca/Classe). Chave varia por sistema
 * (forca/FOR/F/H/PdF/STR/DEX...). Valores sao normalmente numericos, MAS o
 * backend tambem injeta arrays especiais (ex.: `vantagens: [{id, nome}]`)
 * via `decorarBonusEntidade` (catalogJsonHelper), entao o valor real e
 * `unknown` — narrow no consumer quando precisar.
 */
export const bonusAtributosSchema = z.record(z.string(), z.unknown());

/**
 * Schema de Raca conforme retornado por `GET /racas` e `GET /racas/:id`
 * (controllers/raca/racaController.js, serializarClasseOuRaca).
 *
 * O backend devolve `bonus` (objeto normalizado) E `atributos_bonus`
 * (extracao dos atributos basicos do Lunaria); o Model do frontend trata
 * ambos como aceitos.
 */
export const racaSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    custo: z.number().int().default(0),
    descricao: z.string().nullable().optional(),
    bonus: bonusAtributosSchema.nullable().optional(),
    atributos_bonus: bonusAtributosSchema.optional(),
    imagem: z.string().nullable().optional(),
    sistema: sistemaSchema,
    mult_raca: z.number().int().nullable().optional(),
    pode_magia: z.boolean().optional(),
  })
  .passthrough();

export const racaListSchema = z.array(racaSchema);

export type Raca = z.infer<typeof racaSchema>;
export type BonusAtributos = z.infer<typeof bonusAtributosSchema>;
export type Sistema = z.infer<typeof sistemaSchema>;
