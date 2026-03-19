# Unified Reviewer Phase 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 3 separate AI reviewers with 1 unified Flash Lite reviewer that evaluates mechanics, continuity, and narrative hook in a single LLM call.

**Architecture:** Create `unifiedReviewer.js` with `revisarNarrativa()` that builds a single prompt with 3 criteria and optional context sections. Rewire `executarRevisao` in `index.js` to call the unified reviewer with a `unifiedToLegacy` shape converter. The old orchestrator, trigger logic, and individual reviewers become deprecated.

**Tech Stack:** Node.js ESM, Vitest, `@langchain/google-genai` (ChatGoogleGenerativeAI), `gemini-2.5-flash-lite`

**Spec:** `docs/superpowers/specs/2026-03-19-unified-reviewer-phase3.md` (v1.1)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `agents/Revisores/unifiedReviewer.js` | Unified reviewer: prompt builder + LLM call + validation |
| Create | `tests/unifiedReviewer.test.js` | Unit tests for unified reviewer |
| Modify | `agents/Revisores/index.js` | Rewire `executarRevisao` to use unified reviewer |
| Modify | `agents/Revisores/config.js` | Update model config (maxTokens 1000→2000, timeout 12s→10s) |
| Modify | `tests/reviewPipeline.test.js` | Update tests for new pipeline |

**Not modified (deprecated):** `ArbitroMecanico.js`, `Continuista.js`, `GanchoNarrativo.js`, `reviewOrchestrator.js`, `triggerLogic.js`, `prompts/*`, `helpers/narrativeHookGuard.js`

---

## Task 1: Create unifiedReviewer.js with prompt builder and validation

**Files:**
- Create: `agents/Revisores/unifiedReviewer.js`
- Create: `tests/unifiedReviewer.test.js`

Build the core module: prompt construction, LLM response parsing/validation, fail-open behavior.

- [ ] **Step 1: Write failing tests**

```javascript
// tests/unifiedReviewer.test.js
import { describe, it, expect } from 'vitest';
import { buildReviewPrompt, parseReviewResponse, revisarNarrativa } from '../agents/Revisores/unifiedReviewer.js';

describe('unifiedReviewer', () => {
  describe('buildReviewPrompt', () => {
    it('inclui narrativa e ação do jogador', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'O paladino avança com sua espada.',
        acaoJogador: 'ataco o dretch',
      });
      expect(prompt).toContain('O paladino avança com sua espada.');
      expect(prompt).toContain('ataco o dretch');
      expect(prompt).toContain('MECÂNICA');
      expect(prompt).toContain('CONTINUIDADE');
      expect(prompt).toContain('GANCHO');
    });

    it('inclui resultado mecânico quando presente', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Moruxis ataca o Dretch.',
        acaoJogador: 'ataco',
        resultadoMecanico: {
          ataqueJogador: { atacante: 'Moruxis', alvo: 'Dretch', rolagem: 17, acertou: true, dano: 8, critico: false, esquivou: false, derrotado: false },
        },
        personagemSnapshot: { nome: 'Moruxis', hp_atual: 20, hp_max: 20, mana_atual: 15, mana_max: 15 },
      });
      expect(prompt).toContain('RESULTADO MECÂNICO');
      expect(prompt).toContain('rolagem=17');
      expect(prompt).toContain('PERSONAGEM');
      expect(prompt).toContain('Moruxis');
    });

    it('omite resultado mecânico quando null', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'O vento sopra.',
        acaoJogador: 'examino a sala',
      });
      expect(prompt).not.toContain('RESULTADO MECÂNICO');
    });

    it('inclui claims quando presentes', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Moruxis usa sua espada.',
        acaoJogador: 'ataco',
        claimFlags: [
          { claim: 'tem espada', tipo: 'item', status: 'ok', fonte: 'inventario', confidence: 1 },
          { claim: 'tem asas', tipo: 'item', status: 'invalido', motivo: 'nao encontrado' },
        ],
      });
      expect(prompt).toContain('CLAIMS JÁ VALIDADOS');
      expect(prompt).toContain('tem espada');
      expect(prompt).toContain('ALEGAÇÕES PENDENTES');
      expect(prompt).toContain('tem asas');
    });

    it('inclui roteiro quando presente', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'O druida fala.',
        acaoJogador: 'falo com druida',
        roteiroCondensado: 'O druida é secretamente o vilão',
      });
      expect(prompt).toContain('ROTEIRO');
      expect(prompt).toContain('O druida é secretamente o vilão');
    });

    it('inclui histórico recente', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Continua.',
        acaoJogador: 'avanço',
        historicoRecente: [
          { tipo: 'mestre', message: 'Vocês entram na caverna.' },
          { tipo: 'mestre', message: 'Uma luz brilha ao fundo.' },
        ],
      });
      expect(prompt).toContain('HISTÓRICO RECENTE');
      expect(prompt).toContain('Vocês entram na caverna');
    });
  });

  describe('parseReviewResponse', () => {
    it('parseia JSON válido aprovado', () => {
      const raw = JSON.stringify({
        aprovado: true,
        mecanica: { ok: true, problema: null },
        continuidade: { ok: true, problema: null },
        gancho: { ok: true, problema: null },
        correcao: null,
      });
      const result = parseReviewResponse(raw);
      expect(result.aprovado).toBe(true);
      expect(result.mecanica.ok).toBe(true);
      expect(result.correcao).toBeNull();
    });

    it('parseia JSON com falha e correção', () => {
      const raw = JSON.stringify({
        aprovado: false,
        mecanica: { ok: false, problema: 'dano narrado maior que real' },
        continuidade: { ok: true, problema: null },
        gancho: { ok: true, problema: null },
        correcao: 'Narrativa corrigida aqui.',
      });
      const result = parseReviewResponse(raw);
      expect(result.aprovado).toBe(false);
      expect(result.mecanica.ok).toBe(false);
      expect(result.correcao).toBe('Narrativa corrigida aqui.');
    });

    it('retorna fail-open para JSON inválido', () => {
      const result = parseReviewResponse('not json at all');
      expect(result.aprovado).toBe(true);
    });

    it('retorna fail-open para null', () => {
      const result = parseReviewResponse(null);
      expect(result.aprovado).toBe(true);
    });

    it('retorna fail-open quando aprovado field missing', () => {
      const result = parseReviewResponse('{"mecanica":{"ok":true}}');
      expect(result.aprovado).toBe(true);
    });
  });

  describe('revisarNarrativa', () => {
    it('retorna aprovado com mock válido', async () => {
      const result = await revisarNarrativa({
        narrativa: 'O paladino avança.',
        acaoJogador: 'ataco',
        _mockResponse: JSON.stringify({
          aprovado: true,
          mecanica: { ok: true, problema: null },
          continuidade: { ok: true, problema: null },
          gancho: { ok: true, problema: null },
          correcao: null,
        }),
      });
      expect(result.aprovado).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('retorna fail-open em timeout', async () => {
      const result = await revisarNarrativa({
        narrativa: 'O paladino avança.',
        acaoJogador: 'ataco',
        _simulateTimeout: true,
      });
      expect(result.aprovado).toBe(true);
    });

    it('retorna fail-open em erro', async () => {
      const result = await revisarNarrativa({
        narrativa: 'O paladino avança.',
        acaoJogador: 'ataco',
        _mockResponse: null,
        _simulateError: true,
      });
      expect(result.aprovado).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/unifiedReviewer.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write unifiedReviewer.js**

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/unifiedReviewer.test.js`
Expected: ALL pass

- [ ] **Step 5: Commit**

```bash
git add agents/Revisores/unifiedReviewer.js tests/unifiedReviewer.test.js
git commit -m "feat(reviewer): create unified reviewer with prompt builder and validation"
```

---

## Task 2: Update config.js

**Files:**
- Modify: `agents/Revisores/config.js`

- [ ] **Step 1: Read current config**

Read `agents/Revisores/config.js` to confirm exact contents.

- [ ] **Step 2: Update config values**

Change `maxTokens: 1000` → `maxTokens: 2000` and timeout `12000` → `10000`. Add `circuitBreaker` section.

```javascript
import { detectProvider } from '../Mestre/config.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'reviewer-config' });

const modelName = process.env.REVIEWER_MODEL || 'gemini-2.5-flash-lite';

export const REVIEWER_CONFIG = {
  enabled: process.env.REVIEWER_ENABLED !== 'false',
  model: {
    name: modelName,
    provider: detectProvider(modelName),
    temperature: 0.1,
    maxTokens: 2000,
    timeout: Math.max(5000, parseInt(process.env.REVIEWER_TIMEOUT_MS) || 10000),
  },
  failOpen: true,
  circuitBreaker: {
    maxFailures: 5,
    cooldownMs: 5 * 60 * 1000,
  },
};

if (REVIEWER_CONFIG.enabled) {
  log.info({ model: modelName, provider: REVIEWER_CONFIG.model.provider }, 'Revisores habilitados');
}

export default REVIEWER_CONFIG;
```

- [ ] **Step 3: Run tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/unifiedReviewer.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add agents/Revisores/config.js
git commit -m "feat(reviewer): update config for unified reviewer (maxTokens 2000, timeout 10s)"
```

---

## Task 3: Rewire executarRevisao in index.js

**Files:**
- Modify: `agents/Revisores/index.js`

Replace the orchestrator wiring with the unified reviewer. This is the critical integration point.

- [ ] **Step 1: Read current index.js**

Confirm it currently exports from `reviewOrchestrator.js`.

- [ ] **Step 2: Rewrite index.js**

```javascript
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
```

- [ ] **Step 3: Run all tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All pass (masterNarrationEngine call sites unchanged)

- [ ] **Step 4: Commit**

```bash
git add agents/Revisores/index.js
git commit -m "feat(reviewer): rewire executarRevisao to use unified reviewer"
```

---

## Task 4: Update reviewPipeline tests

**Files:**
- Modify: `tests/reviewPipeline.test.js`

Update existing tests to work with the new pipeline. Remove tests for deprecated functions.

- [ ] **Step 1: Read current test file**

Read `tests/reviewPipeline.test.js` to understand what needs updating.

- [ ] **Step 2: Rewrite tests for new pipeline**

Keep tests for `executarRevisao` behavior but update for the new internals:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarRevisao, REVIEWER_CONFIG } from '../agents/Revisores/index.js';
import { buildReviewPrompt, parseReviewResponse } from '../agents/Revisores/unifiedReviewer.js';

describe('reviewPipeline (unified)', () => {
  describe('executarRevisao', () => {
    it('retorna reviewed:false quando REVIEWER_ENABLED é false', async () => {
      const original = REVIEWER_CONFIG.enabled;
      REVIEWER_CONFIG.enabled = false;
      try {
        const result = await executarRevisao({
          respostaIA: { narracao: 'test' },
          sessao: {},
          userId: 'u1',
        });
        expect(result.reviewed).toBe(false);
        expect(result.passed).toBe(true);
      } finally {
        REVIEWER_CONFIG.enabled = original;
      }
    });

    it('retorna reviewed:false quando narrativa é vazia', async () => {
      const result = await executarRevisao({
        respostaIA: { narracao: '' },
        sessao: {},
        userId: 'u1',
      });
      expect(result.reviewed).toBe(false);
    });

    it('retorna reviewed:false quando narracao é null', async () => {
      const result = await executarRevisao({
        respostaIA: {},
        sessao: {},
        userId: 'u1',
      });
      expect(result.reviewed).toBe(false);
    });
  });

  describe('unifiedToLegacy shape', () => {
    it('verdicts array tem 3 entries (mecanica, continuidade, gancho)', () => {
      const raw = JSON.stringify({
        aprovado: true,
        mecanica: { ok: true, problema: null },
        continuidade: { ok: true, problema: null },
        gancho: { ok: true, problema: null },
        correcao: null,
      });
      const parsed = parseReviewResponse(raw);
      // Simulate what executarRevisao does internally
      const verdicts = ['mecanica', 'continuidade', 'gancho'].map(key => ({
        reviewer: key,
        veredicto: parsed[key]?.ok ? 'ok' : 'problema',
        severidade: parsed[key]?.ok ? 'info' : 'error',
        notas: parsed[key]?.problema || '',
      }));
      expect(verdicts).toHaveLength(3);
      expect(verdicts[0].reviewer).toBe('mecanica');
      expect(verdicts[0].veredicto).toBe('ok');
    });
  });

  describe('buildReviewPrompt — claim flags', () => {
    it('formata claims validados e pendentes', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Moruxis ataca.',
        acaoJogador: 'ataco',
        claimFlags: [
          { claim: 'espada longa', tipo: 'item', status: 'ok', fonte: 'inventario', confidence: 1 },
          { claim: 'voa', tipo: 'habilidade', status: 'invalido', motivo: 'nao possui' },
        ],
      });
      expect(prompt).toContain('CLAIMS JÁ VALIDADOS');
      expect(prompt).toContain('espada longa');
      expect(prompt).toContain('ALEGAÇÕES PENDENTES');
      expect(prompt).toContain('voa');
    });
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/reviewPipeline.test.js tests/unifiedReviewer.test.js`
Expected: ALL pass

- [ ] **Step 4: Commit**

```bash
git add tests/reviewPipeline.test.js
git commit -m "test(reviewer): update reviewPipeline tests for unified reviewer"
```

---

## Task 5: Full regression test + verify no breaks

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All 1774+ tests pass (minus pre-existing Groq rate limit failures)

- [ ] **Step 2: Run reviewer tests specifically**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/unifiedReviewer.test.js tests/reviewPipeline.test.js --reporter=verbose`
Expected: All pass

- [ ] **Step 3: Verify gameEngine + combateHelper tests still pass**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js tests/combateHelper.test.js --reporter=verbose`
Expected: All pass

---

## Summary

| Task | What | Risk |
|------|------|------|
| 1 | unifiedReviewer.js — prompt builder + LLM + validation | Low — new isolated module |
| 2 | config.js — maxTokens + timeout + circuitBreaker | Low — config change |
| 3 | index.js — rewire executarRevisao | Medium — integration point |
| 4 | reviewPipeline tests — update for new pipeline | Low — test maintenance |
| 5 | Full regression | Low — verification only |

**Total:** 5 tasks, ~20 steps. Core change: `executarRevisao` internally calls `revisarNarrativa` (1 LLM call) instead of orchestrating 3 parallel reviewers.
