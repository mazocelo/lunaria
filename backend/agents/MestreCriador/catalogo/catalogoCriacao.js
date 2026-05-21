/**
 * CatalogoCriacao — Constrói catálogo de raças, classes, vantagens e desvantagens
 * para injetar no system prompt do Mestre Criador.
 * Suporta multiplos sistemas (lunaria, 3det, dnd5e).
 */
import db from '../../../Model/index.js';
import logger from '../../../helpers/logger.js';
import { tierDesbloqueado } from '../../../helpers/evolucaoHelper.js';

const log = logger.child({ module: 'catalogoCriacao' });

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
const _cache = {};  // keyed by sistema

/** Invalida o cache manualmente */
export function invalidarCacheCriacao() {
  for (const key of Object.keys(_cache)) delete _cache[key];
}

function formatarBonus(bonus) {
  if (!bonus || (Array.isArray(bonus) && bonus.length === 0)) return '';
  const obj = Array.isArray(bonus) ? bonus[0] : bonus;
  if (!obj || typeof obj !== 'object') return '';
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v) parts.push(`${v > 0 ? '+' : ''}${v}${k}`);
  }
  return parts.join('/');
}

export async function fetchData(sistema = 'lunaria') {
  const now = Date.now();
  const cached = _cache[sistema];
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const isTresDet = sistema === 'tresdet';

  // 3D&T nao possui racas nem classes
  const [racas, classes, vantagens, desvantagens] = await Promise.all([
    isTresDet ? Promise.resolve([]) : db.Raca.findAll(sistema),
    isTresDet ? Promise.resolve([]) : db.Classe.findAll(sistema),
    db.Vantagem.findAll(sistema),
    db.Desvantagem.findAll(sistema),
  ]);

  const data = { racas, classes, vantagens, desvantagens };
  _cache[sistema] = { data, timestamp: now };
  return data;
}

/**
 * Constrói catálogo completo para o prompt do Mestre Criador
 * @param {number} [nivel=1] - Nível do personagem para filtrar por tier
 * @param {string} [sistema='lunaria']
 * @returns {string} Texto formatado
 */
export async function buildCatalogoCriacao(nivel = 1, sistema = 'lunaria') {
  try {
    const { racas, classes, vantagens: vantagensRaw, desvantagens: desvantagensRaw } = await fetchData(sistema);
    const tier = tierDesbloqueado(nivel);
    const vantagens = vantagensRaw.filter(v => (v.nivel || 1) <= tier);
    const desvantagens = desvantagensRaw.filter(d => (d.nivel || 1) <= tier);

    const sections = [];

    // Raças (Lunaria e D&D 5e)
    if (racas.length > 0) {
      sections.push('## RAÇAS DISPONÍVEIS');
      for (const r of racas) {
        const bonus = formatarBonus(r.bonus);
        const vantagensNomes = r.vantagens?.map(v => v.nome || v).join(', ') || '';
        const desvantagensNomes = r.desvantagens?.map(d => d.nome || d).join(', ') || '';
        let line = `- [ID:${r.id}] **${r.nome}** (custo:${r.custo})`;
        if (r.descricao) line += ` — ${r.descricao}`;
        if (bonus) line += ` | Bônus: ${bonus}`;
        if (vantagensNomes) line += ` | Vantagens: ${vantagensNomes}`;
        if (desvantagensNomes) line += ` | Desvantagens: ${desvantagensNomes}`;
        sections.push(line);
      }
    }

    // Classes (Lunaria e D&D 5e)
    if (classes.length > 0) {
      sections.push('\n## CLASSES DISPONÍVEIS');
      for (const c of classes) {
        const bonus = formatarBonus(c.bonus);
        let line = `- [ID:${c.id}] **${c.nome}** (custo:${c.custo})`;
        if (c.descricao) line += ` — ${c.descricao}`;
        if (bonus) line += ` | Bônus: ${bonus}`;
        sections.push(line);
      }
    }

    // Vantagens (compráveis — excluir as de classe com custo 0 se tiver flag)
    sections.push('\n## VANTAGENS DISPONÍVEIS');
    for (const v of vantagens) {
      if (v.custo === 0 && v.compravel === false) continue; // pular class-only
      let line = `- [ID:${v.id}] **${v.nome}** (custo:${v.custo})`;
      if (v.descricao) line += ` — ${v.descricao}`;
      if (v.tipo?.length) line += ` | Tipo: ${v.tipo.join(',')}`;
      if (v.requisitos) line += ` | Req: ${v.requisitos}`;
      sections.push(line);
    }

    // Desvantagens
    sections.push('\n## DESVANTAGENS DISPONÍVEIS');
    for (const d of desvantagens) {
      let line = `- [ID:${d.id}] **${d.nome}** (custo:${d.custo})`;
      if (d.descricao) line += ` — ${d.descricao}`;
      sections.push(line);
    }

    return sections.join('\n');
  } catch (error) {
    log.error({ err: error }, 'Erro ao construir catalogo');
    return '(Catálogo indisponível — sugira opções genéricas)';
  }
}
