import { z } from 'zod';
import { bonusAtributosSchema, sistemaSchema } from './raca';

/**
 * Schema de Classe conforme retornado por `GET /classes` e `GET /classes/:id`
 * (controllers/classe/classeController.js, serializarClasseOuRaca).
 *
 * BUG-4 (anotacao): nomes de classe D&D 5e estao em ingles no banco
 * (barbarian, fighter, wizard, ...). Por isso `nome` e `z.string()` puro,
 * sem assumir PT-BR. Especificidades de spellcasting/hit_die/saving_throws
 * sao expostas pelo `stats_sistema` do personagem, NAO pela classe — o
 * shape da tabela `classes` no Prisma e plano e compartilhado entre sistemas.
 */
export const classeSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    custo: z.number().int().default(0),
    descricao: z.string().nullable().optional(),
    bonus: bonusAtributosSchema.nullable().optional(),
    atributos_bonus: bonusAtributosSchema.optional(),
    imagem: z.string().nullable().optional(),
    sistema: sistemaSchema,
  })
  .passthrough();

export const classeListSchema = z.array(classeSchema);

export type Classe = z.infer<typeof classeSchema>;
