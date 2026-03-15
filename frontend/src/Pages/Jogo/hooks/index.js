/**
 * Hooks legados do jogo.
 *
 * Status: dependencia interna dos phase models (lobby, active, character-select).
 * Consumidos em features/gameSession/phases/ — NAO sao legado a ser deletado.
 *
 * - useJogo: acoes de orquestracao complexa (iniciarJogo, retomarJogo, etc.)
 *            + error/loading acoplados. Sera desmembrado quando as acoes migrarem para o core.
 * - useJogoSocket: conexao WebSocket + listeners. Mesma regra de instancia.
 * - useJogoGuard: validacao de acesso. Internamente delega para resolvePhaseRedirect.
 *
 * Regra: acao + erro/loading SEMPRE do mesmo hook (nao misturar instancias).
 */
export { useJogoGuard } from './useJogoGuard';
export { useJogo } from './useJogo';
export { useJogoSocket } from './useJogoSocket';
