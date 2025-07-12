import express from 'express';
import historiaController from '../controllers/historia/historiaController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Histórias
 *   description: Gerenciamento de histórias e sessões de RPG
 */

/**
 * @swagger
 * /historias/nova:
 *   post:
 *     summary: Criar uma nova história com prólogo gerado automaticamente
 *     tags: [Histórias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - tema
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da história
 *               tema:
 *                 type: string
 *                 description: Tema da história (usado para gerar o prólogo)
 *               descricao:
 *                 type: string
 *                 description: Descrição da história
 *               genero:
 *                 type: string
 *                 description: Gênero da história
 *               maximo_de_participantes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Número máximo de participantes
 *               temas_disponiveis:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de temas disponíveis para inspiração (opcional)
 *     responses:
 *       201:
 *         description: História criada com prólogo gerado automaticamente
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
 *                     tema:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     prologo:
 *                       type: string
 *                       description: Prólogo gerado automaticamente pela IA
 *                     genero:
 *                       type: string
 *                     maximo_de_participantes:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     criada_em:
 *                       type: string
 *                       format: date-time
 *                     temas_utilizados:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Temas utilizados para gerar o prólogo
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/nova', historiaController.criarHistoria);

/**
 * @swagger
 * /historias:
 *   get:
 *     summary: Listar todas as histórias
 *     tags: [Histórias]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por status
 *       - in: query
 *         name: tema
 *         schema:
 *           type: string
 *         description: Filtrar por tema
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
 *         description: Lista de histórias
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
 *                     $ref: '#/components/schemas/Historia'
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
router.get('/', historiaController.listarHistorias);

/**
 * @swagger
 * /historias/{id}:
 *   get:
 *     summary: Obter uma história específica
 *     tags: [Histórias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da história
 *     responses:
 *       200:
 *         description: História encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Historia'
 *       404:
 *         description: História não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', historiaController.obterHistoria);

/**
 * @swagger
 * /historias/{id}:
 *   put:
 *     summary: Atualizar uma história
 *     tags: [Histórias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da história
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               tema:
 *                 type: string
 *               descricao:
 *                 type: string
 *               genero:
 *                 type: string
 *               maximo_de_participantes:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: História atualizada com sucesso
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
 *                   $ref: '#/components/schemas/Historia'
 *       404:
 *         description: História não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', historiaController.atualizarHistoria);

/**
 * @swagger
 * /historias/{id}:
 *   delete:
 *     summary: Excluir uma história
 *     tags: [Histórias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da história
 *     responses:
 *       200:
 *         description: História excluída com sucesso
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
 *         description: História não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', historiaController.excluirHistoria);

/**
 * @swagger
 * /historias/gerar-ia:
 *   post:
 *     summary: Gerar história com IA
 *     tags: [Histórias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tema
 *             properties:
 *               tema:
 *                 type: string
 *                 description: Tema para geração da história
 *               genero:
 *                 type: string
 *                 description: Gênero da história
 *     responses:
 *       200:
 *         description: História gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Historia'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/gerar-ia', historiaController.gerarHistoriaComIA);



/**
 * @swagger
 * /historias/gerar-aventura-completa:
 *   post:
 *     summary: Gerar aventura completa com IA
 *     tags: [Histórias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tema
 *             properties:
 *               tema:
 *                 type: string
 *                 description: Tema da aventura
 *               genero:
 *                 type: string
 *                 description: Gênero da aventura
 *     responses:
 *       200:
 *         description: Aventura gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 aventura:
 *                   type: object
 *                   properties:
 *                     titulo:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     objetivos:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/gerar-aventura-completa', historiaController.gerarAventuraCompleta);



export default router;
