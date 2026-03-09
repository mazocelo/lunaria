/**
 * Feature Flags - sistema simples baseado em env vars
 *
 * Uso:
 *   import { isEnabled, flags } from '../config/featureFlags.js';
 *   if (isEnabled('COMBAT_V2')) { ... }
 *
 * Para ativar/desativar, defina env vars:
 *   FF_COMBAT_V2=true
 *   FF_LOOT_SYSTEM=false
 */

const defaults = {
  COMBAT_V2: false,       // Sistema de combate v2 (futuro)
  LOOT_SYSTEM: true,      // Drop de loot pos-combate
  FRIEND_SYSTEM: true,    // Sistema de amizades
  AI_RETRY: true,         // Retry automatico em timeout da IA
  SESSION_RECAP: true,    // Recap ao encerrar sessao
  LEVEL_UP_NOTIFY: true,  // Notificacao de level up em tempo real
};

function parseFlag(envValue, defaultValue) {
  if (envValue === undefined || envValue === null) return defaultValue;
  return envValue === 'true' || envValue === '1';
}

const flags = {};
for (const [key, defaultValue] of Object.entries(defaults)) {
  flags[key] = parseFlag(process.env[`FF_${key}`], defaultValue);
}

export function isEnabled(flag) {
  if (!(flag in flags)) {
    console.warn(`Feature flag desconhecida: ${flag}`);
    return false;
  }
  return flags[flag];
}

export { flags };
export default { isEnabled, flags };
