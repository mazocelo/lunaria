import { z } from 'zod';
import { sistemaSchema } from './raca';

/**
 * Categoria/Raridade chegam como objeto relacionado quando o backend faz
 * include do Prisma (`categoria_rel`, `raridade_rel`). Ambos opcionais.
 */
export const monstroRaridadeRelSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    cor: z.string().nullable().optional(),
    ordem: z.number().int().optional(),
  })
  .passthrough();

export const monstroCategoriaRelSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    icone: z.string().nullable().optional(),
    ordem: z.number().int().optional(),
  })
  .passthrough();

/**
 * Velocidade e Resistencias: estrutura JSON do Prisma (`Json?`).
 * Default no backend: `{"terrestre": 30}` para velocidade, `{}` para
 * resistencias. Tipados como records abertos.
 */
export const monstroVelocidadeSchema = z.record(z.string(), z.number());
// Resistencias: mapa elemento -> multiplicador (ex.: `{ fogo: 0.5 }`). Valores
// sempre numericos no banco (confirmado em monstros.resistencias).
export const monstroResistenciasSchema = z.record(z.string(), z.number());

/**
 * Habilidade do monstro (estrutura solta — coluna `habilidades` e Json[]).
 */
export const monstroHabilidadeSchema = z
  .object({
    nome: z.string().optional(),
    descricao: z.string().optional(),
  })
  .passthrough();

/**
 * Atributo no relacionamento `atributos_monstro` (model Prisma).
 * O frontend hoje le `monstro.atributos` como mapa flat — o backend pode
 * devolver tanto o mapa flat (apos processamento) quanto a tabela raw.
 */
export const monstroAtributoRelSchema = z.object({
  id: z.number().int().optional(),
  monstro_id: z.number().int().optional(),
  nome: z.string(),
  valor: z.number().int(),
});

/**
 * Schema de Monstro (controllers/monstro/monstroController.js + Prisma).
 *
 * Stats por sistema (forca/destreza/STR/DEX/F/H/...) ficam dentro de
 * `atributos` como record aberto — o controller cria via
 * `db.prisma.atributos_monstro.createMany` e o frontend consome via
 * acesso por chave; usar discriminated union aqui forcaria split sem ganho.
 */
export const monstroSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    descricao: z.string().nullable().optional(),
    tipo: z.array(z.string()).default([]),
    nivel_min: z.number().int().default(1),
    nivel_max: z.number().int().default(10),
    hp_base: z.number().int().default(15),
    ataque_base: z.number().int().default(2),
    defesa_base: z.number().int().default(10),
    dano_base: z.string(),
    habilidades: z.array(monstroHabilidadeSchema).nullable().optional(),
    elemento: z.array(z.string()).default([]),
    temas: z.array(z.number().int()).default([]),
    xp_base: z.number().int().default(50),
    imagem: z.string().nullable().optional(),
    criado_em: z.string().nullable().optional(),
    atualizado_em: z.string().nullable().optional(),
    raridade_id: z.number().int().nullable().optional(),
    categoria_id: z.number().int().nullable().optional(),
    raridade_rel: monstroRaridadeRelSchema.nullable().optional(),
    categoria_rel: monstroCategoriaRelSchema.nullable().optional(),
    habitat: z.array(z.string()).default([]),
    imunidades: z.array(z.string()).default([]),
    resistencias: monstroResistenciasSchema.nullable().optional(),
    tamanho: z.string().nullable().optional(),
    escala: z.string().nullable().optional(),
    velocidade: monstroVelocidadeSchema.nullable().optional(),
    mult_raca: z.number().int().nullable().optional(),
    armadura_natural: z.number().int().nullable().optional(),
    sistema: sistemaSchema,
    atributos: z.record(z.string(), z.number()).optional(),
    atributos_monstro: z.array(monstroAtributoRelSchema).optional(),
  })
  .passthrough();

export const monstroListSchema = z.array(monstroSchema);

export type Monstro = z.infer<typeof monstroSchema>;
