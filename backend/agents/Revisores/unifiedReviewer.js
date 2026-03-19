// agents/Revisores/unifiedReviewer.js
/**
 * Unified Reviewer — single LLM call for 3 review criteria.
 * Replaces ArbitroMecanico + Continuista + GanchoNarrativo.
 */
import { REVIEWER_CONFIG } from './config.js';
import usageService from '../../services/usageService.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'unifiedReviewer' });

const FAIL_OPEN_RESULT = {
  aprovado: true,
  mecanica: { ok: true, problema: null },
  continuidade: { ok: true, problema: null },
  gancho: { ok: true, problema: null },
  correcao: null,
  latencyMs: 0,
};

// Circuit breaker state
let _failures = 0;
let _openUntil = 0;
const MAX_FAILURES = REVIEWER_CONFIG.circuitBreaker?.maxFailures ?? 5;
const COOLDOWN_MS = REVIEWER_CONFIG.circuitBreaker?.cooldownMs ?? 300000;

const SYSTEM_PROMPT = `Avalie a narrativa do Mestre de RPG contra 3 critérios:

MECÂNICA: A narrativa respeita o resultado mecânico fornecido?
- Dano narrado proporcional ao dano real
- Acerto narrado = acerto mecânico
- HP do alvo coerente com o estado
- Efeitos/status narrados existem no resultado
- Claims já validados (marcados JÁ VALIDADO) não devem ser questionados
(Se não há resultado mecânico, ignorar este critério e marcar ok: true)

CONTINUIDADE: Coerente com o histórico da sessão?
- NPCs mantêm identidade e comportamento
- Cena não muda sem motivo
- Fatos não contraditos
- Não antecipa informações do roteiro que o jogador não sabe

GANCHO: Termina com algo jogável?
- Oferece próximo passo concreto (objeto, escolha, NPC, perigo)
- Evita ganchos vagos ("o que faremos?", "a aventura continua")
- Se turno continua → deixa ação concreta disponível
- Se turno encerra (combate finalizado, teste resolvido) → fecha limpo, ok

Retorne APENAS JSON:
{"aprovado":true,"mecanica":{"ok":true,"problema":null},"continuidade":{"ok":true,"problema":null},"gancho":{"ok":true,"problema":null},"correcao":null}

Se algum critério falha:
- "aprovado": false
- No critério que falhou: "ok": false, "problema": "descrição curta"
- "correcao": narrativa inteira corrigida (copie o original e altere APENAS o trecho problemático)`;

/**
 * Build the review prompt with conditional context sections.
 */
export function buildReviewPrompt({
  narrativa, acaoJogador, resultadoMecanico, personagemSnapshot,
  historicoRecente, npcsPresentes, memoriaSemantica, roteiroCondensado, claimFlags
} = {}) {
  const parts = [];

  parts.push(`[CRITÉRIOS]\nMECÂNICA | CONTINUIDADE | GANCHO`);
  parts.push(`[NARRATIVA DO MESTRE]\n${narrativa || ''}`);
  parts.push(`[AÇÃO DO JOGADOR]\n${acaoJogador || ''}`);

  if (resultadoMecanico) {
    const rm = resultadoMecanico;
    const resumo = [];
    if (rm.ataqueJogador) {
      const a = rm.ataqueJogador;
      resumo.push(`Ataque: rolagem=${a.rolagem}, acertou=${a.acertou}, esquivou=${a.esquivou}, critico=${a.critico}, dano=${a.dano}${a.derrotado ? ', DERROTADO' : ''}`);
    }
    if (rm.habilidade) {
      resumo.push(`Habilidade: ${rm.habilidade.habilidadeNome || '?'}, valido=${rm.habilidade.valido}, dano=${rm.habilidade.dano}, custoMana=${rm.habilidade.custoMana}`);
    }
    if (rm.defesa) {
      resumo.push(`Defesa: esquivaBonus=${rm.defesa.esquivaBonus}, reducaoDano=${rm.defesa.reducaoDano}`);
    }
    if (rm.contraAtaques?.length > 0) {
      for (const ca of rm.contraAtaques) {
        resumo.push(`Contra-ataque: ${ca.atacante} → ${ca.alvoNome}, acertou=${ca.acertou}, dano=${ca.dano}`);
      }
    }
    if (rm.combateFinalizado) resumo.push(`Combate finalizado: ${rm.resultadoCombate}`);
    if (rm.statusEfeitos?.length > 0) resumo.push(`Efeitos: ${rm.statusEfeitos.map(e => e.tipo || e.efeito || e).join(', ')}`);
    parts.push(`[RESULTADO MECÂNICO]\n${resumo.join('\n')}`);
  }

  if (personagemSnapshot) {
    const p = personagemSnapshot;
    parts.push(`[PERSONAGEM]\n${p.nome || '?'} — HP: ${p.hp_atual ?? '?'}/${p.hp_max ?? '?'}, Mana: ${p.mana_atual ?? '?'}/${p.mana_max ?? '?'}`);
  }

  if (claimFlags?.length > 0) {
    const validados = claimFlags.filter(f => f.status === 'ok');
    const pendentes = claimFlags.filter(f => f.status !== 'ok');
    const claimParts = [];
    if (validados.length > 0) {
      claimParts.push(`CLAIMS JÁ VALIDADOS (não questionar):\n${validados.map(f => `- "${f.claim}" (${f.tipo}): VALIDADO via ${f.fonte || 'claimDetector'} (confiança ${f.confidence ?? '?'})`).join('\n')}`);
    }
    if (pendentes.length > 0) {
      claimParts.push(`ALEGAÇÕES PENDENTES (verificar):\n${pendentes.map(f => `- "${f.claim}" (${f.tipo}): ${f.status} — ${f.motivo || 'pendente'}`).join('\n')}`);
    }
    parts.push(`[CLAIMS DETECTADOS]\n${claimParts.join('\n')}`);
  }

  if (historicoRecente?.length > 0) {
    const msgs = historicoRecente.slice(-5).map(m => `- ${m.message || m.mensagem || ''}`).join('\n');
    parts.push(`[HISTÓRICO RECENTE]\n${msgs}`);
  }

  if (npcsPresentes?.length > 0) {
    const npcs = npcsPresentes.slice(0, 10).map(n => {
      const nome = typeof n === 'string' ? n : n?.nome || String(n);
      const papel = n?.papel || n?.role || '';
      return papel ? `- ${nome} (${papel})` : `- ${nome}`;
    }).join('\n');
    parts.push(`[NPCs PRESENTES]\n${npcs}`);
  }

  if (memoriaSemantica?.length > 0) {
    const mem = memoriaSemantica.slice(0, 8).map(m => `- ${typeof m === 'string' ? m : m?.fato || JSON.stringify(m)}`).join('\n');
    parts.push(`[MEMÓRIA SEMÂNTICA]\n${mem}`);
  }

  if (roteiroCondensado) {
    parts.push(`[ROTEIRO] (jogador NÃO deve saber disso — verificar se narrativa antecipa)\n${roteiroCondensado}`);
  }

  return parts.join('\n\n');
}

/**
 * Parse and validate the LLM's JSON response. Returns fail-open on any error.
 */
export function parseReviewResponse(raw) {
  if (!raw) return { ...FAIL_OPEN_RESULT };

  let parsed;
  try {
    const cleaned = String(raw).replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    log.debug({ raw: String(raw).slice(0, 200) }, 'unifiedReviewer: JSON parse failed');
    return { ...FAIL_OPEN_RESULT };
  }

  if (typeof parsed.aprovado !== 'boolean') {
    return { ...FAIL_OPEN_RESULT };
  }

  return {
    aprovado: parsed.aprovado,
    mecanica: parsed.mecanica || { ok: true, problema: null },
    continuidade: parsed.continuidade || { ok: true, problema: null },
    gancho: parsed.gancho || { ok: true, problema: null },
    correcao: parsed.correcao || null,
  };
}

/**
 * Main review function. Calls Flash Lite LLM with unified prompt.
 *
 * @param {Object} params
 * @param {string} [params._mockResponse] - Mock LLM response for testing
 * @param {boolean} [params._simulateTimeout] - Simulate timeout for testing
 * @param {boolean} [params._simulateError] - Simulate error for testing
 * @returns {Promise<Object>} Review result with fail-open guarantee
 */
export async function revisarNarrativa(params) {
  const start = Date.now();

  // Circuit breaker check
  if (_failures >= MAX_FAILURES && Date.now() < _openUntil) {
    log.info('unifiedReviewer: circuit breaker open, skipping');
    return { ...FAIL_OPEN_RESULT };
  }

  const userPrompt = buildReviewPrompt(params);

  let raw;
  try {
    if (params._simulateTimeout) throw new Error('Timeout');
    if (params._simulateError) throw new Error('Simulated error');
    if (params._mockResponse !== undefined) {
      raw = params._mockResponse;
    } else {
      raw = await _callFlashLite(userPrompt);
    }
  } catch (err) {
    _failures++;
    if (_failures >= MAX_FAILURES) _openUntil = Date.now() + COOLDOWN_MS;
    log.warn({ err: err.message, failures: _failures }, 'unifiedReviewer: LLM call failed (fail-open)');
    return { ...FAIL_OPEN_RESULT, latencyMs: Date.now() - start };
  }

  const result = parseReviewResponse(raw);
  result.latencyMs = Date.now() - start;

  // Reset circuit breaker on success
  _failures = 0;

  // Usage tracking
  try {
    usageService.track({
      userId: params.userId,
      provider: REVIEWER_CONFIG.model.provider,
      tipo: 'reviewer_unificado',
      modelo: REVIEWER_CONFIG.model.name,
      duracao_ms: result.latencyMs,
    });
  } catch { /* non-blocking */ }

  log.info({
    aprovado: result.aprovado,
    mecanica: result.mecanica.ok,
    continuidade: result.continuidade.ok,
    gancho: result.gancho.ok,
    corrected: !!result.correcao,
    latencyMs: result.latencyMs,
  }, 'unifiedReviewer: revisao concluida');

  return result;
}

/**
 * Call Gemini Flash Lite for review.
 * @private
 */
async function _callFlashLite(userPrompt) {
  const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
  const { HumanMessage, SystemMessage } = await import('@langchain/core/messages');

  const model = new ChatGoogleGenerativeAI({
    model: REVIEWER_CONFIG.model.name,
    temperature: REVIEWER_CONFIG.model.temperature,
    maxOutputTokens: REVIEWER_CONFIG.model.maxTokens,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const timeout = REVIEWER_CONFIG.model.timeout;
  const response = await Promise.race([
    model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ]),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Reviewer timeout')), timeout)),
  ]);

  return typeof response.content === 'string'
    ? response.content.trim()
    : String(response.content || '');
}
