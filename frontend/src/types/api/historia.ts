import { z } from 'zod';
import { sistemaSchema } from './raca';

/**
 * Status de geracao do roteiro, conforme o backend realmente grava:
 * `queued` e `generating` (jobs/enqueueRoteiroJob.js, jobs/processRoteiroJob.js),
 * `completed` (services/roteiroGenerationService.js, historiaController.js) e
 * `error`. Nao existe `ready` — o enum anterior listava esse valor e recusava
 * `completed`, derrubando toda listagem que trouxesse uma historia pronta.
 *
 * Fica como string livre: a coluna e varchar(50) escrita pelo codigo da app,
 * vocabulario ABERTO (ao contrario de `sistema`, enum do Postgres, que o banco
 * fecha e por isso pode ser validado estrito aqui). Status novo no backend
 * deve degradar a exibicao, nunca derrubar o parse da listagem inteira.
 */
export const ROTEIRO_STATUS_CONHECIDOS = [
  'queued',
  'generating',
  'completed',
  'error',
] as const;

/** Status em que o roteiro ainda esta sendo produzido — mantem o polling ativo. */
export const ROTEIRO_STATUS_EM_PROGRESSO: readonly string[] = ['queued', 'generating'];

export const roteiroStatusSchema = z.string().nullable().optional();

/**
 * Tier do Mestre (VALID_MESTRE_TIERS em agents/Mestre/config.js).
 * String livre pelo mesmo criterio de `roteiroStatusSchema`: coluna varchar(20)
 * de vocabulario aberto, definido em config e nao no schema do banco.
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
