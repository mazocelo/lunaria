import { shouldTriggerReview } from './triggerLogic.js';
import { ArbitroMecanico } from './ArbitroMecanico.js';
import { Continuista } from './Continuista.js';
import { GanchoNarrativo } from './GanchoNarrativo.js';
import { REVIEWER_CONFIG } from './config.js';
import { applyFallbackHook } from '../../helpers/narrativeHookGuard.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'ReviewOrchestrator' });

// Cache de instâncias (reutilizar entre chamadas)
let _arbitro = null;
let _continuista = null;
let _gancho = null;

function getArbitro() {
  if (!_arbitro) _arbitro = new ArbitroMecanico();
  return _arbitro;
}

function getContinuista() {
  if (!_continuista) _continuista = new Continuista();
  return _continuista;
}

function getGancho() {
  if (!_gancho) _gancho = new GanchoNarrativo();
  return _gancho;
}

/**
 * Extrai dados de contexto da sessão para o Continuista.
 */
function extrairContextoContinuidade(sessao) {
  const ctx = sessao?.mestreContexto?.sessao || sessao?.estadoJogo?.mestreContexto?.sessao || {};

  const memoriaSemantica = Array.isArray(ctx.memoriaSemantica)
    ? ctx.memoriaSemantica
    : [];

  const roteiroCondensado = sessao?.mestreContexto?.historia?.roteiroCondensado
    || sessao?.historiaRoteiro?.resumo
    || null;

  const npcsPresentes = Array.isArray(ctx.npcsPresentes)
    ? ctx.npcsPresentes
    : [];

  // Últimas 5 mensagens do mestre no histórico
  const mensagens = sessao?.mensagens || [];
  const historicoRecente = mensagens
    .filter(m => m.tipo === 'mestre' || m.canal === 'mestre')
    .slice(-5);

  return { memoriaSemantica, roteiroCondensado, npcsPresentes, historicoRecente };
}

/**
 * Extrai snapshot do personagem ativo para o Árbitro.
 */
function extrairPersonagemSnapshot(sessao, userId) {
  const estadoJogo = sessao?.estadoJogo || {};

  // Encontrar personagem completo
  const personagensCompletos = sessao?.personagensCompletos || {};
  const jogador = sessao?.jogadores?.[userId];
  const pcId = jogador?.personagemId || jogador?.personagem_id;

  let personagem = null;
  if (pcId && personagensCompletos[pcId]) {
    personagem = personagensCompletos[pcId];
  } else {
    // Fallback: primeiro personagem encontrado do jogador
    const entries = Object.values(personagensCompletos);
    personagem = entries.find(p => String(p.userId || p.user_id) === String(userId)) || entries[0];
  }

  if (!personagem) return null;

  // Merge com estado runtime (HP, mana atuais)
  const runtime = estadoJogo.personagemSessao?.[userId] || {};
  return {
    nome: personagem.nome,
    nivel: personagem.nivel,
    hp_atual: runtime.hp_atual ?? personagem.hp_atual,
    hp_max: runtime.hp_max ?? personagem.hp_max,
    mana_atual: runtime.mana_atual ?? personagem.mana_atual,
    mana_max: runtime.mana_max ?? personagem.mana_max,
    inventario: personagem.inventario || personagem.equipamentos || [],
    habilidadesClasse: personagem.habilidadesClasse || [],
    magias: personagem.magias || [],
  };
}

/**
 * Aplica correções leves baseadas nos veredictos.
 * v1: apenas append de nota ou strip simples. Nunca re-narra.
 */
function aplicarCorrecoes(narrativa, verdicts, { combateAtivo = false, hookAnalysis = null } = {}) {
  let corrected = narrativa;
  let applied = false;

  for (const v of verdicts) {
    if (v.severidade !== 'error') continue;

    if (v.veredicto === 'faltou_resultado' && v.correcao_sugerida) {
      // Append informação mecânica faltante
      corrected += `\n\n*[${v.correcao_sugerida}]*`;
      applied = true;
    }
    // Para outros erros graves, apenas loga — não modifica narrativa em v1
  }

  const hookVerdict = verdicts.find(v => v.reviewer === 'gancho' && v.veredicto !== 'ok');
  if (hookVerdict) {
    if (hookVerdict.correcao_sugerida) {
      corrected = hookVerdict.correcao_sugerida;
      applied = true;
    } else {
      corrected = applyFallbackHook(corrected, {
        combateAtivo,
        shouldSuggest: hookAnalysis?.shouldSuggest || false
      });
      applied = true;
    }
  }

  return applied ? { narrativa: corrected } : null;
}

/**
 * Ponto de entrada principal. Executa revisão pós-IA se necessário.
 *
 * @param {Object} ctx
 * @param {boolean}     ctx.combateAtivo
 * @param {Object|null} ctx.resultadosCombatePreResolvido
 * @param {Object}      ctx.respostaIA
 * @param {string}      ctx.acaoJogador
 * @param {Object}      ctx.sessao
 * @param {string}      ctx.userId
 * @param {Array|null}  ctx.claimFlags
 * @returns {Promise<{ reviewed: boolean, passed: boolean, verdicts: Object[]|null, corrections: Object|null }>}
 */
export async function executarRevisao(ctx) {
  const { respostaIA, sessao } = ctx;

  // Feature flag check
  if (!REVIEWER_CONFIG.enabled) {
    return { reviewed: false, passed: true, verdicts: null, corrections: null };
  }

  const trigger = shouldTriggerReview(ctx);
  if (!trigger.needsReview) {
    log.debug({ reasons: trigger.reasons }, 'Revisao pulada');
    return { reviewed: false, passed: true, verdicts: null, corrections: null };
  }

  log.info({ reviewers: trigger.reviewers, reasons: trigger.reasons }, 'Iniciando revisao pos-IA');

  const narrativa = respostaIA?.narracao || '';
  const promises = [];
  const labels = [];

  // Preparar Árbitro
  if (trigger.reviewers.includes('arbitro')) {
    const personagem = extrairPersonagemSnapshot(sessao, ctx.userId);
    promises.push(
      getArbitro().validar({
        narrativa,
        resultadoMecanico: ctx.resultadosCombatePreResolvido,
        personagem,
        acaoJogador: ctx.acaoJogador,
        claimFlags: ctx.claimFlags || [],
        userId: ctx.userId,
      })
    );
    labels.push('arbitro');
  }

  // Preparar Continuista
  if (trigger.reviewers.includes('continuista')) {
    const contCtx = extrairContextoContinuidade(sessao);
    promises.push(
      getContinuista().validar({
        narrativa,
        ...contCtx,
        userId: ctx.userId,
      })
    );
    labels.push('continuista');
  }

  if (trigger.reviewers.includes('gancho')) {
    promises.push(
      getGancho().validar({
        narrativa,
        shouldSuggest: trigger.hookAnalysis?.shouldSuggest || false,
        combateAtivo: ctx.combateAtivo,
        userId: ctx.userId,
      })
    );
    labels.push('gancho');
  }

  // Executar em paralelo
  const results = await Promise.allSettled(promises);

  const verdicts = results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return { reviewer: labels[i], ...r.value };
    }
    log.warn({ reviewer: labels[i], err: r.reason?.message }, 'Revisor falhou (fail-open)');
    return { reviewer: labels[i], veredicto: 'ok', severidade: 'info', notas: 'falha no revisor' };
  });

  const hasIssues = verdicts.some(v => v.veredicto !== 'ok');

  const corrections = hasIssues
    ? aplicarCorrecoes(narrativa, verdicts, {
        combateAtivo: ctx.combateAtivo,
        hookAnalysis: trigger.hookAnalysis
      })
    : null;

  log.info({
    passed: !hasIssues,
    verdicts: verdicts.map(v => ({ reviewer: v.reviewer, veredicto: v.veredicto, severidade: v.severidade })),
    corrected: !!corrections,
  }, 'Revisao concluida');

  return {
    reviewed: true,
    passed: !hasIssues,
    verdicts,
    corrections,
  };
}
