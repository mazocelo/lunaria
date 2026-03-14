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
