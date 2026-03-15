/**
 * Schemas Zod para validação de campos JSON do banco de dados.
 * Usados nos controllers antes de persistir dados.
 */
import { z } from 'zod';
import { TIPO_HABILIDADE_MONSTRO } from '../config/domainConstants.js';

// ===== EQUIPAMENTO =====

export const BonusEquipSchema = z.object({
  ataque: z.number().int().optional(),
  dano: z.number().int().optional(),
  armadura: z.number().int().optional(),
  esquiva_bonus: z.number().int().min(0).optional(),
  esquiva_penalidade: z.number().int().min(0).optional(),
  ca: z.number().int().optional(),
  ca_base: z.number().int().optional(),
}).passthrough().optional();

export const RequisitosEquipSchema = z.object({
  classe: z.array(z.string()).optional(),
  raca: z.array(z.string()).optional(),
}).passthrough().optional();

export const VinculoSchema = z.record(z.unknown()).optional();

// ===== MONSTRO =====

const EfeitoHabilidadeSchema = z.object({
  tipo: z.string(),
  duracao: z.number().int().optional(),
  dano_por_turno: z.string().nullable().optional(),
}).nullable().optional();

export const HabilidadeMonstroSchema = z.array(z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  tipo: z.enum(TIPO_HABILIDADE_MONSTRO).optional(),
  dano: z.string().nullable().optional(),
  efeito: EfeitoHabilidadeSchema,
  cooldown: z.number().int().min(0).default(0),
  chance: z.number().int().min(0).max(100).default(30),
}).passthrough()).default([]);

export const ResistenciasSchema = z.record(z.number().min(0)).default({});

export const VelocidadeSchema = z.object({
  terrestre: z.number().int().min(0).optional(),
  aquatica: z.number().int().min(0).optional(),
  voo: z.number().int().min(0).optional(),
}).passthrough().default({ terrestre: 30 });

// ===== VANTAGEM / DESVANTAGEM (flexível) =====

export const BonusFlexivelSchema = z.object({
  ataque: z.number().int().optional(),
  dano: z.number().int().optional(),
  armadura: z.number().int().optional(),
  esquiva_bonus: z.number().int().optional(),
  esquiva_penalidade: z.number().int().optional(),
  forca: z.number().int().optional(),
  inteligencia: z.number().int().optional(),
  carisma: z.number().int().optional(),
  destreza: z.number().int().optional(),
  constituicao: z.number().int().optional(),
  agilidade: z.number().int().optional(),
  testes: z.record(z.number()).optional(),
  atributos: z.record(z.number()).optional(),
}).catchall(z.unknown()).default({});

export const RestricaoSchema = z.object({
  terreno: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  recurso: z.array(z.string()).optional(),
  equipamento: z.array(z.string()).optional(),
  contexto: z.array(z.string()).optional(),
}).catchall(z.unknown()).default({});

export const EfeitoFlexivelSchema = z.object({
  nome: z.string().optional(),
  status: z.string().optional(),
  tipo: z.string().optional(),
  duracao: z.number().int().min(0).optional(),
  valor: z.number().optional(),
  dano_por_turno: z.union([z.string(), z.number()]).optional(),
  cura_por_turno: z.union([z.string(), z.number()]).optional(),
}).catchall(z.unknown()).default({});

export const RequisitosFlexivelSchema = z.object({
  classe: z.array(z.string()).optional(),
  raca: z.array(z.string()).optional(),
  nivel: z.number().int().min(1).optional(),
  nivel_minimo: z.number().int().min(1).optional(),
  habilidades: z.array(z.string()).optional(),
  atributos_minimos: z.record(z.number().int()).optional(),
}).catchall(z.unknown()).default({});

// ===== PREFERÊNCIAS DO USUÁRIO =====

export const PreferenciasSchema = z.object({
  tema: z.enum(['light', 'dark']).default('dark'),
  notificacoes: z.object({
    convites: z.boolean().default(true),
    amizades: z.boolean().default(true),
    sessoes: z.boolean().default(true),
  }).default({}),
}).default({});

export const PrivacidadeSchema = z.object({
  perfil_publico: z.boolean().default(true),
  mostrar_estatisticas: z.boolean().default(true),
}).default({});

/**
 * Valida dados JSON com um schema Zod. Retorna dados parseados ou null em caso de erro.
 * @param {z.ZodSchema} schema
 * @param {unknown} data
 * @returns {{ success: true, data: any } | { success: false, error: string }}
 */
export function validateJson(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  return { success: false, error: errors };
}
