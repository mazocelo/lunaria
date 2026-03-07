import express from 'express';
import classeController from '../controllers/classe/classeController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Classe:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da classe
 *         nome:
 *           type: string
 *           description: Nome da classe
 *         custo:
 *           type: integer
 *           description: Custo em pontos para escolher esta classe
 *         descricao:
 *           type: string
 *           description: Descrição da classe
 *         bonus:
 *           type: string
 *           description: Bônus e vantagens especiais em formato JSON
 */

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Criar uma nova classe
 *     tags: [Classes]
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
 *                 description: Nome da classe
 *               custo:
 *                 type: integer
 *                 default: 0
 *                 description: Custo em pontos
 *               descricao:
 *                 type: string
 *                 description: Descrição da classe
 *               bonus:
 *                 type: object
 *                 description: Bônus e vantagens especiais
 *     responses:
 *       201:
 *         description: Classe criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', requireAdmin, asyncHandler(classeController.criarClasse));

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Listar todas as classes
 *     tags: [Classes]
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
 *         description: Lista de classes
 */
router.get('/', asyncHandler(classeController.listarClasses));

/**
 * @swagger
 * /classes/buscar:
 *   get:
 *     summary: Buscar classes por nome
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: termo
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Classes encontradas
 *       400:
 *         description: Termo de busca obrigatório
 */
router.get('/buscar', asyncHandler(classeController.buscarClasses));

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Obter uma classe específica
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da classe
 *     responses:
 *       200:
 *         description: Classe encontrada
 *       404:
 *         description: Classe não encontrada
 */
router.get('/:id', asyncHandler(classeController.obterClasse));

export default router; 