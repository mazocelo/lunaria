import express from 'express';
import vantagemController from '../controllers/vantagens/vantagensController.js';
import { requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vantagens
 *   description: Gerenciamento de vantagens para RPG
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Vantagem:
 *       type: object
 *       required:
 *         - nome
 *         - descricao
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unico da vantagem
 *         nome:
 *           type: string
 *           maxLength: 100
 *           description: Nome da vantagem
 *         descricao:
 *           type: string
 *           description: Descricao detalhada da vantagem
 *         custo:
 *           type: integer
 *           minimum: 0
 *           description: Custo em mana ou energia para usar a vantagem
 *         tipo:
 *           type: array
 *           items:
 *             type: string
 *             enum: [ativa, passiva, reacao, ritual]
 *           description: Tipos da vantagem
 *         bonus:
 *           type: object
 *           description: Bonus aplicado pela vantagem em formato JSON
 *         restricao:
 *           type: object
 *           description: Restricoes para usar a vantagem em formato JSON
 *         dano_base:
 *           type: string
 *           description: Dano base da vantagem ex 1d8, 2d6
 *         efeito:
 *           type: object
 *           description: Efeito especial da vantagem em formato JSON
 *         usar:
 *           type: integer
 *           description: Como usar a vantagem 1=acao, 2=reacao, 3=movimento
 *         elemento:
 *           type: array
 *           items:
 *             type: string
 *           description: Elementos da vantagem fogo, gelo, fisico
 *         nivel:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Nivel minimo para aprender a vantagem
 *         requisitos:
 *           type: object
 *           description: Requisitos para aprender a vantagem
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
 * /vantagens:
 *   post:
 *     summary: Criar uma nova vantagem
 *     tags: [Vantagens]
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
 *                 description: Nome da vantagem
 *               descricao:
 *                 type: string
 *                 description: Descricao da vantagem
 *               custo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Custo em mana ou energia
 *               tipo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ativa, passiva, reacao, ritual]
 *                 description: Tipos da vantagem
 *               bonus:
 *                 type: object
 *                 description: Bonus aplicado pela vantagem
 *               restricao:
 *                 type: object
 *                 description: Restricoes para usar a vantagem
 *               dano_base:
 *                 type: string
 *                 description: Dano base da vantagem
 *               efeito:
 *                 type: object
 *                 description: Efeito especial da vantagem
 *               usar:
 *                 type: integer
 *                 description: Como usar a vantagem
 *               elemento:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Elementos da vantagem
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
 *         description: Vantagem criada com sucesso
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
 *                   $ref: '#/components/schemas/Vantagem'
 *       400:
 *         description: Dados invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireSuperAdmin, vantagemController.criarVantagem);

/**
 * @swagger
 * /vantagens:
 *   get:
 *     summary: Listar todas as vantagens
 *     tags: [Vantagens]
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
 *         description: Lista de vantagens
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
 *                     $ref: '#/components/schemas/Vantagem'
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
router.get('/', vantagemController.listarVantagens);

/**
 * @swagger
 * /vantagens/{id}:
 *   get:
 *     summary: Obter uma vantagem especifica
 *     tags: [Vantagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da vantagem
 *     responses:
 *       200:
 *         description: Vantagem encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vantagem'
 *       404:
 *         description: Vantagem nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', vantagemController.obterVantagem);



/**
 * @swagger
 * /vantagens/elemento/{elemento}:
 *   get:
 *     summary: Listar vantagens por elemento
 *     tags: [Vantagens]
 *     parameters:
 *       - in: path
 *         name: elemento
 *         required: true
 *         schema:
 *           type: string
 *         description: Elemento das vantagens
 *     responses:
 *       200:
 *         description: Lista de vantagens do elemento
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
 *                     $ref: '#/components/schemas/Vantagem'
 */
router.get('/elemento/:elemento', vantagemController.listarPorElemento);

/**
 * @swagger
 * /vantagens/tipo/{tipo}:
 *   get:
 *     summary: Listar vantagens por tipo
 *     tags: [Vantagens]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo das vantagens
 *     responses:
 *       200:
 *         description: Lista de vantagens do tipo
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
 *                     $ref: '#/components/schemas/Vantagem'
 */
router.get('/tipo/:tipo', vantagemController.listarPorTipo);

/**
 * @swagger
 * /vantagens/nivel/{nivel}:
 *   get:
 *     summary: Listar vantagens por nivel
 *     tags: [Vantagens]
 *     parameters:
 *       - in: path
 *         name: nivel
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nivel das vantagens
 *     responses:
 *       200:
 *         description: Lista de vantagens do nivel
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
 *                     $ref: '#/components/schemas/Vantagem'
 */
router.get('/nivel/:nivel', vantagemController.listarPorNivel);

/**
 * @swagger
 * /vantagens/buscar:
 *   get:
 *     summary: Buscar vantagens por termo
 *     tags: [Vantagens]
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
 *                     $ref: '#/components/schemas/Vantagem'
 *       400:
 *         description: Termo de busca e obrigatorio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/buscar', vantagemController.buscarVantagens);

/**
 * @swagger
 * /vantagens/estatisticas:
 *   get:
 *     summary: Obter estatisticas das vantagens
 *     tags: [Vantagens]
 *     responses:
 *       200:
 *         description: Estatisticas das vantagens
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
 *                       description: Total de vantagens ativas
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
router.get('/estatisticas', vantagemController.obterEstatisticas);
router.put('/:id', requireSuperAdmin, vantagemController.atualizarVantagem);
router.delete('/:id', requireSuperAdmin, vantagemController.deletarVantagem);

export default router; 