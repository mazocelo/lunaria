/**
 * Factory para o DTO interno de resultado de rodada de combate.
 * Shape canonico consumido por:
 *   - masterNarrationEngine.js (orquestrador)
 *   - combatEngine.js (persistencia via _combatePreResolvido)
 *   - combatEventEmitter.js (emissao de eventos websocket)
 *
 * Campos novos devem ser aditivos — nao remover nem renomear existentes.
 */

/**
 * @param {Partial<CombatRoundResult>} [overrides]
 * @returns {CombatRoundResult}
 */
export function createCombatRoundResult(overrides = {}) {
  return {
    intentTipo: null,
    acaoConsumida: false,
    statusEfeitos: [],
    ataqueJogador: null,
    defesa: null,
    fuga: null,
    habilidade: null,
    contraAtaques: [],
    rodadaAvancou: false,
    combateFinalizado: false,
    resultadoCombate: null,
    statusRemovidos: [],
    statusEfeitosMonstro: [],
    jogadorDerrotado: false,
    requerTeste: null,
    ...overrides,
  };
}
