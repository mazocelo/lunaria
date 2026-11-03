/**
 * DTOs de normalizacao — boundary entre payloads WebSocket e Zustand store.
 *
 * Cada normalizer recebe o payload cru do backend e retorna um shape
 * garantido para o store. Se o backend mudar nomes de campo, so este
 * arquivo precisa ser atualizado.
 */

type AnyObj = Record<string, unknown>;

function asObj(value: unknown): AnyObj {
  return (value && typeof value === 'object') ? value as AnyObj : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === 'string' ? value : fallback;
}

function asNum(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function asNumOr(value: unknown, fallback: unknown): unknown {
  return typeof value === 'number' ? value : fallback;
}

function pickNum(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (typeof c === 'number') return c;
  }
  return 0;
}

// Combat State ──────────────────────────────────────────────────────

/**
 * Normaliza o payload de combate_iniciado
 */
export function normalizeCombateIniciado(data: AnyObj): {
  monstros: AnyObj[];
  jogadores: Record<string, AnyObj>;
  rodada: number;
} {
  return {
    monstros: asArray(data.monstros)
      .map((m) => normalizeMonstro(m as AnyObj))
      .filter((m): m is AnyObj => m !== null),
    jogadores: normalizeJogadoresMap(data.jogadores),
    rodada: asNum(data.rodada, 1),
  };
}

/**
 * Normaliza instancia de monstro em combate
 */
export function normalizeMonstro(m: AnyObj | null | undefined): AnyObj | null {
  if (!m) return null;
  return {
    id: m.id,
    nome: asString(m.nome, 'Monstro'),
    tipo: m.tipo ?? null,
    nivel: asNum(m.nivel, 1),
    hp_atual: pickNum(m.hp_atual, m.hpAtual),
    hp_max: pickNum(m.hp_max, m.hpMax),
    status: asString(m.status, 'vivo'),
    imagem: m.imagem ?? null,
    elemento: m.elemento || [],
    armadura: asNum(m.armadura, 0),
    esquiva: asNum(m.esquiva, 0),
    habilidades: m.habilidades || [],
  };
}

/**
 * Normaliza o mapa de jogadores { [userId]: stats }
 */
export function normalizeJogadoresMap(jogadores: unknown): Record<string, AnyObj> {
  if (!jogadores || typeof jogadores !== 'object') return {};
  const result: Record<string, AnyObj> = {};
  for (const [userId, stats] of Object.entries(jogadores as AnyObj)) {
    // Original passava null adiante; normalizeJogadorStats(null) retorna null
    // — preservamos esse cast pra nao mudar shape ate inventariar consumidores.
    result[userId] = normalizeJogadorStats(stats as AnyObj) as AnyObj;
  }
  return result;
}

/**
 * Normaliza stats de um jogador em combate
 */
export function normalizeJogadorStats(s: AnyObj | null | undefined): AnyObj | null {
  if (!s) return null;
  return {
    ...s,
    hp_atual: pickNum(s.hp_atual, s.hpAtual),
    hp_max: pickNum(s.hp_max, s.hpMax),
    mana_atual: pickNum(s.mana_atual, s.manaAtual),
    mana_max: pickNum(s.mana_max, s.manaMax),
    esquiva: asNum(s.esquiva, 0),
    armadura: asNum(s.armadura, 0),
    status: asString(s.status, 'vivo'),
    status_efeitos: s.status_efeitos || [],
    cooldowns: s.cooldowns || {},
    concentracao: s.concentracao || null,
  };
}

/**
 * Normaliza payload de combate_resultado_acao
 */
export function normalizeResultadoAcao(data: AnyObj): AnyObj {
  const alvo = asObj(data.alvo);
  const atacante = asObj(data.atacante);
  return {
    tipo: data.tipo,
    acertou: data.acertou ?? false,
    critico: data.critico ?? false,
    esquivou: data.esquivou ?? false,
    dano: data.dano ?? 0,
    hpRestante: asNumOr(data.hpRestante, data.hp_atual ?? 0),
    hpMax: asNumOr(data.hpMax, data.hp_max ?? 0),
    elemento: data.elemento || null,
    status: data.status || null,
    mensagem: data.mensagem || null,
    personagem: data.personagem || null,
    userId: data.userId || null,
    alvo: data.alvo ? {
      id: alvo.id ?? null,
      userId: alvo.userId ?? null,
      nome: alvo.nome ?? null,
    } : null,
    atacante: data.atacante ? {
      id: atacante.id ?? null,
      nome: atacante.nome ?? null,
    } : null,
    esquivaBonus: data.esquivaBonus ?? null,
    reducaoDano: data.reducaoDano ?? null,
    rolagem: data.rolagem ?? null,
    modificador: data.modificador ?? null,
    total: data.total ?? null,
    dc: data.dc ?? null,
    sucesso: data.sucesso ?? null,
    habilidadeNome: data.habilidadeNome || null,
    valido: data.valido ?? null,
    erro: data.erro || null,
    custoMana: data.custoMana ?? null,
    manaRestante: data.manaRestante ?? null,
    manaMax: data.manaMax ?? null,
    efeitoAplicado: data.efeitoAplicado || null,
    ataque: data.ataque || null,
  };
}

/**
 * Normaliza payload de combate_jogador_ferido
 */
export function normalizeJogadorFerido(data: AnyObj): AnyObj {
  return {
    userId: data.userId,
    nome: data.nome || null,
    hp_atual: pickNum(data.hp_atual, data.hpAtual),
    derrotado: data.derrotado ?? false,
    dano: data.dano ?? 0,
    elemento: data.elemento || null,
  };
}

/**
 * Normaliza payload de combate_monstro_derrotado
 */
export function normalizeMonstruoDerrotado(data: AnyObj): { monstro: AnyObj | null; xp: number } {
  const monstro = asObj(data.monstro);
  return {
    monstro: data.monstro ? {
      id: monstro.id,
      nome: asString(monstro.nome, 'Monstro'),
    } : null,
    xp: asNum(data.xp, 0),
  };
}

/**
 * Normaliza payload de combate_finalizado
 */
export function normalizeCombateFinalizado(data: AnyObj): { resultado: unknown; xpTotal: number } {
  return {
    resultado: data.resultado || null,
    xpTotal: asNum(data.xpTotal, 0),
  };
}

/**
 * Normaliza payload de combate_estado (sync state)
 */
export function normalizeCombateEstado(data: AnyObj): {
  monstros: AnyObj[] | null;
  jogadores: Record<string, AnyObj> | null;
  rodada: number | null;
  log: AnyObj[] | null;
} {
  return {
    monstros: Array.isArray(data.monstros)
      ? (data.monstros as AnyObj[]).map((m) => normalizeMonstro(m)).filter((m): m is AnyObj => m !== null)
      : null,
    jogadores: data.jogadores ? normalizeJogadoresMap(data.jogadores) : null,
    rodada: typeof data.rodada === 'number' ? data.rodada : null,
    log: Array.isArray(data.log)
      ? (data.log as AnyObj[]).map((entry) => normalizeLogEntry(entry)).filter((e): e is AnyObj => e !== null)
      : null,
  };
}

/**
 * Normaliza uma entrada de log do combate para o formato esperado pela UI.
 * O backend grava campos como `alvoNome` e `atacante` (string), mas a UI
 * le `alvo.nome` e `atacante.nome`. Esta funcao garante compatibilidade
 * tanto no fluxo ao vivo (ja normalizado) quanto em rejoin/sync.
 */
function normalizeLogEntry(entry: AnyObj | null | undefined): AnyObj | null {
  if (!entry) return null;

  const normalized: AnyObj = { ...entry };

  if (typeof normalized.atacante === 'string') {
    normalized.atacante = { id: normalized.atacanteId ?? null, nome: normalized.atacante };
  }

  if (!normalized.alvo && normalized.alvoNome) {
    normalized.alvo = { id: normalized.alvoId ?? null, nome: normalized.alvoNome };
  } else if (normalized.alvo && typeof normalized.alvo === 'object' && !(normalized.alvo as AnyObj).nome && normalized.alvoNome) {
    normalized.alvo = { ...(normalized.alvo as AnyObj), nome: normalized.alvoNome };
  }

  return normalized;
}
