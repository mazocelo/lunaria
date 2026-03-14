/**
 * DTOs de normalização — boundary entre payloads WebSocket e Zustand store.
 *
 * Cada normalizer recebe o payload cru do backend e retorna um shape
 * garantido para o store. Se o backend mudar nomes de campo, só este
 * arquivo precisa ser atualizado.
 */

// ── Combat State ─────────────────────────────────────────────────────

/**
 * Normaliza o payload de combate_iniciado
 * @param {Object} data - raw payload do backend
 * @returns {{ monstros: Array, jogadores: Object, rodada: number }}
 */
export function normalizeCombateIniciado(data) {
  return {
    monstros: (data.monstros || []).map(normalizeMonstro),
    jogadores: normalizeJogadoresMap(data.jogadores),
    rodada: data.rodada || 1,
  };
}

/**
 * Normaliza instância de monstro em combate
 */
export function normalizeMonstro(m) {
  if (!m) return m;
  return {
    id: m.id,
    nome: m.nome || 'Monstro',
    tipo: m.tipo || null,
    nivel: m.nivel || 1,
    hp_atual: m.hp_atual ?? m.hpAtual ?? 0,
    hp_max: m.hp_max ?? m.hpMax ?? 0,
    status: m.status || 'vivo',
    imagem: m.imagem || null,
    elemento: m.elemento || [],
    armadura: m.armadura ?? 0,
    esquiva: m.esquiva ?? 0,
    habilidades: m.habilidades || [],
  };
}

/**
 * Normaliza o mapa de jogadores { [userId]: stats }
 */
export function normalizeJogadoresMap(jogadores) {
  if (!jogadores || typeof jogadores !== 'object') return {};
  const result = {};
  for (const [userId, stats] of Object.entries(jogadores)) {
    result[userId] = normalizeJogadorStats(stats);
  }
  return result;
}

/**
 * Normaliza stats de um jogador em combate
 */
export function normalizeJogadorStats(s) {
  if (!s) return s;
  return {
    ...s,
    hp_atual: s.hp_atual ?? s.hpAtual ?? 0,
    hp_max: s.hp_max ?? s.hpMax ?? 0,
    mana_atual: s.mana_atual ?? s.manaAtual ?? 0,
    mana_max: s.mana_max ?? s.manaMax ?? 0,
    esquiva: s.esquiva ?? 0,
    armadura: s.armadura ?? 0,
    status: s.status || 'vivo',
    status_efeitos: s.status_efeitos || [],
  };
}

/**
 * Normaliza payload de combate_resultado_acao
 */
export function normalizeResultadoAcao(data) {
  return {
    tipo: data.tipo,
    acertou: data.acertou ?? false,
    critico: data.critico ?? false,
    esquivou: data.esquivou ?? false,
    dano: data.dano ?? 0,
    hpRestante: data.hpRestante ?? data.hp_atual ?? 0,
    elemento: data.elemento || null,
    alvo: data.alvo ? {
      id: data.alvo.id ?? null,
      userId: data.alvo.userId ?? null,
      nome: data.alvo.nome ?? null,
    } : null,
    atacante: data.atacante ? {
      id: data.atacante.id ?? null,
      nome: data.atacante.nome ?? null,
    } : null,
  };
}

/**
 * Normaliza payload de combate_jogador_ferido
 */
export function normalizeJogadorFerido(data) {
  return {
    userId: data.userId,
    nome: data.nome || null,
    hp_atual: data.hp_atual ?? data.hpAtual ?? 0,
    derrotado: data.derrotado ?? false,
    dano: data.dano ?? 0,
    elemento: data.elemento || null,
  };
}

/**
 * Normaliza payload de combate_monstro_derrotado
 */
export function normalizeMonstruoDerrotado(data) {
  return {
    monstro: data.monstro ? {
      id: data.monstro.id,
      nome: data.monstro.nome || 'Monstro',
    } : null,
    xp: data.xp ?? 0,
  };
}

/**
 * Normaliza payload de combate_finalizado
 */
export function normalizeCombateFinalizado(data) {
  return {
    resultado: data.resultado || null,
    xpTotal: data.xpTotal ?? 0,
  };
}

/**
 * Normaliza payload de combate_estado (sync state)
 */
export function normalizeCombateEstado(data) {
  return {
    monstros: data.monstros ? data.monstros.map(normalizeMonstro) : null,
    jogadores: data.jogadores ? normalizeJogadoresMap(data.jogadores) : null,
    rodada: data.rodada ?? null,
    log: data.log ?? null,
  };
}
