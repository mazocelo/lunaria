import { z } from 'zod';
import { sistemaSchema } from './raca';
import { efeitoCatalogoSchema } from './vantagem-desvantagem';

/**
 * Categoria e escola de magia: valores conhecidos em prisma/schema.prisma
 * (enum_categoria_habilidade, enum_escola_magia). Tipados como string aberta
 * porque o backend hoje aceita string livre na coluna `escola_magia`
 * (`VarChar(30)`) e ja foi observado "escola composta" tipo "Evocacao (Fogo)"
 * — fail-loud aqui mascararia dados em prod.
 */
export const categoriaHabilidadeSchema = z.string();
export const escolaMagiaSchema = z.string();

/**
 * Pre-requisitos normalizados (catalogJsonHelper.normalizarRequisitos).
 * Backend sempre devolve objeto (`{}` quando vazio).
 */
export const preRequisitosSchema = z
  .object({
    classe: z.array(z.string()).optional(),
    raca: z.array(z.string()).optional(),
    habilidades: z.array(z.string()).optional(),
    nivel: z.number().int().optional(),
    nivel_minimo: z.number().int().optional(),
    atributos_minimos: z.record(z.string(), z.number().int()).optional(),
  })
  .passthrough();

/**
 * Schema de Habilidade/Magia conforme retornado pelo backend
 * (controllers/habilidades-magias, serializarHabilidade no
 * catalogJsonHelper). Modelo Prisma: `habilidades_magias`.
 *
 * BUG-envelope conhecido: o controller tem envelopes INCONSISTENTES:
 *   - `obterHabilidade`  -> { success: true, data: {...} }
 *   - `criarHabilidade`  -> {...} (objeto nu, sem envelope)
 *   - `atualizarHabilidade` -> {...} (idem)
 *   - `listarHabilidades` -> { data, total, limit, offset, hasMore } (sem `success`)
 *   - `obterEstatisticas` / `obterDisponiveis` -> objetos nus
 * Este schema modela apenas a entidade nua; o envelope deve ser aplicado
 * separadamente no service (Fase 2) conforme o endpoint.
 */
export const habilidadeSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    descricao: z.string(),
    custo_mana: z.number().int().default(0),
    dano_base: z.string().nullable().optional(),
    tipo: z.string(),
    elemento: z.string().nullable().optional(),
    elementos: z.array(z.string()).optional(),
    nivel_requerido: z.number().int().default(1),
    cooldown_turnos: z.number().int().default(0),
    classe_id: z.number().int().nullable().optional(),
    raca_id: z.number().int().nullable().optional(),
    efeito: efeitoCatalogoSchema.nullable().optional(),
    alvo: z.string(),
    alcance: z.string(),
    area_efeito: z.record(z.string(), z.unknown()).nullable().optional(),
    tempo_conjuracao: z.string(),
    usa_concentracao: z.boolean().default(false),
    categoria: categoriaHabilidadeSchema,
    escola_magia: escolaMagiaSchema.nullable().optional(),
    escalamento: z.record(z.string(), z.unknown()).nullable().optional(),
    pre_requisito: preRequisitosSchema.nullable().optional(),
    pre_requisitos: preRequisitosSchema.nullable().optional(),
    usos_por_descanso: z.number().int().nullable().optional(),
    componente_material: z.record(z.string(), z.unknown()).nullable().optional(),
    saving_throw: z.string().nullable().optional(),
    imagem: z.string().nullable().optional(),
    sistema: sistemaSchema,
  })
  .passthrough();

export const habilidadeListSchema = z.array(habilidadeSchema);

export type Habilidade = z.infer<typeof habilidadeSchema>;
export type PreRequisitos = z.infer<typeof preRequisitosSchema>;
