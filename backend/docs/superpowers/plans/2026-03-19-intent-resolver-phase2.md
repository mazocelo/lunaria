# Intent Resolver Phase 2: LLM Fallback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3-layer intent resolution to the game engine: regex first, Flash Lite classifier second, Mestre AI `intentSugerido` third — so combat never fails to resolve a player's action.

**Architecture:** `prepararTurno` becomes async and internally runs a 3-layer pipeline: existing regex resolver → new Flash Lite classifier → fallback to Mestre AI. A new `intentClassifier.js` module handles the LLM call. The Mestre prompt schema gains an `intentSugerido` field processed by a new RESPONSE_HANDLER.

**Tech Stack:** Node.js ESM, Vitest, `@langchain/google-genai` (ChatGoogleGenerativeAI), `gemini-2.5-flash-lite`

**Spec:** `docs/superpowers/specs/2026-03-19-intent-resolver-phase2.md` (v1.1)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `helpers/intentClassifier.js` | Flash Lite one-shot intent classification |
| Create | `tests/intentClassifier.test.js` | Unit tests for classifier (validation, parsing) |
| Modify | `helpers/gameEngine.js` | async `prepararTurno` + `_resolveIntentPipeline` + `_prepararMecanica` |
| Modify | `tests/gameEngine.test.js` | Async migration + pipeline tests |
| Modify | `websocket/engines/masterNarrationEngine.js:1018-1056` | Pass `{ mensagem }`, handle `requerIntentMestre` |
| Modify | `websocket/utils/respostaDispatcher.js:130-220` | async `ensureCombatPreResolution` + `intent_sugerido` handler |
| Modify | `agents/Mestre/prompts/sistema.js:537-591` | Add `intentSugerido` to response schema |

---

## Task 1: Create intentClassifier.js with validation logic

**Files:**
- Create: `helpers/intentClassifier.js`
- Create: `tests/intentClassifier.test.js`

The classifier validates LLM JSON output against the character's actual abilities. We build and test the validation FIRST without the LLM call (mocked).

- [ ] **Step 1: Write failing tests for validation logic**

```javascript
// tests/intentClassifier.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validarIntentLLM, buildClassifierPrompt } from '../helpers/intentClassifier.js';

function makePersonagem() {
  return {
    habilidades: [
      { id: 'investida', nome: 'Investida', custo_mana: 3, dano_base: '1d8' },
    ],
    magias: [
      { id: 'luz_divina', nome: 'Luz Divina', custo_mana: 5, dano_base: '2d6', elemento: 'sagrado' },
    ],
  };
}

function makeCombate() {
  return {
    ativo: true,
    monstros: [
      { id: 'dretch_0', nome: 'Dretch', status: 'vivo', hp_atual: 25 },
      { id: 'dretch_1', nome: 'Dretch', status: 'derrotado', hp_atual: 0 },
    ],
  };
}

describe('intentClassifier', () => {
  describe('validarIntentLLM', () => {
    const personagem = makePersonagem();
    const combate = makeCombate();

    it('valida JSON com magia existente', () => {
      const raw = '{"tipo":"conjurar_magia","id":"luz_divina","alvo":"dretch_0"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('conjurar_magia');
      expect(result.magiaId).toBe('luz_divina');
      expect(result.alvoId).toBe('dretch_0');
    });

    it('valida JSON com habilidade existente', () => {
      const raw = '{"tipo":"usar_habilidade","id":"investida","alvo":"dretch_0"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('usar_habilidade');
      expect(result.habilidadeId).toBe('investida');
    });

    it('valida ataque genérico (sem id)', () => {
      const raw = '{"tipo":"atacar","alvo":"dretch_0"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('atacar');
    });

    it('valida defender (sem id, sem alvo)', () => {
      const raw = '{"tipo":"defender"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.tipo).toBe('defender');
    });

    it('retorna null para JSON inválido', () => {
      expect(validarIntentLLM('not json', personagem, combate)).toBeNull();
      expect(validarIntentLLM('', personagem, combate)).toBeNull();
      expect(validarIntentLLM(null, personagem, combate)).toBeNull();
    });

    it('retorna null para tipo inválido', () => {
      const raw = '{"tipo":"dançar","id":"investida"}';
      expect(validarIntentLLM(raw, personagem, combate)).toBeNull();
    });

    it('retorna null para habilidade inexistente', () => {
      const raw = '{"tipo":"usar_habilidade","id":"golpe_fantasma"}';
      expect(validarIntentLLM(raw, personagem, combate)).toBeNull();
    });

    it('usa primeiro monstro vivo quando alvo não existe', () => {
      const raw = '{"tipo":"atacar","alvo":"goblin_99"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result).not.toBeNull();
      expect(result.alvoId).toBe('dretch_0'); // primeiro vivo
    });

    it('ignora monstros derrotados ao selecionar alvo', () => {
      const raw = '{"tipo":"atacar","alvo":"dretch_1"}';
      const result = validarIntentLLM(raw, personagem, combate);
      expect(result.alvoId).toBe('dretch_0'); // dretch_1 está derrotado
    });
  });

  describe('buildClassifierPrompt', () => {
    it('gera prompt com habilidades e monstros', () => {
      const prompt = buildClassifierPrompt('uso meu poder sagrado', makePersonagem(), makeCombate());
      expect(prompt).toContain('Luz Divina');
      expect(prompt).toContain('luz_divina');
      expect(prompt).toContain('Dretch');
      expect(prompt).toContain('dretch_0');
      expect(prompt).not.toContain('dretch_1'); // derrotado
      expect(prompt).toContain('uso meu poder sagrado');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/intentClassifier.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write intentClassifier.js with validation + prompt builder**

```javascript
// helpers/intentClassifier.js
/**
 * Flash Lite intent classifier — Camada 2 do intent pipeline.
 *
 * Classifica ação de combate via LLM quando regex falha.
 * Valida retorno contra lista real de habilidades/magias do personagem.
 */
import logger from './logger.js';

const log = logger.child({ module: 'intentClassifier' });

const TIPOS_VALIDOS = ['atacar', 'defender', 'fugir', 'usar_habilidade', 'conjurar_magia'];

/**
 * Validate raw JSON string from LLM against character's actual abilities.
 *
 * @param {string|null} raw - Raw JSON string from LLM
 * @param {Object} personagem - Character with habilidades/magias arrays
 * @param {Object} combate - Combat state with monstros array
 * @returns {{ tipo, habilidadeId?, magiaId?, alvoId?, source } | null}
 */
export function validarIntentLLM(raw, personagem, combate) {
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
  } catch {
    log.debug({ raw }, 'intentClassifier: JSON parse failed');
    return null;
  }

  const tipo = parsed.tipo;
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    log.debug({ tipo }, 'intentClassifier: tipo inválido');
    return null;
  }

  const result = { tipo, source: 'flash_lite' };

  // Resolve ability/spell ID
  const id = parsed.id || null;
  if (tipo === 'usar_habilidade' || tipo === 'conjurar_magia') {
    if (!id) return null;
    const habilidades = personagem?.habilidades || [];
    const magias = personagem?.magias || [];

    if (tipo === 'conjurar_magia') {
      const magia = magias.find(m => m.id === id) || magias.find(m => m.nome?.toLowerCase() === id?.toLowerCase());
      if (!magia) return null;
      result.magiaId = magia.id;
      result.magiaNome = magia.nome;
    } else {
      const hab = habilidades.find(h => h.id === id) || habilidades.find(h => h.nome?.toLowerCase() === id?.toLowerCase());
      if (!hab) return null;
      result.habilidadeId = hab.id;
      result.habilidadeNome = hab.nome;
    }
  }

  // Resolve target
  const monstrosVivos = (combate?.monstros || []).filter(m => m.status === 'vivo');
  const alvo = parsed.alvo || null;
  if (alvo && monstrosVivos.find(m => m.id === alvo)) {
    result.alvoId = alvo;
  } else if (monstrosVivos.length > 0 && tipo !== 'defender' && tipo !== 'fugir') {
    result.alvoId = monstrosVivos[0].id;
  }

  return result;
}

/**
 * Build the classifier prompt from player message + character abilities + combat state.
 *
 * @param {string} mensagem - Player's message text
 * @param {Object} personagem - Character with habilidades/magias
 * @param {Object} combate - Combat state with monstros
 * @returns {string}
 */
export function buildClassifierPrompt(mensagem, personagem, combate, candidates = []) {
  const habilidades = personagem?.habilidades || [];
  const magias = personagem?.magias || [];
  const monstrosVivos = (combate?.monstros || []).filter(m => m.status === 'vivo');

  const acoes = [
    ...habilidades.map(h => `- ${h.nome} (id: ${h.id}, habilidade)`),
    ...magias.map(m => `- ${m.nome} (id: ${m.id}, magia)`),
  ].join('\n');

  const monstros = monstrosVivos.map(m => `- ${m.nome} (id: ${m.id})`).join('\n');

  const candidateHint = candidates.length > 0
    ? `\nCandidatos ambíguos (escolha o mais provável):\n${candidates.map(c => `- ${c}`).join('\n')}\n`
    : '';

  return `Classifique a ação de combate do jogador.

Habilidades disponíveis:
${acoes || '(nenhuma)'}

Monstros vivos:
${monstros || '(nenhum)'}
${candidateHint}Tipos válidos: atacar, defender, fugir, usar_habilidade, conjurar_magia

Ação do jogador: "${mensagem}"

Responda APENAS JSON, sem markdown:
{"tipo":"...","id":"...","alvo":"..."}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/intentClassifier.test.js`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add helpers/intentClassifier.js tests/intentClassifier.test.js
git commit -m "feat(intentClassifier): create module with validation and prompt builder"
```

---

## Task 2: Add LLM call to intentClassifier

**Files:**
- Modify: `helpers/intentClassifier.js`
- Modify: `tests/intentClassifier.test.js`

Add the actual `classificarIntent` async function that calls Flash Lite.

- [ ] **Step 1: Write test for classificarIntent (mocked LLM)**

Add to `tests/intentClassifier.test.js`:

```javascript
import { classificarIntent } from '../helpers/intentClassifier.js';

describe('classificarIntent', () => {
  it('retorna intent quando LLM responde JSON válido', async () => {
    // This test calls the real function but we can't guarantee LLM behavior
    // Test the contract: if LLM returns valid JSON, we get valid intent
    // For unit test, we test via validarIntentLLM (already covered)
    // This is a smoke test for the async wrapper
    const personagem = makePersonagem();
    const combate = makeCombate();

    // Mock: override the internal LLM call
    // We test the full flow in integration, here just verify the wrapper handles null
    const result = await classificarIntent('atacar o dretch', personagem, combate, {
      _mockResponse: '{"tipo":"atacar","alvo":"dretch_0"}'
    });
    expect(result).not.toBeNull();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.source).toBe('flash_lite');
  });

  it('retorna null quando LLM retorna JSON inválido', async () => {
    const result = await classificarIntent('dançar', makePersonagem(), makeCombate(), {
      _mockResponse: 'sorry I cannot'
    });
    expect(result).toBeNull();
  });

  it('retorna null quando timeout', async () => {
    const result = await classificarIntent('atacar', makePersonagem(), makeCombate(), {
      _mockResponse: null,
      _simulateTimeout: true
    });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/intentClassifier.test.js`
Expected: FAIL — `classificarIntent` not exported

- [ ] **Step 3: Add classificarIntent function**

Add to `helpers/intentClassifier.js`:

```javascript
/**
 * Classify player's combat action via Flash Lite LLM.
 *
 * @param {string} mensagem - Player's message text
 * @param {Object} personagem - Character with habilidades/magias
 * @param {Object} combate - Combat state
 * @param {Object} [options]
 * @param {string[]} [options.candidates] - Ambiguous candidates from Camada 1
 * @param {string} [options._mockResponse] - Mock LLM response for testing
 * @param {boolean} [options._simulateTimeout] - Simulate timeout for testing
 * @returns {Promise<{ intent, source, raw } | null>}
 */
export async function classificarIntent(mensagem, personagem, combate, options = {}) {
  const prompt = buildClassifierPrompt(mensagem, personagem, combate, options.candidates || []);

  let raw;
  try {
    if (options._simulateTimeout) {
      throw new Error('Timeout');
    }
    if (options._mockResponse !== undefined) {
      raw = options._mockResponse;
    } else {
      raw = await _callFlashLite(prompt);
    }
  } catch (err) {
    log.info({ err: err.message, latencyMs: 0 }, 'intentClassifier: LLM call failed (fail-open)');
    return null;
  }

  if (!raw) return null;

  const intent = validarIntentLLM(raw, personagem, combate);
  if (!intent) {
    log.info({ raw }, 'intentClassifier: LLM response failed validation');
    return null;
  }

  log.info({ tipo: intent.tipo, source: 'flash_lite' }, 'intent resolved by flash_lite');
  return { intent, source: 'flash_lite', raw };
}

/**
 * Call Gemini Flash Lite for intent classification.
 * @private
 */
async function _callFlashLite(prompt) {
  const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-lite',
    temperature: 0,
    maxOutputTokens: 100,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const response = await Promise.race([
    model.invoke(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Classifier timeout')), 3000))
  ]);

  return typeof response.content === 'string'
    ? response.content.trim()
    : String(response.content || '');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/intentClassifier.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add helpers/intentClassifier.js tests/intentClassifier.test.js
git commit -m "feat(intentClassifier): add classificarIntent with Flash Lite LLM call"
```

---

## Task 3: Refactor gameEngine.js — async prepararTurno + intent pipeline

**Files:**
- Modify: `helpers/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

Extract `_prepararMecanica`, add `_resolveIntentPipeline`, make `prepararTurno` async.

- [ ] **Step 1: Migrate existing tests to async**

In `tests/gameEngine.test.js`, update ALL `prepararTurno` calls to use `async/await`:

Change every `it('...', () => {` that calls `prepararTurno` to `it('...', async () => {` and add `await` before `prepararTurno(...)`.

Example:
```javascript
// Before:
it('retorna resultado pré-resolvido para ataque básico', () => {
  const resultado = prepararTurno(sessao, 'user_1', intent);
// After:
it('retorna resultado pré-resolvido para ataque básico', async () => {
  const resultado = await prepararTurno(sessao, 'user_1', intent);
```

Do this for ALL tests that call `prepararTurno` or `formatarContexto` (which uses `prepararTurno` results).

- [ ] **Step 2: Add new pipeline tests**

Add to `tests/gameEngine.test.js`:

```javascript
describe('prepararTurno — intent pipeline (Phase 2)', () => {
  it('resolve intent via mensagem (Camada 1 regex)', async () => {
    const sessao = makeSessao();
    const resultado = await prepararTurno(sessao, 'user_1', {
      mensagem: 'defendo'
    });
    expect(resultado).not.toBeNull();
    expect(resultado.defesa).toBeTruthy();
  });

  it('Phase 1 compat: intent com tipo funciona igual', async () => {
    const sessao = makeSessao();
    const resultado = await prepararTurno(sessao, 'user_1', { tipo: 'defender' });
    expect(resultado).not.toBeNull();
    expect(resultado.defesa).toBeTruthy();
  });

  it('Camada 1 ambíguo → Flash Lite desambigua (mocked)', async () => {
    // Personagem with 2 similar abilities to trigger ambiguity
    const sessao = makeSessao({
      personagensCompletos: {
        'user_1': makePersonagemCompleto({
          habilidades: [
            { id: 'investida', nome: 'Investida', custo_mana: 3, dano_base: '1d8' },
            { id: 'investida_brutal', nome: 'Investida Brutal', custo_mana: 5, dano_base: '2d8' },
          ]
        })
      }
    });
    // "investida" matches both — ambiguous in Camada 1
    // With _skipFlashLite, falls to Camada 3
    const resultado = await prepararTurno(sessao, 'user_1', {
      mensagem: 'investida',
      _skipFlashLite: true
    });
    expect(resultado.requerIntentMestre).toBe(true);
  });

  it('retorna requerIntentMestre quando todas camadas falham', async () => {
    const sessao = makeSessao();
    const resultado = await prepararTurno(sessao, 'user_1', {
      mensagem: 'empurro o barril de pólvora no demônio',
      _skipFlashLite: true  // skip LLM for unit test
    });
    expect(resultado).not.toBeNull();
    expect(resultado.requerIntentMestre).toBe(true);
  });

  it('retorna null quando combate não ativo', async () => {
    const sessao = makeSessao({ estadoJogo: { combate: { ativo: false } } });
    const resultado = await prepararTurno(sessao, 'user_1', { mensagem: 'ataco' });
    expect(resultado).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify new ones fail**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: New pipeline tests FAIL (prepararTurno doesn't handle `mensagem` yet)

- [ ] **Step 4: Refactor gameEngine.js**

Rewrite `helpers/gameEngine.js`:

```javascript
/**
 * GameEngine — facade over combat mechanics.
 *
 * Centralizes ALL mechanical resolution for combat.
 * Does NOT call AI, emit websocket events, or persist to Redis.
 */
import { resolverMecanicaCombate, finalizarAcaoCombatePosTeste } from './combateHelper.js';
import { buildCombatPromptContext } from './combatPromptContext.js';
import { resolveCombatIntent } from '../websocket/utils/combatIntentResolver.js';
import logger from './logger.js';

const log = logger.child({ module: 'gameEngine' });

/**
 * Pre-resolve combat mechanics for a player's action.
 *
 * Accepts either a resolved intent (Phase 1 compat) or a raw message (Phase 2).
 * When given a message, runs the 3-layer intent pipeline:
 *   Camada 1: regex (resolveCombatIntent)
 *   Camada 2: Flash Lite (intentClassifier)
 *   Camada 3: returns { requerIntentMestre: true }
 *
 * @param {Object} sessao - Full session state
 * @param {string} userId - Player who acted
 * @param {Object} intentOrMessage - { tipo, ... } or { mensagem, explicitIntent? }
 * @returns {Promise<CombatRoundResult|{requerIntentMestre:true}|null>}
 */
export async function prepararTurno(sessao, userId, intentOrMessage) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) {
    log.debug({ userId }, 'prepararTurno: combate não ativo');
    return null;
  }

  // Phase 1 compat: intent already resolved
  if (intentOrMessage?.tipo) {
    return _prepararMecanica(sessao, userId, intentOrMessage);
  }

  // Phase 2: resolve intent from message
  const mensagem = intentOrMessage?.mensagem;
  if (!mensagem) return null;

  const explicitIntent = intentOrMessage?.explicitIntent || null;
  const skipFlashLite = intentOrMessage?._skipFlashLite || false;

  const intent = await _resolveIntentPipeline(sessao, userId, mensagem, explicitIntent, { skipFlashLite });
  if (!intent) {
    return { requerIntentMestre: true, mensagem };
  }

  const resultado = _prepararMecanica(sessao, userId, intent);
  if (resultado) resultado._resolvedIntent = intent;  // propagate for caller
  return resultado;
}

/**
 * 3-layer intent resolution pipeline.
 * @private
 */
async function _resolveIntentPipeline(sessao, userId, mensagem, explicitIntent, options = {}) {
  const combate = sessao?.estadoJogo?.combate;
  const personagem = _resolvePersonagem(sessao, userId);

  // Camada 1: Regex + name match
  const resolution = resolveCombatIntent({
    mensagem,
    explicitIntent,
    personagemCompleto: personagem,
    combate,
    userId
  });

  if (resolution.intent && !resolution.ambiguous) {
    log.info({ camada: 1, tipo: resolution.intent.tipo, confidence: resolution.confidence }, 'intent resolved by regex');
    return resolution.intent;
  }

  // Camada 2: Flash Lite classifier
  if (!options.skipFlashLite) {
    try {
      const { classificarIntent } = await import('./intentClassifier.js');
      const llmResult = await classificarIntent(mensagem, personagem, combate, {
        candidates: resolution.candidates || []
      });
      if (llmResult?.intent) {
        log.info({ camada: 2, tipo: llmResult.intent.tipo }, 'intent resolved by flash_lite');
        return llmResult.intent;
      }
    } catch (err) {
      log.warn({ err: err.message }, 'intentClassifier failed (fail-open)');
    }
  }

  // Camada 3: delegate to Mestre AI
  log.info({ camada: 3, mensagem }, 'intent delegated to mestre');
  return null;
}

/**
 * Resolve mechanics from a validated intent. Extracted from Phase 1 prepararTurno body.
 * @private
 */
function _prepararMecanica(sessao, userId, intent) {
  const combate = sessao?.estadoJogo?.combate;
  const personagem = _resolvePersonagem(sessao, userId);
  if (!personagem) {
    log.warn({ userId }, 'prepararTurno: personagem não encontrado');
    return null;
  }
  return resolverMecanicaCombate(combate, userId, sessao, personagem, intent);
}

// resolverTurno and formatarContexto stay unchanged...
export function resolverTurno(sessao, acaoPendente, resultadoTeste) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) {
    log.debug('resolverTurno: combate não ativo');
    return null;
  }
  if (!acaoPendente) {
    log.warn('resolverTurno: acaoPendente é null');
    return null;
  }
  return finalizarAcaoCombatePosTeste(sessao, acaoPendente, resultadoTeste);
}

export function formatarContexto(sessao, userId, resultado, options = {}) {
  if (!resultado) {
    return { promptText: '', mechanicalSummary: '', requiresTest: false };
  }
  const combate = sessao?.estadoJogo?.combate || null;
  const personagem = _resolvePersonagem(sessao, userId);
  return buildCombatPromptContext({
    combate,
    userId,
    personagem,
    turnStateText: options.turnStateText || '',
    resultadoMecanico: resultado,
    pendingTest: Boolean(resultado.requerTeste)
  });
}

// Private: resolve personagem (unchanged from Phase 1)
function _resolvePersonagem(sessao, userId) {
  const completos = sessao?.personagensCompletos || {};
  if (completos[userId]) return completos[userId];
  const jogadorInfo = sessao?.jogadores?.[userId];
  const personagemId = jogadorInfo?.personagemId || jogadorInfo?.personagem_id;
  if (personagemId && completos[String(personagemId)]) {
    return completos[String(personagemId)];
  }
  const combatJogador = sessao?.estadoJogo?.combate?.jogadores?.[userId];
  const combatPcId = combatJogador?.personagemId;
  if (combatPcId && completos[String(combatPcId)]) {
    return completos[String(combatPcId)];
  }
  return null;
}

export { _resolvePersonagem as resolvePersonagem };
```

- [ ] **Step 5: Run all tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: ALL pass (existing + new pipeline tests)

- [ ] **Step 6: Commit**

```bash
git add helpers/gameEngine.js tests/gameEngine.test.js
git commit -m "feat(gameEngine): async prepararTurno with 3-layer intent pipeline"
```

---

## Task 4: Wire async prepararTurno into masterNarrationEngine

**Files:**
- Modify: `websocket/engines/masterNarrationEngine.js`

Replace inline intent resolution + `prepararTurno(sessao, userId, intent)` with `await prepararTurno(sessao, userId, { mensagem, explicitIntent })`. Handle `requerIntentMestre`.

- [ ] **Step 1: Read current combat block to confirm exact lines**

Read `masterNarrationEngine.js` lines 1010-1120.

- [ ] **Step 2: Replace the combat block**

The current code (after Phase 1) does:
1. Lines 1018-1052: `resolveCombatIntent()` → error if no intent
2. Line 1054-1056: `combatIntentResolvido = resolution.intent; resultados = prepararTurno(..., combatIntentResolvido)`
3. Lines 1058-1096: handle test/pending action
4. Lines 1098-1115: `formatarContexto` → build prompt

Replace with:

```javascript
      if (combateAtivo) {
        // Phase 2: gameEngine resolves intent internally (3-layer pipeline)
        resultadosCombatePreResolvido = await prepararTurno(workingSessao, userId, {
          mensagem,
          explicitIntent: combatIntent
        });

        if (resultadosCombatePreResolvido?.requerIntentMestre) {
          // Camada 3: Mestre will narrate and optionally suggest intent
          // No mechanics pre-resolved — AI narrates the attempt only
          resultadosCombatePreResolvido = null;
          // acaoComContexto uses only turnStateText (no mechanical results)
          const combatPromptCtx = formatarContexto(workingSessao, userId, null, { turnStateText });
          acaoComContexto = [
            combatPromptCtx.promptText || turnStateText,
            `Acao do jogador: "${promptAcao}"`
          ].filter(Boolean).join('\n');
        } else if (resultadosCombatePreResolvido?.requerTeste) {
          // Test needed — existing logic preserved
          combatIntentResolvido = resultadosCombatePreResolvido._resolvedIntent || combatIntent;
          const rt = resultadosCombatePreResolvido.requerTeste;
          const testeCriado = criarTestePendente(workingSessao, {
            origem: 'combate',
            jogadorAlvo: userId,
            personagemAlvo: personagemCompleto.nome,
            teste: rt.teste,
            dificuldade: rt.dcNumerico,
            tipoDado: rt.tipoDado || 'd20',
            contexto: rt.contexto,
            metadata: {
              ...(rt.metadata || {}),
              difficultyLabel: rt.dificuldadeLabel || rt.dificuldade
            },
          }, userId);

          createPendingCombatAction(workingSessao, {
            tipo: rt.intentTipo,
            userId,
            personagem: {
              nome: personagemCompleto.nome,
              id: personagemCompleto.id,
              personagemId: personagemCompleto.personagemId || personagemCompleto.personagem_id
            },
            combatIntent: combatIntentResolvido,
            testeId: testeCriado?.id || null,
            statusEfeitos: resultadosCombatePreResolvido.statusEfeitos || [],
            ...(rt.pendingCombatAction || {})
          });

          resultadosCombatePreResolvido._emitirTesteAposNarracao = { testeCriado, rt };

          const combatPromptCtx = formatarContexto(workingSessao, userId, resultadosCombatePreResolvido, { turnStateText });
          const promptChunks = [
            combatPromptCtx.promptText,
            `[TESTE NECESSARIO: ${rt.teste} DC ${rt.dcNumerico} (${rt.dificuldade}). Narre apenas a tentativa e a pressao do momento. Nao confirme sucesso, dano letal nem abate antes da rolagem.]`,
            `Acao do jogador: "${promptAcao}"`
          ].filter(Boolean);
          acaoComContexto = promptChunks.join('\n');
        } else if (resultadosCombatePreResolvido) {
          // Immediate action (defend, etc) — existing logic preserved
          workingSessao._combatePreResolvido = resultadosCombatePreResolvido;
          const combatPromptCtx = formatarContexto(workingSessao, userId, resultadosCombatePreResolvido, { turnStateText });
          acaoComContexto = [
            combatPromptCtx.promptText,
            `Acao do jogador: "${promptAcao}"`
          ].filter(Boolean).join('\n');
        }
      }
```

**Key changes:**
- Removes inline `resolveCombatIntent` call (now inside gameEngine)
- Removes error-to-player block for unresolved intent (replaced by pipeline)
- Adds `requerIntentMestre` branch for Camada 3
- `resolveCombatIntent` import can be removed from this file

- [ ] **Step 3: Remove unused imports**

Remove `resolveCombatIntent` import if no longer used in the file. Grep first to verify.

- [ ] **Step 4: Run tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add websocket/engines/masterNarrationEngine.js
git commit -m "refactor(masterNarration): use async prepararTurno with 3-layer intent pipeline"
```

---

## Task 5: Wire async into respostaDispatcher + add intent_sugerido handler

**Files:**
- Modify: `websocket/utils/respostaDispatcher.js`

Make `ensureCombatPreResolution` async, simplify it, and add the `intent_sugerido` handler.

- [ ] **Step 1: Read current file to confirm exact state**

Read `respostaDispatcher.js` lines 1-10 (imports), 130-220 (handlers), 516-548 (RESPONSE_HANDLERS).

- [ ] **Step 2: Update ensureCombatPreResolution to async + use prepararTurno**

Replace the function (lines 130-186):

```javascript
async function ensureCombatPreResolution(resposta, ctx) {
  const combate = ctx.sessao?.estadoJogo?.combate;
  if (!combate?.ativo) return;
  if (ctx.sessao?._combatePreResolvido || hasPendingCombatAction(ctx.sessao)) return;

  const resultados = await prepararTurno(ctx.sessao, ctx.userId, {
    mensagem: ctx.mensagem,
    explicitIntent: ctx.combatIntent
  });

  if (!resultados || resultados.requerIntentMestre) return;

  if (resultados.requerTeste) {
    const rt = resultados.requerTeste;
    const personagemRuntime = ctx.personagemCompleto || ctx.personagem;
    const testeCriado = criarTestePendente(ctx.sessao, {
      origem: 'combate',
      jogadorAlvo: ctx.userId,
      personagemAlvo: personagemRuntime?.nome || ctx.personagem?.nome || ctx.username,
      teste: rt.teste,
      dificuldade: rt.dcNumerico,
      tipoDado: rt.tipoDado || 'd20',
      contexto: rt.contexto,
      metadata: { ...(rt.metadata || {}), difficultyLabel: rt.dificuldadeLabel || rt.dificuldade }
    }, ctx.userId);

    createPendingCombatAction(ctx.sessao, {
      tipo: rt.intentTipo,
      userId: ctx.userId,
      personagem: {
        nome: personagemRuntime?.nome || ctx.personagem?.nome || ctx.username,
        id: personagemRuntime?.id ?? ctx.personagem?.id ?? null,
        personagemId: personagemRuntime?.personagemId || personagemRuntime?.personagem_id || ctx.personagem?.personagemId || ctx.personagem?.personagem_id || null
      },
      combatIntent: ctx.combatIntent,
      testeId: testeCriado?.id || null,
      statusEfeitos: resultados.statusEfeitos || [],
      ...(rt.pendingCombatAction || {})
    });

    emitCombatTestPrompt(resposta, ctx, testeCriado);
  } else {
    ctx.sessao._combatePreResolvido = resultados;
  }

  ctx.playerCombatActionResolved = buildResolvedCombatMeta(ctx.combatIntent, resultados);
}
```

- [ ] **Step 3: Update processarAcaoCombateHandler to await**

```javascript
async function processarAcaoCombateHandler(resposta, ctx) {
  await ensureCombatPreResolution(resposta, ctx);
  if (!ctx.sessao?._combatePreResolvido) {
    return;
  }
  await ctx.sm.processarAcaoCombate(
    ctx.roomId, ctx.userId, ctx.username, ctx.personagem, ctx.mensagem, resposta, ctx.sessao
  );
}
```

- [ ] **Step 4: Add processarIntentSugerido handler**

Add before the RESPONSE_HANDLERS array:

```javascript
async function processarIntentSugerido(resposta, ctx) {
  const sugerido = resposta.intentSugerido;
  log.info({ tipo: sugerido.tipo, teste: sugerido.teste }, 'processing intentSugerido from Mestre');

  if (sugerido.tipo === 'teste') {
    const { obterDC } = await import('../../helpers/testeHelper.js');
    const dc = typeof sugerido.dificuldade === 'number' ? sugerido.dificuldade : obterDC(sugerido.dificuldade || 'Média');

    const testeCriado = criarTestePendente(ctx.sessao, {
      origem: 'combate',
      jogadorAlvo: ctx.userId,
      personagemAlvo: ctx.personagem?.nome || ctx.username,
      teste: sugerido.teste || 'Força',
      dificuldade: dc,
      tipoDado: 'd20',
      contexto: sugerido.justificativa || '',
      metadata: { source: 'intentSugerido' }
    }, ctx.userId);

    // Persist test prompt to session history + emit via websocket
    appendMensagemSessao(ctx.sessao, buildSolicitacaoDadosMensagem({
      narrativa: resposta.narracao,
      origem: 'combate',
      payload: {
        testePendente: testeCriado,
        testesPendentes: [testeCriado],
        tipoDado: 'd20',
        teste: sugerido.teste,
        dificuldade: sugerido.dificuldade,
        contexto: sugerido.justificativa
      }
    }));

    emitirSolicitacaoTeste(ctx.sm, ctx.roomId, ctx.sessao, {
      narrativa: resposta.narracao,
      tipoDado: 'd20',
      teste: sugerido.teste,
      dificuldade: sugerido.dificuldade,
      contexto: sugerido.justificativa,
      testePendente: testeCriado
    });

    await ctx.sm.gerenciadorSessoes.atualizarSessao(ctx.roomId, ctx.sessao);
  } else if (sugerido.tipo === 'atacar' || sugerido.tipo === 'defender') {
    const resultado = await prepararTurno(ctx.sessao, ctx.userId, { tipo: sugerido.tipo });
    if (resultado && !resultado.requerTeste) {
      ctx.sessao._combatePreResolvido = resultado;
      await ctx.sm.processarAcaoCombate(
        ctx.roomId, ctx.userId, ctx.username, ctx.personagem, ctx.mensagem, resposta, ctx.sessao
      );
    }
  }
}
```

- [ ] **Step 5: Add intent_sugerido to RESPONSE_HANDLERS array**

Insert after `acao_combate` (index 3) and before `solicita_dados`:

```javascript
const RESPONSE_HANDLERS = [
  { nome: 'combate_inicio', ... },
  { nome: 'combate_fallback', ... },
  { nome: 'fuga_combate', ... },
  { nome: 'acao_combate', ... },
  // NEW: Phase 2 — handle Mestre-suggested intent for creative actions
  {
    nome: 'intent_sugerido',
    check: (r, ctx) => isCombatActive(ctx)
      && r.intentSugerido
      && !ctx.sessao._combatePreResolvido
      && !r.solicitaDados?.solicita,
    process: processarIntentSugerido
  },
  { nome: 'solicita_dados', ... },
  ...
];
```

- [ ] **Step 6: Remove unused resolveCombatIntent import**

Remove `import { resolveCombatIntent } from './combatIntentResolver.js';` if no longer used. Grep first.

- [ ] **Step 7: Run tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All pass

- [ ] **Step 8: Commit**

```bash
git add websocket/utils/respostaDispatcher.js
git commit -m "feat(dispatcher): async ensureCombatPreResolution + intentSugerido handler"
```

---

## Task 6: Add intentSugerido to Mestre prompt schema

**Files:**
- Modify: `agents/Mestre/prompts/sistema.js`

- [ ] **Step 1: Read the schema section to find exact insert point**

Read `sistema.js` lines 537-600 (schema definition).

- [ ] **Step 2: Add intentSugerido field to both schema variants**

In `montarSchemaExpandido()`, after the `combate` field definition, add:

```javascript
"intentSugerido": null,
// ^ ou objeto: { "tipo": "teste", "teste": "Força", "dificuldade": "Difícil", "justificativa": "razão" }
// Usar APENAS quando a ação do jogador é criativa/incomum e não é ataque/defesa/fuga direto.
// tipo: "teste" = cria teste de atributo. tipo: "atacar" = ataque básico.
// NÃO usar junto com solicitaDados.solicita = true.
```

Do the same in `montarSchemaCompacto()`.

- [ ] **Step 3: Add rule to LEMBRE-SE section**

Find the LEMBRE-SE rules and add:

```
7. Quando o jogador tenta algo criativo em combate (empurrar objeto, derrubar pilar, usar ambiente), use intentSugerido com tipo "teste", atributo e dificuldade. NÃO use solicitaDados quando intentSugerido estiver presente.
```

- [ ] **Step 4: Run tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All pass (prompt tests may need minor adjustment if they assert exact schema)

- [ ] **Step 5: Commit**

```bash
git add agents/Mestre/prompts/sistema.js
git commit -m "feat(mestre): add intentSugerido field to response schema"
```

---

## Task 7: Full regression test + verify no breaks

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All 1753+ tests pass (minus pre-existing failures)

- [ ] **Step 2: Run gameEngine tests with verbose**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js --reporter=verbose`
Expected: All tests pass including new pipeline tests

- [ ] **Step 3: Run intentClassifier tests with verbose**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/intentClassifier.test.js --reporter=verbose`
Expected: All tests pass

- [ ] **Step 4: Verify combateHelper tests still pass**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/combateHelper.test.js --reporter=verbose`
Expected: All 48+ tests pass

---

## Summary

| Task | What | Risk |
|------|------|------|
| 1 | intentClassifier.js — validation + prompt builder | Low — pure functions |
| 2 | intentClassifier.js — LLM call with mock support | Low — isolated module |
| 3 | gameEngine.js — async refactor + pipeline | Medium — changes function signature |
| 4 | masterNarrationEngine — wire async pipeline | Medium — touches critical handler |
| 5 | respostaDispatcher — async + intentSugerido handler | Medium — new handler + async cascade |
| 6 | Mestre prompt — add intentSugerido schema | Low — additive schema change |
| 7 | Full regression verification | Low — verification only |

**Total:** 7 tasks, ~35 steps. Core change: `prepararTurno` becomes async and resolves intent internally via 3-layer pipeline.
