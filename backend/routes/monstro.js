import express from 'express';
import monstroController from '../controllers/monstro/monstroController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Monstro:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unico do monstro
 *         nome:
 *           type: string
 *           description: Nome do monstro
 *         tipo:
 *           type: string
 *           description: Tipo do monstro
 *         raridade:
 *           type: string
 *           description: Raridade do monstro
 *         nivel:
 *           type: integer
 *           description: Nivel do monstro
 *         tema:
 *           type: string
 *           description: Tema associado ao monstro
 *         descricao:
 *           type: string
 *           description: Descricao do monstro
 *         atributos:
 *           type: string
 *           description: Atributos do monstro em formato JSON
 */

/**
 * @swagger
 * /monstros:
 *   get:
 *     summary: Listar todos os monstros
 *     tags: [Monstros]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: raridade
 *         schema:
 *           type: string
 *         description: Filtrar por raridade
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: integer
 *         description: Filtrar por nivel
 *       - in: query
 *         name: tema
 *         schema:
 *           type: string
 *         description: Filtrar por tema
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginacao
 *     responses:
 *       200:
 *         description: Lista de monstros
 */
router.get('/', asyncHandler(monstroController.listar));

/**
 * @swagger
 * /monstros/combate:
 *   get:
 *     summary: Buscar monstros para combate
 *     tags: [Monstros]
 *     parameters:
 *       - in: query
 *         name: nivel
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nivel do combate
 *       - in: query
 *         name: temas
 *         schema:
 *           type: string
 *         description: Temas separados por virgula (ex: medieval,fantasia)
 *       - in: query
 *         name: dificuldade
 *         schema:
 *           type: string
 *           default: media
 *         description: Dificuldade do combate (facil, media, dificil)
 *     responses:
 *       200:
 *         description: Monstros selecionados para combate
 *       400:
 *         description: Nivel obrigatorio
 */
router.get('/combate', asyncHandler(monstroController.buscarParaCombate));

/**
 * @swagger
 * /monstros/{id}:
 *   get:
 *     summary: Buscar monstro por ID
 *     tags: [Monstros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do monstro
 *     responses:
 *       200:
 *         description: Monstro encontrado
 *       404:
 *         description: Monstro nao encontrado
 */
router.get('/:id', asyncHandler(monstroController.buscarPorId));

/**
 * @swagger
 * /monstros:
 *   post:
 *     summary: Criar um novo monstro
 *     tags: [Monstros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do monstro
 *               tipo:
 *                 type: string
 *                 description: Tipo do monstro
 *               raridade:
 *                 type: string
 *                 description: Raridade do monstro
 *               nivel:
 *                 type: integer
 *                 description: Nivel do monstro
 *               tema:
 *                 type: string
 *                 description: Tema do monstro
 *               descricao:
 *                 type: string
 *                 description: Descricao do monstro
 *               atributos:
 *                 type: object
 *                 description: Atributos do monstro
 *     responses:
 *       201:
 *         description: Monstro criado com sucesso
 *       400:
 *         description: Dados invalidos
 */
router.post('/', authenticateToken, asyncHandler(monstroController.criar));

/**
 * @swagger
 * /monstros/{id}:
 *   put:
 *     summary: Atualizar um monstro
 *     tags: [Monstros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do monstro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Monstro'
 *     responses:
 *       200:
 *         description: Monstro atualizado com sucesso
 *       404:
 *         description: Monstro nao encontrado
 */
router.put('/:id', authenticateToken, asyncHandler(monstroController.atualizar));

/**
 * @swagger
 * /monstros/{id}:
 *   delete:
 *     summary: Deletar um monstro
 *     tags: [Monstros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do monstro
 *     responses:
 *       200:
 *         description: Monstro deletado com sucesso
 *       404:
 *         description: Monstro nao encontrado
 */
router.delete('/:id', authenticateToken, asyncHandler(monstroController.deletar));

export default router;
