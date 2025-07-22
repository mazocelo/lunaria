import express from 'express';
import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/historia/MestreRPG.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import socketManager from '../websocket/socketManager.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Jogo
 *   description: Controle de sessões de jogo em tempo real
 */

/**
 * @swagger
 * /jogo/start:
 *   post:
 *     summary: Iniciar uma aventura/sessão de RPG
 *     tags: [Jogo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - historiaId
 *             properties:
 *               historiaId:
 *                 type: integer
 *                 description: ID da história a ser iniciada
 *               mensagemInicial:
 *                 type: string
 *                 description: Mensagem inicial opcional do mestre
 *     responses:
 *       200:
 *         description: Aventura iniciada com sucesso
 *       403:
 *         description: Apenas o dono da história pode iniciar
 *       404:
 *         description: História não encontrada
 *       400:
 *         description: Sessão já iniciada ou erro de validação
 */
router.post('/start', authenticateToken, async (req, res, next) => {
  try {
    const { historiaId, mensagemInicial } = req.body;
    const userId = req.user.id;

    console.log(`🎮 Solicitação para iniciar aventura - História: ${historiaId}, Usuário: ${userId}`);

    // Verificar se a história existe
    const historia = await db.Historia.findById(parseInt(historiaId));
    
    if (!historia) {
      return res.status(404).json({
        success: false,
        error: 'História não encontrada'
      });
    }

    // Verificar se o usuário é o dono da história
    if (historia.id_usuario !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono da história pode iniciar a aventura'
      });
    }

    // ID da sala será baseado na história
    const salaId = `historia_${historiaId}`;

    // Verificar se já existe uma sessão ativa
    const sessaoExistente = await gerenciadorSessoes.obterSessao(salaId);
    
    if (sessaoExistente && sessaoExistente.status === 'iniciada') {
      return res.status(400).json({
        success: false,
        error: 'A aventura já foi iniciada para esta história'
      });
    }

    // Se já existe uma sessão mas não iniciada, atualizá-la ao invés de criar nova
    if (sessaoExistente) {
      console.log(`📝 Atualizando sessão existente para história ${historia.id}`);
      
      const dadosAtualizacao = {
        status: 'iniciada',
        iniciadaEm: new Date().toISOString(),
        estadoJogo: {
          ...sessaoExistente.estadoJogo,
          fase: 'inicio',
          mensagemMestre: mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`
        }
      };

      const sessao = await gerenciadorSessoes.atualizarSessao(salaId, dadosAtualizacao);

      // Notificar via WebSocket
      socketManager.notificarInicioAventura(salaId, {
        historiaId: historia.id,
        historiaNome: historia.nome,
        donoNome: req.user.nome,
        mensagemInicial: dadosAtualizacao.estadoJogo.mensagemMestre,
        iniciadaEm: dadosAtualizacao.iniciadaEm
      });

      console.log(`✅ Aventura iniciada com sucesso para história ${historia.id} - Sala: ${salaId}`);

      return res.status(200).json({
        success: true,
        message: 'Aventura iniciada com sucesso',
        data: {
          salaId,
          historia: {
            id: historia.id,
            nome: historia.nome,
            temas: historia.temas,
            prologo: historia.prologo
          },
          sessao: {
            status: sessao.status,
            iniciadaEm: sessao.iniciadaEm,
            estadoJogo: sessao.estadoJogo,
            maxJogadores: sessao.maxJogadores
          }
        }
      });
    }

    // Gerar o mestre (por enquanto apenas console.log como solicitado)
    console.log(`🧙‍♂️ Gerando Mestre para a história "${historia.nome}" com temas: ${historia.temas.join(', ')}`);
    
    // Aqui futuramente criaremos o mestre com IA
    // const mestre = await criarMestreRPG(historia.temas, []);

    // Criar/atualizar sessão no Redis
    const dadosSessao = {
      historiaId: historia.id,
      historiaNome: historia.nome,
      historiaTemas: historia.temas,
      historiaPrologo: historia.prologo,
      donoId: userId,
      donoNome: req.user.nome,
      maxJogadores: historia.maximo_de_participantes,
      status: 'iniciada', // Marca como iniciada para bloquear novas entradas
      jogadoresConectados: [], // Lista de usuários conectados
      iniciadaEm: new Date().toISOString(),
      estadoJogo: {
        fase: 'inicio',
        cenaAtual: 'Prólogo',
        mensagemMestre: mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`,
        npcs: [],
        ambiente: 'Início da Aventura'
      },
      mensagens: [],
      acoes: []
    };

    const sessao = await gerenciadorSessoes.criarSessao(salaId, dadosSessao);

    // Notificar via WebSocket todos os usuários conectados à sala sobre o início
    socketManager.notificarInicioAventura(salaId, {
      historiaId: historia.id,
      historiaNome: historia.nome,
      donoNome: req.user.nome,
      mensagemInicial: dadosSessao.estadoJogo.mensagemMestre,
      iniciadaEm: dadosSessao.iniciadaEm
    });

    console.log(`✅ Aventura iniciada com sucesso para história ${historia.id} - Sala: ${salaId}`);

    res.status(200).json({
      success: true,
      message: 'Aventura iniciada com sucesso',
      data: {
        salaId,
        historia: {
          id: historia.id,
          nome: historia.nome,
          temas: historia.temas,
          prologo: historia.prologo
        },
        sessao: {
          status: sessao.status,
          iniciadaEm: sessao.iniciadaEm,
          estadoJogo: sessao.estadoJogo,
          maxJogadores: sessao.maxJogadores
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar aventura:', error);
    next(error);
  }
});

/**
 * @swagger
 * /jogo/status/{historiaId}:
 *   get:
 *     summary: Obter status de uma sessão de jogo
 *     tags: [Jogo]
 *     parameters:
 *       - in: path
 *         name: historiaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da história
 *     responses:
 *       200:
 *         description: Status da sessão obtido com sucesso
 *       404:
 *         description: História ou sessão não encontrada
 */
router.get('/status/:historiaId', async (req, res, next) => {
  try {
    const { historiaId } = req.params;
    const salaId = `historia_${historiaId}`;

    // Verificar se a história existe
    const historia = await db.Historia.findById(parseInt(historiaId));
    
    if (!historia) {
      return res.status(404).json({
        success: false,
        error: 'História não encontrada'
      });
    }

    // Obter sessão se existir
    const sessao = await gerenciadorSessoes.obterSessao(salaId);

    res.status(200).json({
      success: true,
      data: {
        historia: {
          id: historia.id,
          nome: historia.nome,
          temas: historia.temas,
          maxParticipantes: historia.maximo_de_participantes,
          dono: historia.id_usuario
        },
        sessao: sessao ? {
          salaId,
          status: sessao.status,
          jogadoresConectados: sessao.jogadoresConectados || [],
          totalJogadores: sessao.jogadoresConectados?.length || 0,
          maxJogadores: sessao.maxJogadores,
          iniciadaEm: sessao.iniciadaEm || null,
          estadoJogo: sessao.estadoJogo || null
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter status da sessão:', error);
    next(error);
  }
});

export default router; 