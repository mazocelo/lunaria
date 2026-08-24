import { z } from 'zod';

/**
 * Espelha o enum `Sistema` do Postgres/Prisma — vocabulario FECHADO: so muda
 * por migracao, e o proprio banco recusa qualquer outro valor. Por isso aqui
 * o parse estrito e seguro e util (pega drift de verdade), ao contrario de
 * `roteiro_status`/`mestre_tier`, que sao varchar livre e ficam como string.
 *
 * `daemon` E valido no banco e precisa estar na union: ele existia no enum do
 * Prisma mas fora daqui, entao a primeira entidade `daemon` derrubaria as sete
 * listagens que usam este schema. Nao ter telas proprias e problema de
 * renderizacao (fallback), nao de contrato.
 */
export const SISTEMAS = ['lunaria', 'tresdet', 'dnd5e', 'daemon'] as const;

export const sistemaSchema = z.enum(SISTEMAS);

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
