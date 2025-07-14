import express from 'express';
import personagemController from '../controllers/personagem/personagemController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Personagem:
 *       type: object
 *       required:
 *         - nome
 *         - historia_id
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do personagem
 *         nome:
 *           type: string
 *           description: Nome do personagem
 *         nivel:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Nível do personagem
 *         pontos_totais:
 *           type: integer
 *           description: Pontos totais do personagem
 *         pontos_iniciais:
 *           type: integer
 *           description: Pontos iniciais do personagem
 *         background:
 *           type: string
 *           description: Background/história do personagem
 *         raca_id:
 *           type: integer
 *           description: ID da raça do personagem
 *         classe_id:
 *           type: integer
 *           description: ID da classe do personagem
 *         forca:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Força do personagem
 *         inteligencia:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Inteligência do personagem
 *         carisma:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Carisma do personagem
 *         destreza:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Destreza do personagem
 *         constituicao:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Constituição do personagem
 *         sabedoria:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Sabedoria do personagem
 *         historia_id:
 *           type: integer
 *           description: ID da história à qual o personagem pertence
 *         jogador_id:
 *           type: integer
 *           description: ID do jogador que controla o personagem
 *         status:
 *           type: string
 *           enum: [ativo, inativo, morto]
 *           description: Status do personagem
 *         criado_em:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         atualizado_em:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 */

/**
 * @swagger
 * /api/personagens:
 *   post:
 *     summary: Criar um novo personagem
 *     tags: [Personagens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - historia_id
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do personagem
 *               nivel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 1
 *               pontos_totais:
 *                 type: integer
 *                 default: 0
 *               pontos_iniciais:
 *                 type: integer
 *                 default: 0
 *               background:
 *                 type: string
 *                 description: Background do personagem
 *               raca_id:
 *                 type: integer
 *               classe_id:
 *                 type: integer
 *               forca:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *               inteligencia:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *               carisma:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *               destreza:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *               constituicao:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *               sabedoria:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *               historia_id:
 *                 type: integer
 *                 description: ID da história
 *               jogador_id:
 *                 type: integer
 *               gerar_background:
 *                 type: boolean
 *                 default: false
 *                 description: Se deve gerar background automaticamente
 *               temas_disponiveis:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Temas disponíveis para geração de background
 *     responses:
 *       201:
 *         description: Personagem criado com sucesso
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
 *                   $ref: '#/components/schemas/Personagem'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: História não encontrada
 */
router.post('/', asyncHandler(personagemController.criarPersonagem));

/**
 * @swagger
 * /api/personagens:
 *   get:
 *     summary: Listar todos os personagens
 *     tags: [Personagens]
 *     parameters:
 *       - in: query
 *         name: historia_id
 *         schema:
 *           type: integer
 *         description: Filtrar por história
 *       - in: query
 *         name: jogador_id
 *         schema:
 *           type: integer
 *         description: Filtrar por jogador
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo, morto]
 *         description: Filtrar por status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de personagens
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
 *                     $ref: '#/components/schemas/Personagem'
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
router.get('/', asyncHandler(personagemController.listarPersonagens));

/**
 * @swagger
 * /api/personagens/{id}:
 *   get:
 *     summary: Obter um personagem específico
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *     responses:
 *       200:
 *         description: Personagem encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Personagem'
 *       404:
 *         description: Personagem não encontrado
 */
router.get('/:id', asyncHandler(personagemController.obterPersonagem));

/**
 * @swagger
 * /api/personagens/{id}:
 *   put:
 *     summary: Atualizar um personagem
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               nivel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               pontos_totais:
 *                 type: integer
 *               pontos_iniciais:
 *                 type: integer
 *               background:
 *                 type: string
 *               raca_id:
 *                 type: integer
 *               classe_id:
 *                 type: integer
 *               forca:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               inteligencia:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               carisma:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               destreza:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               constituicao:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               sabedoria:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               status:
 *                 type: string
 *                 enum: [ativo, inativo, morto]
 *     responses:
 *       200:
 *         description: Personagem atualizado com sucesso
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
 *                   $ref: '#/components/schemas/Personagem'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Personagem não encontrado
 */
router.put('/:id', asyncHandler(personagemController.atualizarPersonagem));

/**
 * @swagger
 * /api/personagens/{id}:
 *   delete:
 *     summary: Excluir um personagem
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *     responses:
 *       200:
 *         description: Personagem excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Personagem não encontrado
 */
router.delete('/:id', asyncHandler(personagemController.excluirPersonagem));

/**
 * @swagger
 * /api/personagens/{id}/background:
 *   post:
 *     summary: Gerar background para um personagem
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               temas_disponiveis:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Temas disponíveis para geração
 *               tipo:
 *                 type: string
 *                 enum: [normal, detalhado]
 *                 default: normal
 *                 description: Tipo de background a gerar
 *     responses:
 *       200:
 *         description: Background gerado com sucesso
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
 *                   $ref: '#/components/schemas/Personagem'
 *       404:
 *         description: Personagem não encontrado
 */
router.post('/:id/background', asyncHandler(personagemController.gerarBackground));

/**
 * @swagger
 * /api/personagens/historia/{historia_id}:
 *   get:
 *     summary: Listar personagens por história
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: historia_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da história
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo, morto]
 *         description: Filtrar por status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de personagens da história
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
 *                     $ref: '#/components/schemas/Personagem'
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
 *       404:
 *         description: História não encontrada
 */
router.get('/historia/:historia_id', asyncHandler(personagemController.listarPersonagensPorHistoria));

export default router; 