import { z } from 'zod';

/**
 * Schema de Sessao conforme retornado por `controllers/sessao/sessaoController.js`.
 *
 * IMPORTANTE: o estado vivo da sessao mora no Redis (`redis/sessoes.js` —
 * `gerenciadorSessoes`) e nao no Prisma. A tabela `sessoes_jogo` so guarda
 * snapshot periodico (`services/sessaoSnapshot.js`). Os endpoints
 * `iniciarSessao` / `obterSessao` / `adicionarMensagem` / `atualizarEstadoJogo`
 * devolvem o objeto Redis — este schema reflete o formato observado em
 * `iniciarSessao` (controller linha ~50-70).
 *
 * Campos abertos com `.passthrough()` porque a estrutura do `estadoJogo` e das
 * mensagens evolui rapido (mestre adiciona npcs/clima sob demanda) — fail-loud
 * em todo campo extra seria ruido. Os campos LISTADOS aqui sao os que o
 * controller le/escreve diretamente.
 */

/**
 * Mensagem de sessao conforme `websocket/utils/sessionMessages.js#createSessionMessage`.
 * O `tipo` e aberto porque os helpers gravam ~15 tipos distintos (`roleplay`,
 * `combate`, `resultado_dado_inicial`, `solicitacao_dados`, `transicao_turno`,
 * `acao_mestre`, `entre_rodadas`, etc.) — restringir a um enum quebraria toda
 * sessao com combate ativo. `mensagem` e alias legado de `message` que o helper
 * grava em paralelo; ambos opcionais para sobreviver a evolucao do shape.
 */
export const sessaoMensagemSchema = z
  .object({
    id: z.string().optional(),
    tipo: z.string(),
    canal: z.string().optional(),
    origem: z.string().optional(),
    userId: z.union([z.string(), z.number()]).nullable().optional(),
    username: z.string().optional(),
    message: z.string().optional(),
    mensagem: z.string().optional(),
    payload: z.unknown().nullable().optional(),
    timestamp: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

export const sessaoEstadoJogoSchema = z
  .object({
    cena: z.string().optional(),
    npcs: z.array(z.unknown()).optional(),
    inventario: z.array(z.unknown()).optional(),
    clima: z.string().optional(),
    tempo: z.string().optional(),
  })
  .passthrough();

export const sessaoSchema = z
  .object({
    salaId: z.string().optional(),
    historiaId: z.union([z.string(), z.number()]).optional(),
    historiaNome: z.string().optional(),
    tema: z.unknown().optional(),
    mestre: z.string().optional(),
    jogadores: z.array(z.string()).default([]),
    maxJogadores: z.number().int().nullable().optional(),
    estadoJogo: sessaoEstadoJogoSchema.optional(),
    mensagens: z.array(sessaoMensagemSchema).default([]),
    criadaEm: z.string().nullable().optional(),
    atualizadaEm: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * Resposta do endpoint POST `/sessoes/historia/:historiaId` — controller
 * envelopa em `{ salaId, sessao }` antes de devolver dentro do `data`.
 */
export const sessaoIniciadaSchema = z.object({
  salaId: z.string(),
  sessao: sessaoSchema,
});

/**
 * Snapshot persistido (tabela `sessoes_jogo` no Prisma). Modelado separado
 * porque, embora o endpoint `obterSessao` normalmente devolva o objeto Redis,
 * o snapshot e exposto em alguns endpoints administrativos.
 */
export const sessaoJogoSnapshotSchema = z
  .object({
    id: z.number().int(),
    historia_id: z.number().int(),
    sala_id: z.string(),
    estado: z.record(z.string(), z.unknown()).optional(),
    mensagens: z.array(z.unknown()),
    resumos: z.array(z.unknown()).nullable().optional(),
    jogadores: z.unknown(),
    status: z.string().default('ativa'),
    rodada_atual: z.number().int().default(0),
    fase: z.string().nullable().optional(),
    iniciada_em: z.string().nullable().optional(),
    finalizada_em: z.string().nullable().optional(),
    ultimo_snapshot: z.string().optional(),
    criada_em: z.string().optional(),
    atualizada_em: z.string().optional(),
  })
  .passthrough();

export type Sessao = z.infer<typeof sessaoSchema>;
export type SessaoMensagem = z.infer<typeof sessaoMensagemSchema>;
export type SessaoEstadoJogo = z.infer<typeof sessaoEstadoJogoSchema>;
export type SessaoIniciada = z.infer<typeof sessaoIniciadaSchema>;
export type SessaoJogoSnapshot = z.infer<typeof sessaoJogoSnapshotSchema>;
