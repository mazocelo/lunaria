import express from 'express';
import usuarioController from '../controllers/usuario/usuarioController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Novidades
 *   description: Novidades do usuário (convites, notificações, etc.)
 */

/**
 * @swagger
 * /novidades:
 *   get:
 *     summary: Obter novidades do usuário logado (convites pendentes, notificações, etc.)
 *     tags: [Novidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de resultados para pular
 *     responses:
 *       200:
 *         description: Novidades do usuário
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
 *                     convites:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           tipo:
 *                             type: string
 *                             example: "convite_historia"
 *                           historia:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nome:
 *                                 type: string
 *                               descricao:
 *                                 type: string
 *                               temas:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                           remetente:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nome:
 *                                 type: string
 *                           status:
 *                             type: string
 *                           criado_em:
 *                             type: string
 *                             format: date-time
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     total_convites:
 *                       type: integer
 *                     total_novidades:
 *                       type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         description: Token inválido
 */
router.get('/', asyncHandler(usuarioController.obterNovidades));

export default router;
