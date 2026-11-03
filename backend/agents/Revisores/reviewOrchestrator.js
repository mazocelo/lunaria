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

// Circuit breaker state (in-memory, resets on restart)
const _circuitState = {
  arbitro: { failures: 0, openUntil: 0 },
  continuista: { failures: 0, openUntil: 0 },
  gancho: { failures: 0, openUntil: 0 },
};
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000;

function isCircuitOpen(name) {
  return Date.now() < _circuitState[name].openUntil;
}

function recordSuccess(name) {
  _circuitState[name].failures = 0;
  _circuitState[name].openUntil = 0;
}

function recordFailure(name) {
  const state = _circuitState[name];
  state.failures += 1;
  if (state.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    state.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    log.error({ reviewer: name, failures: state.failures, cooldownMs: CIRCUIT_COOLDOWN_MS }, 'CIRCUIT_OPEN — reviewer disabled temporarily');
  }
}

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
 * Aplica correções baseadas nos veredictos dos revisores.
 * Árbitro/Continuista: apenas logam warnings (correção mecânica é do claim detector).
 * Gancho: substitui narrativa se gancho_fraco.
 */
function aplicarCorrecoes(narrativa, verdicts, { combateAtivo = false, hookAnalysis = null, sceneContext = null } = {}) {
  let corrected = narrativa;
  let applied = false;

  for (const v of verdicts) {
    if (v.severidade !== 'error') continue;

    // Árbitro — substituir trecho problemático se correcao_sugerida disponível
    if (v.reviewer === 'arbitro') {
      if (v.correcao_sugerida) {
        corrected = v.correcao_sugerida;
        applied = true;
        log.warn(
          { veredicto: v.veredicto, correcao: v.correcao_sugerida, notas: v.notas },
          'Arbitro corrigiu erro mecanico na narrativa'
        );
      } else {
        log.warn(
          { veredicto: v.veredicto, notas: v.notas },
          'Arbitro detectou erro mecanico sem correcao sugerida'
        );
      }
      continue;
    }

    // Continuista — logar com contexto do problema, não alterar narrativa
    if (v.reviewer === 'continuista') {
      log.warn(
        { veredicto: v.veredicto, trecho: v.trecho_problematico, notas: v.notas },
        'Continuista detectou incoerencia narrativa'
      );
      continue;
    }
  }

  // Gancho — substitui narrativa se necessário (mantido como estava)
  const hookVerdict = verdicts.find(v => v.reviewer === 'gancho' && v.veredicto !== 'ok');
  if (hookVerdict) {
    if (hookVerdict.correcao_sugerida) {
      corrected = hookVerdict.correcao_sugerida;
      applied = true;
    } else {
      corrected = applyFallbackHook(corrected, {
        combateAtivo,
        shouldSuggest: hookAnalysis?.shouldSuggest || false,
        sceneContext
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
  if (trigger.reviewers.includes('arbitro') && !isCircuitOpen('arbitro')) {
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
  if (trigger.reviewers.includes('continuista') && !isCircuitOpen('continuista')) {
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

  if (trigger.reviewers.includes('gancho') && !isCircuitOpen('gancho')) {
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
      recordSuccess(labels[i]);
      return { reviewer: labels[i], ...r.value };
    }
    recordFailure(labels[i]);
    log.warn({ reviewer: labels[i], err: r.reason?.message }, 'Revisor falhou (fail-open)');
    return { reviewer: labels[i], veredicto: 'ok', severidade: 'info', notas: 'falha no revisor' };
  });

  const hasIssues = verdicts.some(v => v.veredicto !== 'ok');

  const sceneContext = {
    npcsPresentes: sessao?.mestreContexto?.sessao?.npcsPresentes || sessao?.estadoJogo?.npcs || [],
    cenaAtual: sessao?.estadoJogo?.cenaAtual || null,
    ameacas: sessao?.estadoJogo?.ameacas || [],
  };

  const corrections = hasIssues
    ? aplicarCorrecoes(narrativa, verdicts, {
        combateAtivo: ctx.combateAtivo,
        hookAnalysis: trigger.hookAnalysis,
        sceneContext
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
