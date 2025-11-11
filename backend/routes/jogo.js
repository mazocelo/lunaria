import express from 'express';
import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/Mestre/index.js';
import socketManager from '../websocket/socketManager.js';

const router = express.Router();

/**
 * Converte array de jogadores em mapa/objeto
 * @param {Array} jogadoresArray - Array de objetos de jogadores
 * @returns {Object} Mapa de jogadores com userId como chave
 */
function converterJogadoresParaMapa(jogadoresArray) {
  const mapa = {};
  if (Array.isArray(jogadoresArray)) {
    jogadoresArray.forEach(j => {
      if (j && j.userId) {
        mapa[String(j.userId)] = {
          id: String(j.userId),
          nome: j.username || 'Jogador',
          personagemId: j.personagemId || null,
          personagemNome: j.personagemNome || null
        };
      }
    });
  }
  console.log(`✅ Convertidos ${Object.keys(mapa).length} jogadores para mapa`);
  return mapa;
}

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
router.post('/start', async (req, res, next) => {
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
      console.log(`👥 Jogadores conectados na sala de espera:`, sessaoExistente.jogadoresConectados);
      
      const dadosAtualizacao = {
        status: 'iniciada',
        iniciadaEm: new Date().toISOString(),
        // ✅ Criar mapa IMUTÁVEL de jogadores que participam
        jogadores: converterJogadoresParaMapa(sessaoExistente.jogadoresConectados || []),
        // ✅ Converter para array de IDs (dinâmico)
        jogadoresConectados: (sessaoExistente.jogadoresConectados || []).map(j => String(j.userId)),
        estadoJogo: {
          ...sessaoExistente.estadoJogo,
          fase: 'rolagem_inicial',  // ← CORRIGIDO: agora é 'rolagem_inicial'
          rodadaAtual: 1,
          turnoAtual: 0,
          ordemJogadores: [],
          rolagemInicial: {},
          contadorMensagensTurno: 0,
          historicoTurnos: [],
          cooldownRoleplay: {},
          mensagemMestre: mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`
        }
      };

      const sessao = await gerenciadorSessoes.atualizarSessao(salaId, dadosAtualizacao);

      // Gerar mensagem de boas-vindas do Mestre IA
      try {
        console.log(`🎭 Gerando mensagem de boas-vindas do Mestre para história "${historia.nome}"...`);
        
        const mestre = await criarMestreRPG(historia.temas || [], sessao.jogadoresConectados || []);
        const boasVindas = await mestre.iniciarSessao({
          historiaNome: historia.nome,
          tema: historia.temas?.join(', '),
          personagens: sessao.jogadoresConectados || [],
          cenaInicial: mensagemInicial || dadosAtualizacao.estadoJogo.mensagemMestre
        });

        console.log(`✅ Mensagem de boas-vindas gerada pelo Mestre`);

        // Salvar mensagem inicial do Mestre na sessão
        if (!sessao.mensagens) {
          sessao.mensagens = [];
        }
        
        sessao.mensagens.push({
          tipo: 'mestre',
          userId: 'mestre',
          username: 'Mestre',
          mensagem: boasVindas.introducao,
          timestamp: Date.now()
        });

        await gerenciadorSessoes.atualizarSessao(salaId, sessao);

        // Enviar mensagem de boas-vindas via WebSocket para todos na sala
        socketManager.sendToRoom(salaId, 'mensagem_mestre', {
          id: Date.now().toString(),
          userId: 'mestre',
          username: 'Mestre',
          message: boasVindas.introducao,
          tipo: 'mestre',
          timestamp: Date.now()
        });

        console.log(`🎭 Mensagem de boas-vindas enviada para sala ${salaId}`);
      } catch (error) {
        console.error('❌ Erro ao gerar mensagem de boas-vindas do Mestre:', error);
        // Continuar mesmo se falhar a geração da mensagem
      }

      // Notificar via WebSocket
      socketManager.notificarInicioAventura(salaId, {
        historiaId: historia.id,
        historiaNome: historia.nome,
        donoNome: req.user.nome,
        mensagemInicial: dadosAtualizacao.estadoJogo.mensagemMestre,
        iniciadaEm: dadosAtualizacao.iniciadaEm
      });

      // Notificar mudança de fase para rolagem inicial
      socketManager.sendToRoom(salaId, 'fase_atualizada', {
        fase: 'rolagem_inicial',
        estadoJogo: dadosAtualizacao.estadoJogo,
        timestamp: Date.now()
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

    // Buscar jogadores se houver sessão prévia
    let jogadoresDaSalaEspera = [];
    const sessaoPrevia = await gerenciadorSessoes.obterSessao(salaId);
    
    if (sessaoPrevia && sessaoPrevia.jogadoresConectados) {
      jogadoresDaSalaEspera = sessaoPrevia.jogadoresConectados;
      console.log(`✅ Preservando ${jogadoresDaSalaEspera.length} jogadores da sala de espera`);
    }

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
      // ✅ Criar mapa IMUTÁVEL de jogadores que participam
      jogadores: converterJogadoresParaMapa(jogadoresDaSalaEspera),
      // ✅ Array dinâmico de IDs dos jogadores conectados
      jogadoresConectados: jogadoresDaSalaEspera.map(j => String(j.userId)),
      iniciadaEm: new Date().toISOString(),
      estadoJogo: {
        fase: 'rolagem_inicial',  // ← CORRIGIDO: agora é 'rolagem_inicial'
        rodadaAtual: 1,
        turnoAtual: 0,
        ordemJogadores: [],
        rolagemInicial: {},
        contadorMensagensTurno: 0,
        historicoTurnos: [],
        cooldownRoleplay: {},
        cenaAtual: 'Prólogo',
        mensagemMestre: mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`,
        npcs: [],
        ambiente: 'Início da Aventura'
      },
      mensagens: [],
      acoes: []
    };

    const sessao = await gerenciadorSessoes.criarSessao(salaId, dadosSessao);

    // Gerar mensagem de boas-vindas do Mestre IA
    try {
      console.log(`🎭 Gerando mensagem de boas-vindas do Mestre para história "${historia.nome}"...`);
      
      const mestre = await criarMestreRPG(historia.temas || [], sessao.jogadoresConectados || []);
      const boasVindas = await mestre.iniciarSessao({
        historiaNome: historia.nome,
        tema: historia.temas?.join(', '),
        personagens: sessao.jogadoresConectados || [],
        cenaInicial: mensagemInicial || dadosSessao.estadoJogo.mensagemMestre
      });

      console.log(`✅ Mensagem de boas-vindas gerada pelo Mestre`);

      // Salvar mensagem inicial do Mestre na sessão
      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      
      sessao.mensagens.push({
        tipo: 'mestre',
        userId: 'mestre',
        username: 'Mestre',
        mensagem: boasVindas.introducao,
        timestamp: Date.now()
      });

      await gerenciadorSessoes.atualizarSessao(salaId, sessao);

      // Enviar mensagem de boas-vindas via WebSocket para todos na sala
      socketManager.sendToRoom(salaId, 'mensagem_mestre', {
        id: Date.now().toString(),
        userId: 'mestre',
        username: 'Mestre',
        message: boasVindas.introducao,
        tipo: 'mestre',
        timestamp: Date.now()
      });

      console.log(`🎭 Mensagem de boas-vindas enviada para sala ${salaId}`);
    } catch (error) {
      console.error('❌ Erro ao gerar mensagem de boas-vindas do Mestre:', error);
      // Continuar mesmo se falhar a geração da mensagem
    }

    // Notificar via WebSocket todos os usuários conectados à sala sobre o início
    socketManager.notificarInicioAventura(salaId, {
      historiaId: historia.id,
      historiaNome: historia.nome,
      donoNome: req.user.nome,
      mensagemInicial: dadosSessao.estadoJogo.mensagemMestre,
      iniciadaEm: dadosSessao.iniciadaEm
    });

    // Notificar mudança de fase para rolagem inicial
    socketManager.sendToRoom(salaId, 'fase_atualizada', {
      fase: 'rolagem_inicial',
      estadoJogo: dadosSessao.estadoJogo,
      timestamp: Date.now()
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
          jogadores: sessao.jogadores || {}, // Mapa IMUTÁVEL de jogadores
          jogadoresConectados: sessao.jogadoresConectados || [], // Array dinâmico de IDs
          totalJogadores: sessao.jogadores ? Object.keys(sessao.jogadores).length : 0,
          totalConectados: Array.isArray(sessao.jogadoresConectados) ? sessao.jogadoresConectados.length : 0,
          maxJogadores: sessao.maxJogadores,
          iniciadaEm: sessao.iniciadaEm || null,
          estadoJogo: sessao.estadoJogo || null,
          mensagens: sessao.mensagens || []
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter status da sessão:', error);
    next(error);
  }
});

/**
 * @swagger
 * /jogo/reset/{historiaId}:
 *   delete:
 *     summary: Resetar/zerar sessão de jogo ativa
 *     tags: [Jogo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historiaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da história
 *     responses:
 *       200:
 *         description: Sessão resetada com sucesso
 *       403:
 *         description: Apenas o dono pode resetar
 *       404:
 *         description: História ou sessão não encontrada
 */
router.delete('/reset/:historiaId', async (req, res, next) => {
  try {
    const { historiaId } = req.params;
    const userId = req.user.id;

    console.log(`🔄 Solicitação para resetar sessão - História: ${historiaId}, Usuário: ${userId}`);

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
        error: 'Apenas o dono da história pode resetar a sessão'
      });
    }

    const salaId = `historia_${historiaId}`;

    // Verificar se existe sessão ativa
    const sessaoExistente = await gerenciadorSessoes.obterSessao(salaId);
    
    if (!sessaoExistente) {
      return res.status(404).json({
        success: false,
        error: 'Nenhuma sessão ativa encontrada'
      });
    }

    // Excluir sessão do Redis
    await gerenciadorSessoes.excluirSessao(salaId);

    // Notificar todos os jogadores conectados que a sessão foi resetada
    socketManager.sendToRoom(salaId, 'sessao_resetada', {
      historiaId: historia.id,
      historiaNome: historia.nome,
      motivo: 'Sessão resetada pelo dono da história',
      timestamp: Date.now()
    });

    console.log(`✅ Sessão resetada com sucesso para história ${historia.id}`);

    res.status(200).json({
      success: true,
      message: 'Sessão resetada com sucesso',
      data: {
        historiaId: historia.id,
        historiaNome: historia.nome
      }
    });

  } catch (error) {
    console.error('❌ Erro ao resetar sessão:', error);
    next(error);
  }
});

export default router; 