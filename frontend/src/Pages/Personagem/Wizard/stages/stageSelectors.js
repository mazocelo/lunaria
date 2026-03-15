/**
 * stageSelectors.js — Funcoes puras de leitura do estado do wizard
 *
 * Nenhuma dessas funcoes causa side effects. Recebem buildState e retornam dados derivados.
 */
import { STAGES, getStageConfig } from './stageConfig.js';

/**
 * Checa se uma etapa esta concluida.
 * @param {string} stageId
 * @param {Object} buildState - { nome, racaId, classeId, background, vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens, bonusAplicados }
 * @returns {boolean}
 */
export function isStageDone(stageId, buildState) {
  switch (stageId) {
    case 'boas_vindas': return !!buildState.nome?.trim();
    case 'raca': return !!buildState.racaId;
    case 'classe': return !!buildState.classeId;
    case 'background': return !!buildState.background?.trim();
    case 'desvantagens': return buildState.desvantagensIds?.length > 0 || !!buildState.skipDesvantagens;
    case 'vantagens': return buildState.vantagensIds?.length > 0 || !!buildState.skipVantagens;
    case 'atributos': return !!buildState.bonusAplicados;
    case 'resumo': return false;
    default: return false;
  }
}

/**
 * Checa se uma etapa foi pulada.
 */
export function isStageSkipped(stageId, buildState) {
  if (stageId === 'vantagens') return !!buildState.skipVantagens;
  if (stageId === 'desvantagens') return !!buildState.skipDesvantagens;
  return false;
}

/**
 * Retorna tooltip contextual de uma etapa.
 */
export function getStageTooltip(stageId, buildState) {
  const { nome, racaAtual, classeAtual, background, vantagensIds, desvantagensIds,
          skipVantagens, skipDesvantagens, bonusAplicados, bonusInvalidado, podeCriar } = buildState;

  switch (stageId) {
    case 'boas_vindas': return nome?.trim() || 'Nome pendente';
    case 'raca': return racaAtual?.nome || 'Linhagem pendente';
    case 'classe': return classeAtual?.nome || 'Vocacao pendente';
    case 'background': return background?.trim() ? 'Origem definida' : 'Origem pendente';
    case 'desvantagens':
      if (desvantagensIds?.length > 0) return `${desvantagensIds.length} marcas fixadas`;
      if (skipDesvantagens) return 'Etapa pulada';
      return 'Marcas pendentes';
    case 'vantagens':
      if (vantagensIds?.length > 0) return `${vantagensIds.length} dons fixados`;
      if (skipVantagens) return 'Etapa pulada';
      return 'Dons pendentes';
    case 'atributos':
      if (bonusAplicados) return 'Calibrados e confirmados';
      if (bonusInvalidado) return 'Revisao necessaria';
      return 'Leitura pendente';
    case 'resumo': return podeCriar ? 'Resolutiva pronta para selar' : 'Resolutiva em preparo';
    default: return '';
  }
}

/**
 * Retorna lista de items de progresso para a sidebar.
 */
export function getProgressItems(buildState) {
  return STAGES
    .filter((s) => s.progressLabel)
    .map((s) => ({
      label: s.progressLabel,
      done: isStageDone(s.id, buildState),
      skipped: isStageSkipped(s.id, buildState),
    }));
}

/**
 * Retorna tooltipMap completo para todas as etapas.
 */
export function getTooltipMap(buildState) {
  const map = {};
  for (const s of STAGES) {
    map[s.id] = getStageTooltip(s.id, buildState);
  }
  return map;
}

/**
 * Retorna readiness state global do wizard.
 */
export function getReadinessState(buildState) {
  const { nome, racaId, classeId, bonusInvalidado } = buildState;
  if (!nome?.trim() || !racaId || !classeId) return 'open';
  if (getPendingCount(buildState) > 0 || bonusInvalidado) return 'shaping';
  return 'sealed';
}

/**
 * Conta itens pendentes obrigatorios + opcionais.
 */
export function getPendingCount(buildState) {
  const { nome, racaId, classeId, background, bonusAplicados,
          vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens,
          orcamentoCriacaoValido } = buildState;

  const obrigatorios = [
    !nome?.trim(),
    !racaId,
    !classeId,
    !background?.trim(),
    !bonusAplicados,
    orcamentoCriacaoValido === false,
  ].filter(Boolean).length;

  const opcionais = Number(vantagensIds?.length === 0 && !skipVantagens)
    + Number(desvantagensIds?.length === 0 && !skipDesvantagens);

  return obrigatorios + opcionais;
}

/**
 * Checa se o personagem pode ser criado.
 */
export function canCreate(buildState) {
  const { nome, racaId, classeId, background, bonusAplicados, pontosCriacaoRestantes } = buildState;
  return !!(
    nome?.trim()
    && racaId
    && classeId
    && background?.trim()
    && bonusAplicados
    && (pontosCriacaoRestantes ?? 0) >= 0
  );
}

/**
 * Retorna label de continue contextual para a etapa.
 */
export function getContinueLabel(stageId) {
  const config = getStageConfig(stageId);
  return config.continueLabel || 'Continuar';
}

/**
 * Checa se continue esta disponivel na etapa com base no buildState.
 */
export function canContinueStage(stageId, buildState) {
  if (stageId === 'desvantagens') {
    return buildState.desvantagensIds?.length > 0 || !!buildState.skipDesvantagens;
  }
  if (stageId === 'vantagens') {
    return buildState.vantagensIds?.length > 0 || !!buildState.skipVantagens;
  }
  if (stageId === 'atributos') {
    return !!buildState.bonusAplicados;
  }
  return false;
}
