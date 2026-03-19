// agents/Revisores/index.js
/**
 * Public API for the review system.
 * Phase 3: Unified reviewer replaces 3 separate reviewers.
 */
import { revisarNarrativa } from './unifiedReviewer.js';
import { REVIEWER_CONFIG } from './config.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'Revisores' });

/**
 * Skip conditions: feature flag off or no narrative to review.
 */
function shouldSkipReview(ctx) {
  if (!REVIEWER_CONFIG.enabled) return true;
  if (!ctx.respostaIA?.narracao?.trim()) return true;
  return false;
}

/**
 * Convert unified result to legacy shape consumed by masterNarrationEngine.
 */
function unifiedToLegacy(result) {
  if (!result) return { reviewed: false, passed: true, verdicts: null, corrections: null };

  const verdicts = ['mecanica', 'continuidade', 'gancho'].map(key => ({
    reviewer: key,
    veredicto: result[key]?.ok ? 'ok' : 'problema',
    severidade: result[key]?.ok ? 'info' : 'error',
    notas: result[key]?.problema || '',
  }));

  return {
    reviewed: true,
    passed: result.aprovado,
    verdicts,
    corrections: result.correcao ? { narrativa: result.correcao } : null,
  };
}

/**
 * Extract context from session for the reviewer.
 * Preserves logic from old reviewOrchestrator (extrairPersonagemSnapshot + extrairContextoContinuidade).
 */
function extractReviewContext(ctx) {
  const sessao = ctx.sessao || {};
  const estadoJogo = sessao.estadoJogo || {};

  // Personagem snapshot (from old extrairPersonagemSnapshot)
  const completos = sessao.personagensCompletos || {};
  const jogador = sessao.jogadores?.[ctx.userId];
  const pcId = jogador?.personagemId || jogador?.personagem_id;
  let personagem = pcId ? completos[pcId] : null;
  if (!personagem) {
    personagem = Object.values(completos).find(p => String(p.userId || p.user_id) === String(ctx.userId)) || Object.values(completos)[0] || null;
  }
  const runtime = estadoJogo.personagemSessao?.[ctx.userId] || {};
  const personagemSnapshot = personagem ? {
    nome: personagem.nome,
    nivel: personagem.nivel,
    hp_atual: runtime.hp_atual ?? personagem.hp_atual,
    hp_max: runtime.hp_max ?? personagem.hp_max,
    mana_atual: runtime.mana_atual ?? personagem.mana_atual,
    mana_max: runtime.mana_max ?? personagem.mana_max,
    inventario: personagem.inventario || personagem.equipamentos || [],
    habilidadesClasse: personagem.habilidadesClasse || [],
    magias: personagem.magias || [],
  } : null;

  // Continuity context (from old extrairContextoContinuidade)
  const mestreCtx = sessao.mestreContexto?.sessao || estadoJogo.mestreContexto?.sessao || {};
  const memoriaSemantica = Array.isArray(mestreCtx.memoriaSemantica) ? mestreCtx.memoriaSemantica : [];
  const roteiroCondensado = sessao.mestreContexto?.historia?.roteiroCondensado || sessao.historiaRoteiro?.resumo || null;
  const npcsPresentes = Array.isArray(mestreCtx.npcsPresentes) ? mestreCtx.npcsPresentes : [];
  const mensagens = sessao.mensagens || [];
  const historicoRecente = mensagens.filter(m => m.tipo === 'mestre' || m.canal === 'mestre').slice(-5);

  return { personagemSnapshot, memoriaSemantica, roteiroCondensado, npcsPresentes, historicoRecente };
}

/**
 * Main review entry point — preserved public API.
 *
 * @param {Object} ctx - { combateAtivo, resultadosCombatePreResolvido, respostaIA, acaoJogador, sessao, userId, claimFlags }
 * @returns {Promise<{ reviewed, passed, verdicts, corrections }>}
 */
export async function executarRevisao(ctx) {
  if (shouldSkipReview(ctx)) {
    return { reviewed: false, passed: true, verdicts: null, corrections: null };
  }

  try {
    const { personagemSnapshot, memoriaSemantica, roteiroCondensado, npcsPresentes, historicoRecente } = extractReviewContext(ctx);

    const result = await revisarNarrativa({
      narrativa: ctx.respostaIA?.narracao || '',
      acaoJogador: ctx.acaoJogador || '',
      resultadoMecanico: ctx.resultadosCombatePreResolvido || null,
      personagemSnapshot,
      historicoRecente,
      npcsPresentes,
      memoriaSemantica,
      roteiroCondensado,
      claimFlags: ctx.claimFlags || [],
      combateAtivo: ctx.combateAtivo || false,
      userId: ctx.userId,
    });

    // Handle: approved=false but no correction → pass-through with warning
    if (!result.aprovado && !result.correcao) {
      log.warn({
        mecanica: result.mecanica,
        continuidade: result.continuidade,
        gancho: result.gancho,
      }, 'Review failed but no correction provided — passing through');
    }

    return unifiedToLegacy(result);
  } catch (err) {
    log.warn({ err: err.message }, 'executarRevisao failed (fail-open)');
    return { reviewed: false, passed: true, verdicts: null, corrections: null };
  }
}

export { REVIEWER_CONFIG };
