/**
 * AI Response Dispatcher - processa blocos da resposta do Mestre IA em sequencia.
 */
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'respostaDispatcher' });

import { processarAcoes } from '../../helpers/acoesProcessor.js';
import { calcularModificadorTeste } from '../../helpers/testeHelper.js';
import {
  incrementTurnInteractions,
  transitionTurnState,
  TURN_STATUS
} from './turnStateMachine.js';
import {
  compactarTestesPendentes,
  criarTestesPendentes,
  emitirSolicitacaoTeste,
  getTestePendente,
  hasPendingTests,
  limparTestePendente
} from './testePipeline.js';
import { appendMensagemSessao, buildSolicitacaoDadosMensagem } from './sessionMessages.js';

async function processarInicioCombate(resposta, ctx) {
  ctx.sm.log('INFO', 'COMBATE_DETECTADO_PELA_IA', ctx.socket.id, ctx.userId, {
    roomId: ctx.roomId,
    monstros: resposta.combate.monstros,
    motivo: resposta.combate.motivo,
    dificuldade: resposta.combate.dificuldade
  });
  await ctx.sm.iniciarCombate(ctx.roomId, resposta.combate, ctx.sessao, ctx.userId);
}

async function processarAcaoCombateHandler(resposta, ctx) {
  await ctx.sm.processarAcaoCombate(
    ctx.roomId, ctx.userId, ctx.username, ctx.personagem, ctx.mensagem, resposta, ctx.sessao
  );
}

async function processarFugaCombate(resposta, ctx) {
  await ctx.sm.finalizarCombate(ctx.roomId, 'fuga');
}

async function criarSolicitacaoTeste(resposta, ctx) {
  const teste = resposta.teste || resposta.solicitaDados || {};
  const testesCriados = criarTestesPendentes(ctx.sessao, {
    origem: teste.origem || 'mestre',
    jogadorAlvo: teste.jogadorAlvo || ctx.userId,
    personagemAlvo: ctx.personagem?.id || ctx.personagem?.personagemId || null,
    teste: teste.teste || resposta.solicitaDados?.teste || '',
    atributo: teste.atributo || null,
    pericia: teste.pericia || null,
    dificuldade: teste.dificuldade || resposta.solicitaDados?.dificuldade || 'Média',
    contexto: teste.contexto || resposta.narracao || null,
    tipoDado: teste.tipoDado || resposta.solicitaDados?.tipo || 'd20',
    metadata: {
      origemNarrativa: ctx.mensagem
    }
  }, ctx.userId);
  const testePendente = testesCriados[0] || null;

  if (!testePendente) {
    return;
  }

  let modificadorPreview = 0;
  let atributoPreview = null;
  try {
    const alvoUserId = testePendente.jogadorAlvo || ctx.userId;
    const jogadorInfo = ctx.sessao.jogadores?.[String(alvoUserId)];
    const personagemId = jogadorInfo?.personagemId;
    const personagemCompleto = personagemId
      ? ctx.sessao.personagensCompletos?.[String(personagemId)]
      : null;

    if (personagemCompleto && testePendente.teste) {
      const modInfo = calcularModificadorTeste(personagemCompleto, testePendente.teste);
      modificadorPreview = modInfo.totalModificador;
      atributoPreview = modInfo.atributoNome;
    }
  } catch (error) {
    log.warn({ err: error }, 'Erro ao calcular modificador preview');
  }

  emitSolicitacao(ctx, resposta, testePendente, testesCriados, modificadorPreview, atributoPreview);
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
  ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);
}

function emitSolicitacao(ctx, resposta, testePendente, testesCriados, modificadorPreview, atributoPreview) {
  appendMensagemSessao(ctx.sessao, buildSolicitacaoDadosMensagem({
    narrativa: resposta.narracao,
    origem: testePendente.origem || 'mestre',
    payload: {
      groupId: testePendente.groupId,
      testePendente,
      testesPendentes: testesCriados,
      tipoDado: testePendente.tipoDado,
      teste: testePendente.teste,
      dificuldade: testePendente.dificuldade,
      modificador: modificadorPreview,
      atributo: atributoPreview,
      contexto: testePendente.contexto
    }
  }));

  emitSolicitacaoTeste(ctx.sm, ctx.roomId, ctx.sessao, {
    narrativa: resposta.narracao,
    tipoDado: testePendente.tipoDado,
    teste: testePendente.teste,
    dificuldade: testePendente.dificuldade,
    modificador: modificadorPreview,
    atributo: atributoPreview,
    contexto: testePendente.contexto,
    testesPendentes: testesCriados,
    testePendente
  });
}

async function processarAcoesMecanicas(resposta, ctx) {
  if (!resposta.acoes?.length) return;

  const existeTestePendente = hasPendingTests(ctx.sessao);
  if (existeTestePendente) {
    const acoesPosTeste = resposta.acoes.filter(acao => {
      const stage = acao?.stage || (acao?.dependeDeTeste ? 'posTeste' : 'independente');
      return stage === 'posTeste';
    });
    ctx.sessao.estadoJogo = ctx.sessao.estadoJogo || {};
    ctx.sessao.estadoJogo.acoesPendentesTeste = acoesPosTeste;
  }

  await processarAcoes(resposta.acoes, ctx.sessao, ctx.roomId, ctx.sm, {
    stage: existeTestePendente ? 'preTeste' : 'all',
    onTesteSolicitado: async (testePayload) => {
      await criarSolicitacaoTeste({
        ...resposta,
        teste: testePayload,
        solicitaDados: { solicita: true }
      }, ctx);
    }
  });
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
}

async function limparFlagDados(resposta, ctx) {
  if (!hasPendingTests(ctx.sessao)) return;
  limparTestePendente(ctx.sessao, { nextTurnState: TURN_STATUS.ACTIVE, mode: 'cancel' });
  compactarTestesPendentes(ctx.sessao);
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
  ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);
}

async function processarControleTurno(resposta, ctx) {
  if (ctx.skipTurnControl) {
    ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);
    return;
  }

  const turno = incrementTurnInteractions(ctx.sessao);
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);

  const existeTestePendente = hasPendingTests(ctx.sessao, { groupId: turno.loteTesteAtivo });
  const mestreSinalizouFim = resposta.fimDeTurno || false;
  const acaoCompleta = resposta.acaoCompleta || false;
  const atingiuLimiteInteracoes = turno.contadorInteracoes >= 4;
  const podeFinalizar = !existeTestePendente
    && (mestreSinalizouFim || atingiuLimiteInteracoes || acaoCompleta);

  if (!podeFinalizar) {
    if (existeTestePendente) {
      ctx.sm.log('INFO', 'TURN_FINALIZATION_BLOCKED_PENDING_TEST', ctx.socket.id, ctx.userId, {
        roomId: ctx.roomId,
        contadorAtual: turno.contadorInteracoes
      });
    }
    ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);
    return;
  }

  transitionTurnState(ctx.sessao, TURN_STATUS.FINISHING, {
    jogadorAtual: String(ctx.userId),
    rodadaAtual: turno.rodadaAtual,
    lockReason: 'fechando_turno'
  });
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
  ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);

  // @event mestre_finalizou_turno → room (broadcast) | turno do jogador encerrado pelo mestre
  ctx.sm.sendToRoom(ctx.roomId, 'mestre_finalizou_turno', {
    jogador: ctx.username,
    contador: turno.contadorInteracoes,
    motivo: mestreSinalizouFim ? 'mestre_sinalizou' : (atingiuLimiteInteracoes ? 'limite_interacoes' : 'acao_completa'),
    timestamp: Date.now()
  });

  setTimeout(async () => {
    try {
      await ctx.sm.avancarProximoTurno(ctx.roomId);
    } catch (error) {
      log.error({ err: error }, 'Erro ao avancar turno');
      // @event erro_sistema → room (broadcast) | erro ao avançar turno
      ctx.sm.sendToRoom(ctx.roomId, 'erro_sistema', { message: 'Erro ao avançar turno. Tente novamente.' });
    }
  }, 500);
}

const RESPONSE_HANDLERS = [
  { nome: 'combate_inicio', check: (r, ctx) => r.combate?.iniciado && !ctx.combateAtivo, process: processarInicioCombate },
  { nome: 'fuga_combate', check: (r, ctx) => ctx.combateAtivo && ctx.sessao?._combatePreResolvido?.fuga?.sucesso, process: processarFugaCombate },
  { nome: 'acao_combate', check: (r, ctx) => ctx.combateAtivo && !ctx.sessao?._combatePreResolvido?.fuga?.sucesso, process: processarAcaoCombateHandler },
  { nome: 'solicita_dados', check: (r) => r.solicitaDados?.solicita || !!r.teste, process: criarSolicitacaoTeste },
  { nome: 'acoes_mecanicas', check: (r) => r.acoes?.length > 0, process: processarAcoesMecanicas },
  { nome: 'limpar_dados', check: (r) => !r.solicitaDados?.solicita && !r.teste, process: limparFlagDados },
  { nome: 'controle_turno', check: (r, ctx) => ctx.fase === 'rodada_em_andamento' && !ctx.combateAtivo, process: processarControleTurno }
];

export async function despacharResposta(resposta, ctx) {
  for (const handler of RESPONSE_HANDLERS) {
    if (!handler.check(resposta, ctx)) continue;
    try {
      await handler.process(resposta, ctx);
    } catch (err) {
      log.error({ err, handler: handler.nome }, 'RespostaDispatcher erro no handler');
    }
  }

  // @event turno_estado_atualizado → room (broadcast) | estado do turno após despacho
  ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);
}
