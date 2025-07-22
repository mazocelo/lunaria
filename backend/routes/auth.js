import express from 'express';
import authController from '../controllers/auth/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Autenticação e gestão de usuários
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - senha
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         senha:
 *           type: string
 *           minimum: 6
 *           description: Senha do usuário
 *     
 *     RegistroRequest:
 *       type: object
 *       required:
 *         - nome
 *         - email
 *         - senha
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
 *           description: Senha do usuário (mínimo 6 caracteres)
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: Token JWT para autenticação
 *             usuario:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/registro:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroRequest'
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Este email já está cadastrado"
 */
router.post('/registro', asyncHandler(authController.registrar));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Email ou senha incorretos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Email ou senha incorretos"
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @swagger
 * /auth/verificar:
 *   get:
 *     summary: Verificar token atual
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token válido"
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
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *       401:
 *         description: Token inválido ou expirado
 */
router.get('/verificar', authenticateToken, asyncHandler(authController.verificarToken));

/**
 * @swagger
 * /auth/renovar:
 *   post:
 *     summary: Renovar token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT a ser renovado
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
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
 *                     token:
 *                       type: string
 *       401:
 *         description: Token inválido para renovação
 */
router.post('/renovar', asyncHandler(authController.renovarToken));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout realizado com sucesso"
 *       401:
 *         description: Token inválido
 */
router.post('/logout', authenticateToken, asyncHandler(authController.logout));

export default router; 