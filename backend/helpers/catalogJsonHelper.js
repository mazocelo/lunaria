import { normalizarElemento } from '../config/domainConstants.js';
import { ATRIBUTO_IDS } from '../game-systems/lunaria/constants.js';

const ATRIBUTOS_BASE = ATRIBUTO_IDS;

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value).replace('+', ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJsonObject(raw) {
  if (raw == null || raw === '') return null;
  if (isPlainObject(raw)) return { ...raw };
  if (typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Normaliza um campo Json de catalogo na ENTRADA: garante objeto ou array
 * (nunca string JSON) ou null. Strings JSON validas sao parseadas; objetos e
 * arrays passam direto; qualquer outra coisa vira null. Use ao persistir
 * colunas `Json?` a partir de `req.body` cru.
 */
export function normalizarJsonCatalogo(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed !== null && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeStringArray(raw) {
  if (raw === undefined || raw === null || raw === '') return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

export function normalizarBonusEntidade(raw) {
  const parsed = parseJsonObject(raw);
  if (!parsed) return null;

  const source = isPlainObject(parsed.atributos_bonus) ? parsed.atributos_bonus : parsed;
  const normalized = { ...parsed };
  delete normalized.atributos_bonus;

  for (const atributo of ATRIBUTOS_BASE) {
    const valor = toIntOrNull(source[atributo]);
    if (valor != null) normalized[atributo] = valor;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function extrairAtributosBonus(raw) {
  const bonus = normalizarBonusEntidade(raw);
  const atributos = {};

  for (const atributo of ATRIBUTOS_BASE) {
    atributos[atributo] = Number(bonus?.[atributo]) || 0;
  }

  return atributos;
}

export function decorarBonusEntidade(raw) {
  const bonus = normalizarBonusEntidade(raw);
  return {
    bonus,
    atributos_bonus: extrairAtributosBonus(bonus),
  };
}

export function normalizarBonusCombate(raw) {
  const parsed = parseJsonObject(raw) || (isPlainObject(raw) ? { ...raw } : null);
  if (!parsed) return null;

  const normalized = { ...parsed };
  const ataque = toIntOrNull(parsed.ataque);
  const dano = toIntOrNull(parsed.dano);
  const esquivaBonus = toIntOrNull(parsed.esquiva_bonus);
  const esquivaPenalidade = toIntOrNull(parsed.esquiva_penalidade);

  if (ataque != null) normalized.ataque = ataque;
  if (dano != null) normalized.dano = dano;
  if (esquivaBonus != null) normalized.esquiva_bonus = esquivaBonus;
  if (esquivaPenalidade != null) normalized.esquiva_penalidade = esquivaPenalidade;

  let armadura = toIntOrNull(parsed.armadura);
  if (armadura == null && parsed.ca_base != null) {
    const caBase = toIntOrNull(parsed.ca_base);
    if (caBase != null) armadura = Math.floor(caBase * 0.3);
  }
  if (armadura == null && parsed.ca != null) {
    armadura = toIntOrNull(parsed.ca);
  }
  if (armadura != null) normalized.armadura = armadura;

  delete normalized.ca;
  delete normalized.ca_base;
  return normalized;
}

export function normalizarListaElementos(raw) {
  if (raw === undefined) return undefined;
  const values = Array.isArray(raw) ? raw : raw == null || raw === '' ? [] : [raw];
  const normalized = values
    .map((value) => normalizarElemento(value))
    .filter(Boolean);
  return [...new Set(normalized)];
}

export function normalizarElementoPrimario(raw) {
  const elementos = normalizarListaElementos(raw);
  return Array.isArray(elementos) && elementos.length > 0 ? elementos[0] : null;
}

export function normalizarEfeitoCatalogo(raw) {
  const parsed = parseJsonObject(raw) || (isPlainObject(raw) ? { ...raw } : null);
  if (!parsed) return null;

  const normalized = { ...parsed };
  const nome = normalized.nome ?? normalized.status ?? null;
  if (nome) {
    normalized.nome = String(nome).trim();
    normalized.status = normalized.status || normalized.nome;
  }

  const duracao = toIntOrNull(normalized.duracao);
  if (duracao != null) normalized.duracao = duracao;

  if (normalized.valor !== undefined) {
    normalized.valor = Number(normalized.valor) || 0;
  }

  if (normalized.dano_por_turno != null && typeof normalized.dano_por_turno !== 'string') {
    normalized.dano_por_turno = String(normalized.dano_por_turno);
  }

  if (normalized.cura_por_turno != null && typeof normalized.cura_por_turno !== 'string') {
    normalized.cura_por_turno = String(normalized.cura_por_turno);
  }

  return normalized;
}

export function normalizarEfeitoRuntime(raw) {
  const efeito = normalizarEfeitoCatalogo(raw);
  if (!efeito?.nome) return null;

  return {
    nome: efeito.nome,
    duracao: efeito.duracao || 3,
    tipo: efeito.tipo || null,
    valor: Number(efeito.valor) || 0,
    dano_por_turno: efeito.dano_por_turno || null,
    cura_por_turno: efeito.cura_por_turno || null,
  };
}

export function normalizarRequisitos(raw) {
  const parsed = parseJsonObject(raw) || (isPlainObject(raw) ? { ...raw } : null);
  if (!parsed) return {};

  const source = isPlainObject(parsed.pre_requisitos)
    ? parsed.pre_requisitos
    : isPlainObject(parsed.pre_requisito)
      ? parsed.pre_requisito
      : parsed;

  const normalized = { ...source };
  const classe = normalizeStringArray(normalized.classe);
  const raca = normalizeStringArray(normalized.raca);
  const habilidades = normalizeStringArray(normalized.habilidades);
  const nivel = toIntOrNull(normalized.nivel);
  const nivelMinimo = toIntOrNull(normalized.nivel_minimo);

  if (classe.length > 0) normalized.classe = classe;
  if (raca.length > 0) normalized.raca = raca;
  if (habilidades.length > 0) normalized.habilidades = habilidades;
  if (nivel != null) normalized.nivel = nivel;
  if (nivelMinimo != null) normalized.nivel_minimo = nivelMinimo;

  if (isPlainObject(normalized.atributos_minimos)) {
    const attrs = {};
    for (const atributo of ATRIBUTOS_BASE) {
      const valor = toIntOrNull(normalized.atributos_minimos[atributo]);
      if (valor != null) attrs[atributo] = valor;
    }
    normalized.atributos_minimos = attrs;
  }

  delete normalized.pre_requisito;
  delete normalized.pre_requisitos;

  return normalized;
}

export function normalizarRestricao(raw) {
  const parsed = parseJsonObject(raw) || (isPlainObject(raw) ? { ...raw } : null);
  return parsed || {};
}

export function normalizarUsos(raw) {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  const parsed = toIntOrNull(raw);
  return parsed != null && parsed >= 0 ? parsed : null;
}

export function normalizarPayloadVantagemOuDesvantagem(body = {}) {
  const usos = body.usos !== undefined ? body.usos : body.usar;
  return {
    ...body,
    bonus: body.bonus !== undefined ? normalizarBonusCombate(body.bonus) ?? body.bonus : undefined,
    restricao: body.restricao !== undefined ? normalizarRestricao(body.restricao) : undefined,
    efeito: body.efeito !== undefined ? normalizarEfeitoCatalogo(body.efeito) : undefined,
    elemento: body.elemento !== undefined ? normalizarListaElementos(body.elemento) : undefined,
    requisitos: body.requisitos !== undefined ? normalizarRequisitos(body.requisitos) : undefined,
    usar: normalizarUsos(usos),
  };
}

export function serializarVantagemOuDesvantagem(item) {
  return {
    ...item,
    bonus: normalizarBonusCombate(item?.bonus) ?? item?.bonus ?? {},
    restricao: normalizarRestricao(item?.restricao),
    efeito: normalizarEfeitoCatalogo(item?.efeito) ?? item?.efeito ?? {},
    elemento: normalizarListaElementos(item?.elemento) ?? [],
    requisitos: normalizarRequisitos(item?.requisitos),
    usar: normalizarUsos(item?.usar) ?? null,
    usos: normalizarUsos(item?.usar) ?? null,
  };
}

export function serializarHabilidade(item) {
  const elemento = normalizarElementoPrimario(item?.elemento);
  return {
    ...item,
    elemento,
    elementos: elemento ? [elemento] : [],
    efeito: normalizarEfeitoCatalogo(item?.efeito),
    area_efeito: parseJsonObject(item?.area_efeito) || item?.area_efeito || null,
    pre_requisito: normalizarRequisitos(item?.pre_requisito),
    pre_requisitos: normalizarRequisitos(item?.pre_requisito),
  };
}

export function serializarClasseOuRaca(item) {
  const decorated = decorarBonusEntidade(item?.bonus);
  return {
    ...item,
    bonus: decorated.bonus,
    atributos_bonus: decorated.atributos_bonus,
  };
}
