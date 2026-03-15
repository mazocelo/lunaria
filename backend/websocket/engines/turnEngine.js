import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'turnEngine' });

import { extrairNomesTemas } from '../../helpers/temasHelper.js';
import { buildTurnStartContext } from '../../agents/Mestre/contexto/mestreInvocationContext.js';
import {
  buildEntreRodadasMensagem,
  buildTransicaoTurnoMensagem,
  appendMensagemSessao
} from '../utils/sessionMessages.js';
import {
  getTurnState,
  resetTurnInteractions,
  transitionTurnState,
  TURN_STATUS
} from '../utils/turnStateMachine.js';
import { limparTestePendente } from '../utils/testePipeline.js';
import { sanitizePromptInput } from '../../helpers/sanitize.js';

// ── Abertura com transição personalizada ──────────────────────────

function buildTransitionMessage(sessao, jogadorDaVez, username, invocationContext) {
  const personagemNome = sanitizePromptInput(jogadorDaVez.personagemNome || username, 100);
  const personagemId = jogadorDaVez.personagemId;
  const dados = personagemId
    ? (sessao.personagensCompletos || {})[String(personagemId)]
    : null;

  const classe = sanitizePromptInput(dados?.classe || 'aventureiro', 100);
  const raca = sanitizePromptInput(dados?.raca || 'desconhecida', 100);
  const background = dados?.background ? sanitizePromptInput(dados.background, 400) : null;
  const nivel = dados?.nivel || 1;

  const bgSnippet = background
    ? `Historia pessoal: "${background}"`
    : 'O jogador nao definiu background. Improvise uma chegada breve baseada na classe e raca.';

  const parts = [
    '[INSTRUCAO DE ABERTURA - TRANSICAO PERSONALIZADA]',
    `Este e o primeiro turno de ${personagemNome} na sessao. Antes da cena principal, narre brevemente como ${personagemNome} (${raca}, ${classe}, nivel ${nivel}) chegou ao local da aventura.`,
    '',
    bgSnippet,
    '',
    'Diretrizes:',
    '- Narre em 2-3 paragrafos curtos como o personagem viajou/chegou ate o cenario.',
    '- Use background, classe e raca para dar personalidade a chegada.',
    '- Termine fazendo transicao natural para a cena principal.',
    '- Apos a transicao, apresente a cena e ofereca opcoes iniciais.',
    '[FIM DA INSTRUCAO DE ABERTURA]',
    ''
  ];

  if (invocationContext.contextoLateralRoleplay) {
    parts.push(invocationContext.contextoLateralRoleplay, '');
  }
  parts.push(`Iniciar turno de ${personagemNome}`);
  return parts.join('\n');
}

function expirarStatusForaDeCombate(manager, roomId, sessao, contexto) {
  const estadoJogo = sessao.estadoJogo || {};
  if (estadoJogo.combate?.ativo) return;

  for (const personagemCompleto of Object.values(sessao.personagensCompletos || {})) {
    if (!Array.isArray(personagemCompleto.status_efeitos) || personagemCompleto.status_efeitos.length === 0) {
      continue;
    }

    personagemCompleto.status_efeitos = personagemCompleto.status_efeitos.filter((efeito) => {
      efeito.duracao = (efeito.duracao || 1) - 1;
      if (efeito.duracao > 0) return true;

      manager.emitirAcaoMestrePersistida(roomId, sessao, {
        tipo: 'status_removido',
        personagem: personagemCompleto.nome,
        status: efeito.nome,
        timestamp: Date.now()
      });
      log.info({ contexto, personagem: personagemCompleto.nome, efeito: efeito.nome }, 'Status expirado');
      return false;
    });
  }
}

export default class TurnEngine {
  constructor(manager) {
    this.manager = manager;
  }

  async handleIniciarTurno(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();

    sm.log('INFO', 'INICIAR_TURNO_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data
    });

    try {
      const { roomId: rawRoomId, userId: rawUserId, username: rawUsername } = data || {};

      if (!rawRoomId || !rawUserId) {
        sm.log('ERROR', 'INICIAR_TURNO_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          }
        });
        // @event error → socket (direct) | validation failed: roomId or userId missing
        socket.emit('error', { message: 'roomId e userId sao obrigatorios' });
        return;
      }

      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : socket.username || 'Jogador';

      sm.log('INFO', 'INICIAR_TURNO_DATA_PARSED', socket.id, userId, { roomId, username });

      await sm.withRoomLock(roomId, async () => {
        const sessao = await sm.obterSessaoHistoria(roomId);
        if (!sessao) {
          sm.log('ERROR', 'INICIAR_TURNO_SESSAO_NOT_FOUND', socket.id, userId, { roomId });
          // @event error → socket (direct) | sessao not found for the given roomId
          socket.emit('error', { message: 'Sessao nao encontrada' });
          return;
        }

        const estadoJogo = sessao.estadoJogo || {};
        const turnoAtual = estadoJogo.turnoAtual || 0;
        const ordemJogadores = estadoJogo.ordemJogadores || [];
        const jogadorDaVez = ordemJogadores[turnoAtual];

        if (!jogadorDaVez || String(jogadorDaVez.userId) !== String(userId)) {
          sm.log('WARN', 'INICIAR_TURNO_NAO_E_SEU_TURNO', socket.id, userId, {
            roomId,
            turnoAtual,
            jogadorDaVez: jogadorDaVez?.username
          });
          // @event erro_turno → socket (direct) | player tried to start a turn that is not theirs
          socket.emit('erro_turno', { message: 'Nao e seu turno!' });
          return;
        }

        const turnoState = getTurnState(sessao);
        if (turnoState.status !== TURN_STATUS.IDLE) {
          sm.log('WARN', 'INICIAR_TURNO_JA_INICIADO', socket.id, userId, { roomId });
          return;
        }

        transitionTurnState(sessao, TURN_STATUS.STARTING, {
          jogadorAtual: String(userId),
          rodadaAtual: estadoJogo.rodadaAtual || 1,
          contadorInteracoes: 0,
          iniciadoEm: new Date().toISOString(),
          lockReason: 'gerando_abertura'
        });
        sessao.estadoJogo = estadoJogo;
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.emitirEstadoTurno(roomId, sessao);

        const mestre = await sm.obterMestre(roomId, sessao.historiaTemas || [], sessao, userId);

        let mensagemInicial;
        try {
          const invocationContext = buildTurnStartContext(sessao, userId);

          // ── Detecção de primeiro turno per-player ──
          const aberturasPorJogador = estadoJogo.aberturasPorJogador || {};
          const jaFezAbertura = !!aberturasPorJogador[String(userId)];
          const openingMode = sessao.historiaConfig?.session_opening_mode || 'direto';

          let mensagemTurno;
          if (!jaFezAbertura && openingMode === 'transicao_personalizada') {
            mensagemTurno = buildTransitionMessage(sessao, jogadorDaVez, username, invocationContext);
            log.info({ roomId, openingMode, personagem: jogadorDaVez.personagemNome },
              'Abertura com transicao personalizada');
          } else {
            mensagemTurno = invocationContext.contextoLateralRoleplay
              ? `${invocationContext.contextoLateralRoleplay}\n\nIniciar turno de ${jogadorDaVez.personagemNome || username}`
              : `Iniciar turno de ${jogadorDaVez.personagemNome || username}`;
          }

          const usouTransicao = !jaFezAbertura && openingMode === 'transicao_personalizada';

          mensagemInicial = await mestre.narrarTurnoJogador({
            jogador: username,
            personagem: jogadorDaVez.personagemNome || username,
            mensagem: mensagemTurno,
            rodada: estadoJogo.rodadaAtual || 1,
            turno: turnoAtual,
            contadorMensagens: 0,
            chatHistory: invocationContext.chatHistory,
            resumo: invocationContext.resumo,
            contextoLateralRoleplay: invocationContext.contextoLateralRoleplay
          });

          // Marcar abertura como executada somente após resposta válida da IA
          if (!jaFezAbertura) {
            estadoJogo.aberturasPorJogador = { ...aberturasPorJogador, [String(userId)]: true };
            sessao.estadoJogo = estadoJogo;
            log.info({ roomId, userId, openingMode, usouTransicao }, 'Abertura marcada como executada');
          }
        } catch (errorIA) {
          log.error({ err: errorIA }, 'Erro na IA ao iniciar turno');
          sm.log('ERROR', 'INICIAR_TURNO_IA_FAILED', socket.id, userId, {
            error: errorIA.message,
            stack: errorIA.stack
          });
          // Não marca aberturasPorJogador — o jogador pode tentar novamente
          mensagemInicial = {
            resposta: `E agora, **${jogadorDaVez.personagemNome || username}**, o que voce faz?`
          };
        }

        const sessaoAtualizada = await sm.obterSessaoHistoria(roomId);
        const narrativaInicial = mensagemInicial.resposta || mensagemInicial.narracao || '';
        const msgInicial = sm.criarMensagemMestre(narrativaInicial, sessaoAtualizada.mestreConfig, {
          sessao: sessaoAtualizada,
          segmentos: mensagemInicial.segmentos || []
        });
        appendMensagemSessao(sessaoAtualizada, msgInicial);
        await sm.aplicarMetadadosNarrativos(roomId, sessaoAtualizada, mensagemInicial.metadados || {});
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtualizada);

        // @event mensagem_mestre → room (broadcast) | AI narration for the start of a player's turn
        sm.sendToRoom(roomId, 'mensagem_mestre', {
          ...msgInicial,
          message: narrativaInicial
        });

        const { despacharResposta } = await import('../utils/respostaDispatcher.js');
        await despacharResposta({
          narracao: narrativaInicial,
          fimDeTurno: !!mensagemInicial.fimDeTurno,
          acaoCompleta: !!mensagemInicial.acaoCompleta,
          solicitaDados: mensagemInicial.solicitaDados || { solicita: false },
          teste: mensagemInicial.teste || null,
          acoes: Array.isArray(mensagemInicial.acoes) ? mensagemInicial.acoes : [],
          combate: mensagemInicial.combate || null,
          metadados: mensagemInicial.metadados || {}
        }, {
          roomId,
          userId,
          username,
          personagem: {
            nome: jogadorDaVez.personagemNome || username,
            id: jogadorDaVez.personagemId || null
          },
          mensagem: `Inicio do turno de ${jogadorDaVez.personagemNome || username}`,
          sessao: sessaoAtualizada,
          socket,
          sm,
          fase: estadoJogo.fase,
          combateAtivo: !!estadoJogo.combate?.ativo,
          skipTurnControl: true
        });

        const turnoFinal = getTurnState(sessaoAtualizada);
        if (turnoFinal.status === TURN_STATUS.STARTING) {
          transitionTurnState(sessaoAtualizada, TURN_STATUS.ACTIVE, {
            jogadorAtual: String(userId),
            rodadaAtual: estadoJogo.rodadaAtual || 1,
            lockReason: null
          });
          await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtualizada);
        }

        await sm.executarCompactacaoSeNecessaria(roomId, sessaoAtualizada, { userId });
        sm.emitirEstadoTurno(roomId, sessaoAtualizada);

        // @event turno_iniciado → room (broadcast) | confirms the active player's turn has been started
        sm.sendToRoom(roomId, 'turno_iniciado', {
          userId,
          username,
          rodada: estadoJogo.rodadaAtual || 1,
          turno: turnoAtual,
          timestamp: Date.now()
        });
      });

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'INICIAR_TURNO_COMPLETED', socket.id, userId, {
        roomId,
        username,
        processingTimeMs: processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      try {
        const roomId = String(data?.roomId || '');
        if (roomId) {
          const sessao = await sm.obterSessaoHistoria(roomId);
          if (sessao) {
            const turno = getTurnState(sessao);
            if (turno.status === TURN_STATUS.STARTING) {
              transitionTurnState(sessao, TURN_STATUS.IDLE, {
                lockReason: null,
                contadorInteracoes: 0
              });
              await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
              sm.emitirEstadoTurno(roomId, sessao);
            }
          }
        }
      } catch (cleanupError) {
        log.warn({ err: cleanupError }, 'Erro ao limpar estado de turno apos falha de inicio');
      }

      sm.log('ERROR', 'INICIAR_TURNO_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      if (!error.message?.includes('Operacao em andamento')) {
        // @event error → socket (direct) | unhandled exception during turn start flow
        socket.emit('error', { message: 'Erro ao iniciar turno' });
      }
    }
  }

  async iniciarPrimeiroTurno(roomId) {
    const sm = this.manager;

    try {
      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) {
        log.error({ roomId }, 'Sessao nao encontrada ao iniciar primeiro turno');
        return;
      }

      const estadoJogo = sessao.estadoJogo || {};
      const ordemJogadores = estadoJogo.ordemJogadores || [];
      if (ordemJogadores.length === 0) {
        log.error({ roomId }, 'Nenhum jogador na ordem para iniciar turno');
        return;
      }

      const primeiroJogador = ordemJogadores[0];
      const prologoPendente = estadoJogo.prologoPendente;
      if (prologoPendente) {
        const prologoTimestamp = Date.now();
        const msgPrologo = sm.criarMensagemMestre(prologoPendente, sessao.mestreConfig, { sessao });
        msgPrologo.timestamp = prologoTimestamp;
        appendMensagemSessao(sessao, msgPrologo);

        delete estadoJogo.prologoPendente;
        sessao.estadoJogo = estadoJogo;
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

        // @event mensagem_mestre → room (broadcast) | delivers the pending prologue message before the first turn
        sm.sendToRoom(roomId, 'mensagem_mestre', {
          id: prologoTimestamp.toString(),
          ...msgPrologo,
          message: prologoPendente
        });
      }

      sm.notificarMudancaFase(roomId, 'rodada_em_andamento', {
        rodadaAtual: estadoJogo.rodadaAtual || 1
      });

      // @event turno_alterado → room (broadcast) | announces the first player's turn at the start of the session
      sm.sendToRoom(roomId, 'turno_alterado', {
        rodadaAtual: estadoJogo.rodadaAtual || 1,
        turnoAtual: 0,
        jogadorAtual: primeiroJogador,
        ordemCompleta: ordemJogadores,
        timestamp: Date.now()
      });

      const sessaoFinal = await sm.obterSessaoHistoria(roomId);
      if (sessaoFinal) sm._tentarSnapshot(roomId, sessaoFinal, true);
    } catch (error) {
      log.error({ err: error }, 'Erro ao iniciar primeiro turno');
    }
  }

  async avancarProximoTurno(roomId) {
    const sm = this.manager;

    try {
      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) {
        log.error({ roomId }, 'Sessao nao encontrada ao avancar turno');
        return;
      }

      const estadoJogo = sessao.estadoJogo || {};
      const turnoAtual = estadoJogo.turnoAtual || 0;
      const ordemJogadores = estadoJogo.ordemJogadores || [];

      if (ordemJogadores.length === 1) {
        resetTurnInteractions(sessao);
        transitionTurnState(sessao, TURN_STATUS.IDLE, {
          jogadorAtual: ordemJogadores[0]?.userId || null,
          lockReason: null
        });
        expirarStatusForaDeCombate(sm, roomId, sessao, '(solo)');
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        sm.emitirEstadoTurno(roomId, sessao);

        // Solo: re-emit turno_alterado so frontend recognizes it's the player's turn again
        sm.sendToRoom(roomId, 'turno_alterado', {
          rodadaAtual: estadoJogo.rodadaAtual || 1,
          turnoAtual: 0,
          jogadorAtual: ordemJogadores[0],
          ordemCompleta: ordemJogadores,
          timestamp: Date.now()
        });
        return;
      }

      resetTurnInteractions(sessao);
      transitionTurnState(sessao, TURN_STATUS.IDLE, {
        jogadorAtual: null,
        lockReason: null
      });

      const proximoTurno = turnoAtual + 1;
      if (proximoTurno >= ordemJogadores.length) {
        await this.finalizarRodada(roomId);
        return;
      }

      const proximoJogador = ordemJogadores[proximoTurno];
      const jogadorAnterior = ordemJogadores[turnoAtual];

      expirarStatusForaDeCombate(sm, roomId, sessao, 'fora de combate');

      const mensagemTransicao = buildTransicaoTurnoMensagem(
        `Turno de ${jogadorAnterior?.username || 'jogador'} finalizado. Vez de ${proximoJogador.username}!`,
        {
          jogadorAnterior: jogadorAnterior?.userId || null,
          proximoJogador: proximoJogador?.userId || null,
          rodadaAtual: estadoJogo.rodadaAtual || 1
        }
      );
      appendMensagemSessao(sessao, mensagemTransicao);

      estadoJogo.turnoAtual = proximoTurno;
      transitionTurnState(sessao, TURN_STATUS.IDLE, {
        jogadorAtual: null,
        rodadaAtual: estadoJogo.rodadaAtual || 1,
        contadorInteracoes: 0,
        lockReason: null
      });
      sessao.estadoJogo = estadoJogo;

      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);
      sm.emitirEstadoTurno(roomId, sessao);

      // @event chat_message → room (broadcast) | system transition message indicating whose turn it is next
      sm.sendToRoom(roomId, 'chat_message', {
        ...mensagemTransicao,
        message: mensagemTransicao.message
      });
      // @event turno_alterado → room (broadcast) | notifies all players of the new active turn and player order
      sm.sendToRoom(roomId, 'turno_alterado', {
        rodadaAtual: estadoJogo.rodadaAtual || 1,
        turnoAtual: proximoTurno,
        jogadorAtual: proximoJogador,
        ordemCompleta: ordemJogadores,
        timestamp: Date.now()
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao avancar turno');
    }
  }

  async finalizarRodada(roomId) {
    const sm = this.manager;

    try {
      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) {
        log.error({ roomId }, 'Sessao nao encontrada ao finalizar rodada');
        return;
      }

      const estadoJogo = sessao.estadoJogo || {};
      const rodadaAtual = estadoJogo.rodadaAtual || 1;
      const proximaRodada = rodadaAtual + 1;

      transitionTurnState(sessao, TURN_STATUS.IDLE, {
        jogadorAtual: null,
        rodadaAtual,
        contadorInteracoes: 0,
        lockReason: null
      });
      limparTestePendente(sessao);
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      const sessaoComFase = await sm.gerenciadorSessoes.atualizarFaseJogo(roomId, 'entre_rodadas');
      if (sessaoComFase) {
        sessao.estadoJogo = sessaoComFase.estadoJogo || sessao.estadoJogo;
      }

      sm.notificarMudancaFase(roomId, 'entre_rodadas', {
        rodadaFinalizada: rodadaAtual
      });
      // @event rodada_finalizada → room (broadcast) | fires when all players have completed their turns for the round
      sm.sendToRoom(roomId, 'rodada_finalizada', {
        rodada: rodadaAtual,
        timestamp: Date.now()
      });

      const acoesRodada = (estadoJogo.historicoTurnos || [])
        .filter((turno) => turno.rodada === rodadaAtual)
        .map((turno) => `${turno.personagem || turno.username}: ${turno.acao || turno.resumo || 'Acao realizada'}`);

      try {
        const mestre = await sm.obterMestre(roomId, sessao.historiaTemas || [], sessao, null);
        const narrativa = await mestre.narrarEntreRodadas({
          rodadaAnterior: rodadaAtual,
          proximaRodada,
          resumoAcoes: acoesRodada,
          chatHistory: sessao.mensagens || []
        });

        const precisaResumir = false;
        if (precisaResumir) {
          try {
            const resumoAgent = (await import('../../agents/Resumo/index.js')).default;
            const sessaoParaResumo = await sm.obterSessaoHistoria(roomId);
            const resumoAnteriorObj = await sm.gerenciadorSessoes.obterUltimoResumo(roomId);

            const { buildContextoResumo } = await import('../../agents/Mestre/contexto/mestreContextBuilder.js');
            const resumo = await resumoAgent.resumirAventura({
              mensagens: sessaoParaResumo.mensagens || [],
              temas: extrairNomesTemas(sessaoParaResumo.historiaTemas || []),
              personagens: Object.values(sessaoParaResumo.jogadores || {}),
              rodadasJogadas: rodadaAtual,
              resumoAnterior: resumoAnteriorObj?.resumo || null,
              userId: null,
              contextoResumo: buildContextoResumo(sessaoParaResumo)
            });

            await sm.gerenciadorSessoes.salvarResumo(roomId, resumo);

            if (sessaoParaResumo.historiaRoteiro) {
              try {
                const { atualizarProgressao } = await import('../../agents/Mestre/prompts/roteiroCondenser.js');
                const progressaoAtual = sessaoParaResumo.estadoJogo?.progressao || null;
                const novaProgressao = await atualizarProgressao(
                  sessaoParaResumo.historiaRoteiro,
                  resumo.resumo,
                  progressaoAtual,
                  null
                );
                if (novaProgressao) {
                  const estadoAtual = sessaoParaResumo.estadoJogo || {};
                  await sm.gerenciadorSessoes.atualizarEstadoJogo(roomId, {
                    ...estadoAtual,
                    progressao: novaProgressao
                  });
                }
              } catch (err) {
                log.warn({ err }, 'Erro ao atualizar progressao');
              }
            }

            sm.invalidarMestreSeNecessario(roomId, proximaRodada);
          } catch (error) {
            log.error({ err: error }, 'Erro ao gerar resumo');
          }
        }

        if (Array.isArray(narrativa.acoes) && narrativa.acoes.length > 0) {
          try {
            const { processarAcoes } = await import('../../helpers/acoesProcessor.js');
            const sessaoParaAcoes = await sm.obterSessaoHistoria(roomId);
            await processarAcoes(narrativa.acoes, sessaoParaAcoes, roomId, sm);
            await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoParaAcoes);
          } catch (acoesError) {
            log.error({ err: acoesError }, 'Erro ao processar acoes entre rodadas');
          }
        }

        if (narrativa.combate?.iniciado) {
          const sessaoParaCombate = await sm.obterSessaoHistoria(roomId);
          await sm.iniciarCombate(roomId, narrativa.combate, sessaoParaCombate, null);
        }

        const sessaoAtualizada = await sm.obterSessaoHistoria(roomId);
        appendMensagemSessao(sessaoAtualizada, buildEntreRodadasMensagem({
          message: narrativa.narrativa || narrativa.novoDesafio,
          titulo: `Fim da Rodada ${rodadaAtual}`,
          rodadaAnterior: rodadaAtual,
          proximaRodada,
          payload: narrativa
        }));
        await sm.aplicarMetadadosNarrativos(roomId, sessaoAtualizada, narrativa.metadados || {});
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtualizada);
        await sm.executarCompactacaoSeNecessaria(roomId, sessaoAtualizada, {
          force: true,
          userId: null,
          forceRound: true
        });
      } catch (error) {
        log.error({ err: error }, 'Erro ao gerar narrativa entre rodadas');

        const sessaoAtualizada = await sm.obterSessaoHistoria(roomId);
        appendMensagemSessao(sessaoAtualizada, buildEntreRodadasMensagem({
          message: `A rodada ${rodadaAtual} foi concluida. Preparando rodada ${proximaRodada}...`,
          titulo: `Fim da Rodada ${rodadaAtual}`,
          rodadaAnterior: rodadaAtual,
          proximaRodada,
          userId: 'sistema',
          username: 'Sistema'
        }));
        await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtualizada);
      }

      if (sm._roundTimers.has(roomId)) {
        clearTimeout(sm._roundTimers.get(roomId));
      }
      const timerId = setTimeout(async () => {
        sm._roundTimers.delete(roomId);
        try {
          await this.iniciarNovaRodada(roomId);
        } catch (error) {
          log.error({ err: error, roomId }, 'Erro ao iniciar nova rodada');
          // @event erro_sistema → room (broadcast) | unhandled error prevented the next round from starting
          sm.sendToRoom(roomId, 'erro_sistema', {
            message: 'Erro ao iniciar nova rodada. Tente novamente.'
          });
        }
      }, 5000);
      sm._roundTimers.set(roomId, timerId);
    } catch (error) {
      log.error({ err: error }, 'Erro ao finalizar rodada');
    }
  }

  async iniciarNovaRodada(roomId) {
    const sm = this.manager;

    try {
      const sessao = await sm.obterSessaoHistoria(roomId);
      if (!sessao) {
        log.error({ roomId }, 'Sessao nao encontrada ao iniciar nova rodada');
        return;
      }

      await sm.gerenciadorSessoes.iniciarNovaRodada(roomId);

      const sessaoAtualizada = await sm.obterSessaoHistoria(roomId);
      const estadoJogo = sessaoAtualizada.estadoJogo || {};
      const novaRodada = estadoJogo.rodadaAtual || 2;
      const ordemJogadores = estadoJogo.ordemJogadores || [];

      sm.notificarMudancaFase(roomId, 'rodada_em_andamento', {
        rodadaAtual: novaRodada
      });
      // @event nova_rodada_iniciada → room (broadcast) | fires after between-rounds narration when a new round begins
      sm.sendToRoom(roomId, 'nova_rodada_iniciada', {
        rodada: novaRodada,
        primeiroJogador: ordemJogadores[0],
        timestamp: Date.now()
      });

      if (ordemJogadores.length > 0) {
        // @event turno_alterado → room (broadcast) | announces the first player's turn at the start of the new round
        sm.sendToRoom(roomId, 'turno_alterado', {
          rodadaAtual: novaRodada,
          turnoAtual: 0,
          jogadorAtual: ordemJogadores[0],
          ordemCompleta: ordemJogadores,
          timestamp: Date.now()
        });
      }

      sm._tentarSnapshot(roomId, sessaoAtualizada, true);
    } catch (error) {
      log.error({ err: error }, 'Erro ao iniciar nova rodada');
    }
  }
}
