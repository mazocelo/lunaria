import express from 'express';
import sessaoController from '../controllers/sessao/sessaoController.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import gerenciadorSessoes from '../redis/sessoes.js';

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
// IMPORTANTE: rotas estaticas ANTES de /:salaId para evitar conflito
router.get('/salvas', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    let sessoes;
    if (userId) {
      sessoes = await (await import('../Model/index.js')).default.SessaoJogo.findByUsuarioId(userId);
    } else {
      sessoes = await (await import('../Model/index.js')).default.SessaoJogo.findActive();
    }
    res.json({
      success: true,
      data: sessoes.map(s => ({
        id: s.id,
        sala_id: s.sala_id,
        historia_id: s.historia_id,
        historia_nome: s.historia?.nome,
        status: s.status,
        rodada_atual: s.rodada_atual,
        fase: s.fase,
        ultimo_snapshot: s.ultimo_snapshot,
        iniciada_em: s.iniciada_em
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Listar sessoes de uma historia (para historico)
router.get('/historia/:historiaId', async (req, res, next) => {
  try {
    const { historiaId } = req.params;
    const parsed = parseInt(historiaId);
    if (isNaN(parsed)) {
      return res.status(400).json({ success: false, error: 'historiaId deve ser numérico' });
    }
    const db = (await import('../Model/index.js')).default;
    const sessoes = await db.SessaoJogo.findByHistoriaId(parsed);
    res.json({
      success: true,
      data: sessoes.map(s => ({
        id: s.id,
        sala_id: s.sala_id,
        historia_id: s.historia_id,
        status: s.status,
        rodada_atual: s.rodada_atual,
        fase: s.fase,
        jogadores: s.jogadores,
        totalMensagens: Array.isArray(s.mensagens) ? s.mensagens.length : 0,
        iniciada_em: s.iniciada_em,
        finalizada_em: s.finalizada_em,
        ultimo_snapshot: s.ultimo_snapshot
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Buscar historico completo de uma sessao (com mensagens)
router.get('/historico/:sessaoId', async (req, res, next) => {
  try {
    const { sessaoId } = req.params;
    const db = (await import('../Model/index.js')).default;
    const sessao = await db.SessaoJogo.findById(sessaoId);
    if (!sessao) {
      return res.status(404).json({ success: false, error: 'Sessão não encontrada' });
    }
    res.json({ success: true, data: sessao });
  } catch (error) {
    next(error);
  }
});

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

// ============================================================
// ENDPOINTS DE SNAPSHOT (Persistencia PostgreSQL)
// ============================================================

/**
 * @swagger
 * /sessoes/{salaId}/snapshot:
 *   post:
 *     summary: Forcar snapshot manual de uma sessao ativa
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snapshot salvo com sucesso
 *       404:
 *         description: Sessao nao encontrada no Redis
 */
router.post('/:salaId/snapshot', async (req, res, next) => {
  try {
    const { salaId } = req.params;
    const sessaoRedis = await gerenciadorSessoes.obterSessao(salaId);
    if (!sessaoRedis) {
      return res.status(404).json({ success: false, error: 'Sessão não encontrada no Redis' });
    }
    const result = await sessaoSnapshotService.salvarSnapshot(salaId, sessaoRedis);
    res.json({ success: true, message: 'Snapshot salvo', data: { sala_id: result.sala_id, ultimo_snapshot: result.ultimo_snapshot } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /sessoes/{salaId}/restaurar:
 *   post:
 *     summary: Restaurar sessao do PostgreSQL para Redis
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: salaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessao restaurada com sucesso
 *       404:
 *         description: Snapshot nao encontrado
 */
router.post('/:salaId/restaurar', async (req, res, next) => {
  try {
    const { salaId } = req.params;
    const sessao = await sessaoSnapshotService.restaurarSessao(salaId);
    if (!sessao) {
      return res.status(404).json({ success: false, error: 'Snapshot não encontrado ou sessão já finalizada' });
    }
    res.json({ success: true, message: 'Sessão restaurada do banco de dados', data: { salaId, status: sessao.status } });
  } catch (error) {
    next(error);
  }
});

export default router; 