import { z } from 'zod';

/**
 * Schema de Personagem conforme retornado por
 * `controllers/personagem/personagemController.js` (listar/obter/atualizar +
 * processarDadosPersonagem). Modelo Prisma: `personagens`.
 *
 * Multi-sistema via DISCRIMINATED UNION em `sistema` — esse e o ponto critico:
 * os bugs recentes (escola composta, atributos zerados, payload D&D nao
 * montado) vieram de divergencia entre o que cada sistema persiste em
 * `stats_sistema` e o que o frontend tenta ler. Cada variant aqui modela
 * EXATAMENTE o objeto que o service correspondente grava
 * (`personagemLunariaService.js`, `personagemDnd5eService.js`,
 * `personagemTresDetService.js`).
 *
 * Atributos: o controller `processarDadosPersonagem` expoe DOIS caminhos
 * dependendo de quando o objeto e lido:
 *   - `atributos`: mapa flat { nome: valor } montado a partir de
 *     `atributos_personagem[]`. Sigla varia por sistema (forca/F/STR/...).
 *   - `atributos_personagem`: array bruto da tabela Prisma, presente quando
 *     o include esta vivo (criacao, level-up).
 * Ambos opcionais — Model do frontend prioriza `atributos` e cai para
 * escalares (forca/destreza/...) so na criacao Lunaria.
 */

export const atributoPersonagemSchema = z.object({
  id: z.number().int().optional(),
  personagem_id: z.number().int().optional(),
  nome: z.string(),
  valor: z.number().int(),
});

/**
 * Vinculo simplificado de historia em `personagem.historias[]`
 * (controller processarDadosPersonagem mapeia para `{ id, nome, papel }`).
 */
export const personagemHistoriaVinculoSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  papel: z.string().default('jogador'),
});

/**
 * Item de magia/habilidade conhecida — vem do `engine.getMagiasConhecidas`
 * (game-systems/*). Shape solto porque cada engine adapta. Manter aberto
 * evita falso positivo enquanto a Fase 2 nao normaliza isso.
 */
export const magiaConhecidaSchema = z
  .object({
    id: z.number().int().optional(),
    nome: z.string().optional(),
    tipo: z.string().optional(),
  })
  .passthrough();

/**
 * Vinculo de vantagem do personagem (controller serializa as colunas do
 * catalogo). Aceita campos extras via passthrough — equipamentos/magias
 * carregam shapes parecidos e fazem reuso.
 */
const personagemVantagemSchema = z
  .object({
    id: z.number().int(),
    nome: z.string(),
    descricao: z.string().optional(),
    custo: z.number().int().optional(),
    nivel: z.number().int().optional(),
  })
  .passthrough();

const personagemDesvantagemSchema = personagemVantagemSchema;
const personagemEquipamentoSchema = personagemVantagemSchema;

/**
 * Base comum entre as variantes por sistema. Tudo que o Prisma marca como
 * nullable vira `.nullable()`; campos que somem em alguns endpoints
 * (ex.: listagens vs obter individual) viram `.optional()`.
 */
const personagemBaseShape = {
  id: z.number().int(),
  nome: z.string(),
  nivel: z.number().int().nullable().optional(),
  pontos_totais: z.number().int().nullable().optional(),
  pontos_iniciais: z.number().int().nullable().optional(),
  pontos_atributo_pendentes: z.number().int().nullable().optional(),
  background: z.string().nullable().optional(),
  raca_id: z.number().int().nullable().optional(),
  classe_id: z.number().int().nullable().optional(),
  imagem: z.string().nullable().optional(),
  id_usuario: z.number().int().nullable().optional(),
  criado_em: z.string().nullable().optional(),
  atualizado_em: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
  xp_atual: z.number().int().nullable().optional(),
  xp_proximo_nivel: z.number().int().nullable().optional(),
  hp_atual: z.number().int().nullable().optional(),
  mp_atual: z.number().int().nullable().optional(),
  moedas: z.number().int().optional(),
  voice_id: z.string().nullable().optional(),
  voice_provider: z.string().nullable().optional(),

  // Relacoes resolvidas pelo controller
  racas: z.unknown().nullable().optional(),
  classes: z.unknown().nullable().optional(),
  raca: z.string().nullable().optional(),
  classe: z.string().nullable().optional(),
  historia_nome: z.string().nullable().optional(),
  historia_id: z.number().int().nullable().optional(),
  historias: z.array(personagemHistoriaVinculoSchema).optional(),
  vantagens: z.array(personagemVantagemSchema).optional(),
  desvantagens: z.array(personagemDesvantagemSchema).optional(),
  equipamentos: z.array(personagemEquipamentoSchema).optional(),
  magias: z.array(magiaConhecidaSchema).optional(),
  magiasPersonagem: z.array(magiaConhecidaSchema).optional(),
  habilidadesClasse: z.array(magiaConhecidaSchema).optional(),

  // Atributos: ambos caminhos coexistem (ver doc do header).
  atributos: z.record(z.string(), z.number()).optional(),
  atributos_personagem: z.array(atributoPersonagemSchema).optional(),
} as const;

/**
 * Sistema Lunaria: nao popula `stats_sistema` (fica `null`).
 * Atributos: forca/inteligencia/carisma/destreza/constituicao/agilidade.
 */
export const personagemLunariaSchema = z
  .object({
    ...personagemBaseShape,
    sistema: z.literal('lunaria'),
    // Lunaria nao usa stats_sistema, mas mantemos passthrough p/ aceitar
    // qualquer objeto que um backfill futuro venha a popular sem quebrar a ficha.
    stats_sistema: z.union([z.null(), z.record(z.string(), z.unknown())]).optional(),
  })
  .passthrough();

/**
 * Sistema D&D 5e: `stats_sistema` = { classeKey, metodo, skillProficiencies }
 * conforme `personagemDnd5eService.js` linha 119.
 *
 * `classeKey`: slug minusculo da classe (barbarian/fighter/wizard/...) ou
 * null quando a classe nao bate com `SRD_CLASSES`.
 * `metodo`: string|null — wizard manda 'point_buy' | 'standard_array' |
 * 'roll_4d6', mas o backend persiste qualquer string que vier; opcional
 * porque criacao simplificada nao passa metodo.
 * Atributos: STR/DEX/CON/INT/WIS/CHA.
 *
 * `stats_sistema: null` e estado valido — banner "ficha incompleta"
 * (View) e renderizado para fichas D&D antigas migradas sem o JSON.
 */
export const personagemDnd5eStatsSchema = z
  .object({
    classeKey: z.string().nullable().optional(),
    metodo: z.string().nullable().optional(),
    skillProficiencies: z.array(z.string()).default([]),
  })
  .passthrough();

export const personagemDnd5eSchema = z
  .object({
    ...personagemBaseShape,
    sistema: z.literal('dnd5e'),
    stats_sistema: personagemDnd5eStatsSchema.nullable().optional(),
  })
  .passthrough();

/**
 * Sistema 3D&T: `stats_sistema` = { temMagia, nivelPoder, focus } conforme
 * `personagemTresDetService.js` linha 139.
 *
 * `temMagia`: derivado das vantagens (algumas tem tipo 'magico').
 * `nivelPoder` (tier): string identificadora ('iniciante'/'lutador'/...).
 * `focus`: mapa de elementos -> nivel, com chaves variaveis.
 * Atributos: F/H/R/A/PdF.
 */
export const personagemTresdetStatsSchema = z
  .object({
    // Opcional p/ tolerar fichas antigas anteriores a adicao do campo (ou
    // gravadas via script SQL direto). Defaultar false e seguro porque a UI
    // ja gateia o calculo de mana 3D&T por `stats_sistema?.temMagia`.
    temMagia: z.boolean().optional(),
    nivelPoder: z.string().nullable().optional(),
    focus: z.record(z.string(), z.number()).optional(),
  })
  .passthrough();

export const personagemTresdetSchema = z
  .object({
    ...personagemBaseShape,
    sistema: z.literal('tresdet'),
    stats_sistema: personagemTresdetStatsSchema.nullable().optional(),
  })
  .passthrough();

export const personagemSchema = z.discriminatedUnion('sistema', [
  personagemLunariaSchema,
  personagemDnd5eSchema,
  personagemTresdetSchema,
]);

export const personagemListSchema = z.array(personagemSchema);

/**
 * Payload de atualizacao (PUT /personagens/:id), espelho de
 * `Personagem.toUpdatePayload()` no frontend. O controller deleta:
 *   - id, id_usuario, classe, raca, historia_nome, historia_id, atributos,
 *     pontos_*, classe_id, raca_id, hp*, nivel, xp_*, atributos_personagem
 *   - sugestao_background (nao existe no schema mas e tolerado no body)
 * Atributos NUNCA mudam por PUT — so na criacao e em distribuir-pontos
 * (vide log do controller linha 461-466).
 *
 * Schema deliberadamente conservador: aceita o que o Model envia hoje;
 * historias/vantagens/desvantagens/equipamentos sao tipados como arrays
 * mistos pois o front envia tanto IDs cruz quanto objetos — refinar quando
 * essas operacoes virarem TS na Fase 2/3.
 */
export const personagemUpdatePayloadSchema = z
  .object({
    nome: z.string().optional(),
    imagem: z.string().nullable().optional(),
    background: z.string().nullable().optional(),
    sugestao_background: z.string().optional(),
    historias: z.array(z.unknown()).optional(),
    vantagens: z.array(z.unknown()).optional(),
    desvantagens: z.array(z.unknown()).optional(),
    equipamentos: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type Personagem = z.infer<typeof personagemSchema>;
export type PersonagemLunaria = z.infer<typeof personagemLunariaSchema>;
export type PersonagemDnd5e = z.infer<typeof personagemDnd5eSchema>;
export type PersonagemTresdet = z.infer<typeof personagemTresdetSchema>;
export type PersonagemDnd5eStats = z.infer<typeof personagemDnd5eStatsSchema>;
export type PersonagemTresdetStats = z.infer<typeof personagemTresdetStatsSchema>;
export type AtributoPersonagem = z.infer<typeof atributoPersonagemSchema>;
export type PersonagemUpdatePayload = z.infer<typeof personagemUpdatePayloadSchema>;
