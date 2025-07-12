import express from 'express';
import habilidadeController from '../controllers/habilidade/habilidadeController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Habilidades
 *   description: Gerenciamento de habilidades para RPG
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Habilidade:
 *       type: object
 *       required:
 *         - nome
 *         - descricao
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unico da habilidade
 *         nome:
 *           type: string
 *           maxLength: 100
 *           description: Nome da habilidade
 *         descricao:
 *           type: string
 *           description: Descricao detalhada da habilidade
 *         custo:
 *           type: integer
 *           minimum: 0
 *           description: Custo em mana ou energia para usar a habilidade
 *         tipo:
 *           type: array
 *           items:
 *             type: string
 *             enum: [ativa, passiva, reacao, ritual]
 *           description: Tipos da habilidade
 *         bonus:
 *           type: object
 *           description: Bonus aplicado pela habilidade em formato JSON
 *         restricao:
 *           type: object
 *           description: Restricoes para usar a habilidade em formato JSON
 *         dano_base:
 *           type: string
 *           description: Dano base da habilidade ex 1d8, 2d6
 *         efeito:
 *           type: object
 *           description: Efeito especial da habilidade em formato JSON
 *         usar:
 *           type: integer
 *           description: Como usar a habilidade 1=acao, 2=reacao, 3=movimento
 *         elemento:
 *           type: array
 *           items:
 *             type: string
 *           description: Elementos da habilidade fogo, gelo, fisico
 *         nivel:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Nivel minimo para aprender a habilidade
 *         requisitos:
 *           type: object
 *           description: Requisitos para aprender a habilidade
 *         criada_em:
 *           type: string
 *           format: date-time
 *           description: Data de criacao
 *         atualizada_em:
 *           type: string
 *           format: date-time
 *           description: Data da ultima atualizacao
 */

/**
 * @swagger
 * /habilidades:
 *   post:
 *     summary: Criar uma nova habilidade
 *     tags: [Habilidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - descricao
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da habilidade
 *               descricao:
 *                 type: string
 *                 description: Descricao da habilidade
 *               custo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Custo em mana ou energia
 *               tipo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ativa, passiva, reacao, ritual]
 *                 description: Tipos da habilidade
 *               bonus:
 *                 type: object
 *                 description: Bonus aplicado pela habilidade
 *               restricao:
 *                 type: object
 *                 description: Restricoes para usar a habilidade
 *               dano_base:
 *                 type: string
 *                 description: Dano base da habilidade
 *               efeito:
 *                 type: object
 *                 description: Efeito especial da habilidade
 *               usar:
 *                 type: integer
 *                 description: Como usar a habilidade
 *               elemento:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Elementos da habilidade
 *               nivel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Nivel minimo para aprender
 *               requisitos:
 *                 type: object
 *                 description: Requisitos para aprender
 *     responses:
 *       201:
 *         description: Habilidade criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Habilidade'
 *       400:
 *         description: Dados invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', habilidadeController.criarHabilidade);

/**
 * @swagger
 * /habilidades:
 *   get:
 *     summary: Listar todas as habilidades
 *     tags: [Habilidades]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo ativa, passiva, reacao, ritual
 *       - in: query
 *         name: elemento
 *         schema:
 *           type: string
 *         description: Filtrar por elemento fogo, gelo, fisico
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: integer
 *         description: Filtrar por nivel
 *       - in: query
 *         name: usar
 *         schema:
 *           type: integer
 *         description: Filtrar por tipo de uso 1=acao, 2=reacao, 3=movimento
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Numero maximo de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Numero de resultados para pular
 *     responses:
 *       200:
 *         description: Lista de habilidades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habilidade'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 */
router.get('/', habilidadeController.listarHabilidades);

/**
 * @swagger
 * /habilidades/{id}:
 *   get:
 *     summary: Obter uma habilidade especifica
 *     tags: [Habilidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da habilidade
 *     responses:
 *       200:
 *         description: Habilidade encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Habilidade'
 *       404:
 *         description: Habilidade nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', habilidadeController.obterHabilidade);

/**
 * @swagger
 * /habilidades/{id}:
 *   put:
 *     summary: Atualizar uma habilidade
 *     tags: [Habilidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da habilidade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               custo:
 *                 type: integer
 *               tipo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ativa, passiva, reacao, ritual]
 *                 description: Tipos da habilidade
 *               bonus:
 *                 type: object
 *                 description: Bonus aplicado pela habilidade
 *               restricao:
 *                 type: object
 *                 description: Restricoes para usar a habilidade
 *               dano_base:
 *                 type: string
 *                 description: Dano base da habilidade
 *               efeito:
 *                 type: object
 *                 description: Efeito especial da habilidade
 *               usar:
 *                 type: integer
 *                 description: Como usar a habilidade
 *               elemento:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Elementos da habilidade
 *               nivel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Nivel minimo para aprender
 *               requisitos:
 *                 type: object
 *                 description: Requisitos para aprender
 *     responses:
 *       200:
 *         description: Habilidade atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Habilidade'
 *       404:
 *         description: Habilidade nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', habilidadeController.atualizarHabilidade);

/**
 * @swagger
 * /habilidades/{id}:
 *   delete:
 *     summary: Excluir uma habilidade
 *     tags: [Habilidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da habilidade
 *     responses:
 *       200:
 *         description: Habilidade excluida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Habilidade nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', habilidadeController.excluirHabilidade);

/**
 * @swagger
 * /habilidades/elemento/{elemento}:
 *   get:
 *     summary: Listar habilidades por elemento
 *     tags: [Habilidades]
 *     parameters:
 *       - in: path
 *         name: elemento
 *         required: true
 *         schema:
 *           type: string
 *         description: Elemento das habilidades
 *     responses:
 *       200:
 *         description: Lista de habilidades do elemento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habilidade'
 */
router.get('/elemento/:elemento', habilidadeController.listarPorElemento);

/**
 * @swagger
 * /habilidades/tipo/{tipo}:
 *   get:
 *     summary: Listar habilidades por tipo
 *     tags: [Habilidades]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo das habilidades
 *     responses:
 *       200:
 *         description: Lista de habilidades do tipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habilidade'
 */
router.get('/tipo/:tipo', habilidadeController.listarPorTipo);

/**
 * @swagger
 * /habilidades/nivel/{nivel}:
 *   get:
 *     summary: Listar habilidades por nivel
 *     tags: [Habilidades]
 *     parameters:
 *       - in: path
 *         name: nivel
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nivel das habilidades
 *     responses:
 *       200:
 *         description: Lista de habilidades do nivel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habilidade'
 */
router.get('/nivel/:nivel', habilidadeController.listarPorNivel);

/**
 * @swagger
 * /habilidades/buscar:
 *   get:
 *     summary: Buscar habilidades por termo
 *     tags: [Habilidades]
 *     parameters:
 *       - in: query
 *         name: termo
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habilidade'
 *       400:
 *         description: Termo de busca e obrigatorio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/buscar', habilidadeController.buscarHabilidades);

/**
 * @swagger
 * /habilidades/estatisticas:
 *   get:
 *     summary: Obter estatisticas das habilidades
 *     tags: [Habilidades]
 *     responses:
 *       200:
 *         description: Estatisticas das habilidades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de habilidades ativas
 *                     porNivel:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nivel:
 *                             type: integer
 *                           total:
 *                             type: integer
 *                     porUsar:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           usar:
 *                             type: integer
 *                           total:
 *                             type: integer
 */
router.get('/estatisticas', habilidadeController.obterEstatisticas);

export default router; 