import express from 'express';
import db from '../Model/index.js';
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'jogo' });
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/Mestre/index.js';
import socketManager from '../websocket/socketManager.js';
import { buscarTemasCompletos } from '../helpers/temasHelper.js';
import { buscarPersonagensCompletos } from '../helpers/personagensHelper.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import resumoAgent from '../agents/Resumo/ResumoAgent.js';
import { buildMestreContext, prepareMestrePayload } from '../agents/Mestre/contexto/mestreContextBuilder.js';

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
  log.info({ count: Object.keys(mapa).length }, 'Jogadores convertidos para mapa');
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

    log.info({ historiaId, userId }, 'Solicitacao para iniciar aventura');

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
      log.info({ mestreNome: mestreConfig.nome }, 'Mestre customizado carregado');
    }

    // ID da sala será baseado na história
    const salaId = `historia_${historiaId}`;

    // Arquivar sessões ativas stale no PostgreSQL (libera sala_id para nova sessão)
    try {
      await db.SessaoJogo.archiveActiveByHistoriaId(parseInt(historiaId));
    } catch (archiveErr) {
      log.warn({ err: archiveErr }, 'Erro ao arquivar sessoes stale (nao-bloqueante)');
    }

    // Verificar se já existe uma sessão ativa no Redis
    let sessaoExistente = await gerenciadorSessoes.obterSessao(salaId);

    // Se não existe no Redis, tentar restaurar do PostgreSQL (snapshot)
    if (!sessaoExistente) {
      const snapshot = await sessaoSnapshotService.obterSnapshot(salaId);
      if (snapshot && snapshot.status === 'ativa') {
        log.info({ salaId }, 'Restaurando sessao do PostgreSQL');
        sessaoExistente = await sessaoSnapshotService.restaurarSessao(salaId);
        if (sessaoExistente) {
          log.info('Sessao restaurada do banco de dados');
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
      log.info({ historiaId: historia.id }, 'Atualizando sessao existente');
      log.info({ jogadoresConectados: sessaoExistente.jogadoresConectados }, 'Jogadores conectados na sala de espera');
      
      // Buscar temas completos
      const temasCompletos = await buscarTemasCompletos(historia.temas || []);
      log.info({ temas: temasCompletos }, 'Temas completos obtidos');

      // Buscar personagens completos do banco
      const personagensIds = (sessaoExistente.jogadoresConectados || [])
        .map(j => j.personagemId)
        .filter(Boolean);
      
      const personagensCompletos = await buscarPersonagensCompletos(personagensIds);
      const personagensMap = {};
      personagensCompletos.forEach(p => {
        personagensMap[p.id] = p;
      });
      
      log.info({ count: personagensCompletos.length }, 'Personagens completos obtidos');
      
      const dadosAtualizacao = {
        status: 'iniciada',
        statusJogo: 'iniciado',
        iniciadaEm: new Date().toISOString(),
        historiaTemas: temasCompletos,
        historiaRoteiro: historia.roteiro || null,
        historiaPrologo: historia.prologo || '',
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
          mensagemMestre: mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`,
          npcs: sessaoExistente.estadoJogo?.npcs || [],
          ambiente: sessaoExistente.estadoJogo?.ambiente || 'Início da Aventura',
          cenaAtual: sessaoExistente.estadoJogo?.cenaAtual || 'Prólogo',
          compactacao: sessaoExistente.estadoJogo?.compactacao || {
            ultimaMensagemIndex: 0,
            ultimaRodadaCompactada: 0,
            ultimaCompactacaoEm: null
          }
        }
      };

      dadosAtualizacao.mestreContexto = buildMestreContext({
        ...sessaoExistente,
        ...dadosAtualizacao
      }, historia);

      const sessao = await gerenciadorSessoes.atualizarSessao(salaId, dadosAtualizacao);

      // Determinar mensagem introdutória (Prólogo ou IA)
      let mensagemIntrodutoria = '';

      // 1. Tentar usar o prólogo da história se existir
      if (historia.prologo && historia.prologo.trim().length > 0) {
        log.info('Usando prologo da historia como mensagem inicial');
        mensagemIntrodutoria = historia.prologo;
      } else {
        // 2. Fallback: Gerar mensagem de boas-vindas do Mestre IA
        try {
          log.info({ historiaNome: historia.nome }, 'Gerando mensagem de boas-vindas do Mestre');
          
          const payloadMestre = await prepareMestrePayload({
            ...sessao,
            historiaId: historia.id,
            historiaNome: historia.nome,
            historiaTemas: temasCompletos,
            historiaRoteiro: historia.roteiro || null,
            historiaPrologo: historia.prologo || '',
            personagensCompletos: personagensMap,
            mestreConfig: mestreConfig || null
          }, historia);

          const mestre = await criarMestreRPG(
            payloadMestre.nomesTemas,
            payloadMestre.personagensFormatados,
            mestreConfig,
            payloadMestre.catalogo,
            payloadMestre.roteiroCondensado,
            payloadMestre.contextoPersistenteFormatado,
            payloadMestre.mestreContexto
          );
          const boasVindas = await mestre.iniciarSessao({
            historiaNome: historia.nome,
            tema: payloadMestre.nomesTemas.join(', '),
            personagens: payloadMestre.personagensFormatados,
            cenaInicial: mensagemInicial || dadosAtualizacao.estadoJogo.mensagemMestre
          });

          mensagemIntrodutoria = boasVindas.introducao;
          log.info('Mensagem de boas-vindas gerada pelo Mestre');
        } catch (error) {
          log.error({ err: error }, 'Erro ao gerar mensagem de boas-vindas do Mestre');
          mensagemIntrodutoria = mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`;
        }
      }

      // Guardar prólogo pendente — será emitido APÓS rolagem de dados inicial
      if (mensagemIntrodutoria) {
        if (sessao.estadoJogo) {
          sessao.estadoJogo.mensagemMestre = mensagemIntrodutoria;
          sessao.estadoJogo.prologoPendente = mensagemIntrodutoria;
        }

        await gerenciadorSessoes.atualizarSessao(salaId, sessao);
        log.info('Prologo salvo como pendente (sera emitido apos rolagem de dados)');
      }

      // Notificar via WebSocket
      socketManager.notificarInicioAventura(salaId, {
        historiaId: historia.id,
        historiaNome: historia.nome,
        donoNome: req.user.nome,
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
          log.info({ jogadores: jogadoresParaClonar.length }, 'Clones de personagens criados');
        } else {
          log.warn('Nao foi possivel obter sessaoJogoRow para criar clones');
        }
      } catch (cloneError) {
        log.error({ err: cloneError }, 'Erro ao criar clones de personagens');
      }

      log.info({ historiaId: historia.id, salaId }, 'Aventura iniciada com sucesso');

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
          mestreConfig: sessao.mestreConfig || null,
            iniciadaEm: sessao.iniciadaEm,
            estadoJogo: sessao.estadoJogo,
            maxJogadores: sessao.maxJogadores
          }
        }
      });
    }

    log.info({ historiaNome: historia.nome, temas: historia.temas }, 'Gerando Mestre para a historia');
    
    // Aqui futuramente criaremos o mestre com IA
    // const mestre = await criarMestreRPG(historia.temas, []);

    // Buscar jogadores se houver sessão prévia
    let jogadoresDaSalaEspera = [];
    const sessaoPrevia = await gerenciadorSessoes.obterSessao(salaId);
    
    if (sessaoPrevia && sessaoPrevia.jogadoresConectados) {
      jogadoresDaSalaEspera = sessaoPrevia.jogadoresConectados;
      log.info({ count: jogadoresDaSalaEspera.length }, 'Preservando jogadores da sala de espera');
    }

    // Buscar temas completos
    const temasCompletos = await buscarTemasCompletos(historia.temas || []);
    log.info({ temas: temasCompletos }, 'Temas completos obtidos');

    // Buscar personagens completos do banco
    const personagensIds = jogadoresDaSalaEspera
      .map(j => j.personagemId)
      .filter(Boolean);
    
    const personagensCompletos = await buscarPersonagensCompletos(personagensIds);
    const personagensMap = {};
    personagensCompletos.forEach(p => {
      personagensMap[p.id] = p;
    });
    
    log.info({ count: personagensCompletos.length }, 'Personagens completos obtidos');

    // Criar/atualizar sessão no Redis
    const dadosSessao = {
      historiaId: historia.id,
      historiaNome: historia.nome,
      historiaTemas: temasCompletos,
      historiaRoteiro: historia.roteiro || null,
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
        ambiente: 'Início da Aventura',
        compactacao: {
          ultimaMensagemIndex: 0,
          ultimaRodadaCompactada: 0,
          ultimaCompactacaoEm: null
        }
      },
      mensagens: [],
      acoes: []
    };

    dadosSessao.mestreContexto = buildMestreContext(dadosSessao, historia);

    const sessao = await gerenciadorSessoes.criarSessao(salaId, dadosSessao);

    // Determinar mensagem introdutória (Prólogo ou IA)
    let mensagemIntrodutoria = '';

    if (historia.prologo && historia.prologo.trim().length > 0) {
      log.info('Usando prologo da historia como mensagem inicial');
      mensagemIntrodutoria = historia.prologo;
    } else {
      // Fallback: Gerar mensagem de boas-vindas do Mestre IA
      try {
        log.info({ historia: historia.nome }, 'Gerando mensagem de boas-vindas do Mestre');
        
        const payloadMestre = await prepareMestrePayload(sessao, historia);
        const mestre = await criarMestreRPG(
          payloadMestre.nomesTemas,
          payloadMestre.personagensFormatados,
          mestreConfig,
          payloadMestre.catalogo,
          payloadMestre.roteiroCondensado,
          payloadMestre.contextoPersistenteFormatado,
          payloadMestre.mestreContexto
        );
        const boasVindas = await mestre.iniciarSessao({
          historiaNome: historia.nome,
          tema: payloadMestre.nomesTemas.join(', '),
          personagens: payloadMestre.personagensFormatados,
          cenaInicial: mensagemInicial || dadosSessao.estadoJogo.mensagemMestre
        });

        mensagemIntrodutoria = boasVindas.introducao;
        log.info('Mensagem de boas-vindas gerada pelo Mestre');
      } catch (error) {
        log.error({ err: error }, 'Erro ao gerar mensagem de boas-vindas do Mestre');
        mensagemIntrodutoria = mensagemInicial || `Bem-vindos à aventura "${historia.nome}"!`;
      }
    }

    // Guardar prólogo pendente — será emitido APÓS rolagem de dados inicial
    if (mensagemIntrodutoria) {
      if (sessao.estadoJogo) {
        sessao.estadoJogo.mensagemMestre = mensagemIntrodutoria;
        sessao.estadoJogo.prologoPendente = mensagemIntrodutoria;
      }

      await gerenciadorSessoes.atualizarSessao(salaId, sessao);
      log.info('Prologo salvo como pendente (sera emitido apos rolagem de dados)');
    }

    // Notificar via WebSocket todos os usuários conectados à sala sobre o início
    socketManager.notificarInicioAventura(salaId, {
      historiaId: historia.id,
      historiaNome: historia.nome,
      donoNome: req.user.nome,
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
        log.info({ jogadores: jogadoresDaSalaEspera.length }, 'Clones de personagens criados');
      } else {
        log.warn('Nao foi possivel obter sessaoJogoRow para criar clones');
      }
    } catch (cloneError) {
      log.error({ err: cloneError }, 'Erro ao criar clones de personagens');
    }

    log.info({ historiaId: historia.id, salaId }, 'Aventura iniciada com sucesso');

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
          mestreConfig: sessao.mestreConfig || null,
          iniciadaEm: sessao.iniciadaEm,
          estadoJogo: sessao.estadoJogo,
          maxJogadores: sessao.maxJogadores
        }
      }
    });

  } catch (error) {
    log.error({ err: error }, 'Erro ao iniciar aventura');
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
          mestreConfig: sessao.mestreConfig || null,
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
    log.error({ err: error }, 'Erro ao obter status da sessao');
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

    log.info({ historiaId, userId }, 'Solicitacao para resetar sessao');

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
              log.error({ err: e, cloneId: clone.id }, 'Falha ao abandonar clone');
            }
          }
        }
        log.info({ count: clones.length }, 'Clones marcados como abandonados');
      }
    } catch (abandonError) {
      log.error({ err: abandonError }, 'Erro ao abandonar clones');
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

    log.info({ historiaId: historia.id }, 'Sessao resetada com sucesso');

    res.status(200).json({
      success: true,
      message: 'Sessão resetada com sucesso',
      data: {
        historiaId: historia.id,
        historiaNome: historia.nome
      }
    });

  } catch (error) {
    log.error({ err: error }, 'Erro ao resetar sessao');
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

    log.info({ historiaId, userId, userRole }, 'Solicitacao para encerrar sessao');

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
              log.error({ err: e, cloneId: clone.id, cloneNome: clone.nome }, 'Falha ao mesclar clone');
            }
          }
        }
        log.info({ mergeCount, totalClones: clones.length, totalXpGanho, totalItens: todosItensGanhos.length }, 'Clones de personagens mesclados');
      }
    } catch (mergeError) {
      log.error({ err: mergeError }, 'Erro ao mesclar clones');
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
          rodadasJogadas,
          userId: req.user?.id
        });
        resumoSessao = resultado.resumo;
        log.info({ mensagensResumidas: resultado.mensagensResumidas }, 'Resumo da sessao gerado com sucesso');
      }
    } catch (resumoError) {
      log.error({ err: resumoError }, 'Erro ao gerar resumo da sessao (nao-bloqueante)');
    }

    // 5. Limpeza completa do socketManager (mestresCache, roomUsers, sockets, emite evento)
    socketManager.limparSessaoCompleta(salaId, {
      resumo: resumoSessao,
      historiaNome: historia.nome,
      xpGanho: totalXpGanho,
      loot: todosItensGanhos
    });

    log.info({ historiaId: historia.id }, 'Sessao encerrada com sucesso');

    res.status(200).json({
      success: true,
      message: `Sessão da história "${historia.nome}" encerrada com sucesso`,
      data: {
        historiaId: historia.id,
        historiaNome: historia.nome
      }
    });

  } catch (error) {
    log.error({ err: error }, 'Erro ao encerrar sessao');
    next(error);
  }
});

export default router;

