/**
 * CatalogoMestre - Constrói catálogo de monstros, equipamentos e elementos
 * para injetar no system prompt do Mestre IA.
 *
 * O Mestre usa esses dados para tomar decisões informadas:
 * spawnar monstros que existem no banco, dar itens reais, etc.
 */
import db from '../../../Model/index.js';

/**
 * Formata bonus JSON de equipamento em string compacta
 * Ex: { ataque: 2, dano: 1 } → "+2atk/+1dano"
 */
function formatarBonus(bonus) {
  if (!bonus || (Array.isArray(bonus) && bonus.length === 0)) return '';
  const obj = Array.isArray(bonus) ? bonus[0] : bonus;
  if (!obj || typeof obj !== 'object') return '';

  const parts = [];
  if (obj.ataque) parts.push(`+${obj.ataque}atk`);
  if (obj.dano) parts.push(`+${obj.dano}dano`);
  if (obj.armadura) parts.push(`+${obj.armadura}arm`);
  if (obj.esquiva_bonus) parts.push(`+${obj.esquiva_bonus}esq`);
  if (obj.esquiva_penalidade) parts.push(`-${obj.esquiva_penalidade}esq`);
  return parts.join('/');
}

const MAX_CATALOGO_CHARS = 4000;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

// Cache de dados brutos do banco (compartilhado entre chamadas com diferentes filtros)
let _cachedRawData = null;
let _cacheTimestamp = 0;

/** Invalida o cache manualmente (chamar após admin criar/editar monstro ou equipamento) */
export function invalidarCacheCatalogo() {
  _cachedRawData = null;
  _cacheTimestamp = 0;
  console.log('📦 CatalogoMestre: cache invalidado');
}

async function fetchRawData() {
  const now = Date.now();
  if (_cachedRawData && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cachedRawData;
  }
  const data = await Promise.all([
    db.Monstro.findAll(),
    db.Equipamento.findAll(),
    db.Elemento.findAll()
  ]);
  _cachedRawData = { monstros: data[0], equipamentos: data[1], elementos: data[2] };
  _cacheTimestamp = now;
  return _cachedRawData;
}

/**
 * Constrói catálogo filtrado para o prompt do Mestre
 * @param {Object} options
 * @param {number[]} [options.niveisJogadores] - Níveis dos jogadores para filtrar monstros (±3)
 * @returns {string} Texto formatado do catálogo
 */
export async function buildCatalogo({ niveisJogadores = [] } = {}) {
  try {
    const { monstros, equipamentos, elementos } = await fetchRawData();

    // Filtrar monstros por nível dos jogadores (±3) se disponível
    let monstrosFiltrados = monstros;
    let monstrosOmitidos = 0;
    if (niveisJogadores.length > 0) {
      const nivelMin = Math.max(1, Math.min(...niveisJogadores) - 3);
      const nivelMax = Math.max(...niveisJogadores) + 3;
      monstrosFiltrados = monstros.filter(m => {
        const mMin = m.nivel_min || 1;
        const mMax = m.nivel_max || mMin;
        return mMax >= nivelMin && mMin <= nivelMax;
      });
      monstrosOmitidos = monstros.length - monstrosFiltrados.length;
    }

    const sections = [];

    // === MONSTROS ===
    if (monstrosFiltrados.length > 0) {
      const porTipo = {};
      for (const m of monstrosFiltrados) {
        const tipo = (m.tipo && m.tipo[0]) || 'outro';
        if (!porTipo[tipo]) porTipo[tipo] = [];
        const elem = m.elemento?.length ? `, ${m.elemento.join('/')}` : '';
        porTipo[tipo].push(`${m.nome} (nv${m.nivel_min}-${m.nivel_max}${elem})`);
      }

      let monstrosText = '=== CATÁLOGO DE MONSTROS ===\n';
      monstrosText += `${monstrosFiltrados.length} monstros no nível da party.\n`;
      monstrosText += 'Use nomes EXATOS ao iniciar combate.\n\n';
      for (const [tipo, lista] of Object.entries(porTipo).sort()) {
        monstrosText += `[${tipo}] ${lista.join(', ')}\n`;
      }
      if (monstrosOmitidos > 0) {
        monstrosText += `\n(+${monstrosOmitidos} monstros fora do nível da party)`;
      }
      sections.push(monstrosText);
    }

    // === EQUIPAMENTOS ===
    if (equipamentos.length > 0) {
      const porTipo = {};
      for (const e of equipamentos) {
        const tipo = (e.tipo && e.tipo[0]) || 'outro';
        if (!porTipo[tipo]) porTipo[tipo] = [];
        const elem = e.elemento?.length ? `, ${e.elemento.join('/')}` : '';
        const bonus = formatarBonus(e.bonus);
        const bonusStr = bonus ? `, ${bonus}` : '';
        const raridade = e.raridade_rel?.nome || '';
        const raridadeStr = raridade ? ` [${raridade}]` : '';
        porTipo[tipo].push(`${e.nome}${raridadeStr} (${e.dano_base || '-'}${elem}${bonusStr})`);
      }

      let equipText = '=== CATÁLOGO DE EQUIPAMENTOS ===\n';
      equipText += `Total: ${equipamentos.length} equipamentos disponíveis.\n`;
      equipText += 'Use nomes EXATOS ao dar itens.\n\n';
      for (const [tipo, lista] of Object.entries(porTipo).sort()) {
        equipText += `[${tipo}] ${lista.join(', ')}\n`;
      }
      sections.push(equipText);
    }

    // === ELEMENTOS ===
    if (elementos.length > 0) {
      let elemText = '=== ELEMENTOS ===\n';
      elemText += elementos.map(e => `${e.nome} (${e.descricao || ''})`).join(', ');
      sections.push(elemText);
    }

    let catalogo = sections.join('\n\n');

    // Cap final: truncar se exceder limite
    if (catalogo.length > MAX_CATALOGO_CHARS) {
      catalogo = catalogo.substring(0, MAX_CATALOGO_CHARS - 80);
      // Cortar na última linha completa
      const lastNewline = catalogo.lastIndexOf('\n');
      if (lastNewline > 0) catalogo = catalogo.substring(0, lastNewline);
      catalogo += `\n\n(Catálogo truncado. +${monstros.length} monstros e ${equipamentos.length} equipamentos disponíveis no mundo)`;
    }

    console.log(`📦 CatalogoMestre: ${monstrosFiltrados.length}/${monstros.length} monstros, ${equipamentos.length} equipamentos, ${elementos.length} elementos (${catalogo.length} chars)`);
    return catalogo;
  } catch (error) {
    console.error('❌ CatalogoMestre: Erro ao construir catálogo:', error.message);
    return '';
  }
}

/**
 * Constrói catálogo COMPLETO sem truncamento (para geração de blueprints)
 * @returns {string} Texto formatado do catálogo completo
 */
export async function buildCatalogoCompleto() {
  try {
    const { monstros, equipamentos, elementos } = await fetchRawData();
    const sections = [];

    // === MONSTROS (todos, sem filtro de nível) ===
    if (monstros.length > 0) {
      const porTipo = {};
      for (const m of monstros) {
        const tipo = (m.tipo && m.tipo[0]) || 'outro';
        if (!porTipo[tipo]) porTipo[tipo] = [];
        const elem = m.elemento?.length ? `, ${m.elemento.join('/')}` : '';
        const hab = m.habilidades && Array.isArray(m.habilidades) && m.habilidades.length > 0
          ? `, hab: ${m.habilidades.map(h => h.nome || h).join('/')}`
          : '';
        porTipo[tipo].push(`${m.nome} (nv${m.nivel_min}-${m.nivel_max}, HP${m.hp_base}, dano:${m.dano_base}${elem}${hab})`);
      }
      let text = '=== CATÁLOGO COMPLETO DE MONSTROS ===\n';
      text += `Total: ${monstros.length} monstros.\n\n`;
      for (const [tipo, lista] of Object.entries(porTipo).sort()) {
        text += `[${tipo}] ${lista.join(', ')}\n`;
      }
      sections.push(text);
    }

    // === EQUIPAMENTOS (todos) ===
    if (equipamentos.length > 0) {
      const porTipo = {};
      for (const e of equipamentos) {
        const tipo = (e.tipo && e.tipo[0]) || 'outro';
        if (!porTipo[tipo]) porTipo[tipo] = [];
        const elem = e.elemento?.length ? `, ${e.elemento.join('/')}` : '';
        const bonus = formatarBonus(e.bonus);
        const bonusStr = bonus ? `, ${bonus}` : '';
        const raridade = e.raridade_rel?.nome || '';
        const raridadeStr = raridade ? ` [${raridade}]` : '';
        porTipo[tipo].push(`${e.nome}${raridadeStr} (${e.dano_base || '-'}${elem}${bonusStr})`);
      }
      let text = '=== CATÁLOGO COMPLETO DE EQUIPAMENTOS ===\n';
      text += `Total: ${equipamentos.length} equipamentos.\n\n`;
      for (const [tipo, lista] of Object.entries(porTipo).sort()) {
        text += `[${tipo}] ${lista.join(', ')}\n`;
      }
      sections.push(text);
    }

    // === ELEMENTOS ===
    if (elementos.length > 0) {
      let text = '=== ELEMENTOS ===\n';
      text += elementos.map(e => `${e.nome} (${e.descricao || ''})`).join(', ');
      sections.push(text);
    }

    const catalogo = sections.join('\n\n');
    console.log(`📦 CatalogoCompleto: ${monstros.length} monstros, ${equipamentos.length} equipamentos, ${elementos.length} elementos (${catalogo.length} chars)`);
    return catalogo;
  } catch (error) {
    console.error('❌ CatalogoCompleto: Erro ao construir catálogo:', error.message);
    return '';
  }
}

export default buildCatalogo;
