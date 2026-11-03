/**
 * TurnStateBuilder - Monta o bloco de estado do turno para o Mestre IA
 *
 * Inclui HP, mana, cooldowns, concentração, alertas de vantagens/desvantagens.
 */
import { calcularHP, calcularMana, getMultRaca, calcularHPSistema, calcularManaSistema } from './combateHelper.js';
import { resolverSistema } from './sistemaHelper.js';
import { getOwnedCombatActions } from './ownedActionsHelper.js';
import db from '../Model/index.js';
import {
  normalizarTerrenoInput, getTerrenoLabel, getEfeitosTerreno,
  getBossResumo, getBatalhaGrandeResumo, getMissaoTaticaResumo,
  migrarEstadoTaticoLegado
} from './estadoTatico.js';

// Mapa de palavras-chave por vantagem passiva (nome normalizado sem acentos)
const KEYWORD_MAP = {
  'visao noturna':        ['escur', 'noite', 'caverna', 'subterran', 'sombr', 'penumbra'],
  'visao no escuro':      ['escur', 'noite', 'caverna', 'subterran', 'sombr', 'penumbra'],
  'reflexos':             ['combate', 'luta', 'emboscada', 'surpres'],
  'sentido sismico':      ['caverna', 'subterran', 'terra', 'solo', 'tremor'],
  'respiracao aquatica':  ['agua', 'subaqua', 'oceano', 'rio', 'lago', 'inundad', 'submer'],
  'resistencia ao frio':  ['frio', 'neve', 'gelo', 'gelad', 'congelant'],
  'resistencia ao calor': ['fogo', 'calor', 'lava', 'desert', 'quente', 'vulcan'],
  'furtividade':          ['escur', 'noite', 'sombr', 'floresta', 'urbano'],
  'rastreador':           ['floresta', 'selva', 'trilha', 'rastro'],
  'afinidade arcana':     ['magia', 'arcan', 'mistic', 'encantad', 'ritual'],
  'empatia animal':       ['animal', 'fera', 'besta', 'criatura', 'floresta', 'selva'],
  'sexto sentido':        ['emboscada', 'armadilha', 'surpres', 'perigo'],
  'diplomatico':          ['cidade', 'vila', 'corte', 'nobre', 'mercado', 'taverna', 'urban'],
};

function removerAcentos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Filtra vantagens passivas aplicáveis ao contexto atual da cena.
 * Retorna array de {nome, descricao, bonus, motivo} para cada passiva relevante.
 */
function filtrarPassivasAplicaveis(vantagens, sceneContext) {
  const { cenaAtual, ambiente, terreno, combateAtivo, horaFiccional, efeitos } = sceneContext;

  const passivas = vantagens.filter(v => v.usar === 0 || v.usar == null);
  if (passivas.length === 0) return [];

  const terrenoTexto = terreno?.tipo || terreno?.label || (typeof terreno === 'string' ? terreno : '');
  const terrenoTags = Array.isArray(terreno?.tags) ? terreno.tags.join(' ') : '';
  const efeitosTexto = Array.isArray(efeitos)
    ? efeitos.map(e => `${e.nome || ''} ${e.descricao || ''}`).join(' ')
    : '';

  const contextoTexto = [
    cenaAtual, ambiente, terrenoTexto, terrenoTags,
    horaFiccional, efeitosTexto,
    combateAtivo ? 'combate' : ''
  ].filter(Boolean).join(' ').toLowerCase();

  const resultado = [];

  for (const v of passivas) {
    const nomeNorm = removerAcentos((v.nome || '').toLowerCase().trim());

    // 1) Tentar match via KEYWORD_MAP
    const keywords = KEYWORD_MAP[nomeNorm];
    if (keywords) {
      const matched = keywords.find(kw => contextoTexto.includes(kw));
      if (matched) {
        resultado.push({
          nome: v.nome,
          descricao: v.efeito?.descricao || v.descricao || null,
          bonus: v.efeito?.bonus || v.bonus || null,
          motivo: matched,
        });
        continue;
      }
    }

    // 2) Fallback: palavras da descricao do efeito como keywords
    const descEfeito = removerAcentos((v.efeito?.descricao || '').toLowerCase());
    if (descEfeito.length > 5) {
      const palavras = descEfeito.split(/\s+/).filter(p => p.length > 4);
      const matchDesc = palavras.find(p => contextoTexto.includes(p));
      if (matchDesc) {
        resultado.push({
          nome: v.nome,
          descricao: v.efeito?.descricao || v.descricao || null,
          bonus: v.efeito?.bonus || v.bonus || null,
          motivo: matchDesc,
        });
        continue;
      }
    }

    // 3) Fallback: combate-specific — se combateAtivo e nome sugere combate
    if (combateAtivo) {
      const combateKeywords = ['combate', 'luta', 'ataque', 'defesa', 'dano', 'armadura'];
      const nomeEDescricao = `${nomeNorm} ${descEfeito}`;
      const matchCombate = combateKeywords.find(kw => nomeEDescricao.includes(kw));
      if (matchCombate) {
        resultado.push({
          nome: v.nome,
          descricao: v.efeito?.descricao || v.descricao || null,
          bonus: v.efeito?.bonus || v.bonus || null,
          motivo: matchCombate,
        });
      }
    }
  }

  return resultado;
}

/**
 * Monta state object estruturado para um jogador no turno.
 * Async: a resolução das ações de combate consulta o vínculo real via engine.
 */
export async function buildTurnState(sessao, userId, personagem = {}) {
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

  // HP (dispatch via engine when personagem carries sistema)
  const racaNome = pcCompleto.raca_nome || pcCompleto.raca || '';
  const hpPersonagem = { atributos: attrs, nivel, sistema: resolverSistema(pcCompleto.sistema) };
  const hpMax = pSessao.hp_max ?? calcularHPSistema(hpPersonagem, getMultRaca(racaNome));
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

  // Mana (dispatch via engine)
  const manaMax = pSessao.mana_max ?? calcularManaSistema(hpPersonagem);
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

  const ownedActions = await getOwnedCombatActions(pcCompleto, db);

  // Habilidades e magias disponiveis (somente do loadout proprio do personagem).
  // As ações vindas do vínculo chegam como MagiaConhecida (custo); as concedidas
  // por vantagem mantêm o JSON do personagem (custo_mana/usa_concentracao).
  const custoDe = (h) => h.custo ?? h.custo_mana ?? 0;
  const habilidadesClasse = ownedActions.habilidades
    .map(h => {
      const cdRestante = cooldowns[`hab_${h.id}`] || 0;
      return { nome: h.nome, cd: cdRestante, custo_mana: custoDe(h) };
    });
  const magias = ownedActions.magias
    .map(h => {
      const cdRestante = cooldowns[`mag_${h.id}`] || 0;
      return { nome: h.nome, cd: cdRestante, custo_mana: custoDe(h), concentracao: h.usa_concentracao || false };
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

  // Passivas aplicáveis ao contexto atual da cena
  const combateAtivo = Boolean(sessao.estadoJogo?.combate?.ativo);
  state.passivasAplicaveis = filtrarPassivasAplicaveis(
    pcCompleto.vantagens || [],
    { cenaAtual: state.cenaAtual, ambiente: state.ambiente, terreno: state.terreno,
      combateAtivo, horaFiccional: state.horaFiccional, efeitos: state.efeitos }
  );

  // Contador de desvantagens ativadas na cena
  state.desvantagensAtivadas = estadoJogo.desvantagensAtivadas?.[String(userId)] || 0;
  state.desvantagensLimiteCena = 2;

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

  if (state.passivasAplicaveis?.length > 0) {
    lines.push(`⚡ Vantagens ATIVAS nesta cena (aplique na narração):`);
    for (const p of state.passivasAplicaveis) {
      const bonusStr = p.bonus ? ` [${p.bonus}]` : '';
      lines.push(`  → ${p.nome}${bonusStr} — Cena contém: ${p.motivo}`);
    }
  }

  if (state.vantagensPassivas?.length > 0) {
    const nomesAtivas = new Set((state.passivasAplicaveis || []).map(p => p.nome));
    const foraContexto = state.vantagensPassivas.filter(n => !nomesAtivas.has(n));
    if (foraContexto.length > 0) {
      lines.push(`Vantagens passivas (fora do contexto): ${foraContexto.join(', ')}`);
    }
  }

  if (state.desvantagensAlerta?.length > 0) {
    lines.push(`Desvantagens (alerta): ${state.desvantagensAlerta.join(', ')}`);
  }
  lines.push(`Desvantagens ativadas nesta cena: ${state.desvantagensAtivadas ?? 0}/${state.desvantagensLimiteCena ?? 2}`);

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
