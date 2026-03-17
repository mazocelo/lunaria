/**
 * TurnStateBuilder - Monta o bloco de estado do turno para o Mestre IA
 *
 * Inclui HP, mana, cooldowns, concentração, alertas de vantagens/desvantagens.
 */
import { calcularHP, calcularMana } from './combateHelper.js';
import { getOwnedCombatActions } from './ownedActionsHelper.js';
import {
  normalizarTerrenoInput, getTerrenoLabel, getEfeitosTerreno,
  getBossResumo, getBatalhaGrandeResumo, getMissaoTaticaResumo,
  migrarEstadoTaticoLegado
} from './estadoTatico.js';

/**
 * Monta state object estruturado para um jogador no turno
 */
export function buildTurnState(sessao, userId, personagem = {}) {
  // Migração oportunista de legado (idempotente)
  migrarEstadoTaticoLegado(sessao);

  const estadoJogo = sessao.estadoJogo || {};
  const mestreCtx = sessao.mestreContexto || {};
  const personagemRef = personagem || {};
  const personagemId = personagemRef.id ?? personagemRef.personagemId ?? personagemRef.personagem_id ?? null;
  const pcCompleto = personagemId != null
    ? (sessao.personagensCompletos || {})[String(personagemId)] || personagemRef
    : personagemRef;
  const pSessao = estadoJogo.personagemSessao?.[String(userId)] || {};

  const attrs = pcCompleto.atributos || {};
  const nivel = pcCompleto.nivel || 1;

  // HP
  const hpMax = pSessao.hp_max ?? calcularHP({ constituicao: attrs.constituicao || 10, nivel });
  const hpAtual = pSessao.hp_atual ?? pcCompleto.hp ?? hpMax;

  // XP e itens
  const xpGanho = pSessao.xp_ganho || 0;
  const itensGanhos = pSessao.itens_ganhos || [];
  const itensPerdidos = pSessao.itens_perdidos || [];
  const efeitos = pSessao.status_efeitos || pcCompleto.status_efeitos || [];

  // Verificar se personagem está inconsciente (em combate)
  const combate = estadoJogo.combate;
  const jogadorCombate = combate?.ativo && userId ? combate.jogadores[String(userId)] : null;
  const inconsciente = jogadorCombate
    ? (jogadorCombate.status === 'inconsciente' || jogadorCombate.status === 'derrotado')
    : (hpAtual <= 0);

  const state = {
    nome: pcCompleto.nome || personagemRef.nome || 'Aventureiro',
    hp: { atual: hpAtual, max: hpMax },
    inconsciente,
    xpGanho,
    itensGanhos,
    itensPerdidos,
    efeitos
  };

  // Mana
  const manaMax = pSessao.mana_max ?? calcularMana({ inteligencia: attrs.inteligencia || 10, nivel });
  const manaAtual = pSessao.mana_atual ?? pcCompleto.mana_atual ?? manaMax;
  state.mana = { atual: manaAtual, max: manaMax };

  // Atributos resumidos
  state.classe = pcCompleto.classe || personagemRef.classe || 'Aventureiro';
  state.nivel = nivel;

  // Cooldowns ativos
  const cooldowns = estadoJogo.cooldowns?.[String(userId)] || {};
  const cooldownsAtivos = Object.entries(cooldowns).filter(([, t]) => t > 0);
  state.cooldowns = cooldownsAtivos.map(([key, turnos]) => ({ id: key, turnos }));

  // Concentração ativa
  state.concentracao = estadoJogo.concentracao?.[String(userId)] || null;

  const ownedActions = getOwnedCombatActions(pcCompleto);

  // Habilidades e magias disponiveis (somente do loadout proprio do personagem)
  const habilidadesClasse = ownedActions.habilidades
    .map(h => {
      const cdKey = `hab_${h.id}`;
      const cdRestante = cooldowns[cdKey] || 0;
      return { nome: h.nome, cd: cdRestante, custo_mana: h.custo_mana || 0 };
    });
  const magias = ownedActions.magias
    .map(h => {
      const cdKey = `mag_${h.id}`;
      const cdRestante = cooldowns[cdKey] || 0;
      return { nome: h.nome, cd: cdRestante, custo_mana: h.custo_mana || 0, concentracao: h.usa_concentracao || false };
    });
  // Dedup magias por nome
  const magiasUnicas = [];
  const magNomes = new Set();
  for (const m of magias) { if (!magNomes.has(m.nome)) { magNomes.add(m.nome); magiasUnicas.push(m); } }
  state.habilidadesDisponiveis = habilidadesClasse;
  state.magiasDisponiveis = magiasUnicas;

  // Alertas de desvantagens (situacionais que podem ser ativadas)
  const desvantagensAlerta = (pcCompleto.desvantagens || [])
    .filter(d => d.efeito || d.bonus)
    .map(d => d.nome);
  state.desvantagensAlerta = desvantagensAlerta;

  // Vantagens passivas ativas
  const vantagensPassivas = (pcCompleto.vantagens || [])
    .filter(v => v.usar === 0 || v.usar == null)
    .map(v => v.nome);
  state.vantagensPassivas = vantagensPassivas;

  // Contexto de cena (populados por applyMetadadosToSessao)
  state.cenaAtual = estadoJogo.cenaAtual || mestreCtx?.sessao?.cenaAtual || null;
  state.ambiente = estadoJogo.ambiente || mestreCtx?.sessao?.ambiente || null;
  state.horaFiccional = estadoJogo.horaFiccional || null;
  state.rodadaAtual = estadoJogo.rodadaAtual || 1;

  // Último teste resolvido (salvo pelo testEngine)
  state.ultimoTeste = estadoJogo.ultimoTeste?.[String(userId)] || null;

  // Inventário atual (equipamentos já em personagensCompletos, sem query)
  state.inventario = (pcCompleto.equipamentos || [])
    .slice(0, 10)
    .map(e => ({ nome: e.nome, tipo: e.tipo || null }));

  // Contexto tático
  state.terreno = normalizarTerrenoInput(estadoJogo.terreno);
  state.terreno_tags = state.terreno?.tags || [];
  state.efeitos_terreno = getEfeitosTerreno(sessao);
  state.tensao = estadoJogo.tensao || null;
  state.ameacas = Array.isArray(estadoJogo.ameacas) ? estadoJogo.ameacas : [];

  // Runtime tático avançado
  state.boss = getBossResumo(sessao);
  state.batalha_grande = getBatalhaGrandeResumo(sessao);
  state.missao_tatica = getMissaoTaticaResumo(sessao);

  return state;
}

/**
 * Formata state object como texto legível para injetar no prompt
 */
export function formatTurnStateText(state) {
  const lines = [];
  lines.push(`[Estado de ${state.nome} — ${state.classe || ''} Nv${state.nivel || 1}]`);

  // Linha de cena/ambiente/hora (só se houver dado)
  const cenaParts = [];
  if (state.cenaAtual) cenaParts.push(`Cena: ${state.cenaAtual}`);
  if (state.ambiente) cenaParts.push(`Ambiente: ${state.ambiente}`);
  if (state.horaFiccional) cenaParts.push(`Hora: ${state.horaFiccional}`);
  if (cenaParts.length > 0) lines.push(cenaParts.join(' | '));

  lines.push(`HP: ${state.hp.atual}/${state.hp.max} | Mana: ${state.mana?.atual ?? '?'}/${state.mana?.max ?? '?'}`);
  if (state.inconsciente) lines.push(`⚠ INCONSCIENTE — não pode agir, precisa ser estabilizado ou curado`);
  if (state.rodadaAtual > 1) lines.push(`Rodada: ${state.rodadaAtual}`);

  if (state.xpGanho > 0) lines.push(`XP acumulado: ${state.xpGanho}`);

  if (state.efeitos.length > 0) {
    lines.push(`Efeitos: ${state.efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')}`);
  }

  if (state.cooldowns?.length > 0) {
    lines.push(`Cooldowns: ${state.cooldowns.map(c => `${c.id}(${c.turnos}t)`).join(', ')}`);
  }

  if (state.concentracao) {
    lines.push(`Concentração: ${state.concentracao.nome} (${state.concentracao.turnos_restantes || '?'}t restantes)`);
  }

  if (state.habilidadesDisponiveis?.length > 0) {
    lines.push(`Habilidades: ${state.habilidadesDisponiveis.map(h => {
      const parts = [h.nome];
      if (h.cd > 0) parts.push(`cd:${h.cd}t`);
      if (h.custo_mana > 0) parts.push(`${h.custo_mana}MP`);
      return parts.length > 1 ? `${parts[0]} (${parts.slice(1).join(', ')})` : parts[0];
    }).join(', ')}`);
  }

  if (state.magiasDisponiveis?.length > 0) {
    lines.push(`Magias: ${state.magiasDisponiveis.map(m => {
      const parts = [m.nome];
      if (m.custo_mana > 0) parts.push(`${m.custo_mana}MP`);
      if (m.cd > 0) parts.push(`cd:${m.cd}t`);
      if (m.concentracao) parts.push('conc');
      return parts.length > 1 ? `${parts[0]} (${parts.slice(1).join(', ')})` : parts[0];
    }).join(', ')}`);
  }

  if (state.vantagensPassivas?.length > 0) {
    lines.push(`Vantagens ativas: ${state.vantagensPassivas.join(', ')}`);
  }

  if (state.desvantagensAlerta?.length > 0) {
    lines.push(`Desvantagens (alerta): ${state.desvantagensAlerta.join(', ')}`);
  }

  // Inventário atual
  if (state.inventario?.length > 0) {
    lines.push(`Inventário: ${state.inventario.map(i => i.nome).join(', ')}`);
  }

  if (state.itensGanhos.length > 0) lines.push(`Itens ganhos: ${state.itensGanhos.map(i => i.nome || i).join(', ')}`);
  if (state.itensPerdidos.length > 0) lines.push(`Itens perdidos: ${state.itensPerdidos.map(i => i.nome || i).join(', ')}`);

  // Último teste (tolera dc/sucesso nulos do fallback mecânico)
  if (state.ultimoTeste) {
    const ut = state.ultimoTeste;
    const partes = [ut.teste || 'Teste'];
    if (ut.dc != null) partes.push(`DC ${ut.dc}`);
    if (ut.sucesso != null) partes.push(ut.sucesso ? 'Sucesso' : 'Falha');
    if (ut.total != null) partes.push(`(total ${ut.total})`);
    lines.push(`Último teste: ${partes.join(' ')}`);
  }

  // Contexto tático (populado via metadados da IA)
  if (state.terreno) {
    const label = getTerrenoLabel(state.terreno);
    const tags = state.terreno_tags?.length > 0 ? ` [${state.terreno_tags.join(', ')}]` : '';
    if (label) lines.push(`Terreno: ${label}${tags}`);
  }
  if (state.efeitos_terreno?.length > 0) {
    const efLabels = state.efeitos_terreno
      .map(ef => ef.descricao || ef.elemento || 'efeito')
      .slice(0, 3);
    lines.push(`Efeitos terreno: ${efLabels.join(', ')}`);
  }
  if (state.tensao) lines.push(`Tensão: ${state.tensao}`);
  if (state.ameacas?.length > 0) lines.push(`Ameaças: ${state.ameacas.join(', ')}`);

  // Boss ativo
  if (state.boss) {
    lines.push(`Boss: ${state.boss.nome} (Fase ${state.boss.fase_atual})`);
  }

  // Batalha grande
  if (state.batalha_grande) {
    const bg = state.batalha_grande;
    const header = bg.nome || 'Batalha';
    const obj = bg.objetivo ? ` | Objetivo: ${bg.objetivo.slice(0, 60)}` : '';
    lines.push(`Batalha: ${header}${obj}`);
    if (bg.frentes?.length > 0) {
      const fLabels = bg.frentes.map(f => `${f.nome}(${f.status || '?'} ${f.progresso ?? '?'}%)`);
      lines.push(`Frentes: ${fLabels.join(', ')}`);
    }
  }

  // Missão tática
  if (state.missao_tatica) {
    const mt = state.missao_tatica;
    const desc = mt.objetivo || mt.descricao || 'Missão';
    const prog = mt.progresso != null ? ` ${mt.progresso}%` : '';
    lines.push(`Missão tática: ${desc.slice(0, 60)} [${mt.status}${prog}]`);
  }

  return lines.join('\n');
}

export default { buildTurnState, formatTurnStateText };
