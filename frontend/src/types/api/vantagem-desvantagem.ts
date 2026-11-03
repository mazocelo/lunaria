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
 * Item de bonus extra-combate de vantagem/desvantagem (ex.: absorcao elemental):
 * `{ valor, atributo }`. Forma real persistida em `vantagens.bonus`/`desvantagens.bonus`.
 */
export const bonusItemSchema = z
  .object({
    valor: z.number(),
    atributo: z.string(),
  })
  .passthrough();

/**
 * Restricao normalizada (catalogJsonHelper.normalizarRestricao): objeto livre,
 * tipicamente `{ condicao, descricao }`. Backend devolve `{}` quando ausente.
 */
export const restricaoSchema = z
  .object({
    condicao: z.string().optional(),
    descricao: z.string().optional(),
  })
  .passthrough();

/**
 * Requisitos normalizados (catalogJsonHelper.normalizarRequisitos): listas
 * coeridas para array, niveis para int, `atributos_minimos` como mapa de int.
 * Inclui chaves livres de catalogo (`minimo`/`atributo`) via passthrough.
 */
export const requisitosSchema = z
  .object({
    minimo: z.number().optional(),
    atributo: z.string().optional(),
    classe: z.array(z.string()).optional(),
    raca: z.array(z.string()).optional(),
    habilidades: z.array(z.string()).optional(),
    nivel: z.number().int().optional(),
    nivel_minimo: z.number().int().optional(),
    atributos_minimos: z.record(z.string(), z.number().int()).optional(),
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
    // Backend serializa `bonus` em 2 formas: (a) objeto plano `{ ataque, dano, ... }`
    // (forma canonica bonusCombateSchema; cobre tambem o `{}` vazio, pois todos os
    // campos sao opcionais), (b) array de bonus extra-combate (`[{ valor, atributo }]`,
    // ex.: absorcao elemental). Aceitar a uniao p/ nao rejeitar fichas reais.
    bonus: z.union([bonusCombateSchema, z.array(bonusItemSchema)]).nullable().optional(),
    restricao: restricaoSchema.optional(),
    dano_base: z.string().nullable().optional(),
    efeito: efeitoCatalogoSchema.nullable().optional(),
    usar: z.number().int().nullable().optional(),
    usos: z.number().int().nullable().optional(),
    elemento: z.array(z.string()).default([]),
    nivel: z.number().int().default(1),
    requisitos: requisitosSchema.optional(),
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
