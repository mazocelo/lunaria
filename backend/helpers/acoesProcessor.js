/**
 * AcoesProcessor - Processa ações mecânicas retornadas pelo Mestre IA
 *
 * O Mestre retorna um array de ações no JSON de resposta.
 * Cada ação é processada mecanicamente e emitida via WebSocket.
 */
import db from '../Model/index.js';
import { calcularHP, calcularMana, calcularEsquiva, calcularArmadura, aplicarResistencias } from './combateHelper.js';
import { setCooldown, checkCooldown } from './cooldownManager.js';
import { setConcentracao, quebrarConcentracao, checkDanoConcentracao } from './concentrationManager.js';
import { aplicarEfeito, removerEfeito } from './effectManager.js';
import { verificarLevelUp, xpParaNivel } from './evolucaoHelper.js';

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
  // 4 Pilares — novos handlers
  ['usar_habilidade', processarUsarHabilidade],
  ['conjurar_magia', processarConjurarMagia],
  ['ativar_desvantagem', processarAtivarDesvantagem],
  ['aplicar_vantagem', processarAplicarVantagem],
  ['aplicar_efeito', processarAplicarEfeito],
  ['remover_efeito', processarRemoverEfeito],
  ['dar_xp', processarDarXP],
  ['concentracao_quebrada', processarConcentracaoQuebrada],
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
    if ((jogadorCombate.status === 'derrotado' || jogadorCombate.status === 'inconsciente') && hpNovo > 0) {
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
    if (hpNovo <= 0 && jogadorCombate.status === 'vivo') jogadorCombate.status = 'inconsciente';
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

// ═══════════════════════════════════════════════════════════════
// 4 Pilares — Novos handlers
// ═══════════════════════════════════════════════════════════════

/**
 * usar_habilidade: Verifica mana/cooldown → deduz mana → seta cooldown → emite evento
 * acao: { tipo, personagem, habilidade_id, nome, custo_mana, cooldown_turnos, dano_base, elemento }
 */
async function processarUsarHabilidade(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, habilidade_id, nome, custo_mana = 0, cooldown_turnos = 0 } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  // Verificar cooldown
  if (habilidade_id && checkCooldown(sessao, alvo.userId, 'hab', habilidade_id)) {
    console.warn(`⚠️ usar_habilidade: ${nome} em cooldown para ${nomePersonagem}`);
    io.to(roomId).emit('acao_mestre', {
      tipo: 'habilidade_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
      nome, motivo: 'cooldown', timestamp: Date.now()
    });
    return;
  }

  // Verificar e deduzir mana
  if (custo_mana > 0) {
    const manaState = ensureManaState(sessao, alvo.userId, alvo.personagem);
    if (manaState.mana_atual < custo_mana) {
      console.warn(`⚠️ usar_habilidade: Mana insuficiente para ${nome} (${manaState.mana_atual}/${custo_mana})`);
      io.to(roomId).emit('acao_mestre', {
        tipo: 'habilidade_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
        nome, motivo: 'mana_insuficiente', mana_atual: manaState.mana_atual, custo: custo_mana,
        timestamp: Date.now()
      });
      return;
    }
    manaState.mana_atual -= custo_mana;
    persistirEstadoClone(roomId, alvo.personagemId, { mana_atual: manaState.mana_atual });
  }

  // Setar cooldown
  if (habilidade_id && cooldown_turnos > 0) {
    setCooldown(sessao, alvo.userId, 'hab', habilidade_id, cooldown_turnos);
  }

  console.log(`⚔️ usar_habilidade: ${nomePersonagem} usou ${nome} (mana: -${custo_mana}, cd: ${cooldown_turnos}t)`);

  io.to(roomId).emit('acao_mestre', {
    tipo: 'habilidade_usada', personagem: nomePersonagem, userId: alvo.userId,
    nome, habilidade_id, custo_mana, cooldown_turnos,
    dano_base: acao.dano_base || null, elemento: acao.elemento || null,
    timestamp: Date.now()
  });
}

/**
 * conjurar_magia: Verifica mana + concentração → deduz → registra concentração se aplicável
 * acao: { tipo, personagem, magia_id, nome, custo_mana, cooldown_turnos, usa_concentracao, duracao, dano_base, elemento }
 */
async function processarConjurarMagia(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, magia_id, nome, custo_mana = 0, cooldown_turnos = 0, usa_concentracao = false } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  // Verificar cooldown
  if (magia_id && checkCooldown(sessao, alvo.userId, 'mag', magia_id)) {
    console.warn(`⚠️ conjurar_magia: ${nome} em cooldown para ${nomePersonagem}`);
    io.to(roomId).emit('acao_mestre', {
      tipo: 'magia_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
      nome, motivo: 'cooldown', timestamp: Date.now()
    });
    return;
  }

  // Verificar e deduzir mana
  if (custo_mana > 0) {
    const manaState = ensureManaState(sessao, alvo.userId, alvo.personagem);
    if (manaState.mana_atual < custo_mana) {
      io.to(roomId).emit('acao_mestre', {
        tipo: 'magia_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
        nome, motivo: 'mana_insuficiente', mana_atual: manaState.mana_atual, custo: custo_mana,
        timestamp: Date.now()
      });
      return;
    }
    manaState.mana_atual -= custo_mana;
    persistirEstadoClone(roomId, alvo.personagemId, { mana_atual: manaState.mana_atual });
  }

  // Cooldown
  if (magia_id && cooldown_turnos > 0) {
    setCooldown(sessao, alvo.userId, 'mag', magia_id, cooldown_turnos);
  }

  // Concentração — se ativar nova, a anterior é quebrada automaticamente
  let concentracaoQuebrada = null;
  if (usa_concentracao) {
    const result = setConcentracao(sessao, alvo.userId, {
      id: magia_id, nome, duracao: acao.duracao || 10
    });
    concentracaoQuebrada = result.quebrada;
    if (concentracaoQuebrada) {
      io.to(roomId).emit('acao_mestre', {
        tipo: 'concentracao_quebrada', personagem: nomePersonagem, userId: alvo.userId,
        magia: concentracaoQuebrada.nome, motivo: 'nova_concentracao',
        timestamp: Date.now()
      });
    }
  }

  console.log(`🔮 conjurar_magia: ${nomePersonagem} conjurou ${nome} (mana: -${custo_mana}, conc: ${usa_concentracao})`);

  io.to(roomId).emit('acao_mestre', {
    tipo: 'magia_conjurada', personagem: nomePersonagem, userId: alvo.userId,
    nome, magia_id, custo_mana, usa_concentracao,
    dano_base: acao.dano_base || null, elemento: acao.elemento || null,
    concentracao_anterior_quebrada: concentracaoQuebrada?.nome || null,
    timestamp: Date.now()
  });
}

/**
 * ativar_desvantagem: Mestre ativa desvantagem narrativamente
 * Se DC presente, emite pedido de teste ao jogador
 * acao: { tipo, personagem, nome, dc, atributo, penalidade }
 */
async function processarAtivarDesvantagem(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, nome, dc, atributo } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  if (dc && atributo) {
    // Requer teste — emitir pedido
    console.log(`🎭 ativar_desvantagem: ${nome} → ${nomePersonagem} (DC ${dc} ${atributo})`);
    io.to(roomId).emit('acao_mestre', {
      tipo: 'desvantagem_teste_requerido', personagem: nomePersonagem, userId: alvo.userId,
      desvantagem: nome, dc, atributo, penalidade: acao.penalidade || null,
      timestamp: Date.now()
    });
  } else {
    // Ativação automática (narrativa)
    console.log(`🎭 ativar_desvantagem: ${nome} → ${nomePersonagem} (auto)`);
    io.to(roomId).emit('acao_mestre', {
      tipo: 'desvantagem_ativada', personagem: nomePersonagem, userId: alvo.userId,
      desvantagem: nome, penalidade: acao.penalidade || null,
      timestamp: Date.now()
    });
  }
}

/**
 * aplicar_vantagem: Registra uso de vantagem passiva (informativo)
 * acao: { tipo, personagem, nome, bonus }
 */
async function processarAplicarVantagem(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, nome } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  console.log(`✅ aplicar_vantagem: ${nome} → ${nomePersonagem}`);

  io.to(roomId).emit('acao_mestre', {
    tipo: 'vantagem_aplicada', personagem: nomePersonagem, userId: alvo.userId,
    vantagem: nome, bonus: acao.bonus || null,
    timestamp: Date.now()
  });
}

/**
 * aplicar_efeito: Efeito temporário com duração
 * acao: { tipo, personagem, nome, duracao, dano_por_turno, cura_por_turno, tipo_efeito }
 */
async function processarAplicarEfeito(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, nome, duracao } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  aplicarEfeito(sessao, alvo.personagemId, {
    nome,
    duracao: duracao || 3,
    tipo: acao.tipo_efeito || null,
    dano_por_turno: acao.dano_por_turno || null,
    cura_por_turno: acao.cura_por_turno || null
  });

  // Persistir
  if (alvo.personagemId && alvo.personagem.status_efeitos) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      status_efeitos: alvo.personagem.status_efeitos
    });
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'efeito_aplicado', personagem: nomePersonagem, userId: alvo.userId,
    efeito: nome, duracao: duracao || 3,
    dano_por_turno: acao.dano_por_turno || null,
    cura_por_turno: acao.cura_por_turno || null,
    timestamp: Date.now()
  });
}

/**
 * remover_efeito: Remove efeito ativo
 * acao: { tipo, personagem, nome }
 */
async function processarRemoverEfeito(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, nome } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  const removido = removerEfeito(sessao, alvo.personagemId, nome);
  if (!removido) return;

  if (alvo.personagemId && alvo.personagem.status_efeitos) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      status_efeitos: alvo.personagem.status_efeitos
    });
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'efeito_removido', personagem: nomePersonagem, userId: alvo.userId,
    efeito: nome, timestamp: Date.now()
  });
}

/**
 * dar_xp: Aplica XP a um personagem e verifica level-up
 * acao: { tipo, personagem, xp, motivo }
 */
async function processarDarXP(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, xp } = acao;
  if (!nomePersonagem || !xp || xp <= 0) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  const pSessao = ensurePersonagemSessao(sessao, alvo.userId);
  pSessao.xp_ganho = (pSessao.xp_ganho || 0) + xp;

  console.log(`⭐ dar_xp: ${nomePersonagem} +${xp}XP (total sessão: ${pSessao.xp_ganho})`);

  // Persistir XP no clone
  if (alvo.personagemId) {
    try {
      const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
      if (sessaoJogoRow) {
        const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
          sessaoJogoRow.id, parseInt(alvo.personagemId)
        );
        if (clone) {
          await db.PersonagemSessao.atualizarRuntime(clone.id, { xp_ganho: pSessao.xp_ganho });
        }
      }
    } catch (e) {
      console.warn(`⚠️ dar_xp: Erro ao persistir:`, e.message);
    }
  }

  io.to(roomId).emit('acao_mestre', {
    tipo: 'xp_recebido', personagem: nomePersonagem, userId: alvo.userId,
    xp, xp_total_sessao: pSessao.xp_ganho, motivo: acao.motivo || 'narrativa',
    timestamp: Date.now()
  });
}

/**
 * concentracao_quebrada: Remove concentração ativa do jogador
 * acao: { tipo, personagem, motivo }
 */
async function processarConcentracaoQuebrada(acao, sessao, roomId, io) {
  const { personagem: nomePersonagem, motivo = 'narrativa' } = acao;
  if (!nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  const quebrada = quebrarConcentracao(sessao, alvo.userId, motivo);
  if (!quebrada) return;

  io.to(roomId).emit('acao_mestre', {
    tipo: 'concentracao_quebrada', personagem: nomePersonagem, userId: alvo.userId,
    magia: quebrada.nome, motivo,
    timestamp: Date.now()
  });
}

// ═══════════════════════════════════════════════════════════════
// Helpers internos para os novos handlers
// ═══════════════════════════════════════════════════════════════

/**
 * Garante que manaState existe para o jogador
 */
function ensureManaState(sessao, userId, personagem) {
  if (!sessao.estadoJogo) sessao.estadoJogo = {};
  if (!sessao.estadoJogo.manaState) sessao.estadoJogo.manaState = {};
  const uid = String(userId);
  if (!sessao.estadoJogo.manaState[uid]) {
    const attrs = personagem?.atributos || {};
    const manaMax = calcularMana({ inteligencia: attrs.inteligencia || 10, nivel: personagem?.nivel || 1 });
    sessao.estadoJogo.manaState[uid] = { mana_atual: manaMax, mana_max: manaMax };
  }
  return sessao.estadoJogo.manaState[uid];
}

/**
 * Garante que personagemSessao existe para o jogador
 */
function ensurePersonagemSessao(sessao, userId) {
  if (!sessao.estadoJogo) sessao.estadoJogo = {};
  if (!sessao.estadoJogo.personagemSessao) sessao.estadoJogo.personagemSessao = {};
  const uid = String(userId);
  if (!sessao.estadoJogo.personagemSessao[uid]) {
    sessao.estadoJogo.personagemSessao[uid] = {};
  }
  return sessao.estadoJogo.personagemSessao[uid];
}

export { persistirEstadoClone };
export default { processarAcoes };
