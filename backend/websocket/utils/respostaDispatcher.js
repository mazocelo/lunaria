/**
 * AI Response Dispatcher - processa blocos da resposta do Mestre IA em sequencia.
 */
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'respostaDispatcher' });

import { processarAcoes } from '../../helpers/acoesProcessor.js';
import { prepararTurno } from '../../helpers/gameEngine.js';
import { getTurnActionLimit } from '../../helpers/historiaConfigHelper.js';
import { calcularModificadorTeste } from '../../helpers/testeHelper.js';
import {
  incrementTurnInteractions,
  transitionTurnState,
  TURN_STATUS
} from './turnStateMachine.js';
import {
  compactarTestesPendentes,
  criarTestePendente,
  criarTestesPendentes,
  emitirSolicitacaoTeste,
  getTestePendente,
  hasPendingTests,
  limparTestePendente
} from './testePipeline.js';
import { appendMensagemSessao, buildSolicitacaoDadosMensagem } from './sessionMessages.js';
import { createPendingCombatAction, hasPendingCombatAction } from './combatPendingAction.js';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldSkipDuplicateCombatAction(acao, ctx = {}) {
  const resolved = ctx.playerCombatActionResolved;
  if (!resolved || !acao?.tipo) return false;

  const actionType = String(acao.tipo);
  const resolvedType = String(resolved.tipo || '');
  const sameActor = normalizeText(acao.personagem) === normalizeText(ctx.personagem?.nome);
  const actionId = acao.habilidade_id || acao.magia_id || acao.id || null;
  const sameActionId = actionId != null && resolved.actionId != null && String(actionId) === String(resolved.actionId);
  const sameActionName = normalizeText(acao.nome) && normalizeText(acao.nome) === normalizeText(resolved.actionName);
  const skillOrSpellAction = ['usar_habilidade', 'conjurar_magia'].includes(actionType);
  const resolvedSkillOrSpell = ['usar_habilidade', 'conjurar_magia'].includes(resolvedType);

  if (resolvedSkillOrSpell && skillOrSpellAction && (sameActionId || sameActionName)) {
    return true;
  }

  if (resolvedSkillOrSpell && sameActor && ['aplicar_vantagem', 'aplicar_efeito'].includes(actionType)) {
    return true;
  }

  return false;
}

function isCombatActive(ctx = {}) {
  return Boolean(ctx.sessao?.estadoJogo?.combate?.ativo || ctx.combateAtivo);
}

function buildResolvedCombatMeta(intent, resultados) {
  if (!intent && !resultados) return null;
  return {
    tipo: intent?.tipo || resultados?.intentTipo || null,
    actionId: intent?.habilidadeId || intent?.magiaId || null,
    actionName: intent?.habilidadeNome || intent?.magiaNome || null,
    targetId: intent?.alvoId
      || resultados?.ataqueJogador?.alvoId
      || resultados?.habilidade?.ataque?.alvoId
      || null,
    source: 'pre_resolved'
  };
}

function emitCombatTestPrompt(resposta, ctx, testePendente) {
  if (!testePendente) return;

  let modificadorPreview = 0;
  let atributoPreview = null;
  try {
    const jogadorInfo = ctx.sessao.jogadores?.[String(testePendente.jogadorAlvo || ctx.userId)];
    const personagemId = jogadorInfo?.personagemId;
    const personagemCompleto = personagemId
      ? ctx.sessao.personagensCompletos?.[String(personagemId)]
      : (ctx.personagemCompleto || null);

    if (personagemCompleto && testePendente.teste) {
      const modInfo = calcularModificadorTeste(personagemCompleto, testePendente.teste);
      modificadorPreview = modInfo.totalModificador;
      atributoPreview = modInfo.atributoNome;
    }
  } catch (_error) {
    // fail-open: prompt de teste ainda pode ser emitido sem preview
  }

  appendMensagemSessao(ctx.sessao, buildSolicitacaoDadosMensagem({
    narrativa: resposta.narracao,
    origem: testePendente.origem || 'combate',
    payload: {
      groupId: testePendente.groupId,
      testePendente,
      testesPendentes: [testePendente],
      tipoDado: testePendente.tipoDado,
      teste: testePendente.teste,
      dificuldade: testePendente.dificuldade,
      modificador: modificadorPreview,
      atributo: atributoPreview,
      contexto: testePendente.contexto
    }
  }));

  emitirSolicitacaoTeste(ctx.sm, ctx.roomId, ctx.sessao, {
    narrativa: resposta.narracao,
    tipoDado: testePendente.tipoDado,
    teste: testePendente.teste,
    dificuldade: testePendente.dificuldade,
    modificador: modificadorPreview,
    atributo: atributoPreview,
    contexto: testePendente.contexto,
    testesPendentes: [testePendente],
    testePendente
  });
}

async function ensureCombatPreResolution(resposta, ctx) {
  const combate = ctx.sessao?.estadoJogo?.combate;
  if (!combate?.ativo) return;
  if (ctx.sessao?._combatePreResolvido || hasPendingCombatAction(ctx.sessao)) return;

  const resultados = await prepararTurno(ctx.sessao, ctx.userId, {
    mensagem: ctx.mensagem,
    explicitIntent: ctx.combatIntent
  });

  if (!resultados || resultados.requerIntentMestre) return;

  if (resultados.requerTeste) {
    const rt = resultados.requerTeste;
    const personagemRuntime = ctx.personagemCompleto || ctx.personagem;
    const testeCriado = criarTestePendente(ctx.sessao, {
      origem: 'combate',
      jogadorAlvo: ctx.userId,
      personagemAlvo: personagemRuntime?.nome || ctx.personagem?.nome || ctx.username,
      teste: rt.teste,
      dificuldade: rt.dcNumerico,
      tipoDado: rt.tipoDado || 'd20',
      contexto: rt.contexto,
      metadata: { ...(rt.metadata || {}), difficultyLabel: rt.dificuldadeLabel || rt.dificuldade }
    }, ctx.userId);

    createPendingCombatAction(ctx.sessao, {
      tipo: rt.intentTipo,
      userId: ctx.userId,
      personagem: {
        nome: personagemRuntime?.nome || ctx.personagem?.nome || ctx.username,
        id: personagemRuntime?.id ?? ctx.personagem?.id ?? null,
        personagemId: personagemRuntime?.personagemId || personagemRuntime?.personagem_id || ctx.personagem?.personagemId || ctx.personagem?.personagem_id || null
      },
      combatIntent: ctx.combatIntent,
      testeId: testeCriado?.id || null,
      statusEfeitos: resultados.statusEfeitos || [],
      ...(rt.pendingCombatAction || {})
    });

    emitCombatTestPrompt(resposta, ctx, testeCriado);
  } else {
    ctx.sessao._combatePreResolvido = resultados;
  }

  ctx.playerCombatActionResolved = buildResolvedCombatMeta(ctx.combatIntent, resultados);
}

function shouldHoldTurnForContinuity(resposta = {}, ctx = {}, turno = {}) {
  if ((turno?.contadorInteracoes || 0) !== 1) return false;
  if (isCombatActive(ctx)) return false;
  if (hasPendingCombatAction(ctx.sessao)) return false;
  if (hasPendingTests(ctx.sessao)) return false;
  if (resposta.solicitaDados?.solicita === true) return false;
  if (resposta.teste) return false;
  if (resposta.combate?.iniciado) return false;
  if (Array.isArray(resposta.acoes) && resposta.acoes.length > 0) return false;

  return resposta.fimDeTurno === true || resposta.acaoCompleta === true;
}

async function processarInicioCombate(resposta, ctx) {
  ctx.sm.log('INFO', 'COMBATE_DETECTADO_PELA_IA', ctx.socket.id, ctx.userId, {
    roomId: ctx.roomId,
    monstros: resposta.combate.monstros,
    motivo: resposta.combate.motivo,
    dificuldade: resposta.combate.dificuldade
  });
  await ctx.sm.iniciarCombate(ctx.roomId, resposta.combate, ctx.sessao, ctx.userId);
  ctx.combateAtivo = true;
}

async function processarAcaoCombateHandler(resposta, ctx) {
  await ensureCombatPreResolution(resposta, ctx);
  if (!ctx.sessao?._combatePreResolvido) {
    return;
  }
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

  emitirSolicitacaoTeste(ctx.sm, ctx.roomId, ctx.sessao, {
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

  const acoesFiltradas = resposta.acoes.filter((acao) => !shouldSkipDuplicateCombatAction(acao, ctx));
  if (!acoesFiltradas.length) {
    log.info({
      roomId: ctx.roomId,
      userId: ctx.userId,
      tipoResolvido: ctx.playerCombatActionResolved?.tipo || null
    }, 'Acoes mecanicas duplicadas da IA foram ignoradas');
    return;
  }

  const existeTestePendente = hasPendingTests(ctx.sessao);
  if (existeTestePendente) {
    const acoesPosTeste = acoesFiltradas.filter(acao => {
      const stage = acao?.stage || (acao?.dependeDeTeste ? 'posTeste' : 'independente');
      return stage === 'posTeste';
    });
    ctx.sessao.estadoJogo = ctx.sessao.estadoJogo || {};
    ctx.sessao.estadoJogo.acoesPendentesTeste = acoesPosTeste;
  }

  await processarAcoes(acoesFiltradas, ctx.sessao, ctx.roomId, ctx.sm, {
    stage: existeTestePendente ? 'preTeste' : 'all',
    userId: ctx.userId,
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
  const limiteInteracoesTurno = getTurnActionLimit(ctx.sessao?.historiaConfig);
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);

  const existeTestePendente = hasPendingTests(ctx.sessao, { groupId: turno.loteTesteAtivo });
  const mestreSinalizouFim = resposta.fimDeTurno || false;
  const acaoCompleta = resposta.acaoCompleta || false;
  const atingiuLimiteInteracoes = turno.contadorInteracoes >= limiteInteracoesTurno;
  const podeFinalizar = !existeTestePendente
    && (mestreSinalizouFim || atingiuLimiteInteracoes || acaoCompleta);

  if (!podeFinalizar) {
    if (existeTestePendente) {
      ctx.sm.log('INFO', 'TURN_FINALIZATION_BLOCKED_PENDING_TEST', ctx.socket.id, ctx.userId, {
        roomId: ctx.roomId,
        contadorAtual: turno.contadorInteracoes,
        limiteInteracoesTurno
      });
    }
    ctx.sm.emitirEstadoTurno(ctx.roomId, ctx.sessao);
    return;
  }

  if (shouldHoldTurnForContinuity(resposta, ctx, turno)) {
    ctx.sm.log('INFO', 'TURN_HOLD_CONTINUIDADE', ctx.socket.id, ctx.userId, {
      roomId: ctx.roomId,
      contadorAtual: turno.contadorInteracoes
    });
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

// ── Transicao de Arco ──

async function processarTransicaoArco(resposta, ctx) {
  const roteiro = ctx.sessao.historiaRoteiro;
  const progressao = ctx.sessao.estadoJogo.progressao || {};
  const arcoAtual = progressao.arco_atual || 1;
  const arcos = roteiro.arcos || [];
  const totalArcos = arcos.length;

  if (arcoAtual > totalArcos) {
    log.warn({ arcoAtual, totalArcos }, 'arcoStatus.concluido recebido mas ja no ultimo arco');
    return;
  }

  // Marcar marcos do arco atual como concluidos
  const marcos = progressao.marcos || [];
  for (const marco of marcos) {
    if (marco.arco === arcoAtual && !marco.concluido) {
      marco.concluido = true;
    }
  }

  const arcoAnterior = arcoAtual;
  const arcoNovo = arcoAtual < totalArcos ? arcoAtual + 1 : null;
  const tituloAnterior = arcos[arcoAtual - 1]?.titulo || `Arco ${arcoAtual}`;
  const tituloNovo = arcoNovo ? (arcos[arcoNovo - 1]?.titulo || `Arco ${arcoNovo}`) : null;

  // Avancar arco
  progressao.arco_atual = arcoNovo || arcoAtual;
  progressao.porcentagem_estimada = Math.round((arcoAnterior / totalArcos) * 100);
  ctx.sessao.estadoJogo.progressao = progressao;

  // Registrar memoria semantica da transicao
  const memorias = ctx.sessao.estadoJogo.memoriaSemantica || [];
  memorias.push({
    tipo: 'fato',
    descricao: `Arco "${tituloAnterior}" concluido. ${resposta.arcoStatus.motivo || ''}`.trim(),
    envolvidos: [],
    permanente: true,
    importancia: 5,
    timestamp: new Date().toISOString()
  });
  ctx.sessao.estadoJogo.memoriaSemantica = memorias;

  // Persistir sessao
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);

  // Invalidar cache do mestre para reconstruir com novo arco
  ctx.sm.mestresCache?.delete(ctx.roomId);

  // @event transicao_arco → room (broadcast) | arco concluido
  ctx.sm.sendToRoom(ctx.roomId, 'transicao_arco', {
    arcoAnterior,
    arcoNovo,
    tituloAnterior,
    tituloNovo,
    motivo: resposta.arcoStatus.motivo || null,
    porcentagem: progressao.porcentagem_estimada,
    timestamp: Date.now()
  });

  log.info({ arcoAnterior, arcoNovo, tituloAnterior, tituloNovo }, 'Transicao de arco processada');
}

// ── Fallback: detectar combate pela narrativa quando IA esqueceu o campo ──
const COMBAT_SIGNAL_PATTERNS = [
  /\b(?:ataca|avança contra|ergue.*garras|rosna|investe contra|desfere.*golpe|salta.*sobre)\b/i,
  /\b(?:postura.*ameaçad|pronto.*para.*atacar|hostil|lan[çc]a-se.*contra|lan[çc]ando-se)\b/i,
  /garras.*(?:estendidas|afiadas|imundas|erguidas)/i,
  /\b(?:emerge|materializa|surge).*(?:hostil|ameaç|atac)/i,
  /\b(?:garras|presas|dentes|mandibulas).*(?:afiad|expost|pront)/i,
];

const CREATURE_TYPES_MAP = {
  demonio: 'demonio', dretch: 'demonio', diabo: 'demonio', sucubo: 'demonio', imp: 'demonio',
  goblin: 'humanoide', orc: 'humanoide', bandido: 'humanoide', esqueleto: 'morto-vivo',
  zumbi: 'morto-vivo', fantasma: 'morto-vivo', lobo: 'besta', urso: 'besta', aranha: 'besta',
  dragao: 'dragao', slime: 'aberracao', golem: 'constructo', elemental: 'elemental',
};

function detectarCombateNarrativa(narracao, sessao) {
  if (!narracao || narracao.length < 50) return null;
  const texto = narracao.toLowerCase();

  // Precisa de sinal de hostilidade
  const temSinalHostil = COMBAT_SIGNAL_PATTERNS.some(p => p.test(texto));
  if (!temSinalHostil) return null;

  // Procurar nome de criatura conhecida
  for (const [criatura, tipo] of Object.entries(CREATURE_TYPES_MAP)) {
    if (texto.includes(criatura)) {
      log.info({ criatura, tipo }, 'Fallback: combate detectado na narrativa sem campo combate');
      return {
        iniciado: true,
        monstros: [{ nome: criatura.charAt(0).toUpperCase() + criatura.slice(1), tipo, quantidade: 1, nivel_sugerido: 1 }],
        motivo: 'criatura hostil detectada na narrativa (fallback)',
        dificuldade: 'media'
      };
    }
  }

  return null;
}

async function processarIntentSugerido(resposta, ctx) {
  const sugerido = resposta.intentSugerido;
  log.info({ tipo: sugerido.tipo, teste: sugerido.teste }, 'processing intentSugerido from Mestre');

  if (sugerido.tipo === 'teste') {
    const { obterDC } = await import('../../helpers/testeHelper.js');
    const dc = typeof sugerido.dificuldade === 'number'
      ? sugerido.dificuldade
      : obterDC(sugerido.dificuldade || 'Média');

    const testeCriado = criarTestePendente(ctx.sessao, {
      origem: 'combate',
      jogadorAlvo: ctx.userId,
      personagemAlvo: ctx.personagem?.nome || ctx.username,
      teste: sugerido.teste || 'Força',
      dificuldade: dc,
      tipoDado: 'd20',
      contexto: sugerido.justificativa || '',
      metadata: { source: 'intentSugerido' }
    }, ctx.userId);

    // Persist to session history
    appendMensagemSessao(ctx.sessao, buildSolicitacaoDadosMensagem({
      narrativa: resposta.narracao,
      origem: 'combate',
      payload: {
        testePendente: testeCriado,
        testesPendentes: [testeCriado],
        tipoDado: 'd20',
        teste: sugerido.teste,
        dificuldade: sugerido.dificuldade,
        contexto: sugerido.justificativa
      }
    }));

    emitirSolicitacaoTeste(ctx.sm, ctx.roomId, ctx.sessao, {
      narrativa: resposta.narracao,
      tipoDado: 'd20',
      teste: sugerido.teste,
      dificuldade: sugerido.dificuldade,
      contexto: sugerido.justificativa,
      testePendente: testeCriado
    });

    await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
  } else if (sugerido.tipo === 'atacar' || sugerido.tipo === 'defender') {
    const resultado = await prepararTurno(ctx.sessao, ctx.userId, { tipo: sugerido.tipo });
    if (resultado && !resultado.requerTeste) {
      ctx.sessao._combatePreResolvido = resultado;
      await ctx.sm.processarAcaoCombate(
        ctx.roomId, ctx.userId, ctx.username, ctx.personagem, ctx.mensagem, resposta, ctx.sessao
      );
    }
  }
}

const RESPONSE_HANDLERS = [
  { nome: 'combate_inicio', check: (r, ctx) => r.combate?.iniciado && !isCombatActive(ctx), process: processarInicioCombate },
  {
    nome: 'combate_fallback',
    check: (r, ctx) => {
      const combateIniciado = r.combate?.iniciado;
      const combateActive = isCombatActive(ctx);
      if (combateIniciado || combateActive) {
        log.warn({ combateIniciado, combateActive }, 'COMBATE_FALLBACK: skip (already active or AI signaled)');
        return false;
      }
      const detected = detectarCombateNarrativa(r.narracao, ctx.sessao);
      log.warn({ detected: !!detected, narracaoLen: r.narracao?.length }, 'COMBATE_FALLBACK: check result');
      if (detected) {
        log.warn({ criatura: detected.monstros?.[0]?.nome, motivo: detected.motivo }, 'COMBATE_FALLBACK: detectado na narrativa');
      }
      return !!detected;
    },
    process: async (resposta, ctx) => {
      const combateDetectado = detectarCombateNarrativa(resposta.narracao, ctx.sessao);
      log.warn({ combateDetectado }, 'COMBATE_FALLBACK: iniciando combate via fallback');
      resposta.combate = combateDetectado;
      await processarInicioCombate(resposta, ctx);
    }
  },
  { nome: 'fuga_combate', check: (r, ctx) => isCombatActive(ctx) && ctx.sessao?._combatePreResolvido?.fuga?.sucesso, process: processarFugaCombate },
  { nome: 'acao_combate', check: (r, ctx) => isCombatActive(ctx) && !ctx.sessao?._combatePreResolvido?.fuga?.sucesso && !hasPendingCombatAction(ctx.sessao), process: processarAcaoCombateHandler },
  // Phase 2 — handle Mestre-suggested intent for creative actions
  {
    nome: 'intent_sugerido',
    check: (r, ctx) => isCombatActive(ctx)
      && r.intentSugerido
      && !ctx.sessao._combatePreResolvido
      && !r.solicitaDados?.solicita,
    process: processarIntentSugerido
  },
  { nome: 'solicita_dados', check: (r, ctx) => (r.solicitaDados?.solicita || !!r.teste) && !hasPendingCombatAction(ctx.sessao), process: criarSolicitacaoTeste },
  { nome: 'acoes_mecanicas', check: (r) => r.acoes?.length > 0, process: processarAcoesMecanicas },
  { nome: 'transicao_arco', check: (r, ctx) => r.arcoStatus?.concluido === true && ctx.sessao?.historiaRoteiro?.arcos?.length > 0, process: processarTransicaoArco },
  { nome: 'limpar_dados', check: (r, ctx) => !r.solicitaDados?.solicita && !r.teste && !hasPendingCombatAction(ctx.sessao), process: limparFlagDados },
  { nome: 'controle_turno', check: (r, ctx) => ctx.fase === 'rodada_em_andamento' && !isCombatActive(ctx), process: processarControleTurno }
];

export async function despacharResposta(resposta, ctx) {
  log.warn({ narracaoLen: resposta?.narracao?.length, combateIA: !!resposta?.combate?.iniciado, combateIniciado: resposta?.combate?.iniciado, combateAtivo: !!ctx.combateAtivo, combateSessao: !!ctx.sessao?.estadoJogo?.combate?.ativo }, 'despacharResposta chamado');
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
