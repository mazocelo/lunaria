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
  const sceneContext = {
    npcsPresentes: sessao?.mestreContexto?.sessao?.npcsPresentes || sessao?.estadoJogo?.npcs || [],
    cenaAtual: sessao?.estadoJogo?.cenaAtual || sessao?.mestreContexto?.sessao?.cenaAtual || null,
    ameacas: sessao?.estadoJogo?.ameacas || [],
  };
  const hookAnalysis = analyzeNarrativeHook({
    narrativa,
    respostaIA,
    combateAtivo,
    fimDeTurno: respostaIA?.fimDeTurno || respostaIA?.acaoCompleta,
    sceneContext
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

  // Continuista: trigger apenas em combate iniciado ou roteiro+NPC mencionado na narrativa
  const combateIniciado = Boolean(respostaIA?.combate?.iniciado);
  const temRoteiro = Boolean(
    sessao?.historiaRoteiro ||
    sessao?.mestreContexto?.historia?.roteiroCondensado
  );
  const npcsPresentes = sessao?.mestreContexto?.sessao?.npcsPresentes || [];
  const npcNomes = (Array.isArray(npcsPresentes) ? npcsPresentes : [])
    .map(npc => typeof npc === 'string' ? npc : npc?.nome)
    .filter(Boolean);
  const narrativaMencionaNpc = npcNomes.length > 0 && npcNomes.some(nome => {
    const escaped = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i').test(narrativa);
  });

  if (combateIniciado) {
    reviewers.add('continuista');
    reasons.push('combate_iniciado_continuista');
  } else if (temRoteiro && narrativaMencionaNpc) {
    reviewers.add('continuista');
    reasons.push('roteiro_com_npc_mencionado');
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

  // Remover continuista se não há roteiro+NPC nem combate
  if (reviewers.has('continuista') && !combateIniciado && !(temRoteiro && narrativaMencionaNpc) && !combateAtivo) {
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
