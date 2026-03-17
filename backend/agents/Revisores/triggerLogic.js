import { REVIEWER_CONFIG } from './config.js';
import { analyzeNarrativeHook } from '../../helpers/narrativeHookGuard.js';

/**
 * Determina se a revisão pós-IA deve ser acionada e quais revisores usar.
 *
 * @param {Object} ctx
 * @param {boolean}      ctx.combateAtivo
 * @param {Object|null}  ctx.resultadosCombatePreResolvido
 * @param {Object}       ctx.respostaIA          — resposta parseada do Mestre
 * @param {string}       ctx.acaoJogador
 * @param {Object}       ctx.sessao
 * @param {Array|null}   ctx.claimFlags           — futuro Part 2
 * @returns {{ needsReview: boolean, reviewers: string[], reasons: string[] }}
 */
export function shouldTriggerReview(ctx) {
  if (!REVIEWER_CONFIG.enabled) {
    return { needsReview: false, reviewers: [], reasons: [] };
  }

  const { combateAtivo, respostaIA, sessao, claimFlags } = ctx;
  const narrativa = respostaIA?.narracao || '';

  const reviewers = new Set();
  const reasons = [];
  const hookAnalysis = analyzeNarrativeHook({
    narrativa,
    respostaIA,
    combateAtivo,
    fimDeTurno: respostaIA?.fimDeTurno || respostaIA?.acaoCompleta
  });

  // Combate ativo com resultado mecanico → arbitro (nao revisar rodadas puramente narrativas)
  if (combateAtivo && ctx.resultadosCombatePreResolvido) {
    reviewers.add('arbitro');
    reasons.push('combate_com_mecanica');
  }

  // Início de combate → ambos
  if (respostaIA?.combate?.iniciado) {
    reviewers.add('arbitro');
    reviewers.add('continuista');
    reasons.push('combate_iniciado');
  }

  // Solicitação de teste → árbitro
  if (respostaIA?.solicitaDados?.solicita || respostaIA?.teste) {
    reviewers.add('arbitro');
    reasons.push('teste_solicitado');
  }

  // Ações mecânicas → árbitro
  if (respostaIA?.acoes?.length > 0) {
    reviewers.add('arbitro');
    reasons.push('acoes_mecanicas');
  }

  // Claim flags nao-ok → arbitro (continuista so se fato_previo)
  const claimsProblematicas = (claimFlags || []).filter(f => f.status !== 'ok');
  if (claimsProblematicas.length > 0) {
    reviewers.add('arbitro');
    if (claimsProblematicas.some(f => f.tipo === 'fato_previo')) {
      reviewers.add('continuista');
    }
    reasons.push('claims_detectadas');
  }

  // Continuista: verificar coerência quando há material narrativo relevante
  const temRoteiro = Boolean(
    sessao?.historiaRoteiro ||
    sessao?.mestreContexto?.historia?.roteiroCondensado
  );
  const npcsPresentes = sessao?.mestreContexto?.sessao?.npcsPresentes || [];
  const temNpcs = Array.isArray(npcsPresentes) && npcsPresentes.length > 0;
  const segmentos = narrativa.split(/\n\n+/).filter(Boolean);
  const narrativaMultiSegmento = segmentos.length > 3;

  if (temRoteiro || temNpcs || narrativaMultiSegmento) {
    reviewers.add('continuista');
    reasons.push('material_narrativo_relevante');
  }

  const respostaFinalizaBatida = Boolean(
    respostaIA?.fimDeTurno
    || respostaIA?.acaoCompleta
    || respostaIA?.solicitaDados?.solicita
    || respostaIA?.teste
  );
  if (!respostaFinalizaBatida && !hookAnalysis.hasActionableHook) {
    reviewers.add('gancho');
    reasons.push(hookAnalysis.reason || 'gancho_fraco');
  }

  // Remover continuista se não há material narrativo relevante nem combate
  if (reviewers.has('continuista') && !temRoteiro && !temNpcs && !narrativaMultiSegmento && !combateAtivo) {
    reviewers.delete('continuista');
  }

  if (reviewers.size === 0) {
    return { needsReview: false, reviewers: [], reasons: ['nenhum_trigger'], hookAnalysis };
  }

  return {
    needsReview: true,
    reviewers: [...reviewers],
    reasons,
    hookAnalysis,
  };
}
