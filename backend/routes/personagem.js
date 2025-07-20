import express from 'express';
import personagemController from '../controllers/personagem/personagemController.js';
import { asyncHandler, asyncHandlerWithContext } from '../middleware/errorHandler.js';

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
 *               vantagens:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das vantagens do personagem
 *               desvantagens:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das desvantagens do personagem
 *               equipamentos:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs dos equipamentos do personagem
 *               sugestao_background:
 *                 type: string
 *                 description: Sugestão para geração de background
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
router.post('/', asyncHandlerWithContext(personagemController.criarPersonagem, personagemController));

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
router.get('/', asyncHandlerWithContext(personagemController.listarPersonagens, personagemController));

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
router.get('/:id', asyncHandlerWithContext(personagemController.obterPersonagem, personagemController));

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
 *               vantagens:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das vantagens do personagem (substitui todas as vantagens atuais)
 *               desvantagens:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das desvantagens do personagem (substitui todas as desvantagens atuais)
 *               equipamentos:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs dos equipamentos do personagem (substitui todos os equipamentos atuais)
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
router.put('/:id', asyncHandlerWithContext(personagemController.atualizarPersonagem, personagemController));

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
router.delete('/:id', asyncHandlerWithContext(personagemController.excluirPersonagem, personagemController));

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
router.post('/:id/background', asyncHandlerWithContext(personagemController.gerarBackground, personagemController));

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
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo para buscar por nome ou background do personagem
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
 *                 historia:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     temas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
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
 *                 message:
 *                   type: string
 *       404:
 *         description: História não encontrada
 */
router.get('/historia/:historia_id', asyncHandlerWithContext(personagemController.listarPersonagensPorHistoria, personagemController));

// ===== ROTAS PARA GERENCIAR VÍNCULOS COM VANTAGENS =====

/**
 * @swagger
 * /api/personagens/{id}/vantagens:
 *   post:
 *     summary: Adicionar vantagem ao personagem
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
 *             required:
 *               - vantagem_id
 *             properties:
 *               vantagem_id:
 *                 type: integer
 *                 description: ID da vantagem
 *     responses:
 *       200:
 *         description: Vantagem adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Personagem ou vantagem não encontrado
 */
router.post('/:id/vantagens', asyncHandlerWithContext(personagemController.adicionarVantagem, personagemController));

/**
 * @swagger
 * /api/personagens/{id}/vantagens/{vantagem_id}:
 *   delete:
 *     summary: Remover vantagem do personagem
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *       - in: path
 *         name: vantagem_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da vantagem
 *     responses:
 *       200:
 *         description: Vantagem removida com sucesso
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
router.delete('/:id/vantagens/:vantagem_id', asyncHandlerWithContext(personagemController.removerVantagem, personagemController));

/**
 * @swagger
 * /api/personagens/{id}/vantagens:
 *   get:
 *     summary: Listar vantagens do personagem
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
 *         description: Lista de vantagens do personagem
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
 *                       vantagem:
 *                         type: object
 *       404:
 *         description: Personagem não encontrado
 */
router.get('/:id/vantagens', asyncHandlerWithContext(personagemController.listarVantagens, personagemController));

// ===== ROTAS PARA GERENCIAR VÍNCULOS COM DESVANTAGENS =====

/**
 * @swagger
 * /api/personagens/{id}/desvantagens:
 *   post:
 *     summary: Adicionar desvantagem ao personagem
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
 *             required:
 *               - desvantagem_id
 *             properties:
 *               desvantagem_id:
 *                 type: integer
 *                 description: ID da desvantagem
 *     responses:
 *       200:
 *         description: Desvantagem adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Personagem ou desvantagem não encontrado
 */
router.post('/:id/desvantagens', asyncHandlerWithContext(personagemController.adicionarDesvantagem, personagemController));

/**
 * @swagger
 * /api/personagens/{id}/desvantagens/{desvantagem_id}:
 *   delete:
 *     summary: Remover desvantagem do personagem
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *       - in: path
 *         name: desvantagem_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da desvantagem
 *     responses:
 *       200:
 *         description: Desvantagem removida com sucesso
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
router.delete('/:id/desvantagens/:desvantagem_id', asyncHandlerWithContext(personagemController.removerDesvantagem, personagemController));

/**
 * @swagger
 * /api/personagens/{id}/desvantagens:
 *   get:
 *     summary: Listar desvantagens do personagem
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
 *         description: Lista de desvantagens do personagem
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
 *                       desvantagem:
 *                         type: object
 *       404:
 *         description: Personagem não encontrado
 */
router.get('/:id/desvantagens', asyncHandlerWithContext(personagemController.listarDesvantagens, personagemController));

// ===== ROTAS PARA GERENCIAR VÍNCULOS COM EQUIPAMENTOS =====

/**
 * @swagger
 * /api/personagens/{id}/equipamentos:
 *   post:
 *     summary: Adicionar equipamento ao personagem
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
 *             required:
 *               - equipamento_id
 *             properties:
 *               equipamento_id:
 *                 type: integer
 *                 description: ID do equipamento
 *     responses:
 *       200:
 *         description: Equipamento adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Personagem ou equipamento não encontrado
 */
router.post('/:id/equipamentos', asyncHandlerWithContext(personagemController.adicionarEquipamento, personagemController));

/**
 * @swagger
 * /api/personagens/{id}/equipamentos/{equipamento_id}:
 *   delete:
 *     summary: Remover equipamento do personagem
 *     tags: [Personagens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *       - in: path
 *         name: equipamento_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do equipamento
 *     responses:
 *       200:
 *         description: Equipamento removido com sucesso
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
router.delete('/:id/equipamentos/:equipamento_id', asyncHandlerWithContext(personagemController.removerEquipamento, personagemController));

/**
 * @swagger
 * /api/personagens/{id}/equipamentos:
 *   get:
 *     summary: Listar equipamentos do personagem
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
 *         description: Lista de equipamentos do personagem
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
 *                       equipamento:
 *                         type: object
 *       404:
 *         description: Personagem não encontrado
 */
router.get('/:id/equipamentos', asyncHandlerWithContext(personagemController.listarEquipamentos, personagemController));

export default router; 