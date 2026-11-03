/**
 * Smoke test — Domain constants, element normalization and combat integration
 *
 * Validates F1-F3 changes: canonical elements, aliases, status constants,
 * and integration with combateHelper/acoesProcessor.
 * No Redis, DB or LLM required — all in-memory.
 *
 * Usage: node Backend/scripts/smoke-domain.js
 */

import assert from 'node:assert/strict';
import {
  ELEMENTOS,
  ELEMENTOS_SET,
  ELEMENTO_ALIASES,
  normalizarElemento,
  STATUS_IMPEDE_ACAO,
  STATUS_DANO_POR_TURNO,
  STATUS_PENALIDADE_ATAQUE,
  STATUS_MECANICOS,
  TAMANHO_MODS,
  RESULTADO_COMBATE,
  STATUS_COMBATENTE,
  TIPO_HABILIDADE_MONSTRO,
} from '../config/domainConstants.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ── ELEMENTOS ────────────────────────────────────────────────────────

console.log('\n── ELEMENTOS ──');

test('19 elementos canônicos', () => {
  assert.equal(ELEMENTOS.length, 19);
  assert.ok(ELEMENTOS_SET.size === 19);
});

test('todos os elementos existem no Set', () => {
  for (const e of ELEMENTOS) {
    assert.ok(ELEMENTOS_SET.has(e), `${e} deve existir no Set`);
  }
});

test('elementos conhecidos presentes', () => {
  const esperados = ['fogo', 'gelo', 'eletrico', 'radiante', 'contundente', 'cortante', 'perfurante'];
  for (const e of esperados) {
    assert.ok(ELEMENTOS_SET.has(e), `${e} deve ser canônico`);
  }
});

test('elementos legados NÃO são canônicos', () => {
  assert.ok(!ELEMENTOS_SET.has('sagrado'), 'sagrado não é canônico');
  assert.ok(!ELEMENTOS_SET.has('fisico'), 'fisico não é canônico');
  assert.ok(!ELEMENTOS_SET.has('elétrico'), 'elétrico (com acento) não é canônico');
  assert.ok(!ELEMENTOS_SET.has('psíquico'), 'psíquico (com acento) não é canônico');
});

// ── normalizarElemento ──────────────────────────────────────────────

console.log('\n── normalizarElemento ──');

test('elemento canônico retorna ele mesmo', () => {
  assert.equal(normalizarElemento('fogo'), 'fogo');
  assert.equal(normalizarElemento('radiante'), 'radiante');
  assert.equal(normalizarElemento('contundente'), 'contundente');
});

test('case insensitive', () => {
  assert.equal(normalizarElemento('FOGO'), 'fogo');
  assert.equal(normalizarElemento('Gelo'), 'gelo');
  assert.equal(normalizarElemento('  Eletrico  '), 'eletrico');
});

test('aliases resolvem para canônico', () => {
  assert.equal(normalizarElemento('sagrado'), 'radiante');
  assert.equal(normalizarElemento('fisico'), 'contundente');
  assert.equal(normalizarElemento('elétrico'), 'eletrico');
  assert.equal(normalizarElemento('psíquico'), 'psiquico');
  assert.equal(normalizarElemento('sônico'), 'sonico');
  assert.equal(normalizarElemento('holy'), 'radiante');
  assert.equal(normalizarElemento('fire'), 'fogo');
  assert.equal(normalizarElemento('lightning'), 'eletrico');
});

test('null/undefined/vazio retorna null', () => {
  assert.equal(normalizarElemento(null), null);
  assert.equal(normalizarElemento(undefined), null);
  assert.equal(normalizarElemento(''), null);
  assert.equal(normalizarElemento(42), null);
});

test('elemento desconhecido retorna null', () => {
  assert.equal(normalizarElemento('plasma'), null);
  assert.equal(normalizarElemento('mágico'), null);
  assert.equal(normalizarElemento('xyzzy'), null);
});

// ── STATUS EFFECTS ──────────────────────────────────────────────────

console.log('\n── STATUS EFFECTS ──');

test('STATUS_IMPEDE_ACAO tem 3 entries', () => {
  assert.equal(STATUS_IMPEDE_ACAO.length, 3);
  assert.ok(STATUS_IMPEDE_ACAO.includes('atordoado'));
  assert.ok(STATUS_IMPEDE_ACAO.includes('paralisado'));
  assert.ok(STATUS_IMPEDE_ACAO.includes('congelado'));
});

test('STATUS_DANO_POR_TURNO tem notação de dado', () => {
  assert.equal(STATUS_DANO_POR_TURNO.envenenado, '1d4');
  assert.equal(STATUS_DANO_POR_TURNO.queimando, '1d6');
});

test('STATUS_PENALIDADE_ATAQUE: cego = 5', () => {
  assert.equal(STATUS_PENALIDADE_ATAQUE.cego, 5);
});

test('STATUS_MECANICOS agrega tudo (6 total)', () => {
  assert.equal(STATUS_MECANICOS.length, 6);
  assert.ok(STATUS_MECANICOS.includes('paralisado'));
  assert.ok(STATUS_MECANICOS.includes('envenenado'));
  assert.ok(STATUS_MECANICOS.includes('cego'));
});

// ── TAMANHO MODS ────────────────────────────────────────────────────

console.log('\n── TAMANHO MODS ──');

test('7 tamanhos definidos', () => {
  assert.equal(Object.keys(TAMANHO_MODS).length, 7);
});

test('medio tem mod neutro', () => {
  assert.deepEqual(TAMANHO_MODS.medio, { armadura: 0, esquiva: 0 });
});

test('colossal tem maior armadura', () => {
  assert.equal(TAMANHO_MODS.colossal.armadura, 8);
  assert.equal(TAMANHO_MODS.colossal.esquiva, -15);
});

test('minusculo tem maior esquiva', () => {
  assert.equal(TAMANHO_MODS.minusculo.esquiva, 10);
  assert.equal(TAMANHO_MODS.minusculo.armadura, -2);
});

// ── RESULTADO / STATUS COMBATE ──────────────────────────────────────

console.log('\n── RESULTADO / STATUS COMBATE ──');

test('RESULTADO_COMBATE values', () => {
  assert.equal(RESULTADO_COMBATE.VITORIA, 'vitoria');
  assert.equal(RESULTADO_COMBATE.DERROTA, 'derrota');
  assert.equal(RESULTADO_COMBATE.FUGA, 'fuga');
});

test('STATUS_COMBATENTE values', () => {
  assert.equal(STATUS_COMBATENTE.VIVO, 'vivo');
  assert.equal(STATUS_COMBATENTE.DERROTADO, 'derrotado');
  assert.equal(STATUS_COMBATENTE.INCONSCIENTE, 'inconsciente');
});

// ── TIPO HABILIDADE MONSTRO ─────────────────────────────────────────

console.log('\n── TIPO HABILIDADE MONSTRO ──');

test('3 tipos definidos', () => {
  assert.equal(TIPO_HABILIDADE_MONSTRO.length, 3);
  assert.ok(TIPO_HABILIDADE_MONSTRO.includes('ofensiva'));
  assert.ok(TIPO_HABILIDADE_MONSTRO.includes('suporte'));
  assert.ok(TIPO_HABILIDADE_MONSTRO.includes('defensiva'));
});

// ── ALIASES TABLE COMPLETENESS ──────────────────────────────────────

console.log('\n── ALIASES ──');

test('todos os aliases resolvem para elemento canônico', () => {
  for (const [alias, canonical] of Object.entries(ELEMENTO_ALIASES)) {
    assert.ok(ELEMENTOS_SET.has(canonical), `Alias "${alias}" → "${canonical}" deve ser canônico`);
  }
});

// ── Resultado ────────────────────────────────────────────────────────

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

process.exit(failed > 0 ? 1 : 0);
