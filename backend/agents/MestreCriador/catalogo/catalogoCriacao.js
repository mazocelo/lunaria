/**
 * CatalogoCriacao — Constrói catálogo de raças, classes, vantagens e desvantagens
 * para injetar no system prompt do Mestre Criador.
 */
import db from '../../../Model/index.js';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
let _cachedCatalogo = null;
let _cacheTimestamp = 0;

/** Invalida o cache manualmente */
export function invalidarCacheCriacao() {
  _cachedCatalogo = null;
  _cacheTimestamp = 0;
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

async function fetchData() {
  const now = Date.now();
  if (_cachedCatalogo && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cachedCatalogo;
  }

  const [racas, classes, vantagens, desvantagens] = await Promise.all([
    db.Raca.findAll(),
    db.Classe.findAll(),
    db.Vantagem.findAll(),
    db.Desvantagem.findAll(),
  ]);

  _cachedCatalogo = { racas, classes, vantagens, desvantagens };
  _cacheTimestamp = now;
  return _cachedCatalogo;
}

/**
 * Constrói catálogo completo para o prompt do Mestre Criador
 * @returns {string} Texto formatado
 */
export async function buildCatalogoCriacao() {
  try {
    const { racas, classes, vantagens, desvantagens } = await fetchData();

    const sections = [];

    // Raças
    sections.push('## RAÇAS DISPONÍVEIS');
    for (const r of racas) {
      const bonus = formatarBonus(r.bonus);
      const vantagensNomes = r.vantagens?.map(v => v.nome || v).join(', ') || '';
      const desvantagensNomes = r.desvantagens?.map(d => d.nome || d).join(', ') || '';
      let line = `- [ID:${r.id}] **${r.nome}** (custo:${r.custo})`;
      if (r.descricao) line += ` — ${r.descricao.slice(0, 80)}`;
      if (bonus) line += ` | Bônus: ${bonus}`;
      if (vantagensNomes) line += ` | Vantagens: ${vantagensNomes}`;
      if (desvantagensNomes) line += ` | Desvantagens: ${desvantagensNomes}`;
      sections.push(line);
    }

    // Classes
    sections.push('\n## CLASSES DISPONÍVEIS');
    for (const c of classes) {
      const bonus = formatarBonus(c.bonus);
      let line = `- [ID:${c.id}] **${c.nome}** (custo:${c.custo})`;
      if (c.descricao) line += ` — ${c.descricao.slice(0, 80)}`;
      if (bonus) line += ` | Bônus: ${bonus}`;
      sections.push(line);
    }

    // Vantagens (compráveis — excluir as de classe com custo 0 se tiver flag)
    sections.push('\n## VANTAGENS DISPONÍVEIS');
    for (const v of vantagens) {
      if (v.custo === 0 && v.compravel === false) continue; // pular class-only
      let line = `- [ID:${v.id}] **${v.nome}** (custo:${v.custo})`;
      if (v.descricao) line += ` — ${v.descricao.slice(0, 60)}`;
      if (v.tipo?.length) line += ` | Tipo: ${v.tipo.join(',')}`;
      if (v.requisitos) line += ` | Req: ${v.requisitos}`;
      sections.push(line);
    }

    // Desvantagens
    sections.push('\n## DESVANTAGENS DISPONÍVEIS');
    for (const d of desvantagens) {
      let line = `- [ID:${d.id}] **${d.nome}** (custo:${d.custo})`;
      if (d.descricao) line += ` — ${d.descricao.slice(0, 60)}`;
      sections.push(line);
    }

    return sections.join('\n');
  } catch (error) {
    console.error('CatalogoCriacao: Erro ao construir catálogo:', error.message);
    return '(Catálogo indisponível — sugira opções genéricas)';
  }
}
