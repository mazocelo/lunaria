/**
 * AcoesProcessor - Processa ações mecânicas retornadas pelo Mestre IA
 *
 * O Mestre retorna um array de ações no JSON de resposta.
 * Cada ação é processada mecanicamente e emitida via WebSocket.
 */
import db from '../Model/index.js';
import { calcularHP, calcularEsquiva, calcularArmadura, aplicarResistencias } from './combateHelper.js';

/**
 * Persiste estado runtime (HP, status_efeitos) no clone da sessão
 * Chamada fire-and-forget para não bloquear o fluxo de jogo
 */
async function persistirEstadoClone(roomId, personagemId, dados) {
  try {
    const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
    if (!sessaoJogoRow) return;
    const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
      sessaoJogoRow.id, parseInt(personagemId)
    );
    if (!clone) return;
    await db.PersonagemSessao.atualizarRuntime(clone.id, dados);
  } catch (e) {
    console.warn(`⚠️ persistirEstadoClone: Erro ao persistir no clone:`, e.message);
  }
}

/**
 * Encontra personagem na sessão pelo nome
 * @returns {{ personagemId, userId, personagem }} ou null
 */
function encontrarPersonagemPorNome(sessao, nome) {
  if (!nome) return null;
  const completos = sessao.personagensCompletos || {};
  for (const [pId, p] of Object.entries(completos)) {
    if (p.nome?.toLowerCase() === nome.toLowerCase()) {
      const jogadores = sessao.jogadoresConectados || [];
      const jogador = jogadores.find(j =>
        String(j.personagemId || j.personagem_id) === String(pId)
      );
      if (!jogador) {
        console.warn(`⚠️ Personagem "${nome}" encontrado mas sem jogador conectado`);
      }
      return { personagemId: pId, userId: jogador ? String(jogador.userId || jogador.id) : null, personagem: p };
    }
  }
  return null;
}

/**
 * Registry de handlers por tipo de ação — extensível sem modificar o dispatcher
 */
const ACTION_HANDLERS = new Map([
  ['dar_item', processarDarItem],
  ['remover_item', processarRemoverItem],
  ['curar', processarCurar],
  ['aplicar_dano', processarAplicarDano],
  ['aplicar_status', processarAplicarStatus],
  ['remover_status', processarRemoverStatus],
]);

/**
 * Processa array de ações mecânicas do Mestre
 */
export async function processarAcoes(acoes, sessao, roomId, io) {
  if (!acoes?.length) return;

  for (const acao of acoes) {
    try {
      const handler = ACTION_HANDLERS.get(acao.tipo);
      if (handler) {
        await handler(acao, sessao, roomId, io);
      } else {
        console.warn(`⚠️ AcoesProcessor: tipo de ação desconhecido: ${acao.tipo}`);
      }
    } catch (error) {
      console.error(`❌ AcoesProcessor: Erro ao processar ação ${acao.tipo}:`, error.message);
    }
  }
}

/**
 * dar_item: Busca equipamento no DB e adiciona ao inventário do personagem na sessão
 */
async function processarDarItem(acao, sessao, roomId, io) {
  const { item, personagem: nomePersonagem } = acao;
  if (!item || !nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) {
    console.warn(`⚠️ dar_item: Personagem "${nomePersonagem}" não encontrado na sessão`);
    return;
  }

  // Buscar equipamento no banco
  const equipamento = await db.Equipamento.findByNome(item);
  if (!equipamento) {
    console.warn(`⚠️ dar_item: Equipamento "${item}" não encontrado no banco`);
    return;
  }

  // Adicionar ao inventário na sessão (não persiste no DB, apenas na sessão ativa)
  if (!alvo.personagem.equipamentos) alvo.personagem.equipamentos = [];
  const jaTemItem = alvo.personagem.equipamentos.some(e => e.id === equipamento.id);
  if (jaTemItem) {
    console.warn(`⚠️ dar_item: ${nomePersonagem} ja possui ${equipamento.nome}, ignorando duplicata`);
    return;
  }
  alvo.personagem.equipamentos.push({
    id: equipamento.id,
    nome: equipamento.nome,
    tipo: equipamento.tipo,
    elemento: equipamento.elemento,
    bonus: equipamento.bonus,
    dano_base: equipamento.dano_base
  });

  console.log(`🎁 dar_item: ${equipamento.nome} → ${nomePersonagem}`);

  // Persistir no clone da sessão (se existir)
  try {
    const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
    if (sessaoJogoRow) {
      const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
        sessaoJogoRow.id, parseInt(alvo.personagemId)
      );
      if (clone) {
        await db.PersonagemSessao.registrarItemGanho(clone.id, {
          equipamento_id: equipamento.id, nome: equipamento.nome, origem: 'narrativa'
        });
      }
    }
  } catch (e) {
    console.warn(`⚠️ dar_item: Erro ao persistir no clone:`, e.message);
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'item_recebido',
    personagem: nomePersonagem,
    userId: alvo.userId,
    item: {
      id: equipamento.id,
      nome: equipamento.nome,
      tipo: equipamento.tipo,
      elemento: equipamento.elemento,
      raridade: equipamento.raridade_rel?.nome || null
    },
    timestamp: Date.now()
  });
}

/**
 * remover_item: Remove item do inventário do personagem na sessão
 */
async function processarRemoverItem(acao, sessao, roomId, io) {
  const { item, personagem: nomePersonagem } = acao;
  if (!item || !nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.personagem.equipamentos) return;

  const idx = alvo.personagem.equipamentos.findIndex(
    e => e.nome?.toLowerCase() === item.toLowerCase()
  );
  if (idx === -1) return;

  const removido = alvo.personagem.equipamentos.splice(idx, 1)[0];
  console.log(`🗑️ remover_item: ${removido.nome} ← ${nomePersonagem}`);

  // Persistir no clone da sessão (se existir)
  try {
    const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
    if (sessaoJogoRow) {
      const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
        sessaoJogoRow.id, parseInt(alvo.personagemId)
      );
      if (clone) {
        await db.PersonagemSessao.registrarItemPerdido(clone.id, {
          equipamento_id: removido.id, nome: removido.nome, motivo: 'narrativa'
        });
      }
    }
  } catch (e) {
    console.warn(`⚠️ remover_item: Erro ao persistir no clone:`, e.message);
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'item_removido',
    personagem: nomePersonagem,
    userId: alvo.userId,
    item: { nome: removido.nome },
    timestamp: Date.now()
  });
}

/**
 * curar: Restaura HP do personagem (dentro ou fora de combate)
 */
async function processarCurar(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, hp } = acao;
  if (!nomePersonagem || hp == null || hp === 0) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  const combate = sessao.estadoJogo?.combate;
  let hpAnterior, hpNovo, hpMax;

  if (combate?.ativo && alvo.userId && combate.jogadores[alvo.userId]) {
    // Em combate: atualizar HP no estado de combate
    const jogadorCombate = combate.jogadores[alvo.userId];
    hpAnterior = jogadorCombate.hp_atual;
    hpMax = jogadorCombate.hp_max;
    jogadorCombate.hp_atual = Math.min(hpMax, jogadorCombate.hp_atual + hp);
    hpNovo = jogadorCombate.hp_atual;
    if (jogadorCombate.status === 'derrotado' && hpNovo > 0) {
      jogadorCombate.status = 'vivo';
    }
  } else {
    // Fora de combate: calcular HP max e armazenar na sessão
    const attrs = alvo.personagem.atributos || {};
    hpMax = calcularHP({ constituicao: attrs.constituicao || 10, nivel: alvo.personagem.nivel || 1 });
    hpAnterior = alvo.personagem.hp_atual ?? hpMax;
    hpNovo = Math.min(hpMax, hpAnterior + hp);
    alvo.personagem.hp_atual = hpNovo;
  }

  console.log(`💚 curar: ${nomePersonagem} +${hp}HP (${hpAnterior} → ${hpNovo})`);

  // Persistir HP no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, { hp_atual: hpNovo });
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'curado',
    personagem: nomePersonagem,
    userId: alvo.userId,
    hp_restaurado: hp,
    hp_atual: hpNovo,
    hp_max: hpMax,
    timestamp: Date.now()
  });
}

/**
 * aplicar_dano: Aplica dano direto (armadilhas, veneno, etc.)
 */
async function processarAplicarDano(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, dano, elemento } = acao;
  if (!nomePersonagem || dano == null || dano <= 0) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  let danoFinal = dano;
  const combate = sessao.estadoJogo?.combate;
  let hpAnterior, hpNovo, hpMax;

  // Aplicar resistências/imunidades elementais do personagem (se houver)
  if (elemento && alvo.personagem) {
    const resistencias = alvo.personagem.resistencias || {};
    const imunidades = alvo.personagem.imunidades || [];
    danoFinal = aplicarResistencias(danoFinal, elemento, resistencias, imunidades);
  }

  // Se imune (dano zerado por resistência), não aplica nada
  if (danoFinal <= 0) {
    io.to(roomId).emit('acao_mestre', {
      tipo: 'dano_recebido',
      personagem: nomePersonagem,
      userId: alvo.userId,
      dano: 0,
      elemento: elemento || null,
      imune: true,
      hp_atual: alvo.personagem.hp_atual,
      hp_max: null,
      derrotado: false,
      timestamp: Date.now()
    });
    return;
  }

  if (combate?.ativo && alvo.userId && combate.jogadores[alvo.userId]) {
    const jogadorCombate = combate.jogadores[alvo.userId];

    // Aplicar armadura (dano ambiental não ignora armadura por padrão)
    danoFinal = Math.max(1, danoFinal - (jogadorCombate.armadura || 0));

    hpAnterior = jogadorCombate.hp_atual;
    hpMax = jogadorCombate.hp_max;
    jogadorCombate.hp_atual = Math.max(0, jogadorCombate.hp_atual - danoFinal);
    hpNovo = jogadorCombate.hp_atual;
    if (hpNovo <= 0) jogadorCombate.status = 'derrotado';
  } else {
    const attrs = alvo.personagem.atributos || {};
    hpMax = calcularHP({ constituicao: attrs.constituicao || 10, nivel: alvo.personagem.nivel || 1 });
    hpAnterior = alvo.personagem.hp_atual ?? hpMax;
    hpNovo = Math.max(0, hpAnterior - danoFinal);
    alvo.personagem.hp_atual = hpNovo;
  }

  console.log(`💔 aplicar_dano: ${nomePersonagem} -${danoFinal}HP${elemento ? ` (${elemento})` : ''} (${hpAnterior} → ${hpNovo})`);

  // Persistir HP no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, { hp_atual: hpNovo });
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'dano_recebido',
    personagem: nomePersonagem,
    userId: alvo.userId,
    dano: danoFinal,
    elemento: elemento || null,
    hp_atual: hpNovo,
    hp_max: hpMax,
    derrotado: hpNovo <= 0,
    timestamp: Date.now()
  });
}

/**
 * aplicar_status: Aplica efeito de status temporário
 */
async function processarAplicarStatus(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, status, duracao } = acao;
  if (!nomePersonagem || !status) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  if (!alvo.personagem.status_efeitos) alvo.personagem.status_efeitos = [];

  // Evitar duplicatas
  const jaTemStatus = alvo.personagem.status_efeitos.find(s => s.nome === status);
  if (jaTemStatus) {
    jaTemStatus.duracao = duracao || 3;
    jaTemStatus.aplicado_em = Date.now();
  } else {
    alvo.personagem.status_efeitos.push({
      nome: status,
      duracao: duracao || 3,
      aplicado_em: Date.now()
    });
  }

  console.log(`⚡ aplicar_status: ${nomePersonagem} → ${status} (${duracao || 3} turnos)`);

  // Persistir status_efeitos no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      status_efeitos: alvo.personagem.status_efeitos
    });
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'status_aplicado',
    personagem: nomePersonagem,
    userId: alvo.userId,
    status,
    duracao: duracao || 3,
    timestamp: Date.now()
  });
}

/**
 * remover_status: Remove efeito de status
 */
async function processarRemoverStatus(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, status } = acao;
  if (!nomePersonagem || !status) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.personagem.status_efeitos) return;

  const idx = alvo.personagem.status_efeitos.findIndex(s => s.nome === status);
  if (idx === -1) return;

  alvo.personagem.status_efeitos.splice(idx, 1);

  console.log(`✨ remover_status: ${nomePersonagem} ← ${status}`);

  // Persistir status_efeitos no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      status_efeitos: alvo.personagem.status_efeitos
    });
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'status_removido',
    personagem: nomePersonagem,
    userId: alvo.userId,
    status,
    timestamp: Date.now()
  });
}

export { persistirEstadoClone };
export default { processarAcoes };
