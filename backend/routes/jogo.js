import express from 'express';
import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/Mestre/index.js';
import socketManager from '../websocket/socketManager.js';
import { buscarTemasCompletos, extrairNomesTemas } from '../helpers/temasHelper.js';
import { buscarPersonagensCompletos, formatarPersonagensParaMestre } from '../helpers/personagensHelper.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import resumoAgent from '../agents/Resumo/ResumoAgent.js';

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

    // Config do mestre customizado (já incluso no findById via include)
    const mestreConfig = historia.mestres || null;
    if (mestreConfig) {
      console.log(`🧙‍♂️ Mestre customizado carregado: "${mestreConfig.nome}"`);
    }

    // ID da sala será baseado na história
    const salaId = `historia_${historiaId}`;

    // Verificar se já existe uma sessão ativa no Redis
    let sessaoExistente = await gerenciadorSessoes.obterSessao(salaId);

    // Se não existe no Redis, tentar restaurar do PostgreSQL (snapshot)
    if (!sessaoExistente) {
      const snapshot = await sessaoSnapshotService.obterSnapshot(salaId);
      if (snapshot && snapshot.status === 'ativa') {
        console.log(`♻️ Restaurando sessão do PostgreSQL para ${salaId}`);
        sessaoExistente = await sessaoSnapshotService.restaurarSessao(salaId);
        if (sessaoExistente) {
          console.log(`✅ Sessão restaurada do banco de dados`);
        }
      }
    }

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
      
      // Buscar temas completos
      const temasCompletos = await buscarTemasCompletos(historia.temas || []);
      console.log(`🎨 Temas completos obtidos:`, temasCompletos);

      // Buscar personagens completos do banco
      const personagensIds = (sessaoExistente.jogadoresConectados || [])
        .map(j => j.personagemId)
        .filter(Boolean);
      
      const personagensCompletos = await buscarPersonagensCompletos(personagensIds);
      const personagensMap = {};
      personagensCompletos.forEach(p => {
        personagensMap[p.id] = p;
      });
      
      console.log(`🎭 Personagens completos obtidos: ${personagensCompletos.length}`);
      
      const dadosAtualizacao = {
        status: 'iniciada',
        statusJogo: 'iniciado',
        iniciadaEm: new Date().toISOString(),
        historiaTemas: temasCompletos,
        personagensCompletos: personagensMap,
        mestreConfig: mestreConfig || null,
        jogadores: converterJogadoresParaMapa(sessaoExistente.jogadoresConectados || []),
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

      // Determinar mensagem introdutória (Prólogo ou IA)
      let mensagemIntrodutoria = '';

      // 1. Tentar usar o prólogo da história se existir
      if (historia.prologo && historia.prologo.trim().length > 0) {
        console.log(`📜 Usando prólogo da história como mensagem inicial`);
        mensagemIntrodutoria = historia.prologo;
      } else {
        // 2. Fallback: Gerar mensagem de boas-vindas do Mestre IA
        try {
          console.log(`🎭 Gerando mensagem de boas-vindas do Mestre para história "${historia.nome}"...`);
          
          // Extrair apenas os nomes dos temas para o Mestre
          const nomesTemas = extrairNomesTemas(temasCompletos);
          
          // Formatar personagens para o Mestre
          const personagensFormatados = formatarPersonagensParaMestre(
            sessaoExistente.jogadoresConectados || [],
            personagensMap
          );
          
          const mestre = await criarMestreRPG(nomesTemas, personagensFormatados, mestreConfig);
          const boasVindas = await mestre.iniciarSessao({
            historiaNome: historia.nome,
            tema: nomesTemas.join(', '),
            personagens: personagensFormatados,
            cenaInicial: mensagemInicial || dadosAtualizacao.estadoJogo.mensagemMestre
          });

          mensagemIntrodutoria = boasVindas.introducao;
          console.log(`✅ Mensagem de boas-vindas gerada pelo Mestre`);
        } catch (error) {
          console.error('❌ Erro ao gerar mensagem de boas-vindas do Mestre:', error);
          mensagemIntrodutoria = mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`;
        }
      }

      // Salvar mensagem inicial na sessão e no Redis
      if (mensagemIntrodutoria) {
        if (!sessao.mensagens) {
          sessao.mensagens = [];
        }

        sessao.mensagens.push({
          tipo: 'mestre',
          userId: 'mestre',
          username: 'Mestre',
          mensagem: mensagemIntrodutoria,
          timestamp: Date.now()
        });

        if (sessao.estadoJogo) {
          sessao.estadoJogo.mensagemMestre = mensagemIntrodutoria;
        }

        await gerenciadorSessoes.atualizarSessao(salaId, sessao);
        console.log(`🎭 Mensagem inicial salva no Redis (Prólogo/IA)`);
      }

      // Notificar via WebSocket
      socketManager.notificarInicioAventura(salaId, {
        historiaId: historia.id,
        historiaNome: historia.nome,
        donoNome: req.user.nome,
        mensagemInicial: mensagemIntrodutoria,
        iniciadaEm: dadosAtualizacao.iniciadaEm
      });

      // Notificar mudança de fase para rolagem inicial
      socketManager.sendToRoom(salaId, 'fase_atualizada', {
        fase: 'rolagem_inicial',
        estadoJogo: dadosAtualizacao.estadoJogo,
        timestamp: Date.now()
      });

      // Criar clones dos personagens para a sessao
      try {
        // Garantir que a row no PostgreSQL existe antes de criar clones (pode não ter sido salva ainda)
        let sessaoJogoRow = await db.SessaoJogo.findBySalaId(salaId);
        if (!sessaoJogoRow) {
          sessaoJogoRow = await sessaoSnapshotService.salvarSnapshot(salaId, sessao);
        }
        if (sessaoJogoRow) {
          const jogadoresParaClonar = sessaoExistente.jogadoresConectados || [];
          for (const jogador of jogadoresParaClonar) {
            if (jogador.personagemId) {
              await db.PersonagemSessao.criarClone(
                sessaoJogoRow.id,
                parseInt(jogador.personagemId),
                parseInt(jogador.userId)
              );
            }
          }
          console.log(`📋 Clones de personagens criados para ${jogadoresParaClonar.length} jogadores`);
        } else {
          console.warn('⚠️ Não foi possível obter sessaoJogoRow para criar clones');
        }
      } catch (cloneError) {
        console.error('⚠️ Erro ao criar clones de personagens:', cloneError.message);
      }

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

    // Buscar temas completos
    const temasCompletos = await buscarTemasCompletos(historia.temas || []);
    console.log(`🎨 Temas completos obtidos:`, temasCompletos);

    // Buscar personagens completos do banco
    const personagensIds = jogadoresDaSalaEspera
      .map(j => j.personagemId)
      .filter(Boolean);
    
    const personagensCompletos = await buscarPersonagensCompletos(personagensIds);
    const personagensMap = {};
    personagensCompletos.forEach(p => {
      personagensMap[p.id] = p;
    });
    
    console.log(`🎭 Personagens completos obtidos: ${personagensCompletos.length}`);

    // Criar/atualizar sessão no Redis
    const dadosSessao = {
      historiaId: historia.id,
      historiaNome: historia.nome,
      historiaTemas: temasCompletos,
      personagensCompletos: personagensMap,
      mestreConfig: mestreConfig || null,
      historiaPrologo: historia.prologo,
      donoId: userId,
      donoNome: req.user.nome,
      maxJogadores: historia.maximo_de_participantes,
      status: 'iniciada', // Marca como iniciada para bloquear novas entradas
      statusJogo: 'iniciado', // ✅ NOVO: Atualizar statusJogo para iniciado
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

    // Determinar mensagem introdutória (Prólogo ou IA)
    let mensagemIntrodutoria = '';

    if (historia.prologo && historia.prologo.trim().length > 0) {
      console.log(`📜 Usando prólogo da história como mensagem inicial`);
      mensagemIntrodutoria = historia.prologo;
    } else {
      // Fallback: Gerar mensagem de boas-vindas do Mestre IA
      try {
        console.log(`🎭 Gerando mensagem de boas-vindas do Mestre para história "${historia.nome}"...`);
        
        // Extrair apenas os nomes dos temas para o Mestre
        const nomesTemas = extrairNomesTemas(temasCompletos);
        
        // Formatar personagens para o Mestre
        const personagensFormatados = formatarPersonagensParaMestre(
          jogadoresDaSalaEspera,
          personagensMap
        );
        
        const mestre = await criarMestreRPG(nomesTemas, personagensFormatados, mestreConfig);
        const boasVindas = await mestre.iniciarSessao({
          historiaNome: historia.nome,
          tema: nomesTemas.join(', '),
          personagens: personagensFormatados,
          cenaInicial: mensagemInicial || dadosSessao.estadoJogo.mensagemMestre
        });

        mensagemIntrodutoria = boasVindas.introducao;
        console.log(`✅ Mensagem de boas-vindas gerada pelo Mestre`);
      } catch (error) {
        console.error('❌ Erro ao gerar mensagem de boas-vindas do Mestre:', error);
        mensagemIntrodutoria = mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`;
      }
    }

    // Salvar mensagem inicial na sessão e no Redis
    if (mensagemIntrodutoria) {
      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      
      sessao.mensagens.push({
        tipo: 'mestre',
        userId: 'mestre',
        username: 'Mestre',
        mensagem: mensagemIntrodutoria,
        timestamp: Date.now()
      });
      
      // Atualizar mensagemMestre no estado do jogo também
      if (sessao.estadoJogo) {
        sessao.estadoJogo.mensagemMestre = mensagemIntrodutoria;
      }

      await gerenciadorSessoes.atualizarSessao(salaId, sessao);
      console.log(`🎭 Mensagem inicial salva no Redis (Prólogo/IA)`);
    }

    // Notificar via WebSocket todos os usuários conectados à sala sobre o início
    socketManager.notificarInicioAventura(salaId, {
      historiaId: historia.id,
      historiaNome: historia.nome,
      donoNome: req.user.nome,
      mensagemInicial: mensagemIntrodutoria,
      iniciadaEm: dadosSessao.iniciadaEm
    });

    // Notificar mudança de fase para rolagem inicial
    socketManager.sendToRoom(salaId, 'fase_atualizada', {
      fase: 'rolagem_inicial',
      estadoJogo: dadosSessao.estadoJogo,
      timestamp: Date.now()
    });

    // Criar clones dos personagens para a sessao
    try {
      // Garantir que a row no PostgreSQL existe (sessão foi criada apenas no Redis)
      let sessaoJogoRow = await db.SessaoJogo.findBySalaId(salaId);
      if (!sessaoJogoRow) {
        sessaoJogoRow = await sessaoSnapshotService.salvarSnapshot(salaId, sessao);
      }
      if (sessaoJogoRow) {
        for (const jogador of jogadoresDaSalaEspera) {
          if (jogador.personagemId) {
            await db.PersonagemSessao.criarClone(
              sessaoJogoRow.id,
              parseInt(jogador.personagemId),
              parseInt(jogador.userId)
            );
          }
        }
        console.log(`📋 Clones de personagens criados para ${jogadoresDaSalaEspera.length} jogadores`);
      } else {
        console.warn('⚠️ Não foi possível obter sessaoJogoRow para criar clones');
      }
    } catch (cloneError) {
      console.error('⚠️ Erro ao criar clones de personagens:', cloneError.message);
    }

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

    // Marcar clones como abandonados (sem merge - reset nao aplica mudancas)
    try {
      const sessaoJogoRow = await db.SessaoJogo.findBySalaId(salaId);
      if (sessaoJogoRow) {
        const clones = await db.PersonagemSessao.findBySessaoId(sessaoJogoRow.id);
        for (const clone of clones) {
          if (clone.status === 'ativa') {
            try {
              await db.PersonagemSessao.marcarAbandonada(clone.id);
            } catch (e) {
              console.error(`⚠️ Falha ao abandonar clone ${clone.id}:`, e.message);
            }
          }
        }
        console.log(`📋 ${clones.length} clones marcados como abandonados`);
      }
    } catch (abandonError) {
      console.error('⚠️ Erro ao abandonar clones:', abandonError.message);
    }

    // Excluir sessão do Redis
    await gerenciadorSessoes.excluirSessao(salaId);

    // Marcar snapshot como finalizado no PostgreSQL
    await sessaoSnapshotService.finalizarSnapshot(salaId);

    // Limpeza completa do socketManager (mestresCache, roomUsers, sockets)
    socketManager.limparSessaoCompleta(salaId);

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

/**
 * @swagger
 * /jogo/encerrar/{historiaId}:
 *   delete:
 *     summary: Encerrar sessão (dono ou superadmin) - limpeza completa
 *     tags: [Jogo]
 *     parameters:
 *       - in: path
 *         name: historiaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sessão encerrada com sucesso
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: História não encontrada
 */
router.delete('/encerrar/:historiaId', async (req, res, next) => {
  try {
    const { historiaId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`⛔ Solicitação para encerrar sessão - História: ${historiaId}, Usuário: ${userId}, Role: ${userRole}`);

    const historia = await db.Historia.findById(parseInt(historiaId));

    if (!historia) {
      return res.status(404).json({
        success: false,
        error: 'História não encontrada'
      });
    }

    // Auth: dono OU superadmin
    if (historia.id_usuario !== userId && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para encerrar esta sessão'
      });
    }

    const salaId = `historia_${historiaId}`;

    // 1. Mesclar clones de personagens (aplicar XP, itens ganhos ao personagem original)
    let totalXpGanho = 0;
    let todosItensGanhos = [];
    try {
      const sessaoJogoRow = await db.SessaoJogo.findBySalaId(salaId);
      if (sessaoJogoRow) {
        const clones = await db.PersonagemSessao.findBySessaoId(sessaoJogoRow.id);
        let mergeCount = 0;
        for (const clone of clones) {
          // Coletar XP e loot antes do merge (para o recap)
          totalXpGanho += clone.xp_ganho || 0;
          const itensClone = Array.isArray(clone.itens_ganhos) ? clone.itens_ganhos : [];
          todosItensGanhos.push(...itensClone);

          if (clone.status === 'ativa') {
            try {
              await db.PersonagemSessao.finalizarEMesclar(clone.id);
              mergeCount++;
            } catch (e) {
              console.error(`⚠️ Falha ao mesclar clone ${clone.id} (${clone.nome}):`, e.message);
            }
          }
        }
        console.log(`📋 ${mergeCount}/${clones.length} clones de personagens mesclados | XP total: ${totalXpGanho} | Itens: ${todosItensGanhos.length}`);
      }
    } catch (mergeError) {
      console.error('⚠️ Erro ao mesclar clones:', mergeError.message);
    }

    // 2. Excluir sessão do Redis
    try {
      await gerenciadorSessoes.excluirSessao(salaId);
    } catch (_) { /* sessão pode não existir no Redis */ }

    // 3. Finalizar snapshot no DB
    try {
      await sessaoSnapshotService.finalizarSnapshot(salaId);
    } catch (_) { /* snapshot pode não existir */ }

    // 4. Gerar resumo da sessão via IA (antes de limpar Redis)
    let resumoSessao = null;
    try {
      const sessaoRedis = await gerenciadorSessoes.obterSessao(salaId);
      if (sessaoRedis && sessaoRedis.mensagens && sessaoRedis.mensagens.length > 0) {
        const personagens = sessaoRedis.jogadores
          ? Object.values(sessaoRedis.jogadores).map(j => ({
              personagemNome: j.personagemNome || j.username,
              username: j.username
            }))
          : [];
        const temas = sessaoRedis.temas || historia.temas || [];
        const rodadasJogadas = sessaoRedis.estadoJogo?.rodadaAtual || 0;

        const resultado = await resumoAgent.resumirAventura({
          mensagens: sessaoRedis.mensagens,
          temas: Array.isArray(temas) ? temas : [temas],
          personagens,
          rodadasJogadas
        });
        resumoSessao = resultado.resumo;
        console.log(`📝 Resumo da sessão gerado com sucesso (${resultado.mensagensResumiadas} mensagens)`);
      }
    } catch (resumoError) {
      console.error('⚠️ Erro ao gerar resumo da sessão (não-bloqueante):', resumoError.message);
    }

    // 5. Limpeza completa do socketManager (mestresCache, roomUsers, sockets, emite evento)
    socketManager.limparSessaoCompleta(salaId, {
      resumo: resumoSessao,
      historiaNome: historia.nome,
      xpGanho: totalXpGanho,
      loot: todosItensGanhos
    });

    console.log(`✅ Sessão encerrada com sucesso para história ${historia.id}`);

    res.status(200).json({
      success: true,
      message: `Sessão da história "${historia.nome}" encerrada com sucesso`,
      data: {
        historiaId: historia.id,
        historiaNome: historia.nome
      }
    });

  } catch (error) {
    console.error('❌ Erro ao encerrar sessão:', error);
    next(error);
  }
});

export default router;