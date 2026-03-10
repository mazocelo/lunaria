/**
 * AI Response Dispatcher — processa blocos da resposta do Mestre IA em sequência
 *
 * Cada handler recebe (resposta, ctx) onde ctx contém:
 *   { roomId, userId, username, personagem, mensagem, sessao, socket, io, sm (socketManager), fase, combateAtivo }
 */

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

async function processarAcoesMecanicas(resposta, ctx) {
  const { processarAcoes } = await import('../../helpers/acoesProcessor.js');
  await processarAcoes(resposta.acoes, ctx.sessao, ctx.roomId, ctx.io);
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
}

async function processarSolicitaDados(resposta, ctx) {
  ctx.sm.log('INFO', 'MENSAGEM_PARA_MESTRE_DADOS_SOLICITADOS_JSON', ctx.socket.id, ctx.userId, {
    roomId: ctx.roomId,
    teste: resposta.solicitaDados.teste,
    tipo: resposta.solicitaDados.tipo,
    dificuldade: resposta.solicitaDados.dificuldade
  });
  console.log('🎲 Mestre solicitou dados (JSON):', resposta.solicitaDados);

  const estadoJogoAtual = ctx.sessao.estadoJogo || {};
  estadoJogoAtual.dadosSolicitados = true;
  estadoJogoAtual.testeInfo = {
    teste: resposta.solicitaDados.teste || null,
    dificuldade: resposta.solicitaDados.dificuldade || 'Média',
    jogadorAlvo: ctx.userId
  };
  ctx.sessao.estadoJogo = estadoJogoAtual;

  const mensagemAguardando = {
    tipo: 'aguardando_dados',
    userId: 'sistema',
    username: 'Sistema',
    mensagem: `⏳ Aguardando ${ctx.username} rolar ${resposta.solicitaDados.tipo} para ${resposta.solicitaDados.teste}`,
    jogadorAguardando: ctx.username,
    dadoSolicitado: resposta.solicitaDados.tipo,
    teste: resposta.solicitaDados.teste,
    timestamp: Date.now()
  };

  ctx.sessao.mensagens.push(mensagemAguardando);
  await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
  console.log(`💬 Mensagem de aguardando dados salva no Redis + flag dadosSolicitados = true`);

  // Calcular modificador antecipado para mostrar no banner
  let modificadorPreview = 0;
  let atributoPreview = null;
  try {
    const { calcularModificadorTeste } = await import('../../helpers/testeHelper.js');
    const jogadorInfo = ctx.sessao.jogadores?.[ctx.userId];
    const pId = jogadorInfo?.personagemId;
    const pCompleto = pId ? ctx.sessao.personagensCompletos?.[String(pId)] : null;
    if (pCompleto && resposta.solicitaDados.teste) {
      const modInfo = calcularModificadorTeste(pCompleto, resposta.solicitaDados.teste);
      modificadorPreview = modInfo.totalModificador;
      atributoPreview = modInfo.atributoNome;
    }
  } catch (e) {
    console.warn('⚠️ Erro ao calcular modificador preview:', e.message);
  }

  ctx.io.to(ctx.roomId).emit('mestre_solicita_dados', {
    narrativa: resposta.narracao,
    tipoDado: resposta.solicitaDados.tipo,
    teste: resposta.solicitaDados.teste,
    dificuldade: resposta.solicitaDados.dificuldade,
    modificador: modificadorPreview,
    atributo: atributoPreview,
    timestamp: Date.now()
  });
}

async function limparFlagDados(resposta, ctx) {
  const estadoJogoAtual = ctx.sessao.estadoJogo || {};
  if (estadoJogoAtual.dadosSolicitados) {
    estadoJogoAtual.dadosSolicitados = false;
    estadoJogoAtual.testeInfo = null;
    ctx.sessao.estadoJogo = estadoJogoAtual;
    await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
    console.log(`🔄 Flag dadosSolicitados limpa (Mestre não solicitou)`);
  }
}

async function processarControleTurno(resposta, ctx) {
  const contador = await ctx.sm.gerenciadorSessoes.incrementarContadorMensagensTurno(ctx.roomId);

  ctx.sm.log('INFO', 'MENSAGEM_PARA_MESTRE_CONTADOR_INCREMENTADO', ctx.socket.id, ctx.userId, {
    roomId: ctx.roomId,
    contadorAtual: contador
  });

  const mestreSinalizouFim = resposta.fimDeTurno || false;

  if (mestreSinalizouFim) {
    console.log(`🎭 Mestre sinalizou fim de turno via JSON (fimDeTurno: true)`);
    setTimeout(() => {
      ctx.io.to(ctx.roomId).emit('mestre_finalizou_turno', {
        jogador: ctx.username,
        contador: contador,
        timestamp: Date.now()
      });
      console.log('✅ Evento mestre_finalizou_turno emitido após 500ms');
    }, 500);
  }

  if (mestreSinalizouFim || contador >= 4) {
    const motivo = mestreSinalizouFim ? 'mestre_sinalizou' : 'limite_atingido';

    ctx.sm.log('INFO', 'MENSAGEM_PARA_MESTRE_FIM_TURNO', ctx.socket.id, ctx.userId, {
      roomId: ctx.roomId,
      contador,
      motivo,
      jogador: ctx.username
    });

    console.log(`🏁 Fim de turno detectado (${motivo}) - Aguardando 500ms para avançar`);

    setTimeout(async () => {
      try {
        await ctx.sm.avancarProximoTurno(ctx.roomId);
        console.log('✅ Turno avançado após 500ms');
      } catch (error) {
        console.error('❌ Erro ao avançar turno:', error);
        ctx.io.to(ctx.roomId).emit('erro_sistema', { message: 'Erro ao avançar turno. Tente novamente.' });
      }
    }, 500);
  }
}

/**
 * Pipeline de handlers — executados em ordem, cada um com sua condição
 */
const RESPONSE_HANDLERS = [
  { nome: 'combate_inicio', check: (r, ctx) => r.combate?.iniciado && !ctx.combateAtivo, process: processarInicioCombate },
  { nome: 'acao_combate', check: (r, ctx) => ctx.combateAtivo, process: processarAcaoCombateHandler },
  { nome: 'fuga_combate', check: (r, ctx) => ctx.combateAtivo && r.combate?.fuga, process: processarFugaCombate },
  { nome: 'acoes_mecanicas', check: (r) => r.acoes?.length > 0, process: processarAcoesMecanicas },
  { nome: 'solicita_dados', check: (r) => r.solicitaDados?.solicita, process: processarSolicitaDados },
  { nome: 'limpar_dados', check: (r) => !r.solicitaDados?.solicita, process: limparFlagDados },
  { nome: 'controle_turno', check: (r, ctx) => ctx.fase === 'rodada_em_andamento' && !ctx.combateAtivo, process: processarControleTurno },
];

export async function despacharResposta(resposta, ctx) {
  for (const handler of RESPONSE_HANDLERS) {
    if (handler.check(resposta, ctx)) {
      try {
        await handler.process(resposta, ctx);
      } catch (err) {
        console.error(`❌ RespostaDispatcher [${handler.nome}]:`, err.message);
      }
    }
  }
}
