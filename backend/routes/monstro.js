import express from 'express';
import rateLimit from 'express-rate-limit';
import monstroController from '../controllers/monstro/monstroController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import db from '../Model/index.js';

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

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
 *         description: Temas separados por virgula
 *       - in: query
 *         name: dificuldade
 *         schema:
 *           type: string
 *           default: media
 *         description: Dificuldade do combate - facil, media ou dificil
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
router.post('/', authenticateToken, writeLimiter, requireSuperAdmin, asyncHandler(monstroController.criar));

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
router.put('/:id', authenticateToken, writeLimiter, requireSuperAdmin, asyncHandler(monstroController.atualizar));

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
router.delete('/:id', authenticateToken, writeLimiter, requireSuperAdmin, asyncHandler(monstroController.deletar));

// ===== LOOT TABLE CRUD (SuperAdmin) =====

// Listar loot table de um monstro
router.get('/:id/loot', asyncHandler(async (req, res) => {
  const loot = await db.MonstroLoot.findByMonstroId(parseInt(req.params.id));
  res.json({ success: true, data: loot });
}));

// Adicionar entry na loot table
router.post('/:id/loot', authenticateToken, writeLimiter, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { equipamento_id, drop_rate, min_quantidade, max_quantidade, nivel_minimo } = req.body;
  if (!equipamento_id) {
    return res.status(400).json({ success: false, error: 'equipamento_id é obrigatório' });
  }
  const entry = await db.MonstroLoot.create({
    monstro_id: parseInt(req.params.id),
    equipamento_id: parseInt(equipamento_id),
    drop_rate: drop_rate ?? 0.1,
    min_quantidade: min_quantidade ?? 1,
    max_quantidade: max_quantidade ?? 1,
    nivel_minimo: nivel_minimo ?? 1
  });
  res.status(201).json({ success: true, data: entry });
}));

// Atualizar entry da loot table
router.put('/loot/:lootId', authenticateToken, writeLimiter, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { drop_rate, min_quantidade, max_quantidade, nivel_minimo } = req.body;
  const entry = await db.MonstroLoot.update(parseInt(req.params.lootId), {
    ...(drop_rate !== undefined && { drop_rate }),
    ...(min_quantidade !== undefined && { min_quantidade }),
    ...(max_quantidade !== undefined && { max_quantidade }),
    ...(nivel_minimo !== undefined && { nivel_minimo })
  });
  res.json({ success: true, data: entry });
}));

// Remover entry da loot table
router.delete('/loot/:lootId', authenticateToken, writeLimiter, requireSuperAdmin, asyncHandler(async (req, res) => {
  await db.MonstroLoot.delete(parseInt(req.params.lootId));
  res.json({ success: true, message: 'Loot entry removida' });
}));

export default router;
