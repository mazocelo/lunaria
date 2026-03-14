/**
 * TurnStateBuilder - Monta o bloco de estado do turno para o Mestre IA
 *
 * Inclui HP, mana, cooldowns, concentração, alertas de vantagens/desvantagens.
 */
import { calcularHP, calcularMana } from './combateHelper.js';
import { normalizarTerrenoInput, getTerrenoLabel, getEfeitosTerreno } from './estadoTatico.js';

/**
 * Monta state object estruturado para um jogador no turno
 */
export function buildTurnState(sessao, userId, personagem) {
  const estadoJogo = sessao.estadoJogo || {};
  const mestreCtx = sessao.mestreContexto || {};
  const pcCompleto = (sessao.personagensCompletos || {})[String(personagem.id || personagem.personagemId)] || personagem;
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

  const state = {
    nome: pcCompleto.nome || personagem.nome,
    hp: { atual: hpAtual, max: hpMax },
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
  state.classe = pcCompleto.classe || 'Aventureiro';
  state.nivel = nivel;

  // Cooldowns ativos
  const cooldowns = estadoJogo.cooldowns?.[String(userId)] || {};
  const cooldownsAtivos = Object.entries(cooldowns).filter(([, t]) => t > 0);
  state.cooldowns = cooldownsAtivos.map(([key, turnos]) => ({ id: key, turnos }));

  // Concentração ativa
  state.concentracao = estadoJogo.concentracao?.[String(userId)] || null;

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

  // Contexto tático — terreno normalizado para shape canônico (objeto ou legado string)
  state.terreno = normalizarTerrenoInput(estadoJogo.terreno);
  state.efeitos_terreno = getEfeitosTerreno(sessao);
  state.tensao = estadoJogo.tensao || null;
  state.ameacas = Array.isArray(estadoJogo.ameacas) ? estadoJogo.ameacas : [];

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
    if (label) lines.push(`Terreno: ${label}`);
  }
  if (state.efeitos_terreno?.length > 0) {
    const efLabels = state.efeitos_terreno
      .map(ef => ef.descricao || ef.elemento || 'efeito')
      .slice(0, 3);
    lines.push(`Efeitos terreno: ${efLabels.join(', ')}`);
  }
  if (state.tensao) lines.push(`Tensão: ${state.tensao}`);
  if (state.ameacas?.length > 0) lines.push(`Ameaças: ${state.ameacas.join(', ')}`);

  return lines.join('\n');
}

export default { buildTurnState, formatTurnStateText };
