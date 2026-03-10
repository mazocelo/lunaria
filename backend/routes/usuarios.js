import express from 'express';
import usuarioController from '../controllers/usuario/usuarioController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireSuperAdmin, requireOwnerOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Gerenciamento de usuários
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *         nome:
 *           type: string
 *           description: Nome do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         historias:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               nome:
 *                 type: string
 *               status:
 *                 type: string
 *               criada_em:
 *                 type: string
 *                 format: date-time
 *         personagens:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               nome:
 *                 type: string
 *               nivel:
 *                 type: integer
 *               classe_id:
 *                 type: integer
 *               raca_id:
 *                 type: integer
 *     
 *     UsuarioUpdate:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         senha:
 *           type: string
 *           minimum: 6
 *           description: Nova senha (opcional)
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
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
 *         description: Lista de usuários
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       email:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
// GET / - Listar todos (APENAS ADMIN)
router.get('/', authenticateToken, requireSuperAdmin, asyncHandler(usuarioController.listarUsuarios));

/**
 * @swagger
 * /usuarios/perfil:
 *   get:
 *     summary: Obter perfil do usuário logado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/perfil', authenticateToken, asyncHandler(usuarioController.obterPerfil));

// Perfil público (sem auth obrigatória)
router.get('/publico/:id', asyncHandler(usuarioController.obterPerfilPublico));

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obter usuário por ID
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: ID inválido
 */
// GET /:id - Obter por ID (OWNER OU ADMIN)
router.get('/:id', authenticateToken, requireOwnerOrSuperAdmin('id'), asyncHandler(usuarioController.obterUsuario));

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioUpdate'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 */
// PUT /:id - Atualizar (OWNER OU ADMIN)
router.put('/:id', authenticateToken, requireOwnerOrSuperAdmin('id'), asyncHandler(usuarioController.atualizarUsuario));

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Deletar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 */
// DELETE /:id - Deletar (OWNER OU ADMIN)
router.delete('/:id', authenticateToken, requireOwnerOrSuperAdmin('id'), asyncHandler(usuarioController.deletarUsuario));

// PATCH /:id/restore - Restaurar usuário soft-deleted (ADMIN)
router.patch('/:id/restore', authenticateToken, requireSuperAdmin, asyncHandler(usuarioController.restaurarUsuario));

/**
 * @swagger
 * /usuarios/{id}/estatisticas:
 *   get:
 *     summary: Obter estatísticas do usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Estatísticas do usuário
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
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                     estatisticas:
 *                       type: object
 *                       properties:
 *                         total_historias:
 *                           type: integer
 *                         total_personagens:
 *                           type: integer
 *                         historias_ativas:
 *                           type: integer
 *                         personagens_por_nivel:
 *                           type: object
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 */
// GET /:id/estatisticas - Estatísticas (OWNER OU ADMIN)
router.get('/:id/estatisticas', authenticateToken, requireOwnerOrSuperAdmin('id'), asyncHandler(usuarioController.obterEstatisticas));

/**
 * @swagger
 * /usuarios/{id}/promover:
 *   post:
 *     summary: Promover usuário a administrador
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário a ser promovido
 *     responses:
 *       200:
 *         description: Usuário promovido com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Apenas administradores podem promover usuários
 */
// POST /:id/promover - Promover a admin (APENAS ADMIN)
router.post('/:id/promover', authenticateToken, requireSuperAdmin, asyncHandler(usuarioController.promoverSuperAdmin));

export default router; 