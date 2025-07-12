import express from 'express';
import sessaoController from '../controllers/sessao/sessaoController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sessões
 *   description: Gerenciamento de sessões de RPG
 */

/**
 * @swagger
 * /sessoes/{historiaId}/iniciar:
 *   post:
 *     summary: Iniciar uma sessão de RPG
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: historiaId
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
 *               salaId:
 *                 type: string
 *                 description: ID da sala (opcional, será gerado automaticamente)
 *               jogadores:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de jogadores
 *               mestre:
 *                 type: string
 *                 description: Nome do mestre
 *     responses:
 *       200:
 *         description: Sessão iniciada com sucesso
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
 *                     salaId:
 *                       type: string
 *                     sessao:
 *                       $ref: '#/components/schemas/Sessao'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: História não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:historiaId/iniciar', sessaoController.iniciarSessao);

/**
 * @swagger
 * /sessoes/{salaId}:
 *   get:
 *     summary: Obter informações de uma sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     responses:
 *       200:
 *         description: Sessão encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Sessao'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:salaId', sessaoController.obterSessao);

/**
 * @swagger
 * /sessoes/{salaId}/mensagem:
 *   post:
 *     summary: Adicionar mensagem à sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - autor
 *               - tipo
 *               - conteudo
 *             properties:
 *               autor:
 *                 type: string
 *                 description: Nome do autor da mensagem
 *               tipo:
 *                 type: string
 *                 enum: [mestre, jogador, sistema, npc]
 *                 description: Tipo da mensagem
 *               conteudo:
 *                 type: string
 *                 description: Conteúdo da mensagem
 *     responses:
 *       200:
 *         description: Mensagem adicionada com sucesso
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
 *                   $ref: '#/components/schemas/Sessao'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:salaId/mensagem', sessaoController.adicionarMensagem);

/**
 * @swagger
 * /sessoes/{salaId}/estado:
 *   put:
 *     summary: Atualizar estado do jogo
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estadoJogo
 *             properties:
 *               estadoJogo:
 *                 type: object
 *                 description: Novo estado do jogo
 *     responses:
 *       200:
 *         description: Estado atualizado com sucesso
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
 *                   $ref: '#/components/schemas/Sessao'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:salaId/estado', sessaoController.atualizarEstadoJogo);

/**
 * @swagger
 * /sessoes/{salaId}/jogador:
 *   post:
 *     summary: Adicionar jogador à sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
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
 *                 description: Nome do jogador
 *               personagem:
 *                 type: string
 *                 description: Nome do personagem
 *     responses:
 *       200:
 *         description: Jogador adicionado com sucesso
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
 *                   $ref: '#/components/schemas/Sessao'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:salaId/jogador', sessaoController.adicionarJogador);

/**
 * @swagger
 * /sessoes/{salaId}/jogador/{nomeJogador}:
 *   delete:
 *     summary: Remover jogador da sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *       - in: path
 *         name: nomeJogador
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do jogador
 *     responses:
 *       200:
 *         description: Jogador removido com sucesso
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
 *                   $ref: '#/components/schemas/Sessao'
 *       404:
 *         description: Jogador não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:salaId/jogador/:nomeJogador', sessaoController.removerJogador);

/**
 * @swagger
 * /sessoes/{salaId}/finalizar:
 *   post:
 *     summary: Finalizar uma sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     responses:
 *       200:
 *         description: Sessão finalizada com sucesso
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
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:salaId/finalizar', sessaoController.finalizarSessao);

/**
 * @swagger
 * /sessoes/{salaId}/renovar:
 *   post:
 *     summary: Renovar TTL da sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     responses:
 *       200:
 *         description: Sessão renovada com sucesso
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
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:salaId/renovar', sessaoController.renovarSessao);

/**
 * @swagger
 * /sessoes/{salaId}/estatisticas:
 *   get:
 *     summary: Obter estatísticas da sessão
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
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
 *                     totalMensagens:
 *                       type: integer
 *                     totalJogadores:
 *                       type: integer
 *                     tempoAtivo:
 *                       type: string
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:salaId/estatisticas', sessaoController.obterEstatisticas);

/**
 * @swagger
 * /sessoes:
 *   get:
 *     summary: Listar todas as sessões ativas
 *     tags: [Sessões]
 *     responses:
 *       200:
 *         description: Lista de sessões ativas
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
 *                     $ref: '#/components/schemas/Sessao'
 */
router.get('/', sessaoController.listarSessoesAtivas);

export default router; 