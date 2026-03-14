import logger from './logger.js';

const log = logger.child({ module: 'estadoTatico' });

/**
 * Normaliza terreno para shape canônico { tipo, label, tags }.
 * Aceita: string, objeto parcial, null/undefined.
 * Retorna: objeto canônico ou null.
 *
 * Usado na borda de entrada (metadados da IA, ações mecânicas)
 * e na leitura de legado em sessões existentes.
 */
export function normalizarTerrenoInput(raw) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return { tipo: trimmed, label: trimmed, tags: [] };
  }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const label = typeof raw.label === 'string' ? raw.label.trim() : null;
    const tipo = typeof raw.tipo === 'string' ? raw.tipo.trim() : label;
    if (!tipo) return null;
    return {
      tipo,
      label: label || tipo,
      tags: Array.isArray(raw.tags) ? raw.tags.filter(t => typeof t === 'string') : []
    };
  }

  log.warn({ raw: typeof raw }, 'normalizarTerrenoInput: valor inesperado ignorado');
  return null;
}

/**
 * Extrai label do terreno para renderização em texto.
 * Aceita apenas objeto canônico ou null.
 * Retorna: string ou null.
 */
export function getTerrenoLabel(terreno) {
  if (!terreno || typeof terreno !== 'object') return null;
  return terreno.label || terreno.tipo || null;
}

// ── efeitos_terreno[] ──────────────────────────────────────────────

/**
 * Adiciona um efeito de terreno ao array canônico.
 * Shape: { descricao, elemento, dano_por_turno, duracao, aplicado_em, fonte }
 */
export function addEfeitoTerreno(sessao, efeito) {
  if (!sessao?.estadoJogo) return;
  if (!efeito || typeof efeito !== 'object') return;
  if (!Array.isArray(sessao.estadoJogo.efeitos_terreno)) {
    sessao.estadoJogo.efeitos_terreno = [];
  }
  sessao.estadoJogo.efeitos_terreno.push({
    descricao: efeito.descricao || null,
    elemento: efeito.elemento || null,
    dano_por_turno: efeito.dano_por_turno || null,
    duracao: efeito.duracao || null,
    aplicado_em: efeito.aplicado_em || null,
    fonte: efeito.fonte || null
  });
}

/** Retorna efeitos_terreno[] ou array vazio. */
export function getEfeitosTerreno(sessao) {
  return Array.isArray(sessao?.estadoJogo?.efeitos_terreno)
    ? sessao.estadoJogo.efeitos_terreno
    : [];
}

/** Limpa todos os efeitos de terreno. */
export function clearEfeitosTerreno(sessao) {
  if (sessao?.estadoJogo) sessao.estadoJogo.efeitos_terreno = [];
}

/**
 * Remove efeitos expirados por duração.
 * Retorna array dos efeitos removidos.
 */
export function expireEfeitosTerreno(sessao, rodadaAtual) {
  if (!Array.isArray(sessao?.estadoJogo?.efeitos_terreno)) return [];
  const ativos = [];
  const expirados = [];
  for (const ef of sessao.estadoJogo.efeitos_terreno) {
    if (ef.duracao != null && ef.aplicado_em != null && (rodadaAtual - ef.aplicado_em) >= ef.duracao) {
      expirados.push(ef);
    } else {
      ativos.push(ef);
    }
  }
  sessao.estadoJogo.efeitos_terreno = ativos;
  return expirados;
}

// ── Bucket runtime per-player ──────────────────────────────────────

/**
 * Garante que estadoJogo.personagemSessao[userId] exista e retorna o bucket.
 */
export function ensurePersonagemBucket(sessao, userId) {
  if (!sessao.estadoJogo) sessao.estadoJogo = {};
  if (!sessao.estadoJogo.personagemSessao) sessao.estadoJogo.personagemSessao = {};
  const uid = String(userId);
  if (!sessao.estadoJogo.personagemSessao[uid]) {
    sessao.estadoJogo.personagemSessao[uid] = {};
  }
  return sessao.estadoJogo.personagemSessao[uid];
}

/** Registra item ganho no bucket per-player. */
export function registrarItemGanhoBucket(sessao, userId, item) {
  const bucket = ensurePersonagemBucket(sessao, userId);
  if (!Array.isArray(bucket.itens_ganhos)) bucket.itens_ganhos = [];
  bucket.itens_ganhos.push({
    nome: item.nome || item,
    id: item.id || null,
    timestamp: Date.now()
  });
}

/** Registra item perdido no bucket per-player. */
export function registrarItemPerdidoBucket(sessao, userId, item) {
  const bucket = ensurePersonagemBucket(sessao, userId);
  if (!Array.isArray(bucket.itens_perdidos)) bucket.itens_perdidos = [];
  bucket.itens_perdidos.push({
    nome: item.nome || item,
    id: item.id || null,
    motivo: item.motivo || null,
    timestamp: Date.now()
  });
}
