import db from '../Model/index.js';
import logger from './logger.js';
const log = logger.child({ module: 'temasHelper' });

/**
 * Busca temas completos (id e nome) a partir de um array de IDs
 * @param {number[]} temasIds - Array de IDs dos temas
 * @returns {Promise<Array<{id: number, nome: string}>>} Array de objetos com id e nome dos temas
 */
export async function buscarTemasCompletos(temasIds) {
  if (!Array.isArray(temasIds) || temasIds.length === 0) {
    return [];
  }
  
  try {
    const temas = await Promise.all(
      temasIds.map(id => db.Temas.findById(id))
    );
    
    // Filtrar temas nulos (IDs inválidos) e mapear para objeto simplificado
    return temas
      .filter(Boolean)
      .map(t => ({ id: t.id, nome: t.nome }));
  } catch (error) {
    log.error({ err: error }, 'Erro ao buscar temas completos');
    return [];
  }
}

/**
 * Extrai apenas os nomes dos temas de um array de objetos tema
 * @param {Array<{id: number, nome: string} | string | number>} temasCompletos - Array de temas completos, strings ou IDs
 * @returns {string[]} Array com apenas os nomes dos temas
 */
export function extrairNomesTemas(temasCompletos) {
  if (!Array.isArray(temasCompletos)) {
    return [];
  }
  
  return temasCompletos
    .map(t => {
      // Se for objeto com propriedade nome
      if (typeof t === 'object' && t !== null && t.nome) {
        return t.nome;
      }
      // Se já for string, retorna como está
      if (typeof t === 'string') {
        return t;
      }
      // Se for número (ID), retorna null (será filtrado)
      // IDs não podem ser convertidos sem consulta ao banco
      if (typeof t === 'number') {
        log.warn({ temaId: t }, 'extrairNomesTemas: Recebido ID numerico, nao e possivel converter sem consulta ao banco');
        return null;
      }
      // Qualquer outro tipo, tenta converter para string
      return String(t);
    })
    .filter(Boolean); // Remove nulls, undefined e strings vazias
}

export default {
  buscarTemasCompletos,
  extrairNomesTemas
};

