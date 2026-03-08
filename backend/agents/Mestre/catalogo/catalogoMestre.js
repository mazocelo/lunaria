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

/**
 * Constrói catálogo completo para o prompt do Mestre
 * @returns {string} Texto formatado do catálogo
 */
export async function buildCatalogo() {
  try {
    const [monstros, equipamentos, elementos] = await Promise.all([
      db.Monstro.findAll(),
      db.Equipamento.findAll(),
      db.Elemento.findAll()
    ]);

    const sections = [];

    // === MONSTROS ===
    if (monstros.length > 0) {
      // Agrupar por primeiro tipo
      const porTipo = {};
      for (const m of monstros) {
        const tipo = (m.tipo && m.tipo[0]) || 'outro';
        if (!porTipo[tipo]) porTipo[tipo] = [];
        const elem = m.elemento?.length ? `, ${m.elemento.join('/')}` : '';
        porTipo[tipo].push(`${m.nome} (nv${m.nivel_min}-${m.nivel_max}${elem})`);
      }

      let monstrosText = '=== CATÁLOGO DE MONSTROS ===\n';
      monstrosText += `Total: ${monstros.length} monstros disponíveis.\n`;
      monstrosText += 'Use nomes EXATOS ao iniciar combate.\n\n';
      for (const [tipo, lista] of Object.entries(porTipo).sort()) {
        monstrosText += `[${tipo}] ${lista.join(', ')}\n`;
      }
      sections.push(monstrosText);
    }

    // === EQUIPAMENTOS ===
    if (equipamentos.length > 0) {
      // Agrupar por primeiro tipo
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

    const catalogo = sections.join('\n\n');
    console.log(`📦 CatalogoMestre: ${monstros.length} monstros, ${equipamentos.length} equipamentos, ${elementos.length} elementos`);
    return catalogo;
  } catch (error) {
    console.error('❌ CatalogoMestre: Erro ao construir catálogo:', error.message);
    return '';
  }
}

export default buildCatalogo;
