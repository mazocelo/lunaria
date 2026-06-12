import logger from './logger.js';
import { getAvailableSystems } from '../game-systems/index.js';

const log = logger.child({ module: 'sistemaHelper' });

const SISTEMA_PADRAO = 'lunaria';

/**
 * Resolve o sistema de jogo a partir de varias fontes possiveis, em ordem de
 * prioridade. Retorna a primeira fonte que seja um sistema valido (registrado no
 * registry de engines). Se nenhuma for valida, loga um `warn` e cai no fallback
 * `'lunaria'` — substituindo os antigos defaults silenciosos `|| 'lunaria'`.
 *
 * @param {...(string|undefined|null)} fontes - candidatos a sistema, do mais ao
 *   menos prioritario (ex.: `resolverSistema(combate?.sistema, sessao?.sistema)`)
 * @returns {string} um sistema valido
 */
export function resolverSistema(...fontes) {
  const disponiveis = getAvailableSystems();
  for (const fonte of fontes) {
    if (fonte && disponiveis.includes(fonte)) return fonte;
  }
  log.warn(
    { fontes, disponiveis },
    `resolverSistema: nenhum sistema valido informado, usando fallback '${SISTEMA_PADRAO}'`
  );
  return SISTEMA_PADRAO;
}

export default { resolverSistema };
