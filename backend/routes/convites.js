import express from 'express';
import conviteController from '../controllers/convite/conviteController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Convites
 *   description: Gerenciamento de convites para histórias
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Convite:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do convite
 *         historia:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             descricao:
 *               type: string
 *             temas:
 *               type: array
 *               items:
 *                 type: string
 *         usuario_convidado:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             email:
 *               type: string
 *         status:
 *           type: string
 *           enum: [pendente, aceito, recusado]
 *         criado_em:
 *           type: string
 *           format: date-time
 *         respondido_em:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     
 *     ConviteRequest:
 *       type: object
 *       required:
 *         - historia_id
 *         - email
 *       properties:
 *         historia_id:
 *           type: integer
 *           description: ID da história para qual o convite será enviado
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário a ser convidado
 *     
 *     AceitarConviteRequest:
 *       type: object
 *       required:
 *         - personagem_id
 *       properties:
 *         personagem_id:
 *           type: integer
 *           description: ID do personagem que irá participar da história
 */

/**
 * @swagger
 * /convites:
 *   post:
 *     summary: Criar um novo convite para história
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConviteRequest'
 *     responses:
 *       201:
 *         description: Convite criado com sucesso
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
 *                   $ref: '#/components/schemas/Convite'
 *       400:
 *         description: Dados inválidos ou convite já existe
 *       403:
 *         description: Apenas o criador da história pode enviar convites
 *       404:
 *         description: História ou usuário não encontrado
 */
router.post('/', asyncHandler(conviteController.criarConvite));


/**
 * @swagger
 * /convites/enviados:
 *   get:
 *     summary: Listar convites enviados pelo usuário logado
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, aceito, recusado]
 *         description: Filtrar por status do convite
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
 *         description: Lista de convites enviados
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
 *                     $ref: '#/components/schemas/Convite'
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
router.get('/enviados', asyncHandler(conviteController.listarConvitesEnviados));

/**
 * @swagger
 * /convites/{id}/aceitar:
 *   put:
 *     summary: Aceitar um convite e adicionar personagem à história
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do convite
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AceitarConviteRequest'
 *     responses:
 *       200:
 *         description: Convite aceito com sucesso
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
 *                     historia:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         descricao:
 *                           type: string
 *                     personagem:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         nivel:
 *                           type: integer
 *                         classe:
 *                           type: string
 *                         raca:
 *                           type: string
 *                     status:
 *                       type: string
 *                     respondido_em:
 *                       type: string
 *                       format: date-time
 *                     participacao_id:
 *                       type: integer
 *       400:
 *         description: Dados inválidos, personagem já participa ou história lotada
 *       404:
 *         description: Convite ou personagem não encontrado
 */
router.put('/:id/aceitar', asyncHandler(conviteController.aceitarConvite));

/**
 * @swagger
 * /convites/{id}/recusar:
 *   put:
 *     summary: Recusar um convite
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do convite
 *     responses:
 *       200:
 *         description: Convite recusado com sucesso
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
 *                     historia:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         descricao:
 *                           type: string
 *                     status:
 *                       type: string
 *                     respondido_em:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Convite não encontrado ou já foi respondido
 */
router.put('/:id/recusar', asyncHandler(conviteController.recusarConvite));

export default router;
