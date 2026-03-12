import express from 'express';
import rateLimit from 'express-rate-limit';
import historiaController from '../controllers/historia/historiaController.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import { requireResourceOwnerOrSuperAdmin } from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

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
router.post('/create', authenticateToken, writeLimiter, historiaController.criarHistoria);

/**
 * @swagger
 * /historias:
 *   get:
 *     summary: Listar histórias (minhas histórias + onde meus personagens participam)
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
 *       - in: query
 *         name: todas
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, lista todas as histórias públicas (ignora filtro de usuário)
 *       - in: query
 *         name: incluir_personagens
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Se true, inclui histórias onde os personagens do usuário participam
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Historia'
 *                       - type: object
 *                         properties:
 *                           tipo_relacao:
 *                             type: string
 *                             enum: [criador, participante, convite_pendente, convite_aceito, criador_e_participante, criador_e_convite_pendente, criador_e_convite_aceito, participante_e_convite_pendente, participante_e_convite_aceito, criador_e_participante_e_convite_pendente, criador_e_participante_e_convite_aceito]
 *                             description: Tipo de relação do usuário com a história
 *                           personagem_participante:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nome:
 *                                 type: string
 *                               papel:
 *                                 type: string
 *                             description: Informações do personagem participante (quando tipo_relacao é participante)
 *                           convite_status:
 *                             type: string
 *                             enum: [pendente, aceito, recusado]
 *                             description: Status do convite (quando aplicável)
 *                           convite_criado_em:
 *                             type: string
 *                             format: date-time
 *                             description: Data de criação do convite (quando aplicável)
 *                           convite_respondido_em:
 *                             type: string
 *                             format: date-time
 *                             description: Data de resposta ao convite (quando aplicável)
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
 *                 filtrado_por_usuario:
 *                   type: integer
 *                   description: ID do usuário usado no filtro (null se público)
 *                 incluindo_personagens:
 *                   type: boolean
 *                   description: Se está incluindo histórias onde personagens do usuário participam
 */
router.get('/', historiaController.listarHistorias);

/**
 * @swagger
 * /historias/minhas:
 *   get:
 *     summary: Listar apenas histórias criadas por mim
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
 *         description: Lista de histórias criadas pelo usuário
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
router.get('/minhas', authenticateToken, historiaController.listarMinhasHistorias);

/**
 * @swagger
 * /historias/com-personagens:
 *   get:
 *     summary: Listar histórias onde meus personagens participam
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
 *         description: Lista de histórias onde personagens do usuário participam
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Historia'
 *                       - type: object
 *                         properties:
 *                           personagem_participante:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nome:
 *                                 type: string
 *                               papel:
 *                                 type: string
 *                             description: Informações do personagem participante
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
router.get('/com-personagens', authenticateToken, historiaController.listarHistoriasComPersonagens);

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
router.post('/gerar-ia', authenticateToken, writeLimiter, historiaController.gerarHistoriaComIA);

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
router.post('/gerar-aventura-completa', authenticateToken, writeLimiter, historiaController.gerarAventuraCompleta);

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
// PUT /:id - Atualizar história (OWNER OU ADMIN)
router.put('/:id', writeLimiter, requireResourceOwnerOrSuperAdmin('Historia'), historiaController.atualizarHistoria);

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
// DELETE /:id - Excluir história (OWNER OU ADMIN)
router.delete('/:id', writeLimiter, requireResourceOwnerOrSuperAdmin('Historia'), historiaController.excluirHistoria);

// PATCH /:id/restore - Restaurar história soft-deleted (OWNER OU ADMIN)
router.patch('/:id/restore', requireResourceOwnerOrSuperAdmin('Historia'), historiaController.restaurarHistoria);

// === ROTEIRO (Story Blueprint) ===
const blueprintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Limite de geração de roteiros atingido. Tente novamente em 1 hora.' }
});

// POST /:id/roteiro - Gerar roteiro com IA (OWNER OU ADMIN)
router.post('/:id/roteiro', blueprintLimiter, requireResourceOwnerOrSuperAdmin('Historia'), historiaController.gerarRoteiro);

// GET /:id/roteiro - Obter roteiro
router.get('/:id/roteiro', authenticateToken, historiaController.obterRoteiro);

// PUT /:id/roteiro - Atualizar roteiro manualmente (OWNER OU ADMIN)
router.put('/:id/roteiro', writeLimiter, requireResourceOwnerOrSuperAdmin('Historia'), historiaController.atualizarRoteiro);

// GET /:id/roteiro/progressao - Obter progressão do roteiro
router.get('/:id/roteiro/progressao', authenticateToken, historiaController.obterProgressao);

// PUT /:id/roteiro/progressao - Atualizar progressão (OWNER OU ADMIN)
router.put('/:id/roteiro/progressao', writeLimiter, requireResourceOwnerOrSuperAdmin('Historia'), historiaController.atualizarProgressao);

/**
 * Verificar se há sessão ativa para uma história
 */
router.get('/:id/sessao-ativa', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const salaId = `historia_${id}`;

    console.log(`🔍 Verificando sessão ativa para história ${id} (usuário: ${userId})`);

    // Verificar se há sessão no Redis
    const sessao = await gerenciadorSessoes.obterSessao(salaId);
    console.log('📊 Sessão obtida do Redis:', {
      salaId,
      status: sessao?.status,
      jogadores: sessao?.jogadores,
      jogadoresConectados: sessao?.jogadoresConectados,
      donoId: sessao?.donoId
    });

    if (!sessao) {
      console.log(`📭 Nenhuma sessão ativa encontrada para história ${id}`);
      return res.json({
        success: true,
        data: { hasActiveSession: false }
      });
    }

    // ✅ VERIFICAR SE USUÁRIO ESTÁ JOGANDO (baseado em statusJogo)
    // isPlaying SÓ É TRUE se o jogo foi efetivamente INICIADO
    const estaEmJogadores = sessao.jogadores && sessao.jogadores[String(userId)];
    const ehDono = String(sessao.donoId) === String(userId);
    const estaConectado = Array.isArray(sessao.jogadoresConectados) &&
      sessao.jogadoresConectados.some(id => String(id) === String(userId));

    // ✅ NOVO: isPlaying só é true se statusJogo === 'iniciado'
    const jogoIniciado = sessao.statusJogo === 'iniciado';
    const estaJogando = jogoIniciado && (!!estaEmJogadores || ehDono);

    console.log(`📋 Sessão encontrada:`, {
      status: sessao.status,
      statusJogo: sessao.statusJogo,
      totalJogadores: sessao.jogadores ? Object.keys(sessao.jogadores).length : 0,
      jogadoresConectadosAgora: sessao.jogadoresConectados?.length || 0,
      estaEmJogadores: !!estaEmJogadores,
      ehDono,
      estaConectado,
      jogoIniciado,
      estaJogando
    });

    res.json({
      success: true,
      data: {
        hasActiveSession: true,
        isPlaying: estaJogando, // ✅ Só true se jogo INICIADO e usuário participando
        sessao: {
          status: sessao.status,
          statusJogo: sessao.statusJogo, // ✅ Incluir statusJogo na resposta
          totalJogadores: sessao.jogadoresConectados?.length || 0,
          totalMensagens: sessao.mensagens?.length || 0,
          iniciadaEm: sessao.iniciadaEm
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao verificar sessão ativa:', error);
    next(error);
  }
});

export default router;
