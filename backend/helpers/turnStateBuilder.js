/**
 * TurnStateBuilder - Monta o bloco de estado do turno para o Mestre IA
 *
 * Quando EXPANDED_STATE=true, inclui mana, cooldowns, concentração e alertas.
 * Quando false, mantém comportamento legado (HP, XP, itens, efeitos).
 */
import { isEnabled } from '../config/featureFlags.js';
import { calcularHP, calcularMana } from './combateHelper.js';

/**
 * Monta state object estruturado para um jogador no turno
 */
export function buildTurnState(sessao, userId, personagem) {
  const estadoJogo = sessao.estadoJogo || {};
  const pcCompleto = (sessao.personagensCompletos || {})[String(personagem.id || personagem.personagemId)] || personagem;
  const pSessao = estadoJogo.personagemSessao?.[String(userId)] || {};

  const attrs = pcCompleto.atributos || {};
  const nivel = pcCompleto.nivel || 1;

  // HP
  const hpMax = pSessao.hp_max ?? calcularHP({ constituicao: attrs.constituicao || 10, nivel });
  const hpAtual = pSessao.hp_atual ?? pcCompleto.hp ?? hpMax;

  // XP e itens (sempre disponíveis)
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

  // Campos expandidos (só quando flag ativa)
  if (isEnabled('EXPANDED_STATE')) {
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
  }

  return state;
}

/**
 * Formata state object como texto legível para injetar no prompt
 */
export function formatTurnStateText(state) {
  if (isEnabled('EXPANDED_STATE')) {
    return formatExpandedState(state);
  }
  return formatLegacyState(state);
}

/**
 * Formato legado: HP | XP | itens | efeitos (comportamento atual)
 */
function formatLegacyState(state) {
  const parts = [`HP ${state.hp.atual}/${state.hp.max}`];
  if (state.xpGanho > 0) parts.push(`XP ganho: ${state.xpGanho}`);
  if (state.itensGanhos.length > 0) parts.push(`Itens ganhos: ${state.itensGanhos.map(i => i.nome || i).join(', ')}`);
  if (state.itensPerdidos.length > 0) parts.push(`Itens perdidos: ${state.itensPerdidos.map(i => i.nome || i).join(', ')}`);
  if (state.efeitos.length > 0) parts.push(`Efeitos: ${state.efeitos.map(e => `${e.nome}(${e.duracao}t)`).join(', ')}`);
  return `[Estado atual de ${state.nome}: ${parts.join(' | ')}]`;
}

/**
 * Formato expandido: seções detalhadas com mana, cooldowns, concentração
 */
function formatExpandedState(state) {
  const lines = [];
  lines.push(`[Estado de ${state.nome} — ${state.classe || ''} Nv${state.nivel || 1}]`);
  lines.push(`HP: ${state.hp.atual}/${state.hp.max} | Mana: ${state.mana?.atual ?? '?'}/${state.mana?.max ?? '?'}`);

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

  if (state.itensGanhos.length > 0) lines.push(`Itens ganhos: ${state.itensGanhos.map(i => i.nome || i).join(', ')}`);
  if (state.itensPerdidos.length > 0) lines.push(`Itens perdidos: ${state.itensPerdidos.map(i => i.nome || i).join(', ')}`);

  return lines.join('\n');
}

export default { buildTurnState, formatTurnStateText };
