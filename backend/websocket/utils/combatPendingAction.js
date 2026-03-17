/**
 * Combat Pending Action lifecycle — centraliza criação, leitura,
 * resolução e limpeza de sessao.estadoJogo.acaoPendenteCombate.
 */
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'combatPendingAction' });

import {
  limparTestePendente,
  compactarTestesPendentes
} from './testePipeline.js';
import { TURN_STATUS } from './turnStateMachine.js';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Cria e armazena ação pendente de combate na sessão.
 * @param {object} sessao
 * @param {{ tipo: string, userId: string, personagem: object, combatIntent: object, testeId?: string, statusEfeitos?: Array, [key: string]: any }} params
 */
export function createPendingCombatAction(sessao, { tipo, userId, personagem, combatIntent, testeId, statusEfeitos, ...extra }) {
  const estadoJogo = sessao.estadoJogo || {};
  sessao.estadoJogo = estadoJogo;

  estadoJogo.acaoPendenteCombate = {
    tipo,
    userId,
    personagem,
    combatIntent,
    testeId: testeId ?? null,
    statusEfeitos: statusEfeitos || [],
    criadoEm: new Date().toISOString(),
    ...extra
  };

  log.info({ userId, tipo, testeId }, 'Ação pendente de combate criada');
  return estadoJogo.acaoPendenteCombate;
}

/**
 * Retorna a ação pendente ou null.
 */
export function getPendingCombatAction(sessao) {
  return sessao?.estadoJogo?.acaoPendenteCombate ?? null;
}

/**
 * Retorna true se existe ação pendente.
 */
export function hasPendingCombatAction(sessao) {
  return !!sessao?.estadoJogo?.acaoPendenteCombate;
}

/**
 * Resolve a ação pendente se testeId bate com o teste resolvido.
 * Retorna a ação removida ou null.
 */
export function resolvePendingCombatAction(sessao, testeResolvido) {
  const acaoPendente = getPendingCombatAction(sessao);
  if (!acaoPendente) return null;
  if (acaoPendente.testeId !== testeResolvido?.id) return null;

  const resolved = { ...acaoPendente };
  delete sessao.estadoJogo.acaoPendenteCombate;
  log.info({ userId: resolved.userId, tipo: resolved.tipo, testeId: resolved.testeId }, 'Ação pendente de combate resolvida');
  return resolved;
}

/**
 * Limpa ação pendente stale (>5min).
 * Cancela teste pendente associado e destrava turno.
 * @returns {boolean} true se limpou algo
 */
export function cleanupStalePendingCombatAction(sessao) {
  const acaoPendente = getPendingCombatAction(sessao);
  if (!acaoPendente) return false;

  const criadoEm = new Date(acaoPendente.criadoEm).getTime();
  if (Date.now() - criadoEm <= STALE_THRESHOLD_MS) return false;

  log.warn({ userId: acaoPendente.userId, tipo: acaoPendente.tipo, testeId: acaoPendente.testeId }, 'Ação pendente de combate stale (>5min), limpando');

  if (acaoPendente.testeId) {
    limparTestePendente(sessao, {
      testId: acaoPendente.testeId,
      nextTurnState: TURN_STATUS.ACTIVE,
      mode: 'cancel'
    });
    compactarTestesPendentes(sessao);
  }

  delete sessao.estadoJogo.acaoPendenteCombate;
  return true;
}

/**
 * Deleção direta da ação pendente (sem cleanup de teste).
 */
export function clearPendingCombatAction(sessao) {
  if (sessao?.estadoJogo?.acaoPendenteCombate) {
    delete sessao.estadoJogo.acaoPendenteCombate;
  }
}
