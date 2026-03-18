import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'testEngine' });

import {
  compactarTestesPendentes,
  criarTestesPendentes,
  emitirSolicitacaoTeste,
  getTestesPendentes,
  hasPendingTests,
  limparTestePendente,
  resolverTestePendente
} from '../utils/testePipeline.js';
import { buildDiceResolutionContext, buildNarracaoContext } from '../../agents/Mestre/contexto/mestreInvocationContext.js';
import { finalizarAcaoCombatePosTeste, formatarResultadoMecanico } from '../../helpers/combateHelper.js';
import { getTurnState, TURN_STATUS } from '../utils/turnStateMachine.js';
import { resolvePendingCombatAction } from '../utils/combatPendingAction.js';
import {
  appendMensagemSessao,
  buildDadoMensagem,
  buildOrdemDefinidaMensagem,
  buildResultadoDadoInicialMensagem,
  buildResultadoTesteMensagem,
  buildSolicitacaoDadosMensagem,
  createMessageId,
  removeMensagensSessao
} from '../utils/sessionMessages.js';
import { isRoomLockBusyError as isBusyRoomLockError } from '../utils/roomLockError.js';

/**
 * Processa combate pós-teste: delega ao combatEngine.processarAcaoCombate.
 * Usado tanto no happy path quanto no fallback.
 */
async function _processPostTestCombat(sm, roomId, acaoPendente, username, narracaoTexto, sessao) {
  if (!sessao._combatePreResolvido) return;
  try {
    const combatEngine = sm.combatEngine || sm.engines?.combat;
    if (combatEngine?.processarAcaoCombate) {
      await combatEngine.processarAcaoCombate(
        roomId,
        acaoPendente.userId,
        username,
        acaoPendente.personagem,
        '',
        { narracao: narracaoTexto },
        sessao
      );
    }
  } catch (errCombat) {
    log.error({ err: errCombat }, 'Erro ao processar combate pós-teste');
  }
}

function removeResolvedTestPrompt(sessao, groupId) {
  if (!groupId) return 0;

  return removeMensagensSessao(sessao, (mensagem) => {
    if (mensagem?.tipo !== 'solicitacao_dados') return false;
    const payloadGroupId = mensagem?.payload?.groupId || mensagem?.payload?.testePendente?.groupId || null;
    return payloadGroupId != null && String(payloadGroupId) === String(groupId);
  });
}

function syncPendingTestPrompt(sessao, groupId, remainingTests = []) {
  if (!groupId) return 0;

  if (!Array.isArray(remainingTests) || remainingTests.length === 0) {
    return removeResolvedTestPrompt(sessao, groupId);
  }

  let updatedCount = 0;
  const nextTeste = remainingTests[0] || null;

  sessao.mensagens = Array.isArray(sessao.mensagens) ? sessao.mensagens : [];
  sessao.mensagens = sessao.mensagens.map((mensagem) => {
    if (mensagem?.tipo !== 'solicitacao_dados') return mensagem;

    const payloadGroupId = mensagem?.payload?.groupId || mensagem?.payload?.testePendente?.groupId || null;
    if (payloadGroupId == null || String(payloadGroupId) !== String(groupId)) {
      return mensagem;
    }

    updatedCount += 1;
    const nextPayload = {
      ...(mensagem.payload || {}),
      groupId,
      testePendente: nextTeste,
      testesPendentes: remainingTests,
      tipoDado: nextTeste?.tipoDado || mensagem?.payload?.tipoDado || 'd20',
      teste: nextTeste?.teste || mensagem?.payload?.teste || '',
      dificuldade: nextTeste?.dificuldade || mensagem?.payload?.dificuldade || null,
      contexto: nextTeste?.contexto || mensagem?.payload?.contexto || null
    };
    const nextMessage = mensagem.message || mensagem.mensagem || 'O Mestre solicita uma rolagem de dados.';

    return {
      ...mensagem,
      message: nextMessage,
      mensagem: nextMessage,
      payload: nextPayload
    };
  });

  return updatedCount;
}

export default class TestEngine {
  constructor(manager) {
    this.manager = manager;
  }

  _isRoomLockBusyError(error) {
    return isBusyRoomLockError(error);
  }

  async handleDiceRoll(socket, data) {
    const sm = this.manager;

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        dice: rawDice,
        result: rawResult,
        description: rawDescription,
        testeId: rawTesteId,
        groupId: rawGroupId
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawDice || !rawResult) {
        // @event error → socket (direct) | validation failed: missing required fields on dice_roll
        socket.emit('error', { message: 'roomId, userId, dice e result sao obrigatorios' });
        return;
      }

      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      let dice = (typeof rawDice === 'object' && rawDice !== null)
        ? (rawDice.tipo || rawDice.dice || rawDice.tipoDado || 'd20')
        : String(rawDice || 'd20');
      if (dice.includes('[object')) dice = 'd20';
      const result = String(rawResult);
      const description = rawDescription ? String(rawDescription) : null;
      const testeId = rawTesteId ? String(rawTesteId) : null;
      const groupId = rawGroupId ? String(rawGroupId) : null;

      await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          // @event error → socket (direct) | session not found when processing dice_roll
          socket.emit('error', { message: 'Sessao nao encontrada' });
          return;
        }

        const rollData = {
          id: createMessageId('dice'),
          userId,
          username,
          dice,
          result,
          description,
          roomId,
          timestamp: Date.now()
        };

        if (roomId.startsWith('historia_')) {
          if (!Array.isArray(sessao.rolagens)) sessao.rolagens = [];
          sessao.rolagens.push({ ...rollData, timestamp: new Date().toISOString() });
          if (sessao.rolagens.length > 100) sessao.rolagens.shift();
        }

        const tentativaResolucao = resolverTestePendente(sessao, userId, { testeId, groupId });
        const testeResolvido = tentativaResolucao.ok ? tentativaResolucao.teste : null;
        const dadosSolicitados = !!testeResolvido;

        if (tentativaResolucao.motivo === 'jogador_incorreto') {
          // @event teste_rejeitado → room (broadcast) | dice roll rejected because it came from the wrong player
          sm.sendToRoom(roomId, 'teste_rejeitado', {
            roomId,
            motivo: 'jogador_incorreto',
            jogadorAlvo: tentativaResolucao.teste?.jogadorAlvo || null,
            userId,
            username,
            timestamp: Date.now()
          });
        }

        // @event dice_roll → room (broadcast) | broadcasts every dice roll result to the room
        sm.sendToRoom(roomId, 'dice_roll', { ...rollData, dadosSolicitados });

        if (!testeResolvido) {
          // Only persist the raw roll when no test resolution follows
          // (resultado_teste already includes all roll info, avoiding duplicate on reload)
          appendMensagemSessao(sessao, buildDadoMensagem({
            userId,
            username,
            personagemNome: username,
            dice,
            result,
            description,
            origem: 'turno'
          }));
          await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
          await sm.executarCompactacaoSeNecessaria(roomId, sessao, { userId });
          sm.emitirEstadoTurno(roomId, sessao);
          return;
        }

        const jogadorInfo = sessao.jogadores?.[userId];
        const personagemNome = jogadorInfo?.personagemNome || username;
        const personagemId = jogadorInfo?.personagemId;
        const personagemCompleto = personagemId
          ? sessao.personagensCompletos?.[String(personagemId)]
          : null;

        let resultadoTestePayload;
        let descricaoParaIA = `Rolou ${dice} e obteve ${result}${description ? ` para ${description}` : ''}`;

        try {
          const { resolverTeste } = await import('../../helpers/testeHelper.js');
          const resultadoTeste = resolverTeste(
            personagemCompleto,
            testeResolvido.teste || description,
            parseInt(result, 10),
            testeResolvido.dificuldade
          );

          resultadoTestePayload = {
            ...resultadoTeste,
            userId,
            username,
            personagemNome,
            dice,
            testeId: testeResolvido.id,
            groupId: testeResolvido.groupId,
            timestamp: Date.now()
          };

          if (resultadoTeste.atributo) {
            descricaoParaIA =
              `Rolou ${dice} e obteve ${resultadoTeste.rolagemBruta} + ${resultadoTeste.totalModificador} ` +
              `(${resultadoTeste.atributoNome}) = ${resultadoTeste.total} vs DC ${resultadoTeste.dc} ` +
              `(${resultadoTeste.dificuldadeNome}) -> ${resultadoTeste.descricaoResultado}`;
          } else {
            descricaoParaIA =
              `Rolou ${dice} e obteve ${resultadoTeste.rolagemBruta} (teste de Sorte) ` +
              `vs DC ${resultadoTeste.dc} -> ${resultadoTeste.descricaoResultado}`;
          }
        } catch (testeError) {
          log.warn({ err: testeError }, 'Erro ao resolver teste mecanicamente, usando resultado bruto');
          resultadoTestePayload = {
            userId,
            username,
            personagemNome,
            dice,
            rolagemBruta: parseInt(result, 10) || 1,
            total: parseInt(result, 10) || 1,
            totalModificador: 0,
            atributoNome: null,
            dc: null,
            sucesso: null,
            descricaoResultado: null,
            testeId: testeResolvido.id,
            groupId: testeResolvido.groupId,
            timestamp: Date.now()
          };
        }

        const remainingGroupTests = getTestesPendentes(sessao).filter(
          (teste) => String(teste.groupId || '') === String(testeResolvido.groupId || '')
        );
        resultadoTestePayload = {
          ...resultadoTestePayload,
          remainingGroupTests,
          remainingGroupTestCount: remainingGroupTests.length,
          nextTestePendente: remainingGroupTests[0] || null,
          groupResolved: remainingGroupTests.length === 0
        };

        appendMensagemSessao(sessao, buildResultadoTesteMensagem({
          userId,
          username,
          personagemNome,
          dice,
          resultado: parseInt(result, 10) || 1,
          rolagemBruta: resultadoTestePayload.rolagemBruta,
          total: resultadoTestePayload.total,
          totalModificador: resultadoTestePayload.totalModificador,
          atributoNome: resultadoTestePayload.atributoNome,
          dc: resultadoTestePayload.dc,
          sucesso: resultadoTestePayload.sucesso,
          descricaoResultado: resultadoTestePayload.descricaoResultado,
          payload: resultadoTestePayload
        }));
        syncPendingTestPrompt(sessao, testeResolvido.groupId, remainingGroupTests);

        // Persistir resultado do teste inline no array de rolagens (evita race condition)
        if (roomId.startsWith('historia_')) {
          if (!Array.isArray(sessao.rolagens)) sessao.rolagens = [];
          sessao.rolagens.push({
            tipo: 'resultado_teste',
            userId,
            teste: testeResolvido.teste,
            atributo: resultadoTestePayload.atributoNome,
            rolagemBruta: resultadoTestePayload.rolagemBruta,
            total: resultadoTestePayload.total,
            dc: resultadoTestePayload.dc,
            sucesso: resultadoTestePayload.sucesso,
            critico: resultadoTestePayload.critico,
            descricaoResultado: resultadoTestePayload.descricaoResultado,
            timestamp: new Date().toISOString()
          });
          if (sessao.rolagens.length > 100) sessao.rolagens.shift();
        }

        // @event resultado_teste → room (broadcast) | fires after a pending skill test is mechanically resolved
        sm.sendToRoom(roomId, 'resultado_teste', resultadoTestePayload);

        // Persistir último teste no estadoJogo para o turnStateBuilder
        sessao.estadoJogo = sessao.estadoJogo || {};
        const estadoJogo = sessao.estadoJogo;
        if (!estadoJogo.ultimoTeste) estadoJogo.ultimoTeste = {};
        estadoJogo.ultimoTeste[String(userId)] = {
          teste: resultadoTestePayload.atributoNome || testeResolvido.teste,
          dc: resultadoTestePayload.dc ?? null,
          sucesso: resultadoTestePayload.sucesso ?? null,
          total: resultadoTestePayload.total ?? null,
          rodada: estadoJogo.rodadaAtual || 1
        };

        // Verificar se este teste resolve uma ação pendente de combate
        const acaoPendenteCombate = resolvePendingCombatAction(sessao, testeResolvido);
        let resultadosCombatePosTeste = null;
        let contextoCombateExtra = '';

        if (acaoPendenteCombate) {
          resultadosCombatePosTeste = finalizarAcaoCombatePosTeste(sessao, acaoPendenteCombate, resultadoTestePayload);
          if (resultadosCombatePosTeste) {
            sessao._combatePreResolvido = resultadosCombatePosTeste;
            const personagemNomePosTeste = acaoPendenteCombate.personagem?.nome || personagemNome;
            contextoCombateExtra = formatarResultadoMecanico(resultadosCombatePosTeste, personagemNomePosTeste);
            log.info({ userId, testeId: testeResolvido.id, tipo: acaoPendenteCombate.tipo, sucesso: resultadoTestePayload.sucesso }, 'Ação pendente de combate resolvida pós-teste');
          }
        }

        try {
          const mestre = await sm.obterMestre(roomId, sessao.historiaTemas || [], sessao, userId);
          const invocationContext = buildDiceResolutionContext(sessao, {
            testePendente: testeResolvido,
            resultadoBruto: result,
            resultadoTeste: resultadoTestePayload
          });

          // Injetar contexto de combate pós-teste na descrição para a IA
          let descricaoFinal = descricaoParaIA;
          if (contextoCombateExtra) {
            descricaoFinal += '\n' + contextoCombateExtra;
          }

          const testStreamMsgId = `mestre_stream_${Date.now()}_${roomId}`;

          const interpretacao = await mestre.narrarAcaoStream({
            jogador: username,
            personagem: personagemNome,
            acao: descricaoFinal,
            chatHistory: invocationContext.chatHistory,
            resumo: invocationContext.resumo,
            contextoLateralRoleplay: invocationContext.contextoLateralRoleplay,
            lockContinuidade: invocationContext.lockContinuidade
          }, {
            onStreamStart: () => sm.sendToRoom(roomId, 'mestre_stream_start', { streamId: testStreamMsgId, timestamp: Date.now() }),
            onChunk: (delta, accumulated) => sm.sendToRoom(roomId, 'mestre_stream_chunk', { streamId: testStreamMsgId, delta, accumulated, timestamp: Date.now() }),
            onStreamEnd: () => sm.sendToRoom(roomId, 'mestre_stream_end', { streamId: testStreamMsgId, timestamp: Date.now() }),
            onError: () => sm.sendToRoom(roomId, 'mestre_stream_error', { streamId: testStreamMsgId, timestamp: Date.now() })
          });

          const msgInterpretacao = sm.criarMensagemMestre(interpretacao.narracao, sessao.mestreConfig, {
            sessao,
            segmentos: interpretacao.segmentos || []
          });
          appendMensagemSessao(sessao, msgInterpretacao);
          await sm.aplicarMetadadosNarrativos(roomId, sessao, interpretacao.metadados || {});

          const acoesPendentesTeste = sessao.estadoJogo?.acoesPendentesTeste || [];
          if (acoesPendentesTeste.length > 0) {
            const { processarAcoes } = await import('../../helpers/acoesProcessor.js');
            await processarAcoes(acoesPendentesTeste, sessao, roomId, sm, { stage: 'posTeste' });
            sessao.estadoJogo.acoesPendentesTeste = [];
          }

          // Processar eventos de combate pós-teste (contra-ataques, fim de combate, etc.)
          if (resultadosCombatePosTeste) {
            await _processPostTestCombat(sm, roomId, acaoPendenteCombate, username, interpretacao.narracao, sessao);
          }

          const outrosTestesNoLote = getTestesPendentes(sessao).some(
            (teste) =>
              String(teste.id) !== String(testeResolvido.id) &&
              String(teste.groupId) === String(testeResolvido.groupId)
          );

          limparTestePendente(sessao, {
            testId: testeResolvido.id,
            nextTurnState: outrosTestesNoLote ? TURN_STATUS.AWAITING_ROLL : TURN_STATUS.ACTIVE,
            mode: 'resolved'
          });
          compactarTestesPendentes(sessao);

          await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
          await sm.executarCompactacaoSeNecessaria(roomId, sessao, { userId });
          sm.emitirEstadoTurno(roomId, sessao);

          // @event mensagem_mestre → room (broadcast) | AI Master narrates the outcome of the resolved test
          sm.sendToRoom(roomId, 'mensagem_mestre', {
            ...msgInterpretacao,
            message: interpretacao.narracao
          });
        } catch (errorIA) {
          log.error({ err: errorIA }, 'Erro ao processar dado com Mestre IA');

          const textoFallback =
            `${personagemNome} rolou ${dice} e obteve **${result}**` +
            `${description ? ` para ${description}` : ''}. Continue a aventura!`;
          const mensagemFallback = sm.criarMensagemMestre(textoFallback, sessao.mestreConfig, { sessao });
          appendMensagemSessao(sessao, mensagemFallback);

          if (sessao.estadoJogo?.acoesPendentesTeste) {
            sessao.estadoJogo.acoesPendentesTeste = [];
          }

          // Processar eventos de combate pós-teste mesmo no fallback
          if (resultadosCombatePosTeste) {
            await _processPostTestCombat(sm, roomId, acaoPendenteCombate, username, textoFallback, sessao);
          }

          const outrosTestesNoLote = getTestesPendentes(sessao).some(
            (teste) =>
              String(teste.id) !== String(testeResolvido.id) &&
              String(teste.groupId) === String(testeResolvido.groupId)
          );

          limparTestePendente(sessao, {
            testId: testeResolvido.id,
            nextTurnState: outrosTestesNoLote ? TURN_STATUS.AWAITING_ROLL : TURN_STATUS.ACTIVE,
            mode: 'resolved'
          });
          compactarTestesPendentes(sessao);

          await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
          sm.emitirEstadoTurno(roomId, sessao);

          // @event mensagem_mestre → room (broadcast) | fallback Master message when AI narration fails after test resolution
          sm.sendToRoom(roomId, 'mensagem_mestre', {
            ...mensagemFallback,
            message: textoFallback
          });
        }
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao processar dice_roll');
      // @event error → socket (direct) | unhandled exception in handleDiceRoll outer catch
      socket.emit('error', { message: 'Erro ao processar rolagem' });

      try {
        const roomId = String(data?.roomId || '');
        if (!roomId) return;

        const sessao = await sm.gerenciadorSessoes.obterSessao(roomId);
        if (hasPendingTests(sessao)) {
          limparTestePendente(sessao, { nextTurnState: TURN_STATUS.ACTIVE });
          await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
          log.info('Flags de teste limpas no outer catch');
        }
      } catch (cleanupErr) {
        log.warn({ err: cleanupErr }, 'Erro ao limpar flags no outer catch');
      }
    }
  }

  async handleRolarDadoInicial(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();

    sm.log('INFO', 'ROLAR_DADO_INICIAL_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data
    });

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername
      } = data || {};

      if (!rawRoomId || !rawUserId) {
        sm.log('ERROR', 'ROLAR_DADO_INICIAL_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          }
        });
        // @event error → socket (direct) | validation failed: missing roomId or userId on rolar_dado_inicial
        socket.emit('error', { message: 'roomId e userId sao obrigatorios' });
        return;
      }

      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : socket.username || 'Jogador';

      sm.log('INFO', 'ROLAR_DADO_INICIAL_DATA_PARSED', socket.id, userId, {
        roomId,
        username
      });

      await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          sm.log('ERROR', 'ROLAR_DADO_INICIAL_SESSAO_NOT_FOUND', socket.id, userId, { roomId });
          // @event error → socket (direct) | session not found when processing rolar_dado_inicial
          socket.emit('error', { message: 'Sessao nao encontrada' });
          return;
        }

        const rolagemInicial = sessao.estadoJogo?.rolagemInicial || {};

        if (rolagemInicial[userId]) {
          sm.log('WARN', 'ROLAR_DADO_INICIAL_JA_ROLOU', socket.id, userId, {
            roomId,
            valorAnterior: rolagemInicial[userId].valor
          });
          // @event erro_dado_inicial → socket (direct) | player already rolled the initial die in this session
          socket.emit('erro_dado_inicial', {
            message: 'Voce ja rolou o dado inicial',
            valorAnterior: rolagemInicial[userId].valor
          });
          return;
        }

        const valorDado = Math.floor(Math.random() * 20) + 1;

        sm.log('SUCCESS', 'ROLAR_DADO_INICIAL_VALOR_GERADO', socket.id, userId, {
          roomId,
          username,
          valorDado
        });

        await sm.gerenciadorSessoes.registrarRolagemDado(roomId, userId, valorDado);

        const jogador = (sessao.jogadores || {})[userId] || {};
        const personagemNome = jogador.personagemNome || null;
        const resultadoData = {
          userId,
          username,
          personagemNome,
          valor: valorDado,
          timestamp: Date.now()
        };

        sm.log('INFO', 'ROLAR_DADO_INICIAL_BROADCASTING', socket.id, userId, {
          roomId,
          resultadoData
        });

        // @event resultado_dado_inicial → room (broadcast) | broadcasts a player's initial d20 roll result to the room
        sm.sendToRoom(roomId, 'resultado_dado_inicial', resultadoData);

        const sessaoParaDado = await sm.obterSessaoHistoria(roomId);
        appendMensagemSessao(sessaoParaDado, buildResultadoDadoInicialMensagem({
          userId: resultadoData.userId,
          username: resultadoData.username,
          personagemNome: resultadoData.personagemNome,
          valor: resultadoData.valor,
          payload: resultadoData
        }));
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoParaDado);

        log.info({ username: resultadoData.username, valor: resultadoData.valor }, 'Mensagem de dado salva no Redis');

        const sessaoAtualizada = await sm.obterSessaoHistoria(roomId);
        const rolagemInicialAtualizada = sessaoAtualizada.estadoJogo?.rolagemInicial || {};
        const totalJogadores = Object.keys(sessaoAtualizada.jogadores || {}).length;
        const totalRolagens = Object.keys(rolagemInicialAtualizada).length;

        sm.log('INFO', 'ROLAR_DADO_INICIAL_CHECK_TODOS_ROLARAM', socket.id, userId, {
          roomId,
          totalJogadores,
          totalRolagens
        });

        if (totalRolagens !== totalJogadores || totalJogadores === 0) {
          return;
        }

        sm.log('SUCCESS', 'ROLAR_DADO_INICIAL_TODOS_ROLARAM', socket.id, userId, {
          roomId,
          totalJogadores
        });

        await sm.gerenciadorSessoes.definirOrdemJogadores(roomId);

        const sessaoComOrdem = await sm.obterSessaoHistoria(roomId);
        const ordemJogadores = sessaoComOrdem.estadoJogo.ordemJogadores || [];

        sm.log('SUCCESS', 'ROLAR_DADO_INICIAL_ORDEM_DEFINIDA', socket.id, userId, {
          roomId,
          ordemJogadores: ordemJogadores.map((jogadorTurno) => `${jogadorTurno.username} (${jogadorTurno.valorDado})`)
        });

        // @event ordem_definida → room (broadcast) | fires when all players have rolled and turn order is established
        sm.sendToRoom(roomId, 'ordem_definida', {
          ordemJogadores,
          timestamp: Date.now()
        });

        appendMensagemSessao(sessaoComOrdem, buildOrdemDefinidaMensagem({
          ordemJogadores,
          payload: { ordemJogadores }
        }));
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoComOrdem);

        log.info('Mensagem de ordem definida salva no Redis');

        await sm.gerenciadorSessoes.atualizarFaseJogo(roomId, 'rodada_em_andamento');
        await sm.iniciarPrimeiroTurno(roomId);
      });

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'ROLAR_DADO_INICIAL_COMPLETED', socket.id, userId, {
        roomId,
        username,
        processingTimeMs: processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'ROLAR_DADO_INICIAL_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      if (!this._isRoomLockBusyError(error)) {
        // @event error → socket (direct) | unhandled exception in handleRolarDadoInicial
        socket.emit('error', { message: 'Erro ao rolar dado inicial' });
      }
    }
  }

  async handleSolicitarDados(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();

    sm.log('INFO', 'SOLICITAR_DADOS_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data
    });

    try {
      const { roomId, motivo, tipoTeste, dificuldade, jogadores } = data || {};

      if (!roomId || !motivo) {
        sm.log('ERROR', 'SOLICITAR_DADOS_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !roomId,
            motivo: !motivo
          }
        });
        // @event error → socket (direct) | validation failed: missing roomId or motivo on solicitar_dados
        socket.emit('error', { message: 'roomId e motivo sao obrigatorios' });
        return;
      }

      await sm.withRoomLock(String(roomId), async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          sm.log('ERROR', 'SOLICITAR_DADOS_SESSAO_NOT_FOUND', socket.id, socket.userId, { roomId });
          // @event error → socket (direct) | session not found when processing solicitar_dados
          socket.emit('error', { message: 'Sessao nao encontrada' });
          return;
        }

        sm.log('INFO', 'SOLICITAR_DADOS_OBTENDO_MESTRE', socket.id, socket.userId, { roomId });

        const mestre = await sm.obterMestre(roomId, sessao.historiaTemas || [], sessao, socket.userId);

        sm.log('INFO', 'SOLICITAR_DADOS_GERANDO_NARRATIVA', socket.id, socket.userId, {
          motivo,
          tipoTeste: tipoTeste || 'd20'
        });

        const invocationContext = buildNarracaoContext(sessao);
        const solicitacao = await mestre.solicitarRolagemDados({
          motivo,
          tipoTeste: tipoTeste || 'd20',
          dificuldade: dificuldade || 'Media',
          jogadores: jogadores || [],
          chatHistory: invocationContext.chatHistory,
          resumo: invocationContext.resumo,
          contextoLateralRoleplay: invocationContext.contextoLateralRoleplay
        });

        sm.log('SUCCESS', 'SOLICITAR_DADOS_NARRATIVA_GERADA', socket.id, socket.userId, {
          narrativaLength: solicitacao.narrativa?.length || 0
        });

        const mensagemSolicitacaoDetalhada = buildSolicitacaoDadosMensagem({
          narrativa: solicitacao.narrativa,
          origem: 'manual',
          payload: {
            motivo,
            tipoTeste: solicitacao.tipoTeste || tipoTeste || 'd20',
            dificuldade: solicitacao.dificuldade || dificuldade || 'Media'
          }
        });

        const turnoAtual = getTurnState(sessao);
        const jogadorPadrao = turnoAtual.jogadorAtual || socket.userId;
        const jogadoresAlvo = Array.isArray(jogadores) && jogadores.length > 0
          ? jogadores
          : [{ userId: jogadorPadrao, id: jogadorPadrao }];

        const testesCriados = criarTestesPendentes(
          sessao,
          jogadoresAlvo.map((jogadorAlvo) => {
            const alvoUserId = String(jogadorAlvo?.userId || jogadorAlvo?.id || jogadorPadrao);
            const jogadorSessao = sessao.jogadores?.[alvoUserId] || {};
            return {
              origem: 'manual',
              jogadorAlvo: alvoUserId,
              personagemAlvo: jogadorAlvo?.personagemId || jogadorSessao.personagemId || null,
              teste: motivo,
              dificuldade: solicitacao.dificuldade || dificuldade || 'Media',
              tipoDado: solicitacao.tipoTeste || tipoTeste || 'd20',
              contexto: motivo
            };
          }),
          socket.userId
        );

        mensagemSolicitacaoDetalhada.payload = {
          ...(mensagemSolicitacaoDetalhada.payload || {}),
          groupId: testesCriados[0]?.groupId || null,
          motivo,
          tipoTeste: solicitacao.tipoTeste || tipoTeste || 'd20',
          dificuldade: solicitacao.dificuldade || dificuldade || 'Media',
          testesPendentes: testesCriados
        };

        appendMensagemSessao(sessao, mensagemSolicitacaoDetalhada);

        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.emitirEstadoTurno(roomId, sessao);

        sm.log('SUCCESS', 'SOLICITAR_DADOS_SESSAO_UPDATED', socket.id, socket.userId, { roomId });

        emitirSolicitacaoTeste(sm, roomId, sessao, {
          narrativa: solicitacao.narrativa,
          tipoDado: solicitacao.tipoTeste,
          teste: motivo,
          dificuldade: solicitacao.dificuldade,
          contexto: motivo,
          testesPendentes: testesCriados
        });
      });

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'SOLICITAR_DADOS_COMPLETED', socket.id, socket.userId, {
        roomId,
        processingTimeMs: processingTime
      });

      log.info({ roomId }, 'Solicitacao de dados enviada para sala');
    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'SOLICITAR_DADOS_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      // @event error → socket (direct) | unhandled exception in handleSolicitarDados
      socket.emit('error', { message: 'Erro ao solicitar dados' });
    }
  }
}
