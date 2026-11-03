/**
 * Helpers para gerenciamento de turnos no RPG
 */

/**
 * Detecta se o Mestre sinalizou fim de turno na narrativa
 * @param {string} narrativa - Texto da narrativa do Mestre
 * @returns {boolean} - True se sinalizou fim
 */
export function detectarFimDeTurno(narrativa) {
  if (!narrativa) return false;

  const palavrasChave = [
    /próximo jogador/i,
    /fim (?:de|do) turno/i,
    /turno (?:completo|finalizado|encerrado)/i,
    /passa(?:ndo)? a vez/i,
    /agora é a vez de/i,
    /turno de \[.*?\] termina/i
  ];

  return palavrasChave.some(regex => regex.test(narrativa));
}

/**
 * Valida se mensagem deve contar no contador de turno
 * @param {string} tipo - Tipo da mensagem
 * @returns {boolean} - True se deve contar
 */
export function deveContarNoTurno(tipo) {
  // Rolagens, loading, sistema NÃO contam
  const tiposIgnorados = ['dado', 'dice_roll', 'loading', 'sistema', 'roleplay'];
  return !tiposIgnorados.includes(tipo);
}

export default {
  detectarFimDeTurno,
  deveContarNoTurno
};

