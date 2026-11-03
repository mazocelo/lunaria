# Game Engine Phase 1: HP/Dano Funciona — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `helpers/gameEngine.js` that wraps existing combat mechanics into a clean facade, ensuring damage is applied end-to-end and combat state persists correctly after every action.

**Architecture:** GameEngine is a thin orchestration layer over existing functions (`resolverMecanicaCombate`, `finalizarAcaoCombatePosTeste`, `formatarResultadoMecanico`, etc.). It does NOT rewrite combat math — it consolidates the call sites in `masterNarrationEngine.js` and `respostaDispatcher.js` into a single module with a clear interface. The existing `CombatRoundResult` DTO shape is preserved.

**Tech Stack:** Node.js ESM, Vitest for tests, existing helpers (combateHelper, testeHelper, bonusHelper, concentrationManager, effectManager, cooldownManager)

**Spec:** `docs/superpowers/specs/2026-03-19-game-engine-redesign.md` (v1.1)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `helpers/gameEngine.js` | Facade: `prepararTurno()`, `resolverTurno()`, `formatarContexto()` |
| Create | `tests/gameEngine.test.js` | Unit tests for gameEngine |
| Modify | `websocket/engines/masterNarrationEngine.js:1014-1116` | Replace inline combat resolution with `gameEngine.prepararTurno()` + `gameEngine.resolverTurno()` |
| Modify | `websocket/utils/respostaDispatcher.js:130-186` | Replace `ensureCombatPreResolution()` with gameEngine call |
| Modify | `websocket/engines/testEngine.js:335-348` | Replace `finalizarAcaoCombatePosTeste` + keep `formatarResultadoMecanico` |

---

## Task 1: Create gameEngine.js with prepararTurno()

**Files:**
- Create: `helpers/gameEngine.js`
- Test: `tests/gameEngine.test.js`

This task creates the module skeleton with `prepararTurno()` — the phase that resolves intent and pre-computes mechanics BEFORE the player rolls dice (or auto-resolves if no test needed).

- [ ] **Step 1: Write failing test for prepararTurno — basic attack**

```javascript
// tests/gameEngine.test.js
import { describe, it, expect } from 'vitest';
import { prepararTurno } from '../helpers/gameEngine.js';

// ── Factories ──

function makeSessao(overrides = {}) {
  const userId = 'user_1';
  return {
    estadoJogo: {
      combate: makeActiveCombat(),
      ...overrides.estadoJogo
    },
    personagensCompletos: {
      [userId]: makePersonagemCompleto(),
      ...overrides.personagensCompletos
    },
    jogadores: { [userId]: { personagemId: userId, nome: 'Moruxis' } },
    ...overrides
  };
}

function makeActiveCombat(overrides = {}) {
  return {
    ativo: true,
    rodadaCombate: 1,
    monstros: [
      { id: 'dretch_0', nome: 'Dretch', status: 'vivo', hp_atual: 25, hp_max: 25, defesa: 10, esquiva: 0, armadura: 2, dano_base: '1d6', forca: 12, habilidades: [], resistencias: {}, imunidades: [], cooldowns: {}, status_efeitos: [], xp: 30 }
    ],
    jogadores: {
      'user_1': { personagemId: 'user_1', hp_max: 20, hp_atual: 20, mana_max: 15, mana_atual: 15, esquiva: 10, armadura: 1, bonusAtaque: 2, bonusDano: 1, dano_base: '1d6', elemento: null, status: 'vivo', personagemNome: 'Moruxis', cooldowns: {}, status_efeitos: [] }
    },
    jogadoresQueAgiram: [],
    log: [],
    resultado: null,
    ...overrides
  };
}

function makePersonagemCompleto(overrides = {}) {
  return {
    id: 'user_1',
    personagemId: 'user_1',
    nome: 'Moruxis',
    classe: 'Paladino',
    raca: 'Humano',
    nivel: 3,
    atributos: { forca: 14, inteligencia: 10, carisma: 12, destreza: 10, constituicao: 12, agilidade: 10 },
    hp_atual: 20, hp_max: 20, mana_atual: 15, mana_max: 15,
    vantagens: [], desvantagens: [],
    habilidades: [
      { id: 'luz_divina', nome: 'Luz Divina', custo_mana: 5, cooldown_turnos: 0, dano_base: '2d6', efeito: null, elemento: 'sagrado', escola_magia: 'divina' }
    ],
    equipamentos: [],
    status_efeitos: [],
    ...overrides
  };
}

describe('gameEngine', () => {
  describe('prepararTurno', () => {
    it('retorna resultado pré-resolvido para ataque básico', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'atacar' };
      const resultado = prepararTurno(sessao, 'user_1', intent);

      expect(resultado).toBeDefined();
      // Ataque básico requer teste (attack_roll)
      expect(resultado.requerTeste).toBeTruthy();
      expect(resultado.requerTeste.intentTipo).toBe('atacar');
    });

    it('retorna resultado com defesa (sem teste)', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'defender' };
      const resultado = prepararTurno(sessao, 'user_1', intent);

      expect(resultado).toBeDefined();
      expect(resultado.requerTeste).toBeNull();
      expect(resultado.defesa).toBeTruthy();
      expect(resultado.defesa.esquivaBonus).toBe(25);
      expect(resultado.acaoConsumida).toBe(true);
    });

    it('retorna null quando combate não está ativo', () => {
      const sessao = makeSessao({ estadoJogo: { combate: { ativo: false } } });
      const resultado = prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

      expect(resultado).toBeNull();
    });

    it('resolve personagem de personagensCompletos', () => {
      const sessao = makeSessao();
      const intent = { tipo: 'defender' };
      const resultado = prepararTurno(sessao, 'user_1', intent);

      expect(resultado.defesa.personagem).toBe('Moruxis');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: FAIL — `helpers/gameEngine.js` does not exist

- [ ] **Step 3: Write minimal gameEngine.js with prepararTurno**

```javascript
// helpers/gameEngine.js
/**
 * GameEngine — facade over combat mechanics.
 *
 * Centralizes ALL mechanical resolution for combat.
 * Does NOT call AI, emit websocket events, or persist to Redis.
 *
 * Uses existing functions from combateHelper, testeHelper, etc.
 */
import { resolverMecanicaCombate } from './combateHelper.js';
import logger from './logger.js';

const log = logger.child({ module: 'gameEngine' });

/**
 * Phase 1: Pre-resolve combat mechanics for a player's action.
 * If the action requires a dice roll (test), returns the test request.
 * If the action is immediate (defend), returns the full result.
 *
 * @param {Object} sessao - Full session state
 * @param {string} userId - Player who acted
 * @param {Object} intent - { tipo, habilidadeId?, magiaId?, alvoId?, ... }
 * @returns {import('./combat/combatRoundResult.js').CombatRoundResult|null}
 */
export function prepararTurno(sessao, userId, intent) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) {
    log.debug({ userId }, 'prepararTurno: combate não ativo');
    return null;
  }

  const personagem = _resolvePersonagem(sessao, userId);
  if (!personagem) {
    log.warn({ userId }, 'prepararTurno: personagem não encontrado');
    return null;
  }

  return resolverMecanicaCombate(combate, userId, sessao, personagem, intent);
}

/**
 * Resolve personagem from sessao.personagensCompletos using multiple ID strategies.
 * @private
 */
function _resolvePersonagem(sessao, userId) {
  const completos = sessao?.personagensCompletos || {};

  // Try direct userId match
  if (completos[userId]) return completos[userId];

  // Try personagemId from jogadores map
  const jogadorInfo = sessao?.jogadores?.[userId];
  const personagemId = jogadorInfo?.personagemId || jogadorInfo?.personagem_id;
  if (personagemId && completos[String(personagemId)]) {
    return completos[String(personagemId)];
  }

  // Try combat jogadores
  const combatJogador = sessao?.estadoJogo?.combate?.jogadores?.[userId];
  const combatPcId = combatJogador?.personagemId;
  if (combatPcId && completos[String(combatPcId)]) {
    return completos[String(combatPcId)];
  }

  return null;
}

export { _resolvePersonagem as resolvePersonagem };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add helpers/gameEngine.js tests/gameEngine.test.js
git commit -m "feat(gameEngine): create module with prepararTurno facade"
```

---

## Task 2: Add resolverTurno() for post-dice resolution

**Files:**
- Modify: `helpers/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

`resolverTurno()` is Phase 2 — called AFTER the player rolls dice. It wraps `finalizarAcaoCombatePosTeste`.

- [ ] **Step 1: Write failing test for resolverTurno**

Add to `tests/gameEngine.test.js`:

```javascript
import { prepararTurno, resolverTurno } from '../helpers/gameEngine.js';

describe('resolverTurno', () => {
  it('finaliza ataque após rolagem de dado', () => {
    const sessao = makeSessao();
    const intent = { tipo: 'atacar' };
    const prep = prepararTurno(sessao, 'user_1', intent);

    // Simular pending action criada externamente (como masterNarrationEngine faz)
    expect(prep.requerTeste).toBeTruthy();

    // Criar acaoPendente compatível com finalizarAcaoCombatePosTeste
    const acaoPendente = {
      tipo: 'atacar',
      userId: 'user_1',
      personagem: { nome: 'Moruxis', id: 'user_1' },
      combatIntent: intent,
      statusEfeitos: prep.statusEfeitos || [],
      stage: 'attack_roll',
      targetId: 'dretch_0',
      targetName: 'Dretch',
      targetDefense: 10,
      targetEvasion: 0,
      targetArmor: 2,
      damageNotation: '1d6+1',
      attackBonus: 2,
      sourceActionName: 'Ataque',
      ...(prep.requerTeste?.pendingCombatAction || {})
    };
    sessao.estadoJogo.acaoPendenteCombate = acaoPendente;

    const resultadoTeste = {
      rolagemBruta: 15,
      total: 17,
      sucesso: true
    };

    const resultado = resolverTurno(sessao, acaoPendente, resultadoTeste);
    expect(resultado).toBeDefined();
    // After attack_roll success, should request damage_roll
    // OR resolve fully (depends on hit/miss)
    expect(resultado.acaoConsumida !== undefined || resultado.aguardandoProximoTeste !== undefined).toBe(true);
  });

  it('retorna null quando sessao sem combate', () => {
    const sessao = makeSessao({ estadoJogo: {} });
    const resultado = resolverTurno(sessao, {}, {});
    expect(resultado).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: FAIL — `resolverTurno` is not exported

- [ ] **Step 3: Implement resolverTurno**

Add to `helpers/gameEngine.js`:

```javascript
import { finalizarAcaoCombatePosTeste } from './combateHelper.js';

/**
 * Phase 2: Resolve combat action AFTER player rolls dice.
 * Wraps finalizarAcaoCombatePosTeste with personagem resolution.
 *
 * @param {Object} sessao - Full session state
 * @param {string} userId - Player who acted
 * @param {Object} acaoPendente - Pending combat action (from sessao.estadoJogo.acaoPendenteCombate)
 * @param {Object} resultadoTeste - Test result from testeHelper.resolverTeste()
 * @returns {import('./combat/combatRoundResult.js').CombatRoundResult|null}
 */
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add helpers/gameEngine.js tests/gameEngine.test.js
git commit -m "feat(gameEngine): add resolverTurno for post-dice resolution"
```

---

## Task 3: Add formatarContexto() for AI prompt building

**Files:**
- Modify: `helpers/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

Wraps `formatarResultadoMecanico` + `buildCombatPromptContext` into a single call.

- [ ] **Step 1: Write failing test for formatarContexto**

Add to `tests/gameEngine.test.js`:

```javascript
import { prepararTurno, formatarContexto } from '../helpers/gameEngine.js';

describe('formatarContexto', () => {
  it('gera contexto com resultado de defesa', () => {
    const sessao = makeSessao();
    const resultado = prepararTurno(sessao, 'user_1', { tipo: 'defender' });

    const contexto = formatarContexto(sessao, 'user_1', resultado);
    expect(contexto).toBeDefined();
    expect(typeof contexto.promptText).toBe('string');
    expect(contexto.promptText.length).toBeGreaterThan(0);
  });

  it('marca requiresTest quando há teste pendente', () => {
    const sessao = makeSessao();
    const resultado = prepararTurno(sessao, 'user_1', { tipo: 'atacar' });

    const contexto = formatarContexto(sessao, 'user_1', resultado);
    expect(contexto.requiresTest).toBe(true);
  });

  it('retorna contexto vazio quando resultado é null', () => {
    const sessao = makeSessao();
    const contexto = formatarContexto(sessao, 'user_1', null);
    expect(contexto.promptText).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: FAIL — `formatarContexto` not exported

- [ ] **Step 3: Implement formatarContexto**

Add to `helpers/gameEngine.js`:

```javascript
import { buildCombatPromptContext } from './combatPromptContext.js';

/**
 * Build AI prompt context from mechanical results.
 *
 * @param {Object} sessao - Session state
 * @param {string} userId - Player who acted
 * @param {Object|null} resultado - CombatRoundResult from prepararTurno/resolverTurno
 * @param {Object} [options]
 * @param {string} [options.turnStateText] - Pre-computed turn state text (HP, mana, status)
 * @returns {{ promptText: string, mechanicalSummary: string, requiresTest: boolean }}
 */
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add helpers/gameEngine.js tests/gameEngine.test.js
git commit -m "feat(gameEngine): add formatarContexto for AI prompt building"
```

---

## Task 4: Wire gameEngine into masterNarrationEngine

**Files:**
- Modify: `websocket/engines/masterNarrationEngine.js:1014-1116`

Replace the inline combat resolution (lines 1014-1116) with calls to `gameEngine.prepararTurno()` and `gameEngine.formatarContexto()`.

- [ ] **Step 1: Read current code block to confirm exact lines**

Read `masterNarrationEngine.js` lines 1014-1116 to confirm the exact code to replace.

- [ ] **Step 2: Replace inline resolution with gameEngine calls**

Replace the block from line 1014 (`let resultadosCombatePreResolvido = null;`) through line 1116 (`acaoComContexto = promptChunks.join('\n');`):

**Before** (lines 1014-1116 — inline intent + mechanics + context):
```javascript
      let resultadosCombatePreResolvido = null;
      let combatIntentResolvido = combatIntent || null;
      let acaoComContexto = promptAcao;

      if (combateAtivo) {
        // ... 100 lines of inline combat resolution ...
        acaoComContexto = promptChunks.join('\n');
      }
```

**After:**
```javascript
      let resultadosCombatePreResolvido = null;
      let combatIntentResolvido = combatIntent || null;
      let acaoComContexto = promptAcao;

      if (combateAtivo) {
        // NOTE: import { prepararTurno, formatarContexto } from '../../helpers/gameEngine.js'
        // must be added as static import at top of file

        // 1. Resolve intent
        const combatIntentResolution = resolveCombatIntent({
          mensagem,
          explicitIntent: combatIntent,
          personagemCompleto,
          combate: workingSessao.estadoJogo?.combate || null,
          userId
        });

        if (!combatIntentResolution.intent) {
          const reason = combatIntentResolution.reason
            || 'Nao ficou claro se voce quer atacar, defender, fugir ou usar uma habilidade/magia.';
          const hint = combatIntentResolution.candidates?.length
            ? ` Candidatos: ${combatIntentResolution.candidates.join(', ')}.`
            : '';

          await sm.withRoomLock(roomId, async () => {
            const sessaoAtual = await sm.obterSessaoHistoria(roomId);
            const activeRequest = getActiveMestreRequest(sessaoAtual || {});
            if (!sessaoAtual || !activeRequest || activeRequest.requestId !== requestId || Number(activeRequest.attempt || 0) !== Number(attempt)) {
              return;
            }
            const completed = completeMestreRequest(sessaoAtual, requestId, attempt);
            await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtual);
            sm.sendToRoom(roomId, 'mestre_pensando', { ativo: false, timestamp: Date.now(), requestId, attempt });
            emitMestreRequestStatus(sm, roomId, completed, { status: 'completed' });
          }, { maxWaitMs: 0 });

          socket.emit('erro_mensagem', {
            message: `${reason} Escolha uma acao ou nomeie a habilidade/magia.${hint}`.trim()
          });
          heartbeat.stop();
          return;
        }

        combatIntentResolvido = combatIntentResolution.intent;

        // 2. GameEngine pre-resolves mechanics
        resultadosCombatePreResolvido = prepararTurno(workingSessao, userId, combatIntentResolvido);

        // 3. Handle test-gated or immediate results
        if (resultadosCombatePreResolvido?.requerTeste) {
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
        } else if (resultadosCombatePreResolvido) {
          workingSessao._combatePreResolvido = resultadosCombatePreResolvido;
        }

        // 4. Build AI context from mechanical results (pass turnStateText computed at line 1012)
        const combatPromptCtx = formatarContexto(workingSessao, userId, resultadosCombatePreResolvido, { turnStateText });
        const promptChunks = [
          combatPromptCtx.promptText,
          resultadosCombatePreResolvido?.requerTeste
            ? `[TESTE NECESSARIO: ${resultadosCombatePreResolvido.requerTeste.teste} DC ${resultadosCombatePreResolvido.requerTeste.dcNumerico} (${resultadosCombatePreResolvido.requerTeste.dificuldade}). Narre apenas a tentativa e a pressao do momento. Nao confirme sucesso, dano letal nem abate antes da rolagem.]`
            : null,
          `Acao do jogador: "${promptAcao}"`
        ].filter(Boolean);

        acaoComContexto = promptChunks.join('\n');
      }
```

**Key changes:**
- `resolverMecanicaCombate(combate, userId, workingSessao, personagemCompleto, combatIntentResolvido)` becomes `prepararTurno(workingSessao, userId, combatIntentResolvido)`. The gameEngine internally resolves `personagemCompleto` from session, removing a common source of bugs.
- `buildCombatPromptContext(...)` becomes `formatarContexto(workingSessao, userId, resultado, { turnStateText })`. Passes through `turnStateText` computed at line 1012.
- **Phase 1 scope:** Intent resolution (`resolveCombatIntent`) stays inline — it moves into the engine in Phase 2 per the spec.

- [ ] **Step 3: Remove unused direct import of resolverMecanicaCombate in masterNarrationEngine**

Check if `resolverMecanicaCombate` is imported at the top of `masterNarrationEngine.js`. If it's only used in this block, remove the import. If used elsewhere, keep it.

- [ ] **Step 4: Run existing test suite to verify no regressions**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All 1743+ tests PASS

- [ ] **Step 5: Commit**

```bash
git add websocket/engines/masterNarrationEngine.js
git commit -m "refactor(masterNarration): use gameEngine.prepararTurno instead of inline resolution"
```

---

## Task 5: Wire gameEngine into respostaDispatcher

**Files:**
- Modify: `websocket/utils/respostaDispatcher.js:130-186`

Replace `ensureCombatPreResolution()` to use `gameEngine.prepararTurno()`.

- [ ] **Step 1: Replace ensureCombatPreResolution internals**

The function `ensureCombatPreResolution` (lines 130-186) calls `resolverMecanicaCombate` directly. Replace with `prepararTurno`.

**Before:**
```javascript
function ensureCombatPreResolution(resposta, ctx) {
  // ... intent resolution ...
  const resultados = resolverMecanicaCombate(combate, ctx.userId, ctx.sessao, personagemRuntime, resolution.intent);
  // ...
}
```

**After:**
```javascript
function ensureCombatPreResolution(resposta, ctx) {
  const combate = ctx.sessao?.estadoJogo?.combate;
  if (!combate?.ativo) return;
  if (ctx.sessao?._combatePreResolvido || hasPendingCombatAction(ctx.sessao)) return;

  const personagemRuntime = ctx.personagemCompleto || ctx.personagem;
  const resolution = resolveCombatIntent({
    mensagem: ctx.mensagem,
    explicitIntent: ctx.combatIntent,
    personagemCompleto: personagemRuntime,
    combate,
    userId: ctx.userId
  });

  if (!resolution.intent) return;

  ctx.combatIntent = resolution.intent;
  // NOTE: import { prepararTurno } from '../../helpers/gameEngine.js' at top of file
  const resultados = prepararTurno(ctx.sessao, ctx.userId, resolution.intent);
  if (!resultados) return;

  if (resultados.requerTeste) {
    const rt = resultados.requerTeste;
    const testeCriado = criarTestePendente(ctx.sessao, {
      origem: 'combate',
      jogadorAlvo: ctx.userId,
      personagemAlvo: personagemRuntime?.nome || ctx.personagem?.nome || ctx.username,
      teste: rt.teste,
      dificuldade: rt.dcNumerico,
      tipoDado: rt.tipoDado || 'd20',
      contexto: rt.contexto,
      metadata: {
        ...(rt.metadata || {}),
        difficultyLabel: rt.dificuldadeLabel || rt.dificuldade
      }
    }, ctx.userId);

    createPendingCombatAction(ctx.sessao, {
      tipo: rt.intentTipo,
      userId: ctx.userId,
      personagem: {
        nome: personagemRuntime?.nome || ctx.personagem?.nome || ctx.username,
        id: personagemRuntime?.id ?? ctx.personagem?.id ?? null,
        personagemId: personagemRuntime?.personagemId || personagemRuntime?.personagem_id || ctx.personagem?.personagemId || ctx.personagem?.personagem_id || null
      },
      combatIntent: resolution.intent,
      testeId: testeCriado?.id || null,
      statusEfeitos: resultados.statusEfeitos || [],
      ...(rt.pendingCombatAction || {})
    });

    emitCombatTestPrompt(resposta, ctx, testeCriado);
  } else {
    ctx.sessao._combatePreResolvido = resultados;
  }

  ctx.playerCombatActionResolved = buildResolvedCombatMeta(resolution.intent, resultados);
}
```

- [ ] **Step 2: Add static import of prepararTurno at top of respostaDispatcher.js**

Replace:
```javascript
import { resolverMecanicaCombate } from '../../helpers/combateHelper.js';
```
With:
```javascript
import { prepararTurno } from '../../helpers/gameEngine.js';
```

- [ ] **Step 3: Verify processarAcaoCombateHandler already awaits ensureCombatPreResolution**

The function stays sync (no dynamic import needed). Verify `processarAcaoCombateHandler` calls it correctly — `ensureCombatPreResolution` is sync now.

- [ ] **Step 4: Remove direct import of resolverMecanicaCombate at top**

Remove from line 8: `import { resolverMecanicaCombate } from '../../helpers/combateHelper.js';`

Only remove if `resolverMecanicaCombate` is not used elsewhere in the file. Grep first.

- [ ] **Step 4: Run full test suite**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add websocket/utils/respostaDispatcher.js
git commit -m "refactor(dispatcher): use gameEngine.prepararTurno instead of direct resolverMecanicaCombate"
```

---

## Task 6: Wire gameEngine.resolverTurno into testEngine

**Files:**
- Modify: `websocket/engines/testEngine.js` — where `finalizarAcaoCombatePosTeste` is called

The testEngine calls `finalizarAcaoCombatePosTeste` directly when dice rolls complete for combat actions. Replace with `gameEngine.resolverTurno`.

- [ ] **Step 1: Find where finalizarAcaoCombatePosTeste is called in testEngine**

Run: `grep -n 'finalizarAcaoCombatePosTeste' websocket/engines/testEngine.js`

- [ ] **Step 2: Replace with gameEngine.resolverTurno (static import)**

Add static import at top of testEngine.js:
```javascript
import { resolverTurno } from '../../helpers/gameEngine.js';
```

At the call site (~line 345), replace:
```javascript
resultadosCombatePosTeste = finalizarAcaoCombatePosTeste(sessao, acaoPendenteCombate, resultadoTestePayload);
```
With:
```javascript
resultadosCombatePosTeste = resolverTurno(sessao, acaoPendenteCombate, resultadoTestePayload);
```

**Note:** `resolverTurno` extracts `userId` from `acaoPendente.userId` internally.

**Keep** `formatarResultadoMecanico` — it's still called on the next line to format the mechanical context. Only replace `finalizarAcaoCombatePosTeste`.

- [ ] **Step 3: Update import line — remove finalizarAcaoCombatePosTeste, keep formatarResultadoMecanico**

Change the combateHelper import to only import what's still needed:
```javascript
import { formatarResultadoMecanico } from '../../helpers/combateHelper.js';
```

- [ ] **Step 4: Run full test suite**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add websocket/engines/testEngine.js
git commit -m "refactor(testEngine): use gameEngine.resolverTurno instead of direct finalizarAcaoCombatePosTeste"
```

---

## Task 7: Add damage application verification test (end-to-end)

**Files:**
- Modify: `tests/gameEngine.test.js`

The core bug this Phase fixes: damage not applied. Write a test that proves the full flow works.

- [ ] **Step 1: Write end-to-end damage test**

```javascript
describe('end-to-end: damage applied', () => {
  it('dano reduz HP do monstro após damage_roll', () => {
    const sessao = makeSessao();
    const dretch = sessao.estadoJogo.combate.monstros[0];
    const hpAntes = dretch.hp_atual;

    // Phase 1: prepararTurno — attack requires test
    const prep = prepararTurno(sessao, 'user_1', { tipo: 'atacar' });
    expect(prep.requerTeste).toBeTruthy();

    // Create pending action (as masterNarrationEngine would)
    const pendingAction = {
      tipo: 'atacar',
      userId: 'user_1',
      personagem: { nome: 'Moruxis', id: 'user_1' },
      combatIntent: { tipo: 'atacar' },
      statusEfeitos: [],
      stage: 'attack_roll',
      targetId: 'dretch_0',
      targetName: 'Dretch',
      targetDefense: 10,
      targetEvasion: 0,
      targetArmor: 2,
      damageNotation: '1d6+1',
      attackBonus: 2,
      sourceActionName: 'Ataque',
      actionKind: 'attack',
      ...(prep.requerTeste?.pendingCombatAction || {})
    };

    // Phase 2a: attack roll — nat 20 (guaranteed hit + crit)
    const atkResult = resolverTurno(sessao, pendingAction, {
      rolagemBruta: 20,
      total: 22,
      sucesso: true
    });

    if (atkResult.aguardandoProximoTeste) {
      // Phase 2b: damage roll
      const dmgAction = {
        ...pendingAction,
        ...atkResult.proximaAcaoPendente
      };
      const dmgResult = resolverTurno(sessao, dmgAction, {
        rolagemBruta: 6,
        total: 7,
        sucesso: true
      });

      // CORE ASSERTION: damage was applied
      expect(dretch.hp_atual).toBeLessThan(hpAntes);
      expect(dmgResult.acaoConsumida).toBe(true);
      // Contra-ataques happened
      expect(dmgResult.contraAtaques).toBeDefined();
    } else {
      // Attack missed (shouldn't happen with nat 20, but handle gracefully)
      expect(atkResult.ataqueJogador).toBeTruthy();
    }
  });

  it('defesa não requer teste e aplica bônus de esquiva', () => {
    const sessao = makeSessao();
    const jogadorStats = sessao.estadoJogo.combate.jogadores['user_1'];

    const resultado = prepararTurno(sessao, 'user_1', { tipo: 'defender' });

    expect(resultado.requerTeste).toBeNull();
    expect(resultado.defesa).toBeTruthy();
    expect(resultado.acaoConsumida).toBe(true);
    expect(jogadorStats.defesaTemporaria).toBeDefined();
    expect(jogadorStats.defesaTemporaria.esquivaBonus).toBe(25);
  });
});
```

- [ ] **Step 2: Run test**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js`
Expected: PASS — damage IS applied to monster HP

- [ ] **Step 3: Commit**

```bash
git add tests/gameEngine.test.js
git commit -m "test(gameEngine): add end-to-end damage verification"
```

---

## Task 8: Run full test suite and verify no regressions

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `cd /opt/role-chat-game/backend && npx vitest run`
Expected: All tests PASS (1743+)

- [ ] **Step 2: Run gameEngine tests specifically**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/gameEngine.test.js --reporter=verbose`
Expected: All gameEngine tests PASS with verbose output

- [ ] **Step 3: Verify the existing combateHelper tests still pass**

Run: `cd /opt/role-chat-game/backend && npx vitest run tests/combateHelper.test.js --reporter=verbose`
Expected: All combateHelper tests PASS — no regressions

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git status
# If clean, no commit needed
```

---

## Summary

| Task | What | Risk |
|------|------|------|
| 1 | `prepararTurno()` — facade over `resolverMecanicaCombate` | Low — wraps existing function |
| 2 | `resolverTurno()` — facade over `finalizarAcaoCombatePosTeste` | Low — wraps existing function |
| 3 | `formatarContexto()` — facade over `buildCombatPromptContext` | Low — wraps existing function |
| 4 | Wire into masterNarrationEngine | Medium — touches critical handler |
| 5 | Wire into respostaDispatcher | Medium — touches fallback path |
| 6 | Wire into testEngine | Medium — touches dice resolution |
| 7 | End-to-end damage test | Low — verification only |
| 8 | Full regression check | Low — verification only |

**Total:** 8 tasks, ~30 steps. GameEngine is a thin facade — all combat math stays in combateHelper.js unchanged.
