
import express from 'express';
import db from '../Model/index.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Temas
 *   description: Gerenciamento de temas para histórias
 */

/**
 * @swagger
 * /temas:
 *   get:
 *     summary: Listar todos os temas disponíveis
 *     tags: [Temas]
 *     responses:
 *       200:
 *         description: Lista de temas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID do tema
 *                   nome:
 *                     type: string
 *                     description: Nome do tema
 *                   descricao:
 *                     type: string
 *                     description: Descrição do tema
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => {
    db.Temas.findAll()
        .then(temas => {
            res.status(200).json({
                success: true,
                data: temas
            });
        })
        .catch(error => {
            console.error('Erro ao buscar temas:', error);
            res.status(500).json({ error: 'Erro ao buscar temas.' });
        });
})

export default router;