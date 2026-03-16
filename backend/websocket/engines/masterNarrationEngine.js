import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'masterNarrationEngine' });

import {
  formatarContextoCombate,
  resolverMecanicaCombate,
  formatarResultadoMecanico
} from '../../helpers/combateHelper.js';
import { decrementCooldowns } from '../../helpers/cooldownManager.js';
import { decrementConcentracao } from '../../helpers/concentrationManager.js';
import { decrementEfeitos, aplicarEfeitosPorTurno } from '../../helpers/effectManager.js';
import { buildTurnState, formatTurnStateText } from '../../helpers/turnStateBuilder.js';
import { expireEfeitosTerreno, migrarEstadoTaticoLegado } from '../../helpers/estadoTatico.js';
import {
  buildNarracaoContext
} from '../../agents/Mestre/contexto/mestreInvocationContext.js';
import {
  appendMensagemSessao,
  buildJogadorMensagem,
  buildRoleplayMensagem
} from '../utils/sessionMessages.js';
import { sanitizePromptInput } from '../../helpers/sanitize.js';
import { runClaimDetection } from '../../helpers/claimDetector.js';
import {
  getTestePendente,
  criarTestePendente,
  emitirSolicitacaoTeste
} from '../utils/testePipeline.js';
import {
  getTurnState,
  transitionTurnState,
  TURN_STATUS
} from '../utils/turnStateMachine.js';
import {
  createPendingCombatAction,
  cleanupStalePendingCombatAction
} from '../utils/combatPendingAction.js';
import {
  acceptMestreRequest,
  beginRegenerateMestreRequest,
  buildMestreRequestStatusPayload,
  buildRejectedBusyStatusPayload,
  completeMestreRequest,
  emitMestreRequestStatus,
  failMestreRequest,
  getDefaultMestreRequestTimeoutMs,
  getActiveMestreRequest,
  getLatestMestreRequest,
  markMestreRequestStatus,
  normalizeExpiredActiveMestreRequest
} from '../utils/mestreRequestLifecycle.js';
import { isRoomLockBusyError as isBusyRoomLockError } from '../utils/roomLockError.js';

export default class MasterNarrationEngine {
  constructor(manager) {
    this.manager = manager;
  }

  _startRequestHeartbeat(request) {
    const sm = this.manager;
    const heartbeatState = { ...request };
    const timer = setInterval(() => {
      emitMestreRequestStatus(sm, heartbeatState.roomId, heartbeatState, {
        status: heartbeatState.status,
        updatedAt: new Date().toISOString()
      });
      sm.log('DEBUG', 'MESTRE_REQUEST_HEARTBEAT', null, heartbeatState.userId, {
        roomId: heartbeatState.roomId,
        requestId: heartbeatState.requestId,
        attempt: heartbeatState.attempt,
        status: heartbeatState.status
      });
    }, 3000);

    return {
      update(patch = {}) {
        Object.assign(heartbeatState, patch);
      },
      stop() {
        clearInterval(timer);
      }
    };
  }

  _categorizeRequestError(error) {
    const message = error?.message || '';
    if (message === 'AI_TIMEOUT' || message === 'AI_STREAM_TIMEOUT') {
      return {
        status: 'timed_out',
        errorCode: 'AI_TIMEOUT',
        errorMessage: 'A resposta do Mestre expirou antes de concluir.'
      };
    }

    return {
      status: 'failed',
      errorCode: 'MESTRE_REQUEST_FAILED',
      errorMessage: 'A resposta do Mestre falhou antes de concluir.'
    };
  }

  async _persistRequestStatus(roomId, requestId, status, patch = {}) {
    const sm = this.manager;
    let request = null;

    await sm.withRoomLock(roomId, async () => {
      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) return;
      request = markMestreRequestStatus(sessao, requestId, {
        ...patch,
        status
      });
      if (!request) return;
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
    }, { maxWaitMs: 0 });

    return request;
  }

  _emitBusy(socket, roomId, requestId, userId, activeRequest) {
    const sm = this.manager;
    const payload = buildRejectedBusyStatusPayload({
      requestId,
      roomId,
      userId,
      kind: 'player_action',
      activeRequest
    });

    socket.emit('mestre_request_status', payload);
    sm.log('WARN', 'MESTRE_REQUEST_REJECTED_BUSY', socket.id, userId, {
      roomId,
      requestId,
      activeRequestId: activeRequest?.requestId,
      activeAttempt: activeRequest?.attempt
    });
  }

  _isAuthorizedSocketUser(socket, rawUserId) {
    if (String(rawUserId) !== String(socket.userId)) {
      socket.emit('error', { message: 'userId nao corresponde ao usuario autenticado' });
      return false;
    }
    return true;
  }

  _isRoomLockBusyError(error) {
    return isBusyRoomLockError(error);
  }

  /**
   * Handler para mensagem destinada ao Mestre (IA)
   */
  async handleMensagemParaMestre(socket, data) {
    return this._handleMensagemParaMestreCorrelated(socket, data);
  }

  /* Legacy non-correlated handler intentionally disabled.
    const sm = this.manager;
    const startTime = Date.now();
    sm.log('INFO', 'MENSAGEM_PARA_MESTRE_PROCESSING_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        userId: data?.userId,
        username: data?.username,
        personagem: data?.personagem?.nome,
        mensagemLength: data?.mensagem?.length
      }
    });

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        mensagem: rawMensagem,
        personagem: rawPersonagem,
        combatIntent: rawCombatIntent
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawMensagem || !rawPersonagem) {
        sm.log('ERROR', 'MENSAGEM_PARA_MESTRE_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId,
            mensagem: !rawMensagem,
            personagem: !rawPersonagem
          }
        });
        // @event error → socket (sender) | campos obrigatórios ausentes
        socket.emit('error', { message: 'roomId, userId, mensagem e personagem são obrigatórios' });
        return;
      }

      // Validar tamanho da mensagem
      const MAX_MESSAGE_LENGTH = 5000;
      if (rawMensagem && String(rawMensagem).length > MAX_MESSAGE_LENGTH) {
        // @event erro_mensagem → socket (sender) | mensagem excede limite de caracteres
        socket.emit('erro_mensagem', { message: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Jogador';
      const mensagem = String(rawMensagem);
      const personagem = rawPersonagem;
      const combatIntent = rawCombatIntent && typeof rawCombatIntent === 'object'
        ? rawCombatIntent
        : null;

      // S-02: Rejeitar se userId do payload diverge do socket autenticado
      if (String(rawUserId) !== String(socket.userId)) {
        sm.log('WARN', 'MENSAGEM_PARA_MESTRE_USERID_MISMATCH', socket.id, socket.userId, {
          payloadUserId: rawUserId,
          socketUserId: socket.userId
        });
        socket.emit('error', { message: 'userId não corresponde ao usuário autenticado' });
        return;
      }

      // ✅ MUTEX: Garantir que apenas uma operação por vez na sala
      return await sm.withRoomLock(roomId, async () => {

      sm.log('INFO', 'MENSAGEM_PARA_MESTRE_DATA_PARSED', socket.id, userId, {
        roomId,
        username,
        personagemNome: personagem.nome,
        mensagemTruncated: mensagem.substring(0, 100)
      });

      // 1. Obter sessão da história
      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) {
        sm.log('ERROR', 'MENSAGEM_PARA_MESTRE_SESSAO_NOT_FOUND', socket.id, userId, {
          roomId
        });
        // @event error → socket (sender) | sessão não encontrada para roomId
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      // Cleanup de ação pendente de combate stale (>5 min)
      // ANTES do guard de teste pendente — se o teste associado à ação stale
      // for limpo aqui, o guard abaixo não bloqueará mais o jogador.
      const staleCleanedUp = cleanupStalePendingCombatAction(sessao);
      if (staleCleanedUp) {
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.emitirEstadoTurno(roomId, sessao);
        log.info({ roomId, userId }, 'Stale combat action cleaned up and persisted');
      }

      // ✅ GUARD: Rejeitar mensagem se dados já foram solicitados (evita solicitação duplicada)
      if (getTestePendente(sessao)) {
        sm.log('WARN', 'MENSAGEM_PARA_MESTRE_DADOS_PENDENTES', socket.id, userId, {
          roomId,
          mensagem: mensagem.substring(0, 50)
        });
        // @event erro_mensagem → socket (sender) | dados pendentes bloqueiam nova ação
        socket.emit('erro_mensagem', {
          message: 'Aguarde a rolagem de dados antes de enviar uma nova mensagem.'
        });
        return;
      }

      sm.log('INFO', 'MENSAGEM_PARA_MESTRE_SESSAO_FOUND', socket.id, userId, {
        sessaoStatus: sessao.status,
        historiaNome: sessao.historiaNome,
        totalMensagens: sessao.mensagens?.length || 0
      });

      // 2. VERIFICAR SISTEMA DE TURNOS
      const estadoJogo = sessao.estadoJogo || {};
      const fase = estadoJogo.fase;
      const combateAtualAtivo = estadoJogo.combate?.ativo || false;

      // Se o jogo está em fase de rodadas, verificar turnos
      // EXCEÇÃO: durante combate ativo, qualquer jogador vivo pode agir (combate tem seu próprio tracking via jogadoresQueAgiram)
      if (fase === 'rodada_em_andamento' && !combateAtualAtivo) {
        const turnoAtual = estadoJogo.turnoAtual || 0;
        const ordemJogadores = estadoJogo.ordemJogadores || [];

        if (ordemJogadores.length === 0) {
          sm.log('ERROR', 'MENSAGEM_PARA_MESTRE_SEM_ORDEM', socket.id, userId, {
            roomId
          });
          // @event error → socket (sender) | ordemJogadores vazia
          return socket.emit('error', { message: 'Ordem de jogadores não definida' });
        }

        const jogadorDaVez = ordemJogadores[turnoAtual];

        // Verificar se é o turno do jogador
        if (String(jogadorDaVez.userId) !== String(userId)) {
          sm.log('WARN', 'MENSAGEM_PARA_MESTRE_NAO_E_SEU_TURNO', socket.id, userId, {
            roomId,
            turnoAtual,
            jogadorDaVez: jogadorDaVez.username
          });
          // @event erro_turno → socket (sender) | não é o turno do jogador
          return socket.emit('erro_turno', {
            message: `Não é seu turno! Aguarde a vez de ${jogadorDaVez.username}`,
            jogadorDaVez: jogadorDaVez.username
          });
        }

        sm.log('INFO', 'MENSAGEM_PARA_MESTRE_TURNO_VALIDADO', socket.id, userId, {
          roomId,
          turnoAtual,
          jogador: username
        });

        transitionTurnState(sessao, TURN_STATUS.ACTIVE, {
          jogadorAtual: String(userId),
          rodadaAtual: estadoJogo.rodadaAtual || 1,
          lockReason: null
        });
      }

      // 3. Obter histórico de mensagens
      const invocationContext = buildNarracaoContext(sessao);
      const historico = invocationContext.chatHistory;
      const resumoMaisRecente = invocationContext.resumo ? { resumo: invocationContext.resumo } : null;

      // 3. Criar instância do Mestre com temas e personagens da história
      sm.log('INFO', 'MENSAGEM_PARA_MESTRE_CREATING_MESTRE', socket.id, userId, {
        temas: sessao.historiaTemas,
        jogadoresCount: sessao.jogadoresConectados?.length || 0,
        temResumo: !!resumoMaisRecente
      });

      // Obter Mestre (com cache)
      const mestre = await sm.obterMestre(
        roomId,
        sessao.historiaTemas || [],
        sessao,
        userId
      );

      // 4. Início de turno: migração legado + decrementar cooldowns, efeitos, concentração, efeitos de terreno
      migrarEstadoTaticoLegado(sessao);
      decrementCooldowns(sessao, userId);
      const pcId = String(personagem.id || personagem.personagemId);
      const efeitosExpirados = decrementEfeitos(sessao, pcId);
      const efeitosTurno = aplicarEfeitosPorTurno(sessao, pcId);
      const concExpirada = decrementConcentracao(sessao, userId);
      const efTerrenoExpirados = expireEfeitosTerreno(sessao, estadoJogo.rodadaAtual || 1);

      if (efeitosExpirados.length > 0) {
        sm.emitirAcaoMestrePersistida(roomId, sessao, {
          tipo: 'efeitos_expirados', personagem: personagem.nome,
          efeitos: efeitosExpirados.map(e => e.nome), timestamp: Date.now()
        });
      }
      if (concExpirada) {
        sm.emitirAcaoMestrePersistida(roomId, sessao, {
          tipo: 'concentracao_quebrada', personagem: personagem.nome,
          magia: concExpirada.nome, motivo: 'expirou', timestamp: Date.now()
        });
      }
      if (efTerrenoExpirados.length > 0) {
        sm.emitirAcaoMestrePersistida(roomId, sessao, {
          tipo: 'efeitos_terreno_expirados',
          efeitos: efTerrenoExpirados.map(e => e.descricao || e.elemento || 'efeito'),
          timestamp: Date.now()
        });
      }

      // Injetar contexto dinâmico do personagem + combate na ação
      let acaoComContexto = '';

      // Estado dinâmico do personagem (via turnStateBuilder)
      const turnState = buildTurnState(sessao, userId, personagem);
      acaoComContexto = formatTurnStateText(turnState) + '\n';

      const combateAtivo = estadoJogo.combate?.ativo;
      let resultadosCombatePreResolvido = null;
      if (combateAtivo) {
        // Rejeitar mensagens vagas durante combate (sem intent estruturado)
        const VALID_INTENTS = ['atacar', 'defender', 'fugir', 'usar_habilidade'];
        const intentTipo = combatIntent?.tipo;
        if (!intentTipo || !VALID_INTENTS.includes(intentTipo)) {
          log.info({ roomId, userId, intentTipo, mensagem: mensagem.substring(0, 60) }, 'Mensagem de combate sem intent valido, rejeitada');
          socket.emit('server_message', {
            userId,
            mensagem: 'Use os botoes de acao (Atacar, Defender, Fugir, Habilidades) durante o combate.'
          });
          return;
        }

        // Contexto ANTES da resolução (estado atual dos monstros/jogadores)
        const contextoCombate = formatarContextoCombate(estadoJogo.combate, userId);
        acaoComContexto += `${contextoCombate}\n`;

        // ✅ Resolver mecânica ANTES da IA para que ela narre baseada em fatos
        resultadosCombatePreResolvido = resolverMecanicaCombate(combateAtivo ? estadoJogo.combate : null, userId, sessao, personagem, combatIntent);

        // Se ação requer teste, criar teste pendente e desviar para pipeline de testes
        if (resultadosCombatePreResolvido.requerTeste) {
          const rt = resultadosCombatePreResolvido.requerTeste;
          const resumoMecanico = formatarResultadoMecanico(resultadosCombatePreResolvido, personagem.nome);
          acaoComContexto += resumoMecanico + '\n';
          acaoComContexto += `[TESTE NECESSÁRIO: ${rt.teste} DC ${rt.dcNumerico} (${rt.dificuldade}). Narre a TENTATIVA do personagem, sem revelar sucesso ou falha — o jogador ainda precisa rolar o dado.]\n`;

          // Criar teste pendente via pipeline (DC numérico para resolução exata, label para display)
          const testeCriado = criarTestePendente(sessao, {
            origem: 'combate',
            jogadorAlvo: userId,
            personagemAlvo: personagem.nome,
            teste: rt.teste,
            dificuldade: rt.dcNumerico,
            tipoDado: rt.tipoDado || 'd20',
            contexto: rt.contexto,
            metadata: { dificuldadeLabel: rt.dificuldade },
          }, userId);

          // Armazenar ação pendente de combate
          createPendingCombatAction(sessao, {
            tipo: rt.intentTipo,
            userId,
            personagem: { nome: personagem.nome, id: personagem.id, personagemId: personagem.personagemId },
            combatIntent,
            testeId: testeCriado?.id || null,
            statusEfeitos: resultadosCombatePreResolvido.statusEfeitos || [],
          });

          // NÃO setar _combatePreResolvido — será setado pós-teste
          log.info({ userId, roomId, tipo: rt.intentTipo, teste: rt.teste, dc: rt.dcNumerico, testeId: testeCriado?.id }, 'Ação de combate pendente de teste');

          sm.log('INFO', 'MENSAGEM_PARA_MESTRE_COMBATE_REQUER_TESTE', socket.id, userId, {
            roomId, intentTipo, teste: rt.teste, dc: rt.dcNumerico
          });

          // Emitir solicitação de teste após a IA narrar a tentativa (abaixo)
          // Flag para emitir após narração
          resultadosCombatePreResolvido._emitirTesteAposNarracao = { testeCriado, rt };
        } else {
          const resumoMecanico = formatarResultadoMecanico(resultadosCombatePreResolvido, personagem.nome);
          acaoComContexto += resumoMecanico + '\n';

          // Guardar para o processarAcaoCombate usar (sem re-rolar)
          sessao._combatePreResolvido = resultadosCombatePreResolvido;
        }

        sm.log('INFO', 'MENSAGEM_PARA_MESTRE_COMBATE_CONTEXTO', socket.id, userId, {
          roomId,
          intentTipo,
          monstrosVivos: estadoJogo.combate.monstros.filter(m => m.status === 'vivo').length,
          preResolvido: !resultadosCombatePreResolvido.requerTeste
        });
      }

      acaoComContexto += `Ação do jogador: "${sanitizePromptInput(mensagem)}"`;

      // 4a. Detector de alegacoes concretas (modo observacao — Fase 1)
      const personagemCompleto = (sessao.personagensCompletos || {})[pcId] || personagem;
      const claimFlags = runClaimDetection(mensagem, {
        turnState,
        personagemCompleto,
        cooldowns: sessao.estadoJogo?.cooldowns?.[String(userId)],
        // Fase 2: fontes para fatos previos
        mensagensRecentes: (sessao.mensagens || []).filter(m => m.tipo === 'mestre').slice(-50),
        memoriaSemantica: sessao.mestreContexto?.sessao?.memoriaSemantica || [],
      }, { roomId, userId });

      // 4b. Hard block — alegacoes inexistentes impedem chamada IA
      const hardBlocks = claimFlags.filter(f => f.blockLevel === 'hard');
      if (hardBlocks.length > 0) {
        const motivos = hardBlocks.map(f => f.motivo).join('; ');
        log.info({ roomId, userId, hardBlocks: hardBlocks.length, motivos }, 'claim_hard_block');

        socket.emit('server_message', {
          userId,
          mensagem: `Acao bloqueada: ${motivos}. Verifique seu inventario e habilidades.`,
        });
        return;
      }

      // 4c. Soft blocks — injetar contexto para o Mestre considerar
      const softBlocks = claimFlags.filter(f => f.blockLevel === 'soft');
      if (softBlocks.length > 0) {
        const avisos = softBlocks.map(f => {
          if (f.tipo === 'fato_previo') {
            return `[AVISO: o jogador alega "${f.claim}" — nao ha registro no historico. Narre com incerteza ou peca confirmacao.]`;
          }
          return `[AVISO: "${f.claim}" — ${f.motivo}. Candidatos: ${f.candidatos.join(', ')}]`;
        });
        acaoComContexto += '\n' + avisos.join('\n');
      }

      // @event mestre_pensando → room (broadcast) | indica que o Mestre começou a processar
      sm.sendToRoom(roomId, 'mestre_pensando', { ativo: true, timestamp: Date.now() });

      // 5. Narrar ação do jogador (COM FALLBACK SE IA FALHAR)
      sm.log('INFO', 'MENSAGEM_PARA_MESTRE_INVOKING_IA', socket.id, userId, {
        jogador: username,
        personagem: personagem.nome,
        historicoLength: historico.length,
        usandoResumo: !!resumoMaisRecente,
        combateAtivo: !!combateAtivo
      });

      let resposta;
      try {
        const streamMsgId = `mestre_stream_${Date.now()}_${roomId}`;

        resposta = await mestre.narrarAcaoStream({
          jogador: username,
          personagem: personagem.nome,
          acao: acaoComContexto,
          chatHistory: historico,
          resumo: resumoMaisRecente?.resumo || null,
          contextoLateralRoleplay: invocationContext.contextoLateralRoleplay,
          lockContinuidade: invocationContext.lockContinuidade
        }, {
          onStreamStart: () => sm.sendToRoom(roomId, 'mestre_stream_start', { streamId: streamMsgId, timestamp: Date.now() }),
          onChunk: (delta, accumulated) => sm.sendToRoom(roomId, 'mestre_stream_chunk', { streamId: streamMsgId, delta, accumulated, timestamp: Date.now() }),
          onStreamEnd: () => sm.sendToRoom(roomId, 'mestre_stream_end', { streamId: streamMsgId, timestamp: Date.now() }),
          onError: () => sm.sendToRoom(roomId, 'mestre_stream_error', { streamId: streamMsgId, timestamp: Date.now() })
        });

        sm.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_IA_RESPONDED', socket.id, userId, {
          narracaoLength: resposta.narracao?.length || 0
        });
      } catch (errorIA) {
        log.error({ err: errorIA }, 'Erro na IA ao narrar acao');

        sm.log('ERROR', 'MENSAGEM_PARA_MESTRE_IA_FAILED', socket.id, userId, {
          error: errorIA.message,
          stack: errorIA.stack
        });

        // ✅ FALLBACK: Resposta simples — auto-avançar turno se já houve 2+ mensagens
        const turnoAtualFallback = getTurnState(sessao);
        const contadorFallback = turnoAtualFallback.contadorInteracoes || 0;
        const primeiroIntercambioCalmo = !combateAtivo && !combatIntent && contadorFallback === 0;
        resposta = {
          narracao: `**${personagem.nome}** ${mensagem}.\n\n*O Mestre faz uma pausa...* O que acontece a seguir?`,
          fimDeTurno: primeiroIntercambioCalmo ? false : contadorFallback >= 2,
          solicitaDados: { solicita: false },
          acaoCompleta: primeiroIntercambioCalmo ? false : contadorFallback >= 2
        };

        sm.log('INFO', 'MENSAGEM_PARA_MESTRE_USANDO_FALLBACK', socket.id, userId, {
          mensagemFallback: resposta.narracao
        });
      }

      // 5a. Revisão pós-IA (Árbitro Mecânico + Continuista)
      try {
        const { executarRevisao } = await import('../../agents/Revisores/index.js');
        const reviewResult = await executarRevisao({
          combateAtivo,
          resultadosCombatePreResolvido,
          respostaIA: resposta,
          acaoJogador: mensagem,
          sessao,
          userId,
          claimFlags,
        });
        if (reviewResult.reviewed) {
          if (!reviewResult.passed && reviewResult.corrections?.narrativa) {
            resposta.narracao = reviewResult.corrections.narrativa;
          }
          if (reviewResult.verdicts) {
            resposta._reviewVerdicts = reviewResult.verdicts;
          }
        }
      } catch (reviewErr) {
        log.warn({ err: reviewErr.message }, 'Revisao pos-IA falhou (fail-open)');
      }

      // 5. Salvar mensagem do jogador na sessão
      const mensagemJogador = buildJogadorMensagem({
        userId,
        username,
        personagem: personagem.nome,
        message: mensagem,
        origem: combateAtivo ? 'combate' : 'turno'
      });
      appendMensagemSessao(sessao, mensagemJogador);

      // 6. Salvar resposta do mestre na sessão
      const mensagemMestre = sm.buildMestreMensagem(resposta.narracao, sessao.mestreConfig, {
        sessao,
        segmentos: resposta.segmentos || []
      });
      appendMensagemSessao(sessao, mensagemMestre);
      await sm.aplicarMetadadosNarrativos(roomId, sessao, resposta.metadados || {});

      // 7. Atualizar sessão no Redis
      sessao.atualizadaEm = new Date().toISOString();
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      // Snapshot periodico (a cada 10 mensagens)
      sm._tentarSnapshot(roomId, sessao);

      sm.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_SESSAO_UPDATED', socket.id, userId, {
        roomId,
        totalMensagens: sessao.mensagens.length
      });

      // @event chat_message → room (broadcast) | echo da mensagem do jogador para todos
      sm.sendToRoom(roomId, 'chat_message', {
        ...mensagemJogador,
        message: mensagemJogador.message
      });

      // @event mensagem_mestre → room (broadcast) | resposta narrativa do Mestre IA
      sm.sendToRoom(roomId, 'mensagem_mestre', {
        ...mensagemMestre,
        message: resposta.narracao
      });

      // @event mestre_pensando → room (broadcast) | indica que o Mestre terminou de processar
      sm.sendToRoom(roomId, 'mestre_pensando', { ativo: false, timestamp: Date.now() });

      // Se há teste pendente de combate, emitir solicitação de teste (antes do dispatcher)
      if (resultadosCombatePreResolvido?._emitirTesteAposNarracao) {
        const { testeCriado, rt } = resultadosCombatePreResolvido._emitirTesteAposNarracao;
        emitirSolicitacaoTeste(sm, roomId, sessao, {
          narrativa: resposta.narracao || '',
          tipoDado: rt.tipoDado || 'd20',
          teste: rt.teste,
          dificuldade: rt.dificuldade, // label para display
          contexto: rt.contexto,
          origem: 'combate',
          testePendente: testeCriado,
        });
        log.info({ userId, roomId, testeId: testeCriado?.id }, 'Solicitação de teste de combate emitida após narração');
      }

      // ✅ DESPACHAR RESPOSTA DA IA (combate, ações, dados, turnos)
      const { despacharResposta } = await import('../utils/respostaDispatcher.js');
      await despacharResposta(resposta, {
        roomId, userId, username, personagem, mensagem, sessao,
        socket, sm, fase, combateAtivo
      });
      sm.emitirEstadoTurno(roomId, sessao);

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_COMPLETED', socket.id, userId, {
        roomId,
        jogador: username,
        personagem: personagem.nome,
        processingTimeMs: processingTime
      });

      }); // fecha withRoomLock

    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'MENSAGEM_PARA_MESTRE_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      // @event mestre_pensando → room (broadcast) | garantir OFF em caso de erro
      if (data?.roomId) sm.sendToRoom(String(data.roomId), 'mestre_pensando', { ativo: false, timestamp: Date.now() });
      // @event error → socket (sender) | erro inesperado no processamento de mensagem
      socket.emit('error', { message: 'Erro ao processar mensagem para o mestre' });
    }

    */
  async _handleMensagemParaMestreCorrelated(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();
    const {
      roomId: rawRoomId,
      userId: rawUserId,
      username: rawUsername,
      mensagem: rawMensagem,
      personagem: rawPersonagem,
      combatIntent: rawCombatIntent,
      requestId: rawRequestId
    } = data || {};

    if (!rawRoomId || !rawUserId || !rawMensagem || !rawPersonagem || !rawRequestId) {
      socket.emit('error', { message: 'roomId, userId, mensagem, personagem e requestId sao obrigatorios' });
      return;
    }

    if (!this._isAuthorizedSocketUser(socket, rawUserId)) {
      return;
    }

    const MAX_MESSAGE_LENGTH = 5000;
    if (String(rawMensagem).length > MAX_MESSAGE_LENGTH) {
      socket.emit('erro_mensagem', { message: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` });
      return;
    }

    const roomId = String(rawRoomId);
    const userId = String(rawUserId);
    const username = rawUsername ? String(rawUsername) : 'Jogador';
    const mensagem = String(rawMensagem);
    const personagem = rawPersonagem;
    const combatIntent = rawCombatIntent && typeof rawCombatIntent === 'object' ? rawCombatIntent : null;
    const requestId = String(rawRequestId);

    let accepted = null;
    try {
      accepted = await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          socket.emit('error', { message: 'Sessao nao encontrada' });
          return null;
        }

      const expiredRequest = normalizeExpiredActiveMestreRequest(sessao);
      if (expiredRequest) {
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        emitMestreRequestStatus(sm, roomId, expiredRequest, {
          status: expiredRequest.status,
          errorCode: expiredRequest.errorCode,
          errorMessage: expiredRequest.errorMessage
        });
      }

      const staleCleanedUp = cleanupStalePendingCombatAction(sessao);
      if (staleCleanedUp) {
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.emitirEstadoTurno(roomId, sessao);
      }

      const fase = sessao.estadoJogo?.fase;
      const combateAtivo = !!sessao.estadoJogo?.combate?.ativo;
      const turnoState = getTurnState(sessao);
      const pendingTest = getTestePendente(sessao, {
        userId,
        groupId: turnoState.loteTesteAtivo
      });

      if (pendingTest) {
        socket.emit('erro_mensagem', { message: 'Resolva o teste pendente antes de enviar uma nova acao.' });
        return null;
      }

      if (fase === 'rodada_em_andamento' && !combateAtivo) {
        if (turnoState.jogadorAtual && String(turnoState.jogadorAtual) !== String(userId)) {
          socket.emit('erro_turno', { message: 'Nao e seu turno!' });
          return null;
        }
        if (!['active', 'awaiting_roll', 'resolving_roll'].includes(turnoState.status)) {
          socket.emit('erro_turno', { message: 'Inicie seu turno antes de agir.' });
          return null;
        }
      }

      let acceptedRequest;
      try {
        const acceptedResult = acceptMestreRequest(sessao, {
          requestId,
          kind: 'player_action',
          roomId,
          userId,
          username,
          personagem,
          originalMessage: mensagem,
          combatIntent,
          playerMessageId: null,
          timeoutMs: getDefaultMestreRequestTimeoutMs('player_action')
        });
        acceptedRequest = acceptedResult.request;
        if (acceptedResult.duplicate) {
          if (!['completed', 'failed', 'timed_out', 'superseded'].includes(acceptedRequest.status)) {
            sm.sendToRoom(roomId, 'mestre_pensando', {
              ativo: true,
              timestamp: Date.now(),
              requestId,
              attempt: acceptedRequest.attempt
            });
          }
          emitMestreRequestStatus(sm, roomId, acceptedRequest);
          return { duplicate: true, alreadyInFlight: true, request: acceptedRequest, sessao };
        }
      } catch (error) {
        if (error.code === 'MESTRE_REQUEST_BUSY') {
          this._emitBusy(socket, roomId, requestId, userId, error.activeRequest);
          return null;
        }
        throw error;
      }

      const mensagemJogador = buildJogadorMensagem({
        userId,
        username,
        personagem: personagem.nome,
        message: mensagem,
        origem: combateAtivo ? 'combate' : 'turno',
        extraFields: {
          requestId,
          attempt: acceptedRequest.attempt
        }
      });
      acceptedRequest.playerMessageId = mensagemJogador.id;
      appendMensagemSessao(sessao, mensagemJogador);
      markMestreRequestStatus(sessao, requestId, {
        playerMessageId: mensagemJogador.id
      });

      sessao.atualizadaEm = new Date().toISOString();
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
      sm._tentarSnapshot(roomId, sessao);

      sm.sendToRoom(roomId, 'chat_message', {
        ...mensagemJogador,
        message: mensagemJogador.message,
        requestId,
        attempt: acceptedRequest.attempt
      });
      sm.sendToRoom(roomId, 'mestre_pensando', {
        ativo: true,
        timestamp: Date.now(),
        requestId,
        attempt: acceptedRequest.attempt
      });
      emitMestreRequestStatus(sm, roomId, acceptedRequest);

        return {
          sessao,
          fase,
          combateAtivo,
          request: acceptedRequest,
          duplicate: false
        };
      }, { maxWaitMs: 0 });
    } catch (error) {
      if (this._isRoomLockBusyError(error)) {
        const sessao = await sm.obterSessaoHistoria(roomId);
        const activeRequest = getActiveMestreRequest(sessao || {});
        this._emitBusy(socket, roomId, requestId, userId, activeRequest || null);
        return;
      }
      throw error;
    }

    if (!accepted || accepted.duplicate || accepted.alreadyInFlight) {
      return;
    }

    this._processAcceptedPlayerActionRequest(socket, {
      roomId,
      userId,
      username,
      mensagem,
      personagem,
      combatIntent,
      fase: accepted.fase,
      combateAtivo: accepted.combateAtivo,
      sessao: accepted.sessao,
      request: accepted.request,
      startTime
    });
  }

  async _processAcceptedPlayerActionRequest(socket, ctx) {
    const sm = this.manager;
    const {
      roomId,
      userId,
      username,
      mensagem,
      personagem,
      combatIntent,
      fase,
      combateAtivo,
      startTime
    } = ctx;
    const requestId = ctx.request.requestId;
    const attempt = ctx.request.attempt;
    const heartbeat = this._startRequestHeartbeat(ctx.request);
    const workingSessao = ctx.sessao;

    try {
      const processingRequest = await this._persistRequestStatus(roomId, requestId, 'processing');
      if (processingRequest) {
        heartbeat.update(processingRequest);
        emitMestreRequestStatus(sm, roomId, processingRequest);
      }

      const invocationContext = buildNarracaoContext(workingSessao, userId);
      const mestre = await sm.obterMestre(roomId, workingSessao.historiaTemas || [], workingSessao, userId);

      decrementCooldowns(workingSessao, userId);
      decrementConcentracao(workingSessao, userId);
      decrementEfeitos(workingSessao, userId);
      aplicarEfeitosPorTurno(workingSessao, userId);
      expireEfeitosTerreno(workingSessao);
      migrarEstadoTaticoLegado(workingSessao);

      const sources = {
        inventario: invocationContext.personagem?.inventario || invocationContext.personagem?.equipamentos || [],
        habilidadesClasse: invocationContext.personagem?.habilidadesClasse || [],
        magias: invocationContext.personagem?.magias || [],
        manaAtual: invocationContext.runtime?.mana_atual ?? invocationContext.personagem?.mana_atual ?? null,
        cooldowns: invocationContext.runtime?.cooldowns || {},
        mensagensRecentes: invocationContext.mensagensRecentes || [],
        memoriaSemantica: invocationContext.memoriaSemantica || []
      };

      const claimResult = runClaimDetection(mensagem, sources, {
        userId,
        roomId,
        personagem: personagem?.nome || username
      });
      const claimFlags = claimResult?.claimFlags || [];
      const blockingClaim = claimFlags.find((flag) => flag?.blockLevel === 'hard');
      if (blockingClaim) {
        await sm.withRoomLock(roomId, async () => {
          const sessaoAtual = await sm.obterSessaoHistoria(roomId);
          const activeRequest = getActiveMestreRequest(sessaoAtual || {});
          if (!sessaoAtual || !activeRequest || activeRequest.requestId !== requestId || Number(activeRequest.attempt || 0) !== Number(attempt)) {
            return;
          }

          const completed = completeMestreRequest(sessaoAtual, requestId, attempt);
          await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtual);
          sm.sendToRoom(roomId, 'mestre_pensando', { ativo: false, timestamp: Date.now(), requestId, attempt });
          emitMestreRequestStatus(sm, roomId, completed, { status: 'completed' });
        }, { maxWaitMs: 0 });

        socket.emit('erro_mensagem', { message: blockingClaim.reason || 'A acao nao pode prosseguir como descrita.' });
        heartbeat.stop();
        return;
      }

      const turnStateText = formatTurnStateText(buildTurnState(workingSessao, userId, personagem));
      let resultadosCombatePreResolvido = null;
      if (combateAtivo && combatIntent) {
        resultadosCombatePreResolvido = await resolverMecanicaCombate(workingSessao, {
          roomId,
          userId,
          username,
          personagem,
          mensagem,
          combatIntent,
          turnStateText
        });
      }

      const contextoCombate = combateAtivo
        ? formatarContextoCombate(workingSessao, userId, resultadosCombatePreResolvido, turnStateText)
        : '';

      const promptAcao = sanitizePromptInput(mensagem, 2000);
      let resposta = await mestre.narrarAcaoStream({
        jogador: username,
        personagem: personagem.nome,
        acao: contextoCombate
          ? `${promptAcao}\n\n[CONTEXTO COMBATE]\n${contextoCombate}`
          : promptAcao,
        chatHistory: invocationContext.chatHistory,
        resumo: invocationContext.resumo,
        contextoLateralRoleplay: invocationContext.contextoLateralRoleplay,
        lockContinuidade: invocationContext.lockContinuidade,
        runtimeOptions: {
          historiaConfig: workingSessao.historiaConfig || null,
          retryOnTimeout: false,
          throwOnFailure: true
        }
      }, {
        onStreamStart: async () => {
          heartbeat.update({ status: 'streaming' });
          const streamingRequest = await this._persistRequestStatus(roomId, requestId, 'streaming');
          if (streamingRequest) heartbeat.update(streamingRequest);
          sm.sendToRoom(roomId, 'mestre_stream_start', {
            requestId,
            streamId: `stream_${requestId}_${attempt}`,
            attempt,
            timestamp: Date.now()
          });
          emitMestreRequestStatus(sm, roomId, streamingRequest || ctx.request, { status: 'streaming' });
        },
        onChunk: (delta, accumulated) => {
          sm.sendToRoom(roomId, 'mestre_stream_chunk', {
            requestId,
            streamId: `stream_${requestId}_${attempt}`,
            attempt,
            delta,
            accumulated,
            timestamp: Date.now()
          });
        },
        onStreamEnd: () => {
          sm.sendToRoom(roomId, 'mestre_stream_end', {
            requestId,
            streamId: `stream_${requestId}_${attempt}`,
            attempt,
            timestamp: Date.now()
          });
        },
        onError: (error) => {
          sm.sendToRoom(roomId, 'mestre_stream_error', {
            requestId,
            streamId: `stream_${requestId}_${attempt}`,
            attempt,
            errorCode: error?.message || 'STREAM_ERROR',
            timestamp: Date.now()
          });
        }
      });

      try {
        const reviewingRequest = await this._persistRequestStatus(roomId, requestId, 'reviewing');
        if (reviewingRequest) {
          heartbeat.update(reviewingRequest);
          emitMestreRequestStatus(sm, roomId, reviewingRequest);
        }

        const { executarRevisao } = await import('../../agents/Revisores/index.js');
        const reviewResult = await executarRevisao({
          combateAtivo,
          resultadosCombatePreResolvido,
          respostaIA: resposta,
          acaoJogador: mensagem,
          sessao: workingSessao,
          userId,
          claimFlags
        });
        if (reviewResult.reviewed && !reviewResult.passed && reviewResult.corrections?.narrativa) {
          resposta.narracao = reviewResult.corrections.narrativa;
        }
        if (reviewResult.reviewed && reviewResult.verdicts) {
          resposta._reviewVerdicts = reviewResult.verdicts;
        }
      } catch (reviewErr) {
        log.warn({ err: reviewErr.message }, 'Revisao pos-IA falhou (fail-open)');
      }

      await sm.withRoomLock(roomId, async () => {
        const sessaoAtual = await sm.obterSessaoHistoria(roomId);
        const activeRequest = getActiveMestreRequest(sessaoAtual || {});
        if (!sessaoAtual || !activeRequest || activeRequest.requestId !== requestId || Number(activeRequest.attempt || 0) !== Number(attempt)) {
          sm.log('WARN', 'MESTRE_REQUEST_LATE_RESULT_DROPPED', socket.id, userId, {
            roomId,
            requestId,
            attempt
          });
          return;
        }

        const narrativa = resposta.narracao || '';
        const mensagemMestre = sm.buildMestreMensagem(narrativa, workingSessao.mestreConfig, {
          sessao: workingSessao,
          segmentos: resposta.segmentos || [],
          extraFields: {
            requestId,
            attempt
          }
        });
        appendMensagemSessao(workingSessao, mensagemMestre);
        await sm.aplicarMetadadosNarrativos(roomId, workingSessao, resposta.metadados || {});

        if (resultadosCombatePreResolvido?._emitirTesteAposNarracao) {
          const { testeCriado, rt } = resultadosCombatePreResolvido._emitirTesteAposNarracao;
          emitirSolicitacaoTeste(sm, roomId, workingSessao, {
            narrativa: narrativa || '',
            tipoDado: rt.tipoDado || 'd20',
            teste: rt.teste,
            dificuldade: rt.dificuldade,
            contexto: rt.contexto,
            origem: 'combate',
            testePendente: testeCriado
          });
        }

        const { despacharResposta } = await import('../utils/respostaDispatcher.js');
        await despacharResposta(resposta, {
          roomId,
          userId,
          username,
          personagem,
          mensagem,
          sessao: workingSessao,
          socket,
          sm,
          fase,
          combateAtivo
        });

        const completedRequest = completeMestreRequest(workingSessao, requestId, attempt);
        workingSessao.atualizadaEm = new Date().toISOString();
        await sm.gerenciadorSessoes.atualizarSessao(roomId, workingSessao);
        sm._tentarSnapshot(roomId, workingSessao);
        sm.emitirEstadoTurno(roomId, workingSessao);

        sm.sendToRoom(roomId, 'mensagem_mestre', {
          ...mensagemMestre,
          message: narrativa,
          requestId,
          attempt
        });
        sm.sendToRoom(roomId, 'mestre_pensando', {
          ativo: false,
          timestamp: Date.now(),
          requestId,
          attempt
        });
        emitMestreRequestStatus(sm, roomId, completedRequest, { status: 'completed' });
      }, { maxWaitMs: 0 });

      sm.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_COMPLETED', socket.id, userId, {
        roomId,
        requestId,
        attempt,
        processingTimeMs: Date.now() - startTime
      });
    } catch (error) {
      const failure = this._categorizeRequestError(error);
      heartbeat.update({
        status: failure.status,
        errorCode: failure.errorCode,
        errorMessage: failure.errorMessage
      });

      await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        const activeRequest = getActiveMestreRequest(sessao || {});
        if (!sessao || !activeRequest || activeRequest.requestId !== requestId || Number(activeRequest.attempt || 0) !== Number(attempt)) {
          return;
        }

        const failedRequest = failMestreRequest(sessao, requestId, attempt, failure.status, {
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage
        });
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.emitirEstadoTurno(roomId, sessao);
        sm.sendToRoom(roomId, 'mestre_pensando', {
          ativo: false,
          timestamp: Date.now(),
          requestId,
          attempt
        });
        emitMestreRequestStatus(sm, roomId, failedRequest, {
          status: failure.status,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage
        });
      }, { maxWaitMs: 0 });

      socket.emit('erro_mensagem', { message: failure.errorMessage });
      sm.log('ERROR', 'MENSAGEM_PARA_MESTRE_ERROR', socket.id, userId, {
        roomId,
        requestId,
        attempt,
        error: error.message,
        stack: error.stack,
        processingTimeMs: Date.now() - startTime
      });
    } finally {
      heartbeat.stop();
    }
  }

  async handleConsultarMestreRequest(socket, data) {
    const sm = this.manager;
    const { roomId: rawRoomId, userId: rawUserId, requestId: rawRequestId } = data || {};
    if (!rawRoomId || !rawUserId || !rawRequestId) {
      socket.emit('erro_mensagem', { message: 'roomId, userId e requestId sao obrigatorios para consultar status.' });
      return;
    }

    if (!this._isAuthorizedSocketUser(socket, rawUserId)) {
      return;
    }

    const roomId = String(rawRoomId);
    const userId = String(rawUserId);
    const requestId = String(rawRequestId);
    const sessao = await sm.obterSessaoHistoria(roomId);
    if (!sessao) return;

    const expiredRequest = normalizeExpiredActiveMestreRequest(sessao);
    if (expiredRequest) {
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
      emitMestreRequestStatus(sm, roomId, expiredRequest, {
        status: expiredRequest.status,
        errorCode: expiredRequest.errorCode,
        errorMessage: expiredRequest.errorMessage
      });
    }

    const request = getLatestMestreRequest(sessao, requestId);
    if (!request || String(request.userId) !== String(userId)) {
      socket.emit('erro_mensagem', { message: 'Nao foi encontrada uma resposta ativa ou regeneravel para esta requisicao.' });
      return;
    }

    socket.emit('mestre_request_status', buildMestreRequestStatusPayload(request));
  }

  async handleRegenerarRespostaMestre(socket, data) {
    const sm = this.manager;
    const { roomId: rawRoomId, userId: rawUserId, requestId: rawRequestId } = data || {};
    if (!rawRoomId || !rawUserId || !rawRequestId) {
      socket.emit('erro_mensagem', { message: 'roomId, userId e requestId sao obrigatorios para regenerar.' });
      return false;
    }

    if (!this._isAuthorizedSocketUser(socket, rawUserId)) {
      return false;
    }

    const roomId = String(rawRoomId);
    const userId = String(rawUserId);
    const requestId = String(rawRequestId);

    let accepted = null;
    try {
      await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          socket.emit('erro_mensagem', { message: 'Sessao nao encontrada.' });
          return;
        }

      const expiredRequest = normalizeExpiredActiveMestreRequest(sessao);
      if (expiredRequest) {
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        emitMestreRequestStatus(sm, roomId, expiredRequest, {
          status: expiredRequest.status,
          errorCode: expiredRequest.errorCode,
          errorMessage: expiredRequest.errorMessage
        });
      }

      const existing = getLatestMestreRequest(sessao, requestId);
      if (!existing) {
        socket.emit('erro_mensagem', { message: 'Requisicao do Mestre nao encontrada.' });
        return;
      }

      if (existing.kind === 'turn_start') {
        accepted = { delegated: true };
        return;
      }

      try {
        const regenerated = beginRegenerateMestreRequest(sessao, requestId, userId);
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.sendToRoom(roomId, 'mestre_pensando', {
          ativo: true,
          timestamp: Date.now(),
          requestId,
          attempt: regenerated.attempt
        });
        emitMestreRequestStatus(sm, roomId, regenerated);

        accepted = {
          roomId,
          userId,
          username: regenerated.username || socket.username || 'Jogador',
          mensagem: regenerated.originalMessage,
          personagem: regenerated.personagem,
          combatIntent: regenerated.combatIntent,
          requestId,
          fase: sessao.estadoJogo?.fase,
          combateAtivo: !!sessao.estadoJogo?.combate?.ativo,
          sessao,
          request: regenerated,
          startTime: Date.now()
        };
      } catch (error) {
        if (error.code === 'MESTRE_REQUEST_BUSY') {
          this._emitBusy(socket, roomId, requestId, userId, error.activeRequest);
          return;
        }

        const message = error.code === 'MESTRE_REQUEST_NOT_REGENERATABLE'
          ? 'A resposta do Mestre ainda nao pode ser regenerada.'
          : 'Nao foi possivel regenerar a resposta do Mestre.';
        socket.emit('erro_mensagem', { message });
      }
      }, { maxWaitMs: 0 });
    } catch (error) {
      if (this._isRoomLockBusyError(error)) {
        const sessao = await sm.obterSessaoHistoria(roomId);
        const activeRequest = getActiveMestreRequest(sessao || {});
        this._emitBusy(socket, roomId, requestId, userId, activeRequest || null);
        return false;
      }
      throw error;
    }

    if (accepted?.delegated) {
      return sm.turnEngine.handleRegenerarMestreRequest(socket, data);
    }

    if (accepted) {
      this._processAcceptedPlayerActionRequest(socket, accepted);
      return true;
    }

    return false;
  }

  /**
   * Handler para mensagem roleplay (jogadores fora do turno)
   */
  async handleMensagemRoleplay(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();
    sm.log('INFO', 'MENSAGEM_ROLEPLAY_PROCESSING_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        userId: data?.userId,
        username: data?.username,
        mensagemLength: data?.mensagem?.length
      }
    });

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        mensagem: rawMensagem
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawMensagem) {
        sm.log('ERROR', 'MENSAGEM_ROLEPLAY_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId,
            mensagem: !rawMensagem
          }
        });
        // @event error → socket (sender) | campos obrigatórios ausentes (roleplay)
        socket.emit('error', { message: 'roomId, userId e mensagem são obrigatórios' });
        return;
      }

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
        // @event error → socket (sender) | userId não corresponde ao autenticado
        socket.emit('error', { message: 'userId não corresponde ao usuário autenticado.', code: 'USER_MISMATCH' });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : socket.username || 'Jogador';
      const mensagem = String(rawMensagem);

      sm.log('INFO', 'MENSAGEM_ROLEPLAY_DATA_PARSED', socket.id, userId, {
        roomId,
        username,
        mensagemTruncated: mensagem.substring(0, 100)
      });

      await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          sm.log('ERROR', 'MENSAGEM_ROLEPLAY_SESSAO_NOT_FOUND', socket.id, userId, {
            roomId
          });
          // @event error → socket (sender) | sessão não encontrada (roleplay)
          socket.emit('error', { message: 'Sessão não encontrada' });
          return;
        }

        const estadoJogo = sessao.estadoJogo || {};
        const cooldownRoleplay = estadoJogo.cooldownRoleplay || {};
        const ultimoEnvio = cooldownRoleplay[userId];
        const agora = Date.now();
        const cooldownSegundos = 12;
        const restante = ultimoEnvio
          ? Math.max(0, cooldownSegundos - Math.floor((agora - new Date(ultimoEnvio).getTime()) / 1000))
          : 0;

        if (restante > 0) {
          sm.log('WARN', 'MENSAGEM_ROLEPLAY_COOLDOWN_ATIVO', socket.id, userId, {
            roomId,
            cooldownRestante: restante
          });
          // @event erro_cooldown_roleplay → socket (sender) | cooldown de roleplay ativo
          socket.emit('erro_cooldown_roleplay', {
            message: `Aguarde ${restante} segundos antes de enviar outra mensagem roleplay`,
            segundosRestantes: restante
          });
          return;
        }

        cooldownRoleplay[userId] = new Date(agora).toISOString();
        estadoJogo.cooldownRoleplay = cooldownRoleplay;
        sessao.estadoJogo = estadoJogo;

        const mensagemRoleplay = buildRoleplayMensagem({
          userId,
          username,
          message: mensagem,
          payload: {
            cena: estadoJogo.turno?.rodadaAtual || estadoJogo.rodadaAtual || 1
          }
        });

        appendMensagemSessao(sessao, mensagemRoleplay);
        sessao.roleplayRecente = [...(sessao.roleplayRecente || []), mensagemRoleplay].slice(-20);

        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

        sm.log('SUCCESS', 'MENSAGEM_ROLEPLAY_SALVA', socket.id, userId, {
          roomId,
          totalMensagens: sessao.mensagens.length
        });

        // @event mensagem_roleplay → room (broadcast) | mensagem roleplay para todos na sala
        sm.sendToRoom(roomId, 'mensagem_roleplay', {
          ...mensagemRoleplay,
          message: mensagemRoleplay.message
        });
      });

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'MENSAGEM_ROLEPLAY_COMPLETED', socket.id, userId, {
        roomId,
        jogador: username,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'MENSAGEM_ROLEPLAY_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      // @event error → socket (sender) | erro inesperado no roleplay
      socket.emit('error', { message: 'Erro ao processar mensagem roleplay' });
    }
  }
}
