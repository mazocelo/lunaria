import { z } from 'zod';
import { sistemaSchema } from './raca';

/**
 * Status de geracao do roteiro. Valores observados em
 * services/roteiroGenerationService.js + controller (queued, generating,
 * ready, error).
 */
export const roteiroStatusSchema = z
  .enum(['queued', 'generating', 'ready', 'error'])
  .nullable()
  .optional();

/**
 * Tier do Mestre (VALID_MESTRE_TIERS em agents/Mestre/config.js).
 * Mantido como string para nao quebrar quando o backend introduzir novo tier.
 */
export const mestreTierSchema = z.string().nullable().optional();

/**
 * Schema de Historia conforme retornado por `GET /historias/:id`
 * (controllers/historia/historiaController.js, obterHistoria devolve `data`
 * direto do Prisma).
 *
 * Campos do snake_case do backend sao tipados aqui; a normalizacao para
 * camelCase (`created_at`, `updated_at`) e responsabilidade do Model.
 *
 * Listagens (`/historias`) acrescentam `sessaoAtiva`, `statusSessao`,
 * `usuarioNaSessao`, `totalJogadores` (criadas no controller) — incluidos
 * abaixo como opcionais para nao falhar quando o endpoint difere.
 */
export const historiaSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    temas: z.array(z.number().int()).default([]),
    maximo_de_participantes: z.number().int().nullable().optional(),
    descricao: z.string().nullable().optional(),
    prologo: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    criada_em: z.string().nullable().optional(),
    atualizada_em: z.string().nullable().optional(),
    id_usuario: z.number().int().nullable().optional(),
    deleted_at: z.string().nullable().optional(),
    mestre_id: z.number().int().nullable().optional(),
    imagem: z.string().nullable().optional(),
    mapas: z.unknown().nullable().optional(),
    publica: z.boolean().optional(),
    roteiro: z.unknown().nullable().optional(),
    roteiro_status: roteiroStatusSchema,
    estilo_imagem: z.string().nullable().optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
    mestre_tier: mestreTierSchema,
    sistema: sistemaSchema,
    sessaoAtiva: z.boolean().optional(),
    statusSessao: z.string().nullable().optional(),
    usuarioNaSessao: z.boolean().optional(),
    totalJogadores: z.number().int().optional(),
  })
  .passthrough();

export const historiaListSchema = z.array(historiaSchema);

export type Historia = z.infer<typeof historiaSchema>;
