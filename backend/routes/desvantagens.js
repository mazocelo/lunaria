import express from 'express';
import desvantagemController from '../controllers/desvantagens/desvantagensController.js';
import { requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Desvantagens
 *   description: Gerenciamento de desvantagens para RPG
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Desvantagem:
 *       type: object
 *       required:
 *         - nome
 *         - descricao
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unico da desvantagem
 *         nome:
 *           type: string
 *           maxLength: 100
 *           description: Nome da desvantagem
 *         descricao:
 *           type: string
 *           description: Descricao detalhada da desvantagem
 *         custo:
 *           type: integer
 *           minimum: 0
 *           description: Custo em mana ou energia para usar a desvantagem
 *         tipo:
 *           type: array
 *           items:
 *             type: string
 *             enum: [ativa, passiva, reacao, ritual]
 *           description: Tipos da desvantagem
 *         bonus:
 *           type: object
 *           description: Bonus aplicado pela desvantagem em formato JSON
 *         restricao:
 *           type: object
 *           description: Restricoes para usar a desvantagem em formato JSON
 *         dano_base:
 *           type: string
 *           description: Dano base da desvantagem ex 1d8, 2d6
 *         efeito:
 *           type: object
 *           description: Efeito especial da desvantagem em formato JSON
 *         usar:
 *           type: integer
 *           description: Como usar a desvantagem 1=acao, 2=reacao, 3=movimento
 *         elemento:
 *           type: array
 *           items:
 *             type: string
 *           description: Elementos da desvantagem fogo, gelo, fisico
 *         nivel:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Nivel minimo para aprender a desvantagem
 *         requisitos:
 *           type: object
 *           description: Requisitos para aprender a desvantagem
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
 * /desvantagens:
 *   post:
 *     summary: Criar uma nova desvantagem
 *     tags: [Desvantagens]
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
 *                 description: Nome da desvantagem
 *               descricao:
 *                 type: string
 *                 description: Descricao da desvantagem
 *               custo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Custo em mana ou energia
 *               tipo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ativa, passiva, reacao, ritual]
 *                 description: Tipos da desvantagem
 *               bonus:
 *                 type: object
 *                 description: Bonus aplicado pela desvantagem
 *               restricao:
 *                 type: object
 *                 description: Restricoes para usar a desvantagem
 *               dano_base:
 *                 type: string
 *                 description: Dano base da desvantagem
 *               efeito:
 *                 type: object
 *                 description: Efeito especial da desvantagem
 *               usar:
 *                 type: integer
 *                 description: Como usar a desvantagem
 *               elemento:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Elementos da desvantagem
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
 *         description: Desvantagem criada com sucesso
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
 *                   $ref: '#/components/schemas/Desvantagem'
 *       400:
 *         description: Dados invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireSuperAdmin, desvantagemController.criarDesvantagem);

/**
 * @swagger
 * /desvantagens:
 *   get:
 *     summary: Listar todas as desvantagens
 *     tags: [Desvantagens]
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
 *         description: Lista de desvantagens
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
 *                     $ref: '#/components/schemas/Desvantagem'
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
router.get('/', desvantagemController.listarDesvantagens);

/**
 * @swagger
 * /desvantagens/{id}:
 *   get:
 *     summary: Obter uma desvantagem especifica
 *     tags: [Desvantagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da desvantagem
 *     responses:
 *       200:
 *         description: Desvantagem encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Desvantagem'
 *       404:
 *         description: Desvantagem nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', desvantagemController.obterDesvantagem);



/**
 * @swagger
 * /desvantagens/elemento/{elemento}:
 *   get:
 *     summary: Listar desvantagens por elemento
 *     tags: [Desvantagens]
 *     parameters:
 *       - in: path
 *         name: elemento
 *         required: true
 *         schema:
 *           type: string
 *         description: Elemento das desvantagens
 *     responses:
 *       200:
 *         description: Lista de desvantagens do elemento
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
 *                     $ref: '#/components/schemas/Desvantagem'
 */
router.get('/elemento/:elemento', desvantagemController.listarPorElemento);

/**
 * @swagger
 * /desvantagens/tipo/{tipo}:
 *   get:
 *     summary: Listar desvantagens por tipo
 *     tags: [Desvantagens]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo das desvantagens
 *     responses:
 *       200:
 *         description: Lista de desvantagens do tipo
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
 *                     $ref: '#/components/schemas/Desvantagem'
 */
router.get('/tipo/:tipo', desvantagemController.listarPorTipo);

/**
 * @swagger
 * /desvantagens/nivel/{nivel}:
 *   get:
 *     summary: Listar desvantagens por nivel
 *     tags: [Desvantagens]
 *     parameters:
 *       - in: path
 *         name: nivel
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nivel das desvantagens
 *     responses:
 *       200:
 *         description: Lista de desvantagens do nivel
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
 *                     $ref: '#/components/schemas/Desvantagem'
 */
router.get('/nivel/:nivel', desvantagemController.listarPorNivel);

/**
 * @swagger
 * /desvantagens/buscar:
 *   get:
 *     summary: Buscar desvantagens por termo
 *     tags: [Desvantagens]
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
 *                     $ref: '#/components/schemas/Desvantagem'
 *       400:
 *         description: Termo de busca e obrigatorio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/buscar', desvantagemController.buscarDesvantagens);

/**
 * @swagger
 * /desvantagens/estatisticas:
 *   get:
 *     summary: Obter estatisticas das desvantagens
 *     tags: [Desvantagens]
 *     responses:
 *       200:
 *         description: Estatisticas das desvantagens
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
 *                       description: Total de desvantagens ativas
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
router.get('/estatisticas', desvantagemController.obterEstatisticas);
router.put('/:id', requireSuperAdmin, desvantagemController.atualizarDesvantagem);
router.delete('/:id', requireSuperAdmin, desvantagemController.deletarDesvantagem);

export default router; 