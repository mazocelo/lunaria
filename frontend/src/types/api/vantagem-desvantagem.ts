import { z } from 'zod';
import { sistemaSchema } from './raca';

/**
 * Bonus de combate normalizado (catalogJsonHelper.normalizarBonusCombate).
 * Campos podem ser inteiros parseados a partir de string `+N`/`N`.
 */
export const bonusCombateSchema = z
  .object({
    ataque: z.number().int().optional(),
    dano: z.number().int().optional(),
    armadura: z.number().int().optional(),
    esquiva_bonus: z.number().int().optional(),
    esquiva_penalidade: z.number().int().optional(),
  })
  .passthrough();

/**
 * Efeito normalizado (catalogJsonHelper.normalizarEfeitoCatalogo).
 * Campos opcionais — backend pode devolver `{}` vazio.
 */
export const efeitoCatalogoSchema = z
  .object({
    nome: z.string().optional(),
    status: z.string().optional(),
    duracao: z.number().int().optional(),
    tipo: z.string().nullable().optional(),
    valor: z.number().optional(),
    dano_por_turno: z.string().nullable().optional(),
    cura_por_turno: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * Schema unificado de Vantagem e Desvantagem.
 *
 * As tabelas `vantagens` e `desvantagens` no Prisma sao gemeas (mesmas colunas
 * de catalogo: nome/descricao/custo/tipo/bonus/...). O frontend usa um unico
 * `VantagemDesvantagem` Model para ambas, distinguindo pelo `custo` (positivo
 * = vantagem, negativo = desvantagem) ou pelo endpoint chamado.
 *
 * O backend serializa via `serializarVantagemOuDesvantagem` (catalogJsonHelper):
 * sempre devolve `bonus`/`restricao`/`efeito` como objetos (nunca undefined),
 * `elemento` como array e `usar`/`usos` como int|null.
 */
export const vantagemDesvantagemSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    descricao: z.string(),
    custo: z.number().int().default(0),
    tipo: z.array(z.string()).default([]),
    // Backend serializa `bonus` em 3 formas: (a) objeto plano `{ ataque, dano, ... }`
    // (forma canonica bonusCombateSchema), (b) array de bonus extra-combat
    // (`[{ valor, atributo }]`, ex.: absorcao elemental), (c) `{}` vazio.
    // Aceitar a uniao p/ nao rejeitar fichas reais.
    bonus: z.union([bonusCombateSchema, z.array(z.unknown()), z.record(z.string(), z.unknown())]).nullable().optional(),
    restricao: z.record(z.string(), z.unknown()).optional(),
    dano_base: z.string().nullable().optional(),
    efeito: efeitoCatalogoSchema.nullable().optional(),
    usar: z.number().int().nullable().optional(),
    usos: z.number().int().nullable().optional(),
    elemento: z.array(z.string()).default([]),
    nivel: z.number().int().default(1),
    requisitos: z.record(z.string(), z.unknown()).optional(),
    criada_em: z.string().nullable().optional(),
    atualizada_em: z.string().nullable().optional(),
    imagem: z.string().nullable().optional(),
    sistema: sistemaSchema,
    subtipo: z.string().nullable().optional(),
  })
  .passthrough();

export const vantagemDesvantagemListSchema = z.array(vantagemDesvantagemSchema);

export type VantagemDesvantagem = z.infer<typeof vantagemDesvantagemSchema>;
export type BonusCombate = z.infer<typeof bonusCombateSchema>;
export type EfeitoCatalogo = z.infer<typeof efeitoCatalogoSchema>;
