/**
 * ownedActionsHelper — resolve as ações de combate de um personagem.
 *
 * Fonte de verdade: o VÍNCULO REAL (hm_personagem para Lunaria/D&D,
 * personagem_magia_tresdet para 3D&T), acessado via o contrato de engine
 * getMagiasConhecidas (§5 da spec do modelo híbrido H&M). O helper é uma fina
 * camada sobre as engines — não duplica query nem lê campos JSON soltos do
 * personagemCompleto.
 *
 * As vantagens ativáveis (técnicas/magias concedidas por vantagem) seguem vindo
 * do JSON do personagem: vantagens não têm vínculo próprio com o catálogo.
 *
 * getOwnedCombatActions / getOwnedCombatActionList são async porque a resolução
 * do vínculo consulta o banco via a engine.
 */
import { getEngine } from '../game-systems/index.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUses(item) {
  const value = item?.usar ?? item?.usos ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Identifica se uma ação é magia. Aceita os dois formatos que circulam aqui:
 * - MagiaConhecida da engine: discrimina por `tipo` ('magia' | 'tecnica');
 * - vantagem ativável (JSON do personagem): discrimina por `escola_magia`.
 */
function isSpellAction(item) {
  if (item?.tipo === 'magia') return true;
  if (item?.tipo === 'tecnica') return false;
  return Boolean(item?.escola_magia && item.escola_magia !== 'nenhuma');
}

/**
 * Deduplica ações por (categoria, id|nome). Mantida para as vantagens ativáveis,
 * que ainda podem repetir. As magias/habilidades vêm de UMA fonte (o vínculo) e
 * já não duplicam na origem.
 */
function dedupeActions(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.nome) return false;
    const key = `${isSpellAction(item) ? 'mag' : 'hab'}:${item?.id ?? item.nome}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getActivatableAdvantages(personagemCompleto = {}) {
  return dedupeActions(
    asArray(personagemCompleto.vantagens).filter((vantagem) => normalizeUses(vantagem) >= 1)
  );
}

/**
 * Resolve as ações de combate que o personagem REALMENTE possui.
 * - habilidades/magias: vínculo real, via getEngine(sistema).getMagiasConhecidas;
 * - vantagensAtivaveis: vantagens com usos >= 1 (JSON do personagem).
 *
 * @param {Object} personagem - personagem com id e sistema (Lunaria/D&D/3D&T)
 * @param {Object} db - acessor de Models (Model/index.js)
 * @returns {Promise<{habilidades: Array, magias: Array, vantagensAtivaveis: Array}>}
 */
export async function getOwnedCombatActions(personagem = {}, db) {
  const vantagensAtivaveis = getActivatableAdvantages(personagem);

  let conhecidas = [];
  if (personagem?.id && db) {
    const sistema = personagem.sistema || 'lunaria';
    conhecidas = await getEngine(sistema).getMagiasConhecidas(personagem, db);
  }

  return {
    habilidades: [
      ...conhecidas.filter((item) => !isSpellAction(item)),
      ...vantagensAtivaveis.filter((item) => !isSpellAction(item)),
    ],
    magias: [
      ...conhecidas.filter((item) => isSpellAction(item)),
      ...vantagensAtivaveis.filter((item) => isSpellAction(item)),
    ],
    vantagensAtivaveis,
  };
}

/**
 * Lista única (habilidades + magias) das ações de combate do personagem.
 * @param {Object} personagem
 * @param {Object} db - acessor de Models
 * @returns {Promise<Array>}
 */
export async function getOwnedCombatActionList(personagem = {}, db) {
  const loadout = await getOwnedCombatActions(personagem, db);
  return [...loadout.habilidades, ...loadout.magias];
}

export { isSpellAction, dedupeActions };

export default {
  getActivatableAdvantages,
  getOwnedCombatActions,
  getOwnedCombatActionList,
  isSpellAction,
  dedupeActions,
};
