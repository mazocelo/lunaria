/**
 * CooldownManager - Gerencia cooldowns de habilidades/magias por jogador
 *
 * Armazena em sessao.estadoJogo.cooldowns[userId][chave] = turnos_restantes
 * Chave: "hab_{id}" ou "mag_{id}"
 */

/**
 * Inicializa estrutura de cooldowns se não existir
 */
function ensureCooldowns(sessao, userId) {
  if (!sessao.estadoJogo) sessao.estadoJogo = {};
  if (!sessao.estadoJogo.cooldowns) sessao.estadoJogo.cooldowns = {};
  if (!sessao.estadoJogo.cooldowns[String(userId)]) sessao.estadoJogo.cooldowns[String(userId)] = {};
  return sessao.estadoJogo.cooldowns[String(userId)];
}

/**
 * Define cooldown para uma habilidade/magia
 * @param {string} tipo - "hab" ou "mag"
 * @param {number} id - ID da habilidade/magia
 * @param {number} turnos - Quantidade de turnos de cooldown
 */
export function setCooldown(sessao, userId, tipo, id, turnos) {
  const cds = ensureCooldowns(sessao, userId);
  const key = `${tipo}_${id}`;
  cds[key] = Math.max(0, turnos);
}

/**
 * Decrementa todos os cooldowns do jogador em 1 turno
 * Chamado no início de cada turno do jogador
 */
export function decrementCooldowns(sessao, userId) {
  const cds = ensureCooldowns(sessao, userId);
  for (const key of Object.keys(cds)) {
    if (cds[key] > 0) {
      cds[key]--;
    }
    if (cds[key] <= 0) {
      delete cds[key];
    }
  }
}

/**
 * Verifica se uma habilidade/magia está em cooldown
 * @returns {boolean} true se está em cooldown (não pode usar)
 */
export function checkCooldown(sessao, userId, tipo, id) {
  const cds = ensureCooldowns(sessao, userId);
  const key = `${tipo}_${id}`;
  return (cds[key] || 0) > 0;
}

/**
 * Retorna mapa de cooldowns ativos para o state block
 * @returns {Object} { "hab_15": 2, "mag_7": 1 }
 */
export function getCooldownsAtivos(sessao, userId) {
  return ensureCooldowns(sessao, userId);
}

export default { setCooldown, decrementCooldowns, checkCooldown, getCooldownsAtivos };
