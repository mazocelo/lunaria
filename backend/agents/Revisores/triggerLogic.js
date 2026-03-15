import { REVIEWER_CONFIG } from './config.js';

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

  // Skip: narrativa trivial
  if (narrativa.length < 100) {
    return { needsReview: false, reviewers: [], reasons: ['narrativa_curta'] };
  }

  const reviewers = new Set();
  const reasons = [];

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

  // Narrativa longa com roteiro → continuista
  const temRoteiro = Boolean(
    sessao?.historiaRoteiro ||
    sessao?.mestreContexto?.historia?.roteiroCondensado
  );
  if (narrativa.length > 800 && temRoteiro) {
    reviewers.add('continuista');
    reasons.push('narrativa_longa_com_roteiro');
  }

  // Remover continuista se não há roteiro nem combate
  if (reviewers.has('continuista') && !temRoteiro && !combateAtivo) {
    reviewers.delete('continuista');
  }

  if (reviewers.size === 0) {
    return { needsReview: false, reviewers: [], reasons: ['nenhum_trigger'] };
  }

  return {
    needsReview: true,
    reviewers: [...reviewers],
    reasons,
  };
}
