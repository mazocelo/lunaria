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

// ── Selectors de runtime tático ──────────────────────────────────

/** Retorna resumo compacto do boss ativo ou null. */
export function getBossResumo(sessao) {
  const boss = sessao?.estadoJogo?.combate?.boss;
  if (!boss || !boss.nome) return null;
  return { nome: boss.nome, fase_atual: boss.fase_atual ?? 1 };
}

/** Retorna resumo compacto da batalha grande ativa ou null. */
export function getBatalhaGrandeResumo(sessao) {
  const bg = sessao?.estadoJogo?.batalha_grande;
  if (!bg || !bg.ativa) return null;
  return {
    nome: bg.nome || null,
    objetivo: bg.objetivo || null,
    frentes: Array.isArray(bg.frentes) ? bg.frentes.slice(0, 2).map(f => ({
      nome: f.nome || f.id,
      status: f.status || null,
      progresso: f.progresso ?? null
    })) : []
  };
}

/** Retorna resumo compacto da missão tática ativa ou null. */
export function getMissaoTaticaResumo(sessao) {
  const mt = sessao?.estadoJogo?.missao_tatica;
  if (!mt || mt.status === 'concluida' || mt.status === 'falhada') return null;
  return {
    descricao: mt.descricao || mt.objetivo || null,
    objetivo: mt.objetivo || null,
    status: mt.status || 'em_andamento',
    progresso: mt.progresso ?? null
  };
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

// ── Boss / Batalha Grande / Missão Tática ────────────────────────

/**
 * Cria ou atualiza combate.boss com shape canônico.
 * Requer combate ativo. Retorna o boss criado ou null se sem combate.
 */
export function setBossFase(sessao, payload) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate || !combate.ativo) return null;

  if (!combate.boss) {
    combate.boss = {
      nome: payload.nome || 'Boss',
      fase_atual: payload.fase || 1,
      fases: Array.isArray(payload.fases) ? payload.fases : null,
      atualizado_em: Date.now()
    };
  } else {
    if (payload.nome) combate.boss.nome = payload.nome;
    if (payload.fase != null) combate.boss.fase_atual = payload.fase;
    if (Array.isArray(payload.fases)) combate.boss.fases = payload.fases;
    combate.boss.atualizado_em = Date.now();
  }

  return combate.boss;
}

/**
 * Inicializa ou atualiza estadoJogo.batalha_grande com shape canônico.
 */
export function setBatalhaGrande(sessao, payload) {
  if (!sessao?.estadoJogo) return null;

  if (!sessao.estadoJogo.batalha_grande) {
    sessao.estadoJogo.batalha_grande = {
      ativa: true,
      nome: payload.nome || null,
      objetivo: payload.objetivo || null,
      frentes: Array.isArray(payload.frentes) ? payload.frentes.map(f => ({
        id: f.id || f.nome?.toLowerCase().replace(/\s+/g, '_') || String(Date.now()),
        nome: f.nome || f.id,
        status: f.status || 'ativa',
        progresso: f.progresso ?? 0
      })) : [],
      turno_inicio: sessao.estadoJogo.rodadaAtual || 1
    };
  } else {
    const bg = sessao.estadoJogo.batalha_grande;
    if (payload.nome) bg.nome = payload.nome;
    if (payload.objetivo) bg.objetivo = payload.objetivo;
    if (Array.isArray(payload.frentes)) {
      bg.frentes = payload.frentes.map(f => ({
        id: f.id || f.nome?.toLowerCase().replace(/\s+/g, '_') || String(Date.now()),
        nome: f.nome || f.id,
        status: f.status || 'ativa',
        progresso: f.progresso ?? 0
      }));
    }
    bg.ativa = true;
  }

  return sessao.estadoJogo.batalha_grande;
}

/** Encerra batalha grande. */
export function clearBatalhaGrande(sessao) {
  if (sessao?.estadoJogo) sessao.estadoJogo.batalha_grande = null;
}

/**
 * Cria ou atualiza estadoJogo.missao_tatica com shape canônico.
 */
export function setMissaoTatica(sessao, payload) {
  if (!sessao?.estadoJogo) return null;

  sessao.estadoJogo.missao_tatica = {
    descricao: payload.descricao || payload.objetivo || null,
    objetivo: payload.objetivo || null,
    status: payload.status || 'em_andamento',
    progresso: payload.progresso ?? 0,
    recompensa_xp: payload.recompensa_xp ?? null
  };

  return sessao.estadoJogo.missao_tatica;
}

/** Limpa missão tática. */
export function clearMissaoTatica(sessao) {
  if (sessao?.estadoJogo) sessao.estadoJogo.missao_tatica = null;
}
