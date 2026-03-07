import express from 'express';
import racaController from '../controllers/raca/racaController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Raca:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da raça
 *         nome:
 *           type: string
 *           description: Nome da raça
 *         custo:
 *           type: integer
 *           description: Custo em pontos para escolher esta raça
 *         descricao:
 *           type: string
 *           description: Descrição da raça
 *         bonus:
 *           type: string
 *           description: Bônus e vantagens especiais em formato JSON
 */

/**
 * @swagger
 * /racas:
 *   post:
 *     summary: Criar uma nova raça
 *     tags: [Racas]
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
 *                 description: Nome da raça
 *               custo:
 *                 type: integer
 *                 default: 0
 *                 description: Custo em pontos
 *               descricao:
 *                 type: string
 *                 description: Descrição da raça
 *               bonus:
 *                 type: object
 *                 description: Bônus e vantagens especiais
 *     responses:
 *       201:
 *         description: Raça criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', requireSuperAdmin, asyncHandler(racaController.criarRaca));

/**
 * @swagger
 * /racas:
 *   get:
 *     summary: Listar todas as raças
 *     tags: [Racas]
 *     parameters:
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
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de raças
 */
router.get('/', asyncHandler(racaController.listarRacas));

/**
 * @swagger
 * /racas/buscar:
 *   get:
 *     summary: Buscar raças por nome
 *     tags: [Racas]
 *     parameters:
 *       - in: query
 *         name: termo
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Raças encontradas
 *       400:
 *         description: Termo de busca obrigatório
 */
router.get('/buscar', asyncHandler(racaController.buscarRacas));

/**
 * @swagger
 * /racas/{id}:
 *   get:
 *     summary: Obter uma raça específica
 *     tags: [Racas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da raça
 *     responses:
 *       200:
 *         description: Raça encontrada
 *       404:
 *         description: Raça não encontrada
 */
router.get('/:id', asyncHandler(racaController.obterRaca));
router.put('/:id', requireSuperAdmin, asyncHandler(racaController.atualizarRaca));
router.delete('/:id', requireSuperAdmin, asyncHandler(racaController.deletarRaca));

export default router; 