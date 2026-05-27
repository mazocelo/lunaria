import { z } from 'zod';
import { habilidadeSchema } from './habilidade';

/**
 * Sistema Lunaria e D&D 5e modelam magia como caso particular de
 * habilidade (tabela `habilidades_magias`, distinguindo por
 * `escola_magia != 'nenhuma'`). Reusa `habilidadeSchema` direto.
 */
export const magiaLunariaSchema = habilidadeSchema;
export const magiaDnd5eSchema = habilidadeSchema;

/**
 * 3D&T usa tabela propria `magias_tresdet`
 * (controllers/magiasTresdet/magiasTresDetController.js + prisma/schema.prisma).
 * Shape totalmente diferente do `habilidades_magias`: `custo_pm` e string
 * ("2 PM"), `escola` e string livre (`VarChar(50)` no schema), e nao tem
 * sistema (a propria tabela e exclusiva do 3D&T).
 */
export const magiaTresdetSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    descricao: z.string(),
    escola: z.string(),
    custo_pm: z.string(),
    alcance: z.string(),
    duracao: z.string(),
    tipo: z.string().default('dano'),
    exigencias: z.string().nullable().optional(),
    // Backend serializa em formas variadas (objeto/string/null). Aceitar unknown.
    focus_requisito: z.unknown().nullable().optional(),
    efeito: z.unknown().nullable().optional(),
    nivel_minimo: z.number().int().default(1),
  })
  .passthrough();

export const magiaTresdetListSchema = z.array(magiaTresdetSchema);

export type MagiaLunaria = z.infer<typeof magiaLunariaSchema>;
export type MagiaDnd5e = z.infer<typeof magiaDnd5eSchema>;
export type MagiaTresdet = z.infer<typeof magiaTresdetSchema>;
