/**
 * AcoesProcessor - Processa ações mecânicas retornadas pelo Mestre IA
 *
 * O Mestre retorna um array de ações no JSON de resposta.
 * Cada ação é processada mecanicamente e emitida via WebSocket.
 */
import db from '../Model/index.js';
import logger from './logger.js';
const log = logger.child({ module: 'acoesProcessor' });
import { calcularHP, calcularMana, calcularEsquiva, calcularArmadura, aplicarResistencias, getMultRaca } from './combateHelper.js';
import { setCooldown, checkCooldown } from './cooldownManager.js';
import { setConcentracao, quebrarConcentracao, checkDanoConcentracao } from './concentrationManager.js';
import { aplicarEfeito, removerEfeito } from './effectManager.js';
import { applyMetadadosToSessao } from '../agents/Mestre/contexto/mestreContextBuilder.js';
import { normalizarTerrenoInput, getTerrenoLabel, addEfeitoTerreno, clearEfeitosTerreno, ensurePersonagemBucket, registrarItemGanhoBucket, registrarItemPerdidoBucket, setBossFase, setBatalhaGrande, setMissaoTatica } from './estadoTatico.js';
import { normalizarElemento } from '../config/domainConstants.js';
import { verificarLevelUp, xpParaNivel } from './evolucaoHelper.js';
import { appendMensagemSessao, buildAcaoMestreMensagem } from '../websocket/utils/sessionMessages.js';
import { processarDescansoTresDet, parseCustoPM } from '../game-systems/tresdet/combatEngine.js';

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
    log.warn({ err: e }, 'persistirEstadoClone: Erro ao persistir no clone');
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
        log.warn({ personagem: nome }, 'Personagem encontrado mas sem jogador conectado');
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
  ['conjurar_magia', processarConjurarMagiaDispatch],
  ['descansar', processarDescanso],
  ['ativar_desvantagem', processarAtivarDesvantagem],
  ['aplicar_vantagem', processarAplicarVantagem],
  ['aplicar_efeito', processarAplicarEfeito],
  ['remover_efeito', processarRemoverEfeito],
  ['dar_xp', processarDarXP],
  ['concentracao_quebrada', processarConcentracaoQuebrada],
  // B4-F04 — Ações de cenário
  ['alterar_terreno', processarAlterarTerreno],
  ['mudar_cenario', processarMudarCenario],
  ['dano_ambiental', processarDanoAmbiental],
  ['estabilizar_personagem', processarEstabilizarPersonagem],
  ['danificar_equipamento', processarDanificarEquipamento],
  // B4-F05D — Ações de runtime tático
  ['iniciar_fase_boss', processarIniciarFaseBoss],
  ['missao_batalha', processarMissaoBatalha],
  // Aliases — intents de combate que a IA pode gerar como ação mecânica
  ['atacar', processarAplicarDano],
  ['defender', () => {}], // no-op, processado pelo combatEngine
  ['fugir', () => {}],    // no-op, processado pelo combatEngine
]);

function shouldProcessAction(acao, stage = 'all') {
  if (stage === 'all') return true;

  const actionStage = acao?.stage || (acao?.dependeDeTeste ? 'posTeste' : 'independente');
  if (stage === 'preTeste') {
    return actionStage === 'preTeste' || actionStage === 'independente';
  }
  if (stage === 'posTeste') {
    return actionStage === 'posTeste' || actionStage === 'independente';
  }
  return true;
}

function emitAcaoMestre(sessao, roomId, sm, payload) {
  const mensagem = buildAcaoMestreMensagem(payload);
  appendMensagemSessao(sessao, mensagem);
  // @event acao_mestre → room (broadcast) | ação mecânica processada pelo mestre
  sm.sendToRoom(roomId, 'acao_mestre', {
    ...payload,
    id: mensagem.id,
    message: mensagem.message,
    mensagem: mensagem.message,
    payload: mensagem.payload
  });
}

// ═══════════════════════════════════════════════════════════════
// Post-parse directionality validation
// ═══════════════════════════════════════════════════════════════

const TARGET_ACTIONS = new Set([
  'aplicar_dano', 'curar', 'aplicar_status', 'aplicar_efeito',
  'dano_ambiental', 'remover_status', 'remover_efeito', 'estabilizar_personagem'
]);

const EXECUTOR_ACTIONS = new Set(['usar_habilidade', 'conjurar_magia']);

const HOLD_UNTIL_TEST_RESOLVED = new Set([
  'aplicar_dano', 'curar', 'aplicar_status', 'aplicar_efeito',
  'dar_xp', 'estabilizar_personagem'
]);

/**
 * Corrige direcionalidade executor/alvo quando a IA confunde quem recebe a ação.
 * TARGET_ACTIONS: personagem = alvo (quem recebe). Se vier com nome do jogador atual, provavelmente está errado.
 * EXECUTOR_ACTIONS: personagem = executor (quem faz). Se vier com nome de monstro, provavelmente está errado.
 */
function corrigirDirecionalidade(acao, sessao, currentUserId) {
  if (!acao?.tipo || !currentUserId) return acao;

  // 1. Resolve current player character name
  const jogadores = sessao.jogadoresConectados || [];
  const jogadorAtual = jogadores.find(j => String(j.userId || j.id) === String(currentUserId));
  if (!jogadorAtual) return acao;

  const personagemId = String(jogadorAtual.personagemId || jogadorAtual.personagem_id);
  const completos = sessao.personagensCompletos || {};
  const personagemObj = completos[personagemId];
  if (!personagemObj?.nome) return acao;

  const nomeJogador = personagemObj.nome;

  // 2. Resolve combat enemy names
  const combate = sessao.estadoJogo?.combate;
  const monstros = (combate?.ativo && combate.monstros) ? combate.monstros : [];
  const nomesMonstros = monstros.filter(m => m.status === 'vivo').map(m => m.nome?.toLowerCase());

  const nomeAcao = acao.personagem?.toLowerCase();

  // 3. TARGET_ACTIONS: personagem should be the target (enemy/NPC), not the player
  // Auto-cura é legítima — não corrigir quando jogador cura a si mesmo
  if (acao.tipo === 'curar' && nomeAcao === nomeJogador.toLowerCase()) {
    return acao;
  }
  if (TARGET_ACTIONS.has(acao.tipo) && nomeAcao === nomeJogador.toLowerCase()) {
    const substituto = acao.alvo || (nomesMonstros.length > 0 ? monstros.find(m => m.status === 'vivo')?.nome : null);
    if (substituto && substituto.toLowerCase() !== nomeAcao) {
      log.warn(
        { tipo: acao.tipo, original: acao.personagem, corrigido: substituto },
        'corrigirDirecionalidade: personagem era o jogador em TARGET_ACTION, corrigido para alvo'
      );
      acao._alvo_original = acao.personagem;
      acao.personagem = substituto;
    }
  }

  // 4. EXECUTOR_ACTIONS: personagem should be the player, not a monster
  if (EXECUTOR_ACTIONS.has(acao.tipo) && nomeAcao && nomesMonstros.includes(nomeAcao)) {
    log.warn(
      { tipo: acao.tipo, original: acao.personagem, corrigido: nomeJogador },
      'corrigirDirecionalidade: personagem era monstro em EXECUTOR_ACTION, corrigido para jogador'
    );
    acao._executor_original = acao.personagem;
    acao.personagem = nomeJogador;
  }

  return acao;
}

/**
 * Verifica se a ação deve ser retida até que um teste pendente seja resolvido.
 * Ações que dependem de resultado de teste não devem ser aplicadas antes da resolução.
 */
function shouldHoldForPendingTest(acao, sessao) {
  if (!sessao.estadoJogo?.testePendente) return false;
  if (!acao?.tipo) return false;

  if (HOLD_UNTIL_TEST_RESOLVED.has(acao.tipo)) {
    log.warn(
      { tipo: acao.tipo, personagem: acao.personagem },
      'shouldHoldForPendingTest: acao retida — teste pendente nao resolvido'
    );
    return true;
  }

  return false;
}

/**
 * Processa array de ações mecânicas do Mestre
 */
export async function processarAcoes(acoes, sessao, roomId, sm, options = {}) {
  if (!acoes?.length) return;

  for (const acaoRaw of acoes) {
    if (!shouldProcessAction(acaoRaw, options.stage || 'all')) continue;

    const acao = corrigirDirecionalidade(acaoRaw, sessao, options.userId);

    if (shouldHoldForPendingTest(acao, sessao)) continue;

    try {
      const handler = ACTION_HANDLERS.get(acao.tipo);
      if (handler) {
        await handler(acao, sessao, roomId, sm, options);
      } else {
        log.warn({ tipo: acao.tipo }, 'AcoesProcessor: tipo de acao desconhecido');
      }
    } catch (error) {
      log.error({ err: error, tipo: acao.tipo }, 'AcoesProcessor: Erro ao processar acao');
    }
  }
}

/**
 * dar_item: Busca equipamento no DB e adiciona ao inventário do personagem na sessão
 */
async function processarDarItem(acao, sessao, roomId, sm) {
  const { item, personagem: nomePersonagem } = acao;
  if (!item || !nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) {
    log.warn({ personagem: nomePersonagem }, 'dar_item: Personagem nao encontrado na sessao');
    return;
  }

  // Buscar equipamento no banco
  const equipamento = await db.Equipamento.findByNome(item);
  if (!equipamento) {
    log.warn({ item }, 'dar_item: Equipamento nao encontrado no banco');
    return;
  }

  // Adicionar ao inventário na sessão (não persiste no DB, apenas na sessão ativa)
  if (!alvo.personagem.equipamentos) alvo.personagem.equipamentos = [];
  const jaTemItem = alvo.personagem.equipamentos.some(e => e.id === equipamento.id);
  if (jaTemItem) {
    log.warn({ personagem: nomePersonagem, item: equipamento.nome }, 'dar_item: personagem ja possui item, ignorando duplicata');
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

  log.info({ item: equipamento.nome, personagem: nomePersonagem }, 'dar_item: item entregue');

  // Registrar no bucket per-player (B4-F05B)
  registrarItemGanhoBucket(sessao, alvo.userId, { nome: equipamento.nome, id: equipamento.id });

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
    log.warn({ err: e }, 'dar_item: Erro ao persistir no clone');
  }

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarRemoverItem(acao, sessao, roomId, sm) {
  const { item, personagem: nomePersonagem } = acao;
  if (!item || !nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.personagem.equipamentos) return;

  const idx = alvo.personagem.equipamentos.findIndex(
    e => e.nome?.toLowerCase() === item.toLowerCase()
  );
  if (idx === -1) return;

  const removido = alvo.personagem.equipamentos.splice(idx, 1)[0];
  log.info({ item: removido.nome, personagem: nomePersonagem }, 'remover_item: item removido');

  // Registrar no bucket per-player (B4-F05B)
  registrarItemPerdidoBucket(sessao, alvo.userId, { nome: removido.nome, id: removido.id, motivo: 'narrativa' });

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
    log.warn({ err: e }, 'remover_item: Erro ao persistir no clone');
  }

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarCurar(acao, sessao, roomId, sm) {
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
    hpMax = calcularHP({ constituicao: attrs.constituicao || 10, nivel: alvo.personagem.nivel || 1 }, getMultRaca(alvo.personagem.raca_nome || alvo.personagem.raca || ''));
    hpAnterior = alvo.personagem.hp_atual ?? hpMax;
    hpNovo = Math.min(hpMax, hpAnterior + hp);
    alvo.personagem.hp_atual = hpNovo;
  }

  log.info({ personagem: nomePersonagem, hp, hpAnterior, hpNovo }, 'curar: HP restaurado');

  // Persistir HP no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, { hp_atual: hpNovo });
  }

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarAplicarDano(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, dano } = acao;
  const elemento = normalizarElemento(acao.elemento);
  if (acao.elemento && !elemento) log.warn({ raw: acao.elemento }, 'aplicar_dano: elemento desconhecido ignorado');
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
    emitAcaoMestre(sessao, roomId, sm, {
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
    hpMax = calcularHP({ constituicao: attrs.constituicao || 10, nivel: alvo.personagem.nivel || 1 }, getMultRaca(alvo.personagem.raca_nome || alvo.personagem.raca || ''));
    hpAnterior = alvo.personagem.hp_atual ?? hpMax;
    hpNovo = Math.max(0, hpAnterior - danoFinal);
    alvo.personagem.hp_atual = hpNovo;
  }

  log.info({ personagem: nomePersonagem, dano: danoFinal, elemento: elemento || null, hpAnterior, hpNovo }, 'aplicar_dano: dano aplicado');

  // Persistir HP no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, { hp_atual: hpNovo });
  }

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarAplicarStatus(acao, sessao, roomId, sm) {
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

  log.info({ personagem: nomePersonagem, status, duracao: duracao || 3 }, 'aplicar_status: status aplicado');

  // Persistir status_efeitos no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      status_efeitos: alvo.personagem.status_efeitos
    });
  }

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarRemoverStatus(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, status } = acao;
  if (!nomePersonagem || !status) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.personagem.status_efeitos) return;

  const idx = alvo.personagem.status_efeitos.findIndex(s => s.nome === status);
  if (idx === -1) return;

  alvo.personagem.status_efeitos.splice(idx, 1);

  log.info({ personagem: nomePersonagem, status }, 'remover_status: status removido');

  // Persistir status_efeitos no clone da sessão
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      status_efeitos: alvo.personagem.status_efeitos
    });
  }

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarUsarHabilidade(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, habilidade_id, nome, custo_mana = 0, cooldown_turnos = 0 } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  // Verificar cooldown
  if (habilidade_id && checkCooldown(sessao, alvo.userId, 'hab', habilidade_id)) {
    log.warn({ habilidade: nome, personagem: nomePersonagem }, 'usar_habilidade: habilidade em cooldown');
    emitAcaoMestre(sessao, roomId, sm, {
      tipo: 'habilidade_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
      nome, motivo: 'cooldown', timestamp: Date.now()
    });
    return;
  }

  // Verificar e deduzir mana
  if (custo_mana > 0) {
    const manaState = ensureManaState(sessao, alvo.userId, alvo.personagem);
    if (manaState.mana_atual < custo_mana) {
      log.warn({ habilidade: nome, manaAtual: manaState.mana_atual, custoMana: custo_mana }, 'usar_habilidade: mana insuficiente');
      emitAcaoMestre(sessao, roomId, sm, {
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

  const elementoNorm = normalizarElemento(acao.elemento);
  if (acao.elemento && !elementoNorm) log.warn({ raw: acao.elemento }, 'usar_habilidade: elemento desconhecido ignorado');

  log.info({ personagem: nomePersonagem, habilidade: nome, custoMana: custo_mana, cooldown: cooldown_turnos }, 'usar_habilidade: habilidade usada');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'habilidade_usada', personagem: nomePersonagem, userId: alvo.userId,
    nome, habilidade_id, custo_mana, cooldown_turnos,
    dano_base: acao.dano_base || null, elemento: elementoNorm,
    timestamp: Date.now()
  });
}

/**
 * conjurar_magia: Verifica mana + concentração → deduz → registra concentração se aplicável
 * acao: { tipo, personagem, magia_id, nome, custo_mana, cooldown_turnos, usa_concentracao, duracao, dano_base, elemento }
 */
async function processarConjurarMagia(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, magia_id, nome, custo_mana = 0, cooldown_turnos = 0, usa_concentracao = false } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  // Verificar cooldown
  if (magia_id && checkCooldown(sessao, alvo.userId, 'mag', magia_id)) {
    log.warn({ magia: nome, personagem: nomePersonagem }, 'conjurar_magia: magia em cooldown');
    emitAcaoMestre(sessao, roomId, sm, {
      tipo: 'magia_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
      nome, motivo: 'cooldown', timestamp: Date.now()
    });
    return;
  }

  // Verificar e deduzir mana
  if (custo_mana > 0) {
    const manaState = ensureManaState(sessao, alvo.userId, alvo.personagem);
    if (manaState.mana_atual < custo_mana) {
      emitAcaoMestre(sessao, roomId, sm, {
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
      emitAcaoMestre(sessao, roomId, sm, {
        tipo: 'concentracao_quebrada', personagem: nomePersonagem, userId: alvo.userId,
        magia: concentracaoQuebrada.nome, motivo: 'nova_concentracao',
        timestamp: Date.now()
      });
    }
  }

  const elementoNormMagia = normalizarElemento(acao.elemento);
  if (acao.elemento && !elementoNormMagia) log.warn({ raw: acao.elemento }, 'conjurar_magia: elemento desconhecido ignorado');

  log.info({ personagem: nomePersonagem, magia: nome, custoMana: custo_mana, concentracao: usa_concentracao }, 'conjurar_magia: magia conjurada');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'magia_conjurada', personagem: nomePersonagem, userId: alvo.userId,
    nome, magia_id, custo_mana, usa_concentracao,
    dano_base: acao.dano_base || null, elemento: elementoNormMagia,
    concentracao_anterior_quebrada: concentracaoQuebrada?.nome || null,
    timestamp: Date.now()
  });
}

/**
 * conjurar_magia dispatcher: roteia para handler correto conforme o sistema da sessão
 */
async function processarConjurarMagiaDispatch(acao, sessao, roomId, sm, options) {
  if (sessao.sistema === 'tresdet') {
    return processarConjurarMagiaTresDet(acao, sessao, roomId, sm);
  }
  return processarConjurarMagia(acao, sessao, roomId, sm);
}

/**
 * conjurar_magia (3D&T): Busca magia no catálogo, parseia custo PM, deduz e emite evento
 * acao: { tipo, personagem, magia_id, nome, custo_pm_override }
 */
async function processarConjurarMagiaTresDet(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, magia_id, nome, custo_pm_override } = acao;
  if (!nomePersonagem || (!magia_id && !nome)) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  // Buscar magia no catálogo
  let magia = null;
  if (magia_id) {
    magia = await db.prisma.magias_tresdet.findUnique({ where: { id: magia_id } });
  } else if (nome) {
    magia = await db.prisma.magias_tresdet.findUnique({ where: { nome } });
  }
  if (!magia) {
    log.warn({ magia_id, nome, personagem: nomePersonagem }, 'conjurar_magia_3det: magia nao encontrada no catalogo');
    return;
  }

  // Custo PM: override do Mestre IA tem prioridade, senão parsear do catálogo
  const custoPM = custo_pm_override != null ? custo_pm_override : parseCustoPM(magia.custo_pm);

  // Verificar e deduzir PM
  if (custoPM > 0) {
    const manaState = ensureManaState(sessao, alvo.userId, alvo.personagem);
    if (manaState.mana_atual < custoPM) {
      emitAcaoMestre(sessao, roomId, sm, {
        tipo: 'magia_bloqueada', personagem: nomePersonagem, userId: alvo.userId,
        nome: magia.nome, motivo: 'pm_insuficiente', mana_atual: manaState.mana_atual, custo: custoPM,
        timestamp: Date.now()
      });
      return;
    }
    manaState.mana_atual -= custoPM;
    persistirEstadoClone(roomId, alvo.personagemId, { mana_atual: manaState.mana_atual });
  }

  log.info({ personagem: nomePersonagem, magia: magia.nome, custoPM }, 'conjurar_magia_3det: magia conjurada');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'magia_conjurada', personagem: nomePersonagem, userId: alvo.userId,
    nome: magia.nome, magia_id: magia.id, custo_pm: custoPM,
    escola: magia.escola, tipo_magia: magia.tipo,
    timestamp: Date.now()
  });
}

/**
 * descansar (3D&T): Rola Rd6 para PV e PM, atualiza sessão e emite evento
 * acao: { tipo, personagem }
 */
async function processarDescanso(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem } = acao;
  if (!nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) {
    log.warn({ personagem: nomePersonagem }, 'descansar: Personagem nao encontrado na sessao');
    return;
  }

  // Montar objeto com atributos_personagem + hp/mana atuais para processarDescansoTresDet
  const personagemData = {
    ...alvo.personagem,
    hp_atual: alvo.personagem.hp_atual ?? null,
    mana_atual: alvo.personagem.mana_atual ?? null,
  };

  // Recuperar mana da manaState se existir
  const uid = String(alvo.userId);
  if (sessao.estadoJogo?.manaState?.[uid]) {
    personagemData.mana_atual = sessao.estadoJogo.manaState[uid].mana_atual;
  }

  const resultado = processarDescansoTresDet(personagemData);

  // Atualizar HP na sessão
  alvo.personagem.hp_atual = resultado.hp_atual;

  // Atualizar mana na sessão
  alvo.personagem.mana_atual = resultado.mana_atual;
  if (sessao.estadoJogo?.manaState?.[uid]) {
    sessao.estadoJogo.manaState[uid].mana_atual = resultado.mana_atual;
  }

  // Persistir no clone
  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, {
      hp_atual: resultado.hp_atual,
      mana_atual: resultado.mana_atual,
    });
  }

  log.info({ personagem: nomePersonagem, pv: resultado.detalhes.pv, pm: resultado.detalhes.pm }, 'descansar: descanso realizado');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'descanso_realizado', personagem: nomePersonagem, userId: alvo.userId,
    hp_atual: resultado.hp_atual, mana_atual: resultado.mana_atual,
    detalhes: resultado.detalhes,
    timestamp: Date.now()
  });
}

/**
 * ativar_desvantagem: Mestre ativa desvantagem narrativamente
 * Se DC presente, emite pedido de teste ao jogador
 * acao: { tipo, personagem, nome, dc, atributo, penalidade }
 */
async function processarAtivarDesvantagem(acao, sessao, roomId, sm, options = {}) {
  const { personagem: nomePersonagem, nome, dc, atributo } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  if (dc && atributo) {
    if (typeof options.onTesteSolicitado === 'function') {
      await options.onTesteSolicitado({
        origem: 'desvantagem',
        jogadorAlvo: alvo.userId,
        personagemAlvo: alvo.personagemId,
        teste: atributo,
        atributo,
        dificuldade: dc,
        contexto: `Resistir a desvantagem ${nome}`,
        tipoDado: 'd20',
        metadata: {
          desvantagem: nome,
          penalidade: acao.penalidade || null
        }
      });
      return;
    }
    // Requer teste — emitir pedido
    log.info({ desvantagem: nome, personagem: nomePersonagem, dc, atributo }, 'ativar_desvantagem: teste requerido');
    emitAcaoMestre(sessao, roomId, sm, {
      tipo: 'desvantagem_teste_requerido', personagem: nomePersonagem, userId: alvo.userId,
      desvantagem: nome, dc, atributo, penalidade: acao.penalidade || null,
      timestamp: Date.now()
    });
  } else {
    // Ativação automática (narrativa)
    log.info({ desvantagem: nome, personagem: nomePersonagem }, 'ativar_desvantagem: ativacao automatica');
    emitAcaoMestre(sessao, roomId, sm, {
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
async function processarAplicarVantagem(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, nome } = acao;
  if (!nomePersonagem || !nome) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  log.info({ vantagem: nome, personagem: nomePersonagem }, 'aplicar_vantagem: vantagem aplicada');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'vantagem_aplicada', personagem: nomePersonagem, userId: alvo.userId,
    vantagem: nome, bonus: acao.bonus || null,
    timestamp: Date.now()
  });
}

/**
 * aplicar_efeito: Efeito temporário com duração
 * acao: { tipo, personagem, nome, duracao, dano_por_turno, cura_por_turno, tipo_efeito }
 */
async function processarAplicarEfeito(acao, sessao, roomId, sm) {
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

  emitAcaoMestre(sessao, roomId, sm, {
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
async function processarRemoverEfeito(acao, sessao, roomId, sm) {
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

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'efeito_removido', personagem: nomePersonagem, userId: alvo.userId,
    efeito: nome, timestamp: Date.now()
  });
}

/**
 * dar_xp: Aplica XP a um personagem e verifica level-up
 * acao: { tipo, personagem, xp, motivo }
 */
async function processarDarXP(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, xp } = acao;
  if (!nomePersonagem || !xp || xp <= 0) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  const pSessao = ensurePersonagemBucket(sessao, alvo.userId);
  pSessao.xp_ganho = (pSessao.xp_ganho || 0) + xp;

  log.info({ personagem: nomePersonagem, xp, xpTotalSessao: pSessao.xp_ganho }, 'dar_xp: XP concedido');

  // Persistir XP no clone e verificar level-up
  if (alvo.personagemId) {
    try {
      const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
      if (sessaoJogoRow) {
        const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
          sessaoJogoRow.id, parseInt(alvo.personagemId)
        );
        if (clone) {
          const xpTotalClone = (clone.xp_inicio + pSessao.xp_ganho);
          let nivelAtual = clone.nivel_fim || clone.nivel_inicio;
          let xpRestante = xpTotalClone;

          // Multi-level-up loop (mesma logica do combatEngine)
          let levelUp = verificarLevelUp(nivelAtual, xpRestante);
          while (levelUp.podeEvoluir) {
            nivelAtual = levelUp.ganhos.novoNivel;
            xpRestante = levelUp.ganhos.xpRestante;

            // @event level_up → room (broadcast) | fires when narrative XP causes level-up
            sm.sendToRoom(roomId, 'level_up', {
              userId: alvo.userId,
              personagemNome: nomePersonagem,
              novoNivel: nivelAtual,
              ganhos: levelUp.ganhos,
              timestamp: Date.now()
            });
            log.info({ personagem: nomePersonagem, novoNivel: nivelAtual }, 'dar_xp: Level up!');

            db.FeedPost.createAutoEvent(parseInt(alvo.userId), 'level_up', { personagem: nomePersonagem, nivel: nivelAtual }, 'personagem', parseInt(alvo.personagemId)).catch(() => {});

            levelUp = verificarLevelUp(nivelAtual, xpRestante);
          }

          await db.PersonagemSessao.atualizarRuntime(clone.id, {
            xp_ganho: pSessao.xp_ganho,
            nivel_fim: nivelAtual
          });
        }
      }
    } catch (e) {
      log.warn({ err: e }, 'dar_xp: Erro ao persistir');
    }
  }

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'xp_recebido', personagem: nomePersonagem, userId: alvo.userId,
    xp, xp_total_sessao: pSessao.xp_ganho, motivo: acao.motivo || 'narrativa',
    timestamp: Date.now()
  });
}

/**
 * concentracao_quebrada: Remove concentração ativa do jogador
 * acao: { tipo, personagem, motivo }
 */
async function processarConcentracaoQuebrada(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, motivo = 'narrativa' } = acao;
  if (!nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo || !alvo.userId) return;

  const quebrada = quebrarConcentracao(sessao, alvo.userId, motivo);
  if (!quebrada) return;

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'concentracao_quebrada', personagem: nomePersonagem, userId: alvo.userId,
    magia: quebrada.nome, motivo,
    timestamp: Date.now()
  });
}

// ═══════════════════════════════════════════════════════════════
// B4-F04 — Ações mecânicas de cenário
// ═══════════════════════════════════════════════════════════════

/**
 * alterar_terreno: Muda terreno ativo em estadoJogo
 */
async function processarAlterarTerreno(acao, sessao, roomId, sm) {
  const { terreno, efeito, duracao } = acao;
  if (!terreno) return;

  const terrenoNorm = normalizarTerrenoInput(terreno);
  if (!terrenoNorm) return;

  if (!sessao.estadoJogo) sessao.estadoJogo = {};
  const terrenoAnteriorRaw = sessao.estadoJogo.terreno || null;
  const terrenoAnteriorNorm = normalizarTerrenoInput(terrenoAnteriorRaw);
  sessao.estadoJogo.terreno = terrenoNorm;

  // efeitos_terreno[]: shape canônico (B4-F05B). Terreno novo sem efeito limpa efeitos anteriores.
  if (efeito && typeof efeito === 'string') {
    clearEfeitosTerreno(sessao);
    addEfeitoTerreno(sessao, {
      descricao: efeito,
      duracao: typeof duracao === 'number' ? duracao : null,
      aplicado_em: sessao.estadoJogo.rodadaAtual || 1,
      fonte: 'alterar_terreno'
    });
  } else {
    clearEfeitosTerreno(sessao);
  }

  log.info({ terreno: terrenoNorm, terrenoAnterior: terrenoAnteriorNorm, efeito: efeito || null }, 'alterar_terreno: terreno alterado');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'terreno_alterado',
    terreno: getTerrenoLabel(terrenoNorm),
    terreno_obj: terrenoNorm,
    terreno_anterior: getTerrenoLabel(terrenoAnteriorNorm),
    terreno_anterior_obj: terrenoAnteriorNorm,
    efeito: efeito || null,
    duracao: duracao || null,
    timestamp: Date.now()
  });
}

/**
 * mudar_cenario: Transição de cena completa via applyMetadadosToSessao
 */
async function processarMudarCenario(acao, sessao, roomId, sm) {
  const { cenario, terreno, ambiente, hora, limpar_ameacas } = acao;
  if (!cenario || typeof cenario !== 'string') return;

  const cenarioAnterior = sessao.estadoJogo?.cenaAtual || null;

  // Delegar para applyMetadadosToSessao — sincroniza estadoJogo + mestreContexto
  const metadados = { local_atual: cenario };
  if (terreno && typeof terreno === 'string') metadados.terreno = terreno;
  if (ambiente && typeof ambiente === 'string') metadados.ambiente = ambiente;
  if (hora && typeof hora === 'string') metadados.hora_ficcional = hora;
  if (limpar_ameacas !== false) metadados.ameacas = [];

  applyMetadadosToSessao(sessao, metadados);

  // Limpar efeitos de terreno do local anterior (B4-F05B)
  clearEfeitosTerreno(sessao);

  log.info({ cenario, cenarioAnterior, terreno: terreno || null }, 'mudar_cenario: cenario mudado');

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'cenario_mudado',
    cenario,
    cenario_anterior: cenarioAnterior,
    terreno: getTerrenoLabel(sessao.estadoJogo.terreno) || null,
    terreno_obj: sessao.estadoJogo.terreno || null,
    ambiente: ambiente || null,
    hora: hora || null,
    timestamp: Date.now()
  });
}

/**
 * dano_ambiental: Dano de ambiente (armadilhas, terreno perigoso, clima)
 * Difere de aplicar_dano: ignora_armadura é true por padrão
 */
async function processarDanoAmbiental(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, dano, fonte, ignora_armadura } = acao;
  const elemento = normalizarElemento(acao.elemento);
  if (acao.elemento && !elemento) log.warn({ raw: acao.elemento }, 'dano_ambiental: elemento desconhecido ignorado');
  if (!nomePersonagem || dano == null || dano <= 0) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  let danoFinal = dano;
  const combate = sessao.estadoJogo?.combate;
  let hpAnterior, hpNovo, hpMax;

  // Resistências/imunidades elementais
  if (elemento && alvo.personagem) {
    const resistencias = alvo.personagem.resistencias || {};
    const imunidades = alvo.personagem.imunidades || [];
    danoFinal = aplicarResistencias(danoFinal, elemento, resistencias, imunidades);
  }

  if (danoFinal <= 0) {
    emitAcaoMestre(sessao, roomId, sm, {
      tipo: 'dano_ambiental', personagem: nomePersonagem, userId: alvo.userId,
      dano: 0, elemento: elemento || null, fonte: fonte || null, imune: true,
      hp_atual: alvo.personagem.hp_atual, hp_max: null, derrotado: false,
      timestamp: Date.now()
    });
    return;
  }

  if (combate?.ativo && alvo.userId && combate.jogadores[alvo.userId]) {
    const jogadorCombate = combate.jogadores[alvo.userId];

    // ignora_armadura: default true para dano ambiental
    if (ignora_armadura === false) {
      danoFinal = Math.max(1, danoFinal - (jogadorCombate.armadura || 0));
    }

    hpAnterior = jogadorCombate.hp_atual;
    hpMax = jogadorCombate.hp_max;
    jogadorCombate.hp_atual = Math.max(0, jogadorCombate.hp_atual - danoFinal);
    hpNovo = jogadorCombate.hp_atual;
    if (hpNovo <= 0 && jogadorCombate.status === 'vivo') jogadorCombate.status = 'inconsciente';
  } else {
    const attrs = alvo.personagem.atributos || {};
    hpMax = calcularHP({ constituicao: attrs.constituicao || 10, nivel: alvo.personagem.nivel || 1 }, getMultRaca(alvo.personagem.raca_nome || alvo.personagem.raca || ''));
    hpAnterior = alvo.personagem.hp_atual ?? hpMax;
    hpNovo = Math.max(0, hpAnterior - danoFinal);
    alvo.personagem.hp_atual = hpNovo;
  }

  log.info({ personagem: nomePersonagem, dano: danoFinal, elemento: elemento || null, fonte: fonte || null, hpAnterior, hpNovo }, 'dano_ambiental: dano aplicado');

  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, { hp_atual: hpNovo });
  }

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'dano_ambiental', personagem: nomePersonagem, userId: alvo.userId,
    dano: danoFinal, elemento: elemento || null, fonte: fonte || null,
    ignora_armadura: ignora_armadura !== false,
    hp_atual: hpNovo, hp_max: hpMax, derrotado: hpNovo <= 0,
    timestamp: Date.now()
  });
}

/**
 * estabilizar_personagem: Traz personagem inconsciente de volta a vivo (HP min 1)
 * Sem status novo — sempre transiciona para 'vivo'
 */
async function processarEstabilizarPersonagem(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, curador, hp_restaurado } = acao;
  if (!nomePersonagem) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo) return;

  const hpGanho = Math.max(1, hp_restaurado || 1);
  const combate = sessao.estadoJogo?.combate;
  let hpNovo, hpMax;

  if (combate?.ativo && alvo.userId && combate.jogadores[alvo.userId]) {
    const jogadorCombate = combate.jogadores[alvo.userId];
    if (jogadorCombate.status !== 'inconsciente' && jogadorCombate.status !== 'derrotado') return;

    hpMax = jogadorCombate.hp_max;
    jogadorCombate.hp_atual = Math.min(hpMax, jogadorCombate.hp_atual + hpGanho);
    hpNovo = jogadorCombate.hp_atual;
    jogadorCombate.status = 'vivo';
  } else {
    const attrs = alvo.personagem.atributos || {};
    hpMax = calcularHP({ constituicao: attrs.constituicao || 10, nivel: alvo.personagem.nivel || 1 }, getMultRaca(alvo.personagem.raca_nome || alvo.personagem.raca || ''));
    const hpAnterior = alvo.personagem.hp_atual || 0;
    hpNovo = Math.min(hpMax, Math.max(hpGanho, hpAnterior + hpGanho));
    alvo.personagem.hp_atual = hpNovo;
  }

  log.info({ personagem: nomePersonagem, curador: curador || null, hpNovo }, 'estabilizar_personagem: personagem estabilizado');

  if (alvo.personagemId) {
    persistirEstadoClone(roomId, alvo.personagemId, { hp_atual: hpNovo });
  }

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'personagem_estabilizado', personagem: nomePersonagem, userId: alvo.userId,
    curador: curador || null, hp_atual: hpNovo, hp_max: hpMax,
    timestamp: Date.now()
  });
}

/**
 * danificar_equipamento: Destrói ou marca equipamento como danificado
 * v1: 'destruido' remove item; 'danificado' é apenas informativo/narrativo (sem efeito mecânico de bônus)
 */
async function processarDanificarEquipamento(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, item, severidade, motivo } = acao;
  if (!nomePersonagem || !item) return;

  const alvo = encontrarPersonagemPorNome(sessao, nomePersonagem);
  if (!alvo?.personagem?.equipamentos) return;

  const idx = alvo.personagem.equipamentos.findIndex(
    e => e.nome?.toLowerCase() === item.toLowerCase()
  );
  if (idx === -1) return;

  const equipRef = alvo.personagem.equipamentos[idx];
  const nomeItem = equipRef.nome;

  if (severidade === 'destruido') {
    alvo.personagem.equipamentos.splice(idx, 1);
    log.info({ item: nomeItem, personagem: nomePersonagem, motivo }, 'danificar_equipamento: item destruido');

    // Registrar no bucket per-player (B4-F05B)
    registrarItemPerdidoBucket(sessao, alvo.userId, { nome: nomeItem, id: equipRef.id, motivo: motivo || 'destruido' });

    // Persistir perda no clone
    try {
      const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
      if (sessaoJogoRow) {
        const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
          sessaoJogoRow.id, parseInt(alvo.personagemId)
        );
        if (clone) {
          await db.PersonagemSessao.registrarItemPerdido(clone.id, {
            equipamento_id: equipRef.id, nome: nomeItem, motivo: motivo || 'danificado'
          });
        }
      }
    } catch (e) {
      log.warn({ err: e }, 'danificar_equipamento: Erro ao persistir no clone');
    }
  } else {
    // 'danificado' (default): flag informativo apenas — sem efeito mecânico na v1
    equipRef.danificado = true;
    log.info({ item: nomeItem, personagem: nomePersonagem, motivo }, 'danificar_equipamento: item danificado (informativo)');
  }

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'equipamento_danificado', personagem: nomePersonagem, userId: alvo.userId,
    item: nomeItem, severidade: severidade || 'danificado', motivo: motivo || null,
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
    const manaMax = calcularMana({ inteligencia: attrs.inteligencia || 10, carisma: attrs.carisma || 10, nivel: personagem?.nivel || 1 });
    sessao.estadoJogo.manaState[uid] = { mana_atual: manaMax, mana_max: manaMax };
  }
  return sessao.estadoJogo.manaState[uid];
}

// ── B4-F05D — Ações de runtime tático ────────────────────────────

/**
 * iniciar_fase_boss — cria/atualiza combate.boss
 * Requer combate ativo. No-op seguro caso contrário.
 */
function processarIniciarFaseBoss(acao, sessao, roomId, sm) {
  const { nome, fase, fases } = acao;
  const combate = sessao.estadoJogo?.combate;

  if (!combate?.ativo) {
    log.warn({ acao: 'iniciar_fase_boss' }, 'Ignorada: sem combate ativo');
    return;
  }

  const faseAnterior = combate.boss?.fase_atual ?? null;
  const boss = setBossFase(sessao, { nome, fase, fases });
  if (!boss) return;

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'boss_fase_alterada',
    boss: boss.nome,
    fase_atual: boss.fase_atual,
    fase_anterior: faseAnterior,
    timestamp: Date.now()
  });

  log.info({ boss: boss.nome, fase: boss.fase_atual }, 'Boss fase atualizada');
}

/**
 * missao_batalha — cria/atualiza missao_tatica e opcionalmente batalha_grande
 */
function processarMissaoBatalha(acao, sessao, roomId, sm) {
  const { objetivo, descricao, status, progresso, recompensa_xp } = acao;

  // Missão tática
  const mt = setMissaoTatica(sessao, { descricao, objetivo, status, progresso, recompensa_xp });

  // Se a ação incluir contexto de batalha, inicializar/atualizar batalha_grande
  if (acao.batalha) {
    setBatalhaGrande(sessao, acao.batalha);
  }

  emitAcaoMestre(sessao, roomId, sm, {
    tipo: 'missao_batalha_registrada',
    missao: mt,
    batalha_grande: sessao.estadoJogo.batalha_grande || null,
    timestamp: Date.now()
  });

  log.info({ objetivo: mt?.objetivo, status: mt?.status }, 'Missão/batalha registrada');
}

export { persistirEstadoClone };
export default { processarAcoes };
